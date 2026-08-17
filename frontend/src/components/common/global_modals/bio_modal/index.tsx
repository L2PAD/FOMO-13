import {FC,useState} from 'react';
import { useSelector , useDispatch} from 'react-redux';
import { editProject } from '../../../../store/slices/editProjectSlice';
import {ModalRow, SubmitButton} from './styles';
import usePath from '../../../hooks/usePath';
import updateProject from '../../../services/projects/updateProject';
import { IProject } from '../../../hooks/useCreateProject';
import Modal from '../../modal';

interface Props {
    data:any
    onClose: () => void;
    onChange: (data:any) => void
}

const BioModal: FC<Props> = ({onClose,onChange,data}) => {
    const location = usePath()
    const [text,setText] = useState<string>(data?.bio || '')

    const confirmChanges = async () : Promise<void> => {
        const editedData : any = {
            ...data,
            bio:text
        }
        onClose()
        await updateProject(`${location}/${data._id}`,editedData)
        onChange(editedData)
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

export default BioModal;