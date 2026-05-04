import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type AuthState = {
  isAuthenticated: boolean | null;
};

const initialState: AuthState = {
  isAuthenticated: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setAuthPending: (state) => {
      state.isAuthenticated = null;
    },
  },
});

export const { setAuthenticated, setAuthPending } = authSlice.actions;
export const authReducer = authSlice.reducer;
