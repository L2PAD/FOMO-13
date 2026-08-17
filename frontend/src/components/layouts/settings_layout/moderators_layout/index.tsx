import { useState } from 'react';
import Filter from '../../../common/filter';
import SortBy from '../../../common/sort_by';
import Button from '../../../common/button';
import SearchIcon from '../../../common/Icons/search_icon';
import Header from './header';
import TableRow from './table_row';
import useFetch from '../../../hooks/useFetch';
import getAccessToken from '../../../utils/getAccessToken';
import Loader from '../../../common/loader';
import getUserRole from '../../../utils/getUserRole';
import InviteModeratorModal from './modals/invite_moderator_modal';
import { IUser } from '../../../types/global_types';
import {useStyles} from './styles';

const ModeratorsLayout = () => {
    const {
        headerWrapper,
        headerLeftWrapper,
        searchWrapper,
        searchInput,
    } = useStyles()
    const [isInviteModal,setIsInviteModal] = useState(false)

    const {data,loading} = useFetch('user/moderators',{headers:{Authorization:` Bearer ${getAccessToken()}`}},getUserRole() !== 'admin')

    if(loading){
        return <Loader/>
    }

    return (
        <>
        <div>
            <div className={headerWrapper}>
                <div className={headerLeftWrapper}>
                    <div className={searchWrapper}>
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder='Search'
                            className={searchInput}
                        />
                    </div>
                    <Filter />
                    <SortBy />
                </div>
                <Button
                    onClick={() => setIsInviteModal(true)}
                    type='bordered'
                >
                    Invite moderator
                </Button>
            </div>
            <div>
                <Header />
                {
                    data?.data
                    ?
                    data.data.map((user:IUser) => {
                        return (
                            <TableRow key={user.email} moderator={user}/>
                        )
                    })
                    :
                    <></>
                }
            </div>
        </div>
        {
            isInviteModal
            ?
            <InviteModeratorModal
            onClose={() => setIsInviteModal(false)}
            />
            :
            <></>
        }
        </>
    );
};

export default ModeratorsLayout;