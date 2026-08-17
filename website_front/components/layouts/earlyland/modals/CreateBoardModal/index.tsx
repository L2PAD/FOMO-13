/* eslint-disable */
import React, { FC, useContext, useRef, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import Modal from "../../../../global/common/Modal";
import { CloseIcon } from "../../../../global/Icons";
import createBoard from "../../../../../http/board/createBoard";
import { LoadingContext } from "../../../../global/Layout";
import ModalSelectProject from "../../../../global/modal_select-project";
import fetchProjects from "../../../../../http/projects/fetchProjects";
import { ActionsWrapper } from "../../../projects/modals/CustomizeTabModal/styles";
import {
  ContentWrapper,
  ImageUploadButton,
  ImageWrapper,
  RemovePhotoButton,
} from "./styles";
import { IProject } from "../../../../../types/global_types";

interface Props {
  onClose: () => void;
  refetch: any;
}

const CreateBoardModal: FC<Props> = ({ onClose, refetch }) => {
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

  const confirmCreateBoard = async (): Promise<void> => {
    if (!selectedProject && !data?.projects && !data?.projects[0]) return;

    const projectId: string =
      selectedProject?._id || data?.projects[0]._id || "";

    loadingStateHandler(true);

    const { isSuccess } = await createBoard({
      name,
      img: imgFile || "",
      projectId,
    });

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Board created!</p>
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
    <Modal title="Board creating" onClose={onClose} variant="small">
      <ContentWrapper>
        <p>Board name</p>
        <input
          type={"text"}
          value={name}
          onChange={(e: any) => setName(e.target.value)}
        />
      </ContentWrapper>
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
        <button onClick={confirmCreateBoard}>Save</button>
      </ActionsWrapper>
    </Modal>
  );
};

export default CreateBoardModal;
