import React from 'react';
import moment from 'moment';
import avatarImage from '../../../../../../assets/img/avatar.png'
import {useStyles} from './styles';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';

const PubItem = () => {
    const {
        wrapper,
        header,
        userDataWrapper,
        userName,
        pubDate,
        text,
        reaction,
        reactionWrapper,
        chosenReaction,
    } = useStyles()

    return (
        <div className={wrapper}>
            <div className={header}>
                <div className={userDataWrapper}>
                    <img src={avatarImage} alt=""/>
                    <div>
                        <div className={userName}>
                            Dr. Laurent El Ghaul
                        </div>
                        <div className={pubDate}>
                            {moment().format('DD.MM.YYYY HH:mm')}
                        </div>
                    </div>
                </div>
                <div>
                    <DotsButtonWithDropdown items={[
                        {title: 'Give red status', onClick: () => console.log(1)},
                        {title: 'Delete', onClick: () => console.log(1)}
                    ]} />
                </div>
            </div>
            <div className={text}>
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis
                enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
                ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.
            </div>
            <div className={reactionWrapper}>
                <div className={chosenReaction}>
                    👍 2,5k
                </div>
                <div className={reaction}>
                    👎 148
                </div>
            </div>
        </div>
    );
};

export default PubItem;