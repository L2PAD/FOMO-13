import React, { FC } from "react";
import styled from "styled-components";
import {
  IPersonAchievements,
  IPersonInfoBlock,
} from "../../../../../../types/global_types";
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
  gap: 12px;

  button {
    max-width: fit-content;
  }
`;

const InputsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 4px;
  border-left: 2px solid #b5bcc7;

  input {
    padding: 8px;
    background: white;
    border-radius: 8px;
    border: none;
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

const HeaderItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
`;

const HeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  & .key {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    width: 140px;
  }

  & .input-wrapper {
    position: relative;
    width: 100%;

    input {
      padding: 8px 24px;
      background: white;
      border-radius: 8px;
      border: none;
      width: 100%;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);

      &::placeholder {
        font-weight: var(--font-weight-regular);
        color: var(--main-gray);
      }
    }

    & .left-key {
      position: absolute;
      top: 9px;
      left: 8px;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      color: var(--main-gray);
    }
  }
`;

const ListTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 100%;
  margin-bottom: 12px;
`;

interface IProps {
  item: IPersonAchievements | null;
  onChange: (items: IPersonAchievements) => void;
}

const EditAchievements: FC<IProps> = ({ item, onChange }) => {
  const addItem = (): void => {
    const updatedItem: IPersonAchievements = item
      ? {
          ...item,
          deals: [...item.deals, ""],
        }
      : {
          totalInvestments: "",
          highestRoi: "",
          deals: [""],
        };

    onChange(updatedItem);
  };

  const removeItem = (id: number): void => {
    if (!item) return;

    const updatedItem: IPersonAchievements = {
      ...item,
      deals: item.deals.filter((item, i: number) => id !== i),
    };

    onChange(updatedItem);
  };

  const inputsHandler = (name: string, value: string): void => {
    if (!item) return;

    const updatedItem: IPersonAchievements = {
      ...item,
      [name]: value,
    };

    onChange(updatedItem);
  };

  const listInputsHandler = (value: string, id: number): void => {
    if (!item) return;

    const updatedItem: IPersonAchievements = {
      ...item,
      deals: item.deals.map((item: string, key: number) => {
        if (key === id) return value;

        return item;
      }),
    };

    onChange(updatedItem);
  };

  return (
    <Wrapper variant="main">
      <HeaderItems>
        <HeaderItem>
          <div className="key">Total Investments:</div>
          <div className="input-wrapper">
            <div className="left-key">$</div>
            <input
              placeholder="Enter amount"
              value={item?.highestRoi}
              onChange={(e: any) => inputsHandler("highestRoi", e.target.value)}
            />
          </div>
        </HeaderItem>
        <HeaderItem>
          <div className="key">Highest ROI:</div>
          <div className="input-wrapper">
            <div className="left-key">+</div>
            <input
              placeholder="Enter amount (%)"
              value={item?.totalInvestments}
              onChange={(e: any) =>
                inputsHandler("totalInvestments", e.target.value)
              }
            />
          </div>
        </HeaderItem>
      </HeaderItems>
      <ListTitle>Notable Deals:</ListTitle>
      <ListWrapper>
        {item?.deals.map((item: string, i: number) => {
          return (
            <BlockItem key={i}>
              <input
                onChange={(e: any) => listInputsHandler(e.target.value, i)}
                placeholder="Key deal or funding milestone"
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

export default EditAchievements;
