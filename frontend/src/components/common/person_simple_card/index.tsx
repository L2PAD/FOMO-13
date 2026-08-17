import {FC} from 'react';
import avatarImage from '../../../assets/img/avatar.png'
import {useStyles} from './styles';
import {Link} from 'react-router-dom';
import { Investor } from '../../hooks/useCreateProject';
import loader from '../../services/loader';

interface IProps {
    item?:Investor
}

const PersonSimpleCard : FC<IProps> = ({item}) => {
    const {
        wrapper,
        imageWrapper,
        ratingWrapper,
        titleWrapper,
        descWrapper,
    } = useStyles()

    if(!item) return <></>

    return (
        <Link to={`/projects/person/${item._id}`} className={wrapper}>
            <div className={imageWrapper}>
                {
                    typeof item.logo === 'string'
                    ?
                    <img src={loader(item.logo)} alt={item.name}/>
                    :
                    <img src={avatarImage} alt={item.name}/>
                }
                <div className={ratingWrapper}>{item.rating || '0'}</div>
            </div>
            <div>
                <div className={titleWrapper}>
                    {item.name}
                </div>
                <div className={descWrapper}>
                    {item.banner || '-'}
                </div> 
            </div>
        </Link>
    );
};

export default PersonSimpleCard;