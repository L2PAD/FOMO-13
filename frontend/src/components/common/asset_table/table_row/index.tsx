import React from 'react';
import {useStyles} from './styles';
import avatarImage from '../../../../assets/img/avatar.png'
import ProgressRow from '../../progress_row';
import Status from '../../status';
import {STATUS_LIST} from '../../../../static_content/dropdowns_data';

const TableRow = () => {
    const {
        assetWrapper,
        lastWrapper,
        stageWrapper,
        upcomingWrapper,
        privateWrapper,
        publicWrapper,
        seedWrapper,
        strategicWrapper,
        tokenWrapper,
        rowWrapper,
        imageStyle,
    } = useStyles()

    return (
        <div className={rowWrapper}>
            <div className={assetWrapper}>
                <img
                    className={imageStyle}
                    src={avatarImage}
                    alt=""
                    width={24}
                />
                Starly
                <img
                    className={imageStyle}
                    src={avatarImage}
                    alt=""
                    width={16}
                />
                <img
                    className={imageStyle}
                    src={avatarImage}
                    alt=""
                    width={16}
                />
            </div>
            <div className={tokenWrapper}>
                35.34% <span>(+5.17M tokens)</span>
                <ProgressRow percentage={35.34} />
            </div>
            <div className={publicWrapper}>
                next 7.17% <span>(10mo. left)</span>
                <ProgressRow percentage={7.17}/>
            </div>
            <div className={seedWrapper}>
                next 7.17% <span>(10mo. left)</span>
                <ProgressRow  percentage={7.17}/>
            </div>
            <div className={privateWrapper}>
                next 7.17% <span>(10mo. left)</span>
                <ProgressRow percentage={7.17}/>
            </div>
            <div className={strategicWrapper}>
                next 7.17% <span>(10mo. left)</span>
                <ProgressRow percentage={7.17}/>
            </div>
            <div className={stageWrapper}>
                <Status status={STATUS_LIST.UPCOMING}/>
            </div>
            <div className={upcomingWrapper}>Today</div>
            <div className={lastWrapper}>Today</div>
        </div>
    );
};

export default TableRow;