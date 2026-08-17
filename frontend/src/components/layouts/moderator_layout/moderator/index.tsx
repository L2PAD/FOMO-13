import {useState,useEffect} from 'react';
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
import Loader from '../../../common/loader';
import loader from '../../../services/loader';
import getAccessToken from '../../../utils/getAccessToken';
import { IUser } from '../../../types/global_types';
import changeStatus from '../../../services/user/changeStatus';
import ActionsTable from '../action';

const walletKey = '0xds4f54df4sd5654654d6s54f6s'

const ModeratorLayout = () => {
    const [isUpdateModal, setIsUpdateModal] = useState(false)

    const {
        headerWrapper,
        userDataWrapper,
        userName,
        userDescriptionWrapper,
        walletKeyWrapper,
        headerDataWrapper,
        dataTitle,
        dataName,
        actionsWrapper,
    } = useStyles()

    const [user,setUser] = useState<IUser>()
    const [userStatus, setUserStatus] = useState<USERS_STATUS_LIST>(user?.blocked ? USERS_STATUS_LIST.BLOCKED : USERS_STATUS_LIST.ACTIVE)
    
    const userId = useHistory().location.pathname.split('/').pop()

    const {data,loading} = useFetch(`actions/${userId}`,
    {headers:{'Authorization':`Bearer ${getAccessToken()}`}})
    
    const copyHandle = (value: string) => {
        navigator.clipboard.writeText(value)
    }

    const changeUserStatus = async (value : USERS_STATUS_LIST.ACTIVE | USERS_STATUS_LIST.BLOCKED) => {
        if(user?._id){
            setUserStatus(value)
            await changeStatus(`user`,user._id,value)
        }
    }

    useEffect(() => {
        data?.data && setUser(data.data)
    },[data])

    if(loading || !data?.data.moderator){
        return <Loader/>
    }
    
    return (
        <div>
            <div className={headerWrapper}>
                <div className={userDataWrapper}>
                    {
                        data?.data.moderator?.avatar
                        ?
                        <img src={loader(data?.data.moderator.avatar)} alt={data?.data.moderator.email}/>
                        :
                        <img src={avatarImage} alt=''/>
                    }
                    <div>
                        <div className={userName}>
                            {data?.data.moderator?.email}
                        </div>
                        <div className={userDescriptionWrapper}>
                            <div
                                className={walletKeyWrapper}
                                onClick={() => copyHandle(data?.data.moderator.wallet || '')}
                            >
                                {data?.data.moderator.wallet || '-'}
                                <CopyIcon />
                            </div>
                            <div>
                                <UserStatusDropdown
                                    onChange={(value) => changeUserStatus(value)}
                                    activeOption={userStatus}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={headerDataWrapper}>
                    <div>
                        <p className={dataName}>{data?.data?.actions?.length || '0'}</p>
                        <p className={dataTitle}>Actions</p>
                    </div>
                    <div className={actionsWrapper}>
                        <Button
                            onClick={() => setIsUpdateModal(true)}
                            type='outlined'
                        >
                            <EditIcon />
                        </Button>
                        <DotsButtonWithDropdown items={[
                            {title: 'Delete', onClick: () => console.log(1)}
                        ]} />
                    </div>
                </div>
            </div>
            <ActionsTable data={data.data.actions}/>
        </div>
    );
};

export default ModeratorLayout;