import React, {FC, useMemo, useState} from 'react';
import Modal from '../../../../common/modal';
import { CheckIcon } from '../../../../../assets';
// import CheckIcon from '../../../../common/Icons/check_icon';
import { UserAvatar } from '../../../../common/modal/styles';
import { UsersRow } from '../../../users_list_layout/modals/give_reward_modal/styles';
// import { UsersRow } from '../../../users_list_layout/modals/update_user_modal/styles';
import Typography from '../../../../common/typography';
import {
    SearchIconStyle,
    SearchInput,
    FundDataWrapper, 
    FundRow, 
    FundsWrapper, 
    HeaderWrapper, 
    ProjectsWrapper, 
    SubmitButton
} from './styles';
import { IProject } from '../../../../hooks/useCreateProject';
import loader from '../../../../services/loader';

interface Props {
    onClose: () => void;
    onSubmit: (projects:Array<string>) => Promise<void>;
    projects:Array<IProject>
    data:any
    modalType?:'projects' | 'persons'
}

const AddProjectsModal: FC<Props> = ({onClose,onSubmit,projects,data,modalType = 'projects'}) => {
    const [selectedProjects,setSelectedProjects] = useState<Array<string>>(projects.map((item:IProject) => item._id || ''))
    const [searchValue, setSearchValue] = useState<string>('')

    const toggleProjects = (id:string) : void => {
        if(selectedProjects.includes(id)){
            setSelectedProjects((prev:Array<string>) => {
                return (
                    prev.filter((itemId:string) => itemId !== id)
                )
            })
        }else{
            setSelectedProjects((prev:Array<string>) => {
                return ([
                    ...prev,
                    id
                ])
            })
        }
    }
   
    const allProjects = useMemo(() => {
        const key = modalType
        
        if(!searchValue) return data[key] || []

        return data[key]?.filter((item:IProject) => item.name.toLowerCase().includes(searchValue.toLowerCase())) || []
    },[data,searchValue])

    return (
        <Modal
            title={`Add ${modalType}`}
            onClose={onClose}
            variant='small-medium'
        >
            <HeaderWrapper>
                <SearchInput
                    value={searchValue}
                    onChange={(e:any) => setSearchValue(e.target.value)}
                    placeholder="Search"
                    type="text"
                    // leftIcon={<SearchIconStyle />}
                />
            </HeaderWrapper>
            <FundsWrapper>
                {allProjects.map((item:IProject) => {
                    const isSelected : boolean = selectedProjects.includes(String(item._id))

                    return <FundRow 
                    background={isSelected ? '#04a58513' : 'white'}
                    onClick={() => toggleProjects(item._id || '')}
                    key={item._id}>
                        <div>
                            <CheckIcon fill={
                                isSelected
                                ?
                                '#04A584'
                                :
                                '#04a5855e'
                            }/>
                        </div>
                        <FundDataWrapper>
                            <UserAvatar
                                src={loader(String(item.logo))}
                                alt={item.name}
                                // variant="default"
                            />
                            <Typography variant='p'>
                                {item.name}
                            </Typography>
                        </FundDataWrapper>
                        <ProjectsWrapper>
                            {/* <UsersRow users={item.investors || []} /> */}
                            <p>Total: <span>{item?.investors?.length || 0} investors</span></p>
                        </ProjectsWrapper>
                    </FundRow>
                })}
            </FundsWrapper>
            <SubmitButton onClick={() => onSubmit(selectedProjects)}>
                Update {selectedProjects.length} {modalType}
            </SubmitButton>
        </Modal>
    );
};

export default AddProjectsModal;