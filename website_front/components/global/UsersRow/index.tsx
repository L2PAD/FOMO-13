import React, { FC } from "react";
import UserAvatar from "../common/UserAvatar";
import imageLoader from "../../../helpers/imageLoader";
import { AvatarItem, RowWrapper, UsersNumber } from "./styles";

export interface UsersRowInterface {
  users: { image?: string; logo?: string; name: string }[] | any[];
  className?: string;
  onUsersNumberClick?: () => void;
}

const UsersRow: FC<UsersRowInterface> = ({
  users,
  className,
  onUsersNumberClick,
}) => {
  const usersNumber: number = users.length > 5 ? users.length - 5 : 0;
  const isUsersNumberClickable = Boolean(onUsersNumberClick);

  const handleUsersNumberClick = (
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    event.preventDefault();
    event.stopPropagation();
    onUsersNumberClick?.();
  };

  const handleUsersNumberKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ): void => {
    if (!isUsersNumberClickable) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onUsersNumberClick?.();
    }
  };

  return (
    <RowWrapper className={className}>
      {users.map((item, i) => {
        if (i <= 4) {
          return (
            <AvatarItem key={i} style={{ zIndex: i + 1 }}>
              <UserAvatar
                size="xSmall"
                variant="default"
                avatar={imageLoader(item?.logo || item?.image)}
                name={String(item?.name)}
                fallbackType="user"
              />
            </AvatarItem>
          );
        }
        return null;
      })}
      {usersNumber ? (
        <UsersNumber
          $isClickable={isUsersNumberClickable}
          onClick={isUsersNumberClickable ? handleUsersNumberClick : undefined}
          onKeyDown={
            isUsersNumberClickable ? handleUsersNumberKeyDown : undefined
          }
          role={isUsersNumberClickable ? "button" : undefined}
          tabIndex={isUsersNumberClickable ? 0 : undefined}
        >
          +{usersNumber}
        </UsersNumber>
      ) : (
        <></>
      )}
    </RowWrapper>
  );
};

export default UsersRow;
