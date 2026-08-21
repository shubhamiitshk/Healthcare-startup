import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { doctorApi } from '../services/api';

export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (_, { getState, rejectWithValue }) => {
    const { authToken } = getState().auth;
    if (!authToken) {
      return rejectWithValue('Missing authToken');
    }

    try {
      return await doctorApi.list();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
const doctorsSlice = createSlice({
  name: 'doctors',
  initialState: {
    doctors: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default doctorsSlice.reducer;
