import React from 'react';
import {useStyles} from './styles';
import TableRow from './table_row';
import Checkbox from '../../../common/checkbox';

const UsersTable = () => {
    const {
        wrapper,
        headerWrapper,
        flagsWrapper,
        statusWrapper,
        userWrapper,
        checkboxWrapper,
        walletWrapper,
        emailWrapper,
        pointsWrapper,
        stakingWrapper,
        telegramWrapper
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={`container ${headerWrapper}`}>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => console.log(1)}
                        active={true}
                    />
                </div>
                <div className={userWrapper}>User</div>
                <div className={walletWrapper}>Wallet address</div>
                <div className={statusWrapper}>Status</div>
                <div className={pointsWrapper}>Points</div>
                <div className={emailWrapper}>Email</div>
                <div className={stakingWrapper}>Staking</div>
                <div className={telegramWrapper}>Telegram</div>
                <div className={flagsWrapper}>Red flags</div>
            </div>
            <div>
                {/* <TableRow />
                <TableRow />
                <TableRow />
                <TableRow />
                <TableRow /> */}
            </div>
        </div>
    );
};

export default UsersTable;