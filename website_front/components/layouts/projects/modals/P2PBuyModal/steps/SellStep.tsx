import React, { FC, useContext, useEffect, useState } from 'react'
import * as S from "../styles";
import { IDeal } from '../../../../../../types/global_types';
import { Button } from '../../../../../global/common/Button';
import { EthIcon } from '../../../../../global/Icons';
import USDCIcon from '../../../../../global/Icons/Deals/USDCIcon';
import { clarifyAmount } from '../../../../../../helpers/clarifyAmount';
import { paymentMethodOptions } from '../../../OTC';
import { LoadingContext } from '../../../../../global/Layout';
import { blockDeal } from '../../../../../../http/p2p/blockDeal';
import { toast } from 'react-toastify';
import Checkbox from "../../../../../global/common/Checkbox";
import dealAction from "../../../../../../http/otc/dealAction";
import { getPaymentMethods, PaymentMethod } from "../../../../../../http/deals/paymentMethods";

export const formatPaymentMethod = (
    method:
        | string
        | { label?: string; bankName?: string; meta?: { bankKey?: string } }
) => {
    const methodMap: Record<string, string> = paymentMethodOptions.reduce((acc, option) => {
        acc[option.value] = option.label;
        return acc;
    }, {} as Record<string, string>);

    if (!method) return "";

    if (typeof method === "string") {
        return methodMap[method] || method.replace('_', ' ')
    }

    const label = method.label || method.bankName;
    if (label) return label;

    const bankKey = method.meta?.bankKey;
    if (bankKey) {
        return methodMap[bankKey] || bankKey.replace('_', ' ');
    }

    return "";
}

export const getCurrencyIcon = (currency: string) => {
    if (currency === 'UAH') {
        return <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
        >
            <rect
                width="20"
                height="20"
                rx="10"
                fill="url(#pattern0_557_8213)"
            />
            <defs>
                <pattern
                    id="pattern0_557_8213"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                >
                    <use
                        xlinkHref="#image0_557_8213"
                        transform="translate(-0.00520833) scale(0.0104167)"
                    />
                </pattern>
                <image
                    id="image0_557_8213"
                    width="97"
                    height="96"
                    preserveAspectRatio="none"
                    xlinkHref="data:image/png;base64,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"
                />
            </defs>
        </svg>
    }

    if (currency === 'USD') {
        <></>
    }

    if (currency === 'EUR') {
        return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" >
            <rect width="20" height="20" rx="10" fill="url(#pattern0_338_11301)" />
            <defs>
                <pattern id="pattern0_338_11301" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use href="#image0_338_11301" transform="translate(-0.00520833) scale(0.0104167)" />
                </pattern>
                <image id="image0_338_11301" width="97" height="96" preserveAspectRatio="none" href="data:image/png;base64,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" />
            </defs>
        </svg>

    }
}

export const getDealTicker = (ticker?: 'usd' | 'eth'): string => {
    return ticker === 'eth' ? 'ETH' : 'USDC'
}

interface IProps {
    deal: IDeal | null
    refetchDeals?: () => void
    onOpenPaymentModal: () => void
    onClose: () => void
}

const SellStep: FC<IProps> = ({ deal, refetchDeals, onOpenPaymentModal, onClose }) => {
    const { loadingStateHandler } = useContext(LoadingContext);
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
    const [isPaymentMethodsLoading, setIsPaymentMethodsLoading] = useState(false);

    const loadUserPaymentMethods = async (): Promise<void> => {
        setIsPaymentMethodsLoading(true);
        const { isSuccess, methods } = await getPaymentMethods();

        if (isSuccess && methods.length > 0) {
            setAvailablePaymentMethods(methods);
            setSelectedPaymentMethodIds(methods.map((method) => method._id));
        } else {
            setAvailablePaymentMethods([]);
            setSelectedPaymentMethodIds([]);
        }

        setIsPaymentMethodsLoading(false);
    };

    useEffect(() => {
        void loadUserPaymentMethods();
    }, []);

    const togglePaymentMethod = (methodId: string): void => {
        setSelectedPaymentMethodIds((prev) => (
            prev.includes(methodId)
                ? prev.filter((id) => id !== methodId)
                : [...prev, methodId]
        ));
    };

    const confirmSell = async (): Promise<void> => {
        if (!deal) return

        if (!selectedPaymentMethodIds.length) {
            toast.error("Please select at least one payment method.");
            return;
        }

        loadingStateHandler(true)

        const { success, message } = await blockDeal(deal._id);

        if (!success) {
            toast.error(message || "Failed to block deal. Please try again.");
            loadingStateHandler(false)
            return;
        }

        const { isSuccess } = await dealAction("confirm/sell", deal._id, "PATCH", {
            paymentMethods: selectedPaymentMethodIds,
        });

        if (!isSuccess) {
            toast.error("Failed to save payment methods. Please try again.");
            loadingStateHandler(false)
            return;
        }

        toast.success("Deal blocked successfully. Waiting for confirmation.");
        await refetchDeals?.();
        onClose();
        loadingStateHandler(false)
    }

    if (!deal) return <></>

    return (
        <S.StepContent>
            <S.Section>
                <S.SectionTitle>Terms from Buyer</S.SectionTitle>
                <S.TermsText>{deal.description}</S.TermsText>
            </S.Section>

            <S.Section>
                <S.SectionTitle>You Sell</S.SectionTitle>
                <S.AmountInput>
                    <S.AmountValue>{deal.amount}</S.AmountValue>
                    <S.CurrencyBadge>
                        {
                            deal.ticker === 'eth'
                                ?
                                <EthIcon />
                                :
                                <USDCIcon />
                        }
                        <span>{getDealTicker(deal.ticker)}</span>
                    </S.CurrencyBadge>
                </S.AmountInput>
                <S.InfoLabel>Fee: 5%</S.InfoLabel>
            </S.Section>

            <S.Section>
                <S.SectionTitle>You Receive</S.SectionTitle>
                <S.AmountInput>
                    <S.AmountValue>{clarifyAmount(deal.price)}</S.AmountValue>
                    <S.CurrencyBadge>
                        <span>{getCurrencyIcon(deal.currency || '')}</span>
                    </S.CurrencyBadge>
                </S.AmountInput>
            </S.Section>

            <S.Section>
                <S.SectionTitle>
                    Payment Method
                    <button
                        type="button"
                        className="add-payment"
                        onClick={onOpenPaymentModal}
                        style={{ marginLeft: 8, color: "#04A584", fontSize: 12, fontWeight: "var(--font-weight-medium)" }}
                    >
                        + Add Payment Method
                    </button>
                </S.SectionTitle>
                <S.PaymentMethodsList>
                    {
                        isPaymentMethodsLoading
                            ?
                            <span style={{ color: "#728094", fontSize: 12 }}>Loading payment methods...</span>
                            :
                            availablePaymentMethods.length
                                ?
                                availablePaymentMethods.map((method) => {
                                    const isSelected = selectedPaymentMethodIds.includes(method._id);
                                    return (
                                        <S.PaymentMethodItem
                                            key={method._id}
                                            selected={isSelected}
                                            onClick={() => togglePaymentMethod(method._id)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => { }}
                                            />
                                            <span>
                                                {formatPaymentMethod(method)}
                                                {method?.holderName && <span style={{ color: '#728094', fontSize: 12 }}> - {method.holderName}</span>}
                                                {method?.cardLast4 && <span style={{ color: '#728094', fontSize: 12 }}> (*{method.cardLast4})</span>}
                                            </span>
                                        </S.PaymentMethodItem>
                                    )
                                })
                                :
                                <span style={{ color: "#728094", fontSize: 12 }}>
                                    You have no payment methods yet. Add one to proceed.
                                </span>
                    }
                </S.PaymentMethodsList>
            </S.Section>

            <S.WarningBox>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "14px",
                    }}
                >
                    <svg
                        width="17"
                        height="15"
                        viewBox="0 0 17 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M8.5 8.28753V4.36266M8.5 11.1967V11.2312M13.5399 14.5H3.46006C2.0832 14.5 0.921265 13.6042 0.555691 12.3787C0.399637 11.8556 0.591385 11.3107 0.884674 10.8468L5.92461 1.9009C7.10542 0.0330327 9.89458 0.0330354 11.0754 1.9009L13.5954 6.37384L16.1153 10.8468C16.4086 11.3107 16.6004 11.8556 16.4443 12.3787C16.0787 13.6042 14.9168 14.5 13.5399 14.5Z"
                            stroke="#FFC704"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    Heads up!
                </div>
                Double-check the buyer’s details before sending funds.
            </S.WarningBox>

            <S.ButtonWrapper>
                <Button
                    variant="primary"
                    onClick={confirmSell}
                    disabled={!selectedPaymentMethodIds.length || isPaymentMethodsLoading}
                >
                    Proceed
                </Button>
            </S.ButtonWrapper>
        </S.StepContent>
    )
}

export default SellStep
