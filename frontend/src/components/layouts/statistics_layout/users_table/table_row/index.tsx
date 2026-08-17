import React, {useState} from 'react';
import {useStyles} from './styles';
import avatarImage from '../../../../../assets/img/avatar.png'
import {USERS_STATUS_LIST} from '../../../../../static_content/dropdowns_data';
import Checkbox from '../../../../common/checkbox';
import CopyIcon from '../../../../common/Icons/copy_icon';
import UserStatusDropdown from '../../../../common/users_status_dropdown';
import ExternalLinkIcon from '../../../../common/Icons/external_link_icon';
import RedFlags from '../../../../common/red_flags';
import Rating from '../../../../common/rating';
import Button from '../../../../common/button';
import EditIcon from '../../../../common/Icons/edit_icon';
import DotsButtonWithDropdown from '../../../../common/dots_button_with_dropdown';

const walletKey = '0xds4f54df4sd5654654d6s54f6s'

const TableRow = () => {
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
    } = useStyles()

    const [activeStatus, setActiveStatus] = useState<USERS_STATUS_LIST>(USERS_STATUS_LIST.ACTIVE)

    const copyHandle = (value: string) => {
        navigator.clipboard.writeText(value)
    }

    return (
        <div className={wrapper}>
            <div className={`container ${rowWrapper}`}>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => console.log(1)}
                        active={true}
                    />
                </div>
                <div className={userWrapper}>
                    <img src={avatarImage} alt=""/>
                    <p>Username</p>
                </div>
                <div
                    className={walletWrapper}
                    onClick={() => copyHandle(walletKey)}
                >
                    {walletKey}
                    <CopyIcon />
                </div>
                <div className={statusWrapper}>
                    <UserStatusDropdown
                        onChange={(value) => setActiveStatus(value)}
                        activeOption={activeStatus}
                    />
                </div>
                <div className={pointsWrapper}>
                    65.01
                </div>
                <div className={emailWrapper}>
                    newuser@gmail.com
                </div>
                <div className={stakingWrapper}>
                    Active
                </div>
                <div className={telegramWrapper}>
                    Connected
                    <ExternalLinkIcon />
                </div>
                <div className={flagsWrapper}>
                    <RedFlags count={14} />
                </div>
                <div className={ratingWrapper}>
                    <Rating rating={94} />
                </div>
                <div className={actionsWrapper}>
                    <Button
                        onClick={() => console.log(1)}
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
    );
};

export default TableRow;