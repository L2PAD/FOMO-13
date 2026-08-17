/* eslint-disable */
import React, { FC, useContext } from "react";
import EventItem from "./EventItem/EventItem";
import Header from "./Header";
import { ITask } from "../../../../../types/global_types";
import { CardsWrapper, TableWrapper } from "./styles";

export interface EventTableInterface {
  tasks: Array<{ date: Date; tasks: Array<ITask> }>;
  openTaskDetails?: (item: ITask) => void;
}

const TaskTable: FC<EventTableInterface> = ({ tasks, openTaskDetails }) => {
  return (
    <TableWrapper>
      <Header />
      <CardsWrapper>
        {tasks?.map((item: { date: Date; tasks: Array<ITask> }) => {
          return item?.tasks?.map((item: ITask, i: number) => {
            return (
              <EventItem
                openTaskDetails={openTaskDetails}
                key={item._id}
                item={item}
              />
            );
          });
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default TaskTable;
