import React, {FC , useState} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import {ModalRow,ImageWrapper,Input,LabelTest,TextWrapper} from './styles';
import {LogoImage, LogoWrapper} from '../../../projects_layouts/modals/updating_project/styles';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import useCreateNews from '../../../../hooks/useCreateNews';
import FileInput from '../../../../common/file_input';
import useFetch from '../../../../hooks/useFetch';
import { configureFetchForm } from '../../../../services/config';
import getAccessToken from '../../../../utils/getAccessToken';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';
import { useSelector } from 'react-redux';
import getUserId from '../../../../utils/getUserId';
import usePath from '../../../../hooks/usePath';
import RecommendationsModal from '../recommendations_modal/RecommendationsModal';
import BorderedButton from '../../../../common/button/bordered_button';
import TextEditor from '../../../../common/text_editor/TextEditor';

interface Props {
    onClose: () => void;
}

const CreateAcademyModal: FC<Props> = ({onClose}) => {
    const [isRecModal,setIsRecModal] = useState(false)
    const {data,inputsHandler} = useCreateNews()
    const userRole = useSelector((state:any) => state.auth.role)
    const location = usePath()

    const dateHandler = (value:any,name:string) => {
        inputsHandler(value,name)
    }

    const {loading,dataHandler} = useFetch(
        userRole === 'admin' ? `news/create/admin` : `news/create/moderator}`,
        configureFetchForm('POST',{...data,page:location,newsSection:'fomo-academy'},{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )

    const confirmCreateNews = async () => {
        await dataHandler()
        onClose()   
        reloadWindow()
    }

    if(loading) return <Loader/>

    return (
        <Modal
            className='create-news-modal'
            title='Create FOMO Academy News'
            onClose={onClose}
            variant="big"
        >
            <ModalRow>
                <InputWithLabel
                    name='title'
                    label='Title'
                    value={data.title}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                name='type'
                label='Category'
                value={data.type}
                onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
            <p>Text</p>
            </ModalRow>
            <TextWrapper>
                <TextEditor value={data.text} onChange={inputsHandler}/>
            </TextWrapper>
            <LogoWrapper>
                <FileInput data={data} inputsHandler={inputsHandler}/>
            </LogoWrapper>
            <SubmitButton onClick={confirmCreateNews} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>    
    );
};

export default CreateAcademyModal;