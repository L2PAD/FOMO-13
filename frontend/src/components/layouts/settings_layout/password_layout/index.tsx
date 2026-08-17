import React,{useState} from 'react';
import Button from '../../../common/button';
import {useStyles} from './styles';
import useFetch from '../../../hooks/useFetch';
import inputsHandler from '../../../utils/inputsHandler';
import getAccessToken from '../../../utils/getAccessToken';
import Loader from '../../../common/loader';

interface IPasswords {
    oldPassword:string
    newPassword:string
    confirmPassword:string
}

const PasswordLayout = () => {
    const [passwords,setPasswords] = useState<IPasswords>({oldPassword:'',newPassword:'',confirmPassword:''})
    const {wrapper, inputLabel, input, button} = useStyles()

    const {data,loading,dataHandler} = useFetch(
        'user/new/password',
        {method:'PATCH',headers:{'Content-Type': 'application/json',Authorization:`Bearer ${getAccessToken()}`},body:JSON.stringify(passwords)},
        true
        )

    const confirmChange = async (event:React.SyntheticEvent) => {
        event.preventDefault()
        if(passwords.newPassword === passwords.confirmPassword){
            await dataHandler()
            data?.success
            ?
            alert('Password changed')    
            :
            alert('Auth error')    
        }else{
            alert('Please repeat your new password correctly.')
        }
    }

    if(loading){
        return <Loader/>
    }

    return (
        <form onSubmit={confirmChange} className={wrapper}>
            <div>
                <p className={inputLabel}>Old password</p>
                <input
                type='password'
                onChange={(e) => inputsHandler('oldPassword',e.target.value,setPasswords)}
                className={input} 
                />
            </div>
            <div>
                <p className={inputLabel}>New password</p>
                <input
                type='password' 
                onChange={(e) => inputsHandler('newPassword',e.target.value,setPasswords)}
                className={input} 
                />
            </div>
            <div>
                <p className={inputLabel}>Repeat new password</p>
                <input
                type='password' 
                onChange={(e) => inputsHandler('confirmPassword',e.target.value,setPasswords)}
                className={input} 
                />
            </div>
            <Button
                onClick={() => console.log(1)}
                type='fill'
                className={button}
            >
                Change password
            </Button>
        </form>
    );
};

export default PasswordLayout;