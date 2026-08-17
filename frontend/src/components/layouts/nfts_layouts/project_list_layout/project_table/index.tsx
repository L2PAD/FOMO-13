import { useState, useCallback, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { setItems } from '../../../../../store/slices/searchSlice';
import TableRow from './table_row';
import {useStyles} from './styles';
import useFetch from '../../../../hooks/useFetch';
import Loader from '../../../../common/loader';
import { INft } from '../../../../types/global_types';
import { setUpdatedProject } from '../../../../../store/slices/projectSlice';
import UpdatingProjectModal from '../../../nfts_layouts/modals/updating_project';

const ProjectTable = () => {
    const dispatch = useDispatch()
    const [hideStepsModal, setHideStepsModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [isUpdatingModal, setIsUpdatingModal] = useState(false)
    const {data,loading} = useFetch('nft')
    const nfts : Array<INft> | undefined = useSelector((state:any) => state.search.items)

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
    } = useStyles()

    const updateProject = useCallback((project:INft) => {
        dispatch(setUpdatedProject(project))
        setIsUpdatingModal(true)
    },[data])

    useEffect(() => {
        if(!data?.data) return

        dispatch(setItems(data.data))
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
                        Floor price
                    </div>
                    <div className={fundingCell}>
                        Items
                    </div>
                    <div className={typeCell}>
                        Owners
                    </div>
                    <div className={flagsCell}>
                        Red flags
                    </div>
                </div>
            </div>
            <div>
                {
                    nfts?.length
                    ?
                    nfts.map((project:INft) => {
                        return <TableRow openEditModal={updateProject} key={project._id} project={project}/>
                    })
                    :
                    <></>
                }
            </div>
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
        </>
    );
};

export default ProjectTable;