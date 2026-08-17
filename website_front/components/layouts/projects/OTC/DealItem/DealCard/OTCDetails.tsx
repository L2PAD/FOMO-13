import React from 'react';
import Image from 'next/image';
import moment from 'moment';
import { IDeal } from '../../../../../../types/global_types';
import { clarifyAmount } from '../../../../../../helpers/clarifyAmount';
import {
    StatusesIcons,
} from '../../../../../../utils/otcConstants';
import DescriptionComponent from '../../../../../global/common/DescriptionComponent';
import { CopyButton } from '../../../modals/DepositModal/styles';
import { CopyIcon } from '../../../../../global/Icons';
import copy from 'clipboard-copy';
import { toast } from 'react-toastify';
import sliceAddress from '../../../../../../helpers/sliceAddress';
import {
    DealDetails,
    DealDetailsItem,
    DealStatusWrapper,
    DescriptionStatus,
} from '../styles';
import { useTranslation } from 'i18n';

interface OtcDealDetailsProps {
    item: IDeal;
    isRealAsset: boolean;
    isEnded: boolean;
    isTimeEnded: boolean;
    isReviewAccess: boolean;
    isStatusHover: boolean;
    onStatusHover: (hover: boolean) => void;
    getCurrentStatusText: () => string;
    getStatusDescription: () => string;
}

const OtcDealDetails: React.FC<OtcDealDetailsProps> = ({
    item,
    isRealAsset,
    isEnded,
    isTimeEnded,
    isReviewAccess,
    isStatusHover,
    onStatusHover,
    getCurrentStatusText,
    getStatusDescription,
}) => {
    const { t } = useTranslation();

    return (
        <DealDetails className="details">
            <DealDetailsItem>
                <span>{t("deals.labels.type")}</span>
                <div>{t(`deals.type.${item.type === "buy" ? "buying" : "selling"}`)}</div>
            </DealDetailsItem>

            {isRealAsset && (
                <DealDetailsItem>
                    <span>{t("deals.labels.smartContractAddress")}</span>
                    <div>{sliceAddress(item.smartContract)}</div>
                    <CopyButton
                        onClick={() => {
                            copy(item.smartContract || '');
                            toast.success(t("deals.toast.smartContractCopied"));
                        }}
                    >
                        <CopyIcon />
                    </CopyButton>
                </DealDetailsItem>
            )}

            <DealDetailsItem>
                <span>{t("deals.labels.price")}</span>
                <div>
                    {item.ticker.toLowerCase() === "eth"
                        ? `${item.price} ETH`
                        : `$${item.price < 100 ? item.price : clarifyAmount(item.price)}`}
                </div>
            </DealDetailsItem>

            <DealDetailsItem>
                <span>{t("deals.labels.amount")}</span>
                <div>{item.amount}</div>
            </DealDetailsItem>

            <DealDetailsItem>
                <span>{isRealAsset ? t("deals.labels.tokenName") : t("deals.labels.serviceType")}</span>
                <div>{item.serviceType}</div>
            </DealDetailsItem>

            <DealDetailsItem>
                <span>{t("deals.labels.expirationDate")}</span>
                <div>{moment(item.date).format("DD.MM.YYYY HH:mm")}</div>
            </DealDetailsItem>

            <DealDetailsItem>
                <span>{t("deals.labels.status")}</span>
                <DealStatusWrapper
                    onMouseLeave={() => onStatusHover(false)}
                    onMouseOver={() => onStatusHover(true)}
                    status={item.isAppeal ? 'blocked' : (!isEnded && isTimeEnded ? "blocked" : item.status)}
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

export default OtcDealDetails;
