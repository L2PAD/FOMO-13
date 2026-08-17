import React from "react";
import { CloseIcon } from "../Icons";
import {
  AddButton,
  CloseCreateCard,
  CreateCardActions,
  CreateCardWrapper,
  HeaderInput,
} from "./styles";

const CreateTask = () => {
  return (
    <CreateCardWrapper variant="default">
      <HeaderInput type="text" placeholder="Enter name..." />
      <CreateCardActions>
        <AddButton>Add card</AddButton>
        <CloseCreateCard>
          <CloseIcon fill="#738094" />
        </CloseCreateCard>
      </CreateCardActions>
    </CreateCardWrapper>
  );
};

export default CreateTask;
