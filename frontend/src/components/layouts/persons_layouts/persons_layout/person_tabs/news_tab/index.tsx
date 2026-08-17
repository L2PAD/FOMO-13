import React from 'react';
import moment from 'moment/moment';
import EditIcon from '../../../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import { useSelector } from 'react-redux';
import { IProjectNews } from '../../../../../types/global_types';

const NewsTab = () => {
    const {
        newsRowWrapper,
        newsWrapper,
        newsTitle,
        newsDate,
        newsText,
    } = useStyles()

    const projectNews : Array<IProjectNews> = useSelector((state:any) => state.editProject.project.news)

    return (
        <div className={newsRowWrapper}>
            {
                projectNews?.length
                ?
                projectNews.map((projectNewsItem,index) => {
                    return (
                        <div key={index} className={newsWrapper}>
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
                    )
                })
                :
                <>News empty...</>
            }
    
        </div>
    );
};

export default NewsTab;