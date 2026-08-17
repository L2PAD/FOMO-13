import {FC,useState,useEffect} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../users_list_layout/modals/update_user_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import useCreateEvents from '../../../../hooks/useCreateEvent';
import ModalSelectProject from '../../../../common/components_for_modals/modal_select-project';
import getProjects from '../../../../services/projects/getProjects';
import { IProject } from '../../../../hooks/useCreateProject';
import { INft } from '../../../../types/global_types';
import useFetch from '../../../../hooks/useFetch';
import { useSelector } from 'react-redux';
import getAccessToken from '../../../../utils/getAccessToken';
import { configureFetchForm } from '../../../../services/config';
import reloadWindow from '../../../../utils/reloadWindow';
import Loader from '../../../../common/loader';
import useProjectPath from '../../../../hooks/useProjectPath';

interface Props {
    onClose: () => void;
    page?:string
    date:Date
}

const CreateEventModal: FC<Props> = ({onClose,date,page}) => {
    const [loadingProjects,setLoadingProjects] = useState<boolean>(true)
    const {data,inputsHandler} = useCreateEvents(date)
    const [allProjects,setAllProjects] = useState<Array<IProject | INft>>([])
    const [selectedProject,setSelectedProject] = useState<IProject | INft>()
    const userRole = useSelector((state:any) => state.auth.role)
    const location = useProjectPath()
    
    const dateHandler = (value:any,name:string) => {
        inputsHandler(value,name)
    }

    const projectHandler = (project:IProject | INft) => {
        setSelectedProject(project)
        inputsHandler(project._id || '','projectId')
    }
    
    const {loading,dataHandler} = useFetch(
        `events/${userRole}`,
        configureFetchForm('POST',{...data,page},{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )
    
    const confirmCreateEvent = async () => {
        await dataHandler()
        onClose()   
        reloadWindow()
    }

    useEffect(() => {
        const fetchProjects = async () => {
            const {success,data} = await getProjects(location === 'projects' ? 'project' : location  || 'project')
            if(success){
                inputsHandler(data[0]._id,'projectId')
                setSelectedProject(data[0])
                setAllProjects(data)
            }
            setLoadingProjects(false)
        }
        fetchProjects()
    },[])

    if(loading || loadingProjects) return <Loader/>

    return (
        <Modal
            title='Create event'
            onClose={onClose}
            variant='small'
        >
            <ModalRow>
                <InputWithLabel
                    placeholder='New event title'
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
                <ModalSelectProject
                    items={allProjects}
                    label='Choose project'
                    project={selectedProject || allProjects[0]}
                    onChange={projectHandler}
                />
            </ModalRow>
            <SubmitButton onClick={confirmCreateEvent} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default CreateEventModal;