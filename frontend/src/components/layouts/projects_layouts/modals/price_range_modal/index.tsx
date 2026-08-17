import {useState,FC} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InputWithLabel from '../../../../common/components_for_modals/number-input_with_label';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import Modal from '../../../../common/modal';
import updateProject from '../../../../services/projects/updateProject';
import usePath from '../../../../hooks/usePath';
import { IProject } from '../../../../hooks/useCreateProject';
import { updateProjectByKeys } from '../../../../../store/slices/editProjectSlice';
import styled from 'styled-components';
import useProjectPath from '../../../../hooks/useProjectPath';


interface IPrice {
    lowPrice:number
    highPrice:number 
    price:number
}

interface Props {
    onClose: () => void;
}

export const FlexRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 12px;
`

const PriceRangeModal: FC<Props> = ({onClose}) => {
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const dispatch = useDispatch()
    const location : string = useProjectPath() || 'projects'

    const [priceRange,setPriceRange] = useState<IPrice>({
        lowPrice:project.lowPrice || 0,
        highPrice:project.highPrice || 0,
        price:project.price || 0
    })

    const inputHandler = (value:number,name:string) : void => {
        setPriceRange({...priceRange,[name]:value})
    }

    const confirmEditProject = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            lowPrice:priceRange.lowPrice,
            highPrice:priceRange.highPrice,
            price:priceRange.price
        }
        onClose()
        dispatch(updateProjectByKeys({
            lowPrice:priceRange.lowPrice,
            highPrice:priceRange.highPrice,
            price:priceRange.price
        }))
    }
    

    return (
        <Modal title='Price range' onClose={onClose} variant='small'>
            <FlexRow>
                <InputWithLabel
                    label='Low ($)'
                    type='number'
                    name='lowPrice'
                    value={priceRange.lowPrice || 0}
                    onChange={inputHandler}
                />
                <InputWithLabel
                    label='Current ($)'
                    type='number'
                    name='price'
                    value={priceRange.price || 0}
                    onChange={inputHandler}
                />
                <InputWithLabel
                    label='High ($)'
                    name='highPrice'
                    value={priceRange.highPrice || 0}
                    onChange={inputHandler}
                />
            </FlexRow>
            <SubmitButton onClick={confirmEditProject} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default PriceRangeModal;