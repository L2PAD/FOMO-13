import React, {useState} from 'react';
import avatarImage from '../../../../assets/img/avatar.png'
import ExternalLinkIcon from '../../../common/Icons/external_link_icon';
import LinkedinIcon from '../../../common/Icons/linkedin_icon';
import FacebookIcon from '../../../common/Icons/facebook_icon';
import InstagramIcon from '../../../common/Icons/instagram_icon';
import TwitterIcon from '../../../common/Icons/twitter_icon';
import Button from '../../../common/button';
import EditIcon from '../../../common/Icons/edit_icon';
import moment from 'moment';
import {useStyles} from './styles';
import Status from '../../../common/status';
import {STATUS_LIST} from '../../../../static_content/dropdowns_data';
import TopFollowers from '../../../common/top_followers';
import ShareIcon from '../../../common/Icons/share_icon';
import BreadCrumbs from '../../../common/bread_crumbs';
import articleImage from '../../../../assets/img/article.png'
import DescriptionModal from '../../../common/global_modals/description_modal';
import TypeModal from '../modals/type_modal';
import MainDataModal from '../modals/main_data_modal';

const crumbs = [
    {title: 'Projects', link: '/early_land'},
    {title: 'SharkRace Club', link: '/early_land/project/2'},
]

const ProjectLayout = () => {
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
        descriptionWrapper,
        descriptionItemTitle,
        descriptionItemValue,
        articleWrapper,
        articleText,
        articleActionsWrapper,
    } = useStyles()

    const [isBioModal, setIsBioModal] = useState(false)
    const [typeModal, setTypeModal] = useState(false)
    const [mainDataModal, setMainDataModal] = useState(false)

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
                            <h1 className={projectTitle}>SharkRace Club</h1>
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
                        <p className={projectDataCellTitle}>{moment().format('MMM d, yyyy')}</p>
                        <p className={projectDataCellDescription}>Ending</p>
                    </div>
                    <div>
                        <p className={projectDataCellTitle}>Seed</p>
                        <p className={projectDataCellDescription}>Type <EditIcon onClick={() => setTypeModal(true)} /></p>
                    </div>
                </div>
            </div>
            <div>
                <div className={bioWrapper}>
                    <span>Bio:</span> <i onClick={() => setIsBioModal(true)}><EditIcon /></i> Amet minim mollit non
                    deserunt ullamco est sit aliqua dolor do amet sint. Velit
                    officia consequat duis enim velit mollit. Bio: Amet minim
                    mollit non deserunt ullamco est sit aliqua dolor do amet
                    sint. Velit officia consequat duis enim velit mollit.
                </div>
                <div className={followersWrapper}>
                    <TopFollowers />
                    <div className={guideWrapper}>
                        <div>
                            Guide
                        </div>
                        <a href="#">
                            Link to guidline
                        </a>
                    </div>
                </div>
            </div>
            <div className={descriptionWrapper}>
                <div>
                    <div className={descriptionItemTitle}>
                        Type
                    </div>
                    <div className={descriptionItemValue}>
                        Node
                    </div>
                </div>
                <div>
                    <div className={descriptionItemTitle}>
                        Reward Pool
                    </div>
                    <div className={descriptionItemValue}>
                        -
                    </div>
                </div>
                <div>
                    <div className={descriptionItemTitle}>
                        Max Participants
                    </div>
                    <div className={descriptionItemValue}>
                        -
                    </div>
                </div>
                <div>
                    <div className={descriptionItemTitle}>
                        Date of Start
                    </div>
                    <div className={descriptionItemValue}>
                        {moment().format('DD.MM.YYYY HH:mm')}
                    </div>
                </div>
                <div>
                    <div className={descriptionItemTitle}>
                        Date of End
                    </div>
                    <div className={descriptionItemValue}>
                        {moment().format('DD.MM.YYYY HH:mm')}
                    </div>
                </div>
                <div>
                    <div className={descriptionItemTitle}>
                        Expected Profit
                    </div>
                    <div className={descriptionItemValue}>
                        50.00 %
                    </div>
                </div>
            </div>
            <div className={articleWrapper}>
                <div className={editMainWrapper} onClick={() => setMainDataModal(true)}>
                    <EditIcon /> Edit main data
                </div>
                <img src={articleImage} alt=""/>
                <div className={articleText}>
                    The Contributor Program is a community incentive program designed to encourage community members
                    of different backgrounds and skillsets to steward and take ownership of key aspects of the
                    ecosystem. Participants of the program will be given points based on the quality of their
                    contributions to the ecosystem using evaluation criteria developed by existing leaders in the
                    community.
                    <br/><br/>
                    When the NEXT token goes live, the project plans to submit a proposal to the Connext DAO to
                    retroactively reward participants proportional to points received.
                    <br/><br/>
                    The program starts on the 20th of April 2022. Phase One of the program will run until the NEXT
                    token launches. After the token and DAO are live, the taem expects to continue with further
                    phases of the program.
                    <br/><br/>
                    Program Structure
                    The program consists of 5 Tracks that are operated by Track Operators; experienced leaders
                    within the community that are not part of the core team:
                    <br/><br/>
                    Community Leadership
                    <br/>
                    Builders
                    <br/>
                    Content & Education
                    <br/>
                    Routers
                    <br/>
                    Grants
                    <br/>
                    Community Leaders
                    <br/>
                    Community Leaders steward the ecosystem. They are responsible for running localized Connext communities around the world, supporting new users of the network, educating their regions about the network, managing social spaces for the ecosystem, and stewarding the community by upholding the project`s values and policies.
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
            {mainDataModal && <MainDataModal onClose={() => setMainDataModal(false)} />}
        </div>
    );
};

export default ProjectLayout;