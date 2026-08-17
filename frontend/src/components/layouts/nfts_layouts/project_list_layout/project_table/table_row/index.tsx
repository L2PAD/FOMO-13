import {useCallback,useState} from 'react';
import {useStyles} from './styles';
import StatusDropdown from '../../../../../common/status_dropdown';
import RedFlags from '../../../../../common/red_flags';
import InvestorsRow from '../../../../../common/investors_row';
import Rating from '../../../../../common/rating';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import avatarImage from '../../../../../../assets/img/avatar.png'
import {STATUS_LIST} from '../../../../../../static_content/dropdowns_data';
import {Link} from 'react-router-dom';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';
import getProjectStatus from '../../../../../utils/getProjectStatus';
import { INft } from '../../../../../types/global_types';
import loader from '../../../../../services/loader';
import { Investor } from '../../../../../hooks/useCreateProject';
import Loader from '../../../../../common/loader';
import reloadWindow from '../../../../../utils/reloadWindow';
import removeProject from '../../../../../services/projects/removeProject';
import changeRedStatus from '../../../../../services/projects/changeRedStatus';
import changeStatus from '../../../../../services/projects/changeStatus';

const TableRow = ({project,openEditModal}:{project:INft,openEditModal:(project:INft) => void}) => {
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
    } = useStyles({status: project.redStatus, rating: 75})

    const [activeStatus, setActiveStatus] = useState<STATUS_LIST>(getProjectStatus(project.status))
    const [loading,setLoading] = useState(false)
    
    const updateStatus = async (value: STATUS_LIST) => {
        setLoading(true)
        await changeStatus('nft',project._id,value)
        setActiveStatus(value)
        setLoading(false)
    }

    const deleteProject = useCallback( async () => {
        setLoading(true)
        await removeProject('nft',project._id)
        reloadWindow()
        setLoading(false)
    },[loading])

    const toggleRedStatus = useCallback( async () => {
        setLoading(true)
        await changeRedStatus('nft',project._id)
        reloadWindow()
        setLoading(false)
    },[loading])


    if(loading){
        return <Loader/>
    }
    
    return (
        <div className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <Link to='nfts/project/123' className={projectWrapper}>
                    {
                        typeof project.logo === 'string'
                        ?
                        <img className={projectImage} src={loader(project.logo)} alt={project.name}/>
                        :
                        <img className={projectImage} src={avatarImage} alt={project.name}/>
                    }
                    <div>
                        <div className={projectTitle}>
                            {project.name}
                            <span>{project.fullness}</span>
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
                <div className={investorsWrapper}>
                    <InvestorsRow investors={project.investors || []}/>
                </div>
                <div className={raisedWrapper}>
                    {project.floorPrice ? project.floorPrice : '-'}
                </div>
                <div className={fundingWrapper}>
                    {project.items?.length ? project.items.length : '-'}
                </div>
                <div className={typeWrapper}>
                    {project.owners?.length ? project.owners.length : '-'}
                </div>
                <div className={flagsWrapper}>
                    <RedFlags count={Number(project.redFlags) || 0} />
                </div>
                <div className={ratingWrapper}>
                    <Rating rating={Number(project.rating) || 0} />
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