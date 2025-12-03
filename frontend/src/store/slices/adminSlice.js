import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchDashboardData = createAsyncThunk(
  'admin/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/admin/dashboard');
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching dashboard data');
    }
  }
);

// We can add more thunks for add/remove actions if we want to move all logic to Redux
// For now, let's at least manage the main data in Redux

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    courses: [],
    professors: [],
    students: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses;
        state.professors = action.payload.professors;
        state.students = action.payload.students;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;
