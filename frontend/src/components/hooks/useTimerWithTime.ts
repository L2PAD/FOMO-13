import { useState, useEffect } from "react";

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const parceDate = (currentDate:any,currentTime:any) : any => {
  const [date, time] = currentDate.split('T');
  const [year, month, day] = date.split('-');
  const [hours, minutes, seconds] = time.split(/:|\.|Z/);
  const [timeHours, timeMinutes] = currentTime.split(':');

  const endDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
  );
  endDate.setHours(parseInt(timeHours));
  endDate.setMinutes(parseInt(timeMinutes));

  return endDate
}


export default function useTimer(deadline:Date | string, time:any,interval = SECOND) {
  const [timespan, setTimespan] = useState<any>(new Date(deadline).getTime() - Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimespan((_timespan:any) => _timespan - interval);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [interval]);

  useEffect(() => {
    setTimespan(parceDate(deadline,time) - Date.now());
  }, [deadline]);

  return {
    days: Math.floor(timespan / DAY),
    hours: Math.floor((timespan / HOUR) % 24),
    minutes: Math.floor((timespan / MINUTE) % 60),
    seconds: Math.floor((timespan / SECOND) % 60)
  };
}