import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserProfile {
  name: string;
  role: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: true, // Auto-authenticate for professional internal mock ERP
  user: {
    name: "System Admin",
    role: "Administrator",
    email: "admin@amt-transport.com",
  },
  loading: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<UserProfile>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
