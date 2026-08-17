import React, { FC } from "react";
import styled from "styled-components";
import { DetailsTitle } from "../AboutPerson/styles";
import BaseCard from "../../../../../global/common/BaseCard";
import CreateButton from "../../../../../global/common/CreateButton";
import { CloseIcon } from "../../../../../global/Icons";

const Wrapper = styled(BaseCard)`
  width: 100%;
`;

const ListWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  button {
    max-width: fit-content;
  }
`;

const BlockItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  input {
    width: 100%;
    padding: 8px;
    background: white;
    border-radius: 8px;
    border: none;
  }
`;

interface IProps {
  header: "contributionsBlock" | "networkBlock" | "influenceBlock";
  items: Array<string>;
  onChange: (items: Array<string>) => void;
}

const PersonEditRow: FC<IProps> = ({ header, items, onChange }) => {
  const getTitle = (): React.ReactNode => {
    if (header === "contributionsBlock") {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
          >
            <path
              d="M14.8239 2.89844L16.6542 7.84465L21.6004 9.67491L16.6542 11.5052L14.8239 16.4514L12.9937 11.5052L8.04745 9.67491L12.9937 7.84465L14.8239 2.89844Z"
              stroke="#070B35"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M6.35333 14.1926L7.95216 16.5467L10.3063 18.1455L7.95216 19.7443L6.35333 22.0984L4.75451 19.7443L2.40039 18.1455L4.75451 16.5467L6.35333 14.1926Z"
              stroke="#070B35"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          Major Contributions
        </>
      );
    }

    if (header === "networkBlock") {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
          >
            <path
              d="M17 14.5H14"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.211 10.7411L12.5102 11.4231C12.376 11.4757 12.232 11.5019 12.0868 11.4999C11.9416 11.4979 11.7984 11.4679 11.6659 11.4117C11.5314 11.3547 11.4103 11.273 11.3094 11.1712C11.2085 11.0695 11.1299 10.9497 11.0781 10.8189C10.9762 10.5702 10.9739 10.2947 11.0719 10.0446C11.1698 9.79443 11.3611 9.58712 11.6094 9.46198L13.3094 8.65711C13.4932 8.5667 13.695 8.51399 13.9017 8.50243C14.1083 8.49086 14.3152 8.52069 14.509 8.58998L18 9.89549"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 14.7583H8.23503L10.5885 16.3129C10.6986 16.4206 10.8527 16.4871 11.0183 16.4983C11.1839 16.5095 11.3481 16.4646 11.4762 16.373L14.7645 14.0217C14.8944 13.9286 14.9775 13.7954 14.996 13.6502C15.0146 13.505 14.9673 13.3593 14.864 13.2438L13.0524 11.5"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 9.16585L10.8217 8.92327C10.645 8.70413 10.4378 8.56448 10.2199 8.51757C10.002 8.47066 9.78062 8.51805 9.57669 8.65523L7 10.5"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 15.4987H6.06736C6.30135 15.5116 6.53079 15.4287 6.70555 15.268C6.8803 15.1074 6.98616 14.8821 7 14.6415V10.3577C6.98597 10.1172 6.88002 9.89214 6.70529 9.73169C6.53056 9.57123 6.30123 9.48841 6.06736 9.50131H4"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 15.4987H17.9326C17.6986 15.5116 17.4692 15.4287 17.2945 15.268C17.1197 15.1074 17.0138 14.8821 17 14.6415V10.3577C17.014 10.1172 17.12 9.89214 17.2947 9.73169C17.4694 9.57123 17.6988 9.48841 17.9326 9.50131H20"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 12.5C3 14.8869 3.94821 17.1761 5.63604 18.864C7.32387 20.5518 9.61305 21.5 12 21.5C14.3869 21.5 16.6761 20.5518 18.364 18.864C20.0518 17.1761 21 14.8869 21 12.5C21 10.1131 20.0518 7.82387 18.364 6.13604C16.6761 4.44821 14.3869 3.5 12 3.5C9.61305 3.5 7.32387 4.44821 5.63604 6.13604C3.94821 7.82387 3 10.1131 3 12.5Z"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Strategic Partnerships
        </>
      );
    }

    if (header === "influenceBlock") {
      return (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
          >
            <path
              d="M16.0258 21.0713L16.0261 17.8576C16.0263 16.0824 14.5872 14.6432 12.812 14.6432H5.61481C3.83987 14.6432 2.40095 16.082 2.40075 17.8569L2.40039 21.0713M21.6001 21.0715L21.6004 17.8577C21.6005 16.0825 20.1615 14.6434 18.3863 14.6434M15.4067 4.56109C16.196 5.14673 16.7075 6.08559 16.7075 7.14392C16.7075 8.20225 16.196 9.1411 15.4067 9.72674M12.4942 7.14374C12.4942 8.91882 11.0552 10.3578 9.28013 10.3578C7.50506 10.3578 6.06608 8.91882 6.06608 7.14374C6.06608 5.36867 7.50506 3.92969 9.28013 3.92969C11.0552 3.92969 12.4942 5.36867 12.4942 7.14374Z"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Social Media Influence
        </>
      );
    }
  };

  const getPlaceholders = (): string => {
    if (header === "contributionsBlock") {
      return "Describe a milestone, award, or notable result";
    }

    if (header === "networkBlock") {
      return "Describe a strategic relationship or role";
    }

    return "Describe a public role, community position, or platform with social reach";
  };

  const addItem = (): void => {
    const updatedItems: Array<string> = [...items, ""];

    onChange(updatedItems);
  };

  const removeItem = (id: number): void => {
    const updatedItems: Array<string> = items.filter(
      (_, i: number) => i !== id
    );

    onChange(updatedItems);
  };

  const inputsHandler = (value: string, id: number): void => {
    const updatedItems: Array<string> = items.map((item: string, i: number) => {
      if (i === id) {
        return value;
      }

      return item;
    });

    onChange(updatedItems);
  };

  return (
    <Wrapper variant="main">
      <DetailsTitle style={{ marginBottom: "20px" }}>{getTitle()}</DetailsTitle>
      <ListWrapper>
        {items.map((item: string, i: number) => {
          return (
            <BlockItem key={i}>
              <input
                onChange={(e: any) => inputsHandler(e.target.value, i)}
                placeholder={getPlaceholders()}
                value={item}
              />
              <button onClick={() => removeItem(i)} className="remove-btn">
                <CloseIcon fill="var(--main-gray)" />
              </button>
            </BlockItem>
          );
        })}
        <CreateButton type="add" onClick={addItem}>
          Add info
        </CreateButton>
      </ListWrapper>
    </Wrapper>
  );
};

export default PersonEditRow;
