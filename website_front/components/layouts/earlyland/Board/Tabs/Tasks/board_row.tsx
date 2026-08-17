import React, { FC, useMemo, useState } from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import {
  ArrowDownIcon,
  CloseIcon,
  VerticalDotsIcon,
} from "../../../../../global/Icons";
import { IBoard, IUser } from "../../../../../../types/global_types";
import imageLoader from "../../../../../../helpers/imageLoader";
import {
  DeleteButton,
  SearchInput,
  SearchIconStyle,
} from "../../../../gemslab/Portfolio/Analytics/styles";
import {
  BoardInfoWrapper,
  BoardLine,
  BoardRow,
  BoardRowSearch,
  BoardRowUserAction,
  BoardRowUsers,
  BoardRowUsersBtn,
  BoardRowUsersList,
  BoardRowUserWrapper,
  DropdownButtonWrapper,
  ProjectInfo,
  ProjectInfoWrapper,
} from "../../styles";

interface IProps {
  addUsers: () => void;
  selectBoard: (board: IBoard) => void;
  boardData: IBoard;
  isSelected: boolean;
  confirmDeleteBoard: (boardId: string) => Promise<void>;
  confirmExcludeUser: (boardId: string, userId: string) => Promise<void>;
  updateModal: (board: IBoard) => void;
  type?: string;
}

const BoardRowWrapper: FC<IProps> = ({
  boardData,
  isSelected,
  selectBoard,
  confirmDeleteBoard,
  confirmExcludeUser,
  updateModal,
  addUsers,
  type,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUsersList, setIsUsersList] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");

  const filteredUsers: Array<IUser> = useMemo(() => {
    if (!searchValue) return boardData.users;

    return boardData.users.filter((item: IUser) => {
      return (
        item?.username?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
        item?.twitterData?.username
          ?.toLowerCase()
          ?.includes(searchValue.toLowerCase()) ||
        item?.wallet?.toLowerCase().includes(searchValue.toLowerCase())
      );
    });
  }, [searchValue]);

  return (
    <>
      <BoardRow
        onClick={() => selectBoard(boardData)}
        isSelected={isSelected}
        isUsersIncludes={boardData?.users?.length > 0}
      >
        <BoardInfoWrapper>
          <UserAvatar
            size="small"
            variant="default"
            avatar={imageLoader(boardData.img)}
            name="name"
          />
          {boardData.name}
          <BoardLine />
          <ProjectInfoWrapper>
            <img
              src={imageLoader(String(boardData.project?.logo))}
              alt={boardData.project?.name}
            />
            <ProjectInfo>
              <div>{boardData.project?.name}</div>
              <span>{boardData.project?.niche}</span>
            </ProjectInfo>
          </ProjectInfoWrapper>
        </BoardInfoWrapper>
        <DropdownButtonWrapper onMouseLeave={() => setIsOpen(false)}>
          {!type ? (
            <button onClick={() => setIsOpen((state) => !state)}>
              <VerticalDotsIcon />
            </button>
          ) : (
            <></>
          )}
          {isOpen ? (
            <div>
              <button onClick={() => confirmDeleteBoard(boardData._id || "")}>
                Delete
              </button>
              <button
                onClick={() => {
                  updateModal(boardData);
                }}
              >
                Edit
              </button>
              <button onClick={addUsers}>Add users</button>
            </div>
          ) : (
            <></>
          )}
        </DropdownButtonWrapper>
      </BoardRow>
      {boardData?.users?.length ? (
        <BoardRowUsers isOpen={isUsersList}>
          <BoardRowUsersBtn
            isUsersList={isUsersList}
            onClick={() => setIsUsersList((prev: boolean) => !prev)}
          >
            <ArrowDownIcon fill="#00C099" />
            {isUsersList ? "Close" : "Open"} participants list
          </BoardRowUsersBtn>
          <BoardRowUsersList isVisible={isUsersList}>
            <BoardRowSearch>
              <SearchInput
                value={searchValue}
                onChange={(value) => setSearchValue(value)}
                placeholder="Username, X account or Wallet address"
                type="text"
                leftIcon={<SearchIconStyle />}
              />
            </BoardRowSearch>
            {filteredUsers.map((user: IUser) => {
              return (
                <BoardRowUserWrapper key={user?._id}>
                  <BoardInfoWrapper>
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
                      name={user?.username || ""}
                    />
                    {user?.username || user?.twitterData?.username}
                  </BoardInfoWrapper>
                  <BoardRowUserAction>
                    {!type ? (
                      <DeleteButton
                        onClick={() =>
                          confirmExcludeUser(boardData._id, user._id)
                        }
                        title="Exclude user"
                      >
                        <CloseIcon />
                      </DeleteButton>
                    ) : (
                      <></>
                    )}
                  </BoardRowUserAction>
                </BoardRowUserWrapper>
              );
            })}
          </BoardRowUsersList>
        </BoardRowUsers>
      ) : (
        <></>
      )}
    </>
  );
};

export default BoardRowWrapper;
