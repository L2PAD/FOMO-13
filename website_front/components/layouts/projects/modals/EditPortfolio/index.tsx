import React, { FC, useContext, useEffect, useState } from "react";
import MainModal from "../../../../global/common/MainModal";
import {
  BlockDescription,
  BlockWrapper,
  ButtonWrapper,
  InputError,
  InputLabel,
  InputWrapper,
  Wrapper,
} from "./styles";
import Button from "../../../../global/common/Button";
import imageLoader from "../../../../../helpers/imageLoader";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
import createAsset from "../../../../../http/assets/createAsset";
import {
  AssetTypes,
  IGlobalAsset,
  IProject,
} from "../../../../../types/global_types";
import CustomLogoInput from "../../../../global/common/LogoInput";
import {
  Actions,
  ResetButton,
} from "../../../../global/UniversalFilter/styles";
import { Action } from "../../../../global/LeftNav/styles";
import { readFileAsBase64 } from "../../../../../helpers/readFileAsBase64";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import AssetsSearch from "../../../../global/common/AssetsSearch";
import CustomTextarea from "../../../../global/common/CustomTextarea";
import { updatePortfolio } from "../../../../../http/portfolio";

interface IProps {
  initalData?: any;
  isVisible: boolean;
  onClose: () => void;
  refetch: () => any
  onModalBack?: () => void;
}

export interface INewPortfolio {
  name: string;
  description: string;
  logo?: string | null;
}

const EditPortfolio: FC<IProps> = ({ initalData, isVisible, onClose, refetch, onModalBack }) => {
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [step, setStep] = useState<1 | 2>(1);
  const [assetData, setAssetData] = useState<INewPortfolio>({
    name: "",
    description: "",
  });
  const [isSelectedAsset, setIsSelectedAsset] = useState<boolean>(false);
  const [isNameError, setIsNameError] = useState<boolean>(false);
  const [isTickerError, setIsTickerError] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Array<string>>([""]);
  const router = useRouter();

  const confirmContinue = async (): Promise<void> => {
    const isNameNotValid = assetData.name.length < 3;

    setIsNameError(isNameNotValid);

    if (isNameNotValid) {
      setTimeout(() => {
        setIsNameError(false);
      }, 4000);

      return
    }

    loadingStateHandler(true);
    const result = await updatePortfolio(initalData?._id || '', assetData)
    loadingStateHandler(false);

    if (!result.isSuccess) {
      toast.error(
        <div>
          <h3>Portfolio Update Failed</h3>
          <p>{result.error || "Please check the form and try again."}</p>
        </div>
      );
      return;
    }

    await refetch()
    onClose()
  };

  const imageInputHandler = async (img: File): Promise<void> => {
    const logo: string = await readFileAsBase64(img);

    setAssetData((prev: INewPortfolio) => {
      return { ...prev, logo };
    });
  };

  useEffect(() => {
    setAssetData(() => {
      return { name: initalData?.name || '', description: initalData?.description || '', logo: initalData?.logo }
    })
  }, [initalData])

  return (
    <MainModal
      title=""
      className="share-modal"
      variant="820"
      isVisible={isVisible}
      onClose={onClose}
      isModalBack={onModalBack}
      CustomTitle={<div className="custom-title">Edit Portfolio</div>}
    >
      <Wrapper>
        {userData?.isFullAuth ? (
          <>
            <BlockWrapper>
              <InputLabel>Portfolio Name</InputLabel>
              <InputWrapper>
                <input
                  value={assetData.name}
                  onChange={(e) =>
                    setAssetData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter portfolio name"
                />
              </InputWrapper>
              {isNameError ? (
                <InputError>
                  Oops! Looks like your portfolio needs a name. Give it a title
                  to continue!
                </InputError>
              ) : (
                <></>
              )}
            </BlockWrapper>
            <BlockWrapper>
              <InputLabel>Description (optional)</InputLabel>
              <CustomTextarea
                value={assetData.description}
                onChange={(value) =>
                  setAssetData((prev) => ({
                    ...prev,
                    description: value,
                  }))
                }
                placeholder="Enter description"
                maxCharacters={300}
                isMaxCharacters
              />
            </BlockWrapper>
            <BlockWrapper>
              <CustomLogoInput
                logo={
                  initalData?.logo && initalData.logo === assetData.logo
                    ? imageLoader(assetData.logo)
                    : assetData.logo
                }
                onChange={(img: File, name: string) => {
                  imageInputHandler(img);
                  setIsSelectedAsset(false);
                }}
              />
            </BlockWrapper>
            <Actions style={{ marginTop: "20px" }}>
              <Action
                onClick={() => {
                  onClose();
                  setAssetData({ name: "", description: "" });
                }}
                actionType="red"
              >
                Cancel
              </Action>
              <Button onClick={confirmContinue} variant="primary">
                Save
              </Button>
            </Actions>
            <ResetButton>
              <button
                onClick={() => {
                  setStep(1);
                  setAssetData({
                    name: "",
                    description: "",
                    logo: null,
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
          </>
        ) : (
          <div className="auth-info">
            <p>Login or create an account to create portfolio</p>
            <Button onClick={() => router.push("/gemslab/profile")}>
              Login
            </Button>
          </div>
        )}
      </Wrapper>
    </MainModal>
  );
};

export default EditPortfolio;
