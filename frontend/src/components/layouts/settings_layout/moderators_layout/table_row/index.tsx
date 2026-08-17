import React, {useState} from 'react';
import {useStyles} from './styles';
import CopyIcon from '../../../../common/Icons/copy_icon';
import StatusDropdown from '../../../../common/status_dropdown';
import {STATUS_LIST} from '../../../../../static_content/dropdowns_data';
import moment from 'moment';
import Button from '../../../../common/button';
import EditIcon from '../../../../common/Icons/edit_icon';
import avatarImage from '../../../../../assets/img/avatar.png'
import DotsButtonWithDropdown from '../../../../common/dots_button_with_dropdown';
import { IUser } from '../../../../types/global_types';
import loader from '../../../../services/loader';
import parseDate from '../../../../utils/parseDate';
import useFetch from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';
import { Link } from 'react-router-dom';

const TableRow = ({moderator}:{moderator:IUser}) => {
    const [status, setStatus] = useState<STATUS_LIST>(STATUS_LIST.ACTIVE)

    const {
        wrapper,
        rowWrapper,
        walletWrapper,
        loginWrapper,
        statusWrapper,
        userWrapper,
        actionsWrapper,
    } = useStyles()

    const {loading,dataHandler} = useFetch(`user/${moderator._id}`,{method:'DELETE',headers:{'Authorization': `Bearer ${getAccessToken()}`}},true)


    const deleteModerator = async () => {
        await dataHandler()
        reloadWindow()
    }

    if(loading){
        return <Loader/>
    }

    return (
        <div className={wrapper}>
            <div className={rowWrapper}>
                <div className={userWrapper}>
                    {
                        moderator.avatar || moderator?.twitterData?.photo
                        ?
                        moderator.avatar
                        ?
                            <Link to={`/settings/${moderator._id}`}>
                                <img src={loader(moderator.avatar)} alt={moderator.email}/>
                            </Link>
                            :
                            <Link to={`/settings/${moderator._id}`}>
                            <img src={moderator?.twitterData?.photo} alt={moderator.email}/>
                            </Link>
                        :
                        <Link to={`/settings/${moderator._id}`}>
                            <img src={avatarImage} alt=""/>
                        </Link>
                    }
                    {moderator.email}
                </div>
                <div className={userWrapper}>
                    {moderator?.rejectedEntities || 0}
                </div>
                <div className={walletWrapper}>
                    {moderator.wallet ? moderator.wallet : '-'}
                    <CopyIcon />
                </div>
                <div className={statusWrapper}>
                    <StatusDropdown
                        onChange={(value) => setStatus(value)}
                        activeOption={status}
                    />
                </div>
                <div className={loginWrapper}>
                    {parseDate(moderator.lastLogin,1)}
                </div>
                <div className={actionsWrapper}>
                    <Button
                        onClick={() => console.log(1)}
                        type='outlined'
                    >
                        <EditIcon />
                    </Button>
                    <DotsButtonWithDropdown items={[
                        {title: 'Delete', onClick: () => deleteModerator()}
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default TableRow;