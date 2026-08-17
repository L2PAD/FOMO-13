import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';

interface Props {
    onClose: () => void;
}

const MarketCapModal: FC<Props> = ({onClose}) => {
    return (
        <Modal title='Market cap' onClose={onClose} variant='small'>
            <ModalRow>
                <InputWithLabel onChange={() => console.log(1)} value='' label='Market Cap ($ M)' />
            </ModalRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default MarketCapModal;