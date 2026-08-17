import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import { AppState } from "../store";
import { FlagsListItem } from "../../components/layouts/projects/Podcast/styles";

export interface IModalsState {
  isWallet: boolean;
  isDiscord: boolean;
}

const initialState: IModalsState = {
  isWallet: false,
  isDiscord: false,
};

export const modalsSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    toggleModal(state: any, action) {
      const payload: { modal: string; value: boolean } = action.payload;
      state[payload.modal] = payload.value;
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

export const { toggleModal } = modalsSlice.actions;

export const modalsState = (state: AppState) => state.auth;

export default modalsSlice.reducer;
