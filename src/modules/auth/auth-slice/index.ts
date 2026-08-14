import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser, IOrganization } from '../models';

interface AuthState {
  user: IUser | null;
  organization: IOrganization | null;
  role: string | null;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  role: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: IUser; organization: IOrganization }>) => {
      state.user = action.payload.user;
      state.organization = action.payload.organization;
      state.role = action.payload.organization?.userRole ?? null;
    },
    logout: (state) => {
      state.user = null;
      state.organization = null;
      state.role = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;

export default authSlice.reducer;
