import {FC} from 'react';
import Modal from '../../../../common/modal';
import {SubmitButton,RemoveButton} from '../../../../common/global_modals/description_modal/styles';
import {ModalRow,NewsBody} from './styles';
import { useSelector } from 'react-redux';
import { INews } from '../../../../types/global_types';
import useFetch from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';
import { configureFetchForm } from '../../../../services/config';
import { useHistory } from 'react-router';
import Loader from '../../../../common/loader';
import loader from '../../../../services/loader';

interface Props {
    onClose: () => void;
    news: INews
}

const DeleteNewsModal: FC<Props> = ({onClose,news}) => {
    const userRole = useSelector((state:any) => state.auth.role)
    const history = useHistory()
    
    const {loading,dataHandler} = useFetch(
        userRole === 'admin' ? `news/${news._id}` : `news/${news._id}`,
        configureFetchForm('DELETE',{},{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )

    const confirmDeleteNews = async () => {
        await dataHandler()
        onClose()
        history.goBack()   
    }

    if(loading) return <Loader/>


    return (
        <Modal
            title='Delete news'
            onClose={onClose}
            variant='small'
        >   
        <NewsBody>
            <div>
                {news.title}
            </div>
            <img src={loader(news.image)} alt="news image" />
        </NewsBody>
        <ModalRow>
               <SubmitButton onClick={onClose} type='fill'>
                    Cancel
                </SubmitButton>
                <RemoveButton onClick={confirmDeleteNews} type='fill'>
                    Delete news
                </RemoveButton>
        </ModalRow>
       
        </Modal>
    );
};

export default DeleteNewsModal;