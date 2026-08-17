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

const CreateNewsModal: FC<Props> = ({onClose}) => {
    const [isRecModal,setIsRecModal] = useState(false)
    const {data,inputsHandler} = useCreateNews()
    const userRole = useSelector((state:any) => state.auth.role)
    const location = usePath()

    const dateHandler = (value:any,name:string) => {
        inputsHandler(value,name)
    }

    const {loading,dataHandler} = useFetch(
        userRole === 'admin' ? `news/create/admin` : `news/create/moderator}`,
        configureFetchForm('POST',{...data,page:location},{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )

    const confirmCreateNews = async () => {
        await dataHandler()
        onClose()   
        reloadWindow()
    }

    if(loading) return <Loader/>

    return (
        isRecModal
        ?
        <RecommendationsModal
        path={location}
        news={data}
        changeHandler={inputsHandler}
        onClose={() => setIsRecModal(false)}
        />
        :
        <Modal
            className='create-news-modal'
            title='Create news'
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
                <p>Date</p>
                <ModalDatePicker date={data.date} onChange={dateHandler} name='date'/>
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
            <ModalRow>
                <p>Recommendations ({data.recommendations?.length || 0})</p>
                <BorderedButton
                onClick={() => setIsRecModal(true)}
                >
                    + Change recommendations
                </BorderedButton>
            </ModalRow>
            <SubmitButton onClick={confirmCreateNews} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>    
    );
};

export default CreateNewsModal;