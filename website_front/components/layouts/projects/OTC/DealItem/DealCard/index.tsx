import React, { useState } from 'react';
import Image from 'next/image';
import moment from 'moment';
import { Paperclip, RefreshCcw } from 'lucide-react';
import OtcComment from '../../../../../global/common/OtcComment';
import { IDeal, IUser } from '../../../../../../types/global_types';
import OtcLike from '../../../../../global/Icons/OtcLike';
import OtcDislike from '../../../../../global/Icons/OtcDislike';
import BuyIcon from '../../../../../../assets/icons/otc/buy-item.svg';
import SellIcon from '../../../../../../assets/icons/otc/sell-item.svg';
import { DealDetailsComponent } from '../DealRightColumn';
import { ActionHandlerVariants } from '../../DealsList';
import P2PDealDetails from './P2PDetails';
import OtcDealDetails from './OTCDetails';
import { ShareIcon } from '../../../../../global/Icons';
import RedFlag from '../../../../../global/RedFlag';
import UserAvatar from '../../../../../global/common/UserAvatar';
import imageLoader from '../../../../../../helpers/imageLoader';
import sliceAddress from '../../../../../../helpers/sliceAddress';
import { clarifyAmount } from '../../../../../../helpers/clarifyAmount';
import {
    statuses,
    StatusesDescription,
    StatusesIcons,
} from '../../../../../../utils/otcConstants';
import {
    Wrapper,
    DealColumn,
    DealInfo,
    DealName,
    CommentText,
    DealActions,
    DealIconWrapper,
    DealDetails,
    PromoteLabel,
    PromoteWrapper,
    PromoteDescription,
    MobileActionsColumn,
    MobileCustomDealLabel,
    MobileDate,
    MobileDealTitle,
    MobileDescription,
    MobileDetailsItem,
    MobileDetailsList,
    MobileFlipCard,
    MobileFlipFace,
    MobileFlipScene,
    MobileFooter,
    MobileIconsRow,
    MobileRiskRow,
    MobileStatusValue,
    MobileTopRow,
    MobileUserRow,
} from '../styles';
import SponsoredIcon from '../../../../../global/Icons/SponsoredIcon';
import DescriptionComponent from '../../../../../global/common/DescriptionComponent';
import HighlightedText from '../../../../../global/HighlightedText';
import { usePromoteCountdown } from '../../../../../../hooks/usePromoteCountdown';
import { getColorByStatus } from '../../DealsList/styles';
import { paymentMethodOptions } from '../..';
import { useTranslation } from 'i18n';

interface DealCardProps {
    item: IDeal;
    isOffer?: boolean;
    isFirstOffer?: boolean;
    hideMainActionButton?: boolean;
    userData?: IUser;
    isP2p?: boolean;
    isRealAsset: boolean;
    isEnded: boolean;
    isTimeEnded: boolean;
    isReviewAccess: boolean;
    mainDealButton: React.ReactNode;
    searchValue: string;
    isVisiblePromote?: boolean;
    setIsVisiblePromote?: (visible: boolean) => void;
    dealActionsHandler: (actionType: ActionHandlerVariants, item: IDeal) => Promise<void>;
}

const DealCard: React.FC<DealCardProps> = ({
    item,
    isVisiblePromote,
    isOffer,
    isFirstOffer,
    hideMainActionButton = false,
    userData,
    isP2p = false,
    isRealAsset,
    isEnded,
    isTimeEnded,
    isReviewAccess,
    mainDealButton,
    searchValue,
    setIsVisiblePromote,
    dealActionsHandler,
}) => {
    const { t } = useTranslation();
    const { minutes, seconds } = usePromoteCountdown(
        item?.promoteDateEnd
    );
    const [isStatusHover, setIsStatusHover] = useState<boolean>(false);
    const [isPromoteHover, setIsPromoteHover] = useState<boolean>(false);
    const [isMobileFlipped, setIsMobileFlipped] = useState<boolean>(false);

    const translateDealStatus = (status?: string): string =>
        t(`deals.status.${status || "unknown"}`, {
            defaultValue: status ? statuses[status as keyof typeof statuses] || status : "Unknown",
        });

    const translateStatusDescription = (status: keyof typeof StatusesDescription): string =>
        t(`deals.statusDescriptions.${status}`, {
            defaultValue: StatusesDescription[status],
        });

    const getCurrentStatusText = (): string => {
        if (item.isAppeal) return t("deals.status.appealSubmitted");
        if (item.isCompleteByAdmin) return t("deals.status.closed");
        if (isReviewAccess) return t("deals.status.reviewExpected");
        if (!!item.isReservedFunds && !isEnded) return t("deals.status.fundsReserved");
        if (isTimeEnded) return t("deals.status.timeExpired");

        return translateDealStatus(item.status);
    };

    const getStatusDescription = (): string => {
        if (item.isAppeal) return translateStatusDescription("appeal");
        if (item.isCompleteByAdmin) return translateStatusDescription("forced-termination");
        if (isReviewAccess) return translateStatusDescription("review");
        if (isTimeEnded) return t("deals.statusDescriptions.unavailable");

        const statusKey = (
            !!item.isReservedFunds && item.status !== "ended"
                ? "reserved"
                : item.status
        ) as keyof typeof StatusesDescription;

        return translateStatusDescription(statusKey);
    };

    const statusIconKey: keyof typeof StatusesIcons = item.isAppeal
        ? 'appeal'
        : !isEnded && isTimeEnded
            ? 'blocked'
            : item.status;

    const statusColor = item.isAppeal || (!isEnded && isTimeEnded)
        ? getColorByStatus('blocked')
        : getColorByStatus(item.status);

    const isBuyType = item.type === "buy";
    const userAvatar = item.creator?.photo
        ? imageLoader(String(item.creator.photo))
        : (item.creator?.twitterData?.photo || "");

    const renderMobileDetails = () => {
        const paymentMethods = Array.isArray(item.paymentMethods) ? item.paymentMethods : [];
        const getPaymentMethodLabel = (method: any): string | null => {
            if (!method) return null;

            if (typeof method === "string") {
                const option = paymentMethodOptions.find((opt) => opt.value === method);
                return option ? option.label : method.replace("_", " ");
            }

            if (method.label || method.bankName) {
                return method.label || method.bankName;
            }

            const bankKey = method.meta?.bankKey as string | undefined;
            if (bankKey) {
                const option = paymentMethodOptions.find((opt) => opt.value === bankKey);
                return option ? option.label : bankKey.replace("_", " ");
            }

            return null;
        };

        const paymentLabels = paymentMethods
            .map((value) => getPaymentMethodLabel(value))
            .filter(Boolean) as string[];

        if (isP2p) {
            return (
                <MobileDetailsList>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.type")}</span>
                        <b>{t(`deals.type.${isBuyType ? "buy" : "sell"}`)}</b>
                    </MobileDetailsItem>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.totalPrice")}</span>
                        <b>{item.price} {item.currency}</b>
                    </MobileDetailsItem>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.amount")}</span>
                        <b>{clarifyAmount(Number(item.amount))} {item.ticker === "usd" ? "USDC" : "ETH"}</b>
                    </MobileDetailsItem>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.cryptocurrency")}</span>
                        <b>{item.ticker === "usd" ? "USDC" : "ETH"}</b>
                    </MobileDetailsItem>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.payment")}</span>
                        <b>{paymentLabels.length ? paymentLabels.join(", ") : t("deals.payment.allMethods")}</b>
                    </MobileDetailsItem>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.endDate")}</span>
                        <b>{moment(item.date).format("DD.MM.YYYY HH:mm")}</b>
                    </MobileDetailsItem>
                    <MobileDetailsItem>
                        <span>{t("deals.labels.status")}</span>
                        <MobileStatusValue color={statusColor}>
                            <Image src={StatusesIcons[statusIconKey]} alt="status" />
                            {getCurrentStatusText()}
                        </MobileStatusValue>
                    </MobileDetailsItem>
                </MobileDetailsList>
            );
        }

        return (
            <MobileDetailsList>
                <MobileDetailsItem>
                    <span>{t("deals.labels.type")}</span>
                    <b>{t(`deals.type.${isBuyType ? "buying" : "selling"}`)}</b>
                </MobileDetailsItem>
                {isRealAsset && (
                    <MobileDetailsItem>
                        <span>{t("deals.labels.smartContractAddress")}</span>
                        <b>{sliceAddress(item.smartContract || "")}</b>
                    </MobileDetailsItem>
                )}
                <MobileDetailsItem>
                    <span>{t("deals.labels.price")}</span>
                    <b>
                        {item.ticker.toLowerCase() === "eth"
                            ? `${item.price} ETH`
                            : `$${item.price < 100 ? item.price : clarifyAmount(item.price)}`}
                    </b>
                </MobileDetailsItem>
                <MobileDetailsItem>
                    <span>{t("deals.labels.amount")}</span>
                    <b>{item.amount}</b>
                </MobileDetailsItem>
                <MobileDetailsItem>
                    <span>{isRealAsset ? t("deals.labels.tokenName") : t("deals.labels.serviceType")}</span>
                    <b>{item.serviceType}</b>
                </MobileDetailsItem>
                <MobileDetailsItem>
                    <span>{t("deals.labels.expirationDate")}</span>
                    <b>{moment(item.date).format("DD.MM.YYYY HH:mm")}</b>
                </MobileDetailsItem>
                <MobileDetailsItem>
                    <span>{t("deals.labels.status")}</span>
                    <MobileStatusValue color={statusColor}>
                        <Image src={StatusesIcons[statusIconKey]} alt="status" />
                        {getCurrentStatusText()}
                    </MobileStatusValue>
                </MobileDetailsItem>
            </MobileDetailsList>
        );
    };

    const renderMobileTop = () => (
        <MobileTopRow>
            <MobileUserRow>
                <UserAvatar
                    size="otc"
                    variant="default"
                    avatar={userAvatar}
                    name={item.creator?.username || "User"}
                />
                <div className="meta">
                    <div className="name">{item.creator?.username || "User"}</div>
                    <div className="wallet">{sliceAddress(item.creator?.wallet || "")}</div>
                </div>
            </MobileUserRow>
            <MobileActionsColumn>
                <MobileIconsRow>
                    {!isOffer && (
                        <button onClick={() => dealActionsHandler("share", item)}>
                            <ShareIcon fill="#04A584" />
                        </button>
                    )}
                    {!isOffer && (
                        <button onClick={() => dealActionsHandler(item.isPinned ? "unpin" : "pin", item)}>
                            <Paperclip color={item.isPinned ? "var(--main-green)" : "var(--main-gray)"} size={18} />
                        </button>
                    )}
                    {!isOffer && (
                        <button onClick={() => dealActionsHandler("chat", item)}>
                            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z" stroke="#05A584" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                    <button onClick={() => setIsMobileFlipped((prev) => !prev)}>
                        <RefreshCcw color="#728094" size={16} />
                    </button>
                </MobileIconsRow>

            </MobileActionsColumn>
        </MobileTopRow>
    );

    const renderMobileFrontContent = () => (
        <>
            {renderMobileTop()}
            <MobileCustomDealLabel>
                {isP2p ? t("deals.labels.customDeal") : t(`deals.labels.${isBuyType ? "buyDeal" : "sellDeal"}`)}
            </MobileCustomDealLabel>
            {renderMobileDetails()}
            <MobileFooter>
                {!hideMainActionButton && (
                    <div className="mobile-main-button">
                        {mainDealButton}
                    </div>
                )}
            </MobileFooter>
        </>
    );

    const renderMobileBackContent = () => (
        <>
            {renderMobileTop()}
            <DealInfo>
                <MobileDealTitle>
                    {item.section === "otc" ? (
                        <HighlightedText text={item.name} searchValue={searchValue} />
                    ) : (
                        item.name
                    )}
                </MobileDealTitle>
                <MobileDescription>
                    <HighlightedText text={item.description} searchValue={searchValue} />
                </MobileDescription>
                <MobileDate>{moment(item.createDate).format("DD.MM.YYYY HH:mm")}</MobileDate>
            </DealInfo>
            <MobileFooter>
                <div className="mobile-likes">
                    <button onClick={() => dealActionsHandler("like", item)}>
                        <OtcLike
                            status={item.likes?.includes(String(userData?._id)) ? "active" : "default"}
                        />
                        <span>{item.likes?.length || 0}</span>
                    </button>
                    <button onClick={() => dealActionsHandler("dislike", item)}>
                        <OtcDislike
                            status={item.dislikes?.includes(String(userData?._id)) ? "active" : "default"}
                        />
                        <span>{item.dislikes?.length || 0}</span>
                    </button>
                </div>
            </MobileFooter>
        </>
    );

    return (
        <Wrapper
            id={item.isSponsored ? 'sponsored-deal' : undefined}
            type={item.type}
            className={`${isFirstOffer ? "first" : ""} deal-item`}
            isOffer={!!isOffer}
            isHaveOffers={!!item.offersList?.length}
        >
            {
                item.isSponsored
                    ?
                    <PromoteWrapper>
                        <PromoteLabel
                            onMouseEnter={() => setIsPromoteHover(true)}
                            onMouseLeave={() => setIsPromoteHover(false)}
                        >
                            <SponsoredIcon />
                            <button
                                onClick={() => setIsVisiblePromote && setIsVisiblePromote(false)}
                                className='promote-button'>
                                {t("deals.labels.promoted")}
                                <small style={{ marginLeft: 6 }}>
                                    {minutes}:{seconds.toString().padStart(2, '0')}
                                </small>
                                <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L6.00081 5.58L11 1" stroke="#0FA4E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </button>
                        </PromoteLabel>
                        <PromoteDescription>
                            <DescriptionComponent
                                className='gray-description'
                                isVisible={isPromoteHover}
                                isDate={false}
                                date={item.lastStatusUpdate}
                                text={t("deals.promoted.description")}
                            />
                        </PromoteDescription>
                    </PromoteWrapper>
                    :
                    null
            }
            <DealColumn className="column desktop-only">
                <OtcComment searchValue={searchValue} deal={item} />
                <DealInfo>
                    <DealName>{
                        item.section === 'otc'
                            ?
                            <HighlightedText text={item.name} searchValue={searchValue} />
                            :
                            item.name
                    }</DealName>
                    <CommentText className="comment-text">
                        <HighlightedText text={item.description} searchValue={searchValue} />
                    </CommentText>
                    <DealActions>
                        <button onClick={() => dealActionsHandler("like", item)}>
                            <OtcLike
                                status={
                                    item.likes?.includes(String(userData?._id))
                                        ? "active"
                                        : "default"
                                }
                            />
                            <span>{item.likes?.length || 0}</span>
                        </button>
                        <button onClick={() => dealActionsHandler("dislike", item)}>
                            <OtcDislike
                                status={
                                    item.dislikes?.includes(String(userData?._id))
                                        ? "active"
                                        : "default"
                                }
                            />
                            <span>{item.dislikes?.length || 0}</span>
                        </button>
                    </DealActions>
                </DealInfo>
            </DealColumn>

            <DealIconWrapper className="desktop-only">
                {item.type === "buy" ? (
                    <Image src={BuyIcon} alt="buy" />
                ) : (
                    <Image src={SellIcon} alt="sell" />
                )}
            </DealIconWrapper>

            <DealDetails className="details desktop-only">
                {isP2p ? (
                    <P2PDealDetails
                        item={item}
                        isEnded={isEnded}
                        isTimeEnded={isTimeEnded}
                        isReviewAccess={isReviewAccess}
                        isStatusHover={isStatusHover}
                        onStatusHover={setIsStatusHover}
                        getCurrentStatusText={getCurrentStatusText}
                        getStatusDescription={getStatusDescription}
                    />
                ) : (
                    <OtcDealDetails
                        item={item}
                        isRealAsset={isRealAsset}
                        isEnded={isEnded}
                        isTimeEnded={isTimeEnded}
                        isReviewAccess={isReviewAccess}
                        isStatusHover={isStatusHover}
                        onStatusHover={setIsStatusHover}
                        getCurrentStatusText={getCurrentStatusText}
                        getStatusDescription={getStatusDescription}
                    />
                )}
            </DealDetails>

            <DealDetailsComponent
                className="desktop-only"
                risk={item.creator?.risk || 'Default'}
                redFlags={item.creator?.redFlags || 0}
                mainDealButton={hideMainActionButton ? null : mainDealButton}
                smartContract={item.smartContract}
                isRealAsset={isRealAsset}
                isPinned={!!item.isPinned}
                isOffer={!!isOffer}
                hideMainActionButton={hideMainActionButton}
                onShare={() => dealActionsHandler("share", item)}
                onAttach={() => dealActionsHandler(item.isPinned ? 'unpin' : 'pin', item)}
                onOpenChat={() => dealActionsHandler('chat', item)}
            />

            <MobileFlipScene>
                <MobileFlipCard data-screenshot-flip-card flipped={isMobileFlipped}>
                    <div className="mobile-front-sizer" aria-hidden="true">
                        {renderMobileFrontContent()}
                    </div>
                    <MobileFlipFace data-screenshot-face="front">
                        {renderMobileFrontContent()}
                    </MobileFlipFace>
                    <MobileFlipFace data-screenshot-face="back" back>
                        {renderMobileBackContent()}
                    </MobileFlipFace>
                </MobileFlipCard>
            </MobileFlipScene>
        </Wrapper>
    );
};

export default DealCard;
