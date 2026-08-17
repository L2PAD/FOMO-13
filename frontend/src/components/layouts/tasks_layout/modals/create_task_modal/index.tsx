import { FC, useState } from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import { ModalRow } from '../../../news_layout/modals/create_news_modal/styles';
import { SubmitButton } from '../../../users_list_layout/modals/update_user_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import reloadWindow from '../../../../utils/reloadWindow';
import Loader from '../../../../common/loader';
import useCreateTask from '../../../../hooks/useCreateTask';
import TextEditor from '../../../../common/text_editor/TextEditor';
import createTask from '../../../../services/tasks/createTask';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import Switch from '../../../../common/switch';
import EarlylandActivityPicker from '../earlyland_activity_picker';
import { toast } from 'react-toastify';

interface Props {
    isSpecialTasks: boolean
    onClose: () => void;
    page?: string
    date: Date
}

const CreateTaskModal: FC<Props> = ({ onClose, date, page, isSpecialTasks }) => {
    const [loading, setLoading] = useState<boolean>(false)
    const { data, inputsHandler } = useCreateTask(date)

    const dateHandler = (value: any, name: string) => {
        inputsHandler(value, name)
    }

    const confirmCreateEvent = async () => {
        if (!data.name.trim()) {
            toast.error('Enter a task title')
            return
        }
        if (!Number.isFinite(Number(data.points)) || Number(data.points) < 0) {
            toast.error('Points must be zero or greater')
            return
        }
        if (!isSpecialTasks && !data.v2ActivityId) {
            toast.error('Choose an Earlyland activity for this task')
            return
        }
        setLoading(true)
        const result = await createTask(data, isSpecialTasks ? 'special' : 'default')
        setLoading(false)
        if (!result.success) {
            toast.error('Could not create task')
            return
        }
        onClose()
        reloadWindow()
    }

    const getModalBody = (): any => {
        if (isSpecialTasks) {
            return (
                <>
                    <ModalRow>
                        <InputWithLabel
                            placeholder='Reach $10,000 Portfolio Balance'
                            label='Title'
                            name='name'
                            value={data.name}
                            onChange={inputsHandler}
                        />
                    </ModalRow>
                    <ModalRow>
                        <InputWithLabel
                            placeholder='50'
                            label='XP'
                            name='points'
                            value={String(data.points)}
                            onChange={inputsHandler}
                            type={'number'}
                        />
                    </ModalRow>
                    <ModalRow>
                        <InputWithLabel
                            placeholder='10'
                            label='Goal'
                            name='goal'
                            value={String(data.goal || 0)}
                            onChange={inputsHandler}
                            type={'number'}
                        />
                    </ModalRow>
                    <ModalRow>
                        <ModalSelect
                            name='validationKey'
                            label='Value to check'
                            value={data.validationKey || ''}
                            items={[
                                'Portfolio Balance',
                                'Invited Users',
                                'NFT Deals',
                                'Hours online',
                                'Comments on Topic',
                            ]}
                            onChange={inputsHandler}
                        />
                    </ModalRow>
                </>
            )
        }

        return (
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
                        placeholder='Create 10 projects'
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
            </>
        )
    }

    if (loading) return <Loader />

    return (
        <Modal
            title='Create task'
            onClose={onClose}
            variant='medium'
        >
            {getModalBody()}
            <SubmitButton onClick={confirmCreateEvent} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default CreateTaskModal;
