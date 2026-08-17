import {FC,useState} from 'react';
import Modal from '../../../../common/modal';
import {ModalRow, SubmitButton, UsersRow} from './styles';
import InputWithLabel from '../../../../common/components_for_modals/input_with_label';
import useFetch from '../../../../hooks/useFetch';
import Loader from '../../../../common/loader';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';

interface Props {
    onClose: () => void;
    choosedUsers: Array<string>
}

const GiveRewardModal: FC<Props> = ({onClose,choosedUsers}) => {
    const [rewards,setRewards] = useState<string>('0')

    const {loading,dataHandler} = useFetch(
    'user/reward',
    {
    method:'POST',
    body:JSON.stringify({users:choosedUsers,points:Number(rewards)}),
    headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
        }
    },
    true)

    const confirmRewards = async () => {
        await dataHandler()
        onClose()
        reloadWindow()
    }

    if(loading){
        return <Loader/>
    }

    return (
        <Modal
            title='Giving reward'
            onClose={onClose}
            variant='small'
        >
            <UsersRow>
                <p>Users</p>
                <span>{choosedUsers.length}</span>
            </UsersRow>
            <ModalRow>
                <InputWithLabel
                    label='Add reward'
                    value={rewards}
                    onChange={(value) => setRewards(value)}
                />
            </ModalRow>
            <SubmitButton onClick={confirmRewards} type='fill'>
                Confirm
            </SubmitButton>
        </Modal>
    );
};

export default GiveRewardModal;