import React, {FC, useState} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow, SubmitButton} from './styles';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import useFetch from '../../../../hooks/useFetch';
import Loader from '../../../../common/loader';
import inputsHandler from '../../../../utils/inputsHandler';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';

interface ICreateUser {
    email:string 
    wallet:string
    password:string
}

interface Props {
    onClose: () => void;
}

const CreateUserModal: FC<Props> = ({onClose}) => {
    const [data,setData] = useState<ICreateUser>({email:'',wallet:'',password:''})

    const {loading,dataHandler} = useFetch('user/create',
    {
    method:'POST',
    body:JSON.stringify(data),
    headers:{'Content-Type':'application/json','Authorization': `Bearer ${getAccessToken()}`}
    },
    true)

    const confirmCreateUser = async () => {
        await dataHandler()
        onClose()
        reloadWindow()
    }

    if(loading){
        return <Loader/>
    }

    return (
        <Modal
            title='Create user'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    label='Email'
                    name='email'
                    value={data?.email}
                    onChange={(value) => inputsHandler('email',value,setData)}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    label='Wallet address'
                    value={data.wallet}
                    onChange={(value) => inputsHandler('wallet',value,setData)}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    type='password'
                    label='Password'
                    value={data.password}
                    onChange={(value) => inputsHandler('password',value,setData)}
                />
            </ModalRow>
            <SubmitButton onClick={confirmCreateUser} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default CreateUserModal;