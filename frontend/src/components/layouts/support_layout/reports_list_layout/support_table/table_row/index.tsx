import React, { useState } from 'react';
import loader from '../../../../../services/loader';
import parseDate from '../../../../../utils/parseDate';
import Loader from '../../../../../common/loader';
import { useStyles } from './styles';
import { loaderApi } from '../../../../../services/config';
import { IAttachmentReport, ReportTypes } from '../../../../../types/global_types';
import moment from 'moment';
import UserAvatar from '../../../../../common/UserAvatar';
import { CopyIcon } from '../../../../../../assets';
import { toast } from 'react-toastify';
import copy from 'clipboard-copy';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';

const getReportTextByType = (type: ReportTypes): React.ReactNode => {
    switch (type) {
        case 'impersonality':
            return (
                <div className='report-type'>
                    <h3>Impersonation</h3>
                    <p>The user is pretending to be someone else or using a fake identity.</p>
                </div>
            )

        case 'inappropriateBehavior':
            return (
                <div className='report-type'>
                    <h3>Inappropriate behavior</h3>
                    <p>The user posts irrelevant, offensive, or disruptive content.</p>
                </div>
            )

        case 'underageAccount':
            return (
                <div className='report-type'>
                    <h3>Underage account</h3>
                    <p>The user appears to be under 18 years old, which violates our platform rules.</p>
                </div>
            )

        default:
            break;
    }
    return <></>
}

const TableRow =
    ({ item, onClick }: { item: IAttachmentReport, onClick: (message: any) => void }) => {
        const {
            wrapper,
            rowWrapper,
            projectWrapper,
            projectImage,
            dateWrapper,
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
            fileBtn
        } = useStyles({ status: '', rating: 75 })

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

        return (
            <div
                className={wrapper}>
                <div className={`${rowWrapper} container`}>
                    <div className={projectWrapper}>
                        <div className='info-wrapper' tabIndex={0}>
                            <UserAvatar
                                variant='default'
                                size={'small'}
                                name={item?.creator?.username || ''}
                                avatar={loader(item?.creator?.photo || item?.creator?.twitterData?.photo)}
                            />
                            <div className='user-info'>
                                <div className={projectTitle}>
                                    {item?.creator?.name || item?.creator?.twitterData?.name || ''}
                                </div>
                                <span className={projectDescription}>
                                    @{item?.creator?.username || item?.creator?.twitterData?.username || ''}
                                </span>
                            </div>
                            <button
                                onClick={() => copyHandle(String(item?.creator?.fomoId))}
                                className='fomo-id' id='file_link'>
                                <CopyIcon />
                                FOMO ID {item?.creator?.fomoId}
                            </button>
                        </div>
                    </div>
                    <div className={projectWrapper}>
                        <div className='info-wrapper'>
                            <UserAvatar
                                variant='default'
                                size={'small'}
                                name={item?.user?.username || ''}
                                avatar={loader(item?.user?.photo || item?.user?.twitterData?.photo)}
                            />
                            <div className='user-info'>
                                <div className={projectTitle}>
                                    {item?.user?.name || item?.user?.twitterData?.name || ''}
                                </div>
                                <span className={projectDescription}>
                                    @{item?.user?.username || item?.user?.twitterData?.username || ''}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => copyHandle(String(item?.user?.fomoId))}
                            className='fomo-id' id='file_link'>
                            <CopyIcon />
                            FOMO ID {item?.user?.fomoId}
                        </button>
                    </div>
                    <div className={dateWrapper}>
                        {moment(new Date(item.createdAt)).format('ll hh:mm a')}
                    </div>
                    <div className={typeWrapper}>
                        {getReportTextByType(item.type)}
                    </div>
                    <div className={typeWrapper}>
                        {
                            item.subType
                                ?
                                <div className='report-type'>
                                    <h3>Who is this account pretending to be?</h3>
                                    <p>{item.subType}</p>
                                </div>
                                :
                                '-'
                        }
                    </div>
                    <div className={actionsWrapper}>
                        <DotsButtonWithDropdown items={[
                            { title: 'Send answer', onClick: () => onClick(item) },
                        ]} />
                    </div>
                </div>
            </div>
        );
    };

export default TableRow;