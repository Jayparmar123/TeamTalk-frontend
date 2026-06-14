import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

// Fetch Active Conversations
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chats/conversations');
      return response.data.conversations;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Fetch Messages for a Conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chats/conversations/${conversationId}`);
      return { conversationId, messages: response.data.messages };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Send Message REST API fallback/hook
export const sendNewMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ recipientId, conversationId, text, fileUrl, fileName, fileType }, { rejectWithValue }) => {
    try {
      const response = await api.post('/chats/messages', {
        recipientId,
        conversationId,
        text,
        fileUrl,
        fileName,
        fileType
      });
      return response.data; // contains message and conversationId
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Edit own message
export const editMessageThunk = createAsyncThunk(
  'chat/editMessage',
  async ({ messageId, text }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/chats/messages/${messageId}`, { text });
      return response.data.message; // returns updated message
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Soft delete own message
export const deleteMessageThunk = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/chats/messages/${messageId}`);
      return response.data; // returns messageId, conversationId, message
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Pin / Unpin Conversation thread
export const pinConversationThunk = createAsyncThunk(
  'chat/pinConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/chats/conversations/${conversationId}/pin`);
      return { conversationId, pinnedConversations: response.data.pinnedConversations };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Fetch Workspace Directory Users
export const fetchDirectoryUsers = createAsyncThunk(
  'chat/fetchDirectoryUsers',
  async (search = '', { rejectWithValue }) => {
    try {
      const response = await api.get(`/users?search=${search}`);
      return response.data.users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Ensure the General channel exists and inject it into conversations if missing
export const fetchGeneralChannel = createAsyncThunk(
  'chat/fetchGeneralChannel',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/general-channel');
      return response.data.channel;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {}, // { [convoId]: [msgs] }
  directoryUsers: [], // all active employees for directory list
  typingStates: {}, // { [userId]: boolean }
  onlineUsers: [], // array of online userIds (optional back-up mapping)
  loadingConversations: false,
  loadingMessages: false,
  loadingDirectory: false,
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    // Optimistic UI: add a placeholder message instantly before API responds
    addOptimisticMessage: (state, action) => {
      const { message, conversationId } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },
    // Remove optimistic placeholder if API call fails
    removeOptimisticMessage: (state, action) => {
      const { optimisticId, conversationId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(
          m => m._id !== optimisticId
        );
      }
    },
    // Socket Event: Message Received
    addReceivedMessage: (state, action) => {
      const { message, conversationId } = action.payload;
      
      // Initialize message array if not exists
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Only append if it's not already in the list (prevent duplicates)
      const exists = state.messages[conversationId].some(m => m._id === message._id);
      if (!exists) {
        state.messages[conversationId].push(message);
      }

      // Update conversations list's lastMessage
      const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (convoIndex !== -1) {
        state.conversations[convoIndex].lastMessage = message;
        // Move conversation to the top
        const [convo] = state.conversations.splice(convoIndex, 1);
        state.conversations.unshift(convo);
      } else {
        // New conversation (first message ever from this sender) —
        // build a minimal conversation entry so the sidebar shows it
        // without requiring a page refresh.
        const participants = [];
        if (message.sender && typeof message.sender === 'object') {
          participants.push(message.sender);
        }
        state.conversations.unshift({
          _id: conversationId,
          participants,
          isGroup: false,
          lastMessage: message,
          updatedAt: new Date().toISOString()
        });
      }
    },
    // Socket Event: User Online
    setUserOnline: (state, action) => {
      const { userId } = action.payload;
      
      // Update in directory users
      const dirIndex = state.directoryUsers.findIndex(u => u._id === userId);
      if (dirIndex !== -1) {
        state.directoryUsers[dirIndex].isOnline = true;
      }

      // Update in conversations participants
      state.conversations.forEach(convo => {
        const participant = convo.participants.find(p => p._id === userId);
        if (participant) {
          participant.isOnline = true;
        }
      });

      if (state.activeConversation) {
        const participant = state.activeConversation.participants.find(p => p._id === userId);
        if (participant) {
          participant.isOnline = true;
        }
      }
    },
    // Socket Event: User Offline
    setUserOffline: (state, action) => {
      const { userId } = action.payload;
      
      // Update in directory users
      const dirIndex = state.directoryUsers.findIndex(u => u._id === userId);
      if (dirIndex !== -1) {
        state.directoryUsers[dirIndex].isOnline = false;
        state.directoryUsers[dirIndex].lastSeen = new Date().toISOString();
      }

      // Update in conversations participants
      state.conversations.forEach(convo => {
        const participant = convo.participants.find(p => p._id === userId);
        if (participant) {
          participant.isOnline = false;
          participant.lastSeen = new Date().toISOString();
        }
      });

      if (state.activeConversation) {
        const participant = state.activeConversation.participants.find(p => p._id === userId);
        if (participant) {
          participant.isOnline = false;
          participant.lastSeen = new Date().toISOString();
        }
      }
    },
    // Socket Event: Typing Indicator State
    setTypingIndicator: (state, action) => {
      const { senderId, isTyping } = action.payload;
      state.typingStates[senderId] = isTyping;
    },
    // Socket Event: Member Join
    memberJoined: (state, action) => {
      const newMember = action.payload;
      const exists = state.directoryUsers.some(u => u._id === newMember.id);
      if (!exists) {
        state.directoryUsers.push({
          _id: newMember.id,
          name: newMember.name,
          email: newMember.email,
          role: newMember.role,
          avatarUrl: newMember.avatarUrl,
          isOnline: newMember.isOnline,
          lastSeen: newMember.lastSeen
        });
        // Sort directory
        state.directoryUsers.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    // Socket Event: Member Leave
    memberLeft: (state, action) => {
      const { userId } = action.payload;
      state.directoryUsers = state.directoryUsers.filter(u => u._id !== userId);
      state.conversations = state.conversations.filter(c => !c.participants.some(p => p._id === userId));
      if (state.activeConversation && state.activeConversation.participants.some(p => p._id === userId)) {
        state.activeConversation = null;
      }
    },
    // Socket Event: Member Details Update
    memberUpdated: (state, action) => {
      const updatedMember = action.payload;
      const index = state.directoryUsers.findIndex(u => u._id === updatedMember.id);
      if (index !== -1) {
        state.directoryUsers[index].name = updatedMember.name;
        state.directoryUsers[index].email = updatedMember.email;
        state.directoryUsers[index].role = updatedMember.role;
        state.directoryUsers[index].isActive = updatedMember.isActive;
        
        // Remove from list if deactivated
        if (!updatedMember.isActive) {
          state.directoryUsers = state.directoryUsers.filter(u => u._id !== updatedMember.id);
          state.conversations = state.conversations.filter(c => !c.participants.some(p => p._id === updatedMember.id));
          if (state.activeConversation && state.activeConversation.participants.some(p => p._id === updatedMember.id)) {
            state.activeConversation = null;
          }
        }
      }
    },
    addEditedMessage: (state, action) => {
      const { message, conversationId } = action.payload;
      if (state.messages[conversationId]) {
        const msgIndex = state.messages[conversationId].findIndex(m => m._id === message._id);
        if (msgIndex !== -1) {
          state.messages[conversationId][msgIndex] = message;
        }
      }
      // Update lastMessage preview if matches
      const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (convoIndex !== -1 && state.conversations[convoIndex].lastMessage?._id === message._id) {
        state.conversations[convoIndex].lastMessage = message;
      }
    },
    addDeletedMessage: (state, action) => {
      const { messageId, conversationId, message } = action.payload;
      if (state.messages[conversationId]) {
        const msgIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (msgIndex !== -1) {
          state.messages[conversationId][msgIndex] = message;
        }
      }
      // Update lastMessage preview if matches
      const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (convoIndex !== -1 && state.conversations[convoIndex].lastMessage?._id === messageId) {
        state.conversations[convoIndex].lastMessage = message;
      }
    },
    clearChatError: (state) => {
      state.error = null;
    },
    // Socket Event: New user was added to a channel (e.g. General) by the server
    channelMemberAdded: (state, action) => {
      const { conversationId, user } = action.payload;

      // Update the participants array in the conversations sidebar list
      const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (convoIndex !== -1) {
        const alreadyIn = state.conversations[convoIndex].participants.some(
          p => (p._id || p) === user._id
        );
        if (!alreadyIn) {
          state.conversations[convoIndex].participants.push(user);
        }
      }

      // Also update activeConversation if the General channel is open
      if (state.activeConversation?._id === conversationId) {
        const alreadyIn = state.activeConversation.participants.some(
          p => (p._id || p) === user._id
        );
        if (!alreadyIn) {
          state.activeConversation.participants.push(user);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload;
      })
      // Send Message Thunk Response
      .addCase(sendNewMessage.fulfilled, (state, action) => {
        const { message, conversationId } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }

        // ─── TEMP CONVERSATION CASE ────────────────────────────────────────
        if (state.activeConversation?.isTemp) {
          const participants = state.activeConversation.participants;
          const tempId = state.activeConversation._id;

          // Promote temp → real conversation
          state.activeConversation = {
            ...state.activeConversation,
            _id: conversationId,
            isTemp: false,
            lastMessage: message
          };

          // Replace any optimistic/temp messages with the real one
          state.messages[conversationId] = [message];
          if (state.messages[tempId]) {
            delete state.messages[tempId];
          }

          // Add real conversation to sidebar
          const alreadyInList = state.conversations.some(c => c._id === conversationId);
          if (!alreadyInList) {
            state.conversations.unshift({
              _id: conversationId,
              participants,
              isGroup: false,
              lastMessage: message,
              updatedAt: new Date().toISOString()
            });
          }
          return;
        }
        // ───────────────────────────────────────────────────────────────────

        // ─── REGULAR CONVERSATION CASE ─────────────────────────────────────
        // Replace the optimistic placeholder with the real server message.
        // The optimistic message has isOptimistic:true so we can find it.
        const optimisticIndex = state.messages[conversationId].findIndex(
          m => m.isOptimistic
        );
        if (optimisticIndex !== -1) {
          // Swap in the real message in-place (same position, no visual jump)
          state.messages[conversationId][optimisticIndex] = message;
        } else {
          // Fallback: optimistic was already replaced or missing — add if not duplicate
          const exists = state.messages[conversationId].some(m => m._id === message._id);
          if (!exists) {
            state.messages[conversationId].push(message);
          }
        }
        // ───────────────────────────────────────────────────────────────────

        // Bubble conversation to top of sidebar
        const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (convoIndex !== -1) {
          state.conversations[convoIndex].lastMessage = message;
          const [convo] = state.conversations.splice(convoIndex, 1);
          state.conversations.unshift(convo);
        }
      })
      // Fetch Directory Users
      .addCase(fetchDirectoryUsers.pending, (state) => {
        state.loadingDirectory = true;
      })
      .addCase(fetchDirectoryUsers.fulfilled, (state, action) => {
        state.loadingDirectory = false;
        state.directoryUsers = action.payload;
      })
      .addCase(fetchDirectoryUsers.rejected, (state, action) => {
        state.loadingDirectory = false;
        state.error = action.payload;
      })
      // Fetch / ensure General channel
      .addCase(fetchGeneralChannel.fulfilled, (state, action) => {
        const channel = action.payload;
        if (!channel) return;
        const idx = state.conversations.findIndex(c => c._id === channel._id);
        if (idx === -1) {
          // General channel not in list — inject it at the top
          state.conversations.unshift(channel);
        } else {
          // Update participants in case new members were added
          state.conversations[idx].participants = channel.participants;
        }
      })
      // Edit message fulfillment
      .addCase(editMessageThunk.fulfilled, (state, action) => {
        const message = action.payload;
        const conversationId = message.conversationId;
        if (state.messages[conversationId]) {
          const msgIndex = state.messages[conversationId].findIndex(m => m._id === message._id);
          if (msgIndex !== -1) {
            state.messages[conversationId][msgIndex] = message;
          }
        }
        const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (convoIndex !== -1 && state.conversations[convoIndex].lastMessage?._id === message._id) {
          state.conversations[convoIndex].lastMessage = message;
        }
      })
      // Delete message fulfillment
      .addCase(deleteMessageThunk.fulfilled, (state, action) => {
        const { messageId, conversationId, message } = action.payload;
        if (state.messages[conversationId]) {
          const msgIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
          if (msgIndex !== -1) {
            state.messages[conversationId][msgIndex] = message;
          }
        }
        const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (convoIndex !== -1 && state.conversations[convoIndex].lastMessage?._id === messageId) {
          state.conversations[convoIndex].lastMessage = message;
        }
      });
  }
});

export const {
  setActiveConversation,
  addOptimisticMessage,
  removeOptimisticMessage,
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
  clearChatError
} = chatSlice.actions;

export default chatSlice.reducer;
