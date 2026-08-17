import { useState , useEffect} from 'react';
import { useLocation } from 'react-router';
import { IFlag, IPerson, IComment } from '../../types/global_types';
import {
    LinkIcon,
    LinkedinIcon,
    FacebookIcon,
    InstagramIcon,
    TwitterIcon,
} from '../../../assets'
import 'react-circular-progressbar/dist/styles.css';
import avatarImage from '../../../assets/img/avatar.png'
import CommentsLayout from '../common_layouts/comments_layout';
import BreadCrumbs from '../../common/bread_crumbs';
import PersonSimpleCard from '../../common/person_simple_card';
import {buildStyles, CircularProgressbar} from 'react-circular-progressbar';
import EditIcon from '../../common/Icons/edit_icon';
import ExternalLinkIcon from '../../common/Icons/external_link_icon';
import CheckIcon from '../../common/Icons/check_icon';
import CloseIcon from '../../common/Icons/close_icon';
import useFetch from '../../hooks/useFetch';
import createComment from '../../services/comments/createComment';
import removeComment from '../../services/comments/removeComment';
import loader from '../../services/loader';
import Loader from '../../common/loader';
import BioModal from '../../common/global_modals/bio_modal';
import GreenFlagsModal from '../persons_layouts/modals/green_flags_modal';
import RedFlagsModal from '../persons_layouts/modals/red_flags_modal';
import usePath from '../../hooks/usePath';
import AddProjectsModal from '../persons_layouts/modals/AddProjectsModal';
import fetchProjects from '../../services/projects/fetchProjects';
import { useQuery } from 'react-query';
import fetchParticipants from '../../services/participants/fetchParticipants';
import {
    CurrentRoiDescription,
    CurrentRoiValue,
    HeaderDataFollowersItem,
    HeaderDataFollowersItemsWrapper,
    HeaderDataFollowersTitle,
    HeaderDataFollowersWrapper, HeaderDataRightWrapper,
    HeaderDataWrapper,
    HeaderDescription,
    HeaderInfoWrapper,
    HeaderUserDescriptionWrapper,
    HeaderUserInfoWrapper,
    HeaderUserName,
    HeaderWrapper, NFTsWrapper,
    PageWrapper,
    ParticipatedHeaderWrapper,
    ParticipatedTitle,
    ParticipatedWrapper,
    RatingCircleWrapper, SocialsWrapper, UserAvatarWrapper,
    AvatarWrapper,
    ButtonEdit,
    useStyles,
    EditBtnsWrapper,
    EditStateWrapper,
} from './styles';
import { IProject } from '../../hooks/useCreateProject';
import EditButton from '../../common/button/edit_button';
import EditProjectButton from '../../common/button/EditProjectButton';
import inputsHandler from '../../utils/inputsHandler';
import updateProject from '../../services/projects/updateProject';
import TextEditor from '../../common/text_editor/TextEditor';

const crumbsItems = [
    {title: 'Projects', link: '/projects'},
    {title: 'Persons', link: '/projects/persons'},
]

const Person = () => {
    const {
        contentWrapper,
        contentTitle,
        flagsColumnTitle,
        flagsContentWrapper,
        flagsColumnWrapper,
    } = useStyles()

    const [person,setPerson] = useState<IPerson>()
    const [crumbs,setCrumbs] = useState<Array<{title: string, link: string}>>(crumbsItems)
    const allProjectsData = useQuery('all-projects',() => fetchProjects(`all/active`))
    const allPersonsData = useQuery('all-persons',fetchParticipants)
    const [isEditState,setIsEditState] = useState<boolean>(false)
    
    const [updatedParticipated,setUpdatedParticipated] = useState<Array<any>>([])
    const [updatedColleagues,setUpdatedColleagues] = useState<Array<any>>([])
    const [isBio,setIsBio] = useState<boolean>(false)
    const [isGreenFlags,setIsGreenFlags] = useState<boolean>(false)
    const [isRedFlags,setIsRedFlags] = useState<boolean>(false)
    const [isAddColleagues,setIsAddColleagues] = useState<boolean>(false)
    const [isAddParticipated,setIsAddParticipated] = useState<boolean>(false)

    const id = useLocation().pathname.split('/').pop()
    const location = usePath()
    const {data,loading} = useFetch(`persons/${id}`)

    const addComment = async (comment:IComment) : Promise<void> => {
        const {success,data} = await createComment(`${location}/comment/${person?._id}`,{...comment})
    
        const newCommentId : string = data[0]

        const newComment : IComment = {...comment,_id:newCommentId}

        const updatedPerson : any = {...person,comments:[newComment,...person?.comments || []]}

        setPerson(updatedPerson)
    }

    const deleteComment = async (comment:IComment,commentId:string) : Promise<void> => {
       await removeComment(`${location}/comment/${person?._id}`,commentId)

       const filteredComments = person?.comments?.filter((prComment) => {
         return new Date(prComment.date).getTime() !== new Date(comment.date).getTime()
       })

       const updatedPerson : any = {...person,comments:filteredComments}

       setPerson(updatedPerson)
    }

    const confirmUpdateProjects = async (projectsIds:Array<string>,key:'participated' | 'colleagues') : Promise<void> => {
        if(key === 'participated'){
          const projects : Array<IProject> = allProjectsData?.data?.projects?.filter((item:IProject) => {
            return projectsIds.includes(String(item._id))
          }) || []

          data?.data?.projects && setUpdatedParticipated(projects)
        
          const personDataToUpdate : any 
          =
          {
            ...person,
            participated:projects
          }

          setPerson(personDataToUpdate)
        }else{
          const persons : Array<IProject> = allPersonsData?.data?.data?.filter((item:IProject) => {
            return projectsIds.includes(String(item._id))
          }) || []

          allPersonsData?.data?.data && setUpdatedColleagues(persons)
          const personDataToUpdate : any 
          =
          {
            ...person,
            colleagues:persons
          }
          setPerson(personDataToUpdate)
        }

        setIsAddColleagues(false)
        setIsAddParticipated(false)
    }

    const confirmUpdatePerson = async () : Promise<void> => {
        const personDataToUpdate : any = {
            bio:person?.bio,
            name:person?.name,
            banner:person?.banner,
            participated:person?.participated?.map((item:any) => item._id),
            colleagues:person?.colleagues?.map((item:any) => item._id),
            greenFlagsList:person?.greenFlagsList,
            redFlagsList:person?.redFlagsList,
        }
        const {success} = await updateProject(`persons/${person?._id}`,personDataToUpdate)
        setPerson((prev:any) => {
            return ({
                ...prev,
                ...personDataToUpdate,
                colleagues:prev.colleagues,
                participated:prev.participated,
            })
        })
        setIsEditState(false)
    }

    useEffect(() => {
        if(!data?.data) return 
        
        setPerson(data.data)
        setCrumbs((prev) => {
            return (
                [...prev,{title:data?.data.name,link:`${data?.data._id}`}]
            )
        })

    },[data])

    if(loading) return <Loader/>

    return (
        <>
        <PageWrapper>
            <BreadCrumbs options={crumbs}/>
            <HeaderWrapper>
                <HeaderInfoWrapper>
                    <HeaderUserInfoWrapper>
                        {
                            person?.logo
                            ?
                            <AvatarWrapper>
                                <img src={loader(person.logo)} alt={person.name}/>
                            </AvatarWrapper>
                            :
                            <UserAvatarWrapper
                                src={avatarImage}
                            />
                        }

                        <div>
                            <HeaderUserName>
                                {
                                    isEditState
                                    ?
                                    <EditStateWrapper>
                                        <input
                                        placeholder={`Enter the person's name`}
                                        value={person?.name}
                                        onChange={(e:any) => inputsHandler('name',e.target.value,setPerson)}
                                        />
                                    </EditStateWrapper>
                                    :
                                    <p>
                                        {person?.name}
                                    </p>
                                }
                                <RatingCircleWrapper>
                                    {/*//@ts-ignore*/}
                                    <CircularProgressbar
                                        value={75}
                                        text={`${75}%`}
                                        styles={buildStyles({
                                            rotation: 0.25,
                                            pathColor: 'rgba(4,165,132, 75)',
                                            textColor: 'rgba(4,165,132, 75)',
                                            trailColor: '#EEEEEE',
                                        })}
                                    >
                                        {75}
                                    </CircularProgressbar>
                                </RatingCircleWrapper>
                            </HeaderUserName>
                            <HeaderUserDescriptionWrapper>
                                {
                                    isEditState
                                    ?
                                    <EditStateWrapper>
                                        <input
                                        placeholder={`Enter the person's banner`}
                                        value={person?.banner}
                                        onChange={(e:any) => inputsHandler('banner',e.target.value,setPerson)}
                                        />
                                    </EditStateWrapper>
                                    :
                                    <p>
                                        {person?.banner}
                                    </p>
                                }
                                <SocialsWrapper>
                                    {/* <LinkIcon fill="#00C099"/>
                                    <LinkedinIcon fill="#00C099"/>
                                    <FacebookIcon fill="#00C099"/>
                                    <InstagramIcon fill="#00C099"/>
                                    <TwitterIcon fill="#00C099"/> */}
                                </SocialsWrapper>
                            </HeaderUserDescriptionWrapper>
                        </div>
                    </HeaderUserInfoWrapper>
                    <HeaderDataWrapper>
                        <HeaderDataFollowersWrapper>
                            <HeaderDataFollowersTitle>
                                <TwitterIcon fill="#738094"/>
                                Top Followers
                            </HeaderDataFollowersTitle>
                            <HeaderDataFollowersItemsWrapper>
                                <HeaderDataFollowersItem>
                                    <img src={avatarImage} alt="" width={16}/>
                                    <p>
                                        -
                                    </p>
                                </HeaderDataFollowersItem>
                                <HeaderDataFollowersItem>
                                    <img src={avatarImage} alt="" width={16}/>
                                    <p>
                                        -
                                    </p>
                                </HeaderDataFollowersItem>
                            </HeaderDataFollowersItemsWrapper>
                        </HeaderDataFollowersWrapper>
                        <HeaderDataRightWrapper>
                            <div>
                                <CurrentRoiValue>
                                    -
                                </CurrentRoiValue>
                                <CurrentRoiDescription>
                                    Current ROI
                                </CurrentRoiDescription>
                            </div>
                            <div>
                                <CurrentRoiValue>
                                    -
                                </CurrentRoiValue>
                                <CurrentRoiDescription>
                                    ATH ROI
                                </CurrentRoiDescription>
                            </div>
                        </HeaderDataRightWrapper>
                        {
                            isEditState
                            ?
                            <EditBtnsWrapper>
                                <EditProjectButton
                                onClick={confirmUpdatePerson}
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
                    </HeaderDataWrapper>
                </HeaderInfoWrapper>
                <div>
                    <HeaderDescription>
                        <span></span>
                        {
                            isEditState
                            ?
                            <EditStateWrapper>
                                <TextEditor
                                value={String(person?.bio)}
                                onChange={(value:string) => inputsHandler('bio',value,setPerson)}
                                />
                            </EditStateWrapper>
                            :
                            <div dangerouslySetInnerHTML={{__html:person?.bio || '-'}}>

                            </div> 
                        }
                    </HeaderDescription>
                </div>
            </HeaderWrapper>
            <ParticipatedWrapper>
                <ParticipatedHeaderWrapper>
                    <ParticipatedTitle>
                    <span>Participated ICO</span> 
                    {
                        isEditState
                        ?
                        <ButtonEdit onClick={() => setIsAddParticipated(true)}><EditIcon/></ButtonEdit>
                        :
                        <></>
                    }
                    </ParticipatedTitle>
                </ParticipatedHeaderWrapper>
                <NFTsWrapper>
                    {
                        person?.participated?.map((item:any) => {
                            return (
                                <PersonSimpleCard 
                                key={item._id}
                                item={item}
                                />
                            )
                        })
                    }
                </NFTsWrapper>
            </ParticipatedWrapper>
            <ParticipatedWrapper>
                <ParticipatedHeaderWrapper>
                    <ParticipatedTitle>
                        <span>Colleagues in ICO</span> 
                        {
                            isEditState
                            ?
                            <ButtonEdit onClick={() => setIsAddColleagues(true)}><EditIcon/></ButtonEdit>
                            :
                            <></>
                        }
                    </ParticipatedTitle>
                </ParticipatedHeaderWrapper>
                <NFTsWrapper>
                    {
                        person?.colleagues?.map((item:any) => {
                            return (
                                <PersonSimpleCard 
                                key={item._id}
                                item={item}
                                />
                            )
                        })
                    }
                </NFTsWrapper>
            </ParticipatedWrapper>
            <div className={contentWrapper}>
                <div className={contentTitle}>
                    Flags
                </div>
                <div className={flagsContentWrapper}>
                    <div>
                        <div className={flagsColumnTitle}>
                            Green <ButtonEdit onClick={() => setIsGreenFlags(true)}><EditIcon/></ButtonEdit>
                        </div>
                        <div className={flagsColumnWrapper}>
                            {
                                person?.greenFlagsList
                                ?
                                person?.greenFlagsList.map((flag:IFlag,index:number) => {
                                    if(flag.link){
                                        return (
                                            flag?.text
                                            ?
                                            <div key={flag.text + index}>
                                                <CheckIcon />
                                                <span>{flag.text}</span>
                                                <ExternalLinkIcon />
                                            </div>
                                            :
                                            <span key={index}>No green flags...</span>
                                        )
                                    }

                                    return (
                                        flag?.text
                                        ?
                                        <div key={flag.text + index}>
                                           <CheckIcon />
                                           <span>{flag.text}</span>
                                        </div>
                                        :
                                        <span key={index}>No green flags...</span>
                                    )
                                })
                                :
                                <>No green flags...</>
                            }
                        </div>
                    </div>
                    <div>
                        <div className={flagsColumnTitle}>
                            Red <ButtonEdit onClick={() => setIsRedFlags(true)}><EditIcon/></ButtonEdit>
                        </div>
                        <div className={flagsColumnWrapper}>
                            {
                                person?.redFlagsList
                                ?
                                person?.redFlagsList.map((flag:IFlag,index:number) => {
                                    return (
                                        flag?.text
                                        ?
                                        <div key={flag.text + index}>
                                            <CloseIcon />
                                            <span>{flag.text}</span>
                                        </div>
                                        :
                                        <span key={index}>No red flags...</span>
                                    )
                                })
                                :
                                <>No red flags...</>
                            }
                        </div>
                    </div>
                </div>
            </div>
            <div className={contentWrapper}>
                <CommentsLayout 
                addComment={addComment}
                deleteComment={deleteComment}
                comments={person?.comments}
                />
            </div>
        </PageWrapper>
           {
            isBio
            ?
            <BioModal
            onChange={(data:any) => setPerson(data)}
            onClose={() => setIsBio(false)}
            data={person}/>
            :
            <></>
           }
           {
            isGreenFlags
            ?
            <GreenFlagsModal
            data={person}
            flagsList={person?.greenFlagsList}
            onChange={(data:any) => setPerson(data)}
            onClose={() => setIsGreenFlags(false)}
            />
            :
            <></>
           }
           {
            isRedFlags
            ?
            <RedFlagsModal
            data={person}
            flagsList={person?.redFlagsList}
            onChange={(data:any) => setPerson(data)}
            onClose={() => setIsRedFlags(false)}
            />
            :
            <></>
           }
           {
            isAddColleagues
            ?
            <AddProjectsModal
            modalType={'persons'}
            data={{persons:allPersonsData?.data?.data || []}}
            projects={person?.colleagues || []}
            onClose={() => setIsAddColleagues(false)}
            onSubmit={async (projects:Array<string>) => {
                confirmUpdateProjects(projects,'colleagues')
            }}
            />
            :
            <></>
           }
           {
            isAddParticipated
            ?
            <AddProjectsModal
            data={allProjectsData.data}
            projects={person?.participated || []}
            onClose={() => setIsAddParticipated(false)}
            onSubmit={async (projects:Array<string>) => {
                confirmUpdateProjects(projects,'participated')
            }}
            />
            :
            <></>
           }
        </>
    );
};

export default Person;