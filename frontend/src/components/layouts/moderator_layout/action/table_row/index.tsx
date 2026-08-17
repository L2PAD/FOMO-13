import { useState, useCallback } from 'react';
import {useStyles} from './styles';
import StatusDropdown from '../../../../common/status_dropdown';
import RedFlags from '../../../../common/red_flags';
import InvestorsRow from '../../../../common/investors_row';
import Rating from '../../../../common/rating';
import Button from '../../../../common/button';
import EditIcon from '../../../../common/Icons/edit_icon';
import {STATUS_LIST} from '../../../../../static_content/dropdowns_data';
import {Link} from 'react-router-dom';
import DotsButtonWithDropdown from '../../../../common/dots_button_with_dropdown';
import loader from '../../../../services/loader';
import getProjectStatus from '../../../../utils/getProjectStatus';
import parseDate from '../../../../utils/parseDate';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';
import removeProject from '../../../../services/projects/removeProject';
import changeRedStatus from '../../../../services/projects/changeRedStatus';
import changeStatus from '../../../../services/projects/changeStatus';
import { IProject } from '../../../../hooks/useCreateProject';

const TableRow = ({action}: {action:any}) => {
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
    } = useStyles({status: '', rating: 75})

    const [loading,setLoading] = useState(false)
    // const [activeStatus, setActiveStatus] = useState<STATUS_LIST>(getProjectStatus(project.status))

    if(loading){
        return <Loader/>
    }
    
    return (
        <div className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <div className={projectWrapper}>
                    <img className={projectImage} src={loader(action.value.img)} alt="name"/>
                    <div>
                        <div className={projectTitle}>
                            {action.name} 
                        </div>
                        <div className={projectDescription}>
                            {action.type}
                        </div>
                    </div>
                </div>
                <div className={fundingWrapper}>
                    {action.date ? parseDate(action.date,1) : '-'}
                </div>
                <div className={tagWrapper}>
                    {action.moderator[0].email ? action.moderator[0].email : '-'}
                </div>
            </div>
        </div>
    );
};

export default TableRow;