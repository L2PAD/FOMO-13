import {FC,useState} from 'react';
import {Link} from 'react-router-dom';
import avatarImage from '../../../../../../assets/img/avatar.png'
import CopyIcon from '../../../../../common/Icons/copy_icon';
import {USERS_STATUS_LIST} from '../../../../../../static_content/dropdowns_data';
import ExternalLinkIcon from '../../../../../common/Icons/external_link_icon';
import RedFlags from '../../../../../common/red_flags';
import Rating from '../../../../../common/rating';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import UserStatusDropdown from '../../../../../common/users_status_dropdown';
import Checkbox from '../../../../../common/checkbox';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';
import { IUser } from '../../../../../types/global_types';
import loader from '../../../../../services/loader';
import useFetch from '../../../../../hooks/useFetch';
import getAccessToken from '../../../../../utils/getAccessToken';
import Loader from '../../../../../common/loader';
import reloadWindow from '../../../../../utils/reloadWindow';
import changeStatus from '../../../../../services/user/changeStatus';
import changeVerificationStatus from '../../../../../services/user/changeVerificationStatus';
import sliceAddress from '../../../../../utils/sliceAddress';
import {useStyles} from './styles';
import VerificationIcon from '../../../../../common/Icons/verification_icon';

const walletKey = '0xds4f54df4sd5654654d6s54f6s'

interface IProps {
    user:IUser
    selectUser: (id:string) => void
    updateUser: (user:IUser) => void
}

const TableRow : FC<IProps> = ({user,updateUser,selectUser}) => {
    const {
        wrapper,
        rowWrapper,
        flagsWrapper,
        telegramWrapper,
        stakingWrapper,
        emailWrapper,
        pointsWrapper,
        statusWrapper,
        walletWrapper,
        userWrapper,
        checkboxWrapper,
        ratingWrapper,
        actionsWrapper,
        userName,
        notconnected
    } = useStyles()
    const [loading,setLoading] = useState(false)
    const {dataHandler} = useFetch(
        `user/${user._id}`,
        {method:'DELETE',
        headers:{'Authorization': `Bearer ${getAccessToken()}`}},
        true)

    const [activeStatus, setActiveStatus] = useState<USERS_STATUS_LIST>(!user.banned ? USERS_STATUS_LIST.ACTIVE : USERS_STATUS_LIST.BLOCKED)

    const changeUserStatus = async (value : USERS_STATUS_LIST.ACTIVE | USERS_STATUS_LIST.BLOCKED) => {
        setLoading(true)
        setActiveStatus(value)
        await changeStatus(`user`,user._id,value)
        setLoading(false)
    }

    const confirmDeleteUsers = async () => {
        setLoading(true)
        await dataHandler()
        setLoading(false)
        reloadWindow()
    }

    const confirmUpdateVerifyStatus = async () => {
        setLoading(true)

        await changeVerificationStatus(user._id,user.verificationStatus ? 'remove-verification' : 'verification')

        setLoading(false)
        reloadWindow()
    }

    const copyHandle = (value: string) => {
        navigator.clipboard.writeText(user.wallet || '')
    }

    if(loading){
        return <Loader/>
    }

    return (
        <div 
        className={wrapper}>
            <div className={`container ${rowWrapper}`}>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => selectUser(user._id)}
                        active={user.selected ? true : false}
                    />
                </div>
                <Link to={`/users_list/user/${user._id}`} className={userWrapper} data-testid="user-row-link">
                    {
                        user?.photo || user?.twitterData?.photo
                        ?
                        <img src={
                            user.photo
                            ?
                            loader(user.photo)
                            :
                            user.twitterData?.photo
                        } alt={user?.username}/>
                        :
                        <img src={avatarImage} alt={user?.username}/>
                        
                    }
                    <p className={userName}>{user?.username || user?.twitterData?.name}</p>
                    {
                        user.verificationStatus
                        ?
                        <VerificationIcon/>
                        :
                        <></>
                    }
                </Link>
                <div
                    className={walletWrapper}
                    onClick={() => copyHandle(walletKey)}
                >
                    {
                        user.wallet
                        ?
                        sliceAddress(String(user.wallet))
                        :
                        '-'
                    }
                    <CopyIcon />
                </div>
                <div className={statusWrapper}>
                    <UserStatusDropdown
                        onChange={(value) => changeUserStatus(value)}
                        activeOption={activeStatus}
                    />
                </div>
                <div className={pointsWrapper}>
                    {user?.points ? user.points : '0'}
                </div>
                <div className={emailWrapper}>
                    {user.email}
                </div>
                <div className={stakingWrapper}>
                    {user?.staking ? 'Active' : '-'}
                </div>
                <div className={telegramWrapper}>
                    {
                        user?.telegramData?.username || user?.telegramData?.name
                        ?
                        <>
                        Connected
                        <ExternalLinkIcon />
                        </>
                        :
                        <span className={notconnected}>Not connected</span>
                    }   
                </div>
                <div className={flagsWrapper}>
                    {user.fomoId}
                </div>
                <div className={ratingWrapper}>
                </div>
                <div className={actionsWrapper}>
                    <Button
                        onClick={() => updateUser(user)}
                        type='outlined'
                    >
                        <EditIcon />
                    </Button>
                    <DotsButtonWithDropdown items={[
                        {title: 'Delete', onClick: confirmDeleteUsers},
                        {title: user.verificationStatus ? 'Cancel Verification' : 'Verify', onClick: confirmUpdateVerifyStatus},
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default TableRow;