import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    authToken: null,
    patientId: null,
    phoneNumber: null,
  },
  reducers: {
    setAuthToken(state, action) {
      state.authToken = action.payload;
    },
    setPatientId(state, action) {
      // console.log('Setting patientId in Redux:', action.payload); // Debug log
      state.patientId = action.payload;
    },
    setPhoneNumber(state, action) {
      state.phoneNumber = action.payload;
    },
    clearAuth(state) {
      state.authToken = null;
      state.patientId = null;
      state.phoneNumber = null;
    },
  },
});

export const { setAuthToken, setPatientId, setPhoneNumber, clearAuth } = authSlice.actions;

export default authSlice.reducer;
