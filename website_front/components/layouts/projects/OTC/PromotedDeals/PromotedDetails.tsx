import React from 'react'
import styled from 'styled-components'
import { DealStatus, IDeal } from '../../../../../types/global_types'
import { format } from 'date-fns'
import { statuses } from '../../../../../utils/otcConstants'
import { getColorByStatus } from '../DealsList/styles'
import OtcLike from '../../../../global/Icons/OtcLike'
import OtcDisike from '../../../../global/Icons/OtcDislike'
import UserAvatar from '../../../../global/common/UserAvatar'
import imageLoader from '../../../../../helpers/imageLoader'
import sliceAddress from '../../../../../helpers/sliceAddress'
import { formatPaymentMethod } from '../../modals/P2PBuyModal/steps/SellStep'
import { useTranslation } from 'i18n'



const Wrapper = styled.div<{ isVisible: boolean }>`
    position: absolute;
    top: 0px;
    left: 0;
    width: 340px;
    padding: 18px;
    border-radius: 12px;
    box-shadow: 2px 4px 16px 4px rgba(0, 5, 48, 0.15);
    background: white;
    border: 1px solid #eaeaea;
    opacity: ${props => props.isVisible ? 1 : 0};
    pointer-events: ${props => props.isVisible ? 'auto' : 'none'};
    z-index: 1000;
    margin-top: 45px;
`

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
`

const Title = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
`

const StatusBadge = styled.span<{ status: DealStatus | undefined }>`
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    color: ${props => getColorByStatus(props.status ? props.status : 'waiting')};
`

const InfoSection = styled.div`
    margin-bottom: 14px;
`

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`

const Label = styled.span`
    font-size: 13px;
    color: var(--main-gray);
    font-weight: var(--font-weight-regular);
`

const Value = styled.span<{ highlight?: boolean }>`
    font-size: 13px;
    color: ${props => props.highlight ? 'var(--main-blue)' : 'var(--main-black)'};
    font-weight: ${props => props.highlight ? 600 : 400};
    text-align: right;
`
const ValueLike = styled.span<{ highlight?: boolean }>`
    font-size: 13px;
    color: ${props => props.highlight ? 'var(--main-blue)' : 'var(--main-black)'};
    font-weight: var(--font-weight-semibold);
    display: flex;
    align-items: center;
    gap: 4px;
`

const CurrencyValue = styled.span`
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-blue);
`

const CreatorInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #f0f0f0;
`

const CreatorAvatar = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
`

const CreatorDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`

const CreatorName = styled.span`
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    color: var(--main-black);
`

const CreatorWallet = styled.span`
    font-size: 11px;
    color: var(--main-gray);
    font-family: monospace;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
`

const PaymentMethods = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
`

const PaymentMethodTag = styled.span`
    padding: 3px 8px;
    border-radius: 4px;
    background-color: #f8f9fa;
    font-size: 11px;
    color: #495057;
    border: 1px solid #e9ecef;
    text-transform: capitalize;
`

const Description = styled.p`
    font-size: 12px;
    color: var(--main-black);
    margin: 12px 0;
    line-height: 1.4;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
`

const DealId = styled.div`
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    font-size: 11px;
    color: #999;
    text-align: center;
`

interface IProps {
    isVisible: boolean
    deal: IDeal | null
}

const PromotedDetails = ({ isVisible, deal }: IProps) => {
    const { t } = useTranslation()

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
        } catch {
            return dateString
        }
    }

    const getInitials = (username: string) => {
        return username.charAt(0).toUpperCase()
    }



    const getCurrentStatusText = (): string => {
        if (deal?.isCompleteByAdmin) return t("deals.status.closed");
        if (!!deal?.isReservedFunds) return t("deals.status.fundsReserved");

        return deal?.status
            ? t(`deals.status.${deal.status}`, { defaultValue: statuses[deal.status] || deal.status })
            : '-';
    };

    return (
        <Wrapper isVisible={isVisible}>
            <Header>
                <Title>{t("deals.labels.promotedDeal")}</Title>
                <StatusBadge status={deal?.status}>
                    {getCurrentStatusText()}
                </StatusBadge>
            </Header>

            <InfoSection>
                <InfoRow>
                    <Label>{t("deals.labels.dealType")}</Label>
                    <Value style={{ color: deal?.type === 'sell' ? 'var(--main-red)' : 'var(--main-green)' }}>
                        {t(`deals.type.${deal?.type === 'sell' ? 'sell' : 'buy'}`).toUpperCase()}
                    </Value>
                </InfoRow>

                <InfoRow>
                    <Label>{t("deals.labels.cryptocurrency")}</Label>
                    <Value>{deal?.ticker?.toUpperCase() || 'N/A'}</Value>
                </InfoRow>

                <InfoRow>
                    <Label>{t("deals.labels.amount")}</Label>
                    <Value>{deal?.amount?.toLocaleString() || '0'}</Value>
                </InfoRow>

                <InfoRow>
                    <Label>{t("deals.labels.totalPrice")}</Label>
                    <CurrencyValue>
                        {deal?.price?.toLocaleString()} {deal?.currency}
                    </CurrencyValue>
                </InfoRow>

                <InfoRow>
                    <Label>{t("deals.labels.created")}</Label>
                    <Value>{formatDate(String(deal?.createDate))}</Value>
                </InfoRow>

                <InfoRow>
                    <Label>{t("deals.labels.promotedUntil")}</Label>
                    <Value highlight>
                        {formatDate(String(deal?.date))}
                    </Value>
                </InfoRow>
            </InfoSection>

            {deal?.description && (
                <Description>
                    <Label>{t("deals.labels.description")} </Label>
                    {deal?.description.length > 100
                        ? `${deal?.description.substring(0, 100)}...`
                        : deal?.description || '-'}
                </Description>
            )}

            <InfoRow>
                <Label>{t("deals.labels.likes")}</Label>
                <ValueLike>{deal?.likesCount} <OtcLike status={'active'} /></ValueLike>
            </InfoRow>

            <InfoRow>
                <Label>{t("deals.labels.dislikes")}</Label>
                <ValueLike>{deal?.dislikesCount} <OtcDisike status={'active'} /></ValueLike>
            </InfoRow>

            {deal?.paymentMethods && deal?.paymentMethods.length > 0 && (
                <InfoSection>
                    <Label>{t("deals.labels.paymentMethods")}</Label>
                    <PaymentMethods>
                        {deal?.paymentMethods.map((method, index) => (
                            <PaymentMethodTag key={index}>
                                {formatPaymentMethod(method)}
                            </PaymentMethodTag>
                        ))}
                    </PaymentMethods>
                </InfoSection>
            )}

            {deal?.creator && (
                <CreatorInfo>
                    {
                        deal.creator.photo || deal?.creator?.twitterData?.photo
                            ?
                            <UserAvatar
                                size={'otc'}
                                avatar={imageLoader(deal.creator.photo || deal.creator.twitterData.photo)}
                                name={deal.creator.username}
                                variant='default'
                            />
                            :
                            <CreatorAvatar>
                                {getInitials(deal?.creator?.username || 'user')}
                            </CreatorAvatar>
                    }

                    <CreatorDetails>
                        <CreatorName>@{deal?.creator.username}</CreatorName>
                        {deal?.creator.wallet && (
                            <CreatorWallet>
                                {sliceAddress(deal?.creator.wallet)}
                            </CreatorWallet>
                        )}
                    </CreatorDetails>
                </CreatorInfo>
            )}

            <DealId>
                {t("deals.labels.dealId")} {deal?._id}
            </DealId>
        </Wrapper>
    )
}

export default PromotedDetails
