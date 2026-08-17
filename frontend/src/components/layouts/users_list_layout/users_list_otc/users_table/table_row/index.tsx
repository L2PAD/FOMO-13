import React, { useState } from 'react';
import { useStyles } from './styles';
import avatarImage from '../../../../../../assets/img/avatar.png'
import CopyIcon from '../../../../../common/Icons/copy_icon';
import { USERS_STATUS_LIST } from '../../../../../../static_content/dropdowns_data';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import UserStatusDropdown from '../../../../../common/users_status_dropdown';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';
import { Link } from 'react-router-dom';
import { DealStatus, IDeal } from '../../../../../types/global_types';
import loader from '../../../../../services/loader';
import sliceAddress from '../../../../../utils/sliceAddress';
import BuyIcon from '../../../../../../assets/otc/buy-item.svg'
import SellIcon from '../../../../../../assets/otc/sell-item.svg'
import WaitingIcon from '../../../../../../assets/otc/waiting.svg'
import BlockedIcon from '../../../../../../assets/otc/blocked.svg'
import StartedIcon from '../../../../../../assets/otc/started.svg'
import EndedIcon from '../../../../../../assets/otc/complete.svg'

const walletKey = '0xds4f54df4sd5654654d6s54f6s'

export const statuses = {
    'waiting': 'Available',
    'started': 'Started',
    'ended': 'Ended',
    'blocked': 'Wait for confirm',
    'forced-termination': 'Closed by administration',
}


export const statusesReverse = {
    'Available': 'waiting',
    'Started': 'started',
    'Ended': 'ended',
    'Wait for confirm': 'blocked',
    'Funds reserved': 'started',
    'Closed by administration': 'forced-termination',
}

export const StatusesIcons = {
    'waiting': WaitingIcon,
    'started': StartedIcon,
    'ended': EndedIcon,
    'blocked': BlockedIcon,
    'forced-termination': BlockedIcon,
}

export const StatusesDescription = {
    'waiting': 'The deal is currently available for users',
    'started': 'The deal has started. Wait for funds to be reserved by the buyer',
    'reserved': 'The deal has started. The buyer has reserved funds, the seller must transfer the assets to the buyer.',
    'ended': 'The operation has ended. The transaction was successfully completed, and all assets have been transferred.',
    'blocked': 'To initiate a transaction, the seller must confirm the purchase request',
    'review': 'As long as users does not leave feedback, the project does not change its status to completed'
}

export const getColorByStatus = (status: DealStatus): string => {
    const colors = {
        'waiting': '#FFC702',
        'started': '#2082EA',
        'ended': '#04A584',
        'blocked': '#FF5858',
        'forced-termination': '#FF5858',
    }

    return colors[status]
}

const TableRow = ({ confirmCompleteDeal, deal }: { confirmCompleteDeal: any; deal: IDeal }) => {
    const {
        wrapper,
        rowWrapper,
        pointsWrapper,
        statusWrapper,
        walletWrapper,
        userWrapper,
        dataWrapper,
        actionsWrapper,
        reactionButton,
        bio
    } = useStyles()

    const isEnded = deal.status === 'ended'
    const isTimeEnded = new Date(deal.date).getTime() < new Date().getTime() && deal.status === 'waiting'
    const isFundsReserved = deal.status === 'started'
    const isClosed = deal.status === 'forced-termination'

    const copyHandle = (value: string) => {
        navigator.clipboard.writeText(value)
    }

    const getCurrentStatusText = (): string => {
        return (
            isClosed
                ?
                'Closed'
                :
                !!deal.isReservedFunds && !isEnded
                    ?
                    'Funds reserved'
                    :
                    !isEnded && isTimeEnded ? `Time's up` : statuses[deal.status]
        )
    }

    return (
        <div
            className={wrapper}>
            <div className={`container ${rowWrapper}`}>
                <div className={dataWrapper}>
                    <div className={pointsWrapper}>
                        {deal.name}
                    </div>
                    <Link to={`users_list/${deal.creator?._id}`} className={userWrapper}>
                        <img src={
                            deal.creator?.photo
                                ?
                                loader(deal.creator?.photo)
                                :
                                deal.creator?.twitterData?.photo
                        } alt={deal.creator?.username || ''} />
                        <p>{deal.creator?.username || deal?.creator?.twitterData?.username}</p>
                    </Link>
                    {
                        deal?.buyer
                            ?
                            <Link to={`users_list/${deal.buyer?._id}`} className={userWrapper}>
                                <img src={
                                    deal?.buyer?.photo
                                        ?
                                        loader(deal.buyer?.photo)
                                        :
                                        deal.buyer?.twitterData?.photo
                                } alt={deal.buyer?.username || ''} />
                                <p>{deal.buyer?.username || deal?.buyer?.twitterData?.username}</p>
                            </Link>
                            :
                            <div className={userWrapper}>
                                -
                            </div>
                    }
                    <div
                        className={walletWrapper}
                        onClick={() => copyHandle(walletKey)}
                    >
                        {sliceAddress(deal.creator.wallet)}
                        <CopyIcon />
                    </div>
                    <div
                        className={walletWrapper}
                        onClick={() => copyHandle(walletKey)}
                    >
                        {deal.buyer ? sliceAddress(deal.buyer.wallet) : '-'}
                        <CopyIcon />
                    </div>
                    <div className={statusWrapper}>
                        <img
                            src={!isEnded && isTimeEnded ? BlockedIcon : StatusesIcons[deal.status]}
                            alt={deal.status}
                        />
                        <span
                            style={{ color: getColorByStatus(isTimeEnded ? 'blocked' : deal.status) }}
                        >{getCurrentStatusText()}</span>
                    </div>
                    <div className={pointsWrapper}>
                        {deal.price}{deal.ticker?.toLowerCase() === 'eth' ? ' ETH' : '$'}
                    </div>

                    <div className={pointsWrapper}>
                        {deal.serviceType}
                    </div>
                    <div className={pointsWrapper}>
                        {deal.amount}
                    </div>
                    <div className={pointsWrapper}>
                        {deal.isRealAsset ? 'Real Asset' : '-'}
                    </div>
                </div>
                <div className={actionsWrapper}>
                    <button className={`${reactionButton} checked`}>
                        👍 {deal.likesCount}
                    </button>
                    <button className={`${reactionButton}`}>
                        👎 {deal.dislikesCount}
                    </button>
                    {
                        isEnded || isTimeEnded || deal.isCompleteByAdmin
                            ?
                            <></>
                            :
                            isFundsReserved && deal.isReservedFunds
                                ?
                                <DotsButtonWithDropdown items={[
                                    { title: 'Complete deal', onClick: () => confirmCompleteDeal(deal, false) },
                                    { title: 'Complete deal with a refund', onClick: () => confirmCompleteDeal(deal, true) }
                                ]} />
                                :
                                <></>
                    }
                </div>
            </div>
            {/* <div className={bio}>
                <span>Description: </span>
                {deal.description}
            </div> */}
        </div>
    );
};

export default TableRow;