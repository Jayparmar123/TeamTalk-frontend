import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken } from '../../utils/api.js';

// Login User Thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Store access token in memory
      setAccessToken(token);
      
      return { token, user };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message
      );
    }
  }
);

// Logout User Thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      setAccessToken('');
      return null;
    } catch (error) {
      setAccessToken('');
      return rejectWithValue(
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message
      );
    }
  }
);

// Logout All Devices Thunk
export const logoutAllDevices = createAsyncThunk(
  'auth/logoutAll',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout-all');
      setAccessToken('');
      return null;
    } catch (error) {
      setAccessToken('');
      return rejectWithValue(
        error.response && error.response.data.error
          ? error.response.data.error
          : error.message
      );
    }
  }
);

// Check Auth Status Thunk (Runs on page load)
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/refresh');
      const { token, user } = response.data;
      
      setAccessToken(token);
      
      return { token, user };
    } catch (error) {
      setAccessToken('');
      return rejectWithValue('No active session found');
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // Start as true during checkAuth
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      setAccessToken('');
    }
  },
  extraReducers: (builder) => {
    builder
      // Login actions
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Logout actions
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      // Logout All Devices actions
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutAllDevices.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      // Check auth actions
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase('chat/pinConversation/fulfilled', (state, action) => {
        if (state.user) {
          state.user.pinnedConversations = action.payload.pinnedConversations;
        }
      });
  }
});

export const { clearAuthError, forceLogout } = authSlice.actions;
export default authSlice.reducer;
