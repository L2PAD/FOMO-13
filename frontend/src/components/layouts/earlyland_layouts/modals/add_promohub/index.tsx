import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';

interface Props {
    onClose: () => void;
}

const AddPromohubModal: FC<Props> = ({onClose}) => {
    return (
        <Modal title='Add to promohub' onClose={onClose} variant='small'>
            <ModalRow>
                <ModalSelect
                    label='Project'
                    onChange={() => console.log(1)}
                    value='Project name'
                    items={['Project name','Project name','Project name','Project name']}
                />
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default AddPromohubModal;