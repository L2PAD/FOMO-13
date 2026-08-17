import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {NextStepButton} from '../creating_project/styles';
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

const PriceRangeModal: FC<Props> = ({onClose}) => {
    return (
        <Modal title='Price range' onClose={onClose} variant='small'>
            <FlexRow>
                <InputWithLabel
                    label='Low ($)'
                    value=''
                    onChange={(value) => console.log(value)}
                />
                <InputWithLabel
                    label='Current ($)'
                    value=''
                    onChange={(value) => console.log(value)}
                />
                <InputWithLabel
                    label='High ($)'
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

export default PriceRangeModal;