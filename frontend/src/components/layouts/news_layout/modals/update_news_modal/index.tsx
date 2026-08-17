import React, {FC, useState} from 'react';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import ModalDatePicker from '../../../../common/components_for_modals/modal_date_picker';
import {ModalRow,TextWrapper} from './styles';
import {LogoImage, LogoWrapper} from '../../../projects_layouts/modals/updating_project/styles';
import { useSelector } from 'react-redux';
import ModalSelect from '../../../../common/components_for_modals/modal_select';
import useUpdateNews from '../../../../hooks/useUpdateNews';
import { INews } from '../../../../types/global_types';
import { IReturnData } from '../../../../services/types';
import FileInput from '../../../../common/file_input';
import useFetch from '../../../../hooks/useFetch';
import getUserId from '../../../../utils/getUserId';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';
import { configureFetchForm } from '../../../../services/config';
import Loader from '../../../../common/loader';
import usePath from '../../../../hooks/usePath';
import RecommendationsModal from '../recommendations_modal/RecommendationsModal';
import BorderedButton from '../../../../common/button/bordered_button';
import TextEditor from '../../../../common/text_editor/TextEditor';

interface Props {
    onClose: () => void;
    news:INews
}

const UpdateNewsModal: FC<Props> = ({onClose,news}) => {
    const [isRecModal,setIsRecModal] = useState(false)
    const {data,inputsHandler} = useUpdateNews(news)
    const userRole = useSelector((state:any) => state.auth.role)
    
    const dateHandler = (value:any,name:string) => {
        inputsHandler(value,name)
    }

    const {loading,dataHandler} = useFetch(
        userRole === 'admin' ? `news/${data._id}` : `news/${data._id}`,
        configureFetchForm('PUT',{...data},{'Authorization': `Bearer ${getAccessToken()}`}),
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
        news={data}
        changeHandler={inputsHandler}
        onClose={() => setIsRecModal(false)}
        />
        :
        <Modal
            title='Update news'
            onClose={onClose}
            variant='big'
        >
            <ModalRow>
                <InputWithLabel
                    label='Title'
                    name='title'
                    value={data.title}
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
                <ModalSelect
                    label='Choose type'
                    name='type'
                    value={data.type}
                    onChange={inputsHandler}
                    items={['News theme1','News theme2','News theme3','News theme4']}
                />
            </ModalRow>
            <ModalRow>
                <p>Text</p>
            </ModalRow>
            <TextWrapper>
                <TextEditor value={data.text} onChange={inputsHandler}/>
            </TextWrapper>
            <LogoWrapper>
                <FileInput
                data={data}
                inputsHandler={inputsHandler}
                />
            </LogoWrapper>
            <ModalRow>
                <p>Recommendations ({data.recommendations?.length || 0})</p>
                <BorderedButton
                onClick={() => setIsRecModal(true)}
                >
                    + Edit recommendations
                </BorderedButton>
            </ModalRow>
            <SubmitButton onClick={confirmCreateNews} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default UpdateNewsModal;