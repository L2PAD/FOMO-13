import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../../../projects_layouts/modals/creating_project/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';

interface Props {
    onClose: () => void;
}

const UpdateTwitterUserModal: FC<Props> = ({onClose}) => {
    return (
        <Modal
            title='Update twitter acc'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    label='Enter link'
                    value=''
                    onChange={(value) => console.log(value)}
                />
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default UpdateTwitterUserModal;
