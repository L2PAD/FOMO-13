import {useEffect,FC,useState} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../users_list_layout/modals/update_user_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import { IEvent ,INft} from '../../../../types/global_types';
import useUpdateEvent from '../../../../hooks/useUpdateEvent';
import useFetch from '../../../../hooks/useFetch';
import getUserId from '../../../../utils/getUserId';
import { configureFetchForm } from '../../../../services/config';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';
import getProjects from '../../../../services/projects/getProjects';
import Loader from '../../../../common/loader';
import { IProject } from '../../../../hooks/useCreateProject';
import { useSelector } from 'react-redux';
import ModalSelectProject from '../../../../common/components_for_modals/modal_select-project';
import useProjectPath from '../../../../hooks/useProjectPath';

interface Props {
    onClose: () => void;
    event:IEvent
}

const UpdateEventModal: FC<Props> = ({onClose,event}) => {
    const {data,inputsHandler} = useUpdateEvent(event)
    const [allProjects,setAllProjects] = useState<Array<IProject | INft>
    >([])
    
    const [selectedProject,setSelectedProject] = useState<IProject | INft>(data.project || allProjects[0])
    const userRole = useSelector((state:any) => state.auth.role)
    const location = useProjectPath()

    const dateHandler = (value:any,name:string) => {
        inputsHandler(value,name)
    }
        
    const {loading,dataHandler} = useFetch(
        `events/${event._id}`,
        configureFetchForm('PUT',data,{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )
    
    const projectHandler = (project:IProject | INft) => {
        setSelectedProject(project)
        inputsHandler(project._id || '','projectId')
    }

    const confirmUpdateEvent = async () => {
        await dataHandler()
        onClose()   
        reloadWindow()
    }

    useEffect(() => {
        const fetchProjects = async () => {
            const {success,data} = await getProjects(location || 'project')
            if(success){
                inputsHandler(data[0]._id,'projectId')
                setAllProjects(data)
            }
        }
        fetchProjects()
    },[])

    if(loading) return <Loader/>

    return (
        <Modal
            title='Update event'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    label='Title'
                    name='name'
                    value={data.name}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <p>Date</p>
                <ModalDatePicker
                name='date' 
                date={new Date(data.date)} 
                onChange={dateHandler} 
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    label='Time'
                    name='time'
                    value={data.time}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <ModalSelectProject
                    label='Choose project'
                    onChange={projectHandler}
                    project={selectedProject}
                    items={allProjects}
                />
            </ModalRow>
            <SubmitButton onClick={confirmUpdateEvent} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default UpdateEventModal;