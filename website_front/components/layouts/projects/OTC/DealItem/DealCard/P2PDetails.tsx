import React from 'react';
import Image from 'next/image';
import moment from 'moment';
import { IDeal } from '../../../../../../types/global_types';
import {
    StatusesIcons,
} from '../../../../../../utils/otcConstants';
import DescriptionComponent from '../../../../../global/common/DescriptionComponent';
import {
    DealDetails,
    DealDetailsItem,
    DealStatusWrapper,
    DescriptionStatus,
} from '../styles';
import { clarifyAmount } from '../../../../../../helpers/clarifyAmount';
import { simplifyAmount } from '../../../../../../helpers/simplifyAmount';
import { paymentMethodOptions } from '../..';
import { useTranslation } from 'i18n';

interface P2PDealDetailsProps {
    item: IDeal;
    isEnded: boolean;
    isTimeEnded: boolean;
    isReviewAccess: boolean;
    isStatusHover: boolean;
    onStatusHover: (hover: boolean) => void;
    getCurrentStatusText: () => string;
    getStatusDescription: () => string;
}

const P2PDealDetails: React.FC<P2PDealDetailsProps> = ({
    item,
    isEnded,
    isTimeEnded,
    isReviewAccess,
    isStatusHover,
    onStatusHover,
    getCurrentStatusText,
    getStatusDescription,
}) => {
    const { t } = useTranslation();
    const paymentMethods = Array.isArray(item.paymentMethods) ? item.paymentMethods : [];

    const getPaymentMethodLabel = (method: any): string | null => {
        if (!method) return null;

        if (typeof method === "string") {
            const option = paymentMethodOptions.find(opt => opt.value === method);
            return option ? option.label : method.replace('_', ' ');
        }

        if (method.label || method.bankName) {
            return method.label || method.bankName;
        }

        const bankKey = method.meta?.bankKey as string | undefined;
        if (bankKey) {
            const option = paymentMethodOptions.find(opt => opt.value === bankKey);
            return option ? option.label : bankKey.replace('_', ' ');
        }

        return null;
    };

    const getPaymentMethodIcon = (method: any): string | null => {
        if (!method) return null;

        if (typeof method === "string") {
            const option = paymentMethodOptions.find(opt => opt.value === method);
            return option?.icon || null;
        }

        const bankKey = method.meta?.bankKey as string | undefined;
        if (bankKey) {
            const option = paymentMethodOptions.find(opt => opt.value === bankKey);
            return option?.icon || null;
        }

        const label = method.label || method.bankName;
        if (label) {
            const normalized = label.toLowerCase().replace(/[^a-z0-9]/g, "");
            const option = paymentMethodOptions.find(
                opt => opt.label.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
            );
            return option?.icon || null;
        }

        return null;
    };

    const getPaymentMethodLabels = (methodValues: any[]) => {
        return methodValues
            .map((value) => getPaymentMethodLabel(value))
            .filter(Boolean) as string[];
    };

    const paymentLabels = getPaymentMethodLabels(paymentMethods);
    const paymentItems = paymentMethods
        .map((method) => ({
            label: getPaymentMethodLabel(method),
            icon: getPaymentMethodIcon(method),
        }))
        .filter((item) => item.label) as { label: string; icon: string | null }[];

    const renderPaymentMethods = () => {
        if (paymentItems.length === 0) {
            return <div>{t("deals.payment.allMethods")}</div>;
        }

        if (paymentItems.length === 1) {
            return (
                <div className="payment-methods">
                    {paymentItems[0].icon && (
                        <span className="payment-icon">
                            <img src={paymentItems[0].icon} alt={paymentItems[0].label} />
                        </span>
                    )}
                    <div>{paymentItems[0].label}</div>
                </div>
            );
        }

        const remainingCount = paymentItems.length - 1;

        return (
            <div className="payment-methods">
                <div>{t("deals.payment.allMethods")}</div>
                <button className="tooltip-button" type="button">
                    <span style={{ color: "#04A584" }}>+{remainingCount}</span>
                    <span className="tooltip-text" style={{ textAlign: "left" }}>
                        {paymentItems.map((method, index) => (
                            <span className="tooltip-row" key={`${method.label}-${index}`}>
                                {method.icon && (
                                    <span className="payment-icon">
                                        <img src={method.icon} alt={method.label} />
                                    </span>
                                )}
                                <span>{method.label}</span>
                            </span>
                        ))}
                    </span>
                </button>
            </div>
        );
    };

    return (
        <DealDetails className="details">
            <DealDetailsItem>
                <span>{t("deals.labels.type")}</span>
                <div>{t(`deals.type.${item.type === "buy" ? "buy" : "sell"}`)}</div>
            </DealDetailsItem>
            <DealDetailsItem>
                <span>{t("deals.labels.totalPrice")}</span>
                <div>{item.price} {item.currency}</div>
            </DealDetailsItem>
            <DealDetailsItem>
                <span>{t("deals.labels.amount")}</span>
                <div>{clarifyAmount(Number(item.amount))} {item.ticker === 'usd' ? 'USDC' : 'ETH'}</div>
            </DealDetailsItem>
            <DealDetailsItem>
                <span>{t("deals.labels.cryptocurrency")}</span>
                <div>{item.ticker === 'usd' ? 'USDC' : 'ETH'}</div>
            </DealDetailsItem>
            <DealDetailsItem>
                <span>{t("deals.labels.payment")}</span>
                {renderPaymentMethods()}
            </DealDetailsItem>
            <DealDetailsItem>
                <span>{t("deals.labels.endDate")}</span>
                <div>{moment(item.date).format("DD.MM.YYYY HH:mm")}</div>
            </DealDetailsItem>
            <DealDetailsItem>
                <span>{t("deals.labels.status")}</span>
                <DealStatusWrapper
                    onMouseLeave={() => onStatusHover(false)}
                    onMouseOver={() => onStatusHover(true)}
                    status={item.isAppeal ? "blocked" : (!isEnded && isTimeEnded ? "blocked" : item.status)}
                >
                    <Image
                        src={
                            item.isAppeal
                                ? StatusesIcons.appeal
                                : !isEnded && isTimeEnded
                                ? StatusesIcons.blocked
                                : StatusesIcons[item.status]
                        }
                        alt={item.isAppeal ? "appeal" : item.status}
                    />
                    <span>{getCurrentStatusText()}</span>
                </DealStatusWrapper>
                <DescriptionStatus isVisible={isStatusHover}>
                    <DescriptionComponent
                        isVisible={isStatusHover}
                        date={item.lastStatusUpdate}
                        text={getStatusDescription()}
                    />
                </DescriptionStatus>
            </DealDetailsItem>
        </DealDetails>
    );
};

export default P2PDealDetails;
