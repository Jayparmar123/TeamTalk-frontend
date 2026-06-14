import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Navbar from "../components/layout/Navbar.jsx";
import ChatList from "../components/chat/ChatList.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import { fetchConversations } from "../store/slices/chatSlice.js";

const Dashboard = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Directory Chat List Panel — CSS fade-in */}
        <div className="animate-panel-enter shrink-0">
          <ChatList />
        </div>

        {/* Active Conversation Message Panel — CSS fade-in with slight delay */}
        <div className="animate-panel-enter-delayed flex-1 h-full">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
