import React, { FC } from "react";
import { useRouter } from "next/router";
import changeDateType from "../../../../helpers/changeDateType";
import styles from "./table-item.module.scss";
import { IProject } from "../../../../types/global_types";

const TableItem: FC<{ item: IProject }> = ({ item }) => {
  const router = useRouter();

  const confirmClaim = async () => {
    router.push(`/gemslab/launch/sale/${item._id}`);
  };

  return (
    <div className={styles.item}>
      <div className={styles.body}>
        <span className={styles.bold}>{item.name}</span>
        <span className={styles.bold}>{item.investValue || 0}$</span>
        <div className={styles.statys}>
          {item.isClaimStart ? (
            <span className={styles.unlocked}>Unlocked</span>
          ) : (
            <span className={styles.locked}>Locked</span>
          )}
        </div>
        <span>${item.investValue}</span>
        <span>{item.claimValue}</span>
        <div className={styles.mobileDates}>
          <span className={styles.mobileDate}>
            {changeDateType(item.greenDate)} {item.greenTimeStart}
          </span>
          <span className={styles.mobileDate}>
            {changeDateType(item.distributionStart)}{" "}
            {item.distributionTimeStart}
          </span>
        </div>
        <span className={styles.date}>
          {changeDateType(item.greenDate)} {item.greenTimeStart}
        </span>
        <span className={styles.date}>
          {changeDateType(item.distributionStart)} {item.distributionTimeStart}
        </span>
        <button
          onClick={confirmClaim}
          disabled={item.isClaimed || !item.isClaimStart}
          className={
            item.isClaimed ? `${styles.btn} ${styles.claimed}` : styles.btn
          }
        >
          {item.isClaimed ? "Claimed" : "Claim"}
        </button>
      </div>
      <hr className={styles.line} />
    </div>
  );
};

export default TableItem;
