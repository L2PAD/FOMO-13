import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import styled from 'styled-components';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';

interface Props {
    onClose: () => void;
}

export const FlexRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 12px;
`

const Volume24HModal: FC<Props> = ({onClose}) => {
    return (
        <Modal title='Volume 24H' onClose={onClose} variant='small'>
            <FlexRow>
                <InputWithLabel
                    label='Volume ($ M)'
                    value=''
                    onChange={(value) => console.log(value)}
                />
                <InputWithLabel
                    label='% change'
                    value=''
                    onChange={(value) => console.log(value)}
                />
            </FlexRow>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default Volume24HModal;