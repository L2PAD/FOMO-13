import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import ValueWithLabel from '../../../../../common/components_for_modals/value_with_label';
import {ModalRow} from '../styles';
import { IProject } from '../../../../../hooks/useCreateProject';
import calculateRating from '../../../../../utils/calculateRating';
import calculatePageFullness from '../../../../../utils/calculatePageFullness';
import { useStyles } from './styles';

const LastStep = ({data,inputsHandler}:{data:IProject,inputsHandler:any}) => {
    const {
        inputsRow
    } = useStyles()

    return (
        <div>
            <div className={inputsRow}>
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
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='blockchain'
                    label='Blockchain Network'
                    placeholder='zkSync'
                    value={data.blockchain || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='platformRaise'
                    label='Platform raise'
                    placeholder='100,000$'
                    value={data.platformRaise || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='totalSupply'
                    label='Total supply'
                    placeholder='100000'
                    value={String(data.totalSupply) || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='hardCap'
                    label='Hard cap'
                    placeholder='10000$'
                    value={data.hardCap || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='valuation'
                    label='Project Valuation'
                    placeholder='10000'
                    value={data.valuation || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='inititialMarketCap'
                    label='Initial Market Cap'
                    placeholder='10000'
                    value={data.inititialMarketCap || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
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

export default LastStep;