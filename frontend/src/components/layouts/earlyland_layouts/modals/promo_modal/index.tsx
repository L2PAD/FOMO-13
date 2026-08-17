import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import {SubmitButton} from '../../../users_list_layout/modals/update_user_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import {LogoImage, LogoWrapper} from '../../../projects_layouts/modals/updating_project/styles';

interface Props {
    onClose: () => void;
}

const PromoModal: FC<Props> = ({onClose}) => {
    return (
        <Modal
            title='Edit promo'
            onClose={onClose}
            variant='small'
        >
            <LogoWrapper>
                <p>Image</p>
                <div>
                    <LogoImage />
                    <button>
                        + Add image
                    </button>
                </div>
            </LogoWrapper>
            <ModalRow>
                <InputWithLabel
                    label='Title'
                    value=''
                    onChange={(value) => console.log(value)}
                />
            </ModalRow>
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
            <ModalRow>
                <ModalSelect
                    label='Choose type'
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

export default PromoModal;