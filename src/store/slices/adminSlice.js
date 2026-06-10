import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api.js';

// Fetch All Users for Admin
export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/users');
      return response.data.users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Add New Member
export const adminAddUser = createAsyncThunk(
  'admin/addUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Update Member Status/Details
export const adminUpdateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/${id}`, updateData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Delete Member
export const adminDeleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Fetch Dashboard Analytics
export const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/analytics');
      return response.data.analytics;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Fetch Admin Audit Logs
export const fetchAdminAuditLogs = createAsyncThunk(
  'admin/fetchAuditLogs',
  async (params = {}, { rejectWithValue }) => {
    const page = params.page || 1;
    const limit = params.limit || 15;
    try {
      const response = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      return response.data; // contains total, page, pages, logs
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  users: [],
  analytics: {
    totalEmployees: 0,
    onlineCount: 0,
    activeChats: 0,
    totalMessages: 0,
    recentUsers: []
  },
  auditLogs: [],
  totalLogs: 0,
  logsPage: 1,
  logsPages: 1,
  loadingUsers: false,
  loadingAnalytics: false,
  loadingLogs: false,
  error: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    setAdminUserOnline: (state, action) => {
      const { userId } = action.payload;
      const index = state.users.findIndex(u => u._id === userId);
      if (index !== -1) {
        if (!state.users[index].isOnline) {
          state.users[index].isOnline = true;
          state.analytics.onlineCount = Math.min(state.users.length, state.analytics.onlineCount + 1);
        }
      }
    },
    setAdminUserOffline: (state, action) => {
      const { userId } = action.payload;
      const index = state.users.findIndex(u => u._id === userId);
      if (index !== -1) {
        if (state.users[index].isOnline) {
          state.users[index].isOnline = false;
          state.analytics.onlineCount = Math.max(0, state.analytics.onlineCount - 1);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loadingUsers = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loadingUsers = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loadingUsers = false;
        state.error = action.payload;
      })
      // Add User
      .addCase(adminAddUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
        state.analytics.totalEmployees += 1;
      })
      .addCase(adminAddUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update User
      .addCase(adminUpdateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(adminUpdateUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete User
      .addCase(adminDeleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
        state.analytics.totalEmployees -= 1;
      })
      .addCase(adminDeleteUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Analytics
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loadingAnalytics = true;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loadingAnalytics = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loadingAnalytics = false;
        state.error = action.payload;
      })
      // Fetch Audit Logs
      .addCase(fetchAdminAuditLogs.pending, (state) => {
        state.loadingLogs = true;
      })
      .addCase(fetchAdminAuditLogs.fulfilled, (state, action) => {
        state.loadingLogs = false;
        state.auditLogs = action.payload.logs;
        state.totalLogs = action.payload.total;
        state.logsPage = action.payload.page;
        state.logsPages = action.payload.pages;
      })
      .addCase(fetchAdminAuditLogs.rejected, (state, action) => {
        state.loadingLogs = false;
        state.error = action.payload;
      });
  }
});

export const { clearAdminError, setAdminUserOnline, setAdminUserOffline } = adminSlice.actions;
export default adminSlice.reducer;
