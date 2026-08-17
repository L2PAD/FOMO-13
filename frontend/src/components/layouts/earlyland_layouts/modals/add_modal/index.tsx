import React, {FC} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow} from '../../../news_layout/modals/create_news_modal/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { IProject } from '../../../../hooks/useCreateProject';
import ModalSelectProject from '../../../../common/components_for_modals/modal_select-project';
import useFetch from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';
import getUserId from '../../../../utils/getUserId';
import getUserRole from '../../../../utils/getUserRole';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';
import { INft } from '../../../../types/global_types';

interface Props {
    onClose: () => void
    onChange: (id:IProject) => void
    section: 'earlyland' | 'gemslab'
    type:string
    title:string
    projects?: Array<IProject>
    selectedProject:IProject
}

const AddModal: FC<Props> = ({onClose,onChange,title,projects,type,selectedProject,section}) => {
    const {loading,dataHandler} = useFetch(
        getUserRole() === 'admin' ? `${section}/${type}/${selectedProject._id}` : `earlyland/${type}/${selectedProject._id}`,
        {
            method:'POST',
            headers:{
                'Authorization': `Bearer ${getAccessToken()}`
            },
        },
        true
    )

    const confirmChanges = async () => {
        await dataHandler()
        onClose()
        reloadWindow()
    }

    if(loading) return <Loader/>

    return (
        <Modal title={title} onClose={onClose} variant='small'>
            <ModalRow>
                <ModalSelectProject
                    label='Project'
                    //@ts-ignore
                    onChange={onChange}
                    project={selectedProject}
                    items={projects?.length ? projects : []}
                />
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default AddModal;