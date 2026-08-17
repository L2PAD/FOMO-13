import React, {useState} from 'react';
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {LogoImage, LogoWrapper, ModalRow, StatusWrapper} from '../styles';
import RadioButton from '../../../../../common/radio_button';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';
import loader from '../../../../../services/loader';

const FirstStep = ({data,inputsHandler}:{data:IProject,inputsHandler:any}) => {
    const [status, setStatus] = useState(data.status)
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
            <ModalRow>
                <InputWithLabel
                    label='Niche'
                    name='niche'
                    value={data.niche}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <LogoWrapper>
                <p>Logo</p>
                <div className={inputWrapper}>
                    {
                        typeof data.logo === 'object'
                        &&
                        <img 
                        className={logo} 
                        src={URL.createObjectURL(data.logo)} 
                        alt="logo" />
                    }
                      {
                          typeof data.logo === 'string'
                          &&
                          <img 
                          className={logo} 
                          src={loader(data.logo)} 
                          alt="logo" />
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


// import React, {useState} from 'react';
// import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
// import {LogoImage, LogoWrapper, ModalRow, StatusWrapper} from '../styles';
// import RadioButton from '../../../../../common/radio_button';

// const FirstStep = () => {
//     const [status, setStatus] = useState('Active')

//     return (
//         <div>
//             <ModalRow>
//                 <InputWithLabel
//                     label='Project name'
//                     value='newuser'
//                     onChange={(value) => console.log(value)}
//                 />
//             </ModalRow>
//             <StatusWrapper>
//                 <p>Status</p>
//                 <RadioButton label='Active' value={status} onChange={(value) => setStatus(value)} />
//                 <RadioButton label='Upcoming' value={status} onChange={(value) => setStatus(value)} />
//                 <RadioButton label='Ended' value={status} onChange={(value) => setStatus(value)} />
//                 <RadioButton label='New' value={status} onChange={(value) => setStatus(value)} />
//             </StatusWrapper>
//             <ModalRow>
//                 <InputWithLabel
//                     label='Niche'
//                     value=''
//                     onChange={(value) => console.log(value)}
//                 />
//             </ModalRow>
//             <LogoWrapper>
//                 <p>Logo</p>
//                 <div>
//                     <LogoImage />
//                     <button>
//                         + Add logo
//                     </button>
//                 </div>
//             </LogoWrapper>
//         </div>
//     );
// };

// export default FirstStep;