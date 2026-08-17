import React from 'react';
import logo from '../../assets/img/logo_header.png'
import {Link} from 'react-router-dom';
import {useStyles} from './styles';

const NotFoundPage = () => {
    const {
        wrapper,
        logoWrapper,
        contentWrapper,
        errorNumber,
        title,
        link,
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={logoWrapper}>
                <img src={logo} alt='logo'/>
            </div>
            <div className={contentWrapper}>
                <h1 className={errorNumber}>
                    404
                </h1>
                <p className={title}>
                    Page not found
                </p>
                <Link to='/' className={link}>
                    Back to main page
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;