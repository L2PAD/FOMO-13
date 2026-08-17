import React, {FC} from 'react';
import loader from '../../services/loader';
// import imageLoader from '../../../helpers/imageLoader';
import {AvatarItem, RowWrapper} from "./styles";
import UserAvatar from '../UserAvatar';

export interface UsersRowInterface {
    users: {logo: string, name: string}[] | any[];
    className?: string;
}

const UsersRow: FC<UsersRowInterface> = ({users, className}) => {

    return (
        <RowWrapper className={className}>
            {users.map((item, i) => {
                if (i <= 4) {
                    return (
                        <AvatarItem 
                        key={i}
                        style={{zIndex: i + 1}}>
                            <UserAvatar
                                size="xSmall"
                                variant="default"
                                avatar={loader(String(item?.logo))}
                                name={String(item?.name)}
                            />
                        </AvatarItem>
                    )
                }
                return null;
            })}
        </RowWrapper>
    );
};

export default UsersRow;