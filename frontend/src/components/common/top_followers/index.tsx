import {FC} from 'react';
import TwitterIcon from '../Icons/twitter_icon';
import {useStyles} from './styles';
import avatarImage from '../../../assets/img/avatar.png'

interface IProps {
    followers?:Array<any>
}

const TopFollowers : FC<IProps> = ({followers}) => {
    const {
        headerWrapper,
        subsWrapper,
        subsItem,
    } = useStyles()

    return (
        <div>
            <div className={headerWrapper}>
                <TwitterIcon /> Top Followers
            </div>
            <div className={subsWrapper}>
                {
                    followers?.length
                    ?
                    followers.map((follower) => {
                        return (
                        <div key={follower._id} className={subsItem}>
                            <img src={avatarImage} alt=""/>
                            John Doe
                        </div>
                        )
                    })
                    :
                    <>No followers</>
                }
            </div>
        </div>
    );
};

export default TopFollowers;