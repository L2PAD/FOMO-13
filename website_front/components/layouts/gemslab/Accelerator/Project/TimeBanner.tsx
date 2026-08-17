import React, { useState, useEffect, FC } from "react";
import useTimer from "../../../../../hooks/useTimerWithTime";
import styles from "./styles/time-banner.module.scss";

const TimeBanner: FC<any> = ({
  steps,
  date,
  time,
  currentStep,
  changeStep,
  projectName,
  isRefunded,
}) => {
  const [data, setData] = useState<any>({});
  const { days, hours, minutes, seconds } = useTimer(date, time);

  useEffect(() => {
    setData({ days, hours, minutes, seconds });
  }, [days, hours, minutes, seconds]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.body}>
        {isRefunded ? (
          <div className={styles.title}>{projectName} sales ended</div>
        ) : (
          <div className={styles.title}>{projectName} sales ends in:</div>
        )}
        {isRefunded ? (
          <div className={styles.date} />
        ) : (
          <div className={styles.date}>
            {data.days}d {data.hours}h {data.minutes}m {data.seconds}s
          </div>
        )}
      </div>
      <div className={styles.steps}>
        {steps.map((step: any, index: any) => {
          return (
            <button
              onClick={() => changeStep(index + 1)}
              className={
                currentStep === index + 1
                  ? styles.step
                  : `${styles.step} ${styles.disabled}`
              }
              key={index}
            >
              {step?.name || step}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeBanner;
