import newsImage from '../../../../../../assets/img/article.png'
import moment from 'moment';
import {useStyles} from './styles';
import {Link} from 'react-router-dom';
import { INews } from '../../../../../types/global_types';
import loader from '../../../../../services/loader';
import parseDate from '../../../../../utils/parseDate';

const NewsItem = ({news}:{news:INews}) => {
    const {
        wrapper,
        articleDate,
        articleTitle,
        articleText,
    } = useStyles()

    return (
        <Link to={`news/${news._id}`} className={wrapper}>
            <img src={loader(news?.image)} alt=""/>
            <div className={articleDate}>
                {parseDate(news.date,2)} • {news.type ? news.type : '-'}
            </div>
            <div className={articleTitle}>
                {news.title}    
            </div>
            <div className={articleText} dangerouslySetInnerHTML={{ __html: news.text }}>
            </div>
        </Link>
    );
};

export default NewsItem;