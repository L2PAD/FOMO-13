import {FC,useState} from 'react';
import Modal from '../../../../common/modal';
import styled from 'styled-components';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { useDispatch,useSelector } from 'react-redux';
import { IProject } from '../../../../hooks/useCreateProject';
import { updateProjectByKeys } from '../../../../../store/slices/editProjectSlice';
import updateProject from '../../../../services/projects/updateProject';
import usePath from '../../../../hooks/usePath';
import InputWithLabel from '../../../../common/components_for_modals/number-input_with_label';

interface Props {
    onClose: () => void;
}

interface IVolume {
    volume:number
    volumeGrowth:number
}

export const FlexRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 12px;
`

const Volume24HModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const location : string = usePath() || 'projects'
    const project : IProject = useSelector((state:any) => state.editProject.project)
    
    const [values,setValues] = useState<IVolume>({
        volume:project.volume || 0,
        volumeGrowth:project.volumeGrowth || 0
    })

    const inputHandler = (value:number,name:string) : void => {
        setValues({...values,[name]:value})
    }

    const confirmChanges = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            volume:values.volume,
            volumeGrowth:values.volumeGrowth,
        }
        onClose()
        await updateProject(`${location}/${project._id}`,editedProject)
        dispatch(updateProjectByKeys({volume:values.volume, volumeGrowth:values.volumeGrowth}))
    }
    return (
        <Modal title='Volume 24H' onClose={onClose} variant='small'>
            <FlexRow>
                <InputWithLabel
                    type='number'
                    name='volume'
                    label='Volume ($ M)'
                    value={values.volume}
                    onChange={inputHandler}
                />
                <InputWithLabel
                    type='number'
                    name='volumeGrowth'
                    label='% change'
                    value={values.volumeGrowth}
                    onChange={inputHandler}
                />
            </FlexRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default Volume24HModal;