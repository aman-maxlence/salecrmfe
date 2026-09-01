import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '@/modules/auth/auth-slice';
import { authApi } from '@/modules/auth/services';
import { rolesApi } from '@/modules/settings/services/rolesApi';
import { territoriesApi } from '@/modules/settings/services/territoriesApi';
import { departmentsApi } from '@/modules/settings/services/departmentsApi';
import { teamsApi } from '@/modules/settings/services/teamsApi';
import { workspaceSettingsApi } from '@/modules/settings/services/workspaceSettingsApi';
import { usersApi } from '@/modules/settings/services/usersApi';
import { invitesApi } from '@/modules/settings/services/invitesApi';
import { inviteLinkApi } from '@/modules/settings/services/inviteLinkApi';
import { onboardingApi } from '@/modules/onboarding/services/onboardingApi';
import { inventoryApi } from '@/modules/inventory/services/inventoryApi';
import { dealsApi } from '@/modules/deals/services/dealsApi';

const persistConfig = {
  key: 'sale_crm_root',
  storage,
  // Server-fetched data shouldn't be persisted to localStorage.
  blacklist: [
    authApi.reducerPath,
    rolesApi.reducerPath,
    territoriesApi.reducerPath,
    departmentsApi.reducerPath,
    teamsApi.reducerPath,
    workspaceSettingsApi.reducerPath,
    usersApi.reducerPath,
    invitesApi.reducerPath,
    inviteLinkApi.reducerPath,
    onboardingApi.reducerPath,
    inventoryApi.reducerPath,
    dealsApi.reducerPath,
  ],
};

const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [rolesApi.reducerPath]: rolesApi.reducer,
  [territoriesApi.reducerPath]: territoriesApi.reducer,
  [departmentsApi.reducerPath]: departmentsApi.reducer,
  [teamsApi.reducerPath]: teamsApi.reducer,
  [workspaceSettingsApi.reducerPath]: workspaceSettingsApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [invitesApi.reducerPath]: invitesApi.reducer,
  [inviteLinkApi.reducerPath]: inviteLinkApi.reducer,
  [onboardingApi.reducerPath]: onboardingApi.reducer,
  [inventoryApi.reducerPath]: inventoryApi.reducer,
  [dealsApi.reducerPath]: dealsApi.reducer,
  auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      authApi.middleware,
      rolesApi.middleware,
      territoriesApi.middleware,
      departmentsApi.middleware,
      teamsApi.middleware,
      workspaceSettingsApi.middleware,
      usersApi.middleware,
      invitesApi.middleware,
      inviteLinkApi.middleware,
      onboardingApi.middleware,
      inventoryApi.middleware,
      dealsApi.middleware
    ),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const persistor = persistStore(store);
