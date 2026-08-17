import React, { FC, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import { ICreateDeal, IDeal } from "../../../../../types/global_types";
import createDeal from "../../../../../http/otc/createDeal";
import addDateAndTime from "../../../../../helpers/addDateAndTime";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import CustomSelect from "../../../../global/common/CustomSelect";
import {
  ButtonsWrapper,
  DateWrapper,
  MessageWrapper,
  SubmitButton,
  ThemeWrapper,
  DatePickerWrapper,
  CheckboxWrapper,
  DateContainer,
  DealInputLabel,
  InputsRow,
  PriceInput,
  ServiceWrapper,
  AmountWrapper,
  CurrencyWrapper,
  DateRow,
  OfferType,
  Buttons,
  ErrorText,
  RealAssetDetailsWrapper,
} from "./styles";
import { oneWeekInMs } from "../../../../global/Filter/otc_filter";
import { ResetWrapper } from "../../../../global/Filter/otc-styles";
import { Button } from "../../../../global/common/Button";
import { RotateCcw } from "lucide-react";
import { createDealWithApproval } from "../../../../../smart/smartOTCP2P";
import { LoadingContext } from "../../../../global/Layout";
import MainModal from "../../../../global/common/MainModal";
import CustomNumberInput from "../../../../global/common/components_for_modals/custom_number_input";
import TimeInput from "../../../../global/EventTimeInput/TimeInput";
import { InputError } from "../CreateOwnAsset/styles";
import InputWithLabel, { ErrorContainer, INPUT_ERROR_TIME } from "../../../../global/common/components_for_modals/input_with_label";
import LottieError from '../../../../../assets/animations/error.json'
import PromoteDeal from "../CreateP2PDealModal/PromoteDeal";

import dynamic from "next/dynamic";

const Lottie = dynamic(
  () => import("../../../../global/LottieClient/index"),
  { ssr: false }
);


interface Props {
  isVisible: boolean
  refetchDeals?: any;
  dealDataInitial?: IDeal | null;
  repeatDealInitial?: IDeal | null;
  onClose: () => void;
  disableBuyButton?: boolean;
}

export const errorsInitial = {
  name: "",
  smartContract: "",
  serviceType: "",
  decimals: "",
  price: "",
  amount: "",
  date: "",
}

const ServicesTypes = [
  {
    value: "Services",
    label: "Services",
  },
  {
    value: "NFT",
    label: "NFT",
  },
  {
    value: "Project Account",
    label: "Project Account",
  },
  {
    value: "KYC",
    label: "KYC",
  },
  {
    value: "Projects",
    label: "Projects",
  },
  {
    value: "Social Networks",
    label: "Social Networks",
  },
];

const resolveInitialDate = (
  sourceDeal: IDeal | null | undefined,
  isOfferMode: boolean
): Date | null => {
  if (!sourceDeal?.date) {
    return null;
  }

  const sourceDate = new Date(sourceDeal.date);
  if (Number.isNaN(sourceDate.getTime())) {
    return null;
  }

  if (isOfferMode) {
    return new Date(sourceDate.getTime() + oneWeekInMs);
  }

  return sourceDate;
};

const getInitialDealState = (
  sourceDeal: IDeal | null | undefined,
  isOfferMode: boolean
): ICreateDeal => ({
  type: sourceDeal
    ? (isOfferMode
      ? (sourceDeal.type === "buy" ? "sell" : "buy")
      : sourceDeal.type)
    : "buy",
  name: sourceDeal?.name || "",
  amount: sourceDeal?.amount || 0,
  price: sourceDeal?.price || 0.0,
  ticker: sourceDeal?.ticker || "eth",
  date: resolveInitialDate(sourceDeal, isOfferMode),
  description: sourceDeal?.description || "",
  dealId: isOfferMode ? sourceDeal?.dealId || 0 : 0,
  creator: "",
  movingTokens: false,
  serviceType: sourceDeal?.serviceType || "Services",
  buyer: "",
  smartContract: sourceDeal?.smartContract || "",
  isRealAsset: !!sourceDeal?.isRealAsset,
});

const CreateDealModal: FC<Props> = ({
  onClose,
  dealDataInitial,
  repeatDealInitial,
  refetchDeals,
  isVisible,
  disableBuyButton = false,
}) => {
  const { loadingStateHandler } = useContext(LoadingContext)
  const isOffer: boolean = !!dealDataInitial;
  const sourceDeal = dealDataInitial || repeatDealInitial || null;
  const getModalInitialDealState = (): ICreateDeal => {
    const initialState = getInitialDealState(sourceDeal, isOffer);
    if (disableBuyButton && !isOffer) {
      return { ...initialState, type: "sell" };
    }
    return initialState;
  };
  const [errors, setErrors] = useState(errorsInitial);
  const [dealData, setDealData] = useState<ICreateDeal>(
    () => getModalInitialDealState()
  );
  const [decimals, setDecimals] = useState<number>(sourceDeal?.decimals || 18)
  const [isPromoteDealChecked, setIsPromoteDealChecked] = useState<boolean>(false);

  useEffect(() => {
    if (!isVisible) return;

    setDealData(getModalInitialDealState());
    setDecimals(sourceDeal?.decimals || 18);
    setIsPromoteDealChecked(false);
    setErrors(errorsInitial);
  }, [isVisible, dealDataInitial, repeatDealInitial, isOffer, disableBuyButton]);

  const inputsHandler = (value: any, name: string): void => {
    setDealData((prev: ICreateDeal) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const validateDealData = (): boolean => {
    let isValid = true
    const errors: any = {}
    const isNameValid = dealData.name.length > 2
    const isSmartRequired = dealData.isRealAsset && !!dealData?.smartContract?.length
    const isSmartValid = isSmartRequired ? (dealData?.smartContract?.length || 0) > 10 : false

    if (!isNameValid) {
      isValid = false
      errors.name = 'This field required!'
    }

    if (dealData.isRealAsset && !dealData?.smartContract?.length) {
      isValid = false
      errors.smartContract = 'This field required!'
    }

    if (isSmartRequired && !isSmartValid) {
      isValid = false
      errors.smartContract = 'Invalid address format.'
    }

    if (!dealData.serviceType) {
      isValid = false
      errors.serviceType = dealData.isRealAsset ? 'Select token!' : 'Select service type!'
    }

    if (!decimals) {
      isValid = false
      errors.decimals = 'This field required!'
    }

    if (!dealData.price) {
      isValid = false
      errors.price = 'Required!'
    }

    if (!dealData.amount) {
      isValid = false
      errors.amount = 'Required!'
    }

    if (!dealData.date) {
      isValid = false
      errors.date = 'Almost there! Just pick a date and time.'
    }

    setErrors(errors)

    setTimeout(() => {
      setErrors(errorsInitial)
    }, INPUT_ERROR_TIME)

    return isValid
  }

  const confirmCreateDeal = async (): Promise<void> => {
    const isValid: boolean = validateDealData()

    if (!isValid || !dealData.date || !dealData.ticker) return

    loadingStateHandler(true)

    const dealDate: number = new Date(
      dealData.date
    ).getTime();

    let dealId: number | null = null;

    if (dealData.isRealAsset && !decimals) {
      toast.error('Decimals required!')
      return
    }

    if (!dealDate) {
      toast.error('Invalid Date!')
      return
    }

    if (dealData.type === "sell") {
      const { id, success } = await createDealWithApproval({
        endTime: dealDate / 1000,
        price: dealData.price,
        currency: dealData.ticker.toLowerCase() === 'eth' ? 0 : 1,
        mode: dealData.isRealAsset ? 0 : 1,
        tokenAmount: dealData.isRealAsset ? dealData.amount : 0,
        tokenForSale: dealData.isRealAsset ? dealData.smartContract : '',
        decimals
      })

      if (!success) {
        toast.error(
          <div>
            <h3>Something went wront...</h3>
            <p>Smart contract error!</p>
          </div>
        )
      }

      dealId = id
    }

    const isValidDeal: boolean = dealData.type === 'buy' || (!!dealId && dealId > 0)

    if (!isValidDeal) {
      loadingStateHandler(false)
      return
    }

    const { isSuccess } = await createDeal(
      {
        ...dealData,
        ticker: dealData.ticker.toLowerCase() === "eth" ? "eth" : "usd",
        date: new Date(dealDate),
        movingTokens: false,
        dealId,
        decimals,
        isSponsored: isPromoteDealChecked
      },
      isOffer,
      dealDataInitial?._id || ""
    );
    if (isSuccess) {
      refetchDeals && (await refetchDeals());
      toast.success(
        isOffer ? (
          <div>
            <h3>Your offer has been sent!</h3>
            <p>Wait for confirmation from the buyer</p>
          </div>
        ) : (
          <div>
            <h3>Success!</h3>
            <p>Deal created!</p>
          </div>
        )
      );
    }
    loadingStateHandler(false)
    handleReset()
    onClose();
  };

  const handleReset = (): void => {
    setDealData(getModalInitialDealState());
    setDecimals(sourceDeal?.decimals || 18);
    setIsPromoteDealChecked(false);
    setErrors(errorsInitial)
  };

  return (
    <MainModal
      isVisible={isVisible}
      variant="deal"
      className="deal-modal"
      onClose={() => {
        onClose()
        handleReset()
      }}
      title="Terms of the Deal"
    >
      <ButtonsWrapper>
        <DealInputLabel>Type</DealInputLabel>
        {isOffer ? (
          <OfferType>
            <button
              className={dealData.type === "sell" ? "active" : ""}
              onClick={() => inputsHandler("sell", "type")}
            >
              {dealDataInitial?.type === "buy" ? "Sell" : "Buy"}
            </button>
          </OfferType>
        ) : (
          <ButtonSwitch
            className="deal-switch"
            checked={dealData.type === "sell"}
            leftLabel="Buy"
            rightLabel="Sell"
            onChange={(checked: boolean) =>
              inputsHandler(checked ? "sell" : "buy", "type")
            }
            disableLeft={disableBuyButton}
          />
        )}
      </ButtonsWrapper>
      <ThemeWrapper>
        <InputWithLabel
          placeholder="Enter the deal name"
          type="text"
          name="name"
          label="Deal Name"
          isError={!!errors.name}
          value={dealData.name}
          errorText={errors.name}
          onChange={(value: any, name?: string) =>
            setDealData({ ...dealData, name: value })
          }
        />
        <CheckboxWrapper className="inline-checkbox">
          <Checkbox
            checked={!!dealData.isRealAsset}
            onChange={() => inputsHandler(!dealData.isRealAsset, "isRealAsset")}
            label="Real asset"
            className="deal-checkbox"
          />
        </CheckboxWrapper>
      </ThemeWrapper>
      {!!dealData.isRealAsset && (
        <>
          <InputWithLabel
            placeholder="Enter the asset's contract address"
            type="text"
            name="smartContract"
            label="Smart Contract Address"
            isError={!!errors.smartContract}
            value={dealData.smartContract}
            errorText={errors.smartContract}
            onChange={(value: any) => inputsHandler(value, "smartContract")}
          />
          <RealAssetDetailsWrapper>
            <div className="token-wrapper">
              <DealInputLabel>Token Name</DealInputLabel>
              <CustomSelect
                className="service-select"
                placeholder={dealData.serviceType || "SOL"}
                options={[
                  { value: "ETH", label: "ETH" },
                  { value: "BTC", label: "BTC" },
                  { value: "SOL", label: "SOL" },
                  { value: "TKN", label: "TKN" },
                ]}
                onChange={(value: string) => inputsHandler(value, "serviceType")}
              />
            </div>
            <CustomNumberInput
              name="decimals"
              placeholder="e.g. 6 or 18"
              label="Decimals"
              value={decimals}
              onChange={(value: number) => setDecimals(value)}
              isPrice={false}
              errorText={errors.decimals}
              isError={!!errors.decimals}
            />
          </RealAssetDetailsWrapper>
        </>
      )}
      {!dealData.isRealAsset && (
        <ServiceWrapper>
          <DealInputLabel>Service Type</DealInputLabel>
          <CustomSelect
            className="service-select"
            placeholder={dealData.serviceType || "Services"}
            options={ServicesTypes}
            onChange={(value: string) => inputsHandler(value, "serviceType")}
          />
          {
            errors.serviceType
              ?
              <ErrorContainer>
                <Lottie animationData={LottieError} />
                <InputError>{errors.serviceType}</InputError>
              </ErrorContainer>
              :
              <></>
          }
        </ServiceWrapper>
      )}
      <InputsRow style={{ marginTop: '24px' }}>
        <CustomNumberInput
          key={isVisible ? 'modal-open' : 'modal-closed'}
          name="amount"
          placeholder="Enter amount"
          label="Amount"
          value={dealData.amount}
          onChange={(value: number) => inputsHandler(value, "amount")}
          isPrice={false}
          isError={!!errors.amount}
          errorText={errors.amount}
        />
        <CustomNumberInput
          name="price"
          placeholder="Enter price"
          label="Price"
          value={dealData.price}
          onChange={(value: number) => inputsHandler(value, "price")}
          isPrice={true}
          isError={!!errors.price}
          errorText={errors.price}
        />
        <CurrencyWrapper>
          <DealInputLabel>Currency</DealInputLabel>
          <CustomSelect
            className="currency-select"
            placeholder={
              String(dealData.ticker || "").toLowerCase() === "eth" ? "ETH" : "USDC"
            }
            options={[
              { value: "eth", label: "ETH" },
              { value: "usdc", label: "USDC" },
            ]}
            onChange={(value: string) => inputsHandler(value, "ticker")}
          />
        </CurrencyWrapper>
      </InputsRow>
      <DateWrapper>
        <DealInputLabel>Expiration Date</DealInputLabel>
        <DateRow>
          <DatePickerWrapper>
            <ModalDatePicker
              type="small"
              date={dealData.date}
              onChange={(value: any) => inputsHandler(value, "date")}
            />
          </DatePickerWrapper>
        </DateRow>
        {
          errors.date
            ?
            <ErrorContainer>
              <Lottie animationData={LottieError} />
              <InputError>{errors.date}</InputError>
            </ErrorContainer>
            :
            <></>
        }
      </DateWrapper>
      <MessageWrapper>
        <DealInputLabel className="description-label">
          Description
        </DealInputLabel>
        <textarea
          maxLength={300}
          value={dealData.description}
          onChange={(e: any) => {
            if (e.target.value.length >= 300) {
              return
            }
            inputsHandler(e.target.value, "description")
          }}
          placeholder="Enter deal description"
        />
        <span>300 Characters Max</span>
      </MessageWrapper>
      <PromoteDeal
        checked={isPromoteDealChecked}
        onChange={(checked: boolean) => setIsPromoteDealChecked(checked)}
      />
      <Buttons>
        <div className="default">
          <Button onClick={() => {
            onClose()
            handleReset()
          }} className="red-btn big">
            Cancel
          </Button>
          <Button
            disabled={Object.values(errors).some(value => value !== "")}
            onClick={confirmCreateDeal}
            variant="primary"
            className="big"
          >
            Create {isOffer ? "Offer" : "Deal"}
          </Button>
        </div>
        <ResetWrapper className="big reset">
          <Button onClick={handleReset} className={`reset-btn small`}>
            <RotateCcw size={16} />
            Reset
          </Button>
        </ResetWrapper>
      </Buttons>
    </MainModal>
  );
};

export default CreateDealModal;
