import React, { FC } from "react";
import { IProject, IUploadImg } from "../../../../../../types/global_types";
import imageLoader from "../../../../../../helpers/imageLoader";
import AboutProject from "../About";
import { ImagesItems, ProjectImages, Wrapper } from "./styles";
import { Title } from "../Fundraising/styles";
import TeamTab from "../Team";
import AboutProjectEdit from "../AboutEdit";
import ImageUpload from "../../../../../global/common/ImageUpload";
import EmptyList from "../../../../../global/EmptyList";
import EmptySection from "../../../../../global/EmptySection";
import { readFileAsBase64 } from "../../../../../../helpers/readFileAsBase64";
import CreateButton from "../../../../../global/common/CreateButton";
import { CloseIcon } from "../../../../../global/Icons";
import { generateId } from "../../../../../../helpers/generateId";
import ImagesSwiper from "../../../../../global/ImagesSwiper";
import { useTranslation } from "i18n";

interface IProps {
  isEditState: boolean;
  project: IProject;
  projectDataToUpdate: IProject | null;
  inputsHandler: (name: string, value: any) => void;
  openKeyMembersModal: () => void;
  openAdvisorsModal: () => void;
  dropstabDescription?: {
    short?: string;
    full?: string;
    paragraphs?: string[];
  } | null;
}

const ProjectHub: FC<IProps> = ({
  project,
  isEditState,
  projectDataToUpdate,
  inputsHandler,
  openKeyMembersModal,
  openAdvisorsModal,
  dropstabDescription,
}) => {
  const { translateText } = useTranslation();
  const isGeneralContentEditState: boolean = false;

  const imagesHandler = async (id: string, img: File): Promise<void> => {
    const imageString: string = await readFileAsBase64(img);

    const updatedImages: Array<IUploadImg> = projectDataToUpdate
      ?.descriptionImagesToUpdate?.length
      ? projectDataToUpdate.descriptionImagesToUpdate.map(
          (item: IUploadImg) => {
            if (item.id === id) {
              return { ...item, img: imageString };
            }

            return item;
          }
        )
      : [{ id: generateId(), img: imageString }];

    inputsHandler("descriptionImagesToUpdate", updatedImages);
  };

  const addImage = (): void => {
    const updatedImages: Array<IUploadImg> = projectDataToUpdate
      ?.descriptionImagesToUpdate?.length
      ? [
          ...projectDataToUpdate.descriptionImagesToUpdate,
          { id: generateId(), img: "" },
        ]
      : [
          { id: generateId(), img: "" },
          { id: generateId(), img: "" },
        ];

    inputsHandler("descriptionImagesToUpdate", updatedImages);
  };

  const removeImg = (id: string): void => {
    if (!projectDataToUpdate?.descriptionImagesToUpdate?.length) return;

    const updatedImages: Array<IUploadImg> =
      projectDataToUpdate?.descriptionImagesToUpdate.filter(
        (item: IUploadImg) => {
          return item.id !== id;
        }
      );

    inputsHandler("descriptionImagesToUpdate", updatedImages);
  };
  return (
    <Wrapper>
      <Title>{translateText("Project Hub")}</Title>
      {isGeneralContentEditState ? (
        projectDataToUpdate?.descriptionImagesToUpdate?.length ? (
          <ImagesItems>
            {projectDataToUpdate.descriptionImagesToUpdate.map(
              (item: IUploadImg, i: number) => {
                return (
                  <div key={item.id} className="img-item">
                    <ImageUpload
                      width={820}
                      height={490}
                      onChange={(img: File) => imagesHandler(item.id, img)}
                      initialImage={item.img}
                    />
                    <button
                      onClick={() => removeImg(item.id)}
                      className="remove-btn"
                    >
                      <CloseIcon fill="var(--main-gray)" />
                    </button>
                  </div>
                );
              }
            )}
            <CreateButton className="add-btn" onClick={addImage} type="add">
              {translateText("Add Slide")}
            </CreateButton>
          </ImagesItems>
        ) : (
          <ImagesItems>
            <ImageUpload
              width={820}
              height={490}
              onChange={(img: File) => imagesHandler("", img)}
              initialImage=""
            />
            <CreateButton className="add-btn" onClick={addImage} type="add">
              {translateText("Add Slide")}
            </CreateButton>
          </ImagesItems>
        )
      ) : project.descriptionImages?.length ? (
        project.descriptionImages.length > 1 ? (
          <ImagesSwiper items={project.descriptionImages} />
        ) : (
          <ProjectImages>
            <img
              src={imageLoader(project.descriptionImages[0])}
              alt={project.name}
            />
          </ProjectImages>
        )
      ) : (
        <EmptySection />
      )}
      <Title style={{ marginTop: "20px" }}>{translateText("About")} {project.name}</Title>
      {isGeneralContentEditState && projectDataToUpdate ? (
        <AboutProjectEdit
          project={projectDataToUpdate}
          inputsHandler={inputsHandler}
        />
      ) : (
        <AboutProject
          project={project}
          text={project.descriptionText}
          dropstabDescription={dropstabDescription}
        />
      )}
      <br />
      <TeamTab
        project={project}
        projectDataToUpdate={projectDataToUpdate}
        inputsHandler={inputsHandler}
        isEditState={isEditState}
        openKeyMembersModal={openKeyMembersModal}
        openAdvisorsModal={openAdvisorsModal}
      />
    </Wrapper>
  );
};

export default ProjectHub;
