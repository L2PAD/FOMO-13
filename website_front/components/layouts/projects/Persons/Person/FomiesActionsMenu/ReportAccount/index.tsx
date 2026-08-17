import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { FomiesDataContext } from "../../../../../../../pages/crypto/fomies/[id]";
import { CloseIcon } from "../../../../../../global/Icons";
import { Button } from "../../../../../../global/common/Button";
import {
  ReportSubType,
  ReportType,
} from "../../../../../../../http/reports/createReport";
import { ConfirmReportData } from "..";

const Wrapper = styled.div`
  margin: 20px 0 0;
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
    margin-bottom: 0px;
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
  margin-bottom: 0px;
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

  & .block-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    max-width: 90%;
    margin: 0px;
  }

  span {
    font-weight: var(--font-weight-semibold);
  }

  & .arrow-next {
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

interface IProps {
  onBack: () => void;
  onClose: () => void;
  updateStep: (step: string) => void;
  onConfirm: (data: ConfirmReportData) => Promise<void>;
}

const ReportAccount: FC<IProps> = ({
  onBack,
  onClose,
  updateStep,
  onConfirm,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType | "">("");
  const [isBlock, setIsBlock] = useState<boolean>(false);

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
        <ReportBlock onClick={() => updateStep("report-impersonation")}>
          <div className="block-info">
            <span>Impersonation</span>
            <p>
              The user is pretending to be someone else or using a fake
              identity.
            </p>
          </div>
          <svg
            className="arrow-next"
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
        <ReportBlock onClick={() => setSelectedReport("inappropriateBehavior")}>
          <div className="block-info">
            <span>Inappropriate behavior</span>
            <p>The user posts irrelevant, offensive, or disruptive content.</p>
          </div>
          {selectedReport === "inappropriateBehavior" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="var(--main-green)"
            >
              <path
                d="M0.666992 11.3346H3.57608M2.12154 6.23319V0.667969H11.3337L9.87911 3.45058L11.3337 6.23319H2.12154ZM2.12154 6.23319V10.8709"
                stroke="var(--main-green)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M0.666992 11.3346H3.57608M2.12154 6.23319V0.667969H11.3337L9.87911 3.45058L11.3337 6.23319H2.12154ZM2.12154 6.23319V10.8709"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </ReportBlock>
        <ReportBlock onClick={() => setSelectedReport("underageAccount")}>
          <div className="block-info">
            <span>Underage account</span>
            <p>
              The user appears to be under 18 years old, which violates our
              platform rules.
            </p>
          </div>
          {selectedReport === "underageAccount" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="var(--main-green)"
            >
              <path
                d="M0.666992 11.3346H3.57608M2.12154 6.23319V0.667969H11.3337L9.87911 3.45058L11.3337 6.23319H2.12154ZM2.12154 6.23319V10.8709"
                stroke="var(--main-green)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M0.666992 11.3346H3.57608M2.12154 6.23319V0.667969H11.3337L9.87911 3.45058L11.3337 6.23319H2.12154ZM2.12154 6.23319V10.8709"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </ReportBlock>
        <SubmitButtonWrapper>
          {selectedReport ? (
            <Button
              onClick={() =>
                selectedReport &&
                onConfirm({
                  type: selectedReport,
                  subType: null,
                  body: "",
                })
              }
              variant="primary"
            >
              Submit Report
            </Button>
          ) : (
            <></>
          )}
        </SubmitButtonWrapper>
      </Body>
    </Wrapper>
  );
};

export default ReportAccount;
