import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import {ModalRow} from './styles';
import {LogoImage, LogoWrapper} from '../../../projects_layouts/modals/updating_project/styles';
import ModalSelect from '../../../../common/components_for_modals/modal_select';

interface Props {
    onClose: () => void;
}

const UpdateNftModal: FC<Props> = ({onClose}) => {
    return (
        <Modal
            title='NFT editing'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    label='Title'
                    value=''
                    onChange={(value) => console.log(value)}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    label='Price'
                    value=''
                    onChange={(value) => console.log(value)}
                />
            </ModalRow>
            <ModalRow>
                <ModalSelect
                    label='Choose type'
                    onChange={() => console.log(1)}
                    value='Rare'
                    items={['Rare','Rare','Rare','Rare']}
                />
            </ModalRow>
            <ModalRow>
                <p>Description</p>
                <textarea />
            </ModalRow>
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
                <ModalSelect
                    label='Author'
                    onChange={() => console.log(1)}
                    value='Rare'
                    items={['Rare','Rare','Rare','Rare']}
                />
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default UpdateNftModal;