import React, { FC, useContext, useState } from "react";
import styled from "styled-components";
import { CloseIcon } from "../../../../global/Icons";
import { Button } from "../../../../global/common/Button";
import RadioButton from "../../../../global/common/radio_button";
import CreateParsingFirstStep from "./steps/firstStep";
import { Actions } from "../../../../global/common/UniversalTable/styles";
import { Action } from "../../../../global/LeftNav/styles";
import { ResetButton } from "../../../../global/UniversalFilter/styles";
import MainModal from "../../../../global/common/MainModal";
import {
  BlockWrapper,
  InputError,
  InputLabel,
  InputWrapper,
} from "../CreatePortfolio/styles";
import createParsing from "../../../../../http/parcing/createParsing";
import { toast } from "react-toastify";
import { LoadingContext } from "../../../../global/Layout";
import updateTwitterKeywords from "../../../../../http/parcing/updateTwitterKeywords";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import DetailsIcon from "../../../../global/Icons/DetailsIcon";
import InfoIcon from "../../../../global/Icons/InfoIcon";

export type ParsingTypes = "account" | "keywords";
export type ParsingSteps = "first" | "account" | "keywords";

export type CreatingParsingAccount = {
  username: string;
  keywords: string;
};

export type CreatingParsingKeywords = {
  keywords: string;
};

const Wrapper = styled.div`
  width: 100%;

  & .actions-wrapper {
    button {
      max-width: 50%;
      width: 50%;
    }
  }
`;

const InputLabelWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;

  button {
    display: flex;
  }

  & .description-wrapper {
    & .gray-description {
      max-width: 300px;
      position: absolute;
      left: 5px;
      top: 17px;
    }
  }
`;

interface IProps {
  id: string;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const UpdateParsingModal: FC<IProps> = ({
  id,
  isVisible,
  onClose,
  onConfirm,
}) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const [parsingKeywords, setParsingKeywords] =
    useState<CreatingParsingKeywords>({ keywords: "" });
  const [isKeywordsError, setIsKeywordsError] = useState<boolean>(false);
  const [isDetails, setIsDetails] = useState<boolean>(false);

  const closeModal = (): void => {
    onClose();
    setTimeout(() => {
      setParsingKeywords({ keywords: "" });
    }, 500);
  };
  const confirmUpdateParsing = async (): Promise<void> => {
    if (!id) return;

    const isKeywordsError = parsingKeywords.keywords.length < 2;

    setIsKeywordsError(isKeywordsError);

    if (isKeywordsError) {
      setTimeout(() => {
        setIsKeywordsError(false);
      }, 5000);
      return;
    }

    loadingStateHandler(true);

    const { success } = await updateTwitterKeywords({
      id,
      keywords: parsingKeywords.keywords,
    });

    if (success) {
      await onConfirm();
    }

    loadingStateHandler(false);
  };

  return (
    <MainModal
      title=""
      className="share-modal"
      variant="820"
      isVisible={isVisible}
      onClose={closeModal}
      CustomTitle={<div className="custom-title">Edit Parsing</div>}
    >
      <Wrapper>
        <BlockWrapper>
          <InputLabelWrapper>
            <InputLabel>Keywords/Phrases (optional)</InputLabel>
            <button
              onMouseEnter={() => setIsDetails(true)}
              onMouseLeave={() => setIsDetails(false)}
              className="details-btn"
            >
              <InfoIcon />
            </button>
            <div className="description-wrapper">
              <DescriptionComponent
                className="gray-description"
                isVisible={isDetails}
                date={new Date()}
                isDate={false}
                text="Search tweets from selected account that contain the keywords you enter here"
              />
            </div>
          </InputLabelWrapper>
          <InputWrapper>
            <input
              value={parsingKeywords.keywords}
              onChange={(e) => {
                const { value } = e.target;
                const transformed = value.replace(/(?<=\S)\s+(?=\S)/g, ",");

                setParsingKeywords((prev) => ({
                  ...prev,
                  keywords: transformed,
                }));
              }}
              placeholder="Enter keywords (e.g. airdrop, zkSync, mainnet)"
            />
          </InputWrapper>
          {isKeywordsError ? (
            <InputError>Please add at least one keyword.</InputError>
          ) : (
            <></>
          )}
        </BlockWrapper>
        <Actions className="actions-wrapper" style={{ marginTop: "20px" }}>
          <Action onClick={closeModal} actionType="red">
            Cancel
          </Action>
          <Button onClick={confirmUpdateParsing} variant="primary">
            Save
          </Button>
        </Actions>
        <ResetButton>
          <button
            onClick={() => {
              setParsingKeywords({
                keywords: "",
              });
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
            >
              <path
                d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
                stroke="#738094"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Reset</span>
          </button>
        </ResetButton>
      </Wrapper>
    </MainModal>
  );
};

export default UpdateParsingModal;
