import React, { useRef, useState, FC } from "react";
import ProjectInfoBlock from "../projectInfoBlock/ProjectInfoBlock";
import TimeBanner from "../TimeBanner";
import ProjectFilter from "../projectFilter/ProjectFilter";
import styles from "../styles/project-details.module.scss";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { sanitizedHtml } from "../../../../../../helpers/sanitizeHtml";

const filtersInitialState = [
  {
    title: "Investors",
    isSelect: true,
  },
  {
    title: "Team",
    isSelect: false,
  },
  {
    title: "Partners",
    isSelect: false,
  },
];

const stepsInitital = [
  {
    name: "Key Metrics",
    isSelect: false,
  },
  {
    name: "Overview",
    isSelect: false,
  },
  {
    name: "Investors",
    isSelect: false,
  },
  {
    name: "Token Utility",
    isSelect: false,
  },
  {
    name: "Revenue",
    isSelect: false,
  },
  {
    name: "Token Metrics",
    isSelect: false,
  },
  {
    name: "Terms And Conditions",
    isSelect: false,
  },
];

const ProjectDetailsInfo: FC<{ project: IProject }> = ({ project }) => {
  const [steps, setSteps] = useState(() => stepsInitital);
  const [currentStep, setCurrentStep] = useState(1);
  const wrapperRef = useRef(null);

  const changeStep = (stepNumber: number) => {
    const stepsNumbers = {
      1: "first-step",
      2: "second-step",
      3: "third-step",
      4: "fourth-step",
      5: "fifth-step",
      6: "sixth-step",
      7: "footer-block",
    };
    // @ts-ignore
    const step = stepsNumbers[stepNumber];
    const targetElement: any = document.querySelector(`#${step}`);
    targetElement &&
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentStep(stepNumber);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.body}>
        <div className={styles.bodyLine} />

        <div id="first-step" className={styles.itemWrapper}>
          <div className={styles.title}>Key Metrics</div>
          <div className={styles.columns}>
            <div className={styles.column}>
              <div className={styles.columnItem}>
                <span className={styles.key}>Blockchain Network: </span>
                <span className={styles.value}>{project?.blockchain}</span>
              </div>
              <div className={styles.columnItem}>
                <span className={styles.key}>Total Supply: </span>
                <span className={styles.value}>
                  {`${clarifyAmount(Number(project.totalSupply))}$` || "-"}
                </span>
              </div>
              <div className={styles.columnItem}>
                <span className={styles.key}>Project Valuation: </span>
                <span className={styles.value}>
                  {`${clarifyAmount(Number(project?.valuation))}$` || "-"}
                </span>
              </div>
            </div>
            <div className={styles.column}>
              <div className={styles.columnItem}>
                <span className={styles.key}>Initial Market Cap: </span>
                <span
                  className={styles.value}
                >{`${clarifyAmount(Number(project.inititialMarketCap || 0))}$`}</span>
              </div>
              <div className={styles.columnItem}>
                <span className={styles.key}>Hard Cap: </span>
                <span
                  className={styles.value}
                >{`${project.hardCap || 0}`}</span>
              </div>

              <div className={styles.columnItem}>
                <span className={styles.key}>Platform Raise: </span>
                <span
                  className={styles.value}
                >{`${clarifyAmount(Number(project.platformRaise) || 0)}$`}</span>
              </div>
            </div>
          </div>
        </div>

        <div id="second-step" className={styles.overview}>
          <div className={styles.title}>Overview</div>
          <div
            className={styles.text}
            dangerouslySetInnerHTML={sanitizedHtml(project?.overviewText || "")}
          />
        </div>

        <div id="third-step" className={styles.filtersInfo}>
          <ProjectFilter
            project={project}
            filtersInitialState={filtersInitialState}
          />
        </div>

        <div id="fourth-step" className={styles.infoBlock}>
          <div className={styles.title}>Token Utility</div>
          <div
            dangerouslySetInnerHTML={sanitizedHtml(project?.tokenUtilityText || "")}
            className={styles.text}
          />
        </div>

        <div id="fifth-step" className={styles.infoBlock}>
          <div className={styles.title}>Revenue</div>
          <div
            dangerouslySetInnerHTML={sanitizedHtml(project?.revenueText || "")}
            className={styles.text}
          />
        </div>

        <div id="sixth-step" className={styles.infoBlockImg}>
          <div className={styles.title}>Token Metrics</div>
          <ProjectInfoBlock img={project.descriptionImage} />
        </div>
      </div>
      <div className={styles.bannerWrapper}>
        <TimeBanner
          projectName={project.name}
          changeStep={changeStep}
          currentStep={currentStep}
          steps={steps}
          date={project.purchaseDateEnd}
          time={project.purchaseTimeEnd}
        />
      </div>
    </div>
  );
};

export default ProjectDetailsInfo;
