const { Server } = require("socket.io");

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("join_loan_room", (loanId) => {
      const room = `loan_${loanId}`;
      socket.join(room);
      console.log(`[Socket.io] Socket ${socket.id} joined room ${room}`);
    });

    socket.on("leave_loan_room", (loanId) => {
      const room = `loan_${loanId}`;
      socket.leave(room);
      console.log(`[Socket.io] Socket ${socket.id} left room ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIo };
