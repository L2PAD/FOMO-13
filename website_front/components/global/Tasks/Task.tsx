import React from "react";
import { useSelector } from "react-redux";
import { CalendarIcon, EditIcon, TrashIcon } from "../Icons";
import { authState } from "../../../store/slices/authSlice";
import imageLoader from "../../../helpers/imageLoader";
import {
  CardActionsWrapper,
  CardDescription,
  CardImg,
  CardWrapper,
  HeaderCardWrapper,
  HeaderInput,
  Wrapper,
} from "./styles";

const Task = (props: any) => {
  const { isLogin } = useSelector(authState);

  return (
    <Wrapper draggable {...props} className="task-item">
      <CardWrapper>
        <HeaderCardWrapper>
          <HeaderInput
            type="text"
            placeholder="Enter name..."
            // eslint-disable-next-line react/destructuring-assignment
            value={props.title}
            readOnly
          />
          {true && (
            <button onClick={props.updateModal}>
              <EditIcon fill="#00C099" />
            </button>
          )}
        </HeaderCardWrapper>
        <CardActionsWrapper>
          <div>
            <button>
              <CalendarIcon fill="#070B35" />
            </button>
            <button>{/* <CircleCheckIcon fill='#00C099' /> */}</button>
          </div>
          <button onClick={() => props.confirmDeleteTask(props.id)}>
            <TrashIcon fill="#FF5858" />
          </button>
        </CardActionsWrapper>
        <CardDescription>{props.description}</CardDescription>
        {props?.img ? (
          <CardImg>
            <img src={imageLoader(props.img)} alt={props.title} />
          </CardImg>
        ) : (
          <></>
        )}
      </CardWrapper>
    </Wrapper>
  );
};

export default Task;
