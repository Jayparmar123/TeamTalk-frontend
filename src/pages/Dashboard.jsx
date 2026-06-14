import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/layout/Navbar.jsx";
import ChatList from "../components/chat/ChatList.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import {
  fetchConversations,
  setActiveConversation,
  fetchMessages,
} from "../store/slices/chatSlice.js";

const ACTIVE_CONVO_KEY = "teamtalk_active_convo_id";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversation, loadingConversations } =
    useSelector((state) => state.chat);

  // Guard: only restore ONCE on initial page load, never after back navigation
  const hasRestoredRef = useRef(false);

  // ─── Fetch conversations on mount ─────────────────────────────────────────
  // The General channel is a regular conversation where the user is a participant.
  // It will appear automatically in the list from this single API call.
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // ─── Restore last active conversation after page refresh ──────────────────
  // Uses a ref so it fires exactly ONCE per page mount — never after the user
  // presses the back button (which sets activeConversation to null).
  useEffect(() => {
    if (loadingConversations || hasRestoredRef.current) return;
    if (conversations.length === 0) return;

    const savedId = localStorage.getItem(ACTIVE_CONVO_KEY);
    hasRestoredRef.current = true; // mark done regardless of outcome

    if (!savedId) return;

    const convo = conversations.find((c) => c._id === savedId);
    if (convo) {
      dispatch(setActiveConversation(convo));
      dispatch(fetchMessages(convo._id));
    }
  }, [loadingConversations, conversations, dispatch]);
  // NOTE: activeConversation intentionally NOT in deps — adding it would cause
  // the effect to re-run when the user presses back (sets null) and undo navigation.

  // ─── Persist active conversation ID to localStorage ───────────────────────
  useEffect(() => {
    if (activeConversation && !activeConversation.isTemp) {
      localStorage.setItem(ACTIVE_CONVO_KEY, activeConversation._id);
    }
  }, [activeConversation]);

  // ─── Mobile: handle back navigation ───────────────────────────────────────
  const handleBackToList = useCallback(() => {
    dispatch(setActiveConversation(null));
    localStorage.removeItem(ACTIVE_CONVO_KEY);
  }, [dispatch]);

  const showList = !activeConversation;
  const showChat = !!activeConversation;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text transition-colors duration-300">
      <Navbar onBack={activeConversation ? handleBackToList : null} />

      <div className="flex flex-1 overflow-hidden relative">
        {/*
          ── Chat List Panel ──────────────────────────────────────────────────
          Desktop (md+): always visible, fixed 320px sidebar
          Mobile (<md):  full-width, hidden when a conversation is open
        */}
        <div
          className={`
            animate-panel-enter shrink-0
            md:flex md:w-80
            ${showList ? "flex w-full" : "hidden"}
          `}
        >
          <ChatList />
        </div>

        {/*
          ── Chat Window Panel ────────────────────────────────────────────────
          Desktop (md+): always visible, fills remaining width
          Mobile (<md):  full-width, only shown when a conversation is active
        */}
        <div
          className={`
            animate-panel-enter-delayed flex-1 h-full
            ${showChat ? "flex" : "hidden"}
            md:flex
          `}
        >
          <ChatWindow onBack={handleBackToList} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
