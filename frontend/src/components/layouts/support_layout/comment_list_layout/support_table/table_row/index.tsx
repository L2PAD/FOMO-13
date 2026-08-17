import { useState } from 'react';
import loader from '../../../../../services/loader';
import parseDate from '../../../../../utils/parseDate';
import Loader from '../../../../../common/loader';
import { useStyles } from './styles';
import { loaderApi } from '../../../../../services/config';
import UserAvatar from '../../../../../common/UserAvatar';
import { CopyIcon } from '../../../../../../assets';
import copy from 'clipboard-copy';
import { toast } from 'react-toastify';
import moment from 'moment';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';

const TableRow = ({ item, onClick }: { item: any, onClick: (message: any) => void }) => {
    const {
        wrapper,
        rowWrapper,
        projectWrapper,
        projectImage,
        statusWrapper,
        investorsWrapper,
        ratingWrapper,
        raisedWrapper,
        tagWrapper,
        typeWrapper,
        actionsWrapper,
        flagsWrapper,
        fundingWrapper,
        projectTitle,
        projectDescription,
        tagCircle,
        fileBtn,
        projectsCell
    } = useStyles({ status: '', rating: 75 })
    const user: any = item.author?.length ? item.author[0] : ''
    const [loading, setLoading] = useState(false)


    const copyHandle = (value: string) => {
        copy(value)
        toast.success(
            <div>
                <h3>FOMO ID Copied</h3>
            </div>
        )
    }

    if (loading) {
        return <Loader />
    }

    if (!user) return <></>

    return (
        <div
            tabIndex={0}
            className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <div className={projectsCell}>
                    {
                        user?.photo || user?.twitterData?.photo
                            ?
                            <UserAvatar
                                variant='default'
                                size={'small'}
                                name={user?.username || ''}
                                avatar={loader(user?.photo || user?.twitterData?.photo)}
                            />
                            :
                            <></>
                    }

                    <div className='user-info'>
                        <div className={projectTitle}>
                            {user?.name || user?.twitterData?.name || ''}
                        </div>
                        <span className={projectDescription}>
                            @{user?.username || user?.twitterData?.username || ''}
                        </span>
                        <button
                            onClick={() => copyHandle(String(item?.creator?.fomoId))}
                            className='fomo-id' id='file_link'>
                            <CopyIcon />
                            FOMO ID {item?.creator?.fomoId}
                        </button>
                    </div>
                </div>
                <div className={projectsCell}>
                    {moment(String(item.date)).format('ll hh:mm a')}
                </div>
                <div>
                    {item.reportsCount || 0}
                </div>
                <div className={actionsWrapper}>
                    <DotsButtonWithDropdown items={[
                        { title: 'Delete', onClick: () => onClick(item) },
                    ]} />
                </div>
            </div>
        </div>
    );
};

export default TableRow;