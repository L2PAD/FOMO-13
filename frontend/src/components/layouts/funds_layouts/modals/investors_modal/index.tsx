import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {InvestorsHeader, NextStepButton} from '../creating_project/styles';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import UsersWindow from '../../../../common/components_for_modals/users_window';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { IProject, Investor } from '../../../../hooks/useCreateProject';

interface Props {
    data?:IProject
    investors?: Array<Investor>
    inputsHandler?: (value:any,inputName:string) => void
    onClose: () => void;
    hideModal: () => void;
}

const InvestorsModal: FC<Props> = ({onClose, hideModal,data,investors,inputsHandler}) => {
    return (
        <Modal title='Investors modal' onClose={onClose} variant='small'>
            <ModalRow>
                <InvestorsHeader>
                    <p>Investors</p>
                    <button onClick={hideModal}>+ Add</button>
                </InvestorsHeader>
                <UsersWindow 
                inputsHandler={inputsHandler}
                data={data}
                investors={investors}/>
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default InvestorsModal;