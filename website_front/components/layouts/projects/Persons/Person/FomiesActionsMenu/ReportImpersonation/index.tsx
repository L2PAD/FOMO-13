import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { FomiesDataContext } from "../../../../../../../pages/crypto/fomies/[id]";
import { CloseIcon } from "../../../../../../global/Icons";
import { Button } from "../../../../../../global/common/Button";
import RadioButton from "../../../../../../global/common/radio_button";
import {
  ReportSubType,
  ReportType,
} from "../../../../../../../http/reports/createReport";
import { ConfirmReportData } from "..";

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
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
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
  margin-bottom: 20px;

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

const SubmitButtonWrapper = styled.div`
  margin-top: 20px !important;
  margin-bottom: 0px !important;
  button {
    width: 100%;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const RadioButtons = styled.div`
  margin-top: 20px;

  display: flex;
  flex-direction: column;
  gap: 12px;
`;

interface IProps {
  onBack: () => void;
  onClose: () => void;
  updateStep: (step: string) => void;
  onConfirm: (data: ConfirmReportData) => Promise<void>;
}

const ReportImpersonation: FC<IProps> = ({
  onBack,
  onClose,
  updateStep,
  onConfirm,
}) => {
  const [type, setType] = useState<any>("Me");

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
          Who is this account pretending to be?
        </h3>
        <RadioButtons>
          <RadioButton
            variant="gray"
            infoText=""
            label="Me"
            value={type}
            onChange={(value: any) => setType(value)}
          />
          <RadioButton
            variant="gray"
            infoText=""
            label="A public figure"
            value={type}
            onChange={(value: any) => setType(value)}
          />
          <RadioButton
            variant="gray"
            infoText=""
            label="Someone I know"
            value={type}
            onChange={(value: any) => setType(value)}
          />
        </RadioButtons>
      </Body>
      <SubmitButtonWrapper>
        <Button
          onClick={() =>
            onConfirm({
              type: "impersonality",
              subType: type,
              body: "",
            })
          }
          variant="primary"
        >
          Submit Report
        </Button>
      </SubmitButtonWrapper>
    </Wrapper>
  );
};

export default ReportImpersonation;
