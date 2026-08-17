import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import {ModalRow} from './styles';
import {LogoImage, LogoWrapper} from '../../../projects_layouts/modals/updating_project/styles';

interface Props {
    onClose: () => void;
}

const MainDataModal: FC<Props> = ({onClose}) => {
    return (
        <Modal
            title='Edit description'
            onClose={onClose}
            variant='small'
        >
            <LogoWrapper>
                <p>Image or video</p>
                <div>
                    <LogoImage />
                    <button>
                        + Add
                    </button>
                </div>
            </LogoWrapper>
            <ModalRow>
                <p>Description</p>
                <textarea />
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default MainDataModal;