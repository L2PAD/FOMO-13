import { useStyles } from "./styles"
import avatarImage from '../../../../assets/img/avatar.png'
import DotsButtonWithDropdown from "../../../common/dots_button_with_dropdown"
import { IComment } from "../../../types/global_types"
import { FC } from 'react';
import parseDate from "../../../utils/parseDate";
import loader from "../../../services/loader";

interface IProps {
  comment:IComment
  deleteComment? : (commemt:IComment,id:string | undefined) => void
}

const Comment : FC<IProps> = ({comment,deleteComment}) => {
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
    <div className={commentWrapper}>
    <div className={commentHeaderWrapper}>
        <div className={commentLeftHeaderWrapper}>
          {
            typeof comment.author[0].photo === 'string' || comment.author[0].twitterData.photo
            ?
            <img
            src={
              comment.author[0].photo
              ?
              loader(comment.author[0].photo)
              :
              comment.author[0].twitterData.photo
            }
            className={commentUserAvatar}
            />
            :
            <img
                src={avatarImage}
                className={commentUserAvatar}
            />
          }
            
            <div>
                <div className={commentUserName}>
                  {comment.author[0].username || comment.author[0].email}
                </div>
                <div className={commentDate}>
                  {parseDate(new Date(comment.date),1)}
                </div>
            </div>
        </div>
        <div>
            <DotsButtonWithDropdown items={[
                {title: 'Delete', onClick: () => deleteComment && deleteComment(comment,comment._id)}
            ]} />
        </div>
    </div>
    <div className={commentText}>
        {comment.text}
    </div>
</div>
  )
}

export default Comment