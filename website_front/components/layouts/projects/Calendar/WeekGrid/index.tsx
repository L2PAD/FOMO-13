import React, { FC } from "react";
import { IEvent } from "../../../../../types/global_types";
import {
  BodyCell,
  BodyCells,
  ContentWrapper,
  HeaderWrapper,
  TimeInfo,
  WeekDayCell,
  Wrapper,
} from "./styles";
import moment from "moment";
import WeekCalendarItem from "../WeekItem/CalendarItem";

interface IProps {
  weekDays: Array<{
    date: Date;
    events: Array<IEvent>;
    isCurrentMonth: boolean;
    isTodayMonth: boolean;
  }>;
}

const times = [
  "",
  "7AM",
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12AM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
  "9PM",
];

const WeekGrid: FC<IProps> = ({ weekDays }) => {
  const schedule = weekDays.map((day) => {
    const daySchedule = times.slice(1).map((time) => ({
      date: day.date,
      time,
      events: [] as IEvent[],
    }));

    day.events.forEach((event) => {
      const eventStart = moment(event.date).startOf("minute");
      const eventEnd = moment(event.endDate).endOf("minute");
      const currentDay = moment(day.date).startOf("day");

      let eventTime = correctTimeFormat(event.time);
      let eventEndTime = event.endTime
        ? correctTimeFormat(event.endTime)
        : null;

      const minTime = correctTimeFormat("7AM");
      const maxTime = correctTimeFormat("9PM");

      if (eventTime.isBefore(minTime)) {
        eventTime = minTime; // Сдвигаем начало к 7AM
      }
      if (eventEndTime && eventEndTime.isAfter(maxTime)) {
        eventEndTime = maxTime; // Сдвигаем конец к 9PM
      }
      const isAllDay = event.endTime === "00:00" && event.time === "00:00";

      if (
        eventStart.isSameOrBefore(currentDay, "day") &&
        eventEnd.isSameOrAfter(currentDay, "day")
      ) {
        daySchedule.forEach((slot) => {
          const slotTime = correctTimeFormat(slot.time);

          // Проверка начала и конца события
          const isStart = !!(
            eventEndTime &&
            slotTime.isSameOrAfter(eventTime) &&
            slotTime.isBefore(moment(eventTime).add(1, "hour"))
          );
          const isEnd =
            eventEndTime &&
            slotTime.isSameOrAfter(moment(eventEndTime).subtract(1, "hour")) &&
            slotTime.isBefore(eventEndTime);

          if (
            eventEndTime &&
            slotTime.isBetween(eventTime, eventEndTime, "minute", "[)")
          ) {
            slot.events.push({ ...event, isStart, isEnd: !!isEnd });
          } else if (!eventEndTime && slotTime.isSame(eventTime, "minute")) {
            slot.events.push({ ...event, isStart });
          } else if (isAllDay) {
            slot.events.push({ ...event, isStart, isEnd: !!isEnd });
          }
        });
      }
    });

    return daySchedule;
  });

  function correctTimeFormat(time: string): moment.Moment {
    if (time === "12AM") return moment("12:00", "HH:mm");
    return moment(time, "hA");
  }

  return (
    <Wrapper>
      <TimeInfo>
        {times.map((item: string) => (
          <div key={item} className="time-cell">
            {item}
          </div>
        ))}
      </TimeInfo>
      <ContentWrapper>
        <HeaderWrapper>
          {weekDays.map((item) => (
            <WeekDayCell
              isCurrentDay={item.isTodayMonth}
              isCurrentMonth={item.isCurrentMonth}
              key={item.date.toString()}
            >
              {moment(item.date).format("ddd")}
              <span>{moment(item.date).format("D")}</span>
            </WeekDayCell>
          ))}
        </HeaderWrapper>
        <BodyCells>
          {schedule.map((day: any, index: number) => (
            <div key={index} className="day-column">
              {day.map((slot: any) => (
                <BodyCell key={`${day.date}-${slot.time}`}>
                  {slot.events?.length > 0 ? (
                    <WeekCalendarItem index={index} event={slot.events[0]} />
                  ) : (
                    <></>
                  )}
                </BodyCell>
              ))}
            </div>
          ))}
        </BodyCells>
      </ContentWrapper>
    </Wrapper>
  );
};

export default WeekGrid;
