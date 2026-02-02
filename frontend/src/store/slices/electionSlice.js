import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchElection = createAsyncThunk(
  'election/fetchElection',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/election');
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching election');
    }
  }
);

export const voteCandidate = createAsyncThunk(
  'election/voteCandidate',
  async (candidateId, { rejectWithValue, dispatch }) => {
    try {
      await api.post('/election/vote', { candidateId });
      dispatch(fetchElection()); // Refresh data
      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error casting vote');
    }
  }
);

export const updateManifesto = createAsyncThunk(
  'election/updateManifesto',
  async (manifesto, { rejectWithValue, dispatch }) => {
    try {
      await api.post('/election/manifesto', { manifesto });
      dispatch(fetchElection()); // Refresh data
      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error updating quote');
    }
  }
);

const electionSlice = createSlice({
  name: 'election',
  initialState: {
    electionMeta: null,
    electionId: null,
    candidates: [],
    hasVoted: false,
    votedRoles: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchElection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchElection.fulfilled, (state, action) => {
        state.loading = false;
        state.electionMeta = action.payload.election || null;
        state.electionId = action.payload.election?._id || null;
        const candidatesSource = action.payload.candidates || action.payload.election?.candidates || [];
        state.candidates = candidatesSource.map((candidate) => ({
          id: candidate._id || candidate.candidateId || candidate.student?._id || '',
          studentId: candidate.studentId || candidate.student?._id || '',
          name: candidate.name || candidate.student?.name || '',
          role: candidate.role || '',
          image: candidate.profileImage || candidate.student?.pfp || '',
          department: candidate.department || candidate.student?.branch || '',
          year: candidate.year || (candidate.student?.ug ? `UG${candidate.student.ug}` : ''),
          manifesto: candidate.manifesto || '',
          votes: candidate.voteCount ?? candidate.votes ?? 0
        }));
        state.hasVoted = action.payload.hasVoted;
        state.votedRoles = action.payload.votedRoles || [];
      })
      .addCase(fetchElection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(voteCandidate.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateManifesto.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default electionSlice.reducer;
