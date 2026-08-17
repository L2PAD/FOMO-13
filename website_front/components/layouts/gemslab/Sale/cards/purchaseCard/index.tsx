import React, { FC, useEffect, useState } from "react";
import changeDateType from "../../../../../../helpers/changeDateType";
import { IProject } from "../../../../../../types/global_types";
import {
  PurchaseInputWrapper,
  StageDates,
  StageDoneButton,
  StagePoint,
  StageTitle,
  StageWrapper,
} from "../../styles";
import { IPurchaseData } from "../../../../../../smart/hooks/useProjectState";
import {
  approveSum,
  getUserCanInvest,
  getUserInZone,
  investSumUSDC,
} from "../../../../../../smart/initialSmartMain";
import getUserStatusInZone from "../../../../../../http/projects/getUserStatusInZone";
import addProjectToUser from "../../../../../../http/projects/addProjectToUser";
import addDateAndTime from "../../../../../../helpers/addDateAndTime";
import parseDate from "../../../../../../helpers/parseDate";
import { toast } from "react-toastify";

interface IProps {
  project: IProject;
  purchaseData: IPurchaseData;
  previewMode?: boolean;
}

const PurchaseCard: FC<IProps> = ({
  project,
  purchaseData,
  previewMode = false,
}) => {
  const [userStatus, setUserStatus] = useState("red");
  const [value, setValue] = useState(0);
  const [isTransactionLoading, setIsTransactionLoading] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSuccessApprove, setIsSuccessApprove] = useState(false);
  const [isSuccessInvest, setIsSuccessInvest] = useState(false);

  const [isInvestStep, setIsInvestStep] = useState(false);
  const [isUserCanInvest, setIsUserCanInvest] = useState(true);
  const [isCanInvestAlert, setIsCanInvestAlert] = useState(false);
  const [userInvestTime, setUserInvestTime] = useState({
    startTime: 0,
    endTime: 0,
  });
  const [isAlreadyInvested, setIsAlreadyInvested] = useState(false);
  const [alreadyInvestedValue, setAlreadyInvestedValue] = useState(0);

  const confimApprove = async () => {
    if (previewMode) {
      setIsSuccessApprove(true);
      setIsInvestStep(true);
      return;
    }

    setIsTransactionLoading(true);

    let comission =
      (value * Number(project.comission ? project.comission : 0)) / 100;

    comission = comission > 0 ? comission : 0;

    const { res, success } = await approveSum(Number(value) + comission);

    const { isCanInvest } = await getUserCanInvest(
      project.poolId || 0,
      window.ethereum.selectedAddress
    );

    setIsSuccessApprove(success);
    setIsInvestStep(success);
    setIsUserCanInvest(isCanInvest);
    setIsTransactionLoading(false);
  };

  const confirmInvest = async () => {
    if (previewMode) {
      setIsSuccessInvest(true);
      setIsAlreadyInvested(true);
      setAlreadyInvestedValue(Number(value));
      return;
    }

    setIsTransactionLoading(true);

    let comission =
      (value * Number(project.comission ? project.comission : 0)) / 100;

    comission = comission > 0 ? comission : 0;

    const { success } = await investSumUSDC(
      Number(value),
      project.poolId || 0,
      comission
    );

    if (success) {
      await addProjectToUser("investedProjects", project._id || "");
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>You invested {value} USDC!</p>
        </div>
      );
    }

    setIsSuccessInvest(success);
    setIsAlreadyInvested(success);
    setAlreadyInvestedValue(Number(value));
    setIsTransactionLoading(false);
  };
  useEffect(() => {
    if (previewMode) {
      setUserStatus("green");
      return;
    }

    const getUserStatus = async () => {
      setLoading(true);

      const { data, success } = await getUserInZone(
        project?.poolId || 0,
        window.ethereum.selectedAddress
      );

      if (!success) {
        setLoading(false);
        return;
      }

      const statusInZone: number = Number(data);

      // @ts-ignore
      const status = getUserStatusInZone(statusInZone);

      if (status === "red") {
        setIsDisabled(true);
      }

      if (status === "green") {
        const isDisabled =
          addDateAndTime(
            parseDate(project.greenDate),
            project.greenTimeStart || "00:00"
          ) > new Date().getTime();

        setIsDisabled(isDisabled);
      }

      if (status === "yellow") {
        const isDisabled =
          addDateAndTime(
            parseDate(project.yellowDate),
            project.yellowTimeStart || "00:00"
          ) > new Date().getTime();

        setIsDisabled(isDisabled);
      }

      setUserStatus(status);

      setLoading(false);
    };
    getUserStatus();
  }, [previewMode, project?.greenDate, project?.greenTimeStart, project?.poolId, project?.yellowDate, project?.yellowTimeStart]);

  const investedValue =
    alreadyInvestedValue || Number(purchaseData?.investData?.invest || 0);

  return (
    <StageWrapper
      done={purchaseData.isPurchaseStart && !purchaseData.isPurchaseEnd}
    >
      <StagePoint>2</StagePoint>
      <StageTitle variant="p">Purchase</StageTitle>
      {purchaseData.isPurchaseStart && !purchaseData.isPurchaseEnd ? (
        <>
          <StageDates variant="h6">
            Starts: {purchaseData.dates.startTime}
          </StageDates>
          <StageDates variant="h6">
            Ends (Estimated): {purchaseData.dates.endTime}
          </StageDates>
          {investedValue ? (
            <StageDates variant="h6">
              Your investment:{" "}
              <b>
                {investedValue}{" "}
                {project?.isEth ? "ETH" : "USDC"}
              </b>
            </StageDates>
          ) : (
            <></>
          )}
          <StageDates variant="h6">
            Status: <div className={userStatus} />
          </StageDates>
        </>
      ) : (
        <>
          <StageDates variant="h6">
            Starts: {changeDateType(project.purchaseDateStart, 7)}{" "}
            {project?.purchaseTimeStart || ""}
          </StageDates>
          <StageDates variant="h6">
            Ends (Estimated): {changeDateType(project.purchaseDateEnd, 7)}{" "}
            {project?.purchaseTimeEnd || ""}
          </StageDates>
        </>
      )}

      {purchaseData.isPurchaseStart && !purchaseData.isPurchaseEnd ? (
        <PurchaseInputWrapper>
          <input
            value={value}
            onChange={(e: any) => setValue(e.target.value)}
            placeholder="0"
            type="number"
          />
          {isSuccessApprove ? (
            <StageDoneButton full onClick={confirmInvest}>
              Purchase
            </StageDoneButton>
          ) : (
            <StageDoneButton full onClick={confimApprove}>
              Approve
            </StageDoneButton>
          )}
        </PurchaseInputWrapper>
      ) : (
        <></>
      )}
    </StageWrapper>
  );
};

export default PurchaseCard;
