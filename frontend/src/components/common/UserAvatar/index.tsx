import React, {FC} from 'react';
import {Avatar, AvatarWrapper, RatingWrapper} from "./styles";

export interface UserAvatarInterface {
    size: 'xSmall' | 'small' | 'medium' | 'big' | 'giant' | 'project';
    variant: 'default' | 'warn' | 'success' | 'error' | 'none';
    rating?: number;
    avatar: string;
    name: string;
    className?: string;
}

const UserAvatar: FC<UserAvatarInterface> = (
    {
        size,
        variant,
        rating,
        avatar,
        name,
        className,
    },
) => {

    return (
        <AvatarWrapper
            className={className}
            size={size}
        >
            <Avatar
                src={avatar}
                alt={name}
                size={size}
                variant={variant}
            />
            {/* {rating && variant !== 'default' && <RatingWrapper
                size={size}
                variant={variant}
            >
                {rating}
            </RatingWrapper>} */}
        </AvatarWrapper>
    );
};

export default UserAvatar;