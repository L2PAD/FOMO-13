import React, {useState,useEffect,useMemo} from 'react';
import { useHistory } from 'react-router';
import CopyIcon from '../../../common/Icons/copy_icon';
import UserStatusDropdown from '../../../common/users_status_dropdown';
import Button from '../../../common/button';
import EditIcon from '../../../common/Icons/edit_icon';
import {USERS_STATUS_LIST} from '../../../../static_content/dropdowns_data';
import avatarImage from '../../../../assets/img/avatar.png'
import {useStyles} from './styles';
import DotsButtonWithDropdown from '../../../common/dots_button_with_dropdown';
import useFetch from '../../../hooks/useFetch';
import UpdateUserModal from '../modals/update_user_modal';
import Loader from '../../../common/loader';
import loader from '../../../services/loader';
import getAccessToken from '../../../utils/getAccessToken';
import changeStatus from '../../../services/user/changeStatus';
import SendMessageModal from '../../../common/sendMessageModal';
import sliceAddress from '../../../utils/sliceAddress';
import { IUser } from '../../../types/global_types';
import UserProjectTable from '../../projects_layouts/projects_list_layout/project_table copy';
import ChatModal from '../../FomoChat/ChatModal';
import UserAdminDossier from './admin_dossier';
import { formatOnlineStatus } from '../../../helpers/formatOnlineStatus';

type DetailItem = {
    label: string;
    value: React.ReactNode;
    copyValue?: string;
}

type DetailSection = {
    title: string;
    items: DetailItem[];
}

type SocialData = Record<string, unknown> | null | undefined

const UserLayout = () => {
    const [isUpdateModal, setIsUpdateModal] = useState(false)

    const {
        pageWrapper,
        headerWrapper,
        userDataWrapper,
        userName,
        userMeta,
        onlineStatus,
        onlineStatusActive,
        onlineStatusDot,
        userDescriptionWrapper,
        walletKeyWrapper,
        headerDataWrapper,
        dataTitle,
        dataName,
        actionsWrapper,
        headerActions,
        detailsGrid,
        detailsCard,
        detailsTitle,
        detailsList,
        detailsRow,
        detailLabel,
        detailValue,
        detailCopyButton,
    } = useStyles()

    const [user,setUser] = useState<IUser>()
    const [userStatus, setUserStatus] = useState<USERS_STATUS_LIST>(user?.blocked ? USERS_STATUS_LIST.BLOCKED : USERS_STATUS_LIST.ACTIVE)
    const [isSendMessage,setIsSendMessage] = useState<boolean>(false)
    const [isChatVisible,setIsChatVisible] = useState<boolean>(false)

    const userId = useHistory().location.pathname.split('/').pop()
    const token = getAccessToken()

    const {data,loading} = useFetch(`user/${userId}`,{headers:{'Authorization':`Bearer ${token}`}})

    const adminUserData = useMemo<IUser | null>(() => {
        try {
            const raw = localStorage.getItem('fomoUser')
            return raw ? JSON.parse(raw) : null
        } catch (error) {
            return null
        }
    }, [])

    const copyHandle = (value: string) => {
        if(!value){
            return
        }

        navigator.clipboard?.writeText(value)
    }

    const changeUserStatus = async (value : USERS_STATUS_LIST.ACTIVE | USERS_STATUS_LIST.BLOCKED) => {
        if(user?._id){
            setUserStatus(value)
            await changeStatus(`user`,user._id,value)
        }
    }

    useEffect(() => {
        if(data?.data){
            setUser(data.data)
            setUserStatus(data.data.blocked ? USERS_STATUS_LIST.BLOCKED : USERS_STATUS_LIST.ACTIVE)
        }
    },[data])

    if(loading || !user){
        return <Loader/>
    }

    const formatValue = (value: unknown): string => {
        if(value === null || value === undefined || value === ''){
            return '-'
        }

        if(typeof value === 'boolean'){
            return value ? 'Yes' : 'No'
        }

        if(Array.isArray(value)){
            return value.length ? String(value.length) : '0'
        }

        return String(value)
    }

    const formatDate = (value?: Date | string): string => {
        if(!value){
            return '-'
        }

        const parsed = new Date(value)

        if(Number.isNaN(parsed.getTime())){
            return '-'
        }

        return parsed.toLocaleString()
    }

    const socialValue = (socialData: SocialData, keys: string[]): string => {
        const value = keys.map((key) => socialData?.[key]).find(Boolean)
        return formatValue(value)
    }

    const userOnlineStatus = formatOnlineStatus(user.onlineDate)
    const isUserOnline = userOnlineStatus === 'online'

    const renderDetailValue = (item: DetailItem) => {
        if(item.copyValue){
            return (
                <button
                    className={detailCopyButton}
                    onClick={() => copyHandle(item.copyValue || '')}
                    type="button"
                >
                    <span>{item.value}</span>
                    <CopyIcon />
                </button>
            )
        }

        return <span className={detailValue}>{item.value}</span>
    }

    const renderDetailsSection = (section: DetailSection) => (
        <div className={detailsCard} key={section.title}>
            <p className={detailsTitle}>{section.title}</p>
            <div className={detailsList}>
                {section.items.map((item) => (
                    <div className={detailsRow} key={item.label}>
                        <span className={detailLabel}>{item.label}</span>
                        {renderDetailValue(item)}
                    </div>
                ))}
            </div>
        </div>
    )

    const detailSections: DetailSection[] = [
        {
            title: 'Account',
            items: [
                {label: 'User ID', value: user._id, copyValue: user._id},
                {label: 'Email', value: formatValue(user.email), copyValue: user.email},
                {label: 'Username', value: formatValue(user.username || user.twitterData?.username)},
                {label: 'Name', value: formatValue(user.name || user.twitterData?.name)},
                {label: 'FOMO ID', value: formatValue(user.fomoId)},
                {label: 'Wallet', value: formatValue(user.wallet), copyValue: user.wallet},
                {label: 'Created', value: formatDate(user.createDate)},
                {label: 'Last login', value: formatDate(user.lastLogin)},
                {label: 'Online date', value: formatDate(user.onlineDate)},
            ],
        },
        {
            title: 'Access',
            items: [
                {label: 'Roles', value: formatValue(user.role?.join(', '))},
                {label: 'Active', value: formatValue(user.isActive)},
                {label: 'Blocked', value: formatValue(user.blocked)},
                {label: 'Banned', value: formatValue(user.banned)},
                {label: 'Verified', value: formatValue(user.verificationStatus)},
                {label: 'Risk', value: formatValue(user.risk)},
                {label: 'Red flags', value: formatValue(user.redFlags)},
            ],
        },
        {
            title: 'Activity and limits',
            items: [
                {label: 'Points', value: formatValue(user.points || 0)},
                {label: 'Staking', value: formatValue(user.staking)},
                {label: 'Tasks', value: formatValue(user.tasks)},
                {label: 'Project limit', value: formatValue(user.projectLimit)},
                {label: 'News limit', value: formatValue(user.newsLimit)},
                {label: 'Projects', value: formatValue(user.projects)},
                {label: 'Actions', value: formatValue(user.actions)},
                {label: 'Rejected entities', value: formatValue(user.rejectedEntities)},
                {label: 'Review likes', value: formatValue(user.reviewLikes)},
                {label: 'Review dislikes', value: formatValue(user.reviewDislikes)},
            ],
        },
        {
            title: 'Socials',
            items: [
                {label: 'Twitter name', value: socialValue(user.twitterData, ['name'])},
                {label: 'Twitter username', value: socialValue(user.twitterData, ['username'])},
                {label: 'Discord name', value: socialValue(user.discordData, ['name'])},
                {label: 'Discord username', value: socialValue(user.discordData, ['username'])},
                {label: 'Telegram name', value: socialValue(user.telegramData, ['name'])},
                {label: 'Telegram username', value: socialValue(user.telegramData, ['username'])},
                {label: 'Telegram ID', value: socialValue(user.telegramData, ['telegramId', 'id']), copyValue: user.telegramData?.telegramId || user.telegramData?.id},
                {label: 'Telegram field', value: formatValue(user.telegram)},
            ],
        },
    ]
    
    return (
        <>
        <div className={pageWrapper}>
            <div className={headerWrapper}>
                <div className={userDataWrapper}>
                    {
                        user?.avatar || user?.twitterData?.photo
                        ?
                        <img src={
                            user?.avatar
                            ?
                            loader(user.avatar)
                            :
                            user?.twitterData?.photo
                        } alt={user.email}/>
                        :
                        <img src={avatarImage} alt=''/>
                    }
                    <div>
                        <div className={userName}>
                            {user?.username || user?.twitterData?.username || user?.email || 'Unnamed user'}
                        </div>
                        <div className={userMeta}>
                            {user.email || '-'}
                        </div>
                        <div className={`${onlineStatus} ${isUserOnline ? onlineStatusActive : ''}`}>
                            <span className={onlineStatusDot} />
                            {userOnlineStatus}
                        </div>
                        <div className={userDescriptionWrapper}>
                            <div
                                className={walletKeyWrapper}
                                onClick={() => copyHandle(user.wallet || '')}
                            >
                                {sliceAddress(user.wallet) || '-'}
                                <CopyIcon />
                            </div>
                            <div>
                                <UserStatusDropdown
                                    onChange={(value) => changeUserStatus(value)}
                                    activeOption={userStatus}
                                />
                            </div>
                        </div>
                        <div className={headerActions}>
                            <Button
                                type="fill"
                                onClick={() => adminUserData && setIsChatVisible(true)}
                            >
                                Open chat
                            </Button>
                            <Button
                                type="bordered"
                                onClick={() => setIsSendMessage(true)}
                            >
                                Telegram message
                            </Button>
                        </div>
                    </div>
                </div>
                <div className={headerDataWrapper}>
                    <div>
                        <p className={dataName}>{user.staking || '-'}</p>
                        <p className={dataTitle}>Staking</p>
                    </div>
                    <div>
                        <p className={dataName}>{user?.tasks || '-'}</p>
                        <p className={dataTitle}>Tasks</p>
                    </div>
                    <div>
                        <p className={dataName}>{user?.projectLimit || '-'}</p>
                        <p className={dataTitle}>Projects limit</p>
                    </div>
                    <div>
                        <p className={dataName}>{user?.newsLimit || '-'}</p>
                        <p className={dataTitle}>News limit</p>
                    </div>
                    <div>
                        <p className={dataName}>{user.points || '0'}</p>
                        <p className={dataTitle}>Points</p>
                    </div>
                    <div className={actionsWrapper}>
                        <Button
                            onClick={() => setIsUpdateModal(true)}
                            type='outlined'
                        >
                            <EditIcon />
                        </Button>
                        <DotsButtonWithDropdown items={[
                            {title: 'Give red status', onClick: () => console.log(1)},
                            {title: 'Delete', onClick: () => console.log(1)}
                        ]} />
                    </div>
                </div>
            </div>
            <div className={detailsGrid}>
                {detailSections.map(renderDetailsSection)}
            </div>
            <UserAdminDossier userId={user._id} />
            {
                user.projects?.length
                ?
                <UserProjectTable 
                projects={user.projects}
                />
                :
                <></>
            }
            {
            isUpdateModal && user 
            ?
            <UpdateUserModal
                user={user}
                onClose={() => setIsUpdateModal(false)}
            />
            :
            <></>
            }
        </div>
        <SendMessageModal
        userEmail={user.email}
        userChatId={user.telegramData?.telegramId}
        isVisible={isSendMessage}
        onClose={() => setIsSendMessage(false)}
        />
        {
            isChatVisible && adminUserData
            ?
            <ChatModal
                isVisible={isChatVisible}
                setIsVisible={setIsChatVisible}
                userData={adminUserData}
                token={token}
                initialUserId={user._id}
            />
            :
            <></>
        }
        </>
    );
};

export default UserLayout;
