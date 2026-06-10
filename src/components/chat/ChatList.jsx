import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import gsap from 'gsap';
import { FiSearch, FiHash, FiUser, FiAnchor, FiAward } from 'react-icons/fi';
import { fetchDirectoryUsers, setActiveConversation, fetchMessages } from '../../store/slices/chatSlice.js';

const ChatList = () => {
  const dispatch = useDispatch();
  const { directoryUsers, conversations, activeConversation, loadingDirectory } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  const listRef = useRef(null);

  useEffect(() => {
    dispatch(fetchDirectoryUsers(searchTerm));
  }, [dispatch, searchTerm]);

  // GSAP animation for loaded lists
  useEffect(() => {
    if (!loadingDirectory) {
      gsap.fromTo('.chat-item-header',
        { opacity: 0, y: -5 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }
      );
      gsap.fromTo('.chat-item-row',
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03 }
      );
    }
  }, [loadingDirectory, conversations.length, directoryUsers.length]);

  const handleSelectConvo = (convo) => {
    dispatch(setActiveConversation(convo));
    dispatch(fetchMessages(convo._id));
  };

  const handleSelectUser = (user) => {
    // Check if we have an existing conversation with this user
    let existingConvo = conversations.find(convo =>
      !convo.isGroup && convo.participants.some(p => p._id === user._id)
    );

    if (existingConvo) {
      handleSelectConvo(existingConvo);
    } else {
      // Create a temporary conversation object in state
      const tempConvo = {
        _id: `temp-${user._id}`,
        participants: [
          { _id: currentUser.id, name: currentUser.name, email: currentUser.email, avatarUrl: currentUser.avatarUrl },
          { _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, isOnline: user.isOnline, lastSeen: user.lastSeen }
        ],
        isTemp: true
      };
      dispatch(setActiveConversation(tempConvo));
    }
  };

  // Check if a conversation is pinned
  const isConvoPinned = (convoId) => {
    return currentUser?.pinnedConversations?.some(id => id === convoId || id?._id === convoId);
  };

  // Find DM conversation for a specific user ID
  const getDMConvo = (userId) => {
    return conversations.find(c => !c.isGroup && c.participants.some(p => p._id === userId));
  };

  // Get last message preview for colleagues
  const getConvoSummary = (userId) => {
    const convo = getDMConvo(userId);
    if (convo && convo.lastMessage) {
      const isSentByMe = convo.lastMessage.sender === currentUser.id || convo.lastMessage.sender?._id === currentUser.id;
      return `${isSentByMe ? 'You: ' : ''}${convo.lastMessage.isDeleted ? 'deleted message' : convo.lastMessage.text || 'sent attachment'}`;
    }
    return 'Start direct message';
  };

  // Filter Group Conversations
  const groupChannels = conversations.filter(c => c.isGroup);

  // Separate pinned conversations
  const pinnedConvos = conversations.filter(c => isConvoPinned(c._id));
  const unpinnedConvos = conversations.filter(c => !isConvoPinned(c._id));

  // Channels (excluding pinned ones)
  const unpinnedChannels = groupChannels.filter(c => !isConvoPinned(c._id));

  // Sort directory users: online users at the top, then offline users
  const sortedDirectoryUsers = [...directoryUsers].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  return (
    <div className="w-80 h-full flex flex-col bg-white border-r border-gray-200 dark:bg-dark-bg dark:border-dark-border transition-colors duration-300">
      {/* Search Bar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-500 mb-3">
          Workspace Chats
        </h3>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FiSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Search colleagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:outline-none focus:border-primary text-gray-800 dark:text-dark-text transition-all focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Main List Scroller */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-2.5 space-y-5 no-scrollbar">
        
        {/* SECTION 1: PINNED CONVERSATIONS */}
        {pinnedConvos.length > 0 && (
          <div className="space-y-1">
            <div className="chat-item-header flex items-center gap-1.5 px-2.5 mb-1.5 text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
              <FiAnchor size={11} className="text-primary animate-pulse" />
              <span>Pinned chats</span>
            </div>
            {pinnedConvos.map((convo) => {
              const isActive = activeConversation?._id === convo._id;
              const name = convo.isGroup ? convo.name : convo.participants.find(p => p._id !== currentUser.id)?.name;
              const subText = convo.lastMessage ? convo.lastMessage.text : 'Seeded chat room';

              return (
                <div
                  key={convo._id}
                  onClick={() => handleSelectConvo(convo)}
                  className={`chat-item-row flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border border-transparent transition-all ${
                    isActive
                      ? 'bg-primary/10 dark:bg-dark-card border-primary/20 dark:border-dark-border shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-card/30'
                  }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary/10 to-accent-indigo/10 flex items-center justify-center text-primary dark:text-primary-light text-xs font-bold shrink-0">
                    {convo.isGroup ? <FiHash size={14} /> : <FiUser size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate text-gray-800 dark:text-dark-text">{name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{subText}</p>
                  </div>
                  <span className="text-[10px] text-primary font-bold">📌</span>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 2: CHANNELS (GROUP CHATS) */}
        <div className="space-y-1">
          <div className="chat-item-header flex items-center px-2.5 mb-1.5 text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
            Channels 📢
          </div>
          {unpinnedChannels.length === 0 && pinnedConvos.filter(c => c.isGroup).length === 0 ? (
            <p className="text-[10px] text-gray-400 font-semibold px-2.5">No channels active</p>
          ) : (
            unpinnedChannels.map((convo) => {
              const isActive = activeConversation?._id === convo._id;
              return (
                <div
                  key={convo._id}
                  onClick={() => handleSelectConvo(convo)}
                  className={`chat-item-row flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border border-transparent transition-all ${
                    isActive
                      ? 'bg-primary/10 dark:bg-dark-card border-primary/20 dark:border-dark-border shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-card/30'
                  }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-accent-rose/10 text-accent-rose flex items-center justify-center text-xs font-bold shrink-0">
                    <FiHash size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate text-gray-800 dark:text-dark-text">{convo.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {convo.lastMessage ? convo.lastMessage.text : 'Welcome to general channel'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SECTION 3: DIRECT MESSAGES (COLLEAGUES DIRECTORY) */}
        <div className="space-y-1">
          <div className="chat-item-header flex items-center px-2.5 mb-1.5 text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
            Direct Messages 👤
          </div>
          {loadingDirectory && directoryUsers.length === 0 ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-9 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
              ))}
            </div>
          ) : sortedDirectoryUsers.length === 0 ? (
            <p className="text-[10px] text-gray-400 font-semibold px-2.5">No colleagues found</p>
          ) : (
            sortedDirectoryUsers.map((member) => {
              const dmConvo = getDMConvo(member._id);
              // Skip rendering here if it's already in the pinned section to avoid duplicates
              if (dmConvo && isConvoPinned(dmConvo._id)) return null;

              const isActive = activeConversation?.participants.some(p => p._id === member._id) && !activeConversation.isGroup;
              const summary = getConvoSummary(member._id);

              return (
                <div
                  key={member._id}
                  onClick={() => handleSelectUser(member)}
                  className={`chat-item-row flex items-center gap-2.5 p-2 rounded-xl cursor-pointer border border-transparent transition-all ${
                    isActive
                      ? 'bg-primary/10 dark:bg-dark-card border-primary/20 dark:border-dark-border shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-card/30'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={member.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                      alt={member.name}
                      className="h-8 w-8 rounded-lg object-cover bg-gray-200 dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600"
                    />
                    {member.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-accent-green border border-white dark:border-dark-bg flex items-center justify-center glow-text-emerald animate-pulse"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-gray-800 dark:text-dark-text truncate">
                        {member.name}
                      </p>
                      {member.role === 'admin' && (
                        <FiAward size={12} className="text-primary shrink-0" title="Administrator" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate max-w-[190px]">
                      {summary}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
