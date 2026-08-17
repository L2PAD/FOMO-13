import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {FundingWrapper, InvestorsHeader, ModalRow} from '../styles';
import ModalDatePicker from '../../../../../common/components_for_modals/modal_date_picker';
import UsersWindow from '../../../../../common/components_for_modals/users_window';
import { IProject, Investor } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';


const SecondStep = ({hideModal,data,inputsHandler}: {hideModal: () => void;data:IProject,inputsHandler:any}) => {
    
    return (
        <div>
            <ModalRow>
                <InputWithLabel
                    name='totalRaised'
                    label='Total raised'
                    value={data.totalRaised}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <FundingWrapper>
                <p>Last funding</p>
                <ModalDatePicker name={'lastFunding'} date={new Date(data.lastFunding)} onChange={inputsHandler} />
            </FundingWrapper>
            <ModalRow>
                <InvestorsHeader>
                    <p>Investors</p>
                    <button onClick={hideModal}>+ Add</button>
                </InvestorsHeader>
                <UsersWindow 
                data={data} 
                inputsHandler={inputsHandler} 
                investors={data.investors}/>
            </ModalRow>
        </div>
    );
};

export default SecondStep;