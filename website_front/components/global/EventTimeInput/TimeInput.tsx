import React, { useState, useRef, useEffect, FC } from "react";
import styles from "./time-input.module.scss";

interface IProps {
  handler: (value: { hours: string, minutes: string }) => void
  initial: { hours: string, minutes: string }
  className?: string
}

const TimeInput: FC<IProps> = ({ handler, initial, className = "" }) => {
  const minutesInputRef: any = useRef();
  const hoursInputRef: any = useRef();

  const timeValidation = (name: any, value: number) => {
    if (name === "minutes" && value > 60) return false;

    if (name === "hours" && (value > 24 || value > 2 && value < 10)) return false;

    return true;
  };

  const timeHandler = (name: any, value: any) => {
    if (value.length > 2) return;
    if (!timeValidation(name, value)) return

    if (value.length === 0 && name === "minutes") {
      hoursInputRef.current.focus();
    }

    if (value.length > 1 && name === "hours") {
      minutesInputRef.current.focus();
    }

    handler({ ...initial, [name]: value })
  };

  return (
    <div className={`${styles.body} ${className}`.trim()}>
      <input
        max={24}
        ref={hoursInputRef}
        onChange={(e) => timeHandler("hours", e.target.value)}
        placeholder="00"
        type="number"
        value={initial.hours}
      />
      <span>:</span>
      <input
        max={60}
        ref={minutesInputRef}
        onChange={(e) => timeHandler("minutes", e.target.value)}
        placeholder="00"
        type="number"
        value={initial.minutes}
      />
    </div>
  );
};

export default TimeInput;
