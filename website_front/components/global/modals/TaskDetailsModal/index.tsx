import React, { FC, useContext, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../../common/Modal";
import { ITask } from "../../../../types/global_types";
import Button from "../../common/Button";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../helpers/imageFallbacks";
import Typography from "../../common/Typography";
import useDates from "../../../../hooks/useDates";
import { AuthContext, LoadingContext } from "../../Layout";
import Checkbox from "../../common/Checkbox";
import sendTaskToReview from "../../../../http/tasks/sendTaskToReview";
import { sanitizedHtml } from "../../../../helpers/sanitizeHtml";
import {
  Wrapper,
  InfoColumn,
  InfoItem,
  DescriptionWrapper,
  TimeWrapper,
  InfoKey,
  ActionsWrapper,
  InfoRow,
  InfoProject,
  InfoProjectColumn,
  InfoProjectText,
  InfoProjectTitle,
  InfoText,
  TaskStatus,
} from "./styles";

interface IProps {
  isSpecial?: boolean;
  task: ITask | null;
  isVisible: boolean;
  onClose: () => void;
  confirmTaskByUser: (id: string) => void;
}

const TaskDetailsModal: FC<IProps> = ({
  isSpecial,
  task,
  isVisible,
  onClose,
  confirmTaskByUser,
}) => {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [isConfirm, setIsConfirm] = useState<boolean>(false);
  const { days, hours, minutes } = useDates(
    String(task?.date),
    task?.time || "12:00"
  );
  const isCompleted: boolean = !!task?.awardedUsers?.includes(userData?._id);
  const isPending: boolean = !!task?.usersRequests?.includes(userData?._id);
  const confirmSendRequest = async (): Promise<void> => {
    if (!userData.isFullAuth) {
      router.push("/gemslab/profile");
    }

    loadingStateHandler(true);

    const taskId: string = String(task?._id);

    await sendTaskToReview(taskId);

    confirmTaskByUser(taskId);

    loadingStateHandler(false);
    onClose();
  };
  console.log(isPending);
  return isVisible && task ? (
    <Modal variant="small-medium" onClose={onClose} title={task.name}>
      <Wrapper>
        <InfoColumn>
          <InfoRow>
            {!isSpecial && task.project ? (
              <InfoItem>
                <InfoKey>Project</InfoKey>
                <InfoProject onClick={() => window.open(task.link)}>
                  <img
                    src={getProjectImage(task.project?.logo, task.project?.name)}
                    alt={task.project?.name}
                    onError={setProjectImageFallback}
                  />
                  <InfoProjectColumn>
                    <InfoProjectTitle>
                      <Typography variant="p">{task.project?.name}</Typography>
                    </InfoProjectTitle>
                    <InfoProjectText>
                      <Typography variant="p">
                        {task.project?.banner}
                      </Typography>
                    </InfoProjectText>
                  </InfoProjectColumn>
                </InfoProject>
              </InfoItem>
            ) : (
              <></>
            )}
            <InfoItem>
              <InfoKey>Activity XP</InfoKey>
              <InfoText>{task.points}</InfoText>
            </InfoItem>

            {!task.isMissed ? (
              <InfoItem>
                <InfoKey>Time left</InfoKey>
                <TimeWrapper>
                  <i>
                    {days}:{hours > 9 ? hours : `0${hours}`}:
                    {minutes > 9 ? minutes : `0${minutes}`}
                  </i>
                  <span>dd hh mm</span>
                </TimeWrapper>
              </InfoItem>
            ) : (
              <></>
            )}
          </InfoRow>

          <hr />

          <InfoItem>
            <DescriptionWrapper
              dangerouslySetInnerHTML={sanitizedHtml(task.description)}
            />
          </InfoItem>
        </InfoColumn>
        {!isCompleted ? (
          isPending ? (
            <TaskStatus>Pending</TaskStatus>
          ) : task.isMissed ? (
            <TaskStatus>Missed</TaskStatus>
          ) : (
            <ActionsWrapper>
              <Checkbox
                label="The task has been completed, send for review"
                checked={isConfirm}
                onChange={() => setIsConfirm((prev: boolean) => !prev)}
              />
              <Button
                disabled={!isConfirm || task.isMissed}
                variant="primary"
                onClick={() => confirmSendRequest()}
              >
                Сomplete
              </Button>
            </ActionsWrapper>
          )
        ) : isCompleted ? (
          <TaskStatus isActive>Completed</TaskStatus>
        ) : (
          <TaskStatus>{task.isMissed ? "Missed" : "Pending"}</TaskStatus>
        )}
      </Wrapper>
    </Modal>
  ) : (
    <></>
  );
};

export default TaskDetailsModal;
