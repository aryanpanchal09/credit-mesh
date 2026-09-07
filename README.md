# CreditMesh — Multi-Tenant Real-Time Loan Syndication & Disbursement Platform

CreditMesh is a multi-tenant, real-time loan syndication and disbursement platform where multiple lending partner tenants pool capital to co-lend single loan facilities. Investors and partner administrators receive live visibility into funding progress, repayments, risk exposure, and EMI amortization schedules.

---

## Technical Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Sequelize ORM, Socket.io, JWT (RBAC), `node-cron`, `pdf-lib`, `nodemailer`, `bcryptjs`, `jest`, `supertest`.
- **Frontend**: React.js (Vite), JavaScript, Redux Toolkit, React Router, Tailwind CSS, Lucide Icons, Socket.io Client.

---

## Key Functional & Architectural Modules

### 1. Multi-Tenant Core & JWT-Based RBAC
- **Tenant Data Isolation**: Row-level tenant isolation enforced via `tenant_id` context.
- **Roles & Permissions**: `SuperAdmin`, `PartnerAdmin`, `RiskAnalyst`, `Borrower`, and `Investor`.
- **JWT Authentication**: Tokens contain `id`, `email`, `role_name`, `tenant_id`, and `tenant_code`.

### 2. Concurrency-Safe Loan Syndication Engine
- **Race-Condition Protection**: Funding commitments execute within PostgreSQL transactions utilizing **Row Locking** (`SELECT ... FOR UPDATE` via `transaction.LOCK.UPDATE` in Sequelize).
- **Over-Funding Prevention**: Ensures no partner can commit more capital than the remaining unfunded balance.
- **Server-Side Amortization Schedule Calculation**: When a loan reaches 100% funding, the backend automatically computes monthly EMI, principal split, and interest split using standard financial formulas:
  $$EMI = P \times r \times \frac{(1+r)^n}{(1+r)^n - 1}$$

### 3. Real-Time Layer (Socket.io)
- **Zero-Polling Updates**: Connected clients join loan-specific rooms (`loan_${id}`) and receive instant websocket event broadcasts (`funding_updated`, `loan_fully_funded`, `repayment_processed`, `risk_alert`).
- **Graceful Reconnection**: Client automatically resyncs state on socket reconnect.

### 4. Proportional Repayments & Immutable Audit Ledger
- **Proportional Repayment Split**: Borrower EMI repayments are automatically split across funding partners based on their contribution ratio.
  $$\text{partner\_share} = \text{installment\_amount} \times \left(\frac{\text{commitment.amount}}{\text{total\_loan\_funded}}\right)$$
- **Auditable Ledger**: Each distribution creates an immutable record in `RepaymentLedger`.

### 5. Automated Overdue Risk Monitoring
- **`node-cron` Job**: Periodically scans for unpaid installments overdue by >3 days.
- **`AT_RISK` Flagging**: Automatically flags loans as `AT_RISK` and simulates sending email notifications via `nodemailer`.
- **Server-Side Paginated Risk Dashboard**: Risk Analysts can filter, sort, search, and page through risk data with fast server-side dataset execution.

### 6. Document Generation & Storage
- **PDF Generation**: Server-side rendering using `pdf-lib` for **Loan Sanction Letters** and **Repayment Statements**.
- **Mocked S3 Storage**: Saved locally in `/public/documents/` and exposed via secure download APIs.

---

## How to Run Locally

### Prerequisites
- **Node.js**: v18+
- **PostgreSQL**: Running on `localhost:5432` with database user `postgres`.

### 1. Backend Setup
```bash
cd Backend
npm install
```

Ensure `.env` contains valid PostgreSQL credentials:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=credit_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=creditmesh_secret_key_12345
```

### 2. Database Creation & Seed Script
Run the automated database creation and seed script to populate initial roles, tenants, users, and loans:
```bash
npm run db:create
npm run db:seed
```

### 3. Start Backend API Server
```bash
npm run dev
# Server running on http://localhost:5000
```

### 4. Start Frontend Client
In a new terminal:
```bash
cd Frontend
npm install
npm run dev
# Vite client running on http://localhost:3000
```

---

## Seeded Quick-Login Demo Accounts

| Role | Email | Password | Scope / Tenant |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | `admin@creditmesh.com` | `Password123` | Global (All Tenants) |
| **PartnerAdmin (Apex)** | `admin@apexcapital.com` | `Password123` | Apex Capital Partners |
| **PartnerAdmin (Beacon)** | `admin@beaconlending.com` | `Password123` | Beacon Lending Ltd |
| **RiskAnalyst** | `risk@creditmesh.com` | `Password123` | Risk & Portfolio Inspector |
| **Investor (Apex)** | `investor_a@apexcapital.com` | `Password123` | Apex Investor |
| **Investor (Beacon)** | `investor_b@beaconlending.com` | `Password123` | Beacon Investor |
| **Borrower** | `borrower1@gmail.com` | `Password123` | Loan Applicant |

---

## Running Backend Test Suite (Jest / Supertest)

Run the 8+ automated unit & concurrency integration tests:
```bash
cd Backend
npm test
```

The test suite validates:
1. Rejection of unauthenticated requests.
2. RBAC enforcement (Borrower role forbidden from committing capital).
3. Negative and zero amount commitment rejection.
4. Over-funding prevention beyond remaining required balance.
5. Server-side amortization calculation accuracy.
6. Successful capital commitment execution.
7. **Concurrency Race Condition Safety**: Parallel `Promise.all` requests test `SELECT ... FOR UPDATE` row locking.
8. Risk monitoring overdue check execution.

---

## What We Protected vs What We Cut

### What We Protected
- **Financial Correctness & Concurrency Safety**: Used explicit database transactions and row-level locks (`SELECT ... FOR UPDATE`) to prevent race conditions during co-lending commitments.
- **Tenant Isolation**: Row-level filtering enforcing data privacy between competing lending partner tenants.
- **Audit Integrity**: Created an immutable `RepaymentLedger` log for every repayment distribution.
- **Performance**: Implemented server-side pagination and filtering for large datasets (50k+ rows assumption).

### What We Cut (Conscious Scope Choices)
- **Payment Gateway**: Mocked real-world banking API rails.
- **AWS S3 Deployment**: Used local mocked S3 storage (`/public/documents/`) instead of cloud S3 credentials for simple local execution.
- **Pixel-Perfect Styling**: Focused on clean, responsive, dark-mode Tailwind UI rather than spending hours tweaking micro-padding.

---

## Live Code Walkthrough Q&A (Monday Review)

### Q1: *"What happens if a partner tries to withdraw a commitment after partial disbursement?"*
**Answer**: In financial loan syndication, commitments become legally binding once the loan is disbursed. If a withdrawal request occurs prior to disbursement, the system should issue an offsetting negative commitment record inside a transaction, adjust `funded_amount`, revert loan status from `FULLY_FUNDED` back to `FUNDING`, and void any un-disbursed amortization schedule. If post-disbursement, withdrawal is disallowed; the partner must sell their loan participation share on a secondary marketplace.

### Q2: *"How would this scale to 10,000 concurrent investors on one loan?"*
**Answer**:
1. **DB Bottleneck Mitigation**: Direct `SELECT ... FOR UPDATE` on a single database row under 10,000 concurrent connections would hit row lock contention. We would introduce **Redis Distributed Locking (Redlock)** or a **Message Queue (RabbitMQ/Kafka)** to serialize commitment requests into an in-memory queue.
2. **Socket.io Scaling**: Scale Socket.io servers horizontally across multiple nodes using the **Redis Adapter** for pub/sub event broadcasting.
3. **Read/Write Segregation**: Direct read requests (progress bars, lists) to PostgreSQL read-replicas or Redis cache while routing write commitments to the primary master DB.
