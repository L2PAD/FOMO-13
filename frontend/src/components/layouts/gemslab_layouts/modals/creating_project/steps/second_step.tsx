import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {FundingWrapper, InvestorsHeader, ModalRow} from '../styles';
import ModalDatePicker from '../../../../../common/components_for_modals/modal_date_picker';
import UsersWindow from '../../../../../common/components_for_modals/users_window';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';

const SecondStep = ({hideModal,data,inputsHandler}: {hideModal: (name:string) => void;data:IProject,inputsHandler:any}) => {
    
    return (
        <div>
            {/* <ModalRow>
                <InputWithLabel
                type={'number'}
                    name='totalRaised'
                    label='Total raised'
                    value={data.totalRaised}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <FundingWrapper>
                <p>Last funding</p>
                <ModalDatePicker name={'lastFunding'} date={data.lastFunding} onChange={inputsHandler} />
            </FundingWrapper> */}
            <ModalRow>
                <InvestorsHeader>
                    <p>Investors</p>
                    <button onClick={() => hideModal('investors')}>+ Add</button>
                </InvestorsHeader>
                <UsersWindow
                data={data} 
                inputsHandler={inputsHandler} 
                investors={data.investors}
                inputName='investors'
                />
                <InvestorsHeader>
                    <p>Team</p>
                    <button onClick={() => hideModal('team')}>+ Add</button>
                </InvestorsHeader>
                <UsersWindow
                data={data} 
                inputsHandler={inputsHandler} 
                investors={data.team}
                inputName='team'
                />
                <InvestorsHeader>
                    <p>Partners</p>
                    <button onClick={() => hideModal('partners')}>+ Add</button>
                </InvestorsHeader>
                <UsersWindow
                data={data} 
                inputsHandler={inputsHandler} 
                investors={data.partners}
                inputName='partners'
                />
            </ModalRow>
        </div>
    );
};

export default SecondStep;