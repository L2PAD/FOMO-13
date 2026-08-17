import {useState,FC} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import inputsHandler from '../../../../utils/inputsHandler';
import { ITokenMetrics } from '../../../../types/global_types';
import updateProject from '../../../../services/projects/updateProject';
import { editProject } from '../../../../../store/slices/editProjectSlice';
import { useDispatch,useSelector } from 'react-redux';
import { IProject } from '../../../../hooks/useCreateProject';
import usePath from '../../../../hooks/usePath';

interface Props {
    onClose: () => void;
}

const TokenMetricsModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const [data,setData] = useState<ITokenMetrics>({...project.tokenMetrics})
    const location : string = usePath() || 'projects'

    const confirmChanges = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            tokenMetrics:data
        }

        onClose()

        dispatch(editProject({key:'tokenMetrics',value:data}))

        await updateProject(`${location}/${project._id}`,editedProject)
    }

    return (
        <Modal title='Token metrics' onClose={onClose} variant='small'>
            <ModalRow>
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('ticket',value,setData)}
                    value={data.ticket || ''}
                    label='Ticket'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('tokenType',value,setData)}
                    value={data.tokenType || ''}
                    label='Token Type'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('tokenPrice',value,setData)}
                    value={data.tokenPrice || ''}
                    label='ICO Token Price'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('preSale',value,setData)}
                    value={data.preSale || ''}
                    label='Pre-sale price'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('KYC',value,setData)}
                    value={data.KYC || ''}
                    label='KYC'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('whitelist',value,setData)}
                    value={data.whitelist || ''}
                    label='Whitelist'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('personalCap',value,setData)}
                    value={data.personalCap || ''}
                    label='Min/Max Personal Cap'
                />
                <InputWithLabel
                    onChange={(value:string) => inputsHandler('accepts',value,setData)}
                    value={data.accepts || ''}
                    label='Accepts'
                />
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default TokenMetricsModal;