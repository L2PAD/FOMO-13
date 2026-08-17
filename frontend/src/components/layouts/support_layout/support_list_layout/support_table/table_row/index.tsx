import { useState } from 'react';
import loader from '../../../../../services/loader';
import parseDate from '../../../../../utils/parseDate';
import Loader from '../../../../../common/loader';
import {useStyles} from './styles';
import { loaderApi } from '../../../../../services/config';

const TableRow = ({item,onClick}: {item:any,onClick:(message:any) => void}) => {
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
        fileBtn
    } = useStyles({status: '', rating: 75})

    const [loading,setLoading] = useState(false)

    if(loading){
        return <Loader/>
    }
    
    return (
        <div
        onClick={(e:any) => {
            if(e.target.id === 'file_link') return 
            
            onClick(item)
        }}
        tabIndex={0}
        className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <div className={projectWrapper}>
                    <div>
                        <div className={projectTitle}>
                            {item.theme}
                        </div>
                    </div>
                </div>
                <div className={raisedWrapper}>
                    {item.message.length > 10 ? `${item.message.slice(0,10)}...` : item.message}
                </div>
                <div className={fundingWrapper}>
                {item.date ? parseDate(new Date(item.date),1) : '-'}
                </div>
                <div className={projectWrapper}>
                    {item.category || '-'}
                </div>
                <div className={raisedWrapper}>
                    {item.userData?.email ? item.userData.email : '-'}
                </div>
                <div className={raisedWrapper}>
                    {
                        item.file
                        ?
                        <a 
                        id='file_link'
                        rel="noreferrer"
                        target={'_blank'}
                        href={`${loaderApi}/uploads${item.file}`}
                        className={fileBtn}>
                            <svg id='file_link' xmlns="http://www.w3.org/2000/svg" version="1.0" width="1280.000000pt" height="1280.000000pt" viewBox="0 0 1280.000000 1280.000000" preserveAspectRatio="xMidYMid meet">
                            <g id='file_link' transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                            <path id='file_link' d="M3857 11953 c-4 -3 -7 -1340 -7 -2970 l0 -2963 -1400 0 c-770 0 -1400 -3 -1399 -7 0 -5 595 -418 1322 -919 727 -501 1925 -1327 2661 -1835 l1339 -924 -2702 -3 -2701 -2 0 -620 0 -620 5400 0 5400 0 0 620 0 620 -2661 2 -2661 3 958 661 c2970 2049 3559 2456 3942 2719 231 160 421 293 422 298 0 4 -630 7 -1400 7 l-1400 0 0 2970 0 2970 -2553 0 c-1405 0 -2557 -3 -2560 -7z"/>
                            </g>
                            </svg>
                            <span id='file_link'>Download</span>
                        </a>
                        :
                        <>-</>
                    }
                </div>
            </div>
        </div>
    );
};

export default TableRow;