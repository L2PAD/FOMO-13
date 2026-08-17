import React from 'react';
import Image from 'next/image';
import moment from 'moment';
import { Paperclip } from 'lucide-react';
import OtcComment from '../../../../global/common/OtcComment';
import { IDeal, IUser } from '../../../../../types/global_types';
import OtcLike from '../../../../global/Icons/OtcLike';
import OtcDislike from '../../../../global/Icons/OtcDislike';
import { clarifyAmount } from '../../../../../helpers/clarifyAmount';
import RedFlag from '../../../../global/RedFlag';
import { CopyIcon, ShareIcon } from '../../../../global/Icons';
import { DefaultActionWrapper, OffersButton } from '../DealsList/styles';
import { ActionHandlerVariants } from '../DealsList';
import PioneerBadge from '../../../../../assets/icons/badges/XP Pioneer.png';
import MasterBadge from '../../../../../assets/icons/badges/Onboarding Master.png';
import ProjectReviewerBadge from '../../../../../assets/icons/badges/Project Reviewer.png';
import TopPredictorBadge from '../../../../../assets/icons/badges/Top Predictor.png';
import BuyIcon from '../../../../../assets/icons/otc/buy-item.svg';
import SellIcon from '../../../../../assets/icons/otc/sell-item.svg';
import { BadgesRow } from '../../../gemslab/Profile/styles';
import { ShareWrapper } from '../Market/styles';
import EmptyList from '../../../../global/EmptyList';
import copy from 'clipboard-copy'
import { toast } from 'react-toastify';
import {
    DealActions,
    DealColumn,
    DealDetails,
    DealDetailsItem,
    DealIconWrapper,
    DealInfo,
    DealButtons,
    DealRightColumn,
    DealRightHeader,
    DetailsCard,
    EmptyDetailsWrapper,
} from './styles';
import sliceAddress from '../../../../../helpers/sliceAddress';
import { CopyButton } from '../../modals/DepositModal/styles';
import { useTranslation } from 'i18n';

const resolveCounterpartyUser = (item: IDeal, userData?: IUser): IUser | undefined => {
    const currentUserId = String(userData?._id || "");
    const creatorId = String(item.creator?._id || "");
    const buyerId = String(item.buyer?._id || "");
    const sellerId = String(item.seller?._id || "");
    const hasBuyer = !!buyerId && buyerId !== "undefined" && buyerId !== "null";
    const hasSeller = !!sellerId && sellerId !== "undefined" && sellerId !== "null";

    const isBuyerSecondParticipant = hasBuyer && buyerId !== creatorId;
    const isSellerSecondParticipant = hasSeller && sellerId !== creatorId;

    if (currentUserId) {
        if (currentUserId === creatorId) {
            if (isBuyerSecondParticipant) return item.buyer || undefined;
            if (isSellerSecondParticipant) return item.seller || undefined;
            return undefined;
        }

        if (currentUserId === buyerId) {
            if (isBuyerSecondParticipant) return item.buyer || undefined;
            if (isSellerSecondParticipant) return item.seller || undefined;
            return item.buyer || undefined;
        }

        if (currentUserId === sellerId) {
            if (isSellerSecondParticipant) return item.seller || undefined;
            if (isBuyerSecondParticipant) return item.buyer || undefined;
            return item.seller || undefined;
        }
    }

    if (isBuyerSecondParticipant) return item.buyer || undefined;
    if (isSellerSecondParticipant) return item.seller || undefined;

    return item.buyer || item.seller || undefined;
};

const formatMemberLastDeal = (value?: string | Date | null): string => {
    if (!value) {
        return "-";
    }

    const date = moment(value);
    return date.isValid() ? date.format("DD.MM.YYYY") : "-";
};

interface MyDealDetailsProps {
    item: IDeal;
    userData?: IUser;
    dealActionsHandler: (actionType: ActionHandlerVariants, item: IDeal) => Promise<void>;
    mainDealButton: React.ReactNode;
    showDetailsCard: boolean;
    setShowDetailsCard: (show: boolean) => void;
}

const MyDealDetails: React.FC<MyDealDetailsProps> = ({
    item,
    userData,
    dealActionsHandler,
    mainDealButton,
    showDetailsCard,
    setShowDetailsCard,
}) => {
    const { t } = useTranslation();

    if (!showDetailsCard) {
        return (
            <OffersButton onClick={() => setShowDetailsCard(true)} isOpen={false}>
                {t("common.actions.details")}
            </OffersButton>
        );
    }
    const detailsUserData: IUser | undefined = resolveCounterpartyUser(item, userData);
    const completedDeals = detailsUserData?.memberStats?.completedDeals || 0;
    const totalSales = detailsUserData?.memberStats?.totalSales || 0;
    const totalPurchases = detailsUserData?.memberStats?.totalPurchases || 0;
    const lastDeal = formatMemberLastDeal(detailsUserData?.memberStats?.lastDeal);

    return (
        detailsUserData
            ?
            <>
                <DetailsCard>
                    <DealColumn>
                        <OtcComment type='member' isBuyer={item.type === 'sell'} deal={item} data={detailsUserData} />
                        <DealInfo className="details">
                            <BadgesRow>
                                <Image
                                    width={36}
                                    height={36}
                                    src={PioneerBadge}
                                    alt="Pioneer badge"
                                />
                                <Image
                                    width={36}
                                    height={36}
                                    src={MasterBadge}
                                    alt="Master badge"
                                />
                                <Image
                                    width={36}
                                    height={36}
                                    src={ProjectReviewerBadge}
                                    alt="Project Reviewer badge"
                                />
                                <Image
                                    width={36}
                                    height={36}
                                    src={TopPredictorBadge}
                                    alt="Top Predictor badge"
                                />
                            </BadgesRow>
                            <div className="info">
                                <DealDetailsItem>
                                    <span>Risks:</span>
                                    <div>{detailsUserData?.risk || '-'}</div>
                                </DealDetailsItem>
                                <DealDetailsItem>
                                    <span>Completed deals:</span>
                                    <div>{completedDeals}</div>
                                </DealDetailsItem>
                                <DealDetailsItem>
                                    <span>Sales:</span>
                                    <div>{totalSales}</div>
                                </DealDetailsItem>
                                <DealDetailsItem>
                                    <span>Purchases:</span>
                                    <div>{totalPurchases}</div>
                                </DealDetailsItem>
                                <DealDetailsItem>
                                    <span>Last Deal:</span>
                                    <div>{lastDeal}</div>
                                </DealDetailsItem>
                            </div>

                        </DealInfo>
                        <DealRightHeader className="details">
                            <DefaultActionWrapper>
                                <span>
                                    <RedFlag count={detailsUserData?.redFlags || 0} />
                                </span>
                            </DefaultActionWrapper>
                        </DealRightHeader>
                    </DealColumn>

                    <DealIconWrapper>
                        {item.type === "sell" ? (
                            <Image src={BuyIcon} alt="buy" />
                        ) : (
                            <Image src={SellIcon} alt="sell" />
                        )}
                    </DealIconWrapper>

                    <DealDetails>
                        <DealDetailsItem>
                            <span>{t("deals.labels.type")}</span>
                            <div>{t(`deals.type.${item.type === "buy" ? "selling" : "buying"}`)}</div>
                        </DealDetailsItem>
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
                        {item.isRealAsset && (
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
                            <span>{!item.isRealAsset ? t("deals.labels.serviceType") : t("deals.labels.tokenName")}</span>
                            <div>{item.serviceType}</div>
                        </DealDetailsItem>
                        <DealDetailsItem>
                            <span>{t("deals.labels.endDate")}</span>
                            <div>{moment(item.date).format("DD.MM.YYYY HH:mm")}</div>
                        </DealDetailsItem>
                    </DealDetails>
                    <DealRightColumn>
                        <div className="deal-id">
                            <button
                                onClick={() => {
                                    if (item.dealId) {
                                        copy(String(item.dealId))
                                        toast.success(t("text.Copied!", { defaultValue: "Copied!" }))
                                    }
                                }}
                            >
                                <CopyIcon />
                            </button>
                            <span>Deal ID:</span>
                            <span>#{item.dealId}</span>
                        </div>
                        {/* <DealButtons>{mainDealButton}</DealButtons> */}
                    </DealRightColumn>
                </DetailsCard>
                <OffersButton onClick={() => setShowDetailsCard(false)} isOpen={true}>
                    Hide Details
                </OffersButton>
            </>
            :
            <EmptyDetailsWrapper>
                <br />
                <br />
                <EmptyList
                    imgWidth={200}
                    fontSize={18}
                    lineHeight={140}
                />
                <br />
                <br />
                <OffersButton onClick={() => setShowDetailsCard(false)} isOpen={true}>
                    Hide Details
                </OffersButton>
            </EmptyDetailsWrapper>
    );
};

export default MyDealDetails;
