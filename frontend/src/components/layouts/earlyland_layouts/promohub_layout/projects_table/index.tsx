import { useState, useCallback, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { setItems } from '../../../../../store/slices/searchSlice';
import TableRow from './table_row';
import {useStyles} from './styles';
import useFetch from '../../../../hooks/useFetch';
import Loader from '../../../../common/loader';
import { IProject } from '../../../../hooks/useCreateProject';

const ProjectTable = () => {
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
    const dispatch = useDispatch()
    const {data,loading} = useFetch('earlyland/promohub')
    const projects : Array<IProject> | undefined = useSelector((state:any) => state.search.items)

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
                        Max participants
                    </div>
                    <div className={raisedCell}>
                        Activity Type
                    </div>
                    <div className={fundingCell}>
                        Reward
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
                    projects.map((project:IProject) => {
                        return <TableRow key={project._id} project={project}/>
                    })
                    :
                    <></>
                }
            </div>
        </>
    );
};

export default ProjectTable;