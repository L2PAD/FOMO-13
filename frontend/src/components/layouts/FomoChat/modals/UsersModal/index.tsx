import React, { FC, useState } from "react";
import { useQuery } from "react-query";
import { useDebounce } from "../../../../hooks/useDebounce";
import UserAvatar from "../../../../common/UserAvatar";
import fetchUsers from "../../../../services/user/fetchUsers";
import { IUser } from "../../../../types/global_types";
import loader from "../../../../services/loader";
import Button from "../../../../common/button";
import CloseIcon from "../../../../common/Icons/close_icon";
import {
  AddUser,
  DeltaWrapper,
  HeaderWrapper,
  ModalWrapper,
  SearchInput,
  UserDataWrapper,
  UserRow,
  UsersWrapper,
} from "./styles";

interface Props {
  className?: string;
  userId?: string;
  title: string;
  btnText: string;
  onConfirm: (user: IUser | null) => void;
  onClose: () => void;
}

const LIMIT = 20;

const UsersModal: FC<Props> = ({
  className,
  title,
  userId,
  btnText = "Confirm",
  onConfirm,
  onClose,
}) => {
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [searchValue, setSearchValue] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [allUsers, setAllUsers] = useState<Array<IUser>>([]);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debouncedSearchValue = useDebounce(searchValue, 500);

  useQuery(
    ["users", debouncedSearchValue, offset],
    async () => {
      setIsLoadingMore(true);
      return fetchUsers(offset, "none", debouncedSearchValue);
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: (newData) => {
        if (offset === 0) {
          setAllUsers(newData.users);
        } else {
          setAllUsers((prev) => [...prev, ...newData.users]);
        }
        setTotal(newData.total);
        setIsLoadingMore(false);
      },
      onError: () => {
        setIsLoadingMore(false);
      },
    }
  );

  const handleLoadMore = () => {
    setOffset((prev) => prev + LIMIT);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setOffset(0);
    setAllUsers([]);
  };

  const hasMore = allUsers.length < total;
  const showEmpty = !isLoadingMore && allUsers.length === 0;

  return (
    <ModalWrapper
      className={className}
      title=""
      onClose={onClose}
      variant="small-medium"
      isTitle={false}
    >
      <HeaderWrapper>
        <div className="header-left">
          <p>{title}</p>
          <DeltaWrapper amount={total || 0} />
        </div>
        <button type="button" className="close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </HeaderWrapper>
      <SearchInput>
        <input
          className="users-input"
          placeholder="Search by name, email, wallet, ID"
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </SearchInput>
      <UsersWrapper className="users-list">
        {allUsers.length > 0 &&
          allUsers.map((item: IUser, i) => (
            <UserRow
              isSelected={item._id === selectedUser?._id}
              onClick={() => setSelectedUser(item)}
              tabIndex={0}
              key={item._id}
            >
              <UserDataWrapper>
                <div style={{ width: 15 }}>{i + 1}</div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={
                    item.photo
                      ? loader(item.photo)
                      : item?.twitterData?.photo || ""
                  }
                  name={item.username || item?.twitterData?.username || "User"}
                />
                <div>
                  <p>{item.username || item?.twitterData?.username}</p>
                  <span>@{item?.twitterData?.username}</span>
                </div>
              </UserDataWrapper>
              <div>{item.points}</div>
            </UserRow>
          ))}
        {showEmpty && (
          <div style={{ padding: "16px 0", textAlign: "center" }}>
            No results
          </div>
        )}
      </UsersWrapper>
      {isLoadingMore || showEmpty ? null : (
        <>
          {hasMore && (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <Button onClick={handleLoadMore} type="bordered">
                Load More
              </Button>
            </div>
          )}
        </>
      )}
      <AddUser className="users-actions">
        <Button
          onClick={() => {
            if (selectedUser) {
              onConfirm(selectedUser);
            }
          }}
          type="fill"
          disabled={!selectedUser}
        >
          {btnText}
        </Button>
      </AddUser>
    </ModalWrapper>
  );
};

export default UsersModal;
