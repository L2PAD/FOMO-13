import React, { useState, useRef, useEffect, FC } from "react";
import styles from "./time-input.module.scss";

const EventTimeInput: FC<any> = ({ handler, initial }) => {
  const [time, setTime] = useState({
    hours: initial?.hours || "",
    minutes: initial?.minutes || "",
    period: initial?.period || "AM",
  });

  const minutesInputRef: any = useRef();
  const hoursInputRef: any = useRef();

  const timeValidation = (name: string, value: number) => {
    if (name === "minutes" && (value < 0 || value >= 60)) return false;
    if (name === "hours" && (value < 1 || value > 12)) return false;
    return true;
  };

  const timeHandler = (name: string, value: any) => {
    if (value.length > 2) return;

    const numericValue = parseInt(value, 10);

    if (!isNaN(numericValue) && !timeValidation(name, numericValue)) return;

    if (value.length === 0 && name === "minutes") {
      hoursInputRef.current.focus();
    }

    if (value.length > 1 && name === "hours") {
      minutesInputRef.current.focus();
    }

    setTime((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePeriod = () => {
    setTime((prev) => ({
      ...prev,
      period: prev.period === "AM" ? "PM" : "AM",
    }));
  };

  function convertTo24HourFormat(time: string): string {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (period === "AM" && hours === 12) {
      hours = 0;
    } else if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}`;
  }

  useEffect(() => {
    handler(
      convertTo24HourFormat(`${time.hours}:${time.minutes} ${time.period}`)
    );
  }, [time]);

  return (
    <div className={styles.body}>
      <input
        max={12}
        ref={hoursInputRef}
        onChange={(e) => timeHandler("hours", e.target.value)}
        placeholder="00"
        type="number"
        value={time.hours}
      />
      <span>/</span>
      <input
        max={59}
        ref={minutesInputRef}
        onChange={(e) => timeHandler("minutes", e.target.value)}
        placeholder="00"
        type="number"
        value={time.minutes}
      />
      <button onClick={togglePeriod} className={styles.periodButton}>
        {time.period}
      </button>
    </div>
  );
};

export default EventTimeInput;
