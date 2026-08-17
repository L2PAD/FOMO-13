import {useState,useEffect, useMemo} from 'react';
import { useLocation } from 'react-router';
import avatarImage from '../../../../assets/img/avatar.png'
import ExternalLinkIcon from '../../../common/Icons/external_link_icon';
import EditIcon from '../../../common/Icons/edit_icon';
import {
    ActionsWrapper,
    CurrentRangeValue,
    CurrentRangeValueCurrency,
    CurrentRoiDescription,
    CurrentRoiValue,
    HeaderDataFollowersItem,
    HeaderDataFollowersItemsWrapper,
    HeaderDataFollowersTitle,
    HeaderDataFollowersWrapper,
    HeaderDataWrapper,
    LeftWrapperTitle, PriceRangeTitle,
    ProgressRangeWrapper, ProjectCardLink, ProjectsWrapper, RangeBar, RangeValues, RangeWrapper,
    useStyles
} from './styles';
import Status from '../../../common/status';
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
import ProjectTabs from './fund_tabs';
import {PROJECT_TABS_DATA, ProjectTabsData} from '../../../../static_content/project_tabs_data';
import DescriptionModal from '../../../common/global_modals/description_modal';
import TypeModal from '../modals/type_modal';
import MarketCapModal from '../modals/market_cap_modal';
import Volume24HModal from '../modals/vloume_24h_modal';
import PriceRangeModal from '../modals/price_range_modal';
import AddInvestorsModal from '../modals/add_investors_modal';
import InvestorsModal from '../modals/investors_modal';
import ExchangeSettings from '../modals/exchange_settings';
import TeamListModal from '../modals/team_list_modal';
import AddTeamListModal from '../modals/add_tem_list_modal';
import usePath from '../../../hooks/usePath';
import useFetch from '../../../hooks/useFetch';
import loader from '../../../services/loader';
import Loader from '../../../common/loader';
import { IProject } from '../../../hooks/useCreateProject';
import upperCaseFirstLetter from '../../../utils/upperCaseFirstLetter';
import getProjectStatus from '../../../utils/getProjectStatus';
import { useDispatch ,useSelector} from 'react-redux';
import { editProject, setProject } from '../../../../store/slices/editProjectSlice';
import { IComment, IFlag } from '../../../types/global_types';
import createComment from '../../../services/comments/createComment';
import removeComment from '../../../services/comments/removeComment';
import updateProject from '../../../services/projects/updateProject';
import { STATUS_LIST, StatusTabs } from '../../../../static_content/dropdowns_data';
import { TwitterIcon } from '../../../../assets';
import { EditBtnsWrapper, EditStateWrapper } from '../../person_page_layout/styles';
import EditProjectButton from '../../../common/button/EditProjectButton';
import EditButton from '../../../common/button/edit_button';
import GreenFlagsModal from '../../persons_layouts/modals/green_flags_modal';
import RedFlagsModal from '../../persons_layouts/modals/red_flags_modal';
import { useQuery } from 'react-query';
import fetchProjects from '../../../services/projects/fetchProjects';
import DefaultCard from '../../../common/DefaultCard';
import inputsHandler from '../../../utils/inputsHandler';
import AddProjectsModal from '../../persons_layouts/modals/AddProjectsModal';
import { toast } from 'react-toastify';
import reloadWindow from '../../../utils/reloadWindow';


const FundPageLayout = () => {
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
    const [isEditState,setIsEditState] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState(NFTProjectInvestorsTabs[0])
    const [activeProjectTab, setActiveProjectTab] = useState(StatusTabs[1])
    const [isBioModal, setIsBioModal] = useState(false)
    const [greenFlagsModal, setGreenFlagsModal] = useState(false)
    const [redFlagsModal, setRedFLagsModal] = useState(false)
    const dispatch = useDispatch()
    const [isAddParticipated,setIsAddParticipated] = useState<boolean>(false)
    const [isUpdatedProjects,setIsUpdatedProjects] = useState<boolean>(false)
    const projectsData = useQuery('fund-projects',() => fetchProjects(`all/active`))
    const [updatedProjects,setUpdatedProjects] = useState<Array<IProject>>([])

    const projectId  = useLocation().pathname.split('/').pop()
    const location = usePath() || 'projects'

    const {data,loading} = useFetch(`${location}/${projectId}`)
    const project : IProject = useSelector((state:any) => state.editProject.project)

    const confirmUpdateFund = async () : Promise<void> => {
        const oldProjectIds : Array<string> = project?.projects?.map((item:IProject) => item._id || '') || []
        const newProjectIds : Array<string> = 
          isUpdatedProjects
          ?
          updatedProjects?.map((item:IProject) => item._id || '') || []
          :
          oldProjectIds

        const oldFunds : Array<string> = [project._id || '']
    
        const updatedProject : any 
          =
          {
            name:project.name,
            bio:project.bio,
            banner:project.banner,
            greenFlagsList:project.greenFlagsList,
            redFlagsList:project.redFlagsList,
            oldFunds,
            newFunds:oldFunds,
            oldProjectIds,
            newProjectIds
          }
    
          const {success} = await updateProject(`funds/${project._id}`,updatedProject)
          
          setIsEditState(false)
        
          reloadWindow()
          setIsEditState(false)
    }

    const confirmUpdateProjects = (projectsIds:Array<string>) : void => {
        const projects : Array<IProject> = projectsData?.data?.projects?.filter((item:IProject) => {
            return projectsIds.includes(String(item._id))
          }) || []

        setIsAddParticipated(false)
        setIsUpdatedProjects(true)
        setUpdatedProjects(projects)
    }

    const handleProjectTab = (value: string) => {
        setActiveProjectTab(value as STATUS_LIST)
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

    const filteredProjects : Array<IProject>
    =
    useMemo(() => {
      if(isEditState && isUpdatedProjects) return updatedProjects.filter((project:IProject) => project.status.toLowerCase() === activeProjectTab.toLowerCase())
        
      return project.projects?.filter((project:IProject) => project.status === activeProjectTab) || []
    },[activeProjectTab,project,updatedProjects,isEditState,isUpdatedProjects])
  
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
                                {
                                    isEditState
                                    ?
                                    <EditStateWrapper>
                                        <input
                                        value={project.name}
                                        onChange={(e:any) => dispatch(editProject({key:'name',value:e.target.value}))}
                                        placeholder={`Fund's name`}
                                        />
                                    </EditStateWrapper>
                                    :
                                    <div className={projectTitle}>
                                        <h1>{project?.name}</h1>
                                    </div>
                                }
                                <div className={projectDescriptionWrapper}>
                                {
                                    isEditState
                                    ?
                                    <EditStateWrapper>
                                        <input
                                        value={project.banner}
                                        onChange={(e:any) => dispatch(editProject({key:'banner',value:e.target.value}))}
                                        placeholder={`Fund's banner`}
                                        />
                                    </EditStateWrapper>
                                    :
                                    <p className={projectDescription}>{project?.banner}</p>
                                }   
                                    <div className={socialNetworksWrapper}>
                                        {
                                            project?.socialmedia?.length
                                            ?
                                            project?.socialmedia.map((item,index) => {
                                                return (
                                                <a key={item.name + index} href={item.href}>
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
                    <HeaderDataWrapper>
            <HeaderDataFollowersWrapper>
              <HeaderDataFollowersTitle variant="p">
                <TwitterIcon fill="#738094" />
                Top Followers
              </HeaderDataFollowersTitle>
              <HeaderDataFollowersItemsWrapper>
                <HeaderDataFollowersItem>
                  {/* <UserAvatar
                    size="xSmall"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                    variant="default"
                  />
                  <Typography variant="p">John Doe</Typography> */}
                  -
                </HeaderDataFollowersItem>
                <HeaderDataFollowersItem>
                  {/* <UserAvatar
                    size="xSmall"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                    variant="default"
                  />
                  <Typography variant="p">John Doe</Typography> */}
                </HeaderDataFollowersItem>
              </HeaderDataFollowersItemsWrapper>
            </HeaderDataFollowersWrapper>
            <div>
              <CurrentRoiValue variant="p">+0%</CurrentRoiValue>
              <CurrentRoiDescription variant="p">
                Current ROI
              </CurrentRoiDescription>
            </div>
            <div>
              <CurrentRoiValue variant="p">+0%</CurrentRoiValue>
              <CurrentRoiDescription variant="p">ATH ROI</CurrentRoiDescription>
            </div>
            {
                isEditState
                ?
                <EditBtnsWrapper>
                  <EditProjectButton
                  onClick={confirmUpdateFund}
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
                onClick={() => setIsEditState((prev:boolean) => !prev)}
                />
            }
          </HeaderDataWrapper>
                </div>
                <div className={projectDescWrapper}>
                    <div>
                        <div className={bioWrapper}>
                            {
                                isEditState
                                ?
                                <i onClick={() => setIsBioModal(true)}><EditIcon /></i>
                                :
                                <></>
                            } 
                            {project?.bio || '-'}
                        </div>
                    </div>
                </div>
    
                <div className={projectTabsWrapper}>
                    <Tabs
                        tabs={StatusTabs}
                        onChange={handleProjectTab}
                        activeTab={activeProjectTab}
                    />
                                        {
                        isEditState
                        ?
                        <div className={investorsEditRow} onClick={() => setIsAddParticipated(true)}>
                            <EditIcon /> Edit projects list
                        </div>
                        :
                        <></>
                    }
                    <ProjectsWrapper>
                    {
                      filteredProjects?.map((item:IProject) => {
                        return (
                          <ProjectCardLink href={`/crypto/project/${item._id}`} key={item._id}>
                            <DefaultCard
                              project={item}
                            />
                          </ProjectCardLink>
                        );
                      })
                    }
                    </ProjectsWrapper>
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
                                    project.greenFlagsList.map((flag:IFlag,index:number) => {
                                        return (
                                            <div key={flag.text + index}>
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
                                    project.redFlagsList.map((flag:IFlag,index:number) => {
                                        return (
                                            <div key={flag.text + index}>
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

            {
            greenFlagsModal
            ?
            <GreenFlagsModal
            data={project}
            flagsList={project?.greenFlagsList}
            onChange={(data:any) => dispatch(editProject({key:'greenFlagsList',value:data.greenFlagsList}))}
            onClose={() => setGreenFlagsModal(false)}
            />
            :
            <></>
           }
           {
            redFlagsModal
            ?
            <RedFlagsModal
            data={project}
            flagsList={project?.redFlagsList}
            onChange={(data:any) => dispatch(editProject({key:'redFlagsList',value:data.redFlagsList}))}
            onClose={() => setRedFLagsModal(false)}
            />
            :
            <></>
           }
            {
            isAddParticipated
            ?
            <AddProjectsModal
            data={projectsData.data}
            projects={project?.projects || []}
            onClose={() => setIsAddParticipated(false)}
            onSubmit={async (projects:Array<string>) => {
                confirmUpdateProjects(projects)
            }}
            />
            :
            <></>
           }
        </>
    );
};

export default FundPageLayout;