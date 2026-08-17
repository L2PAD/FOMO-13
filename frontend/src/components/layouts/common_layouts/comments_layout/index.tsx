import {FC,useState} from 'react';
import Button from '../../../common/button';
import avatarImage from '../../../../assets/img/avatar.png'
import {useStyles} from './styles';
import moment from 'moment';
import DotsButtonWithDropdown from '../../../common/dots_button_with_dropdown';
import { IComment, IUser } from '../../../types/global_types';
import getUserData from '../../../utils/getUserData';
import Comment from '../comment';

interface IProps {
    comments?: Array<IComment>
    addComment? : (comment: IComment) => void
    deleteComment? : (commemt:IComment,id:string) => void
}

const CommentsLayout : FC<IProps> = ({comments,addComment,deleteComment}) => {
    const [text,setText] = useState<string>('')

    const confirmDeleteComment = (comment:IComment) : void => {
        deleteComment && deleteComment(comment,comment._id || '')
    }

    const confrimAddComment = () : void => {
        const user : IUser = getUserData()

        const comment : IComment = {
            text:text,
            date:new Date(),
            authorId:user._id,
            author:[user]
        }

        setText('')
        addComment && addComment(comment)
    }

    const {
        title,
        contentWrapper,
        commentsWrapper,
        commentWrapper,
        commentHeaderWrapper,
        commentLeftHeaderWrapper,
        commentUserAvatar,
        commentUserName,
        commentDate,
        commentText,
        newCommentWrapper,
    } = useStyles()

    return (
        <div>
            <div className={title}>
                Comments
            </div>
            <div className={contentWrapper}>
                <div className={commentsWrapper}>
                    {
                        comments?.length
                        ?
                        comments.map((comment:IComment,index) => {
                            return (
                               <Comment 
                               key={index} 
                               deleteComment={confirmDeleteComment}
                               comment={comment}/>
                            )
                        })
                        :
                        <>No comments...</>
                    }
                </div>
                <div className={newCommentWrapper}>
                    <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder='Your comment'/>
                    <Button
                        onClick={confrimAddComment}
                        type='fill'
                    >
                        Add comment
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CommentsLayout;