import { useEffect } from "react";
import { useDispatch } from "react-redux";
import gsap from "gsap";
import Navbar from "../components/layout/Navbar.jsx";
import ChatList from "../components/chat/ChatList.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import { fetchConversations } from "../store/slices/chatSlice.js";

const Dashboard = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // GSAP animation for page layout components
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dashboard-panel",
        { opacity: 0, scale: 0.98, y: 15 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Directory Chat List Panel */}
        <div className="dashboard-panel shrink-0">
          <ChatList />
        </div>

        {/* Active Conversation Message Panel */}
        <div className="dashboard-panel flex-1 h-full">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
