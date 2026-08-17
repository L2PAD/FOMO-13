import {useState,FC, useCallback} from 'react';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { useDispatch,useSelector } from 'react-redux';
import { IProject } from '../../../../hooks/useCreateProject';
import { updateProjectByKeys,editProject } from '../../../../../store/slices/editProjectSlice';
import updateProject from '../../../../services/projects/updateProject';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import useProjectPath from '../../../../hooks/useProjectPath';
import { DateInputWrapper } from '../../../gemslab_layouts/banner_layouts/modals/create_banner/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import { IRoundItem } from '../../../../types/global_types';
import { FundingWrapper } from '../updating_project/styles';
import {AddButton, FlagRow, HeaderRow, ModalRow, Total} from './styles';

interface Props {
    onClose: () => void;
}

const AddRoundModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const location : string = useProjectPath() || 'projects'

    const [data,setData] = useState<IRoundItem>({
        date:new Date(),
        price:0,
        raised:0,
        preValuation:0
    })

    const inputsHandler = (value:any,name?:string) : void => {
        if(!name || isNaN(Number(value))) return 

        setData({...data,[name]:Number(value)})
    }
 
    const confirmChanges = async () : Promise<void> => {
        const updatedFundraising : Array<IRoundItem> 
        = 
        project?.fundraising?.length
        ?
        [
            ...project.fundraising,
            data,
        ]
        :
        [data]
        
        dispatch(editProject({key:'fundraising',value:updatedFundraising}))
        setData({
            date:new Date(),
            price:0,
            raised:0,
            preValuation:0
        })

        onClose()
    }
    
    return (
        <Modal title='Funding round' onClose={onClose} variant='small'>
            <ModalRow>
                <InputWithLabel
                    type='string'
                    name='price'
                    label='Price'
                    value={String(data.price)}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    type='string'
                    name='raised'
                    label='Raised'
                    value={String(data.raised)}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    type='string'
                    name='preValuation'
                    label='Pre-Valuation'
                    value={String(data.preValuation)}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <FundingWrapper>
                <p>Date</p>
                <ModalDatePicker 
                name={'date'}
                date={data.date} 
                onChange={(value:any,name:string) => inputsHandler(value,name)}
                />
            </FundingWrapper>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save
            </SubmitButton>
        </Modal>
    );
};

export default AddRoundModal;