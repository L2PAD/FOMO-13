import React from 'react';
import {useStyles} from './styles';

const Header = () => {
    const {
        wrapper,
        headerWrapper,
        userWrapper,
        statusWrapper,
        walletWrapper,
        loginWrapper,
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={headerWrapper}>
                <div className={userWrapper}>
                    User
                </div>
                <div className={userWrapper}>
                    Rejected actions
                </div>
                <div className={walletWrapper}>
                    Wallet address
                </div>
                <div className={statusWrapper}>
                    Status
                </div>
                <div className={loginWrapper}>
                    Last login
                </div>
            </div>
        </div>
    );
};

export default Header;