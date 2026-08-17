import React, { FC } from "react";
import styles from "./square-light.module.scss";

interface IProps {
  disabled?: boolean;
  type?: string;
  btnId?: string;
  text: string;
  width?: string;
  height?: string;
  fontSize?: string;
  handler?: any;
}

const SquareBtn: FC<IProps> = ({
  disabled = false,
  type = "text",
  btnId = "toggle-modal",
  text,
  width = "220",
  height = "64",
  fontSize = "20px",
  handler = () => {},
}) => {
  if (type === "green") {
    return (
      <button
        disabled={disabled}
        id={btnId}
        onClick={handler}
        style={{ maxWidth: `${width}px`, maxHeight: `${height}px`, fontSize }}
        className={styles.btn}
      >
        {text}
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      id={btnId}
      onClick={handler}
      style={{ maxWidth: `${width}px`, maxHeight: `${height}px`, fontSize }}
      className={`${styles.btn} ${styles.participate}`}
    >
      {text}
    </button>
  );
};

export default SquareBtn;
