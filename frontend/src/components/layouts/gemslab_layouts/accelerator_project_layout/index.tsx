import React, {useState} from 'react';
import avatarImage from '../../../../assets/img/avatar.png'
import ExternalLinkIcon from '../../../common/Icons/external_link_icon';
import LinkedinIcon from '../../../common/Icons/linkedin_icon';
import FacebookIcon from '../../../common/Icons/facebook_icon';
import InstagramIcon from '../../../common/Icons/instagram_icon';
import TwitterIcon from '../../../common/Icons/twitter_icon';
import Button from '../../../common/button';
import EditIcon from '../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import Status from '../../../common/status';
import {STATUS_LIST} from '../../../../static_content/dropdowns_data';
import TopFollowers from '../../../common/top_followers';
import ShareIcon from '../../../common/Icons/share_icon';
import BreadCrumbs from '../../../common/bread_crumbs';
import articleImage from '../../../../assets/img/article.png'
import PercentageCircle from '../../../common/percentage_circle';
import CopyIcon from '../../../common/Icons/copy_icon';
import {Link} from 'react-router-dom';
import DescriptionModal from '../../../common/global_modals/description_modal';
import TypeModal from '../modals/type_modal';
import PublicRoundModal from '../modals/public_round_modal';
import StrongModal from '../modals/strong_modal';
import PriceRangeModal from '../modals/price_range_modal';
import MainDataModal from '../modals/main_data_modal';
import {
    CurrentRangeValue,
    CurrentRangeValueCurrency,
    LeftWrapperTitle, PriceRangeTitle, ProgressRangeWrapper, RangeBar, RangeValues, RangeWrapper
} from '../../projects_layouts/project_layout/styles';

const crumbs = [
    {title: 'Accelerator', link: '/gems_lab/accelerator'},
    {title: 'SharkRace Club', link: '/gems_lab/accelerator/2'},
]

const AcceleratorProjectLayout = () => {
    const {
        preHeaderWrapper,
        preHeaderRightWrapper,
        editMainWrapper,
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
        bioWrapper,
        followersWrapper,
        guideWrapper,
        articleWrapper,
        articleText,
        articleActionsWrapper,
        progressTitle,
        progressValue,
        projectDescWrapper,
        progressValueDescription,
        contractWrapper,
        mainContentHeader,
        mainContentLeftWrapper,
        mainContentRightWrapper,
        mainContentTitle,
        mainContentDescription,
        mainContentTimerTitle,
        mainContentTimerValue,
        tokenWrapper,
        tokenTitle,
        tokenRow,
        tokenLeftRow,
        tokenRightRow,
        tokenDataWrapper,
    } = useStyles()

    const [isBioModal, setIsBioModal] = useState(false)
    const [typeModal, setTypeModal] = useState(false)
    const [priceModal, setPriceModal] = useState(false)
    const [publicModal, setPublicModal] = useState(false)
    const [strongModal, setStrongModal] = useState(false)
    const [mainModal, setMainModal] = useState(false)

    return (
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
                                <PercentageCircle rating={75} />
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
                        <p className={projectDataCellDescription}>Type <EditIcon onClick={() => setTypeModal} /></p>
                    </div>
                </div>
            </div>
            <div className={projectDescWrapper}>
                {/*<div>*/}
                {/*    <div className={progressTitle}>Token sale ended <EditIcon onClick={() => setPriceModal(true)} /></div>*/}
                {/*    <div className={progressValue} />*/}
                {/*    <div className={progressValueDescription}>*/}
                {/*        <span>$1,850,000</span> <i>of</i> $1,850,000 (100%)*/}
                {/*    </div>*/}
                {/*</div>*/}
                <ProgressRangeWrapper>
                    <div>
                        <LeftWrapperTitle>
                            Price <EditIcon onClick={() => setPriceModal(true)} />
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
            <div className={articleWrapper}>
                <div className={mainContentHeader}>
                    <div className={mainContentLeftWrapper}>
                        <div className={mainContentTitle}>
                            Public round <EditIcon onClick={() => setPublicModal(true)} />
                        </div>
                        <div className={mainContentDescription}>
                            Registrations are opened to anyone with more than $1000 worth of tokens in their wallet.
                            <Link to='/'>
                                {' '}See Rules
                            </Link>
                        </div>
                        <div className={mainContentTimerTitle}>
                            Contribution Closes
                        </div>
                        <div className={mainContentTimerValue}>
                            1d 2h 48m 43s
                        </div>
                    </div>
                    <div className={mainContentRightWrapper}>
                        <div className={mainContentTitle}>
                            Strong hold offer <EditIcon onClick={() => setStrongModal(true)} />
                        </div>
                        <div className={mainContentDescription}>
                            Premium round offerings for DAO holders only. Higher winning chances with lower fees.
                            <Link to='/'>
                                {' '}See Rules
                            </Link>
                        </div>
                        <div className={mainContentTimerTitle}>
                            Contribution Closes
                        </div>
                        <div className={mainContentTimerValue}>
                            1d 2h 48m 43s
                        </div>
                    </div>
                </div>
                <div className={editMainWrapper} onClick={() => setMainModal(true)}>
                    <EditIcon /> Edit main data
                </div>
                <img src={articleImage} alt=""/>
                <div className={articleText}>
                    The Contributor Program is a community incentive program designed to encourage community
                    members of different backgrounds and skillsets to steward and take ownership of key aspects of
                    the ecosystem. Participants of the program will be given points based on the quality of their
                    contributions to the ecosystem using evaluation criteria developed by existing leaders in the
                    community.
                </div>
                <div className={tokenWrapper}>
                    <div className={tokenTitle}>Token Sale and Economics</div>
                    <div className={tokenDataWrapper}>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Hard Cap:
                            </div>
                            <div className={tokenRightRow}>
                                4000000 USD
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Total Token Supply:
                            </div>
                            <div className={tokenRightRow}>
                                40000000 ALPINE
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Initial Circulating Supply:
                            </div>
                            <div className={tokenRightRow}>
                                28.40% of Total Token Supply
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Public Sale Token Price:
                            </div>
                            <div className={tokenRightRow}>
                                1 USD (price in BNB will be determined prior to the start of subscription)
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Tokens Offered:
                            </div>
                            <div className={tokenRightRow}>
                                4000000 ALPINE
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Hard Cap Per User:
                            </div>
                            <div className={tokenRightRow}>
                                10000 USD (price in BNB will be determined prior to the start of subscription)
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Token Sale Vesting Period:
                            </div>
                            <div className={tokenRightRow}>
                                No lockup
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Token Type:
                            </div>
                            <div className={tokenRightRow}>
                                BEP20
                            </div>
                        </div>
                        <div className={tokenRow}>
                            <div className={tokenLeftRow}>
                                Token Distribution:
                            </div>
                            <div className={tokenRightRow}>
                                After the end of token sale
                            </div>
                        </div>
                    </div>
                </div>
                <div className={articleActionsWrapper}>
                    <Button
                        onClick={() => console.log(1)}
                        type='fill'
                    >
                        Go to event page
                    </Button>
                    <Button
                        onClick={() => console.log(1)}
                        type='lightFill'
                    >
                        Go to project page
                    </Button>
                </div>
            </div>
            {isBioModal && <DescriptionModal onClose={() => setIsBioModal(false)} />}
            {typeModal && <TypeModal onClose={() => setTypeModal(false)} />}
            {publicModal && <PublicRoundModal onClose={() => setPublicModal(false)} />}
            {strongModal && <StrongModal onClose={() => setStrongModal(false)} />}
            {priceModal && <PriceRangeModal onClose={() => setPriceModal(false)} />}
            {mainModal && <MainDataModal onClose={() => setMainModal(false)} />}
        </div>
    );
};

export default AcceleratorProjectLayout;