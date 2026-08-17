import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import { AppState } from "../store";

export interface AuthState {
  isLogin: boolean;
  isWallet: boolean;
}

const initialState: AuthState = {
  isLogin: false,
  isWallet: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser(state) {
      state.isLogin = false;
    },
    loginUser(state) {
      state.isLogin = true;
    },
    connectWallet(state) {
      state.isWallet = true;
    },
  },
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.auth,
      };
    },
  },
});

export const { logoutUser, loginUser, connectWallet } = authSlice.actions;

export const authState = (state: AppState) => state.auth;

export default authSlice.reducer;
