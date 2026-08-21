import axios from 'axios';
import { BACKEND_HOST } from '@env';
import store from '../store/store';
import { clearAuth } from '../store/authSlice';

const baseURL = `${BACKEND_HOST.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { authToken } = store.getState().auth;
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      store.dispatch(clearAuth());
    }
    return Promise.reject(err);
  },
);

function unwrap(promise) {
  return promise
    .then((res) => (res.data && 'data' in res.data ? res.data.data : res.data))
    .catch((err) => {
      const message =
        err.response?.data?.message ?? err.message ?? 'Network error';
      const error = new Error(message);
      error.status = err.response?.status;
      error.original = err;
      throw error;
    });
}

export const patientApi = {
  searchByPhone: (phone) =>
    unwrap(api.get(`/patients/search/${encodeURIComponent(phone)}`)),
  get: (patientId) => unwrap(api.get(`/patients/${patientId}`)),
  create: (payload) => unwrap(api.post('/patients', payload)),
  update: (patientId, payload) =>
    unwrap(api.patch(`/patients/${patientId}`, payload)),
  addFamilyMember: (patientId, payload) =>
    unwrap(api.post(`/patients/${patientId}/family-members`, payload)),
};

export const doctorApi = {
  list: () => unwrap(api.get('/doctors/public')),
  get: (doctorId) => unwrap(api.get(`/doctors/${doctorId}`)),
};

export const appointmentApi = {
  forPatient: (patientId) =>
    unwrap(api.get(`/appointments/patient/${patientId}`)),
  book: (payload) => unwrap(api.post('/appointments/book', payload)),
};

export const followUpApi = {
  create: (payload) => unwrap(api.post('/follow-ups', payload)),
  listForPatient: (patientId) =>
    unwrap(api.get(`/follow-ups/patient/${patientId}`)),
};

export default api;
