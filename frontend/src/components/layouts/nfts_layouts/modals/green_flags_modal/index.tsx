import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {NextStepButton} from '../creating_project/styles';
import {AddButton, DeleteButton, FlagRow, ModalRow} from './styles';
import CloseIcon from '../../../../common/Icons/close_icon';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';

interface Props {
    onClose: () => void;
}

const GreenFlagsModal: FC<Props> = ({onClose}) => {
    return (
        <Modal title='Green flags' onClose={onClose} variant='small'>
            <ModalRow>
                <AddButton>
                    + Add flag
                </AddButton>
                <FlagRow>
                    <span>#1</span>
                    <input
                        type="text"
                    />
                    <DeleteButton>
                        <CloseIcon />
                    </DeleteButton>
                </FlagRow>
                <FlagRow>
                    <span>#1</span>
                    <input
                        type="text"
                    />
                    <DeleteButton>
                        <CloseIcon />
                    </DeleteButton>
                </FlagRow>
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default GreenFlagsModal;