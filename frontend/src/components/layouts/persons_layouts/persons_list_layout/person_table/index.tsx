import { useState, useCallback,useEffect } from 'react';
import { useSelector,useDispatch } from 'react-redux';
import { setItems } from '../../../../../store/slices/searchSlice';
import getUserRole from '../../../../utils/getUserRole';
import TableRow from './table_row';
import AddInvestorsModal from '../../modals/add_investors_modal';
import UpdatingProjectModal from '../../modals/updating_project';
import Loader from '../../../../common/loader';
import useFetch from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';
import { IFetchData } from '../../../../services/types'
import { setUpdatedProject } from '../../../../../store/slices/projectSlice';
import { IProject } from '../../../../hooks/useCreateProject';
import {useStyles} from './styles';


const PersonsTable = () => {
    const dispatch = useDispatch()
    const [hideStepsModal, setHideStepsModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [isUpdatingModal, setIsUpdatingModal] = useState(false)
    const {loading,data} = useFetch(`admin/fomo-v2/backers/persons?limit=5000`,{headers:{'Authorization':`Bearer ${getAccessToken()}`}})
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
    } = useStyles(isUpdatingModal)
    const projects : Array<IProject> | undefined = useSelector((state:any) => state.search.items)

    const updateProject = useCallback((project:IProject) => {
        dispatch(setUpdatedProject(project))
        setIsUpdatingModal(true)
    },[data])
    
    useEffect(() => {
        if(!data?.data?.items) return

        dispatch(setItems(data.data.items.map(normalizeBackerItem)))
    },[data])

    if(loading){
        return <Loader/>
    }   

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
                    <div className={flagsCell}>
                        Red flags
                    </div>
                </div>
            </div>
            <div>
                {
                    projects?.length
                    ?
                    projects.map((project:any) => {
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

export default PersonsTable;

const normalizeBackerItem = (item: any) => ({
    ...item,
    _id: item._id || item.routeId || item.id || item.backerId,
    logo: item.logo || item.avatar,
    redFlags: item.redFlags ?? item.redFlagsList?.length ?? 0,
})
