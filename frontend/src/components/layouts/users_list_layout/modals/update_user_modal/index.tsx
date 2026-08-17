import {FC,useState} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow, SubmitButton} from './styles';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import useFetch from '../../../../hooks/useFetch';
import { IUser } from '../../../../types/global_types';
import inputsHandler from '../../../../utils/inputsHandler';
import Loader from '../../../../common/loader';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';
import Checkbox from '../../../../common/checkbox';
import RadioButton from '../../../../common/radio_button';

interface Props {
    onClose: () => void;
    user: IUser
}

const UpdateUserModal: FC<Props> = ({onClose,user}) => {
    const [userData,setUserData] = useState<IUser>({...user})

    const {loading,dataHandler} = useFetch(`user/edit/${user._id}`,
    {method:'PUT',headers:{'Content-Type':'application/json','Authorization': `Bearer ${getAccessToken()}`},body:JSON.stringify({
        email:userData.email,
        username:userData.username,
        wallet:userData.wallet,
        risk:userData.risk,
    })},
    true
    )
    
    const confirmUpdate = async () => {
        await dataHandler()
        onClose()
        reloadWindow()  
    }

    if(loading){
        return <Loader/>
    }
    
    return (
        <Modal
            title='Update user'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    label='Email'
                    name={'email'}
                    value={userData.email}
                    onChange={(value,name) => inputsHandler('email',value,setUserData)}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    label='Wallet address'
                    name={'wallet'}
                    value={userData.wallet}
                    onChange={(value) => inputsHandler('wallet',value,setUserData)}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    label='Username'
                    value={userData.username || ''}
                    onChange={(value) => inputsHandler('username',value,setUserData)}
                />
            </ModalRow>
            <ModalRow>
                <p>
                    Risk
                </p>
                <RadioButton label='Default' value={userData.risk || 'Default'} onChange={(value) => inputsHandler('risk',value,setUserData)} />
                <RadioButton label='Low' value={userData.risk || 'Low'} onChange={(value) => inputsHandler('risk',value,setUserData)} />
                <RadioButton label='Medium' value={userData.risk || 'Medium'} onChange={(value) => inputsHandler('risk',value,setUserData)} />
                <RadioButton label='High' value={userData.risk || 'High'} onChange={(value) => inputsHandler('risk',value,setUserData)} />
            </ModalRow>
            <SubmitButton onClick={confirmUpdate} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default UpdateUserModal;