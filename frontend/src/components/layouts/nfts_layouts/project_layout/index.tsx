import React, {useState} from 'react';
import avatarImage from '../../../../assets/img/avatar.png'
import ExternalLinkIcon from '../../../common/Icons/external_link_icon';
import LinkedinIcon from '../../../common/Icons/linkedin_icon';
import FacebookIcon from '../../../common/Icons/facebook_icon';
import InstagramIcon from '../../../common/Icons/instagram_icon';
import TwitterIcon from '../../../common/Icons/twitter_icon';
import Button from '../../../common/button';
import EditIcon from '../../../common/Icons/edit_icon';
import CalendarIcon from '../../../common/Icons/calendar_icon';
import NotificationIcon from '../../../common/Icons/notification_icon';
import LikeIcon from '../../../common/Icons/like_icon';
import {useStyles} from './styles';
import Status from '../../../common/status';
import {STATUS_LIST} from '../../../../static_content/dropdowns_data';
import TopFollowers from '../../../common/top_followers';
import ShareIcon from '../../../common/Icons/share_icon';
import BreadCrumbs from '../../../common/bread_crumbs';
import IdeaIcon from '../../../common/Icons/idea_icon';
import CopyIcon from '../../../common/Icons/copy_icon';
import Filter from '../../../common/filter';
import SortBy from '../../../common/sort_by';
import NFTCard from '../../../common/nft_card';
import PersonSimpleCard from '../../../common/person_simple_card';
import Tabs from '../../../common/tabs';
import {NFT_PROJECT_INVESTORS_TABS, NFTProjectInvestorsTabs} from '../../../../static_content/nft_project_data';
import CheckIcon from '../../../common/Icons/check_icon';
import CloseIcon from '../../../common/Icons/close_icon';
import NewsRowLayout from '../../common_layouts/news_row_layout';
import CommentsLayout from '../../common_layouts/comments_layout';
import DescriptionModal from '../../../common/global_modals/description_modal';
import TypeModal from '../modals/type_modal';
import MarketCapModal from '../modals/market_cap_modal';
import Volume24HModal from '../modals/vloume_24h_modal';
import PriceRangeModal from '../modals/price_range_modal';
import InvestorsModal from '../modals/investors_modal';
import AddInvestorsModal from '../modals/add_investors_modal';
import TeamListModal from '../modals/team_list_modal';
import AddTeamListModal from '../modals/add_tem_list_modal';
import GreenFlagsModal from '../modals/green_flags_modal';
import RedFlagsModal from '../modals/red_flags_modal';
import {
    CurrentRangeValue,
    CurrentRangeValueCurrency,
    LeftWrapperTitle, PriceRangeTitle, ProgressRangeWrapper, RangeBar, RangeValues, RangeWrapper
} from '../../projects_layouts/project_layout/styles';

const crumbs = [
    {title: 'Collections', link: '/nfts'},
    {title: 'NFT project', link: '/nfts'},
]

const NftsProjectLayout = () => {
    const {
        preHeaderWrapper,
        preHeaderRightWrapper,
        shareWrapper,
        headerWrapper,
        leftHeaderWrapper,
        projectWrapper,
        projectImage,
        projectTitle,
        projectDescriptionWrapper,
        projectDescription,
        socialNetworksWrapper,
        projectDataWrapper,
        projectDataCellTitle,
        projectDataCellDescription,
        projectDataActionsWrapper,
        bioWrapper,
        followersWrapper,
        guideWrapper,
        progressTitle,
        progressValue,
        projectDescWrapper,
        progressValueDescription,
        contractWrapper,
        descriptionWrapper,
        descriptionItemTitle,
        descriptionItemValue,
        subsWrapper,
        subsItem,
        graphicWrapper,
        graphicTopWrapper,
        graphicTopTitle,
        graphicTopRow,
        graphicTopCell,
        graphicBottomRow,
        graphicBottomRowTitle,
        graphicBottomRowValue,
        contentWrapper,
        contentTitle,
        nftsHeaderWrapper,
        flexCardWrapper,
        investorsEditRow,
        flagsColumnTitle,
        flagsContentWrapper,
        flagsColumnWrapper,
        ratingsMediaLinksWrapper,
    } = useStyles()

    const [activeTab, setActiveTab] = useState(NFTProjectInvestorsTabs[0])
    const [isBioModal, setIsBioModal] = useState(false)
    const [typeModal, setTypeModal] = useState(false)
    const [priceRangeModal, setPriceRangeModal] = useState(false)
    const [marketCapModal, setMarketCapModal] = useState(false)
    const [volumeModal, setVolumeModal] = useState(false)
    const [investorsModal, setInvestorsModal] = useState(false)
    const [addInvestorsModal, setAddInvestorsModal] = useState(false)
    const [teamModal, setTeamModal] = useState(false)
    const [addTeamModal, setAddTeamModal] = useState(false)
    const [greenFlagsModal, setGreenFlagsModal] = useState(false)
    const [redFlagsModal, setRedFLagsModal] = useState(false)

    const handleTab = (value: NFT_PROJECT_INVESTORS_TABS) => {
        setActiveTab(value as NFT_PROJECT_INVESTORS_TABS)
    }

    return (
        <>
            <div className='container'>
                <div className={preHeaderWrapper}>
                    <div>
                        <BreadCrumbs options={crumbs} />
                    </div>
                </div>
                <div className={preHeaderRightWrapper}>
                    <div className={shareWrapper}>
                        <ShareIcon /> Share
                    </div>
                </div>
                <div className={headerWrapper}>
                    <div className={leftHeaderWrapper}>
                        <div className={projectWrapper}>
                            <img className={projectImage} src={avatarImage} alt=""/>
                            <div>
                                <div className={projectTitle}>
                                    <h1>SharkRace Club</h1>
                                </div>
                                <div className={projectDescriptionWrapper}>
                                    <p className={projectDescription}>NFT & Collectibles</p>
                                    <Status status={STATUS_LIST.ACTIVE} />
                                    <div className={socialNetworksWrapper}>
                                        <ExternalLinkIcon />
                                        <LinkedinIcon />
                                        <FacebookIcon />
                                        <InstagramIcon />
                                        <TwitterIcon />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={projectDataWrapper}>
                        <div>
                            <p className={projectDataCellTitle}>$1.8M</p>
                            <p className={projectDataCellDescription}>Total Raised</p>
                        </div>
                        <div>
                            <p className={projectDataCellTitle}>$1000</p>
                            <p className={projectDataCellDescription}>Allocation</p>
                        </div>
                        <div>
                            <p className={projectDataCellTitle}>Seed</p>
                            <p className={projectDataCellDescription}>Type <EditIcon onClick={() => setTypeModal(true)} /></p>
                        </div>
=                    </div>
                </div>
                <div className={projectDescWrapper}>
                    {/*<div>*/}
                    {/*    <div className={progressTitle}>Token sale ended <EditIcon onClick={() => setPriceRangeModal(true)} /></div>*/}
                    {/*    <div className={progressValue} />*/}
                    {/*    <div className={progressValueDescription}>*/}
                    {/*        <span>$1,850,000</span> <i>of</i> $1,850,000 (100%)*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                    <ProgressRangeWrapper>
                        <div>
                            <LeftWrapperTitle>
                                Price <EditIcon onClick={() => setPriceRangeModal(true)} />
                            </LeftWrapperTitle>
                            <CurrentRangeValue>$1.92 <span>58.17</span></CurrentRangeValue>
                            <CurrentRangeValueCurrency>0.0000636 ETH<span>58.17</span></CurrentRangeValueCurrency>
                            <CurrentRangeValueCurrency>0.0000636 ETH<span>58.17</span></CurrentRangeValueCurrency>
                        </div>
                        <RangeWrapper>
                            <PriceRangeTitle>Price range</PriceRangeTitle>
                            <RangeBar value={50}><div/></RangeBar>
                            <RangeValues>
                                <div>Low: <span>$1.27</span></div>
                                <div>High: <span>$2.72</span></div>
                            </RangeValues>
                        </RangeWrapper>
                    </ProgressRangeWrapper>
                    <div>
                        <div className={bioWrapper}>
                            <span>Bio:</span> <i onClick={() => setIsBioModal(true)}><EditIcon /></i> Amet minim mollit non
                            deserunt ullamco est sit aliqua dolor do amet sint. Velit
                            officia consequat duis enim velit mollit. Bio: Amet minim
                            mollit non deserunt ullamco est sit aliqua dolor do amet
                            sint. Velit officia consequat duis enim velit mollit.
                        </div>
                        <div className={followersWrapper}>
                            <div className={guideWrapper}>
                                <div>
                                    Smart contracts:
                                </div>
                                <div className={contractWrapper}>0x70...34ggff02 <CopyIcon /></div>
                            </div>
                            <TopFollowers />
                        </div>
                    </div>
                </div>
                <div className={descriptionWrapper}>
                    <div>
                        <div className={descriptionItemTitle}>
                            Market Cap <EditIcon onClick={() => setMarketCapModal(true)} />
                        </div>
                        <div className={descriptionItemValue}>
                            $15.38 M
                        </div>
                    </div>
                    <div>
                        <div className={descriptionItemTitle}>
                            Volume 24H <EditIcon onClick={() => setVolumeModal(true)} />
                        </div>
                        <div className={descriptionItemValue}>
                            $3.67 M
                            <span className='green'>58.17%</span>
                        </div>
                    </div>
                    <div>
                        <div className={descriptionItemTitle}>
                            Circulating Supply
                        </div>
                        <div className={descriptionItemValue}>
                            8.01 M GFI
                            <span className='gray'>7.01%</span>
                        </div>
                    </div>
                    <div>
                        <div className={descriptionItemTitle}>
                            Total Supply
                        </div>
                        <div className={descriptionItemValue}>
                            118.01 M GFI
                        </div>
                    </div>
                    <div>
                        <div className={descriptionItemTitle}>
                            Floor
                        </div>
                        <div className={descriptionItemValue}>
                            -
                        </div>
                    </div>
                    <div>
                        <div className={descriptionItemTitle}>
                            Owners
                        </div>
                        <div className={subsWrapper}>
                            <div className={subsItem}>
                                <img src={avatarImage} alt=""/>
                                John Doe
                            </div>
                            <div className={subsItem}>
                                <img src={avatarImage} alt=""/>
                                John Doe
                            </div>
                        </div>
                    </div>
                </div>
                <div className={graphicWrapper}>
                    <div />
                    <div>
                        <div className={graphicTopWrapper}>
                            <div className={graphicTopTitle}>
                                ROI since ICO
                            </div>
                            <div className={graphicTopRow}>
                                <div className={graphicTopCell}>
                                    <div>
                                        USD
                                    </div>
                                    <span className='green'>
                                    5.03x
                                </span>
                                </div>
                                <div className={graphicTopCell}>
                                    <div>
                                        BTC
                                    </div>
                                    <span>
                                    1.87x
                                </span>
                                </div>
                                <div className={graphicTopCell}>
                                    <div>
                                        ETH
                                    </div>
                                    <span className='red'>
                                    0.94x
                                </span>
                                </div>
                            </div>
                        </div>
                        <div className={graphicTopWrapper}>
                            <div className={graphicTopTitle}>
                                Price Statistics
                            </div>
                            <div className={graphicBottomRow}>
                                <div className={graphicBottomRowTitle}>
                                    Price
                                </div>
                                <div className={graphicBottomRowValue}>
                                    $1.38
                                </div>
                            </div>
                            <div className={graphicBottomRow}>
                                <div className={graphicBottomRowTitle}>
                                    24h Change
                                </div>
                                <div className={`${graphicBottomRowValue} green`}>
                                    $0.7061
                                    <span>58.71%</span>
                                </div>
                            </div>
                            <div className={graphicBottomRow}>
                                <div className={graphicBottomRowTitle}>
                                    Market Cap
                                </div>
                                <div className={graphicBottomRowValue}>
                                    $15.38 M
                                </div>
                            </div>
                            <div className={graphicBottomRow}>
                                <div className={graphicBottomRowTitle}>
                                    Volume 24h <EditIcon />
                                </div>
                                <div className={graphicBottomRowValue}>
                                    58.71%
                                    <span className='green'>58.71%</span>
                                </div>
                            </div>
                            <div className={graphicBottomRow}>
                                <div>
                                    <div className={graphicBottomRowTitle}>
                                        All-Time High
                                    </div>
                                    <span>Jan 11, 2022</span>
                                </div>
                                <div className={graphicBottomRowValue}>
                                    $32.94
                                    <span className='green'>158.71%</span>
                                </div>
                            </div>
                            <div className={graphicBottomRow}>
                                <div>
                                    <div className={graphicBottomRowTitle}>
                                        All-Time Low
                                    </div>
                                    <span>Jan 10, 2022</span>
                                </div>
                                <div className={graphicBottomRowValue}>
                                    $32.94
                                    <span className='red'>-58.71%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={contentWrapper}>
                    <div className={contentTitle}>
                        NFT`s
                    </div>
                    <div className={nftsHeaderWrapper}>
                        <Filter />
                        <SortBy />
                    </div>
                    <div className={flexCardWrapper}>
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                        <NFTCard />
                    </div>
                </div>
                <div className={contentWrapper}>
                    <div className={contentTitle}>
                        Investors
                    </div>
                    <div className={investorsEditRow} onClick={() => setInvestorsModal(true)}>
                        <EditIcon /> Edit investors list
                    </div>
                    <div className={flexCardWrapper}>
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                    </div>
                </div>
                <div className={contentWrapper}>
                    <div>
                        <Tabs
                            tabs={NFTProjectInvestorsTabs}
                            onChange={handleTab as (value: string) => void}
                            activeTab={activeTab}
                        />
                    </div>
                    <div className={investorsEditRow} onClick={() => setTeamModal(true)}>
                        <EditIcon /> Edit team list
                    </div>
                    <div className={flexCardWrapper}>
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                        <PersonSimpleCard />
                    </div>
                </div>
                <div className={contentWrapper}>
                    <div className={contentTitle}>
                        Flags
                    </div>
                    <div className={flagsContentWrapper}>
                        <div>
                            <div className={flagsColumnTitle}>
                                Green <EditIcon onClick={() => setGreenFlagsModal(true)} />
                            </div>
                            <div className={flagsColumnWrapper}>
                                <div>
                                    <CheckIcon />
                                    Support Mulyiple Blockchains with Different Protocols
                                    <ExternalLinkIcon />
                                </div>
                                <div>
                                    <CheckIcon />
                                    Strong Partnership
                                </div>
                                <div>
                                    <CheckIcon />
                                    Solid Team
                                </div>
                                <div>
                                    <CheckIcon />
                                    Detailed Roadmap
                                    <ExternalLinkIcon />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className={flagsColumnTitle}>
                                Red <EditIcon onClick={() => setRedFLagsModal(true)} />
                            </div>
                            <div className={flagsColumnWrapper}>
                                <div>
                                    <CloseIcon />
                                    Support Mulyiple Blockchains with Different Protocols
                                </div>
                                <div>
                                    <CloseIcon />
                                    Strong Partnership
                                </div>
                                <div>
                                    <CloseIcon />
                                    Solid Team
                                </div>
                                <div>
                                    <CloseIcon />
                                    Detailed Roadmap
                                </div>
                                <div>
                                    <CloseIcon />
                                    Support Mulyiple Blockchains with Different Protocols
                                </div>
                                <div>
                                    <CloseIcon />
                                    Strong Partnership
                                </div>
                                <div>
                                    <CloseIcon />
                                    Solid Team
                                </div>
                                <div>
                                    <CloseIcon />
                                    Detailed Roadmap
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <NewsRowLayout />
            <div className='container'>
                <div className={contentWrapper}>
                    <CommentsLayout />
                </div>
                <div className={contentWrapper}>
                    <div className={contentTitle}>
                        Rating & Media
                    </div>
                    <div className={ratingsMediaLinksWrapper}>
                        <a href='#'>
                            ArcBlock Rating Review <ExternalLinkIcon />
                        </a>
                        <a href='#'>
                            ArcBlock Coin Guide <ExternalLinkIcon />
                        </a>
                    </div>
                </div>
            </div>
            {isBioModal && <DescriptionModal onClose={() => setIsBioModal(false)} />}
            {isBioModal && <DescriptionModal onClose={() => setIsBioModal(false)} />}
            {typeModal && <TypeModal onClose={() => setTypeModal(false)} />}
            {marketCapModal && <MarketCapModal onClose={() => setMarketCapModal(false)} />}
            {volumeModal && <Volume24HModal onClose={() => setVolumeModal(false)} />}
            {priceRangeModal && <PriceRangeModal onClose={() => setPriceRangeModal(false)} />}
            {investorsModal && <InvestorsModal
                hideModal={() => {
                    setInvestorsModal(false)
                    setAddInvestorsModal(true)
                }}
                onClose={() => setInvestorsModal(false)} />}
            {/* {addInvestorsModal && <AddInvestorsModal
                onClose={() => {
                    setInvestorsModal(true)
                    setAddInvestorsModal(false)
                }}
                addInvestors={() => {
                    setInvestorsModal(true)
                    setAddInvestorsModal(false)
                }}
            />} */}
            {teamModal && <TeamListModal
                hideModal={() => {
                    setTeamModal(false)
                    setAddTeamModal(true)
                }}
                onClose={() => setTeamModal(false)} />}
            {addTeamModal && <AddTeamListModal
                onClose={() => {
                    setTeamModal(true)
                    setAddTeamModal(false)
                }}
                addInvestors={() => {
                    setTeamModal(true)
                    setAddTeamModal(false)
                }}
            />}
            {greenFlagsModal && <GreenFlagsModal onClose={() => setGreenFlagsModal(false)} />}
            {redFlagsModal && <RedFlagsModal onClose={() => setRedFLagsModal(false)} />}
        </>
    );
};

export default NftsProjectLayout;
