import React, { FC, useState } from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import { ModalRow } from '../../../projects_layouts/modals/creating_project/styles';
import { SubmitButton } from '../../../../common/global_modals/description_modal/styles';
import reloadWindow from '../../../../utils/reloadWindow';
import addKeywords from '../../../../services/news/addKeywords';

interface Props {
    onClose: () => void;
}

const AddTwitterKeywordsModal: FC<Props> = ({ onClose }) => {
    const [keywords, setKeywords] = useState<string>('')

    const confrimAddAcc = async (): Promise<void> => {
        onClose()
        await addKeywords(keywords)
        reloadWindow()
    }

    return (
        <Modal
            title='Add twitter keywords'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    value={keywords}
                    placeholder='crypto,trending,news'
                    label='Keywords'
                    onChange={(value) => setKeywords(value)}
                />
            </ModalRow>
            <SubmitButton onClick={confrimAddAcc} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default AddTwitterKeywordsModal;
