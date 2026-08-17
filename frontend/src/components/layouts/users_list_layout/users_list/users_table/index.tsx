import {useCallback, useEffect, useState, useMemo} from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { setItems,setSelectedUsers } from '../../../../../store/slices/userSlice';
import {useStyles} from './styles';
import TableRow from './table_row';
import Checkbox from '../../../../common/checkbox';
import UpdateUserModal from '../../modals/update_user_modal';
import Loader from '../../../../common/loader';
import { IUser } from '../../../../types/global_types';
import fetchUserList from '../../../../services/user/fetchUserList';

const UsersTable = () => {
    const dispatch = useDispatch()
    const [isUpdateModal, setIsUpdateModal] = useState(false)
    const [updatedUser,setUpdatedUser] = useState<IUser>()
    const [isSelectAll,setIsSelectAll] = useState<boolean>(false)
    const users : Array<IUser> = useSelector((state:any) => state.user.items)
    const options : any = useSelector((state:any) => state.user.filterOptions)
    const {data,isLoading} = useQuery(['users',options],() => fetchUserList(options))

    const {
        wrapper,
        headerWrapper,
        flagsWrapper,
        statusWrapper,
        userWrapper,
        checkboxWrapper,
        walletWrapper,
        emailWrapper,
        pointsWrapper,
        stakingWrapper,
        telegramWrapper
    } = useStyles()

    const selectAll = () => {
        dispatch(setItems(users.map((user) => ({...user,selected:!isSelectAll}))))
        setIsSelectAll((prev) => !prev)
    }

    const updateUser = useCallback((user:IUser) => {
        setUpdatedUser(user)
        setIsUpdateModal(true)
    },[updatedUser])

    const selectUser = useCallback((id:string) => {
        dispatch(setItems(users?.map((user) => {
            if(user._id === id){
                return {...user,selected:!user.selected}
            }
            return user
        })))
    },[users])

    useEffect(() => {
        const selectedUsers : Array<IUser> = users.filter((user:IUser) => user.selected)
        dispatch(setSelectedUsers(selectedUsers))
    },[users])

    useEffect(() => {
        if(!data?.data) return
        
        dispatch(setItems(data.data))
    },[data])
    
    if(isLoading){
        return <Loader/>
    }

    return (
        <div className={wrapper}>
            <div className={`container ${headerWrapper}`}>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={selectAll}
                        active={isSelectAll}
                    />
                </div>
                <div className={userWrapper}>User</div>
                <div className={walletWrapper}>Wallet address</div>
                <div className={statusWrapper}>Status</div>
                <div className={pointsWrapper}>Points</div>
                <div className={emailWrapper}>Email</div>
                <div className={stakingWrapper}>Staking</div>
                <div className={telegramWrapper}>Telegram</div>
                <div className={flagsWrapper}>FOMO ID</div>
            </div>
            <div>
                {
                    users?.length
                    ?
                    users.map((user:IUser) => {
                        return <TableRow 
                        key={user._id} 
                        user={user} 
                        updateUser={updateUser}
                        selectUser={selectUser} />
                    })
                    :
                    <></>
                }
            </div>
            {isUpdateModal && updatedUser
            ?
            <UpdateUserModal
                user={updatedUser}
                onClose={() => setIsUpdateModal(false)}
            />
            :
            <></>
            }
        </div>
    );
};

export default UsersTable;