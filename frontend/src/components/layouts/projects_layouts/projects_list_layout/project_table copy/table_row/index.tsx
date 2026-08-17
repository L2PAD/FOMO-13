import { useState, useCallback } from 'react';
import {useStyles} from './styles';
import StatusDropdown from '../../../../../common/status_dropdown';
import RedFlags from '../../../../../common/red_flags';
import InvestorsRow from '../../../../../common/investors_row';
import Rating from '../../../../../common/rating';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import {STATUS_LIST} from '../../../../../../static_content/dropdowns_data';
import {Link} from 'react-router-dom';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';
import loader from '../../../../../services/loader';
import getProjectStatus from '../../../../../utils/getProjectStatus';
import parseDate from '../../../../../utils/parseDate';
import Loader from '../../../../../common/loader';
import reloadWindow from '../../../../../utils/reloadWindow';
import removeProject from '../../../../../services/projects/removeProject';
import changeRedStatus from '../../../../../services/projects/changeRedStatus';
import changeStatus from '../../../../../services/projects/changeStatus';
import { IProject } from '../../../../../hooks/useCreateProject';
import upperCaseFirstLetter from '../../../../../utils/upperCaseFirstLetter';

const TableRow = ({openEditModal,project}: {openEditModal: (project:IProject) => void;project:any}) => {
    const {
        wrapper,
        rowWrapper,
        projectWrapper,
        projectImage,
        statusWrapper,
        investorsWrapper,
        ratingWrapper,
        raisedWrapper,
        tagWrapper,
        typeWrapper,
        actionsWrapper,
        flagsWrapper,
        fundingWrapper,
        projectTitle,
        projectDescription,
        tagCircle,
        validationCell
    } = useStyles({status: project.redStatus, rating: 75})

    const [loading,setLoading] = useState(false)
    const [activeStatus, setActiveStatus] = useState<STATUS_LIST>(getProjectStatus(project.status))

    const updateStatus = async (value: STATUS_LIST) => {
        setLoading(true)
        await changeStatus('projects',project._id,value)
        setActiveStatus(value)
        setLoading(false)
    }

    const deleteProject = useCallback( async () => {
        setLoading(true)
        await removeProject('projects',project._id)
        reloadWindow()
        setLoading(false)
    },[loading])

    const toggleRedStatus = useCallback( async () => {
        setLoading(true)
        await changeRedStatus('projects',project._id)
        reloadWindow()
        setLoading(false)
    },[loading])


    if(loading){
        return <Loader/>
    }
    
    return (
        <div className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <Link to={`/projects/project/${project._id}`} className={projectWrapper}>
                    <img className={projectImage} src={loader(project.logo)} alt="name"/>
                    <div>
                        <div className={projectTitle}>
                            {project.name}<span>{project.fullness ? project.fullness : '0%'}</span>
                        </div>
                        <div className={projectDescription}>
                            {project.niche ? project.niche : '-'}
                        </div>
                    </div>
                </Link>
                <div className={statusWrapper}>
                    <StatusDropdown
                        onChange={updateStatus}
                        activeOption={activeStatus}
                    />
                </div>
                <div className={
                    validationCell + ' ' + project.projectStatus
                }>
                    {upperCaseFirstLetter(project.projectStatus)}
                </div>
                <div className={investorsWrapper}>
                    <InvestorsRow investors={project.investors ? project.investors : []}/>
                </div>
                <div className={raisedWrapper}>
                    {project.totalRaised ? `$${project.totalRaised}` : '-'}
                </div>
                <div className={fundingWrapper}>
                    {project.lastFunding ? parseDate(project.lastFunding) : '-'}
                </div>
                <div className={typeWrapper}>
                    {project.type ? project.type : '-'}
                </div>
                <div className={tagWrapper}>
                    <div className={tagCircle}/>
                    {project.banner ? project.banner : '-'}
                </div>
                <div className={flagsWrapper}>
                    <RedFlags count={Number(project.redFlags)} />
                </div>
                <div className={ratingWrapper}>
                    <Rating rating={project.rating ? Number(project.rating) : 0} />
                </div>
                <div className={actionsWrapper}>
                    <Button
                        type='outlined'         
                        onClick={() => openEditModal(project)}
                    >
                        <EditIcon />
                    </Button>
                    <DotsButtonWithDropdown items={[
                        {title: project.redStatus ? 'Delete red status' : 'Give red status', onClick: toggleRedStatus},
                        {title: 'Delete', onClick: deleteProject}
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default TableRow;