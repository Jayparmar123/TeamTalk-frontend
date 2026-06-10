import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import chatReducer from './slices/chatSlice.js';
import adminReducer from './slices/adminSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    admin: adminReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // Disable checking to pass complex socket structures if required
    })
});
