import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { getAccessToken } from "../utils/api.js";
import { forceLogout } from "../store/slices/authSlice.js";
import { useToast } from "./ToastContext.jsx";
import {
  setAdminUserOnline,
  setAdminUserOffline,
} from "../store/slices/adminSlice.js";
import {
  fetchConversations,
  fetchDirectoryUsers,
  addReceivedMessage,
  setUserOnline,
  setUserOffline,
  setTypingIndicator,
  memberJoined,
  memberLeft,
  memberUpdated,
  channelMemberAdded,
  addEditedMessage,
  addDeletedMessage,
} from "../store/slices/chatSlice.js";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated) {
      const activeToken = token || getAccessToken();

      // Establish client socket connection
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        "https://teamtalk-backend-tb7m.onrender.com/";
      socketInstance = io(socketUrl, {
        auth: { token: activeToken },
        transports: ["websocket"],
      });

      console.log("Attempting to connect socket...");

      socketInstance.on("connect", () => {
        console.log("Socket connected successfully:", socketInstance.id);
        dispatch(fetchConversations());
        dispatch(fetchDirectoryUsers());
      });

      // Bind message delivery
      socketInstance.on("message:receive", (message) => {
        console.log("Received real-time message:", message);
        // Find conversationId: it's inside the message
        dispatch(
          addReceivedMessage({
            message,
            conversationId: message.conversationId,
          }),
        );
      });

      // Bind message edits
      socketInstance.on("message:edit", (data) => {
        dispatch(addEditedMessage(data));
      });

      // Bind message deletions
      socketInstance.on("message:delete", (data) => {
        dispatch(addDeletedMessage(data));
      });

      // Bind typing indicators
      socketInstance.on("typing:status", (data) => {
        dispatch(setTypingIndicator(data));
      });

      // Bind online presence indicators
      socketInstance.on("user:online", (data) => {
        dispatch(setUserOnline(data));
        dispatch(setAdminUserOnline(data));
      });

      socketInstance.on("user:offline", (data) => {
        dispatch(setUserOffline(data));
        dispatch(setAdminUserOffline(data));
      });

      // Bind admin workspace directory triggers
      socketInstance.on("member:join", (user) => {
        dispatch(memberJoined(user));
      });

      socketInstance.on("member:leave", (data) => {
        dispatch(memberLeft(data));
      });

      socketInstance.on("member:update", (user) => {
        dispatch(memberUpdated(user));
      });

      // New user added to a channel (e.g. General) by admin
      socketInstance.on("channel:member:added", (data) => {
        dispatch(channelMemberAdded(data));
      });

      // Bind deactivation logout
      socketInstance.on("auth:logout", (data) => {
        console.warn("Force logout triggered by server:", data.reason);
        dispatch(forceLogout());
        showToast(
          `Your account has been ${data.reason}. Logging out.`,
          "warning",
        );
      });

      setSocket(socketInstance);
    } else {
      // Disconnect socket if user is unauthenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, token, dispatch]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
