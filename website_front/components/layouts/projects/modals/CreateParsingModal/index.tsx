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
import { useTranslation } from "i18n";

export type ParsingTypes = "account" | "keywords";
export type ParsingSteps = "first" | "account" | "keywords";

export type CreatingParsingAccount = {
  username: string;
  keywords: string;
  isSentiment?: boolean;
};

export type UpdateParsingAccount = {
  id: string;
  username: string;
  isPrivate?: boolean;
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

interface IProps {
  isVisible: boolean;
  isSentiment?: boolean;
  refetch: any;
  onClose: () => void;
  setIsCreatingParsing: (value: boolean) => void;
}

const CreateParsingModal: FC<IProps> = ({
  isVisible,
  isSentiment,
  refetch,
  onClose,
  setIsCreatingParsing,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<ParsingSteps>("first");
  const [type, setType] = useState<ParsingTypes>("account");
  const [parsingAccountData, setParsingAccountData] =
    useState<CreatingParsingAccount>({ username: "", keywords: "" });
  const [parsingKeywords, setParsingKeywords] =
    useState<CreatingParsingKeywords>({ keywords: "" });
  const [isUsernameError, setIsUsernameError] = useState<boolean>(false);
  const [isKeywordsError, setIsKeywordsError] = useState<boolean>(false);

  const closeModal = (): void => {
    onClose();
    setTimeout(() => {
      setParsingAccountData({
        username: "",
        keywords: "",
      });
      setStep("first");
    }, 500);
  };

  const confirmCreateParsingAccount = async (): Promise<void> => {
    const isUsernameError = parsingAccountData.username.length < 3;

    setIsUsernameError(isUsernameError);

    if (isUsernameError || isKeywordsError) {
      setTimeout(() => {
        setIsUsernameError(false);
      }, 5000);
      return;
    }

    setIsCreatingParsing(true);
    onClose();

    const { success } = await createParsing({
      ...parsingAccountData,
      isSentiment: !!isSentiment,
    });

    setIsCreatingParsing(false);

    if (success) {
      await refetch();
      toast.success(
        <div>
          <h3>{t("parsing.modal.accountParsed")}</h3>
        </div>
      );
    }
  };

  const confirmCreateParsingKeywords = async (): Promise<void> => {
    const isKeywordsError = parsingKeywords.keywords.length < 2;

    setIsKeywordsError(isKeywordsError);

    if (isKeywordsError) {
      setTimeout(() => {
        setIsKeywordsError(false);
      }, 5000);
      return;
    }

    setIsCreatingParsing(true);
    onClose();

    const { success } = await createParsing(
      { keywords: parsingKeywords.keywords, isSentiment: !!isSentiment },
      "socialparcing/user/keywords"
    );


    if (success) {
      await refetch();
      toast.success(
        <div>
          <h3>{t("parsing.modal.keywordsParsed")}</h3>
        </div>
      );
    }
    setIsCreatingParsing(false)
    document.querySelector("#fake-anhor")?.scrollIntoView();
  };

  const getContent = (): React.ReactNode => {
    if (step === "first") {
      return (
        <Wrapper>
          <CreateParsingFirstStep type={type} setType={setType} />
          <Actions className="actions-wrapper" style={{ marginTop: "20px" }}>
            <Action onClick={closeModal} actionType="red">
              {t("common.actions.cancel")}
            </Action>
            <Button
              onClick={() => {
                setStep(type);
              }}
              variant="primary"
            >
              {t("common.actions.continue", { defaultValue: "Continue" })}
            </Button>
          </Actions>
        </Wrapper>
      );
    }

    if (step === "account") {
      return (
        <Wrapper>
          <BlockWrapper>
            <InputLabel>{t("parsing.modal.twitterAccount")}</InputLabel>
            <InputWrapper>
              <input
                value={parsingAccountData.username}
                onChange={(e) =>
                  setParsingAccountData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                placeholder={t("common.placeholders.enterUsername", { defaultValue: "Enter username" })}
              />
            </InputWrapper>
            {isUsernameError ? (
              <InputError>{t("parsing.modal.accountRequired")}</InputError>
            ) : (
              <></>
            )}
          </BlockWrapper>
          <BlockWrapper>
            <InputLabel>{t("parsing.modal.keywords")}</InputLabel>
            <InputWrapper>
              <input
                value={parsingAccountData.keywords}
                onChange={(e) =>
                  setParsingAccountData((prev) => ({
                    ...prev,
                    keywords: e.target.value,
                  }))
                }
                placeholder={t("common.placeholders.enterKeywords", { defaultValue: "Enter keywords (e.g. airdrop, zkSync, mainnet)" })}
              />
            </InputWrapper>
            {isKeywordsError ? (
              <InputError>{t("parsing.modal.keywordsRequired")}</InputError>
            ) : (
              <></>
            )}
          </BlockWrapper>
          <Actions className="actions-wrapper" style={{ marginTop: "20px" }}>
            <Action onClick={closeModal} actionType="red">
              {t("common.actions.cancel")}
            </Action>
            <Button onClick={confirmCreateParsingAccount} variant="primary">
              {t("common.actions.save")}
            </Button>
          </Actions>
          <ResetButton>
            <button
              onClick={() => {
                setParsingAccountData({
                  username: "",
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
              <span>{t("common.actions.reset")}</span>
            </button>
          </ResetButton>
        </Wrapper>
      );
    }

    if (step === "keywords") {
      return (
        <Wrapper>
          <BlockWrapper>
            <InputLabel>{t("parsing.modal.keywords")}</InputLabel>
            <InputWrapper>
              <input
                value={parsingKeywords.keywords}
                onChange={(e) => {
                  const { value } = e.target;
                  setParsingKeywords({ keywords: value });
                }}
                placeholder={t("common.placeholders.enterKeywords", { defaultValue: "Enter keywords (e.g. airdrop, zkSync, mainnet)" })}
              />
            </InputWrapper>
            {isKeywordsError ? (
              <InputError>{t("parsing.modal.keywordsRequired")}</InputError>
            ) : (
              <></>
            )}
          </BlockWrapper>
          <Actions className="actions-wrapper" style={{ marginTop: "20px" }}>
            <Action onClick={closeModal} actionType="red">
              {t("common.actions.cancel")}
            </Action>
            <Button onClick={confirmCreateParsingKeywords} variant="primary">
              {t("common.actions.save")}
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
              <span>{t("common.actions.reset")}</span>
            </button>
          </ResetButton>
        </Wrapper>
      );
    }
  };

  return (
    <MainModal
      title=""
      className="share-modal"
      variant="820"
      isVisible={isVisible}
      onClose={closeModal}
      CustomTitle={<div className="custom-title">{t("parsing.modal.createTitle", { defaultValue: "Create Parsing" })}</div>}
    >
      {getContent()}
    </MainModal>
  );
};

export default CreateParsingModal;
