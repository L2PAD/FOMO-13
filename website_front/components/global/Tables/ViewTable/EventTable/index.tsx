/* eslint-disable */
import React, { FC } from "react";
import EventItem from "./EventItem/EventItem";
import Header from "./Header";
import { IEvent } from "../../../../../types/global_types";
import { CardsWrapper, TableWrapper } from "./styles";

export interface EventTableInterface {
  events: Array<{ date: Date; events: Array<IEvent> }>;
}

const EventTable: FC<EventTableInterface> = ({ events }) => {
  return (
    <TableWrapper>
      <Header />
      <CardsWrapper>
        {events?.map((item: { date: Date; events: Array<IEvent> }) => {
          return item?.events?.map((item: IEvent, i: number) => {
            return <EventItem key={item._id} item={item} />;
          });
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default EventTable;
