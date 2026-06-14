import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSend,
  FiMessageSquare,
  FiClock,
  FiPaperclip,
  FiX,
  FiEdit3,
  FiTrash2,
  FiAnchor,
  FiDownload,
  FiFileText,
  FiHash,
  FiArrowLeft,
} from "react-icons/fi";
import { useSocket } from "../../context/SocketContext.jsx";
import {
  sendNewMessage,
  editMessageThunk,
  deleteMessageThunk,
  pinConversationThunk,
  addOptimisticMessage,
  removeOptimisticMessage,
} from "../../store/slices/chatSlice.js";
import { ChatSkeleton } from "../common/Loading.jsx";
import api from "../../utils/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";

const ChatWindow = ({ onBack }) => {
  const socket = useSocket();
  const dispatch = useDispatch();
  const { activeConversation, messages, typingStates, loadingMessages } =
    useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Message input states
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // File Upload states
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Edit message states
  const [editingMessageId, setEditingMessageId] = useState(null);

  // Retrieve recipient details (null for group chats)
  const recipient = activeConversation?.isGroup
    ? null
    : activeConversation?.participants.find((p) => p._id !== currentUser.id);

  // Helper: check if conversation is pinned
  const isPinned = activeConversation
    ? currentUser?.pinnedConversations?.some(
        (id) =>
          id === activeConversation._id || id?._id === activeConversation._id,
      )
    : false;

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversation, typingStates]);

  // Reset input fields on room changes
  useEffect(() => {
    setText("");
    setIsTyping(false);
    setEditingMessageId(null);
    setFileAttachment(null);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [activeConversation]);

  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket) return;

    // Emitting typing start
    if (!isTyping) {
      setIsTyping(true);
      const payload = activeConversation.isGroup
        ? {
            participants: activeConversation.participants.map((p) => p._id),
            conversationId: activeConversation._id,
          }
        : {
            recipientId: recipient?._id,
            conversationId: activeConversation._id,
          };
      socket.emit("typing:start", payload);
    }

    // Debounce typing stop
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const payload = activeConversation.isGroup
        ? {
            participants: activeConversation.participants.map((p) => p._id),
            conversationId: activeConversation._id,
          }
        : {
            recipientId: recipient?._id,
            conversationId: activeConversation._id,
          };
      socket.emit("typing:stop", payload);
    }, 2000);
  };

  const handlePinToggle = async () => {
    if (!activeConversation) return;
    const actionResult = await dispatch(
      pinConversationThunk(activeConversation._id),
    );
    if (pinConversationThunk.fulfilled.match(actionResult)) {
      showToast(
        !isPinned ? "Conversation pinned to top." : "Conversation unpinned.",
        "success",
      );
    } else {
      showToast(actionResult.payload || "Failed to toggle pin.", "error");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/chats/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setFileAttachment({
          url: response.data.file.url,
          name: response.data.file.name,
          type: response.data.file.type,
        });
        showToast("File uploaded successfully.", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.error || "File upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelAttachment = () => {
    setFileAttachment(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !fileAttachment) return;

    const currentText = text;
    const attachment = fileAttachment;

    setText("");
    setFileAttachment(null);

    // Stop typing state
    if (isTyping) {
      setIsTyping(false);
      const payload = activeConversation.isGroup
        ? {
            participants: activeConversation.participants.map((p) => p._id),
            conversationId: activeConversation._id,
          }
        : {
            recipientId: recipient?._id,
            conversationId: activeConversation._id,
          };
      socket.emit("typing:stop", payload);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    if (editingMessageId) {
      // Edit message flow
      const actionResult = await dispatch(
        editMessageThunk({ messageId: editingMessageId, text: currentText }),
      );
      setEditingMessageId(null);
      if (editMessageThunk.fulfilled.match(actionResult)) {
        showToast("Message updated successfully.", "success");
        if (socket) {
          const message = actionResult.payload;
          socket.emit("message:edit", {
            conversationId: activeConversation._id,
            recipientId: recipient?._id,
            participants: activeConversation.isGroup
              ? activeConversation.participants.map((p) => p._id)
              : null,
            message,
          });
        }
      } else {
        showToast(actionResult.payload || "Failed to update message.", "error");
      }
    } else {
      // ─── Send new message flow ────────────────────────────────────────────
      const payload = activeConversation.isGroup
        ? {
            conversationId: activeConversation._id,
            text: currentText,
            fileUrl: attachment?.url,
            fileName: attachment?.name,
            fileType: attachment?.type,
          }
        : {
            recipientId: recipient?._id,
            text: currentText,
            fileUrl: attachment?.url,
            fileName: attachment?.name,
            fileType: attachment?.type,
          };

      // ── OPTIMISTIC UPDATE ─────────────────────────────────────────────────
      // Show the message instantly in the UI — don't wait for the server.
      // The slice will replace this placeholder with the real message once
      // the API responds (same position, no visual flicker).
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticConvoId = activeConversation._id; // capture before any temp->real swap
      if (!activeConversation.isTemp) {
        // Only add optimistic for existing conversations.
        // Temp conversations don't have a stable ID yet, the slice handles them.
        dispatch(addOptimisticMessage({
          conversationId: optimisticConvoId,
          message: {
            _id: optimisticId,
            conversationId: optimisticConvoId,
            sender: {
              _id: currentUser.id,
              name: currentUser.name,
              avatarUrl: currentUser.avatarUrl,
            },
            text: currentText,
            fileUrl: attachment?.url || '',
            fileName: attachment?.name || '',
            fileType: attachment?.type || '',
            createdAt: new Date().toISOString(),
            isOptimistic: true,   // flag used by the reducer to find & replace
          }
        }));
      }
      // ─────────────────────────────────────────────────────────────────────

      const actionResult = await dispatch(sendNewMessage(payload));

      if (sendNewMessage.fulfilled.match(actionResult)) {
        // Emit socket event so RECIPIENT sees the message in real-time
        if (socket) {
          const { message, conversationId } = actionResult.payload;
          socket.emit("message:send", {
            conversationId,
            recipientId: recipient?._id,
            participants: activeConversation.isGroup
              ? activeConversation.participants.map((p) => p._id)
              : null,
            message,
          });
        }
      } else {
        // API failed — remove the optimistic placeholder so the UI is consistent
        if (!activeConversation.isTemp) {
          dispatch(removeOptimisticMessage({
            optimisticId,
            conversationId: optimisticConvoId,
          }));
        }
        showToast(actionResult.payload || "Failed to send message.", "error");
      }
      // ─────────────────────────────────────────────────────────────────────
    }
  };

  const handleEditClick = (msg) => {
    setEditingMessageId(msg._id);
    setText(msg.text);
  };

  const handleDeleteClick = async (msgId) => {
    const isConfirmed = await confirm(
      "Are you sure you want to permanently delete this message?",
      "Delete Message",
      "Delete",
      "Cancel",
    );
    if (isConfirmed) {
      const actionResult = await dispatch(deleteMessageThunk(msgId));
      if (deleteMessageThunk.fulfilled.match(actionResult)) {
        showToast("Message deleted.", "success");
        if (socket) {
          socket.emit("message:delete", {
            conversationId: activeConversation._id,
            recipientId: recipient?._id,
            participants: activeConversation.isGroup
              ? activeConversation.participants.map((p) => p._id)
              : null,
            messageId: msgId,
            message: actionResult.payload.message,
          });
        }
      } else {
        showToast(actionResult.payload || "Failed to delete message.", "error");
      }
    }
  };

  // Active message logs
  const convoMessages = activeConversation
    ? messages[activeConversation._id] || []
    : [];
  // Recipient typing triggers
  const activeTypingDetails = activeConversation?.isGroup
    ? activeConversation.participants.find(
        (p) => p._id !== currentUser.id && typingStates[p._id],
      )
    : recipient && typingStates[recipient._id]
      ? recipient
      : null;

  if (!activeConversation) {
    return (
      // On mobile this panel is hidden by Dashboard when no convo is active,
      // but on desktop it's always visible — show a friendly empty state.
      <div className="flex-1 h-full flex-col items-center justify-center text-center p-8 bg-white dark:bg-dark-card transition-colors duration-300 hidden md:flex">
        <div className="h-16 w-16 mb-4 rounded-3xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
          <FiMessageSquare size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text">
          No Chat Active
        </h3>
        <p className="text-sm text-gray-400 font-medium max-w-xs mt-1.5 leading-relaxed">
          Select a colleague or channel from the list to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-dark-card transition-colors duration-300">
      {/* Header Info */}
      <div className="p-3 md:p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {/* Mobile back button — visible only on small screens */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
            aria-label="Back to chat list"
          >
            <FiArrowLeft size={18} />
          </button>

          <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-tr from-primary/15 to-accent-indigo/15 flex items-center justify-center text-primary dark:text-primary-light font-bold shrink-0">
            {activeConversation.isGroup ? (
              <FiHash size={18} />
            ) : (
              <img
                src={
                  recipient?.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${recipient?.name}`
                }
                alt={recipient?.name}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-gray-900 dark:text-dark-text truncate">
              {activeConversation.isGroup
                ? activeConversation.name
                : recipient?.name}
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold truncate">
              {activeConversation.isGroup
                ? `${activeConversation.participants.length} members`
                : recipient?.email}
            </p>
          </div>
        </div>

        {/* Pin and Status badges */}
        <div className="flex items-center gap-2">
          {/* Toggle pin conversation */}
          <button
            onClick={handlePinToggle}
            title={isPinned ? "Unpin Conversation" : "Pin Conversation"}
            className={`p-2.5 rounded-xl border transition-all ${
              isPinned
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-dark-border text-gray-400 hover:text-gray-600"
            }`}
          >
            <FiAnchor size={16} />
          </button>

          {!activeConversation.isGroup && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-dark-border/40 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span
                className={`h-2 w-2 rounded-full ${recipient?.isOnline ? "bg-accent-green glow-text-emerald animate-pulse" : "bg-gray-400"}`}
              ></span>
              <span>{recipient?.isOnline ? "Online" : "Offline"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50/50 dark:bg-dark-bg/30">
        {loadingMessages && convoMessages.length === 0 ? (
          <ChatSkeleton />
        ) : (
          convoMessages.map((msg) => {
            const isMe =
              msg.sender === currentUser.id ||
              msg.sender?._id === currentUser.id;
            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const senderName = isMe ? "You" : msg.sender?.name || "User";

            return (
              <div
                key={msg._id}
                className={`group flex items-start gap-2.5 ${isMe ? "justify-end" : ""}`}
              >
                {!isMe && (
                  <img
                    src={
                      msg.sender?.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender?.name}`
                    }
                    alt="sender"
                    className="h-8 w-8 rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
                  />
                )}

                <div
                  className={`max-w-[70%] space-y-1 ${isMe ? "text-right" : ""}`}
                >
                  {/* Sender title (useful for group channels) */}
                  {activeConversation.isGroup && !isMe && (
                    <p className="text-[10px] text-gray-400 font-bold px-1 text-left">
                      {senderName}
                    </p>
                  )}

                  <div className="relative flex items-center gap-2 group-hover:flex-row">
                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 text-sm leading-relaxed transition-opacity ${
                        isMe
                          ? `bg-gradient-to-tr from-primary to-accent-indigo text-white rounded-[22px] rounded-tr-[4px] shadow-md shadow-primary/10 ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'}`
                          : "bg-[#dee7ff] dark:bg-[#1A233A] border border-gray-200/80 dark:border-[#2B3A5C] text-gray-800 dark:text-dark-text rounded-[22px] rounded-tl-[4px] shadow-sm"
                      }`}
                    >
                      {msg.isDeleted ? (
                        <p className="italic text-xs opacity-60">
                          Deleted message
                        </p>
                      ) : (
                        <>
                          {/* Text payload */}
                          {msg.text && (
                            <p className="whitespace-pre-line break-words text-left">
                              {msg.text}
                            </p>
                          )}

                          {/* File Attachment details */}
                          {msg.fileUrl && (
                            <div
                              className={`mt-2 flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
                                isMe
                                  ? "bg-black/10 border-white/10 text-white"
                                  : "bg-gray-50 border-gray-200 text-gray-800 dark:bg-dark-bg/60 dark:border-dark-border dark:text-dark-text"
                              }`}
                            >
                              {msg.fileType?.includes("image") ? (
                                <div className="space-y-1.5 w-full">
                                  <img
                                    src={msg.fileUrl}
                                    alt={msg.fileName}
                                    className="max-h-48 rounded-lg object-cover w-full cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(msg.fileUrl)}
                                  />
                                  <a
                                    href={msg.fileUrl}
                                    download
                                    target="_blank"
                                    className="flex items-center gap-1 text-[10px] opacity-75 hover:opacity-100"
                                  >
                                    <FiDownload size={12} /> Download Image
                                  </a>
                                </div>
                              ) : (
                                <>
                                  <FiFileText
                                    size={20}
                                    className="text-primary shrink-0"
                                  />
                                  <div className="flex-1 truncate text-left">
                                    <p className="truncate text-xs">
                                      {msg.fileName}
                                    </p>
                                    <a
                                      href={msg.fileUrl}
                                      download
                                      target="_blank"
                                      className="text-[10px] text-primary dark:text-primary-light hover:underline mt-0.5 inline-flex items-center gap-1"
                                    >
                                      <FiDownload size={10} /> Download File
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Own message Action Menu (Edit/Delete) on Hover */}
                    {isMe && !msg.isDeleted && (
                      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-md px-1.5 py-1 rounded-lg shrink-0 transition-opacity z-10">
                        <button
                          onClick={() => handleEditClick(msg)}
                          title="Edit Message"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white"
                        >
                          <FiEdit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(msg._id)}
                          title="Delete Message"
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp / Sending indicator */}
                  <div
                    className={`flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold px-1 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {msg.isOptimistic ? (
                      // Pulsing "Sending..." indicator while message is in flight
                      <span className="flex items-center gap-1 text-gray-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Sending...
                      </span>
                    ) : (
                      <>
                        {msg.isEdited && (
                          <span className="text-[8px] bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-extrabold uppercase">
                            Edited
                          </span>
                        )}
                        <FiClock size={10} />
                        <span>{time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time Typing Bubble indicator */}
        {activeTypingDetails && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <img
              src={
                activeTypingDetails.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${activeTypingDetails.name}`
              }
              alt="typing user"
              className="h-8 w-8 rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex items-center gap-1 bg-gray-200/60 dark:bg-gray-800/80 px-3.5 py-2.5 rounded-[22px] rounded-tl-[4px] w-fit border border-gray-300/30 dark:border-dark-border/20">
              <div
                className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inline edit panel display */}
      {editingMessageId && (
        <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 text-xs font-semibold text-primary flex items-center justify-between">
          <span>Editing your message...</span>
          <button
            onClick={() => {
              setEditingMessageId(null);
              setText("");
            }}
            className="p-1 hover:bg-primary/20 rounded-lg text-primary"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Attachment upload preview card display */}
      {fileAttachment && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-dark-border flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
            <FiPaperclip size={14} className="text-primary" />
            <span className="truncate max-w-[250px]">
              {fileAttachment.name}
            </span>
          </div>
          <button
            onClick={handleCancelAttachment}
            className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Input controls form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card transition-colors duration-300"
      >
        <div className="flex items-center gap-3">
          {/* File upload click trigger */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            title="Attach file / image (Max 10MB)"
            className="p-3.5 rounded-xl border bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-dark-bg/60 dark:border-dark-border dark:text-gray-400 dark:hover:bg-gray-800 text-gray-500 transition-all shrink-0 active:scale-[0.96]"
          >
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            ) : (
              <FiPaperclip size={18} />
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />

          <input
            type="text"
            placeholder={
              editingMessageId ? "Edit message..." : `Send message to chat...`
            }
            value={text}
            onChange={handleInputChange}
            className="flex-1 px-4 py-3.5 rounded-xl text-sm border bg-gray-50 dark:bg-dark-bg/60 border-gray-200 dark:border-dark-border focus:outline-none focus:border-primary text-gray-800 dark:text-dark-text transition-all focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="submit"
            disabled={!text.trim() && !fileAttachment}
            className="p-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none active:scale-[0.96]"
          >
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
