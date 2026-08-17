import {FC} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../users_list_layout/modals/update_user_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import { ITask } from '../../../../types/global_types';
import useUpdateTask from '../../../../hooks/useUpdateTask';
import useFetch from '../../../../hooks/useFetch';
import { configureFetchForm } from '../../../../services/config';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';
import Loader from '../../../../common/loader';
import TextEditor from '../../../../common/text_editor/TextEditor';
import EarlylandActivityPicker from '../earlyland_activity_picker';
import Switch from '../../../../common/switch';
import { toast } from 'react-toastify';

interface Props {
    onClose: () => void;
    task:ITask
}

const UpdateEventModal: FC<Props> = ({onClose,task}) => {
    const {data,inputsHandler} = useUpdateTask(task)

    const dateHandler = (value:any,name:string) => {
        inputsHandler(value,name)
    }
        
    const {loading,dataHandler} = useFetch(
        `tasks/${task._id}`,
        configureFetchForm('PUT',data,{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )
    
    const confirmUpdateTask = async () => {
        if (!data.name.trim()) {
            toast.error('Enter a task title')
            return
        }
        if (!Number.isFinite(Number(data.points)) || Number(data.points) < 0) {
            toast.error('Points must be zero or greater')
            return
        }
        if (task.type !== 'special' && !data.v2ActivityId) {
            toast.error('Choose an Earlyland activity for this task')
            return
        }
        const result = await dataHandler()
        if (!result?.success) {
            const message = typeof result?.data?.message === 'string'
                ? result.data.message
                : 'Could not update task'
            toast.error(message)
            return
        }
        onClose()   
        reloadWindow()
    }

    if(loading) return <Loader/>

    return (
        <Modal
            title='Update task'
            onClose={onClose}
            variant='medium'
        >
            {task.type !== 'special' ? (
                <>
                    <ModalRow>
                        <EarlylandActivityPicker
                            value={data.v2ActivityId}
                            onChange={(activityId) => inputsHandler(activityId, 'v2ActivityId')}
                        />
                    </ModalRow>
                    <ModalRow>
                        <div>
                            <p>Access</p>
                            <Switch
                                leftLabel='Public'
                                rightLabel='Prime'
                                checked={data.accessTier === 'prime'}
                                onChange={(checked) => inputsHandler(checked ? 'prime' : 'public', 'accessTier')}
                            />
                        </div>
                    </ModalRow>
                </>
            ) : null}
            <ModalRow>
                <InputWithLabel
                    placeholder='New task title'
                    label='Title'
                    name='name'
                    value={data.name}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    placeholder='Short task description'
                    label='Short Description'
                    name='smallDescription'
                    value={data.smallDescription || ''}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    placeholder='https://test.com'
                    label='Link'
                    name='link'
                    value={data.link}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <p>
                    Description
                </p>
                <TextEditor
                value={data.description}
                onChange={inputsHandler}
                name={'description'}
                />
            </ModalRow>
            <ModalRow>
                <p>Date</p>                             
                <ModalDatePicker
                name='date'
                date={new Date(data.date)} 
                onChange={dateHandler} />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    placeholder="24:00"
                    label='Time'    
                    name='time'
                    value={data.time}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    placeholder='50'
                    label='Points'
                    name='points'
                    value={String(data.points)}
                    onChange={inputsHandler}
                    type={'number'}
                />
            </ModalRow>
            <SubmitButton onClick={confirmUpdateTask} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default UpdateEventModal;
