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
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../../helpers/imageFallbacks";
import SecondStep, { defaultState } from "./steps/SecondStep";
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

interface IProps {
  isVisible: boolean;
  portfolioId?: string
  onClose: () => void;
  onModalBack?: () => void;
  initialAsset?: Partial<IGlobalAsset> | null;
}

export interface ISecondStepData {
  amount: number;
  price: number;
  date?: Date;
  totalPrice: number;
  fee: number;
  feeType?: 'percent' | 'usd'
  note?: string;
  priceCurrency?: string;
  type: any;
  projectId?: string
  marketAssetId?: string
  canonicalProjectId?: string
}

export interface IOwnAssetData extends ISecondStepData {
  name: string;
  ticker: string;
  logo?: string | null;
}

const getDefaultAssetData = (): IOwnAssetData => ({
  projectId: "",
  marketAssetId: "",
  canonicalProjectId: "",
  name: "",
  ticker: "",
  logo: null,
  ...defaultState,
});

const formatAssetSymbol = (value?: string | null): string =>
  String(value || "").trim().toUpperCase();

const normalizeInitialAssetData = (
  asset?: Partial<IGlobalAsset> | null
): IOwnAssetData | null => {
  if (!asset) return null;

  const ticker = formatAssetSymbol(asset.symbol || asset.ticker);
  const price = Number(asset.price || 0);
  const marketAssetId = asset.marketAssetId || asset.projectId || asset._id || "";

  return {
    ...getDefaultAssetData(),
    projectId: marketAssetId,
    marketAssetId,
    canonicalProjectId: asset.canonicalProjectId || asset.projectId || "",
    name: asset.name || ticker,
    ticker,
    logo: asset.logo || null,
    amount: 1,
    price,
    totalPrice: price,
    fee: 0,
    type: "buy",
  };
};

const CreateOwnAsset: FC<IProps> = ({
  isVisible,
  portfolioId,
  onClose,
  onModalBack,
  initialAsset,
}) => {
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [step, setStep] = useState<1 | 2>(1);
  const [assetData, setAssetData] = useState<IOwnAssetData>(getDefaultAssetData);
  const [isSelectedAsset, setIsSelectedAsset] = useState<boolean>(false);
  const [isNameError, setIsNameError] = useState<boolean>(false);
  const [isTickerError, setIsTickerError] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Array<string>>([]);
  const router = useRouter();

  const resetModalState = (): void => {
    setStep(1);
    setAssetData(getDefaultAssetData());
    setIsSelectedAsset(false);
    setIsNameError(false);
    setIsTickerError(false);
    setValidationErrors([]);
  };

  const handleClose = (): void => {
    resetModalState();
    onClose();
  };

  useEffect(() => {
    if (!isVisible) {
      resetModalState();
      return;
    }

    const nextAssetData = normalizeInitialAssetData(initialAsset);

    if (nextAssetData) {
      setStep(1);
      setAssetData(nextAssetData);
      setIsSelectedAsset(true);
      setIsNameError(false);
      setIsTickerError(false);
      setValidationErrors([]);
    }
  }, [initialAsset, isVisible]);

  const confirmContinue = async (): Promise<void> => {
    const isNameNotValid = assetData.name.length < 3;
    const isTickerNotValid = assetData.ticker.length < 3;

    setIsNameError(isNameNotValid);
    setIsTickerError(isTickerNotValid);

    if (isNameNotValid || isTickerNotValid) {
      setTimeout(() => {
        setIsNameError(false);
        setIsTickerError(false);
      }, 4000);

      return;
    }

    setStep(2);
  };

  const confirmCreateAsset = async (
    data: ISecondStepData
  ): Promise<boolean> => {
    const nextValidationErrors: string[] = [];
    const transactionDateMs = data.date ? new Date(data.date).getTime() : NaN;

    if (data.amount <= 0) {
      nextValidationErrors.push("amount");
    }
    if (data.price <= 0) {
      nextValidationErrors.push("price");
    }
    if (!Number.isFinite(transactionDateMs) || transactionDateMs > Date.now()) {
      nextValidationErrors.push("date");
    }

    if (nextValidationErrors.length) {
      setValidationErrors(nextValidationErrors);
      setTimeout(() => setValidationErrors([]), 3000);

      return false;
    }

    loadingStateHandler(true);

    const asset = { ...assetData, ...data, isSelectedAsset };

    const dto: any = {
      projectId: asset.marketAssetId || asset.projectId,
      marketAssetId: asset.marketAssetId || asset.projectId,
      canonicalProjectId: asset.canonicalProjectId || undefined,
      amount: asset.amount,
      currency: asset.ticker,
      type: asset.type,
      price: asset.price,
      priceCurrency: asset.priceCurrency,
      date: asset.date,
      totalPrice: asset.totalPrice,
      note: asset.note || undefined,
      feeType: asset.feeType as 'percent' | 'usd',
      feeAmount: asset.fee || 0,
    };

    const { isSuccess, error } = await createAsset(portfolioId ? portfolioId : '', dto);

    loadingStateHandler(false);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Asset added to your portfolio ✅</p>
        </div>
      );
      handleClose();
    } else {
      toast.error(
        <div>
          <h3>Asset Creation Failed</h3>
          <p>{error || "Please check the transaction and try again."}</p>
        </div>
      );
    }

    return isSuccess;
  };

  const imageInputHandler = async (img: File): Promise<void> => {
    const logo: string = await readFileAsBase64(img);

    setAssetData((prev: IOwnAssetData) => {
      return { ...prev, logo };
    });
  };

  const getStepContent = (): React.ReactNode => {
    if (step === 1) {
      return (
        <>
          <BlockWrapper>
            <BlockDescription>
              Search for an existing crypto asset to include in your tab, or
              create a custom one from scratch. Perfect for tracking unreleased
              tokens, internal coins, or fun experiments.
            </BlockDescription>
            <AssetsSearch
              isOneProject
              assets={[]}
              onChange={(items: Array<IGlobalAsset>) => {
                if (items.length && items[0]) {
                  const marketAssetId = items[0].marketAssetId || items[0]._id;

                  setAssetData({
                    projectId: marketAssetId,
                    marketAssetId,
                    canonicalProjectId: items[0].canonicalProjectId,
                    name: items[0].name,
                    ticker: formatAssetSymbol(items[0].symbol || items[0].ticker),
                    logo: items[0].logo,
                    amount: 1,
                    price: items[0].price,
                    fee: 0,
                    type: 'buy',
                    totalPrice: items[0].price
                  });
                  setIsSelectedAsset(true);
                }
              }}
            />
            <InputLabel>Name</InputLabel>
            <InputWrapper>
              <input
                value={assetData.name}
                onChange={(e) =>
                  setAssetData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter asset name (e.g., Bitcoin, Ethereum)"
              />
            </InputWrapper>
            {isNameError ? (
              <InputError>
                Oops! Looks like your asset needs a name. Give it a title to
                continue!
              </InputError>
            ) : (
              <></>
            )}
          </BlockWrapper>
          <BlockWrapper>
            <InputLabel>Ticker</InputLabel>
            <InputWrapper>
              <input
                value={assetData.ticker}
                onChange={(e) =>
                  setAssetData((prev) => ({
                    ...prev,
                    ticker: formatAssetSymbol(e.target.value),
                  }))
                }
                placeholder="Enter asset ticker (e.g., BTC, ETH)"
              />
            </InputWrapper>
            {isTickerError ? (
              <InputError>
                Ticker is required. Give it a title to continue!
              </InputError>
            ) : (
              <></>
            )}
          </BlockWrapper>
          <BlockWrapper>
            <CustomLogoInput
              logo={
                isSelectedAsset && assetData.logo
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
                handleClose();
              }}
              actionType="red"
            >
              Cancel
            </Action>
            <Button onClick={confirmContinue} variant="primary">
              {step > 1 ? "Send Transaction" : "Next"}
            </Button>
          </Actions>
          <ResetButton>
            <button
              onClick={() => {
                resetModalState();
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
      );
    }

    if (step === 2) {
      return (
        <SecondStep
          modalBack={() => setStep(1)}
          onConfirm={confirmCreateAsset}
          validationErrors={validationErrors}
          initialData={assetData || null}
          assetTicker={assetData.ticker}
        />
      );
    }
  };

  const getStepTitle = (): React.ReactElement => {
    const steps = {
      1: (
        <div className="custom-title">
          Add Asset — Choose or Create Your Own
        </div>
      ),
      2: (
        <div className="custom-project">
          {assetData?.logo ? (
            <img
              src={
                isSelectedAsset
                  ? getProjectImage(assetData.logo, assetData.name || assetData.ticker)
                  : assetData.logo
              }
              alt={assetData.name || "custom asset"}
              onError={isSelectedAsset ? setProjectImageFallback : undefined}
            />
          ) : (
            <></>
          )}
          <div className="custom-title">{assetData.name}</div>
          <span className="custom-subtitle">{formatAssetSymbol(assetData.ticker)}</span>
        </div>
      ),
    };

    return steps[step];
  };

  return (
    <MainModal
      title=""
      className="share-modal"
      variant="820"
      isVisible={isVisible}
      onClose={handleClose}
      isModalBack={onModalBack}
      CustomTitle={getStepTitle()}
    >
      <Wrapper>
        {userData?.isFullAuth ? (
          getStepContent()
        ) : (
          <div className="auth-info">
            <p>Login or create an account to use Tab Hub</p>
            <Button onClick={() => router.push("/gemslab/profile")}>
              Login
            </Button>
          </div>
        )}
      </Wrapper>
    </MainModal>
  );
};

export default CreateOwnAsset;
