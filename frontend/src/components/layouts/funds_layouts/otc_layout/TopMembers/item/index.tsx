import React, {useState} from 'react';
import {StarIcon} from '../../../../../../assets'
import {
    ActionsWrapper,
    CommentText,
    CommentWrapper,
    DefaultActionWrapper,
    RatingWrapper,
    ReactionsWrapper,
    StatusWrapper,
    UserData,
    UserDataWrapper
} from '../styles';
import RedFlag from '../../../../../common/Icons/red_flag_icon';
import avatarImage from '../../../../../../assets/img/avatar.png'
import moment from 'moment';
import {STATUS_LIST} from '../../../../../../static_content/dropdowns_data';
import StatusDropdown from '../../../../../common/status_dropdown';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';

const Item = () => {
    const [status, setStatus] = useState(STATUS_LIST.ACTIVE)

    return (
        <CommentWrapper>
            <div>
                <UserDataWrapper>
                    <img src={avatarImage} alt=""/>
                    <UserData>
                        Dr. Laurent El Ghaul
                        <br/>
                        <span>{moment().format('dd.MM.YYYY HH:mm')}</span>
                    </UserData>
                </UserDataWrapper>
                <CommentText>
                    Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.
                </CommentText>
                <ReactionsWrapper>
                    <div>
                        👍 2,5k
                    </div>
                    <div>
                        👎 148
                    </div>
                </ReactionsWrapper>
            </div>
            <ActionsWrapper>
                <DefaultActionWrapper>
                    Revenue

                    <span>
                        $1800000
                    </span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                    Rating:
                    <span>
                        <RedFlag/> 14
                        <RatingWrapper>
                            <StarIcon fill="#FFC702"/>
                            94/100
                        </RatingWrapper>
                    </span>
                </DefaultActionWrapper>
                <DotsButtonWithDropdown items={[
                    {title: 'Give red status', onClick: () => console.log(1)},
                    {title: 'Delete', onClick: () => console.log(1)}
                ]} />
            </ActionsWrapper>
        </CommentWrapper>
    );
};

export default Item;