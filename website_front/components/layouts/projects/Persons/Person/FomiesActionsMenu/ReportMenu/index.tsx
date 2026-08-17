import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { FomiesDataContext } from "../../../../../../../pages/crypto/fomies/[id]";
import { CloseIcon } from "../../../../../../global/Icons";

interface IProps {
  onBack: () => void;
  onClose: () => void;
  updateStep: (step: string) => void;
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

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #f9f9f9;

  & .close-icon {
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const Body = styled.div`
  width: 100%;
`;

const ReportBlock = styled.button`
  margin-top: 20px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 100%;

  svg {
    transform: rotate(180deg);
  }
`;

const ReportMenu: FC<IProps> = ({ onBack, onClose, updateStep }) => {
  const [isBlock, setIsBlock] = useState<boolean>(false);
  const personData = useContext(FomiesDataContext);

  return (
    <Wrapper>
      <Header>
        <button onClick={onBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M10 13L5 8L10 3"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h3>Report</h3>
        <button onClick={onClose} className="close-icon">
          <CloseIcon fill="var(--main-gray)" />
        </button>
      </Header>
      <Body>
        <h3 style={{ textAlign: "left" }}>
          Why are you reporting this account?
        </h3>
        <ReportBlock onClick={() => updateStep("report-message")}>
          <span>Report Message or Comment</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M10 13L5 8L10 3"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ReportBlock>
        <ReportBlock onClick={() => updateStep("report-account")}>
          <span>Report Account</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M10 13L5 8L10 3"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ReportBlock>
      </Body>
    </Wrapper>
  );
};

export default ReportMenu;
