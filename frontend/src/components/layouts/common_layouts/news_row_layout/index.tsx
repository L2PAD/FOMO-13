import React from 'react';
import EditIcon from '../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import moment from 'moment';

const NewsRowLayout = () => {
    const {
        wrapper,
        titleWrapper,
        newsRowWrapper,
        newsWrapper,
        newsTitle,
        newsDate,
        newsText,
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={titleWrapper}>
                <div>News</div>
                <span>
                    <EditIcon /> Add news
                </span>
            </div>
            <div className={newsRowWrapper}>
                <div className={newsWrapper}>
                    <div className={newsDate}>
                        {moment().format('HH:mm MMM D, YYYY')}
                    </div>
                    <div className={newsTitle}>
                        Amet minim <EditIcon />
                    </div>
                    <div className={newsText}>
                        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia
                        consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud
                        amet. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
                        officia consequat duis enim velit mollit.
                    </div>
                </div>
                <div className={newsWrapper}>
                    <div className={newsDate}>
                        {moment().format('HH:mm MMM D, YYYY')}
                    </div>
                    <div className={newsTitle}>
                        Amet minim <EditIcon />
                    </div>
                    <div className={newsText}>
                        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia
                        consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud
                        amet. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
                        officia consequat duis enim velit mollit.
                    </div>
                </div>
                <div className={newsWrapper}>
                    <div className={newsDate}>
                        {moment().format('HH:mm MMM D, YYYY')}
                    </div>
                    <div className={newsTitle}>
                        Amet minim <EditIcon />
                    </div>
                    <div className={newsText}>
                        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia
                        consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud
                        amet. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
                        officia consequat duis enim velit mollit.
                    </div>
                </div>
                <div className={newsWrapper}>
                    <div className={newsDate}>
                        {moment().format('HH:mm MMM D, YYYY')}
                    </div>
                    <div className={newsTitle}>
                        Amet minim <EditIcon />
                    </div>
                    <div className={newsText}>
                        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia
                        consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud
                        amet. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
                        officia consequat duis enim velit mollit.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsRowLayout;