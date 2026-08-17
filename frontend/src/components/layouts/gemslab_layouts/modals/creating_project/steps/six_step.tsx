import { FC, useState } from 'react';
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../styles';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useStyles } from './styles';
import FileInput from '../../../../../common/file_input';
import Button from '../../../../../common/button';
import DeleteIcon from '../../../../../common/Icons/delete_icon';

interface IProps {
    data:IProject
    inputsHandler:any
    newsModalHandler:any
}

const SixStep : FC<IProps> = ({data,inputsHandler,newsModalHandler}) => {
    const {
        inputsRow,
        selectedNews,
        mediaRow,
        mediaItemWrapper,
        mediaItemRemove
    } = useStyles()

    const mediaInputsHandler = (value:string,itemIndex:number) : void => {
        if(!data?.media) return 

        const updatedMedia : Array<string>
        =
        data.media.map((item:string,i:number) => {
            if(i === itemIndex){
                return value 
            }
            return item 
        })
        inputsHandler(updatedMedia,'media')
    }

    const removeMediaItem = (id:number) : void => {
        if(!data?.media) return 

        const updatedMedia : Array<string>
        =
        data.media.filter((item:string,i:number) => i !== id)
        
        inputsHandler(updatedMedia,'media')
    }

    return (
        <>
        <div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='totalRaised'
                    label='Total Raised'
                    placeholder='100,000$'
                    value={data.totalRaised || ''}
                    onChange={inputsHandler}
                    />
                </ModalRow>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='totalIssued'
                    label='Total Issued'
                    placeholder='100,000$'
                    value={String(data.totalIssued) || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <InputWithLabel
                    type={'number'}
                    name='fundingGoal'
                    label='Funding Goal'
                    placeholder='100,000$'
                    value={String(data.fundingGoal) || ''}
                    onChange={inputsHandler}
                   />    
                </ModalRow>     
            </div>
            <div className={inputsRow}>
                <ModalRow>
                    <Button
                    type={'bordered'}
                    onClick={newsModalHandler}
                    >
                        Add recommendations 
                    </Button>
                    <div className={selectedNews}>
                    {data?.recommendations?.length ? `Selected recs: ${data?.recommendations?.length}`  : ''}
                    </div>
                </ModalRow>
            </div>  
            <div className={mediaRow}>
                {
                    data?.media?.map((item:string,index:number) => {
                        return (
                            <div 
                            key={index}
                            className={mediaItemWrapper}>
                                <InputWithLabel
                                value={item}
                                onChange={(value:string) => mediaInputsHandler(value,index)}
                                />     
                                <button
                                onClick={() => removeMediaItem(index)}
                                className={mediaItemRemove}
                                >
                                    <DeleteIcon/>
                                </button>
                            </div>
                        )   
                    })
                }
                <Button
                type={'bordered'}
                onClick={() => inputsHandler(data.media ? ['',...data.media] : [''],'media')}
                >
                    Add media 
                </Button>
            </div>
            <ModalRow>
                <FileInput
                inputLabel={'Token metrics img'}
                data={{image:data.descriptionImage}}
                inputsHandler={(file:any) => inputsHandler(file,'descriptionImage')}
                />
            </ModalRow>
        </div>
        </>
    );
};

export default SixStep;