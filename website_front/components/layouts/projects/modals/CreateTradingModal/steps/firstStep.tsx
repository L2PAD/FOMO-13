import React, { FC } from "react";
import styled from "styled-components";
import { CloseIcon } from "../../../../../global/Icons";
import { Button } from "../../../../../global/common/Button";
import RadioButton from "../../../../../global/common/radio_button";

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
  type: any;
  setType: any;
}

const CreateParsingFirstStep: FC<IProps> = ({ type, setType }) => {
  return (
    <Wrapper>
      <Body>
        <RadioButtons>
          <RadioButton
            className="with-description"
            descriptionText="Track all tweets from a specific Twitter profile in real-time"
            label="By Twitter Account"
            value={type === "account" ? "By Twitter Account" : "By Keywords"}
            onChange={(value: any) => setType("account")}
          />
          <RadioButton
            className="with-description"
            descriptionText="Monitor all tweets containing a specific word or hashtag across Twitter"
            label="By Keywords"
            value={type === "account" ? "By Twitter Account" : "By Keywords"}
            onChange={(value: any) => setType("keywords")}
          />
        </RadioButtons>
      </Body>
    </Wrapper>
  );
};

export default CreateParsingFirstStep;
