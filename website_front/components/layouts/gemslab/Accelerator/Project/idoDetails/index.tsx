import React, { useState, useEffect, FC, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { LikeIcon } from "../../../../../global/Icons";
// import { getAllPartnersFromPool } from '../../smart/initialSmartMain'
import FAQandRisks from "../../../../../global/FAQandRisks";
import TimeBanner from "../TimeBanner";
import Image from "next/image";
// import heartSvg from '../../assets/icons/heart.svg'
// import heartFillSvg from '../../assets/icons/heartFill.svg'
import SquareBtn from "../../../../../UI/buttons/SquareLightBtn";
// import parseFunded from '../../utils/parseFunded'
// import parseGoal from '../../utils/parseGoal'
import parseDate from "../../../../../../helpers/parseDate";
import changeDateType from "../../../../../../helpers/changeDateType";
import styles from "../styles/ido-details.module.scss";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { sanitizedHtml } from "../../../../../../helpers/sanitizeHtml";
import { getAllPartnersFromPool } from "../../../../../../smart/initialSmartMain";

const stepsInitital = ["Staking", "Terms And Conditions"];

interface IProps {
  funded: number;
  myInvest?: any;
  isClaimed?: boolean;
  isClaim?: boolean;
  project: IProject;
  favouriteHandler: () => Promise<void>;
  isFavourite: boolean;
}

const IDODetails: FC<IProps> = ({
  funded,
  myInvest,
  project,
  isClaimed,
  isClaim,
  favouriteHandler,
  isFavourite,
}) => {
  const userData = {};
  const [steps, setSteps] = useState(() => stepsInitital);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const dispatch = useDispatch();

  const addProject = async () => {};

  const changeStep = (stepNumber: number) => {
    const stepsNumbers = {
      1: "staking-step",
      2: "footer-block",
    };
    // @ts-ignore
    const step = stepsNumbers[stepNumber];
    const targetElement = document.querySelector(`#${step}`);
    targetElement &&
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentStep(stepNumber);
  };

  const progress: number = useMemo(() => {
    const value: number = (funded / Number(project.totalMaxInvest)) * 100;

    if (value > 100) return 100;

    if (value < 0) return 0;

    return value;
  }, [funded, project]);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.body}>
          <div className={styles.title}>IDO Details</div>

          <div className={styles.details}>
            <div className={styles.column}>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Launch Price:</span>
                <span className={styles.value}>
                  {" "}
                  {`${clarifyAmount(Number(project.price) || 0)}$` || 0}
                </span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Total Amount:</span>
                <span className={styles.value}>
                  {clarifyAmount(project.totalAmount || 0)}$
                </span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Total Issued:</span>
                <span className={styles.value}>
                  {" "}
                  {project.totalIssued || 0}
                </span>
              </div>
            </div>
            <div className={styles.column}>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Total in Green zone:</span>
                <span className={styles.value}> {project.greenZone}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Redemption Amount:</span>
                <span className={styles.value}>
                  {" "}
                  {project.redemptionAmount}
                </span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Total Participants:</span>
                <span className={styles.value}>
                  {" "}
                  {Number(project.greenZone) + Number(project.yellowZone)}
                </span>
              </div>
            </div>
            <div className={styles.column}>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Min. investment:</span>
                <span className={styles.value}>
                  {" "}
                  ${clarifyAmount(Number(project.minInvest))}
                </span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.key}>Max. investment:</span>
                <span className={styles.value}>
                  {" "}
                  ${clarifyAmount(Number(project.maxInvest))}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.btns}>
            <SquareBtn
              disabled={isClaimed || project.isRefunded}
              handler={() => router.push(`/gemslab/launch/sale/${project._id}`)}
              text={isClaim ? (isClaimed ? "Ended" : "Claim") : "Participate"}
              width="375"
            />
            <button
              onClick={favouriteHandler}
              type="button"
              className={styles.likeBtn}
            >
              <LikeIcon fill="#04A584" active={isFavourite} />
            </button>
          </div>

          <hr className={styles.line} />

          <div className={styles.progress}>
            <div className={styles.progressRow}>
              <div className={styles.rowItem}>
                <span className={styles.key}>Funded:</span>
                <span className={styles.value}>
                  {project.isRefunded
                    ? `0$`
                    : `${clarifyAmount(funded)}$` || project.funded}
                </span>
              </div>
              <div className={styles.rowItem}>
                <span className={styles.key}>Funding goal:</span>
                <span className={styles.goalValue}>
                  {clarifyAmount(project.totalMaxInvest || 0)}$
                </span>
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                style={{ width: `${project.isRefunded ? 0 : progress || 0}%` }}
                className={styles.progressBarBody}
              />
            </div>
          </div>
          {project.isRefunded ? (
            <div className={styles.isRefunded}>REFUNDED</div>
          ) : (
            <div className={styles.funded}>
              <span className={styles.key}>My investments:</span>
              <span className={styles.textBlue}>
                {project.isRefunded
                  ? `0$`
                  : myInvest === ""
                    ? `0$`
                    : `${myInvest || 0}$`}
              </span>
            </div>
          )}
          <hr className={styles.line} />

          <div className={styles.tags}>
            {project?.tags?.map((tag: any, index: number) => {
              return (
                <div className={styles.tag} key={index}>
                  {tag.value}
                </div>
              );
            })}
          </div>

          <div className={styles.details}>
            <div className={styles.column}>
              <div className={styles.startDate}>
                <span className={styles.key}>Staking start: </span>
                <span className={styles.value}>
                  {changeDateType(project.stakingDateStart)}
                </span>
              </div>
              <div className={styles.endDate}>
                <span className={styles.key}>Staking end: </span>
                <span className={styles.value}>
                  {changeDateType(project.stakingDateEnd)}
                </span>
              </div>
            </div>
            <div className={styles.column}>
              <div className={styles.startDate}>
                <span className={styles.key}>Purchase start: </span>
                <span className={styles.value}>
                  {changeDateType(project?.purchaseDateStart)}
                </span>
              </div>
              <div className={styles.endDate}>
                <span className={styles.key}>Purchase end: </span>
                <span className={styles.value}>
                  <span className={styles.value}>
                    {changeDateType(project?.purchaseDateEnd) || "-"}
                  </span>
                </span>
              </div>
            </div>
            <div className={styles.endDate}>
              <span className={styles.key}>Distribution start: </span>
              <span className={styles.value}>
                {changeDateType(project.distributionStart) || "-"}
              </span>
            </div>
          </div>

          <div className={styles.roadmap}>
            <div className={styles.bodyLine} />
            <div id="staking-step" className={styles.subTitle}>
              Staking
            </div>
            <div className={styles.columnsDate}>
              <span>
                {changeDateType(project.stakingDateStart, 6)}{" "}
                {project.stakingTimeStart}{" "}
              </span>
              -
              <span>
                {" "}
                {changeDateType(project.stakingDateEnd, 6)}{" "}
                {project.stakingTimeEnd}
              </span>{" "}
              UTC
            </div>
            <div
              dangerouslySetInnerHTML={sanitizedHtml(project.stakingText || "-")}
              className={styles.text}
            />
            <div id="purchase-step" className={styles.overview}>
              <div className={styles.subTitle}>Purchase</div>
              <div className={styles.columnsDate}>
                <span>
                  {changeDateType(project.purchaseDateStart, 6)}{" "}
                  {project.purchaseTimeStart}{" "}
                </span>
                -
                <span>
                  {" "}
                  {changeDateType(project.purchaseDateEnd, 6)}{" "}
                  {project.purchaseTimeEnd}
                </span>{" "}
                UTC
              </div>
              <div
                dangerouslySetInnerHTML={sanitizedHtml(project.purchaseText || "-")}
                className={styles.text}
              />
            </div>
            <div id="dist-step" className={styles.infoBlock}>
              <div className={styles.subTitle}>Distribution</div>
              <div className={styles.columnsDate}>
                <span>
                  {" "}
                  {changeDateType(project.distributionStart, 6)}{" "}
                  {project.distributionTimeStart}
                </span>{" "}
                UTC
              </div>
              <div
                dangerouslySetInnerHTML={sanitizedHtml(project.distributionText || "-")}
                className={styles.text}
              />
            </div>
          </div>

          <div className={styles.faq}>
            <FAQandRisks faq={project.faq || []} />
          </div>
        </div>
        <div className={styles.bannerWrapper}>
          <TimeBanner
            isRefunded={project.isRefunded}
            projectName={project?.name}
            changeStep={changeStep}
            currentStep={currentStep}
            steps={steps}
            date={project.purchaseDateEnd}
            time={project.purchaseTimeEnd}
          />
        </div>
      </div>
      {/* <div className={styles.faq}>
        <FAQandRisks faq={project.faq} title={'FAQ'}/>
    </div>
    <div className={styles.risks}>
        <FAQandRisks faq={project.risks} title={'Risks'}/>
    </div> */}
    </>
  );
};

export default IDODetails;
