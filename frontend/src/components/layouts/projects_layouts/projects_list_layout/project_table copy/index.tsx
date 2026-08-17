import { useState, useCallback, useEffect, FC } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { setItems } from '../../../../../store/slices/searchSlice';
import UpdatingProjectModal from '../../modals/updating_project';
import Loader from '../../../../common/loader';
import useFetch from '../../../../hooks/useFetch';
import TableRow from './table_row';
import { setUpdatedProject } from '../../../../../store/slices/projectSlice';
import { IProject } from '../../../../hooks/useCreateProject';
import getUserRole from '../../../../utils/getUserRole';
import getAccessToken from '../../../../utils/getAccessToken';
import {useStyles} from './styles';

interface IProps {
    projects:Array<IProject>
}

const UserProjectTable : FC<IProps> = ({projects}) => {
    const dispatch = useDispatch()
    const [hideStepsModal, setHideStepsModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [isUpdatingModal, setIsUpdatingModal] = useState(false)

    const {
        wrapper,
        headerWrapper,
        projectsCell,
        statusCell,
        investorsCell,
        raisedCell,
        fundingCell,
        typeCell,
        flagsCell,
        creatingModalWrapper,
        validationCell
    } = useStyles(isUpdatingModal)

    const updateProject = useCallback((project:IProject) => {
        dispatch(setUpdatedProject(project))
        setIsUpdatingModal(true)
    },[projects])

    useEffect(() => {
        if(!projects.length) return

        dispatch(setItems(projects.filter((project:IProject) => project.projectType !== 'gemslab')))
    },[projects])

    return (
        <>
            <div className={wrapper}>
                <div className={`${headerWrapper} container`}>
                    <div className={projectsCell}>
                        Projects
                    </div>
                    <div className={statusCell}>
                        Status
                    </div>
                    <div className={validationCell}>
                        Validation
                    </div>
                    <div className={investorsCell}>
                        Investors
                    </div>
                    <div className={raisedCell}>
                        Total Raised
                    </div>
                    <div className={fundingCell}>
                        Last Funding
                    </div>
                    <div className={typeCell}>
                        Type
                    </div>
                    <div className={flagsCell}>
                        Red flags
                    </div>
                </div>
            </div>
            <div>
                {
                    projects?.length
                    ?
                    projects?.map((project:any) => {
                        return (
                            <TableRow key={project._id} project={project} openEditModal={updateProject}/>
                        )
                    })
                    :
                    <></>
                }
            </div>
            <div className={creatingModalWrapper}>
                {
                    isUpdatingModal
                    ?
                    <UpdatingProjectModal
                    isAddInvestorsModal={isAddInvestorsModal}
                    backToUpdatingModal={() => {
                        setHideStepsModal(false)
                        setIsAddInvestorsModal(false)
                    }
                    }
                    onClose={() => {
                        setIsAddInvestorsModal(false)
                        setIsUpdatingModal(false)
                    }
                    }
                    hideModal={() => {
                        setHideStepsModal(false)
                        setIsAddInvestorsModal(true)
                    }}
                    />
                    :
                    <></>
                }

            </div>
        </>
    );
};

export default UserProjectTable;