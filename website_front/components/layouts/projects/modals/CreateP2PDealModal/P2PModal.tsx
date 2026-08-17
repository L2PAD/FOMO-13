import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import { ICreateDeal, IDeal } from "../../../../../types/global_types";
import { oneWeekInMs } from "../../../../global/Filter/otc_filter";
import { toast } from "react-toastify";
import MainModal from "../../../../global/common/MainModal";
import { BalanceAmount, BalanceButton, BalanceLabel, BalanceWrapper, Buttons, ButtonsWrapper, CurrencyWrapper, DatePickerWrapper, DateRow, DateWrapper, DealInputLabel, InputsRow, MessageWrapper, OfferType, ServiceWrapper, TokenCurrency } from "./styles";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import CustomNumberInput from "../../../../global/common/components_for_modals/custom_number_input";
import CustomSelect from "../../../../global/common/CustomSelect";
import CustomDropdown, { DropdownOption as CustomDropdownOption } from "../../../../UI/CustomDropdown";
import { paymentMethodOptions } from ".";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import InputWithLabel, { ErrorContainer, INPUT_ERROR_TIME } from "../../../../global/common/components_for_modals/input_with_label";
import { InputError } from "../CreateOwnAsset/styles";
import LottieError from '../../../../../assets/animations/error.json'
import { Button } from "../../../../global/common/Button";
import { ResetWrapper } from "../../../../global/Filter/otc-styles";
import { RotateCcw } from "lucide-react";
import { UserDealsBalance } from "../../../../global/DealsBalanceComponent";
import { createDealWithApproval } from "../../../../../smart/smartOTCP2P";
import createDeal from "../../../../../http/otc/createDeal";
import { LoadingContext } from "../../../../global/Layout";
import UserBalanceComponent from "../../../../global/UserBalanceComponent";
import ModalDropdown, { DropdownOption as ModalDropdownOption } from "../DepositModal/ModalDropdown";
import { currencies } from "../DepositModal";
import upperCaseFirstLetter from "../../../../../helpers/upperCaseFirstLetter";
import DealSummary from "./DealSummury";
import PromoteDeal from "./PromoteDeal";
import { getPaymentMethods } from "../../../../../http/deals/paymentMethods";
import PaymentMethodModal from "../PaymentMethodModal";
import TimeInput from "../../../../global/EventTimeInput/TimeInput";

import dynamic from "next/dynamic";

const Lottie = dynamic(
    () => import("../../../../global/LottieClient/index"),
    { ssr: false }
);

const errorsInitial = {
    amount: "",
    price: "",
    date: "",
    p2pSaleTime: "",
    token: '',
    currency: '',
    description: "",
    paymentMethods: ""
}

const getInitialSaleTime = (value?: string): { hours: string; minutes: string } => {
    if (!value) return { hours: "00", minutes: "30" };

    const [rawHours = "", rawMinutes = ""] = value.split(":");
    const parsedHours = rawHours.replace(/\D/g, "").slice(0, 2);
    const parsedMinutes = rawMinutes.replace(/\D/g, "").slice(0, 2);

    const hours = parsedHours.length > 0 ? parsedHours.padStart(2, "0") : "00";
    const minutes = parsedMinutes.length > 0 ? parsedMinutes.padStart(2, "0") : "30";

    return { hours, minutes };
};

const formatP2PSaleTime = (value: { hours: string; minutes: string }): string => {
    const rawHours = Number(value.hours || "0");
    const rawMinutes = Number(value.minutes || "0");

    const hours = Math.min(Math.max(rawHours, 0), 24);
    const minutes = Math.min(Math.max(rawMinutes, 0), 59);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const isValidP2PSaleTime = (value: { hours: string; minutes: string }): boolean => {
    if (!value.hours || !value.minutes) return false;

    const hours = Number(value.hours);
    const minutes = Number(value.minutes);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;

    return hours >= 0 && hours <= 24 && minutes >= 0 && minutes <= 59;
};

const isObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

const getInitialPaymentMethodIds = (deal: IDeal | null | undefined): string[] => {
    const methods = Array.isArray(deal?.paymentMethods) ? deal!.paymentMethods : [];
    const ids = methods
        .map((method) => {
            if (typeof method === "string") {
                return isObjectId(method) ? method : "";
            }
            return method?._id && isObjectId(method._id) ? method._id : "";
        })
        .filter(Boolean) as string[];

    return Array.from(new Set(ids));
};

const getInitialTokenTicker = (
    deal: IDeal | null | undefined
): ModalDropdownOption | null => {
    const ticker = String(deal?.ticker || "").toLowerCase();
    if (!ticker) return null;

    return (
        currencies.find((item) => item.value.toLowerCase() === (ticker === "usd" ? "usdc" : ticker)) ||
        null
    );
};

const getDealInitialState = (
    deal: IDeal | null | undefined,
    isOfferMode: boolean
): ICreateDeal => {
    return ({
        name: 'Deal Terms',
        type: deal
            ? (isOfferMode
                ? (deal.type === "buy" ? "sell" : "buy")
                : deal.type)
            : "buy",
        amount: deal?.amount || 0,
        price: deal?.price || 0,
        ticker: deal?.ticker || null,
        date: deal?.date ? new Date(deal.date) : null,
        description: deal?.description || "",
        dealId: isOfferMode ? deal?.dealId || null : null,
        creator: '',
        currency: deal?.currency || ""
    })
}

const validateAmount = (amount: number): string => {
    const numAmount = Number(amount);

    if (!amount) {
        return "Required!";
    }

    if (isNaN(numAmount)) {
        return "Not valid!";
    }

    return "";
};

const validatePrice = (price: number): string => {
    const numPrice = Number(price);

    if (!price) {
        return "Required!";
    }

    if (isNaN(numPrice)) {
        return "Not valid!";
    }

    return "";
};

const validateDate = (date: Date | null): string => {
    if (!date) {
        return "Date is required"!;
    }

    const now = new Date();
    if (date < now) {
        return "Date cannot be in the past!";
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    if (date > maxDate) {
        return "Date cannot be more than 1 year in the future!";
    }

    return "";
};

interface Props {
    balance: UserDealsBalance
    isVisible: boolean
    refetchDeals?: any;
    dealDataInitial?: IDeal | null;
    repeatDealInitial?: IDeal | null;
    onClose: () => void;
    onDealCreated?: (amount: string, price: string) => void;
}


const CreateP2PDealModal: FC<Props> = ({
    isVisible,
    dealDataInitial,
    repeatDealInitial,
    refetchDeals,
    balance,
    onClose,
    onDealCreated,
}) => {
    const { loadingStateHandler } = useContext(LoadingContext)
    const isOffer: boolean = !!dealDataInitial;
    const sourceDeal = dealDataInitial || repeatDealInitial || null;
    const [isReset, setIsReset] = useState<boolean>(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<
        string[]
    >(() => getInitialPaymentMethodIds(sourceDeal));
    const [isPaymentMethodsLoading, setIsPaymentMethodsLoading] = useState(false);
    const [availablePaymentOptions, setAvailablePaymentOptions] = useState<
        CustomDropdownOption[]
    >([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [errors, setErrors] = useState(errorsInitial);
    const [tokenTicker, setTokenTicker] = useState<ModalDropdownOption | null>(
        () => getInitialTokenTicker(sourceDeal)
    )
    const [dealData, setDealData] = useState<ICreateDeal>(
        () => getDealInitialState(sourceDeal, isOffer)
    );
    const [resetToggle, setResetToggle] = useState<boolean>(false)
    const [isPromoteDealChecked, setIsPromoteDealChecked] = useState<boolean>(false);
    const [saleTime, setSaleTime] = useState<{ hours: string; minutes: string }>(
        getInitialSaleTime(sourceDeal?.p2pSaleTime)
    );

    const normalizeLabel = (value: string): string =>
        value.toLowerCase().replace(/[^a-z0-9]/g, "");

    const resolvePaymentLabel = (method: any): string => {
        return method?.label || method?.bankName || "Bank";
    };

    const resolvePaymentIcon = (method: any): string | undefined => {
        const bankKey = method?.meta?.bankKey as string | undefined;
        if (bankKey) {
            return paymentMethodOptions.find((opt) => opt.value === bankKey)?.icon;
        }

        const normalized = normalizeLabel(resolvePaymentLabel(method));
        return paymentMethodOptions.find(
            (opt) => normalizeLabel(opt.label) === normalized
        )?.icon;
    };

    const inputsHandler = (value: any, name: string): void => {
        setDealData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const confirmCreateDeal = async (): Promise<void> => {
        if (!validateAllFields()) {
            return;
        }

        if (!dealData.date) return
        loadingStateHandler(true)
        let dealId: number | null = null;

        if (dealData.type === "buy") {
            const { id, success } = await createDealWithApproval({
                endTime: new Date(dealData.date).getTime() / 1000,
                price: Number(dealData.amount),
                currency: tokenTicker?.value === 'USDC' ? 1 : 0,
                mode: 1,
                tokenAmount: 0,
                tokenForSale: '',
                decimals: 0,
                isSponsored: isPromoteDealChecked
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

        const isValidDeal: boolean = dealData.type === 'sell' || (!!dealId && dealId > 0)

        if (!isValidDeal) {
            loadingStateHandler(false)
            return
        }

        const { isSuccess } = await createDeal(
            {
                type: dealData.type === 'sell' ? 'sell' : 'buy',
                name: 'Deal Terms',
                price: Number(dealData.price),
                amount: Number(dealData.amount),
                ticker: tokenTicker?.value === 'USDC' ? 'usd' : 'eth',
                date: new Date(dealData.date),
                movingTokens: false,
                dealId,
                decimals: 0,
                description: dealData.description,
                creator: '',
                section: 'p2p',
                paymentMethods: dealData.type === "buy" ? [] : selectedPaymentMethod,
                currency: dealData.currency,
                isSponsored: isPromoteDealChecked,
                p2pSaleTime: formatP2PSaleTime(saleTime),
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
            handleReset()
            onClose()
        }
        loadingStateHandler(false)
    };

    const handleReset = (): void => {
        setTimeout(() => {
            setIsReset(true)
            setDealData(getDealInitialState(sourceDeal, isOffer))
            setTokenTicker(getInitialTokenTicker(sourceDeal))
            setSelectedPaymentMethod(getInitialPaymentMethodIds(sourceDeal))
            setErrors(errorsInitial)
            setIsPromoteDealChecked(false)
            setSaleTime(getInitialSaleTime(sourceDeal?.p2pSaleTime))
            setResetToggle(prev => !prev)
        }, 100);

    };

    const loadUserPaymentMethods = async (): Promise<void> => {
        setIsPaymentMethodsLoading(true);
        const { isSuccess, methods } = await getPaymentMethods();
        if (isSuccess && methods.length > 0) {
            const methodOptions: CustomDropdownOption[] = methods.map((method) => ({
                value: method._id,
                label: resolvePaymentLabel(method),
                icon: resolvePaymentIcon(method),
            }));

            setAvailablePaymentOptions(methodOptions);
            const availableIds = methods.map((method) => method._id);
            setSelectedPaymentMethod((prev) => {
                const preserved = prev.filter((id) => availableIds.includes(id));
                return preserved.length ? preserved : availableIds;
            });
        } else {
            setAvailablePaymentOptions([]);
            setSelectedPaymentMethod([]);
        }
        setIsPaymentMethodsLoading(false);
    };

    const validateAllFields = useCallback((): boolean => {
        const amountError = validateAmount(dealData.amount);
        const priceError = validatePrice(dealData.price);
        const dateError = validateDate(dealData.date);
        const tokenError = !tokenTicker ? "Required!" : "";
        const currencyError = !dealData.currency ? "Required!" : "";
        const descriptionError = dealData.description.length < 10 ? 'Terms must be 10 characters or longer!' : "";
        const paymentMethodsError =
            dealData.type === "buy"
                ? ""
                : selectedPaymentMethod.length === 0
                    ? "Please select payment method!"
                    : "";
        const p2pSaleTimeError = !saleTime.hours || !saleTime.minutes ? "Required!" : "";

        const newErrors = {
            amount: amountError,
            price: priceError,
            date: dateError,
            p2pSaleTime: p2pSaleTimeError,
            token: tokenError,
            currency: currencyError,
            description: descriptionError,
            paymentMethods: paymentMethodsError
        };

        setErrors(newErrors);

        const timeout = setTimeout(() => {
            setErrors({
                amount: "",
                price: "",
                date: "",
                p2pSaleTime: "",
                token: "",
                currency: "",
                description: '',
                paymentMethods: ''
            });
        }, INPUT_ERROR_TIME);

        return !Object.values(newErrors).some(Boolean);
    }, [
        dealData.amount,
        dealData.price,
        dealData.date,
        dealData.currency,
        dealData.description,
        saleTime.hours,
        saleTime.minutes,
        tokenTicker,
        selectedPaymentMethod,
    ]);

    const isDealSummaryVisible =
        !!dealData.currency &&
        !!tokenTicker &&
        Number(dealData.amount) > 0 &&
        Number(dealData.price) > 0;
    const isSaleTimeSuccess = isValidP2PSaleTime(saleTime);

    useEffect(() => {
        if (!isVisible) return;

        setDealData(getDealInitialState(sourceDeal, isOffer));
        setTokenTicker(getInitialTokenTicker(sourceDeal));
        setSelectedPaymentMethod(getInitialPaymentMethodIds(sourceDeal));
        setSaleTime(getInitialSaleTime(sourceDeal?.p2pSaleTime));
        setErrors(errorsInitial);
        setIsPromoteDealChecked(false);
    }, [isVisible, dealDataInitial, repeatDealInitial, isOffer]);

    useEffect(() => {
        if (isVisible && dealData.type === "sell") {
            loadUserPaymentMethods();
        }
    }, [isVisible, dealData.type]);

    useEffect(() => {
        if (dealData.type === "buy") {
            setSelectedPaymentMethod([]);
            setErrors((prev) => ({ ...prev, paymentMethods: "" }));
        }
    }, [dealData.type]);

    if (isPaymentModalOpen) {
        return (
            <PaymentMethodModal
                isVisible={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    loadUserPaymentMethods();
                }}
            />
        );
    }

    return (
        <MainModal
            isVisible={isVisible}
            variant="deal"
            className="deal-modal p2p-modal"
            onClose={() => {
                setSelectedPaymentMethod([])
                handleReset()
                onClose()
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
                    />
                )}
            </ButtonsWrapper>
            <BalanceWrapper>
                <UserBalanceComponent
                    ethBalance={balance.eth}
                    usdcBalance={balance.usdc}
                />
            </BalanceWrapper>
            <InputsRow>
                <CustomNumberInput
                    key={isReset ? 'modal-open' : 'modal-closed'}
                    name="amount"
                    placeholder="Enter amount"
                    label="Amount"
                    value={Number(dealData.amount)}
                    onChange={(value: number) => inputsHandler(value, "amount")}
                    isPrice={false}
                    isError={!!errors.amount}
                    errorText={errors.amount}
                    isSuccess={Number(dealData.amount) > 0}
                />
                <CustomNumberInput
                    name="price"
                    placeholder="Enter price"
                    label="Price"
                    value={Number(dealData.price)}
                    onChange={(value: number) => inputsHandler(value, "price")}
                    isPrice={true}
                    isError={!!errors.price}
                    errorText={errors.price}
                    isSuccess={Number(dealData.price) > 0}
                />
            </InputsRow>
            <InputsRow>
                <TokenCurrency>
                    <DealInputLabel>You {upperCaseFirstLetter(dealData.type)} Token</DealInputLabel>
                    <ModalDropdown
                        options={currencies}
                        onChange={(value) => setTokenTicker(value as any)}
                        value={tokenTicker}
                    />
                    {
                        errors.currency
                            ?
                            <ErrorContainer>
                                <Lottie animationData={LottieError} />
                                <InputError>{errors.currency}</InputError>
                            </ErrorContainer>
                            :
                            <></>
                    }
                </TokenCurrency>
                <CurrencyWrapper>
                    <DealInputLabel>You {dealData.type === 'buy' ? 'Pay' : 'Receive'} Currency</DealInputLabel>
                    <CustomSelect
                        isModalOpen={resetToggle}
                        className="currency-select"
                        placeholder=""
                        options={[
                            { value: "USD", label: "USD", icon: <div style={{ background: '#2EBD85', color: "white" }} className="currency-icon">$</div> },
                            { value: "EUR", label: "EUR", icon: <div style={{ background: '#3498DB' }} className="currency-icon">€</div> },
                            { value: "UAH", label: "UAH", icon: <div style={{ background: '#3498DB' }} className="currency-icon">₴</div> },
                        ]}
                        onChange={(value: string) => inputsHandler(value, "currency")}
                    />
                    {
                        errors.token
                            ?
                            <ErrorContainer>
                                <Lottie animationData={LottieError} />
                                <InputError>{errors.token}</InputError>
                            </ErrorContainer>
                            :
                            <></>
                    }
                </CurrencyWrapper>
            </InputsRow>
            {
                isDealSummaryVisible
                    ?
                    <DealSummary
                        type={dealData.type}
                        amount={Number(dealData.amount)}
                        price={Number(dealData.price)}
                        token={tokenTicker!.name}
                        currency={dealData.currency || ''}
                        onReplace={() => inputsHandler(dealData.type === 'buy' ? "sell" : "buy", "type")}
                    />
                    :
                    <></>
            }
            {dealData.type === "sell" ? (
                <ServiceWrapper>
                    <DealInputLabel>
                        Payment Method
                        <button
                            type="button"
                            className="add-payment"
                            onClick={() => setIsPaymentModalOpen(true)}
                        >
                            + Add Payment Method
                        </button>
                    </DealInputLabel>
                    <CustomDropdown
                        options={availablePaymentOptions}
                        value={selectedPaymentMethod}
                        onChange={(value) => setSelectedPaymentMethod(value as string[])}
                        placeholder={
                            isPaymentMethodsLoading ? "Loading..." : "All payment methods"
                        }
                        multiSelect={true}
                        searchable={true}
                        showIcons={true}
                        className="payment-dropdown"
                    />
                    {errors.paymentMethods ? (
                        <ErrorContainer>
                            <Lottie animationData={LottieError} />
                            <InputError>{errors.paymentMethods}</InputError>
                        </ErrorContainer>
                    ) : (
                        <></>
                    )}
                </ServiceWrapper>
            ) : null}

            <InputsRow>
                <DateWrapper>
                    <DealInputLabel>Expiration Date</DealInputLabel>
                    <DateRow>
                        <DatePickerWrapper>
                            <ModalDatePicker
                                isSuccessIcon={true}
                                minDate={new Date()}
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
                <DateWrapper>
                    <DealInputLabel>Payment Time Limit</DealInputLabel>
                    <TimeInput
                        className={`p2p-time-input ${isSaleTimeSuccess ? "success" : ""}`}
                        initial={saleTime}
                        handler={(value) => setSaleTime(value)}
                    />
                    {
                        errors.p2pSaleTime
                            ?
                            <ErrorContainer>
                                <Lottie animationData={LottieError} />
                                <InputError>{errors.p2pSaleTime}</InputError>
                            </ErrorContainer>
                            :
                            <></>
                    }
                </DateWrapper>
            </InputsRow>


            <MessageWrapper>
                <DealInputLabel className="description-label">
                    Deal Terms
                </DealInputLabel>
                <textarea
                    value={dealData.description}
                    onChange={(e: any) => {
                        if (e.target.value.length > 300) return

                        inputsHandler(e.target.value, "description")
                    }}
                    placeholder="Enter deal description"
                />
                <span>300 Characters Max</span>
                {
                    errors.description
                        ?
                        <ErrorContainer>
                            <Lottie animationData={LottieError} />
                            <InputError>{errors.description}</InputError>
                        </ErrorContainer>
                        :
                        <></>
                }
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
                    <Button
                        onClick={handleReset} className={`reset-btn small`}>
                        <RotateCcw size={16} />
                        Reset
                    </Button>
                </ResetWrapper>
            </Buttons>
        </MainModal>
    );
};

export default CreateP2PDealModal
