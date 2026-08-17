import { useState, useEffect } from "react";

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const interval = MINUTE;

const parseDate = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
};

export default function useDates(deadline?: string, time?: string) {
  const [timespan, setTimespan] = useState<number>(0);

  useEffect(() => {
    if (!deadline || !time) return;

    const update = () => {
      const deadlineDate = parseDate(new Date(deadline), time);
      setTimespan(deadlineDate.getTime() - Date.now());
    };

    update(); // initial set

    const intervalId = setInterval(() => {
      update();
    }, interval);

    return () => clearInterval(intervalId);
  }, [deadline, time]);

  return {
    days: Math.floor(timespan / DAY),
    hours: Math.floor((timespan / HOUR) % 24),
    minutes: Math.floor((timespan / MINUTE) % 60),
    seconds: Math.floor((timespan / SECOND) % 60),
  };
}
