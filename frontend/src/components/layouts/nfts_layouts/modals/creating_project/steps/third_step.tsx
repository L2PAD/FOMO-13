import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import ValueWithLabel from '../../../../../common/components_for_modals/value_with_label';
import {ModalRow} from '../styles';
import { IProject } from '../../../../../hooks/useCreateProject';
import calculateRating from '../../../../../utils/calculateRating';
import calculatePageFullness from '../../../../../utils/calculatePageFullness';

const ThirdStep = ({data,inputsHandler}:{data:IProject,inputsHandler:any}) => {
    return (
        <div>
            <ModalRow>
                <ValueWithLabel
                    label='Rating'
                    value={`${calculateRating(data)}`}
                    type='rating'
                />
            </ModalRow>
            <ModalRow>
                <ValueWithLabel
                    value={calculatePageFullness(data)}
                    label='Page fullness'
                    type='fullness'
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    name={'banner'}
                    label='Text for IDO banner'
                    value={data.banner}
                    onChange={inputsHandler}
                />
            </ModalRow>
        </div>
    );
};

export default ThirdStep;