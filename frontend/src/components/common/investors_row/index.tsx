import React from 'react';
import avatarImage from '../../../assets/img/avatar.png'
import {useStyles} from './styles';
import loader from '../../services/loader';

const InvestorsRow = ({investors}:{investors:Array<any>}) => {
    const {
        wrapper,
        imageWrapper,
        valueWrapper,
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={imageWrapper}>
                {
                    investors.map((investor,index) => {
                        return (
                            <img key={index} src={investor?.logo ? loader(investor?.logo) :  avatarImage} alt=""/>
                        )
                    })
                }
            </div>
            <div className={valueWrapper}>
                Total: <span>{investors.length} investors</span>
            </div>
        </div>
    );
};

export default InvestorsRow;