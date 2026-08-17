import React, {useState} from 'react';
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {LogoImage, LogoWrapper, ModalRow, StatusWrapper} from '../styles';
import RadioButton from '../../../../../common/radio_button';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';

const FirstStep = ({data,inputsHandler}:{data:IProject,inputsHandler:any}) => {
    const [status, setStatus] = useState('Active')
    const {input,inputWrapper,label,logo} = useStyles()

    const statusHandler = (value:string) => {
        setStatus(value)
        inputsHandler(value,'status')
    }

    return (
        <div>
            <ModalRow>
                <InputWithLabel
                    name='name'
                    label='Project name'
                    value={data.name}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <StatusWrapper>
                <p>Status</p>
                <RadioButton label='Active' value={status} onChange={statusHandler} />
                <RadioButton label='Upcoming' value={status} onChange={statusHandler} />
                <RadioButton label='Ended' value={status} onChange={statusHandler} />
                <RadioButton label='New' value={status} onChange={statusHandler} />
            </StatusWrapper>
            <ModalRow>
                <InputWithLabel
                    label='Type'
                    name='niche'
                    value={data.niche}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <LogoWrapper>
                <p>Logo</p>
                <div className={inputWrapper}>
                    {
                        data.logo
                        ?
                        <img 
                        className={logo} 
                        src={URL.createObjectURL(data.logo)} 
                        alt="logo" />
                        :
                        <LogoImage/>
                    }
                    <label className={label} htmlFor="logo-input">+ Add logo</label>
                    <input 
                    onChange={(event) => {
                        if(event.target.files){
                            inputsHandler(event.target.files[0],'logo')
                        }
                    }}
                    className={input} id='logo-input' name='logo' type='file'/>                    
                </div>
            </LogoWrapper>
        </div>
    );
};

export default FirstStep;