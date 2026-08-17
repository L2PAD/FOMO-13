import {FC,useState,useCallback} from 'react';
import {useStyles} from './styles';
import StatusDropdown from '../../../../../common/status_dropdown';
import RedFlags from '../../../../../common/red_flags';
import Rating from '../../../../../common/rating';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import avatarImage from '../../../../../../assets/img/avatar.png'
import {STATUS_LIST} from '../../../../../../static_content/dropdowns_data';
import {Link} from 'react-router-dom';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';
import UpdatingProjectModal from '../../../modals/updating_project';
import InvestorsModal from '../../../../nfts_layouts/modals/investors_modal';
import { IProject } from '../../../../../hooks/useCreateProject';
import loader from '../../../../../services/loader';
import getProjectStatus from '../../../../../utils/getProjectStatus';
import { useDispatch } from 'react-redux';
import { setUpdatedProject } from '../../../../../../store/slices/projectSlice';
import changeStatus from '../../../../../services/projects/changeStatus';
import changeRedStatus from '../../../../../services/projects/changeRedStatus';
import Loader from '../../../../../common/loader';
import removeProject from '../../../../../services/projects/removeProject';
import reloadWindow from '../../../../../utils/reloadWindow';

interface IProps {
    project:IProject
}

const TableRow : FC<IProps> = ({project}) => {
    const {
        wrapper,
        rowWrapper,
        projectWrapper,
        projectImage,
        statusWrapper,
        investorsWrapper,
        ratingWrapper,
        raisedWrapper,
        typeWrapper,
        actionsWrapper,
        flagsWrapper,
        fundingWrapper,
        projectTitle,
        projectDescription,
    } = useStyles({status: project.redStatus || false, rating: 75})

    const dispatch = useDispatch()
    const [activeStatus, setActiveStatus] = useState<STATUS_LIST>(getProjectStatus(project.status))
    const [loading,setLoading] = useState(false)
    const [updateProjectModal, setUpdateProjectModal] = useState(false)
    const [addInvestorsModal, setAddInvestorsModal] = useState(false)

    const updateProject = (project:IProject) => {
        dispatch(setUpdatedProject(project))
        setUpdateProjectModal(true)
    }

    const updateStatus = async (value: STATUS_LIST) => {
        setLoading(true)
        await changeStatus('projects',project._id || '',value)
        setActiveStatus(value)
        setLoading(false)
    }

    const deleteProject = useCallback( async () => {
        setLoading(true)
        await removeProject(`earlyland/promohub`,project._id || '')
        reloadWindow()
        setLoading(false)
    },[loading])

    const toggleRedStatus = useCallback( async () => {
        setLoading(true)
        await changeRedStatus('projects',project._id || '')
        reloadWindow()
        setLoading(false)
    },[loading])


    if(loading){
        return <Loader/>
    }
    

    return (
        <div className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <Link to={`/early_land/project/${project._id}`} className={projectWrapper}>
                    {
                        typeof project.logo === 'string' 
                        ?
                        <img className={projectImage} src={loader(project.logo)} alt="name"/>
                        :
                        <img className={projectImage} src={loader(avatarImage)} alt="name"/>

                    }
                    
                    <div>
                        <div className={projectTitle}>
                            {project.name} <span>{project.fullness}</span>
                        </div>
                        <div className={projectDescription}>
                            {project.niche}
                        </div>
                    </div>
                </Link>
                <div className={statusWrapper}>
                    <StatusDropdown
                        onChange={updateStatus}
                        activeOption={activeStatus}
                    />
                </div>
                <div className={investorsWrapper}>
                    {project.maxParticipants || '-'}
                </div>
                <div className={raisedWrapper}>
                    {project.activityType || '-'}
                </div>
                <div className={fundingWrapper}>
                    {project.reward || '-'}
                </div>
                <div className={typeWrapper}>
                    {project.type || '-'}
                </div>
                <div className={flagsWrapper}>
                    <RedFlags count={Number(project.radFlags) || 0} />
                </div>
                <div className={ratingWrapper}>
                    <Rating rating={Number(project.rating) || 0} />
                </div>
                <div className={actionsWrapper}>
                    <Button
                        type='outlined'
                        onClick={() => updateProject(project)}
                    >
                        <EditIcon />
                    </Button>
                    <DotsButtonWithDropdown items={[
                        {title: project.redStatus ? 'Delete red status' : 'Give red status', onClick: toggleRedStatus},
                        {title: 'Delete', onClick: deleteProject}
                    ]} />
                </div>
            </div>
            {updateProjectModal 
            ? 
            <UpdatingProjectModal
            isAddInvestorsModal={addInvestorsModal}
            backToUpdatingModal={() => {
                setUpdateProjectModal(true)
                setAddInvestorsModal(false)
            }}
            onClose={() => setUpdateProjectModal(false)}
            hideModal={() => {
                setAddInvestorsModal(true)
            }}
            />
            :
            <></>
            }
        </div>
    );
};

export default TableRow;