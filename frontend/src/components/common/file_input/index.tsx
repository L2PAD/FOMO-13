import { FC,useId } from 'react';
import { useStyles } from './styles';
import { LogoImage } from '../../layouts/projects_layouts/modals/creating_project/styles';
import loader from '../../services/loader';

interface Props {
    data:any
    inputsHandler:any
    inputLabel?:string
}

const FileInput: FC<Props> = ({data,inputsHandler,inputLabel}) => {
    const id = useId()
    const {input,inputWrapper,label,img,wrapper,p} = useStyles()

    return (
        <div className={wrapper}>
            <p className={p}>{inputLabel || 'Image'}</p>
                <div className={inputWrapper}>
                    {
                        data.image
                        ?
                        
                            typeof data.image === 'string'
                            ?
                            <img 
                            className={img}
                            src={loader(data.image)}/> 
                            :
                            <img 
                            className={img}
                            src={URL.createObjectURL(data.image)} 
                            alt="logo" 
                            />
                        :
                        <LogoImage/>
                    }
                 <label className={label} htmlFor={id}>+ Add image</label>
                    <input
                    className={input} 
                    id={id} 
                    name='logo' 
                    type='file'
                    onChange={(event) => {
                        if(event.target.files){
                            inputsHandler(event.target.files[0],'image')
                        }
                    }}
                    />
                </div>
        </div>
    )
}

export default FileInput;