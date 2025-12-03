import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import electionReducer from './slices/electionSlice';
import adminReducer from './slices/adminSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    election: electionReducer,
    admin: adminReducer,
    profile: profileReducer,
  },
});
