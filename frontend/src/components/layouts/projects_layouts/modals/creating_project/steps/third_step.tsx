import { useState } from 'react';
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import ValueWithLabel from '../../../../../common/components_for_modals/value_with_label';
import {ModalRow, StatusWrapper} from '../styles';
import { IProject } from '../../../../../hooks/useCreateProject';
import calculateRating from '../../../../../utils/calculateRating';
import calculatePageFullness from '../../../../../utils/calculatePageFullness';
import RadioButton from '../../../../../common/radio_button';
import Checkbox from '../../../../../common/checkbox';

export const getProjectType = (value:string) => {
    switch (value) {
        case 'Crypto':
            return 'project'
        case "NFT's":
            return 'nfts'
        case 'EarlyLand':
            return 'earlyland'
        case 'Compendium':
            return 'compendium'
        default:
            return 'project'
    }
}

const ThirdStep = ({data,inputsHandler}:{data:IProject,inputsHandler:any}) => {
    const [page, setPage] = useState('crypto')

    const statusHandler = (value:string) => {
        setPage(value)
        inputsHandler(getProjectType(value),'projectType')
    }

    return (
        <div>
            <StatusWrapper>
                <p>Page</p>
                <RadioButton label='Crypto' value={page} onChange={statusHandler} />
                <RadioButton label="NFT's" value={page} onChange={statusHandler} />
                <RadioButton label='EarlyLand' value={page} onChange={statusHandler} />
                <RadioButton label='Compendium' value={page} onChange={statusHandler} />
            </StatusWrapper>
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
            <ModalRow>
                <Checkbox
                active={!!data.isIdea}
                onChange={() => inputsHandler(!data.isIdea,'isIdea')}
                labelValue={'Launchpad'}
                />
            </ModalRow>
        </div>
    );
};

export default ThirdStep;