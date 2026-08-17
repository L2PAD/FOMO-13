import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {NextStepButton} from '../creating_project/styles';
import {CheckboxWrapper, ModalRow} from './styles';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import Checkbox from '../../../../common/checkbox';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';

interface Props {
    onClose: () => void;
}

const ExchangeSettings: FC<Props> = ({onClose}) => {
    return (
        <Modal title='Exchange settings' onClose={onClose} variant='small'>
            <ModalRow>
                <InputWithLabel
                    label='API key'
                    value=''
                    onChange={(value) => console.log(value)}
                />
            </ModalRow>
            <CheckboxWrapper>
                <p>Exchage platforms</p>
                <div>
                    <Checkbox
                        onChange={() => console.log(1)}
                        active={true}
                        labelValue='Name1'
                    />
                    <Checkbox
                        onChange={() => console.log(1)}
                        active={true}
                        labelValue='Name2'
                    />
                    <Checkbox
                        onChange={() => console.log(1)}
                        active={true}
                        labelValue='Name2'
                    />
                </div>
            </CheckboxWrapper>
            <SubmitButton onClick={onClose} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default ExchangeSettings;