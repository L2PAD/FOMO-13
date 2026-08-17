import React from "react";
import { Wrapper } from "./styles";
import DailyTasks from "../../../projects/Calendar/DailyTasks";
import CoreTasks from "./CoreTasks";

const UserTasks = () => {
  return (
    <Wrapper>
      <DailyTasks />
      <CoreTasks />
    </Wrapper>
  );
};

export default UserTasks;
