import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Constant from "../utils/constant";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(Constant.API_BASE_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server socket:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io] Disconnected from server socket");
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinLoanRoom = (loanId) => {
    if (socketRef.current) {
      socketRef.current.emit("join_loan_room", loanId);
    }
  };

  const leaveLoanRoom = (loanId) => {
    if (socketRef.current) {
      socketRef.current.emit("leave_loan_room", loanId);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinLoanRoom,
    leaveLoanRoom,
  };
};
