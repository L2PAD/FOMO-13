import React, { FC, useState } from "react";
import MainModal from "../../../../global/common/MainModal";
import {
  BlockWrapper,
  CheckboxWrapper,
  InputError,
  InputLabel,
  InputWrapper,
  Wrapper,
} from "./styles";
import Button from "../../../../global/common/Button";
import Checkbox from "../../../../global/common/Checkbox";
import { Actions, ResetButton } from "../../../../global/UniversalFilter/styles";
import { Action } from "../../../../global/LeftNav/styles";
import { DescriptionText } from "../CustomizeTabModal/CustomizeTabBody";
import CustomLogoInput from "../../../../global/common/LogoInput";
import { readFileAsBase64 } from "../../../../../helpers/readFileAsBase64";

interface IProps {
  isVisible: boolean;
  onClose: () => void;
  onModalBack?: () => void;
  onConfirm?: (assetData: IOwnTabData) => void;
}

export interface IOwnTabData {
  name: string;
  description: string;
  isPublic: boolean;
  image?: string | null;
}

const defaultTabData: IOwnTabData = {
  name: "",
  description: "",
  isPublic: false,
  image: null,
};

const CreateOwnTab: FC<IProps> = ({
  isVisible,
  onClose,
  onModalBack,
  onConfirm,
}) => {
  const [assetData, setAssetData] = useState<IOwnTabData>(defaultTabData);
  const [isNameError, setIsNameError] = useState<boolean>(false);
  const [isCheckboxActive, setIsCheckboxActive] = useState<boolean>(false);

  const resetState = (): void => {
    setAssetData(defaultTabData);
    setIsCheckboxActive(false);
    setIsNameError(false);
  };

  const imageInputHandler = async (img: File): Promise<void> => {
    const image = await readFileAsBase64(img);

    setAssetData((prev) => ({
      ...prev,
      image,
    }));
  };

  const confirmContinue = async (): Promise<void> => {
    const isNameNotValid = assetData.name.length < 3;

    setIsNameError(isNameNotValid);

    if (isNameNotValid) {
      setTimeout(() => {
        setIsNameError(false);
      }, 4000);

      return;
    }

    onConfirm && onConfirm({ ...assetData, isPublic: isCheckboxActive });
  };

  const getStepTitle = (): React.ReactElement => {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "24px", fontWeight: "var(--font-weight-semibold)" }}>
          Name Your Tab & Finalize
        </span>
        <span
          style={{
            fontSize: "24px",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--main-gray)",
          }}
        >
          3/3
        </span>
      </div>
    );
  };

  return (
    <MainModal
      title=""
      variant="820"
      isVisible={isVisible}
      onClose={onClose}
      CustomTitle={getStepTitle()}
      customTitleClassName="steps-title"
    >
      <DescriptionText>
        Give your new tab a clear name and description. Once saved, you'll be
        able to fine-tune it with filters, assets, and layouts right from your
        dashboard.
      </DescriptionText>
      <Wrapper>
        <BlockWrapper>
          <InputLabel>Tab Name</InputLabel>
          <InputWrapper>
            <input
              value={assetData.name}
              onChange={(e) => {
                setAssetData((prev) => {
                  return {
                    ...prev,
                    name: e.target.value,
                  };
                });
              }}
              placeholder="Enter tab name (e.g., Top Gainers, DeFi Watchlist)"
            />
          </InputWrapper>
          {isNameError ? (
            <InputError>
              Oops! Looks like your tab needs a name. Give it a title to
              continue!
            </InputError>
          ) : (
            <></>
          )}
        </BlockWrapper>
        <BlockWrapper>
          <InputLabel>Tab Description</InputLabel>
          <InputWrapper>
            <textarea
              value={assetData.description}
              onChange={(e) => {
                if (e.target.value.length > 300) return;
                setAssetData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
              placeholder="Enter tab description"
            />
          </InputWrapper>
          <p className="bottom-label">300 Characters Max</p>
        </BlockWrapper>
        <BlockWrapper>
          <CustomLogoInput
            label="Tab Image"
            uploadText="Tap to upload a tab image (Max 15 MB, PNG/JPG/SVG)"
            inputId="tab-image-input"
            logo={assetData.image}
            onChange={(img: File) => {
              imageInputHandler(img);
            }}
          />
        </BlockWrapper>
        <CheckboxWrapper>
          <Checkbox
            checked={isCheckboxActive}
            onChange={() => setIsCheckboxActive((prev: boolean) => !prev)}
            label="Enable public access in Tab Hub to let others discover and save this tab"
          />
        </CheckboxWrapper>
        <Actions>
          <Action onClick={() => onClose && onClose()} actionType="red">
            Back
          </Action>
          <Button onClick={confirmContinue} variant="primary">
            Create Tab
          </Button>
        </Actions>
        <ResetButton>
          <button
            onClick={() => {
              resetState();
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

export default CreateOwnTab;
