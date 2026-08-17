import {FC,useState} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { useDispatch,useSelector } from 'react-redux';
import { IProject } from '../../../../hooks/useCreateProject';
import { editProject } from '../../../../../store/slices/editProjectSlice';
import updateProject from '../../../../services/projects/updateProject';
import InputWithLabel from '../../../../common/components_for_modals/number-input_with_label';
import useProjectPath from '../../../../hooks/useProjectPath';

interface Props {
    onClose: () => void;
}

const MarketCapModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const location : string = useProjectPath() || 'projects'
    const project : IProject = useSelector((state:any) => state.editProject.project)
    
    const [value,setValue] = useState<number>(project.marketCap || 0)

    const inputHandler = (value:number,name:string) : void => {
        setValue(value)
    }

    const confirmChanges = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            marketCap:value
        }
        onClose()
        dispatch(editProject({key:'marketCap',value:value}))
    }
    
    return (
        <Modal title='Market cap' onClose={onClose} variant='small'>
            <ModalRow>
                <InputWithLabel 
                name='market'
                type='number'
                value={value} 
                onChange={inputHandler} 
                label='Market Cap ($ M)' />
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default MarketCapModal;