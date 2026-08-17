import { createUseStyles } from "react-jss";

export const useStyles = createUseStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    opacity: "0",
    position: "absolute",
    left: "0",
    top: "0",
    width: "88px",
    height: "88px",
    cursor: "pointer",
  },
  label: {
    cursor: "pointer",
    fontFamily: "Gilroy",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "14px",
    lineHeight: "17px",
    color: "var(--color-primary)",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  img: {
    width: "288px",
    height: "auto",
    borderRadius: "8px",
    objectFit: "contain",
  },
  p: {
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "14px",
    lineHeight: "17px",
    color: "var(--color-text-muted)",
    marginBottom: "7px",
  },
});
