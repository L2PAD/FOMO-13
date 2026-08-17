import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { FomiesDataContext } from "../../../../../../../pages/crypto/fomies/[id]";
import { useTranslation } from "i18n";

interface IProps {
  onBack: () => void;
}

const Wrapper = styled.div`
  margin: 20px 0;
  h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
  }

  div {
    margin-top: 12px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    margin-bottom: 20px;
  }

  & .buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;

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
  }
`;

const BlockInfo = styled.div``;

const BlockMenu: FC<IProps> = ({ onBack }) => {
  const { translateText } = useTranslation();
  const [isBlock, setIsBlock] = useState<boolean>(false);
  const personData = useContext(FomiesDataContext);

  return (
    <Wrapper>
      {isBlock ? (
        <BlockInfo>
          <h3>{personData.name || ""} {translateText("is blocked")}</h3>
          <div>{translateText("You can unblock them anytime from their profile")}</div>
          <div className="buttons">
            <button onClick={onBack}>{translateText("Dismiss")}</button>
          </div>
        </BlockInfo>
      ) : (
        <>
          <h3>{translateText("Block")} {personData.name || ""}?</h3>
          <div>
            {translateText("They will not be able to view your profile, activity, or interact with you on the site. And nope, we will not tell them.")}
          </div>
          <div className="buttons">
            <button onClick={() => setIsBlock(true)} className="red-btn">
              {translateText("Block")}
            </button>
            <button onClick={onBack}>{translateText("Cancel")}</button>
          </div>
        </>
      )}
    </Wrapper>
  );
};

export default BlockMenu;
