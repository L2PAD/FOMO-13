import React, { FC } from "react";
import {
  Card,
  CardEdit,
  List,
  LogoImage,
  LogoInput,
  LogoInputLabel,
  LogoWrapper,
  NameInput,
  Wrapper,
} from "./styles";
import imageLoader from "../../../../../../../helpers/imageLoader";
import { IEditProps } from "../Achievements";
import { IProjectCollaborator } from "../../../../../../../types/global_types";
import CreateButton from "../../../../../../global/common/CreateButton";
import { generateId } from "../../../../../../../helpers/generateId";
import FakeLogo from "../../../../../../global/Icons/FakeLogo";
import { CloseIcon } from "../../../../../../global/Icons";
import { readFileAsBase64 } from "../../../../../../../helpers/readFileAsBase64";
import EmptySection from "../../../../../../global/EmptySection";

const partners = [
  {
    value: "Audius",
    img: "/7d72cdcd0e225d08e6e3cff56a5f6224.png",
  },
  {
    value: "Raydium",
    img: "/3103e4b666bda777471aa6e99e78978a.png",
  },
  {
    value: "Serum",
    img: "/b4645038cd4a53fd723d2d5692201fe6.png",
  },
  {
    value: "Phantom",
    img: "/c9982e558c117e86a2cde0c34d982aca.png",
  },
  {
    value: "Star Atlas",
    img: "/66bf5f99941b2baae478b7fdde7c3f29.png",
  },
  {
    value: "Mango Markets",
    img: "/416e3a2065c606330d9e97fc19c19c8d.png",
  },
  {
    value: "Solanium",
    img: "/a1c10d6216d050870b65a457fef9ebd5.png",
  },
  {
    value: "Tulip Protocol",
    img: "/446fa2c1dbcd2e2da97054d6fe8a4ddb.png",
  },
];

const Partners: FC<IEditProps> = ({
  project,
  projectDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const list: Array<IProjectCollaborator> = isEditState
    ? projectDataToUpdate?.collaborators || []
    : project.collaborators || [];

  const addCard = (): void => {
    inputsHandler &&
      inputsHandler(
        "collaborators",
        list
          ? [...list, { id: generateId(), value: "", img: "" }]
          : [{ id: generateId(), value: "", img: "" }]
      );
  };

  const removeInput = (id: string): void => {
    list &&
      inputsHandler &&
      inputsHandler(
        "collaborators",
        list.filter((item, i: number) => {
          return item.id !== id;
        })
      );
  };

  const textInputHandler = (id: string, name: string, value: any): void => {
    if (!list) return;

    const updatedLinks: Array<IProjectCollaborator> = list.map(
      (item: IProjectCollaborator) => {
        if (item.id === id) {
          return { ...item, [name]: value };
        }

        return item;
      }
    );

    inputsHandler && inputsHandler("collaborators", updatedLinks);
  };

  const fileInputHandler = async (
    id: string,
    name: string,
    value: any
  ): Promise<void> => {
    if (!list) return;

    const img: string = await readFileAsBase64(value);

    const updatedLinks: Array<IProjectCollaborator> = list.map(
      (item: IProjectCollaborator) => {
        if (item.id === id) {
          return { ...item, [name]: img };
        }

        return item;
      }
    );

    inputsHandler && inputsHandler("collaborators", updatedLinks);
  };

  return (
    <Wrapper variant="main">
      <List>
        {list.length ? (
          list.map((item, i: number) => {
            if (isEditState) {
              return (
                <CardEdit key={i}>
                  <LogoWrapper>
                    <div>
                      {item.img ? (
                        <LogoImage
                          //@ts-ignore
                          src={item?.img}
                          alt="logo"
                        />
                      ) : (
                        <FakeLogo />
                      )}
                      <LogoInput
                        id="logo-input"
                        name="logo"
                        type="file"
                        onChange={(event: any) => {
                          if (event.target.files) {
                            fileInputHandler(
                              item.id,
                              "img",
                              event.target.files[0]
                            );
                          }
                        }}
                      />
                    </div>
                  </LogoWrapper>
                  <NameInput
                    value={item.value}
                    onChange={(e: any) =>
                      textInputHandler(item.id, "value", e.target.value)
                    }
                    placeholder="Enter name of partner or collaborator"
                  />
                  <NameInput
                    value={item.link}
                    onChange={(e: any) =>
                      textInputHandler(item.id, "link", e.target.value)
                    }
                    placeholder="Enter link of partner or collaborator"
                  />
                  <button
                    onClick={() => removeInput(item.id)}
                    className="remove-btn"
                  >
                    <CloseIcon fill="var(--main-gray)" />
                  </button>
                </CardEdit>
              );
            }
            return (
              <Card target="_blank" href={item.link} key={i}>
                <img src={item.img} alt={item.value} />
                <div>{item.value}</div>
              </Card>
            );
          })
        ) : (
          <EmptySection />
        )}
      </List>
      {isEditState ? (
        <>
          <br />
          <CreateButton type="add" onClick={addCard}>
            Add partner
          </CreateButton>
        </>
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default Partners;
