// position: fixed;
// top: 0;
// left: 0;
// bottom: 0;
// right: 0;
// background: rgba(0, 0, 0, 0.301);
// z-index: 10;
// max-width: 100vw;
// max-height: 100vh;
// overflow: hidden !important;
import { createUseStyles } from "react-jss";

export const useStyles = createUseStyles({
  wrapper: {
    position: "fixed",
    top: "0",
    left: "0",
    bottom: "0",
    right: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.301)",
    zIndex: "1000000000000",
    maxWidth: "100vw",
    maxHeight: "100vh",
    overflow: "hidden !important",
  },
});
