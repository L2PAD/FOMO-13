import {FC,useState} from 'react';
import { useSelector , useDispatch} from 'react-redux';
import { editProject } from '../../../../store/slices/editProjectSlice';
import {ModalRow, SubmitButton} from './styles';
import usePath from '../../../hooks/usePath';
import updateProject from '../../../services/projects/updateProject';
import { IProject } from '../../../hooks/useCreateProject';
import Modal from '../../modal';
import useProjectPath from '../../../hooks/useProjectPath';

interface Props {
    onClose: () => void;
}

const DescriptionModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const location : string = useProjectPath() || 'projects'
    const project : IProject = useSelector((state:any) => state.editProject.project)
    
    const [text,setText] = useState<string>(project.bio || '')

    const confirmChanges = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            bio:text
        }
        onClose()
        dispatch(editProject({key:'bio',value:text}))
    }

    return (
        <Modal
            title='BIO'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <p>BIO</p>
                <textarea 
                onChange={(e) => setText(e.target.value)}
                value={text}
                />
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default DescriptionModal;