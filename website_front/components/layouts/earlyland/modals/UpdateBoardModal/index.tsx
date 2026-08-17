/* eslint-disable */
import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import ModalSelectProject from "../../../../global/modal_select-project";
import fetchProjects from "../../../../../http/projects/fetchProjects";
import Modal from "../../../../global/common/Modal";
import { ActionsWrapper } from "../../../projects/modals/CustomizeTabModal/styles";
import { CloseIcon } from "../../../../global/Icons";
import { LoadingContext } from "../../../../global/Layout";
import { IBoard, IProject } from "../../../../../types/global_types";
import updateBoard from "../../../../../http/board/updateBoard";
import {
  ContentWrapper,
  ImageUploadButton,
  ImageWrapper,
  RemovePhotoButton,
} from "./styles";

interface Props {
  onClose: () => void;
  refetch: any;
  boardData: IBoard | undefined;
}

const UpdateBoardModal: FC<Props> = ({ onClose, refetch, boardData }) => {
  const { data } = useQuery("board-projects", () =>
    fetchProjects("all/active")
  );
  const [selectedProject, setSelectedProject] = useState<
    IProject | undefined
  >();
  const { loadingStateHandler } = useContext(LoadingContext);
  const [name, setName] = useState<string>("");
  const [image, setImage] = useState<any>();
  const [imgFile, setImgFile] = useState<File | string>("");
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

  const confirmUpdateBoard = async (): Promise<void> => {
    loadingStateHandler(true);

    const data: any = {
      name,
    };

    if (imgFile && typeof imgFile !== "string") data.img = imgFile;
    if (selectedProject?._id) data.projectId = selectedProject._id;

    const { isSuccess } = await updateBoard(data, boardData?._id || "");

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Board updated!</p>
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

  useEffect(() => {
    if (boardData) {
      setName(boardData.name);
      setImgFile(boardData.img || "");
      setSelectedProject(boardData.project);
    }
  }, [boardData]);

  return (
    <Modal title="Board update" onClose={onClose} variant="small">
      <ContentWrapper>
        <p>Board name</p>
        <input
          type={"text"}
          value={name}
          onChange={(e: any) => setName(e.target.value)}
        />
      </ContentWrapper>
      <ContentWrapper>
        <ModalSelectProject
          label={"Project"}
          project={
            selectedProject
              ? selectedProject
              : data?.projects && data?.projects[0]
          }
          items={data?.projects || []}
          onChange={(value: any) => setSelectedProject(value)}
        />
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
        <button onClick={confirmUpdateBoard}>Save</button>
      </ActionsWrapper>
    </Modal>
  );
};

export default UpdateBoardModal;
