import { FC, useState, useCallback } from 'react';
import Modal from '../../../../common/modal';
import {NextStepButton} from '../creating_project/styles';
import {AddButton, DeleteButton, FlagRow, ModalRow} from './styles';
import CloseIcon from '../../../../common/Icons/close_icon';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { useDispatch,useSelector } from 'react-redux';
import { IProject } from '../../../../hooks/useCreateProject';
import { editProject } from '../../../../../store/slices/editProjectSlice';
import { IFlag } from '../../../../types/global_types';
import updateProject from '../../../../services/projects/updateProject';
import usePath from '../../../../hooks/usePath';

interface Props {
    onClose: () => void;
    onChange: (data:any) => void;
    data:any
    flagsList: Array<IFlag> | undefined
}

const RedFlagsModal: FC<Props> = ({onClose,onChange,data,flagsList}) => {
    const [flags,setFlags] = useState<Array<IFlag>>(flagsList || [])
    const location = usePath() || 'projects'
    
    const addFlag = () : void => {
        setFlags((prev) => [...prev,{text:'',link:'',type:true}])
    }

    const removeFlag = (flag:IFlag,index:number) : void => {
        setFlags((prev) => prev.filter((fl:IFlag,i) => {
            return index !== i
        }))
    }

    const confirmChanges = async () : Promise<void> => {
        const editedData : any = {
            ...data,
            redFlagsList:flags.filter((item:IFlag) => item.text.length > 0)
        }

        onClose()

        onChange(editedData)
    }

    const inputsHanlder = useCallback((text:string,index:number) => {
        setFlags((prev) => {
            return prev.map((flag:IFlag,i:number) => {
                if(i === index){
                    return {...flag,text}
                }

                return flag
            })
        })
    },[flags])
    
    return (
        <Modal title='Red flags' onClose={onClose} variant={'medium'}>
            <ModalRow>
                <AddButton onClick={addFlag}>
                    + Add flag
                </AddButton>
                {
                    flags.length
                    ?
                    flags.map((flag : IFlag,index) => {
                        return ( 
                            <FlagRow key={index}>
                                <span>#{index + 1}</span>
                                <input
                                value={flag.text}
                                onChange={(e) => inputsHanlder(e.target.value,index)}
                                type="text"
                                />
                                <DeleteButton onClick={() => removeFlag(flag,index)}>
                                    <CloseIcon />
                                </DeleteButton>
                            </FlagRow>
                        )
                    })
                    :
                    <></>
                }
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default RedFlagsModal;