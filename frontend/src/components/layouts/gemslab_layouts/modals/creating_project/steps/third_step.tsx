import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {FundingWrapper, InvestorsHeader, ModalRow} from '../styles';
import ModalDatePicker from '../../../../../common/components_for_modals/modal_date_picker';
import UsersWindow from '../../../../../common/components_for_modals/users_window';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';

const ThirdStep = ({data,inputsHandler}: {data:IProject,inputsHandler:any}) => {
    const {
        inputsRow,
        datesRow,
    } = useStyles()
    
    return (
        <div>
            <div className={datesRow}>
                <FundingWrapper>
                    <p>Staking NFT date start</p>
                    <ModalDatePicker name={'stakingDateStart'} date={data?.stakingDateStart || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
                <FundingWrapper>
                    <p>Staking NFT date end</p>
                    <ModalDatePicker name={'stakingDateEnd'} date={data?.stakingDateEnd || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='stakingTimeStart'
                    label='Staking NFT time start'
                    placeholder='24:00'
                    value={data.stakingTimeStart || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='stakingTimeEnd'
                    label='Staking NFT time end'
                    placeholder='24:00'
                    value={data.stakingTimeEnd || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={datesRow}>
                <FundingWrapper>
                    <p>Purchase date start</p>
                    <ModalDatePicker name={'purchaseDateStart'} date={data?.purchaseDateStart || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
                <FundingWrapper>
                    <p>Purchase date end</p>
                    <ModalDatePicker name={'purchaseDateEnd'} date={data?.purchaseDateEnd || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='purchaseTimeStart'
                    label='Purchase time start'
                    placeholder='24:00'
                    value={data.purchaseTimeStart || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='purchaseTimeEnd'
                    label='Purchase time end'
                    placeholder='24:00'
                    value={data.purchaseTimeEnd || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={datesRow}>
                <FundingWrapper>
                    <p>Green zone date start</p>
                    <ModalDatePicker name={'greenDate'} date={data?.greenDate || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
                <FundingWrapper>
                    <p>Yellow zone date start</p>
                    <ModalDatePicker name={'yellowDate'} date={data?.yellowDate || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='greenTimeStart'
                    label='Green zone time start'
                    placeholder='24:00'
                    value={data.greenTimeStart || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='yellowTimeStart'
                    label='Yellow zone time start'
                    placeholder='24:00'
                    value={data.yellowTimeStart || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={datesRow}>
                <FundingWrapper>
                    <p>Distribution start</p>
                    <ModalDatePicker name={'distributionStart'} date={data?.distributionStart || new Date()} onChange={inputsHandler} />
                </FundingWrapper>
                <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'string'}
                    name='distributionTimeStart'
                    label='Distribution time start'
                    placeholder='24:00'
                    value={data.distributionTimeStart || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
                </div>
            </div>
        </div>
    );
};

export default ThirdStep;