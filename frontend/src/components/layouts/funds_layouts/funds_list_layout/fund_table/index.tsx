import { useState, useCallback,useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { setItems } from '../../../../../store/slices/searchSlice';
import TableRow from './table_row';
import UpdatingProjectModal from '../../modals/updating_project';
import Loader from '../../../../common/loader';
import useFetch from '../../../../hooks/useFetch';
import { setUpdatedProject } from '../../../../../store/slices/projectSlice';
import { IProject } from '../../../../hooks/useCreateProject';
import getAccessToken from '../../../../utils/getAccessToken';
import {useStyles} from './styles';


const FundsTable = () => {
    const dispatch = useDispatch()
    const [hideStepsModal, setHideStepsModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [isUpdatingModal, setIsUpdatingModal] = useState(false)
    const {loading,data} = useFetch('admin/fomo-v2/backers/funds?limit=5000',{headers:{'Authorization':`Bearer ${getAccessToken()}`}})
    const projects : Array<IProject> | undefined = useSelector((state:any) => state.search.items)

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

export default FundsTable;

const normalizeBackerItem = (item: any) => ({
    ...item,
    _id: item._id || item.routeId || item.id || item.backerId,
    logo: item.logo || item.avatar,
    investors: item.investors || item.supportedProjectsPreview || [],
    totalRaised: item.totalRaised ?? item.totalInvested,
    redFlags: item.redFlags ?? item.redFlagsList?.length ?? 0,
})
