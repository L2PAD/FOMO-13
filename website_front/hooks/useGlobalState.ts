import { createGlobalState } from "react-hooks-global-state";

const initialState = {
  banner:
    typeof window === "undefined"
      ? true
      : sessionStorage.getItem("banner") === "false"
        ? false
        : true,
};

export const { useGlobalState, getGlobalState, setGlobalState } =
  createGlobalState(initialState);
