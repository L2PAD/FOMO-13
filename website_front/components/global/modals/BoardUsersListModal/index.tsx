import React, { FC, useContext, useMemo, useState } from "react";
import { useQuery } from "react-query";
import ResponsivePagination from "react-responsive-pagination";
import fetchUsers from "../../../../http/user/fetchUsers";
import UserAvatar from "../../common/UserAvatar";
import Typography from "../../common/Typography";
import { PaginationWrapper } from "../../Pagintaion/styles";
import Button from "../../common/Button";
import { IUser } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import { CloseIcon } from "../../Icons";
import {
  SearchWrapper,
  SearchInput,
} from "../../../layouts/projects/P2PExchange/styles";
import { SearchIconStyle } from "../../Navigation/styles";
import sliceAddress from "../../../../helpers/sliceAddress";
import { AuthContext } from "../../Layout";
import {
  ButtonWrapper,
  ModalWrapper,
  SelectedUserItem,
  SelectedUserWrapper,
  UserDataWrapper,
  UserRow,
  UsersWrapper,
} from "./styles";

interface Props {
  itemId: string;
  onSubmit: any;
  onClose: () => void;
  title: string;
}

const LIMIT = 20;

const BoardUserListModal: FC<Props> = ({
  onClose,
  title,
  onSubmit,
  itemId,
}) => {
  const { userData } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState<Array<IUser>>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Array<IUser>>([]);
  const [total, setTotal] = useState(0);
  const { data } = useQuery(
    ["users-modal", total, userData, itemId],
    () => fetchUsers(total, itemId),
    {
      onSuccess: ({ users }) => {
        setAllUsers(
          users.filter((user: IUser) => {
            return user._id !== userData?._id;
          })
        );
      },
    }
  );

  const selectedUserHandler = (userData: IUser) => {
    setSelectedUsers((prev: Array<IUser>) => {
      const isIncludes: boolean = !!prev.find((user: IUser) => {
        return user._id === userData._id;
      });

      if (isIncludes)
        return prev.filter((item: IUser) => item._id !== userData._id);

      return [...prev, userData];
    });
  };

  const filteredUsers: Array<IUser> = useMemo(() => {
    if (!allUsers) return [];

    if (!searchValue) return allUsers;

    return allUsers.filter((item: IUser) => {
      return (
        item?.username?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
        item?.twitterData?.username
          ?.toLowerCase()
          ?.includes(searchValue.toLowerCase()) ||
        item?.wallet?.toLowerCase().includes(searchValue.toLowerCase())
      );
    });
  }, [searchValue, allUsers]);

  return (
    <ModalWrapper title={title} onClose={onClose} variant="small-medium">
      <SearchWrapper>
        <SearchInput
          type="text"
          value={searchValue}
          onChange={(value: string) => setSearchValue(value)}
          placeholder="Username, X account or Wallet address"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <SelectedUserWrapper>
        {selectedUsers ? (
          selectedUsers.map((item: IUser) => {
            return (
              <SelectedUserItem
                key={item._id}
                onClick={() => selectedUserHandler(item)}
              >
                <span>{item.username || item.twitterData?.username}</span>
                <CloseIcon />
              </SelectedUserItem>
            );
          })
        ) : (
          <></>
        )}
      </SelectedUserWrapper>
      <UsersWrapper>
        {filteredUsers.map((user: IUser, i: number) => {
          return (
            <UserRow
              onClick={() => selectedUserHandler(user)}
              tabIndex={0}
              key={i}
            >
              <UserDataWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={
                    user.photo
                      ? imageLoader(user.photo)
                      : user?.twitterData?.photo
                        ? user.twitterData.photo
                        : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  }
                  name="name"
                />
                <div>
                  <p>{user.username}</p>
                  {user?.twitterData?.username ? (
                    <span>@{user.twitterData.username}</span>
                  ) : (
                    <></>
                  )}
                </div>
              </UserDataWrapper>
              <span>{sliceAddress(user.wallet)}</span>
            </UserRow>
          );
        })}
      </UsersWrapper>
      <ButtonWrapper>
        <Button
          onClick={() =>
            onSubmit(
              selectedUsers
                ? selectedUsers.map((item: IUser) => {
                    return String(item._id);
                  })
                : []
            )
          }
          variant="primary"
        >
          Add {selectedUsers && selectedUsers?.length > 1 ? "users" : "user"}
        </Button>
      </ButtonWrapper>
      {/* <PaginationWrapper>
        <div>
          <ResponsivePagination
            current={page}
            total={totalPage}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
        <Typography variant="p">
          {LIMIT} of {total || 0}
        </Typography>
      </PaginationWrapper> */}
    </ModalWrapper>
  );
};

export default BoardUserListModal;
