import React, { FC, useContext, useState } from "react";
import { useQuery } from "react-query";
import TableItem from "../tableItem/TableItem";
import { IProject } from "../../../../types/global_types";
import { AuthContext } from "../../../global/Layout";
import fetchProjects from "../../../../http/projects/fetchProjects";
import { getUserClaimValue } from "../../../../smart/initialSmartMain";
import styles from "./staking-table.module.scss";

interface IProps {
  height?: string;
  boxShadow?: string;
}

const StakingTable: FC<IProps> = ({
  height = "343",
  boxShadow = "4px 4px 10px #eeeeee",
}) => {
  const { userData } = useContext(AuthContext);
  const [projects, setProjects] = useState<Array<IProject>>([]);
  const { isLoading } = useQuery(
    "investedProjects",
    () => fetchProjects("invest/user"),
    {
      onSuccess: async (data) => {
        const items: Array<IProject> = [];

        for (let i = 0; i < data?.projects?.length; i++) {
          const item: IProject = data?.projects[i];

          const { claimValue, userInvest, isClaim } = await getUserClaimValue(
            item.poolId || -1,
            userData.wallet
          );

          items.push({
            ...item,
            isClaimed: checkIsClaimed(item._id || ""),
            investValue: userInvest,
            claimValue,
          });
        }

        setProjects(items);
      },
    }
  );

  const checkIsClaimed = (projectId: string): boolean => {
    return !!userData.claimedProjects?.find(
      (item: string) => item === projectId
    );
  };

  return (
    <div style={{ boxShadow }} className={styles.table}>
      <div className={styles.head}>
        <span>Project</span>
        <span>Your investment</span>
        <span>Status</span>
        <span>Locked</span>
        <span>Claimed</span>
        <span>Invest Date</span>
        <span>Unlock Date</span>
        <span>Action</span>
      </div>
      <div style={{ height: `${height}px` }} className={styles.body}>
        {projects.map((item: IProject, index: number) => {
          return <TableItem key={index} item={item} />;
        })}
      </div>
    </div>
  );
};

export default StakingTable;
