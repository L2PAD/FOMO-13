import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {FundingWrapper, InvestorsHeader, ModalRow} from '../styles';
import ModalDatePicker from '../../../../../common/components_for_modals/modal_date_picker';
import UsersWindow from '../../../../../common/components_for_modals/users_window';
import Checkbox from '../../../../../common/checkbox';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';

const FourthStep = ({data,inputsHandler}: {data:IProject,inputsHandler:any}) => {
    const {
        inputsRow,
        datesRow,
        checkBoxRow
    } = useStyles()

    return (
        <div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='greenZone'
                    label='Users in green zone'
                    placeholder='10'
                    value={String(data.greenZone) || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='yellowZone'
                    label='Users in yellow zone'
                    placeholder='100'
                    value={String(data.yellowZone) || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='totalMaxInvest'
                    label='Total max.invest'
                    placeholder='100000'
                    value={String(data.totalMaxInvest) || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='nftStakeNeed'
                    label='Nft stake need'
                    placeholder='3'
                    value={String(data.nftStakeNeed) || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='minInvest'
                    label='User min.investment'
                    placeholder='100'
                    value={String(data.minInvest) || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='maxInvest'
                    label='User max.investment'
                    placeholder='2500'
                    value={String(data.maxInvest) || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='comission'
                    label='Comission %'
                    placeholder='5'
                    value={String(data.comission) || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='mediaComission'
                    label='Media comission %'
                    placeholder='3'
                    value={String(data.mediaComission) || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={checkBoxRow}>
                    <p>
                        ETH/USDC
                    </p>
                    <Checkbox
                    labelValue='ETH'
                    active={Boolean(data.isETH)}
                    onChange={() => inputsHandler(!data.isETH,'isETH')}
                    />
  
            </div>
        </div>
    );
};

export default FourthStep;