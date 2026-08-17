import {useState,useEffect} from 'react';
import { useLocation } from 'react-router';
import { toast } from 'react-toastify';
import moment from 'moment';
import { clarifyAmount } from '../../../utils/clarifyAmount';
import avatarImage from '../../../../assets/img/avatar.png'
import ExternalLinkIcon from '../../../common/Icons/external_link_icon';
import LinkedinIcon from '../../../common/Icons/linkedin_icon';
import FacebookIcon from '../../../common/Icons/facebook_icon';
import InstagramIcon from '../../../common/Icons/instagram_icon';
import TwitterIcon from '../../../common/Icons/twitter_icon';
import EditIcon from '../../../common/Icons/edit_icon';
import Status from '../../../common/status';
import {STATUS_LIST} from '../../../../static_content/dropdowns_data';
import TopFollowers from '../../../common/top_followers';
import ShareIcon from '../../../common/Icons/share_icon';
import BreadCrumbs from '../../../common/bread_crumbs';
import CopyIcon from '../../../common/Icons/copy_icon';
import CheckIcon from '../../../common/Icons/check_icon';
import CloseIcon from '../../../common/Icons/close_icon';
import CommentsLayout from '../../common_layouts/comments_layout';
import PersonSimpleCard from '../../../common/person_simple_card';
import Tabs from '../../../common/tabs';
import {NFT_PROJECT_INVESTORS_TABS, NFTProjectInvestorsTabs} from '../../../../static_content/nft_project_data';
import ProjectTabs from './project_tabs';
import {ActiveProjectTabsData, PROJECT_TABS_DATA, ProjectTabsData} from '../../../../static_content/project_tabs_data';
import DescriptionModal from '../../../common/global_modals/description_modal';
import TypeModal from '../modals/type_modal';
import MarketCapModal from '../modals/market_cap_modal';
import Volume24HModal from '../modals/vloume_24h_modal';
import PriceRangeModal from '../modals/price_range_modal';
import AddInvestorsModal from '../modals/add_investors_modal';
import InvestorsModal from '../modals/investors_modal';
import GreenFlagsModal from '../modals/green_flags_modal';
import RedFlagsModal from '../modals/red_flags_modal';
import ExchangeSettings from '../modals/exchange_settings';
import TeamListModal from '../modals/team_list_modal';
import AddTeamListModal from '../modals/add_tem_list_modal';
import usePath from '../../../hooks/usePath';
import useFetch from '../../../hooks/useFetch';
import loader from '../../../services/loader';
import Loader from '../../../common/loader';
import { IProject, Investor } from '../../../hooks/useCreateProject';
import upperCaseFirstLetter from '../../../utils/upperCaseFirstLetter';
import getProjectStatus from '../../../utils/getProjectStatus';
import { useDispatch ,useSelector} from 'react-redux';
import { editProject, setProject } from '../../../../store/slices/editProjectSlice';
import { IComment, IFlag } from '../../../types/global_types';
import createComment from '../../../services/comments/createComment';
import removeComment from '../../../services/comments/removeComment';
import updateProject from '../../../services/projects/updateProject';
import useProjectPath from '../../../hooks/useProjectPath';
import EditButton from '../../../common/button/edit_button';
import EditProjectButton from '../../../common/button/EditProjectButton';
import { EditBtnsWrapper } from '../../person_page_layout/styles';
import {
    CurrentRangeValue,
    CurrentRangeValueCurrency,
    LeftWrapperTitle, PriceRangeTitle,
    ProgressRangeWrapper, ProjectBanner, RangeBar, RangeValues, RangeWrapper,
    useStyles
} from './styles';

const ProjectPageLayout = () => {
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
        contentWrapper,
        contentTitle,
        flagsColumnTitle,
        flagsContentWrapper,
        flagsColumnWrapper,
        investorsEditRow,
        flexCardWrapper,
        projectTabsWrapper,
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
    const [exchangeSettings, setExchangeSettings] = useState(false)
    const dispatch = useDispatch()

    const projectId  = useLocation().pathname.split('/').pop()
    const location = useProjectPath() || 'project'

    const {data,loading} = useFetch(`${location}/data/${projectId}`)
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const isEndedProject : boolean = project?.status?.toLowerCase() === 'ended'
    const [activeProjectTab, setActiveProjectTab] = useState(isEndedProject ? ProjectTabsData[1] : ActiveProjectTabsData[0])
    
    const [isEditState,setIsEditState] = useState<boolean>(false)

    const investorsHandler = (investors:Array<any>) : void => {
        dispatch(editProject({key:'investors',value:investors}))
    }

    const participantsHandler = (key:string,items:Array<any>) : void => {
        dispatch(editProject({key,value:items}))
    }

    const confrimInvestorsChanges = async () : Promise<void> => {
        setInvestorsModal(false)
    }

    const confrimParticipantsChanges = async (items:Array<Investor>) : Promise<void> => {
        participantsHandler(activeTab.toLowerCase(),items)
        setTeamModal(false)
        setAddTeamModal(false)
    }

    const handleTab = (value: string) => {
        setActiveTab(value as NFT_PROJECT_INVESTORS_TABS)
    }

    const handleProjectTab = (value: string) => {
        setActiveProjectTab(value as PROJECT_TABS_DATA)
    }

    const addComment = async (comment:IComment) : Promise<void> => {
        const {success,data} = await createComment(`${location}/comment/${project._id}`,{...comment})
    
        const newCommentId : string = data[0]

        dispatch(editProject({key:'comments',value:[{...comment,_id:newCommentId},...project?.comments || []]}))
    }

    const deleteComment = async (comment:IComment,commentId:string) : Promise<void> => {
       await removeComment(`${location}/comment/${project._id}`,commentId)

       const filteredComments = project?.comments?.filter((prComment) => {
         return new Date(prComment.date).getTime() !== new Date(comment.date).getTime()
       })

       dispatch(editProject(
        {
            key:'comments',
            value: filteredComments
        }))
    }

    const confirmProjectUpdates = async () : Promise<void> => {
        const updatedProject : any 
        =
        {
          investors:project?.investors?.map((item) => item._id),
          partners:project?.partners?.map((item) => item._id),
          advisors:project?.advisors?.map((item) => item._id),
          team:project?.team?.map((item) => item._id),
          comparison:project?.comparison?.map((item) => item._id),
          name:project.name,
          niche:project.niche,
          bio:project.bio,
          type:project.type,
          lastFunding:project.lastFunding,
          totalRaised:project.totalRaised,
          totalForSale:project.totalForSale,
          totalAllocation:project.totalAllocation,
          totalSupply:project.totalSupply,
          tokenMetrics:project.tokenMetrics,
          greenFlagsList:project.greenFlagsList,
          redFlagsList:project.redFlagsList,
          price:project.price,
          lowPrice:project.lowPrice,
          highPrice:project.highPrice,
          fundraising:project.fundraising
        }
  
        const {success} = await updateProject(`projects/${project._id}`,updatedProject)
  
        if(success){
          toast.success(
            <div>
              <h3>Success!</h3>
              <p>Project updated!</p>
            </div>
          );
        }else{
          toast.error(
            <div>
              <h3>Error!</h3>
              <p>Your limit on updating projects for today has been reached</p>
            </div>
          )
        }
  
        setIsEditState(false)
    }

    useEffect(() => {
        if(data?.data){
            dispatch(setProject(data.data))
        }
    },[data])
    
    if(loading) return <Loader/>

    return (
        <>
            <div className='container'>
                <div className={preHeaderWrapper}>
                    <div>
                        <BreadCrumbs 
                        options={[
                            {title:upperCaseFirstLetter(location),link:`/${location}`},
                            {title:project?.name || '',link:`/${location}/${project?._id}`}
                        ]}  
                        />
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
                            {
                                typeof project?.logo === 'string'
                                ?
                                <img className={projectImage} src={loader(project?.logo)} alt="logo"/>
                                :
                                <img className={projectImage} src={avatarImage} alt="logo"/>
                            }
                            <div>
                                <div className={projectTitle}>
                                    <h1>{project?.name}</h1>
                                </div>
                                <div className={projectDescriptionWrapper}>
                                    <ProjectBanner>
                                        <p>{project.niche}</p>
                                        <Status 
                                        status={getProjectStatus(project?.status || 'active')} />
                                    </ProjectBanner>
                                   
                                    <div className={socialNetworksWrapper}>
                                        {
                                            project?.socialmedia?.length
                                            ?
                                            project?.socialmedia.map((item) => {
                                                return (
                                                <a key={item.name} href={item.href}>
                                                    <img src={item.icon} alt={item.name} />    
                                                </a>
                                                )
                                            })
                                            :
                                            <>
                                            </>
                                        }

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={projectDataWrapper}>
                        <div>
                            <p className={projectDataCellTitle}>${clarifyAmount(Number(project?.totalRaised))}</p>
                            <p className={projectDataCellDescription}>Total Raised</p>
                        </div>
                        <div>
                            <p className={projectDataCellTitle}>{moment(new Date(project?.lastFunding)).format('ll') || '-'}</p>
                            <p className={projectDataCellDescription}>Last Funding</p>
                        </div>
                        <div>
                            <p className={projectDataCellTitle}>{project?.type || '-'}</p>
                            <p className={projectDataCellDescription}>Type 
                                {
                                    isEditState
                                    ?
                                    <EditIcon onClick={() => setTypeModal(true)} />
                                    :
                                    <></>
                                }
                            </p>
                        </div>
                        {
                            isEditState
                            ?
                            <EditBtnsWrapper>
                                <EditProjectButton
                                onClick={confirmProjectUpdates}
                                variant={'confirm'}
                                >
                                    Save
                                </EditProjectButton>
                                <EditProjectButton
                                onClick={() => setIsEditState((prev:boolean) => !prev)}
                                variant={'reject'}
                                >
                                    Cancel
                                </EditProjectButton>
                            </EditBtnsWrapper>
                            :
                            <EditButton
                            onClick={() => setIsEditState(true)}
                            />
                        }
                    </div>
                </div>

                <div className={projectDescWrapper}>
                    <ProgressRangeWrapper>
                        <div>
                            <LeftWrapperTitle>
                                Price {
                                    isEditState
                                    ?
                                    <EditIcon onClick={() => setPriceRangeModal(true)} />
                                    :
                                    <></>
                                }
                            </LeftWrapperTitle>
                            <CurrentRangeValue>${Number(project?.price).toFixed(2) || '0'} <span>00.00</span></CurrentRangeValue>
                            <CurrentRangeValueCurrency>0.000000 ETH<span>00.00</span></CurrentRangeValueCurrency>
                            <CurrentRangeValueCurrency>0.000000 ETH<span>00.00</span></CurrentRangeValueCurrency>
                        </div>
                        <RangeWrapper>
                            <PriceRangeTitle>Price range</PriceRangeTitle>
                            <RangeBar value={project?.priceRange || 0}><div/></RangeBar>
                            <RangeValues>
                                <div>Low: <span>${clarifyAmount(Number(project?.lowPrice)) || '0'}</span></div>
                                <div>High: <span>${clarifyAmount(Number(project?.highPrice)) || '0'}</span></div>
                            </RangeValues>
                        </RangeWrapper>
                    </ProgressRangeWrapper>
                    <div>
                        <div className={bioWrapper}>
                            <span>Bio:</span> {
                                isEditState
                                ?
                                <i onClick={() => setIsBioModal(true)}><EditIcon /></i>
                                :
                                <></>
                            } 
                            {project?.bio || '-'}
                        </div>
                        <div className={followersWrapper}>
                            <div className={guideWrapper}>
                                <div>
                                    Smart contracts:
                                </div>
                                    {
                                    project?.smartContracts?.length
                                    ?
                                    project?.smartContracts?.map((item) => {
                                        return (
                                        <div key={item} className={contractWrapper}>
                                            <span>{item}</span>
                                            <CopyIcon />
                                        </div>
                                        ) 
                                    })
                                    :
                                    <div className={contractWrapper}>
                                        <span>-</span>
                                        <CopyIcon />
                                     </div>
                                    }
                                
                            </div>
                            <TopFollowers followers={project?.topFollowers || []}/>
                        </div>
                    </div>
                </div>

                {
                    isEndedProject
                    ?
                    <div className={descriptionWrapper}>
                        <div>
                        <div className={descriptionItemTitle}>
                            Market Cap 
                            {
                                isEditState
                                ?
                                <EditIcon onClick={() => setMarketCapModal(true)} />
                                :
                                <></>
                            }
                        </div>
                        <div className={descriptionItemValue}>
                            {clarifyAmount(project?.marketCap || 0) || '0'}
                        </div>
                        </div>
                        <div>
                        <div className={descriptionItemTitle}>
                            Volume 24H 
                            {
                                isEditState
                                ?
                                <EditIcon onClick={() => setVolumeModal(true)} />
                                :
                                <></>
                            }
                        </div>
                        <div className={descriptionItemValue}>
                            {clarifyAmount(project?.volume || 0) || '0'}
                            <span className='green'>{project?.volumeGrowth || '0'}%</span>
                        </div>
                        </div>
                        <div>
                        <div className={descriptionItemTitle}>
                            Circulating Supply
                        </div>
                        <div className={descriptionItemValue}>
                            {clarifyAmount(project?.circulatingSupply || 0) || '0'}
                            <span className='gray'>0%</span>
                        </div>
                        </div>
                        <div>
                        <div className={descriptionItemTitle}>
                            Total Supply
                        </div>
                        <div className={descriptionItemValue}>
                            {project?.totalSupply || '0'}
                        </div>
                        </div>
                        <div>
                        <div className={descriptionItemTitle}>
                            Fully Dil. Val
                        </div>
                        <div className={descriptionItemValue}>
                        {project?.FullyDilVal || '0'}
                        </div>
                        </div>
                        <div>
                        <div className={descriptionItemTitle}>
                            Dominance
                        </div>
                        <div className={descriptionItemValue}>
                            {Number(project?.dominance).toFixed(2) || '0'} %
                        </div>
                        </div>
                        <div>
                        <div className={descriptionItemTitle}>
                            Volume/Market cap
                        </div>
                        <div className={descriptionItemValue}>
                        {clarifyAmount(project?.marketCap || 0) || '0'}
                        </div>
                        </div>
                    </div>
                    :
                    <></>
                }

                <div className={projectTabsWrapper}>
                    <Tabs
                        tabs={isEndedProject ? ProjectTabsData : ActiveProjectTabsData}
                        onChange={handleProjectTab}
                        activeTab={activeProjectTab}
                    />
                    <ProjectTabs 
                    isEditState={isEditState}
                    activeTab={activeProjectTab}/>
                </div>

                <div className={contentWrapper}>
                    <div className={contentTitle}>
                        Investors
                    </div>
                    {
                        isEditState
                        ?
                        <div className={investorsEditRow} onClick={() => setInvestorsModal(true)}>
                            <EditIcon /> Edit investors list
                        </div>
                        :
                        <></>
                    }
                    <div className={flexCardWrapper}>
                        {
                            project?.investors 
                            ?
                            project.investors.map((item:any,index:number) => {
                                return <PersonSimpleCard item={item} key={index}/>
                            })
                            :
                            <></>
                        }
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
                    {
                        isEditState
                        ?
                        <div className={investorsEditRow} onClick={() => setTeamModal(true)}>
                            <EditIcon/> Edit team list
                        </div>
                        :
                        <></>
                    }
                    <div className={flexCardWrapper}>
                    {
                            // @ts-ignore
                            project[activeTab.toLowerCase()]?.length
                            ?
                            // @ts-ignore
                            project[activeTab.toLowerCase()].map((item:any,index:number) => {
                                return <PersonSimpleCard item={item} key={index}/>
                            })
                            :
                            <></>
                        }
                    </div>
                </div>

                <div className={contentWrapper}>
                    <div className={contentTitle}>
                        Flags
                    </div>
                    <div className={flagsContentWrapper}>
                        <div>
                            <div className={flagsColumnTitle}>
                                Green 
                                {
                                    isEditState
                                    ?
                                    <EditIcon onClick={() => setGreenFlagsModal(true)} />
                                    :
                                    <></>
                                }
                            </div>
                            <div className={flagsColumnWrapper}>
                                {
                                    project.greenFlagsList?.length
                                    ?
                                    project.greenFlagsList.map((flag:IFlag) => {
                                        return (
                                            <div key={flag.text}>
                                                <CheckIcon />
                                                {flag.text}
                                                {
                                                    flag.link
                                                    ?
                                                    <a href={flag.link}>
                                                        <ExternalLinkIcon />
                                                    </a>
                                                    :
                                                    <></>
                                                }
                                            </div>
                                        )
                                    })
                                    :
                                    <>No green flags</>
                                }
                            </div>
                        </div>
                        <div>
                            <div className={flagsColumnTitle}>
                                Red 
                                {
                                    isEditState
                                    ?
                                    <EditIcon onClick={() => setRedFLagsModal(true)} />
                                    :
                                    <></>
                                }
                            </div>
                            <div className={flagsColumnWrapper}>
                                {
                                    project.redFlagsList?.length
                                    ?
                                    project.redFlagsList.map((flag:IFlag) => {
                                        return (
                                            <div key={flag.text}>
                                                <CloseIcon />
                                                {flag.text}
                                            </div>
                                        )
                                    })
                                    :
                                    <>No red flags</>
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div className={contentWrapper}>
                    <CommentsLayout 
                    deleteComment={deleteComment}
                    addComment={addComment}
                    comments={project.comments || []}/>
                </div>

            </div>
            {isBioModal && <DescriptionModal onClose={() => setIsBioModal(false)} />}
            {typeModal && <TypeModal onClose={() => setTypeModal(false)} />}
            {marketCapModal && <MarketCapModal onClose={() => setMarketCapModal(false)} />}
            {volumeModal && <Volume24HModal onClose={() => setVolumeModal(false)} />}
            {priceRangeModal && <PriceRangeModal onClose={() => setPriceRangeModal(false)} />}
            {investorsModal && <InvestorsModal
                data={project}
                investors={project.investors || []}
                inputsHandler={investorsHandler}
                hideModal={() => {
                    setInvestorsModal(false)
                    setAddInvestorsModal(true)
                }}
                onClose={confrimInvestorsChanges} />}
            {
                addInvestorsModal && project
                ?
                <AddInvestorsModal
                addInvestors={investorsHandler}
                onClose={() => {
                    setAddInvestorsModal(false),
                    setInvestorsModal(true)
                }}
                data={project}
                />
                :
                <></>
            }
            {teamModal && <TeamListModal
                // @ts-ignore
                items={project[activeTab.toLowerCase()] || []}
                participantsHandler={participantsHandler}
                label={activeTab}
                data={project}
                hideModal={() => {
                    setTeamModal(false)
                    setAddTeamModal(true)
                }}
                onConfirm={confrimParticipantsChanges}
                onClose={() => setTeamModal(false)} />}
            {addTeamModal && <AddTeamListModal
                participantsHandler={participantsHandler}
                label={activeTab.toLowerCase()}
                onClose={() => {
                    setTeamModal(true)
                    setAddTeamModal(false)
                }}
            />}
            {greenFlagsModal && <GreenFlagsModal onClose={() => setGreenFlagsModal(false)} />}
            {redFlagsModal && <RedFlagsModal onClose={() => setRedFLagsModal(false)} />}
            {exchangeSettings && <ExchangeSettings onClose={() => setExchangeSettings(false)} />}
        </>
    );
};

export default ProjectPageLayout;