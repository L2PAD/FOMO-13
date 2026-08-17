import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {InvestorsHeader, NextStepButton} from '../creating_project/styles';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import UsersWindow from '../../../../common/components_for_modals/users_window';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { Investor, IProject } from '../../../../hooks/useCreateProject';

interface Props {
    data:IProject
    label:string
    items:Array<any>
    participantsHandler:(key:string,items:Array<any>) => void
    onClose: () => void;
    hideModal: () => void;
    onConfirm:(items:Array<Investor>) => Promise<void>
}

const TeamListModal: FC<Props> = ({items,label,participantsHandler,onClose, hideModal,data,onConfirm}) => {
    return (
        <Modal title={`${label} modal`} onClose={onClose} variant='small'>
            <ModalRow>
                <InvestorsHeader>
                    <p>Investors</p>
                    <button onClick={hideModal}>+ Add</button>
                </InvestorsHeader>
                <UsersWindow 
                data={data}
                inputName={label.toLowerCase()}
                investors={items}
                inputsHandler={(value:Array<Investor>,key:string) => {
                    console.log(value,key)
                    participantsHandler(key,value)
                }}
                />
            </ModalRow>
            
            <SubmitButton onClick={() => 
                //@ts-ignore
                onConfirm(data[label.toLowerCase()])
            } type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default TeamListModal;