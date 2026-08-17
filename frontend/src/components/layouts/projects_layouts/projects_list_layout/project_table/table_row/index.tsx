import { useState, useCallback } from 'react';
import { useStyles } from './styles';
import StatusDropdown from '../../../../../common/status_dropdown';
import RedFlags from '../../../../../common/red_flags';
import InvestorsRow from '../../../../../common/investors_row';
import Rating from '../../../../../common/rating';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import { STATUS_LIST } from '../../../../../../static_content/dropdowns_data';
import { Link } from 'react-router-dom';
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

const TableRow = ({ openEditModal, project }: { openEditModal: (project: IProject) => void; project: any }) => {
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
        validationCell,
        projectDuplicate
    } = useStyles({ status: project.redStatus, rating: 75 })

    const [loading, setLoading] = useState(false)
    const [activeStatus, setActiveStatus] = useState<STATUS_LIST>(getProjectStatus(project.status))

    const updateStatus = async (value: STATUS_LIST) => {
        setLoading(true)
        await changeStatus('projects', project._id, value)
        setActiveStatus(value)
        setLoading(false)
    }


    const toggleSponsored = async () => {
        setLoading(true)
        await changeStatus('projects/sponsored', project._id, 'update')
        reloadWindow()
        setLoading(false)
    }

    const toggleSandbox = async () => {
        setLoading(true)
        await changeStatus('projects/sandbox', project._id, 'update')
        reloadWindow()
        setLoading(false)
    }

    const toggleEralash = async () => {
        setLoading(true)
        await changeStatus('projects/eralash', project._id, 'update')
        reloadWindow()
        setLoading(false)
    }

    const toggleFundingFeedSection = async () => {
        setLoading(true)
        await changeStatus('projects/section', project._id,'update')
        reloadWindow()
        setLoading(false)
    }

    const deleteProject = useCallback(async () => {
        setLoading(true)
        await removeProject('projects', project._id)
        reloadWindow()
        setLoading(false)
    }, [loading])

    const toggleRedStatus = useCallback(async () => {
        setLoading(true)
        await changeRedStatus('projects', project._id)
        reloadWindow()
        setLoading(false)
    }, [loading])

    if (loading) {
        return <Loader />
    }

    return (
        <div className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <Link to={`/projects/project/${project._id}`} className={projectWrapper}>
                    <img className={projectImage} src={loader(project.logo)} alt="name" />
                    <div>
                        <div className={projectTitle}>
                            {project.name}<span>

                                {project.fullness ? project.fullness : '0%'}</span>
                        </div>
                        <div className={projectDescription}>
                            {project.niche ? project.niche : '-'}
                        </div>
                    </div>
                    {
                        project.isSponsored
                            ?
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="12" fill="#2082EA" />
                                <path d="M17.3228 11.3158L12.0686 18.9909C11.8039 19.3723 11.1812 19.201 11.1812 18.7418L11.1734 14.3516C11.1734 13.8456 10.7453 13.4408 10.216 13.433L7.07901 13.3941C6.69759 13.3863 6.47186 12.9894 6.68203 12.6858L11.9363 5.0107C12.2009 4.62929 12.8236 4.80054 12.8236 5.2598L12.8314 9.65001C12.8314 10.156 13.2596 10.5607 13.7889 10.5685L16.9258 10.6074C17.2995 10.6074 17.5252 11.0122 17.3228 11.3158Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            :
                            <></>
                    }
                    {
                        project.isDuplicate
                            ?
                            <div className={projectDuplicate}>
                                Duplicate
                            </div>
                            :
                            <></>
                    }
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
                    <InvestorsRow investors={project.investors ? project.investors : []} />
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
                    <div className={tagCircle} />
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
                        { title: project.redStatus ? 'Delete red status' : 'Give red status', onClick: toggleRedStatus },
                        { title: 'Delete', onClick: deleteProject },
                        {
                            title:
                                !project.isSponsored
                                    ?
                                    'Add to sponsored'
                                    :
                                    'Remove from sponsored'
                            , onClick: toggleSponsored
                        },
                        {
                            title:
                                !project.isSandbox
                                    ?
                                    'Add to Sandbox'
                                    :
                                    'Remove from Sandbox'
                            , onClick: toggleSandbox
                        },
                        {
                            title:
                                !project.isEralash
                                    ?
                                    'Add to eralash'
                                    :
                                    'Remove from eralash'
                            , onClick: toggleEralash
                        },
                        {
                            title:
                                !project?.sections?.includes('funding-feed')
                                    ?
                                    'Add to Funding Feed'
                                    :
                                    'Remove from Funding Feed'
                            , onClick: toggleFundingFeedSection
                        },
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default TableRow;
