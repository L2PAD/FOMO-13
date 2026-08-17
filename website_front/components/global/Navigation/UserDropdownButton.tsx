import React, { useContext, useEffect, useState } from 'react'
import { IUser } from '../../../types/global_types'
import UserAvatar from '../common/UserAvatar'
import imageLoader from '../../../helpers/imageLoader'
import styled from 'styled-components'
import { BalanceContext } from '../Layout'
import sliceAddress from '../../../helpers/sliceAddress'
import DropdownLine from '../Icons/nav/DropdownLine'
import copy from 'clipboard-copy'
import { toast } from 'react-toastify'
import { useTotalBalance } from '../../../hooks/useTotalBalance'
import { fetchUnreadCount } from '../../../http/notifications/socialNotifications'

const Wrapper = styled.div`
    position: relative;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid #F0F2F5;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    transition: opacity 0.2s ease-in-out;

    & .notif-dot{
        position: absolute;
        top: 4px;
        left: 40px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        line-height: 16px;
        text-align: center;
        box-shadow: 0 0 0 2px #fff;
        z-index: 2;
        @media (max-width: 768px){
            top: -2px;
            left: 22px;
        }
    }

    &:hover{
        opacity: 0.8;
    }

    &:active{
        opacity: 0.6;
    }

    & .user-details{
        margin-right: 40px;
    }

    & .balance-value{
        font-weight: var(--font-weight-semibold);
        font-size: 16px;
    }

    & .balance-usd{
        font-size: 14px;
        color: var(--main-gray);
        margin-left: 4px;
    }
    & .user-address{
        font-size: 14px;
        color: var(--main-gray);
        font-weight: var(--font-weight-semibold);
        margin-top: 2px;
    }

    & .actions{
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 0px 8px;
        @media (max-width: 768px) {
            margin-left: auto;
        }
    }

    & .dropdown-line{
        @media (max-width: 768px) {
            margin-left: auto;
        }
    }

    @media (max-width: 768px) {
        width: fit-content;
        border: none;
        padding: 0;
        gap: 0;

        & .user-details,
        & .dropdown-line,
        & .actions {
            display: none;
        }
    }
`

interface UserAvatarProps {
    userData: IUser | null
    onClick: () => void
}

const UserDropdownButton: React.FC<UserAvatarProps> = ({ userData, onClick }) => {
    const { ethBalance, ethPrice, usdcBalance, escrowBalance, total, isCached } = useTotalBalance()
    const [unread, setUnread] = useState(0)

    useEffect(() => {
        if (!userData) return
        let active = true
        const load = () => fetchUnreadCount().then((c) => { if (active) setUnread(c) })
        load()
        const id = window.setInterval(load, 10000)
        const onSeen = () => load()
        const onFocus = () => load()
        window.addEventListener('fomo-social-seen', onSeen)
        window.addEventListener('fomo-social-refresh', onSeen)
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onFocus)
        return () => {
            active = false
            window.clearInterval(id)
            window.removeEventListener('fomo-social-seen', onSeen)
            window.removeEventListener('fomo-social-refresh', onSeen)
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onFocus)
        }
    }, [userData])

    if (!userData) return <></>;

    return (
        <Wrapper
            tabIndex={0}
            onClick={onClick}>
            {unread > 0 && <span className="notif-dot" data-testid="wallet-notif-dot">{unread > 9 ? '9+' : unread}</span>}
            <UserAvatar
                avatar={
                    //@ts-ignore
                    !userData.photo
                        ? userData?.twitterData?.photo
                            ? //@ts-ignore
                            userData?.twitterData?.photo
                            : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                        : imageLoader(userData.photo)
                }
                name="username"
                size="otc"
                variant="default"
                className="user-avatar"
            />
            <div className='user-details'>
                <div className='eth-balance'>
                    <span className='balance-value'>{ethBalance.toFixed(4)} ETH</span>
                    <span className='balance-usd'>≈ ${(ethBalance * ethPrice).toFixed(2)}</span>
                </div>
                <div className='user-address'>
                    {sliceAddress(userData.wallet)}
                </div>
            </div>
            <div className='actions'>
                <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6.00081 5.58L11 1" stroke="var(--main-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </Wrapper>
    )
}

export default UserDropdownButton
