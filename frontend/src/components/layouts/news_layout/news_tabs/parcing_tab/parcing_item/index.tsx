import React, {FC} from 'react';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import avatarImage from '../../../../../../assets/img/avatar.png'
import { ITwitterAcc } from '../../../../../types/global_types';
import loader from '../../../../../services/loader';
import getFollowersCount from '../../../../../utils/getFollowersCount';
import {useStyles} from './styles';
import DeleteIcon from '../../../../../common/Icons/delete_icon';
import deleteTwitterAcc from '../../../../../services/news/deleteTwitterAcc';
import reloadWindow from '../../../../../utils/reloadWindow';

interface Props {
    openModal: () => void;
    item: ITwitterAcc
}

const ParcingItem: FC<Props> = ({openModal,item}) => {
    const {
        wrapper,
        userDataWrapper,
        followers,
        nickName,
        description,
        text,
        actionsWrapper,
        link,
        buttonsWrapper
    } = useStyles()
    
    const confirmDelete = async () : Promise<void> => {
        await deleteTwitterAcc(item._id)
        reloadWindow()
    }

    return (
        <div className={wrapper}>
            <div className={userDataWrapper}>
                <img src={
                    item.avatar
                    ||
                    avatarImage
                } alt={item.name}/>
                <div>
                    <div className={followers}>Followers: <span>{getFollowersCount(item.followersCount)}</span></div>
                    <div className={nickName}>@{item.username}</div>
                    <div className={description}>{item.description}</div>
                </div>
            </div>
            <div className={text}>
                Just subscribed to the following Twitter:
                <span>@{item.username}</span>
            </div>
            <div className={actionsWrapper}>
                <a className={link} href="#">Details {'>'}</a>
                <div className={buttonsWrapper}>
                    <Button
                        onClick={openModal}
                        type='outlined'
                    >
                        <EditIcon />
                    </Button>
                    <Button
                    onClick={confirmDelete}
                    >
                        <DeleteIcon/>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ParcingItem;