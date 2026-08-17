import {FC,useState} from 'react';
import { useSelector , useDispatch} from 'react-redux';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { editProject } from '../../../../../store/slices/editProjectSlice';
import { IProject } from '../../../../hooks/useCreateProject';
import updateProject from '../../../../services/projects/updateProject';
import usePath from '../../../../hooks/usePath';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import Modal from '../../../../common/modal';

interface Props {
    onClose: () => void;
}

const TypeModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const location : string = usePath() || 'projects'
    const project : IProject = useSelector((state:any) => state.editProject.project)
    
    const [type,setType] = useState<string>(project.type || '')

    const inputHandler = (value:string,name:string) : void => {
        setType(value)
    }

    const confirmChanges = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            type:type
        }
        onClose()
        await updateProject(`${location}/${project._id}`,editedProject)
        dispatch(editProject({key:'type',value:type}))
    }

    return (
        <Modal title='Type' onClose={onClose} variant='small'>
            <ModalRow>
                <ModalSelect
                    label='Choose type'
                    onChange={inputHandler}
                    value={type}
                    items={['Type1','Type2','Type3','Type4']}
                />
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default TypeModal;