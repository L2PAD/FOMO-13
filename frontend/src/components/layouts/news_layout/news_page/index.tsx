import React, {useEffect, useState} from 'react';
import moment from 'moment/moment';
import Button from '../../../common/button';
import EditIcon from '../../../common/Icons/edit_icon';
import newsImage from '../../../../assets/img/article.png';
import NewsItem from '../news_tabs/market_tab/news_item';
import {useStyles} from './styles';
import UpdateNewsModal from '../modals/update_news_modal';
import DeleteNewsModal from '../modals/delete_news_modal';
import useFetch from '../../../hooks/useFetch';
import Loader from '../../../common/loader';
import loader from '../../../services/loader';
import { useHistory } from 'react-router';
import parseDate from '../../../utils/parseDate';
import { INews } from '../../../types/global_types';
import DeleteIcon from '../../../common/Icons/delete_icon';

const NewsPageLayout = ({type}:{type:string}) => {
    const {
        wrapper,
        headerWrapper,
        newsDate,
        articleTitle,
        articleText,
        recommendedTitle,
        newsWrapper,
        recommendedWrapper,
        buttons
    } = useStyles()
    const navigator = useHistory()
    const newsId = navigator.location.pathname.split('/').pop()
    const {loading,data} = useFetch(`news/item/${newsId}`)    
    
    const [isOpen, setIsOpen] = useState(false)
    const [isDelete, setIsDelete] = useState(false)

    if(loading || !data?.data){
        return <Loader/>
    }

    const newsItem : INews = data.data

    return (
        <div className='container'>
            <div className={wrapper}>
                <div className={headerWrapper}>
                    <div className={newsDate}>
                        {parseDate(newsItem.date)} • {newsItem.type}
                    </div>
                    <div className={buttons}>
                        <Button
                            onClick={() => setIsOpen(true)}
                            type="outlined"
                        >
                            <EditIcon/>
                        </Button>
                        <Button onClick={() => setIsDelete(true)}>
                            <DeleteIcon/>
                        </Button>
                    </div>
                </div>
                <div className={articleTitle}>
                    {newsItem.title}
                </div>
                <img src={loader(newsItem.image)} alt={newsItem.title}/>
                <div dangerouslySetInnerHTML={{__html:newsItem.text}} className={articleText}>
                </div>
            </div>
            <div  className={recommendedWrapper}>
                <div className={recommendedTitle}>Recommended for you</div>
                <div className={newsWrapper}>
                    {
                        newsItem.recommendationNewsItems?.map((recItem : INews) => {
                            return <NewsItem key={recItem._id} news={recItem}/>
                        })
                    }
                </div>
            </div>
            {
            isOpen 
            ?
            <UpdateNewsModal 
            news={data.data}
            onClose={() => setIsOpen(false)} />
            :
            <></>
            }
            {
            isDelete
            ?
            <DeleteNewsModal
            news={data.data}
            onClose={() => setIsDelete(false)}
            />
            :
            <></>
            }
        </div>
    );
};

export default NewsPageLayout;