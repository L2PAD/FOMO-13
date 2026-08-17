import React, { FC } from "react";
import { ArrowDownIcon } from "../../Icons";
import styled from "styled-components";
import { useTranslation } from "i18n";

const Button = styled.button<{ isSelected: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 14px;
  color: ${({ isSelected }) => (isSelected ? "#070B35" : "#738094")} !important;
  max-width: fit-content;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 100%;
  min-height: 100%;

  span {
    display: flex;
    margin-left: 10px;
  }

  &:hover {
    color: #070b35 !important ;
  }

  &:active {
    opacity: 0.8;
  }
`;

export const ArrowWrapper = styled.div<{ state: 1 | -1 }>`
  display: flex;
  transform: ${({ state }) =>
    state === -1 ? "rotate(0deg)" : "rotate(180deg)"};
`;

interface IProps {
  state: 1 | -1;
  isSelected: boolean;
  label: string;
  onClick?: (name: string, value: 1 | -1) => any;
}

const SortButton: FC<IProps> = ({ state, isSelected, label, onClick }) => {
  const { translateText } = useTranslation();

  return (
    <Button
      isSelected={isSelected}
      onClick={() => onClick && onClick(label, state === 1 ? -1 : 1)}
    >
      {translateText(label)}
      <span>
        {isSelected ? (
          <ArrowWrapper state={state}>
            <ArrowDownIcon />
          </ArrowWrapper>
        ) : (
          <></>
        )}
      </span>
    </Button>
  );
};

export default SortButton;
