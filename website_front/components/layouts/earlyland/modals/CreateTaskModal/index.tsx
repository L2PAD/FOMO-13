/* eslint-disable */
import React, { FC, useContext, useRef, useState } from "react";
import Modal from "../../../../global/common/Modal";
import { ActionsWrapper } from "../../../projects/modals/CustomizeTabModal/styles";
import { CloseIcon } from "../../../../global/Icons";
import {
  ContentWrapper,
  ImageUploadButton,
  ImageWrapper,
  RemovePhotoButton,
  TaskStatus,
} from "./styles";
import createBoard from "../../../../../http/board/createBoard";
import { LoadingContext } from "../../../../global/Layout";
import { toast } from "react-toastify";
import createTask from "../../../../../http/board/createTask";

interface Props {
  onClose: () => void;
  index: 0 | 1 | 2;
  boardId: string;
  refetch: any;
  isInvitedUser?: boolean;
}

const CreateTaskModal: FC<Props> = ({
  onClose,
  index,
  boardId,
  refetch,
  isInvitedUser,
}) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const [name, setName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [image, setImage] = useState<any>();
  const [imgFile, setImgFile] = useState<File>();

  const hiddenFileInput = useRef(null);

  const handleClick = () => {
    // @ts-ignore
    hiddenFileInput.current.click();
  };

  const handleChange = (event: any) => {
    const file = URL.createObjectURL(event.target.files[0]);
    setImgFile(event.target.files[0]);
    setImage(file);
  };

  const confirmCreateTask = async (): Promise<void> => {
    loadingStateHandler(true);

    const { isSuccess } = await createTask(
      {
        title: name,
        description: text,
        img: imgFile || "",
        status: index,
        isInviteUser: isInvitedUser,
      },
      boardId
    );

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Task created!</p>
        </div>
      );
      refetch();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Something went wrong...</p>
        </div>
      );
    }
    onClose();
    loadingStateHandler(false);
  };

  return (
    <Modal title="Task creating" onClose={onClose} variant="small">
      <ContentWrapper>
        <p>Task name</p>
        <input
          type={"text"}
          value={name}
          onChange={(e: any) => setName(e.target.value)}
        />
        <TaskStatus type={index}></TaskStatus>
      </ContentWrapper>
      <ContentWrapper>
        <p>Description</p>
        <textarea value={text} onChange={(e: any) => setText(e.target.value)} />
      </ContentWrapper>

      <ContentWrapper>
        <p>Image</p>
        {!image && (
          <ImageUploadButton onClick={handleClick}>
            + Add image
          </ImageUploadButton>
        )}
        {!image && (
          <input
            type="file"
            ref={hiddenFileInput}
            style={{ display: "none" }}
            onChange={handleChange}
          />
        )}
        {image && (
          <ImageWrapper>
            <img src={image} alt="" />
          </ImageWrapper>
        )}
        {image && (
          <RemovePhotoButton onClick={() => setImage(null)}>
            <CloseIcon fill="#FF5858" /> Remove image
          </RemovePhotoButton>
        )}
      </ContentWrapper>
      <ActionsWrapper>
        <button onClick={confirmCreateTask}>Save</button>
      </ActionsWrapper>
    </Modal>
  );
};

export default CreateTaskModal;
