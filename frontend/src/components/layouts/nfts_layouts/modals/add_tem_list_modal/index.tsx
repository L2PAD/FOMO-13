import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import SearchIcon from '../../../../common/Icons/search_icon';
import {SearchInput, SearchWrapper, UserData, UserRow, UsersWrapper} from './styles';
import avatarImage from '../../../../../assets/img/avatar.png';
import CheckIcon from '../../../../common/Icons/check_icon';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';

interface Props {
    onClose: () => void;
    addInvestors: (value: {name: string, id: string, avatar: string}[]) => void;
}

const AddTeamListModal: FC<Props> = ({onClose, addInvestors}) => {
    return (
        <Modal title='Add team' onClose={onClose} variant='small'>
            <SearchWrapper>
                <SearchIcon />
                <SearchInput
                    type="text"
                    placeholder='Search'
                />
            </SearchWrapper>
            <UsersWrapper>
                <UserRow>
                    <CheckIcon />
                    <UserData>
                        <img src={avatarImage} alt=""/>
                        Dr. Laurent El Ghaul
                    </UserData>
                </UserRow>
                <UserRow>
                    <CheckIcon />
                    <UserData>
                        <img src={avatarImage} alt=""/>
                        Dr. Laurent El Ghaul
                    </UserData>
                </UserRow>
                <UserRow>
                    <CheckIcon />
                    <UserData>
                        <img src={avatarImage} alt=""/>
                        Dr. Laurent El Ghaul
                    </UserData>
                </UserRow>
                <UserRow>
                    <CheckIcon />
                    <UserData>
                        <img src={avatarImage} alt=""/>
                        Dr. Laurent El Ghaul
                    </UserData>
                </UserRow>
                <UserRow>
                    <CheckIcon />
                    <UserData>
                        <img src={avatarImage} alt=""/>
                        Dr. Laurent El Ghaul
                    </UserData>
                </UserRow>
                <UserRow>
                    <CheckIcon />
                    <UserData>
                        <img src={avatarImage} alt=""/>
                        Dr. Laurent El Ghaul
                    </UserData>
                </UserRow>
            </UsersWrapper>
            <SubmitButton onClick={() => addInvestors([])} type='fill'>
                Add 5 funds
            </SubmitButton>
        </Modal>
    );
};

export default AddTeamListModal;