import React from 'react';
import {useStyles} from './styles';
import avatarImage from '../../../../../../../assets/img/avatar.png'

const TableRow = () => {
    const {
        wrapper,
        exchangeWrapper,
        pairWrapper,
        percentVolumeWrapper,
        priceWrapper,
        updatedWrapper,
        volumeWrapper
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={exchangeWrapper}>
                <img src={avatarImage} alt=""/>
                Binance Futures
            </div>
            <div className={`${pairWrapper} green`}>Trading pair</div>
            <div className={priceWrapper}>Price</div>
            <div className={volumeWrapper}> 24H Volume</div>
            <div className={percentVolumeWrapper}>% Volume</div>
            <div className={updatedWrapper}>Updated</div>
        </div>
    );
};

export default TableRow;