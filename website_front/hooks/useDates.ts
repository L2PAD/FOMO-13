import { useState, useEffect } from "react";

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const interval = MINUTE;

const parceDate = (date: Date, time: string): Date => {
  const hours = Number(time.split(":")[0]);
  const minutes = Number(time.split(":")[1]);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes
  );
};

export default function useDates(deadline: string, time: string, state = true) {
  const [timespan, setTimespan] = useState<any>();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimespan((_timespan: any) => _timespan - interval);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [interval]);

  useEffect(() => {
    setTimespan(parceDate(new Date(deadline), time).getTime() - Date.now());
  }, [deadline]);

  return {
    days: Math.floor(timespan / DAY),
    hours: Math.floor((timespan / HOUR) % 24),
    minutes: Math.floor((timespan / MINUTE) % 60),
    seconds: Math.floor((timespan / SECOND) % 60),
  };
}
