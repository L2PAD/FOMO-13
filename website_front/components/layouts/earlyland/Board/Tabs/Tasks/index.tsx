import React, { FC, useContext, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import {
  IBoard,
  IBoardTask,
  IUser,
} from "../../../../../../types/global_types";
import { LoadingContext } from "../../../../../global/Layout";
import SimpleDropdown from "../../../../../global/SimpleDropdown";
import Task from "../../../../../global/Tasks/Task";
import CreateBoardModal from "../../../modals/CreateBoardModal";
import CreateTaskModal from "../../../modals/CreateTaskModal";
import UpdateBoardModal from "../../../modals/UpdateBoardModal";
import UpdateTaskModal from "../../../modals/UpdateTaskModal";
import BoardRowWrapper from "./board_row";
import fetchBoards from "../../../../../../http/board/fetchBoards";
import deleteTask from "../../../../../../http/board/deleteTask";
import deleteBoard from "../../../../../../http/board/deleteBoard";
import updateBoardTasks from "../../../../../../http/board/updateBoardTasks";
import BoardUserListModal from "../../../../../global/modals/BoardUsersListModal/index";
import createInvite from "../../../../../../http/invites/createInvite";
import {
  SearchIconStyle,
  SearchInput,
} from "../../../../gemslab/Portfolio/Analytics/styles";
import excludeUser from "../../../../../../http/invites/excludeUser";
import EmptyList from "../../../../../global/EmptyList";
import {
  AddBoardButton,
  AddTaskButton,
  BoardTypesWrapper,
  Circle,
  EmptyListWrapper,
  TabTitle,
  TasksColumn,
  TasksColumnWrapper,
  TasksWrapper,
} from "../../styles";

interface IProps {
  type?: string;
}

const TasksTab: FC<IProps> = ({ type }) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const { data, refetch } = useQuery(
    ["boards", type],
    () => fetchBoards(type),
    {
      onSuccess: ({ boards }: { boards: Array<IBoard> }) => {
        if (boards.length) {
          setSelectedBoard(boards[0]);
        } else {
          setSelectedBoard(undefined);
        }
      },
      refetchOnWindowFocus: false,
    }
  );
  const [selectedBoard, setSelectedBoard] = useState<IBoard | undefined>();
  const [columnIndex, setColumnIndex] = useState<0 | 1 | 2>(0);
  const [searchValue, setSearchValue] = useState("");
  const [createBoardModal, setCreateBoardModal] = useState<boolean>(false);
  const [addUsersModal, setAddUsersModal] = useState<boolean>(false);
  const [isCreateTaskModal, setIsCreateTaskModal] = useState<boolean>(false);
  const [isUpdateBoardModal, setIsUpdateBoardModal] = useState<boolean>(false);
  const [updateBoardData, setUpdateBoardData] = useState<IBoard | undefined>();
  const [isUpdateTaskModal, setIsUpdateTaskModal] = useState<boolean>(false);
  const [updateTaskData, setUpdateTaskData] = useState<
    IBoardTask | undefined
  >();
  const [currentTask, setCurrentTask] = useState<any>(null);

  const confirmDeleteBoard = async (boardId: string): Promise<void> => {
    const { isSuccess } = await deleteBoard(boardId);

    await refetch();
  };

  const confirmDeleteTask = async (taskId: string): Promise<void> => {
    const { isSuccess } = await deleteTask(taskId);

    await refetch();
  };

  const confirmExcludeUser = async (
    boardId: string,
    userId: string
  ): Promise<void> => {
    loadingStateHandler(true);

    const { isSuccess } = await excludeUser(boardId, userId);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>The user has been excluded!</p>
        </div>
      );
      refetch();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Something went wrong...</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const createTaskModalHandler = (index: any): void => {
    setColumnIndex(index);
    setIsCreateTaskModal((prev: boolean) => !prev);
  };

  const dragOverHandler = (e: any) => {
    e.preventDefault();

    if (e.target.className === "task-item") {
      e.target.style.borderBottom = "3px solid black";
    }
  };

  const dragLeaveHandler = (e: any) => {
    e.target.style.borderBottom = "none";
  };

  const dragEndHandler = (e: any) => {
    e.target.style.borderBottom = "none";
  };

  const dragStartHandler = (e: any, board: any, item: any) => {
    setCurrentTask(item);
  };

  const dropHandler = (e: any, board: any, item: any): void => {
    if (!selectedBoard) return;

    // const updatedColumns = selectedBoard.columns.map((column:{name:string,tasks:Array<IBoardTask>,index}) => {

    // })

    // setSelectedBoard()
  };

  const dropCardHandler = async (e: any, board: any) => {
    if (!selectedBoard) return;

    const oldColumn: { name: string; tasks: Array<IBoardTask> } | undefined =
      selectedBoard?.columns.find(
        (value: { name: string; tasks: Array<IBoardTask> }) => {
          return value.tasks.find(
            (item: IBoardTask) => item._id === currentTask._id
          );
        }
      );

    if (oldColumn?.name === board.name) return;

    const updatedBoard: IBoard = {
      ...selectedBoard,
      columns:
        selectedBoard?.columns.map(
          (column: { name: string; tasks: Array<IBoardTask> }) => {
            if (column.name === oldColumn?.name) {
              return {
                ...column,
                tasks: column.tasks.filter(
                  (item: IBoardTask) => item._id !== currentTask._id
                ),
              };
            }
            if (column.name === board.name) {
              return {
                ...column,
                tasks: [currentTask, ...column.tasks],
              };
            }

            return column;
          }
        ) || [],
    };

    setSelectedBoard(updatedBoard);

    await updateBoardTasks(
      {
        name: updatedBoard.name,
        columns: updatedBoard.columns
          ? updatedBoard.columns.map(
              (item: { name: string; tasks: Array<IBoardTask> }) => {
                return {
                  name: item.name,
                  tasks: item.tasks.map((item: IBoardTask) => String(item._id)),
                };
              }
            )
          : [],
      },
      String(selectedBoard._id)
    );
  };

  const confirmAddUsers = async (users: Array<string>): Promise<any> => {
    if (!users.length) return;

    loadingStateHandler(true);

    const { isSuccess } = await createInvite({
      users,
      boardId: String(selectedBoard?._id),
    });

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>
            Invite sent to {users.length} {users.length > 1 ? "users" : "user"}
          </p>
        </div>
      );
      refetch();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Something went wrong...</p>
        </div>
      );
    }

    setAddUsersModal(false);
    loadingStateHandler(false);
  };

  const filteredBoard: Array<IBoard> = useMemo(() => {
    if (!data?.boards || !Array.isArray(data?.boards)) return [];

    return (
      data?.boards?.filter((item: IBoard) =>
        item.name.toLowerCase().includes(searchValue.toLowerCase())
      ) || []
    );
  }, [searchValue, data?.boards]);

  return (
    <TasksWrapper>
      {type === "invited" ? (
        <></>
      ) : (
        <AddBoardButton onClick={() => setCreateBoardModal(true)}>
          + Create board
        </AddBoardButton>
      )}
      <TasksColumnWrapper>
        <br />
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
        <br />
        {filteredBoard?.length ? (
          filteredBoard.map((item: IBoard) => {
            return (
              <BoardRowWrapper
                key={item._id}
                addUsers={() => {
                  setAddUsersModal(true);
                  setUpdateBoardData(item);
                }}
                updateModal={(board: IBoard) => {
                  setUpdateBoardData(board);
                  setIsUpdateBoardModal(true);
                }}
                confirmDeleteBoard={confirmDeleteBoard}
                confirmExcludeUser={confirmExcludeUser}
                selectBoard={(board: IBoard) => setSelectedBoard(board)}
                isSelected={selectedBoard?._id === item._id}
                boardData={item}
                type={type}
              />
            );
          })
        ) : (
          <></>
        )}
      </TasksColumnWrapper>
      {selectedBoard?.columns?.length ? (
        selectedBoard.columns.map(
          (board: { name: string; tasks: Array<IBoardTask> }, columnIndex) => {
            return (
              <TasksColumnWrapper key={columnIndex}>
                <TabTitle>
                  <Circle
                    bg={
                      columnIndex === 0
                        ? "#FF5858"
                        : columnIndex === 1
                          ? "#FFC702"
                          : "#00C099"
                    }
                  />
                  {board.name}
                </TabTitle>
                <TasksColumn
                  onDragOver={(e: any) => dragOverHandler(e)}
                  onDrop={(e: any) => dropCardHandler(e, board)}
                >
                  {board?.tasks?.map((item: IBoardTask) => {
                    return (
                      <Task
                        updateModal={() => {
                          setUpdateTaskData(item);
                          setIsUpdateTaskModal(true);
                        }}
                        confirmDeleteTask={confirmDeleteTask}
                        onDragOver={(e: any) => dragOverHandler(e)}
                        onDragLeave={(e: any) => dragLeaveHandler(e)}
                        onDragEnd={(e: any) => dragEndHandler(e)}
                        onDragStart={(e: any) =>
                          dragStartHandler(e, board, item)
                        }
                        onDrop={(e: any) => dropHandler(e, board, item)}
                        key={item._id}
                        id={item._id}
                        title={item.title}
                        description={item.description}
                        img={item.img}
                      />
                    );
                  })}
                  <AddTaskButton
                    onClick={() => createTaskModalHandler(columnIndex)}
                  >
                    + Add a task
                  </AddTaskButton>
                </TasksColumn>
              </TasksColumnWrapper>
            );
          }
        )
      ) : (
        <EmptyListWrapper>
          <EmptyList />
        </EmptyListWrapper>
      )}
      {createBoardModal ? (
        <CreateBoardModal
          refetch={refetch}
          onClose={() => setCreateBoardModal(false)}
        />
      ) : (
        <></>
      )}
      {isUpdateBoardModal ? (
        <UpdateBoardModal
          boardData={updateBoardData}
          refetch={refetch}
          onClose={() => setIsUpdateBoardModal(false)}
        />
      ) : (
        <></>
      )}
      {isCreateTaskModal ? (
        <CreateTaskModal
          isInvitedUser={type === "invited"}
          refetch={refetch}
          boardId={selectedBoard?._id || ""}
          index={columnIndex}
          onClose={() => createTaskModalHandler(0)}
        />
      ) : (
        <></>
      )}
      {isUpdateTaskModal ? (
        <UpdateTaskModal
          isInvitedUser={type === "invited"}
          taskData={updateTaskData}
          refetch={refetch}
          boardId={selectedBoard?._id || ""}
          index={columnIndex}
          onClose={() => setIsUpdateTaskModal(false)}
        />
      ) : (
        <></>
      )}
      {addUsersModal ? (
        <BoardUserListModal
          itemId={String(selectedBoard?._id)}
          onSubmit={confirmAddUsers}
          title="FOMO Users"
          onClose={() => setAddUsersModal(false)}
        />
      ) : (
        <></>
      )}
    </TasksWrapper>
  );
};

export default TasksTab;
