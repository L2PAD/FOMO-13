import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../users_list_layout/modals/update_user_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';

interface Props {
    onClose: () => void;
}

const StrongModal: FC<Props> = ({onClose}) => {
    return (
        <Modal
            title='Strong hold offer round'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <p>Date</p>
                <ModalDatePicker date={new Date()} onChange={() => console.log(1)} />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    label='Time'
                    value='23:45'
                    onChange={(value) => console.log(value)}
                />
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default StrongModal;