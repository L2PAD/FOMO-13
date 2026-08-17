import React from 'react';
import {useStyles} from './styles';
import nftImage from '../../../assets/img/article.png'
import {Link} from 'react-router-dom';

const NFTCard = () => {
    const {
        wrapper,
        dataWrapper,
        dataTitle,
        dataDescription,
    } = useStyles()

    return (
        <div className={wrapper}>
            <img src={nftImage} alt=""/>
            <div className={dataWrapper}>
                <div className={dataTitle}>SharkRace Club</div>
                <div className={dataDescription}>
                    <div>1.004 ETH</div>
                    <Link to='/nfts/nft/123'>
                        Details {'>'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NFTCard;