// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import EncryptedStorage from 'react-native-encrypted-storage';
import logger from 'redux-logger';
import authReducer from './authSlice';
import doctorsReducer from './doctorsSlice';

const secureStorage = {
  getItem: async (key) => {
    const value = await EncryptedStorage.getItem(key);
// +   console.log(`Retrieved from Secure Storage (${key}):`, value); // Debug log
    return value ? JSON.parse(value) : null;
  },
  setItem: async (key, value) => {
// +   console.log(`Storing in Secure Storage (${key}):`, value); // Debug log
    await EncryptedStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key) => {
    // console.log(`Removing ${key}`); // Debug log
    await EncryptedStorage.removeItem(key);
  },
};

// src/store/store.js
const persistConfig = {
  key: 'auth',
  storage: secureStorage,
  version: 1,
  whitelist: ['authToken', 'patientId', 'phoneNumber'], // Ensure patientId is included
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    doctors: doctorsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(logger),
});

export const persistor = persistStore(store);

export default store;
