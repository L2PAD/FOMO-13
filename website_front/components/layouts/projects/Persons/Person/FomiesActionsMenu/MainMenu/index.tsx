import React, { FC } from "react";
import styled from "styled-components";
import { useTranslation } from "i18n";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  button {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 100%;
    text-align: center;
  }

  & .red-btn {
    color: #ff5858;
    font-weight: var(--font-weight-semibold);
  }
`;

interface IProps {
  onClose: () => void;
  onBlock: () => void;
  onReport: () => void;
}

const MainMenu: FC<IProps> = ({ onClose, onBlock, onReport }) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper>
      <button onClick={onBlock} className="red-btn">
        {translateText("Block")}
      </button>
      <button onClick={onReport} className="red-btn">
        {translateText("Report")}
      </button>
      <button>{translateText("Share to...")}</button>
      <button onClick={onClose}>{translateText("Cancel")}</button>
    </Wrapper>
  );
};

export default MainMenu;
