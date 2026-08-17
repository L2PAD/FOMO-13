import React, { FC, useContext, useEffect, useState } from "react";
import Image from "next/image";
import AllIcon from "../../../../../../assets/icons/all-sort.svg";
import { cardVariants } from "../../../../projects/Calendar/TaskItem/TaskItem";
import { Body, Header, Item, ItemInfo, MiddleWrapper, Wrapper } from "./styles";
import ProgressBar from "../../../../../global/common/ProgressBar";
import { OrText } from "../../../modals/AddAssetModal/styles";
import { useQuery } from "react-query";
import fetchTasks from "../../../../../../http/tasks/fetchTasks";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import { AuthContext } from "../../../../../global/Layout";
import { TaskStatus } from "../../../../../../types/global_types";
import getComments from "../../../../../../http/comments/getComments";
import OtherWalletContent from "../../../../../global/modals/ConnectWalletModal/OtherWalletContent";
import claimTask from "../../../../../../http/tasks/claimTask";
import { Button } from "../../../../../global/common/Button";
import { toast } from "react-toastify";
import EmptyList from "../../../../../global/EmptyList";
import { useTranslation } from "i18n";

interface IProps {}

const CoreTasks: FC<IProps> = () => {
  const { translateText } = useTranslation();
  const { userData, refetchAuthData } = useContext(AuthContext);
  const { data, isLoading, refetch } = useQuery("core-tasks", () => {
    return fetchTasks(`special?userId=${userData?._id}`);
  });
  const [selectedType, setSelectedType] = useState<string>("all");

  const getTaskStatus = (item: any): TaskStatus => {
    if (item?.value >= item?.goal) return "completed";
    if (item?.value > 0) return "in progress";
    return "not started";
  };

  const getTaskIndex = (item: any): 0 | 7 | 8 => {
    const status = getTaskStatus(item);
    switch (status) {
      case "in progress":
        return 0;
      case "not started":
        return 7;
      case "completed":
        return 8;
      default:
        return 0;
    }
  };

  const getProgressValue = (item: any): number => {
    if (!item?.goal || item?.goal === 0) return 0;
    const progress = ((item.value || 0) / item.goal) * 100;
    return Math.ceil(Math.min(100, Math.max(0, progress)));
  };

  const getLeftKeyByType = (key: string): string => {
    switch (key) {
      case "comments":
        return translateText("Comments");
      case "hoursOnline":
        return translateText("Spent");
      case "refLvlOne":
        return translateText("Invited");
      case "deals":
        return translateText("NFT Deal");
      case "portfolioBalance":
        return translateText("Reached");
      default:
        return "";
    }
  };

  const getLabelByType = (key: string): string => {
    switch (key) {
      case "comments":
      case "hoursOnline":
      case "refLvlOne":
      case "deals":
        return "";
      case "portfolioBalance":
        return "$";
      default:
        return "";
    }
  };

  const confirmClaim = async (id: string): Promise<void> => {
    const { isSuccess } = await claimTask(id);

    if (isSuccess) {
      refetchAuthData();
      toast.success(
        <div>
          <h4>{translateText("Success!")}</h4>
          <p>{translateText("The task has been successfully claimed.")}</p>
        </div>
      );
    }
  };

  const checkClaim = (task: any): null | { taskId: string; date: string } => {
    const status = getTaskStatus(task);
    if (status !== "completed" || !userData?.claimedTasks?.length) return null;
    return userData.claimedTasks.find((item: any) => item.taskId === task._id);
  };

  const filteredTasks = data?.tasks.filter((item: any) => {
    const status = getTaskStatus(item);

    if (selectedType === "all") return true;
    if (selectedType === "completed" && status === "completed") return true;
    if (selectedType === "progress" && status === "in progress") return true;
    if (selectedType === "started" && status === "not started") return true;

    return false;
  });

  return (
    <Wrapper>
      <Header>
        <h2>{translateText("Core Tasks")}</h2>
        <div className="buttons">
          <button
            className={selectedType === "all" ? "selectedSort" : ""}
            onClick={() => setSelectedType("all")}
          >
            <Image src={AllIcon} alt="all" />
            <span>{translateText("All")}</span>
          </button>
          <button
            className={selectedType === "completed" ? "selectedSort" : ""}
            onClick={() => setSelectedType("completed")}
          >
            <span>{translateText("Completed")}</span>
          </button>
          <button
            className={selectedType === "progress" ? "selectedSort" : ""}
            onClick={() => setSelectedType("progress")}
          >
            <span>{translateText("In Progress")}</span>
          </button>
          <button
            className={selectedType === "started" ? "selectedSort" : ""}
            onClick={() => setSelectedType("started")}
          >
            <span>{translateText("Not Started")}</span>
          </button>
        </div>
      </Header>
      <Body>
        {isLoading ? (
          <PlaceholderTable />
        ) : filteredTasks?.length ? (
          filteredTasks?.map((item: any, i: number) => {
            const status = getTaskStatus(item);
            const isClaimed = checkClaim(item);

            return (
              <Item
                style={{ background: cardVariants[getTaskIndex(item)].bgColor }}
                key={i}
              >
                <div
                  style={{
                    background: cardVariants[getTaskIndex(item)].borderColor,
                  }}
                  className="border"
                />
                <ItemInfo>
                  <div
                    style={{
                      color: cardVariants[getTaskIndex(item)].textColor,
                    }}
                    className="xp-info"
                  >
                    +{item.points} XP
                  </div>
                  <MiddleWrapper>
                    <div
                      style={{
                        color: cardVariants[getTaskIndex(item)].textColor,
                      }}
                      className="item-description"
                    >
                      {item.name}
                    </div>
                    {isClaimed ? (
                      <Button
                        disabled
                        className="claim-btn"
                        variant="secondary"
                      >
                        {translateText("Claimed")}
                      </Button>
                    ) : status === "completed" ? (
                      <Button
                        onClick={() => confirmClaim(item._id)}
                        className="claim-btn"
                        variant="outlined"
                      >
                        {translateText("Claim")}
                      </Button>
                    ) : null}
                  </MiddleWrapper>
                </ItemInfo>
                <ProgressBar
                  className="core-tasks"
                  low={item.value || 0}
                  middle={getProgressValue(item)}
                  middleKey={translateText("Completed")}
                  high={item.goal}
                  progress={getProgressValue(item)}
                  leftKey={getLeftKeyByType(item.validationKey)}
                  rightKey={translateText("Goal")}
                  leftLabel={getLabelByType(item.validationKey)}
                  rightLabel={getLabelByType(item.validationKey)}
                  keyColor={cardVariants[getTaskIndex(item.status)].textColor}
                />
              </Item>
            );
          })
        ) : (
          <>
            <br />
            <EmptyList />
          </>
        )}
      </Body>
    </Wrapper>
  );
};

export default CoreTasks;
