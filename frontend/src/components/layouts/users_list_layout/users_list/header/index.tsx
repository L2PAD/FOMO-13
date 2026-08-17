import {useState} from 'react';
import { useSelector } from 'react-redux';
import exportExcel from '../../../../services/excel/exportExcel';
import SearchUser from '../../../../common/searchUser';
import FilterUser from '../../../../common/filterUser';
import SortUsers from '../../../../common/sortUsers';
import Button from '../../../../common/button';
import GiveRewardModal from '../../modals/give_reward_modal';
import CreateUserModal from '../../modals/create_user_modal';
import Loader from '../../../../common/loader';
import { IUser } from '../../../../types/global_types';
import {useStyles} from './styles';

const Header = () => {
    const [loading,setLoading] = useState<boolean>(false)
    const [isRewardModal, setIsRewardModal] = useState(false)
    const [isCreateUserModal, setIsCreateUserModal] = useState(false)
    const choosedUsers = useSelector((state:any) => state.user.selectedUsers)

    const confirmExcelExport = async () : Promise<void> => {
        setLoading(true)

        await exportExcel()

        setLoading(false)
    }
    
    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
        actionsWrapper,
        chooseWrapper,
    } = useStyles()

    if(loading) return <Loader/>

    return (
        <div className={wrapper}>
            <div className={leftWrapper}>
                <h1 className={mainTitle}>
                    Users List
                </h1>
                <SearchUser/>
                <FilterUser/>
                <SortUsers/>
            </div>
            <div className={actionsWrapper}>
                <p className={chooseWrapper}>
                    Choose: <span>{choosedUsers.length}</span>
                </p>
                <Button type='bordered' onClick={confirmExcelExport}>
                    Export Excel
                </Button>
                <Button type='bordered' onClick={() => setIsRewardModal(true)}>
                    Give a reward
                </Button>
                <Button type='bordered' onClick={() => setIsCreateUserModal(true)}>
                    Create user
                </Button>
            </div>

            {isRewardModal && (
                <GiveRewardModal
                    choosedUsers={choosedUsers.map((user:IUser) => user._id)}
                    onClose={() => setIsRewardModal(false)}
                />
            )}
            {isCreateUserModal && (
                <CreateUserModal
                    onClose={() => setIsCreateUserModal(false)}
                />
            )}
        </div>
    );
};

export default Header;