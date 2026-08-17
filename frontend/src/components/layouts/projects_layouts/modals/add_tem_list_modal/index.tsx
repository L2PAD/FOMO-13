import React, {FC, useCallback, useState} from 'react';
import { useQuery } from 'react-query';
import fetchParticipants from '../../../../services/participants/fetchParticipants';
import Modal from '../../../../common/modal';
import SearchIcon from '../../../../common/Icons/search_icon';
import {SearchInput, SearchWrapper, UserData, UserRow, UsersWrapper} from './styles';
import avatarImage from '../../../../../assets/img/avatar.png';
import CheckIcon from '../../../../common/Icons/check_icon';
import {NextStepButton} from '../creating_project/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { Investor } from '../../../../hooks/useCreateProject';
import UnchekIcon from '../../../../common/Icons/uncheck_icon';
import loader from '../../../../services/loader';

interface Props {
    label:string
    onClose: () => void;
    participantsHandler:(key:string,items:Array<any>) => void
}

const AddTeamListModal: FC<Props> = ({onClose,label,participantsHandler}) => {
    const [selectedParticipants,setSelectedParticipants] = useState<Array<Investor>>([])
    const {data} = useQuery('persons',fetchParticipants)

    const toggleInvestor = useCallback((investor:Investor) => {
        if(selectedParticipants.find((inv) => inv._id === investor._id)){
            return setSelectedParticipants((prev) => prev.filter((inv) => inv._id !== investor._id))
        }
        setSelectedParticipants((prev) => {
            return [...prev,{...investor,selected:!investor.selected}]
        })
    },[selectedParticipants])

    const confirmParticipants = () => {
        participantsHandler(label,selectedParticipants)
        onClose()
    }
    
    return (
        <Modal title={`Add ${label.toLowerCase()}`} onClose={onClose} variant='small'>
            <SearchWrapper>
                <SearchIcon />
                <SearchInput
                    type="text"
                    placeholder='Search'
                />
            </SearchWrapper>
            <UsersWrapper>
            {
                    data?.data?.length
                    ?
                    data.data.map((investor:Investor) => {
                        return (
                            <UserRow onClick={() => toggleInvestor(investor)} key={investor._id}>
                                  {
                                        selectedParticipants.find((inv) => inv._id === investor._id)
                                        ?
                                        <CheckIcon />
                                        :
                                        <UnchekIcon/>
                                    }
                                <UserData>
                                    <img src={loader(investor.logo) || avatarImage} alt={investor.name}/>
                                    {investor.name}
                                </UserData>
                            </UserRow>
                        )
                    })
                    :
                    <></>
                }
            </UsersWrapper>
            <SubmitButton onClick={confirmParticipants} type='fill'>
                Add {selectedParticipants.length} {label}
            </SubmitButton>
        </Modal>
    );
};

export default AddTeamListModal;