import React, { FC, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from 'react-query'
import { AddButton } from '../../../modals/token_allocation_modal/styles'
import { IProject } from '../../../../../hooks/useCreateProject'
import AddProjectsModal from '../../../../persons_layouts/modals/AddProjectsModal'
import fetchProjects from '../../../../../services/projects/fetchProjects'
import { ProjectCardLink } from '../../../../funds_layouts/funds_layout/styles'
import DefaultCard from '../../../../../common/DefaultCard'
import { 
    ComparisonAddBtn,
    ComparisonItems,
    ComparisonWrapper
 } from './styles'
import { editProject } from '../../../../../../store/slices/editProjectSlice'

interface IProps {
    isEditState:boolean
}

const ComparisonTab : FC<IProps> = ({isEditState}) => {
    const dispatch = useDispatch()
    const {data} = useQuery('all-projects',() => fetchProjects(`all/active`))
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const [isAddProject,setIsAddProject] = useState<boolean>(false)

    const confirmAddProjects = async (projectsIds:Array<string>) : Promise<void> => {
        const selectedProjects: Array<IProject>
        =
        data?.projects?.filter((item:IProject) => {
            return projectsIds.includes(String(item._id))
        }) || []

        dispatch(editProject({key:'comparison',value:selectedProjects}))

        setIsAddProject(false)
    }
    
  return (
    <>
    <ComparisonWrapper>
        <ComparisonItems>
            {
                project?.comparison?.length
                ?
                project.comparison?.map(((item:IProject) => {
                    return (
                        <ProjectCardLink href={`/crypto/project/${item._id}`} key={item._id}>
                            <DefaultCard
                              project={item}
                            />
                        </ProjectCardLink>
                    )
                }))
                :
                <>Comparison list empty...</>
            }
        </ComparisonItems>
        {
            isEditState
            ?
            <ComparisonAddBtn>
                <AddButton 
                onClick={() => setIsAddProject(true)}
                >
                    + Add project
                </AddButton>
            </ComparisonAddBtn>
            :
            <></>
        }
    </ComparisonWrapper>
    {
        isAddProject
        ?
        <AddProjectsModal
        projects={project?.comparison || []}
        data={{projects:data?.projects || []}}
        modalType={'projects'}
        onSubmit={confirmAddProjects}
        onClose={() => setIsAddProject(false)}
        />
        :
        <></>
    }
    </>
  )
}

export default ComparisonTab
