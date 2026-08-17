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
                projectNews.map((projectNewsItem:any,index) => {
                    return (
                        <div key={projectNewsItem.id || index} className={newsWrapper}>
                            <div className={newsDate}>
                                {moment(new Date(projectNewsItem.createdAt)).format('HH:mm MMM D, YYYY')}
                            </div>
                            <div className={newsText}>
                                {projectNewsItem.text}
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