import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { FomiesDataContext } from "../../../../../../../pages/crypto/fomies/[id]";
import { CloseIcon } from "../../../../../../global/Icons";
import Link from "next/link";

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

  p {
    margin-top: 12px;
    text-align: left;
  }

  a {
    color: var(--main-green);
    text-decoration: underline;
    font-weight: var(--font-weight-semibold);
  }
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

const ReportMessage: FC<IProps> = ({ onBack, onClose, updateStep }) => {
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
        <h3 style={{ textAlign: "left", lineHeight: "140%" }}>
          Report a message, chat or comment on FOMO
        </h3>
        <p>
          You can report abusive comments and messages that are sent to you on
          FOMO if you think they go against our{" "}
          <Link href="/legal?type=terms">Terms of Use</Link>.
        </p>
        <p>
          If you come across a comment that violates our rules, you can report
          it. This includes, but is not limited to, spam, hate speech, or
          misleading information.
        </p>
        <p style={{ fontWeight: "var(--font-weight-semibold)" }}>
          To report a message, chat or comment on FOMO:
        </p>
        <p>
          Click the flag{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M0.666992 11.3346H3.57608M2.12154 6.23319V0.667969H11.3337L9.87911 3.45058L11.3337 6.23319H2.12154ZM2.12154 6.23319V10.8709"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>{" "}
          icon to report a message, chat or comment you believe violates the
          rules.
        </p>
        <p>
          Your report will remain anonymous (unless it concerns intellectual
          property infringement). The user whose message, chat or comment you
          report won’t be notified about who flagged it.
        </p>
      </Body>
    </Wrapper>
  );
};

export default ReportMessage;
