import React, {useState} from 'react';
import BreadCrumbs from '../../../common/bread_crumbs';
import nftImage from '../../../../assets/img/article.png'
import avatarImage from '../../../../assets/img/avatar.png'
import EditIcon from '../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import UpdateNftModal from '../modals/update_nft_modal';
import DescriptionModal from '../../../common/global_modals/description_modal';

const crumbs = [
    {title: 'NFT`s', link: '/nfts'},
    {title: 'SharkRace Club', link: '/nfts/2'}
]

const NFTPageLayout = () => {
    const {
        wrapper,
        imageWrapper,
        userDataWrapper,
        contentHeader,
        contentHeaderEditWrapper,
        projectTitleWrapper,
        projectDescription,
        projectPriceWrapper,
        projectPriceTitle,
        projectPriceValue,
        creatorWrapper,
        creatorTitle,
        creatorRow,
        creatorRowTitle,
        creatorRowValue,
    } = useStyles()

    const [nftModal, setNftModal] = useState(false)
    const [bioModal, setBioModal] = useState(false)

    return (
        <div className='container'>
            <BreadCrumbs options={crumbs} />
            <div className={wrapper}>
                <div className={imageWrapper}>
                    <img src={nftImage} alt=""/>
                </div>
                <div>
                    <div className={contentHeader}>
                        <div className={userDataWrapper}>
                            <img src={avatarImage} alt=""/>
                            <p>John Doe</p>
                        </div>
                        <div className={contentHeaderEditWrapper} onClick={() => setNftModal(true)}>
                            <EditIcon /> Edit main data
                        </div>
                    </div>
                    <div>
                        <div className={projectTitleWrapper}>
                            SharkRace Club
                            <span>#7003</span>
                        </div>
                        <div className={projectDescription}>
                            <span>Bio:</span> <EditIcon onClick={() => setBioModal(true)} /> Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
                            Velit officia consequat duis enim velit mollit.
                        </div>
                    </div>
                    <div className={projectPriceWrapper}>
                        <img src={avatarImage} alt=""/>
                        <div>
                            <div className={projectPriceTitle}>
                                Listed on <span>x2y2</span> for
                            </div>
                            <div className={projectPriceValue}>1.004 ETh</div>
                        </div>
                    </div>
                    <div className={creatorWrapper}>
                        <div className={creatorTitle}>
                            Creator
                        </div>
                        <div>
                            <div>
                                <div className={creatorRow}>
                                    <div className={userDataWrapper}>
                                        <img src={avatarImage} alt=""/>
                                        <p>John Doe</p>
                                    </div>
                                </div>
                                <div className={creatorRow}>
                                    <div className={creatorRowTitle}>
                                        Contact address
                                    </div>
                                    <div className={creatorRowValue}>
                                        0x5f465df4f6...165df
                                    </div>
                                </div>
                                <div className={creatorRow}>
                                    <div className={creatorRowTitle}>
                                        Token ID
                                    </div>
                                    <div className={creatorRowValue}>
                                        54989
                                    </div>
                                </div>
                                <div className={creatorRow}>
                                    <div className={creatorRowTitle}>
                                        Token standart
                                    </div>
                                    <div className={creatorRowValue}>
                                        ERC721
                                    </div>
                                </div>
                                <div className={creatorRow}>
                                    <div className={creatorRowTitle}>
                                        Blockchain
                                    </div>
                                    <div className={creatorRowValue}>
                                        Ethereum
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {nftModal && <UpdateNftModal onClose={() => setNftModal(false)} />}
            {bioModal && <DescriptionModal onClose={() => setBioModal(false)} />}
        </div>
    );
};

export default NFTPageLayout;