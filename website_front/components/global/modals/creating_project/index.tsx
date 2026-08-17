/* eslint-disable */
import React, { FC, useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import Modal from "../../common/Modal";
import FirstStep from "./steps/first_step";
import SecondStep from "./steps/second_step";
import ThirdStep from "./steps/third_step";
import AddInvestorsModal from "../add_investors_modal";
import createProject from "../../../../http/projects/createProject";
import getProjectType from "../../../../helpers/getProjectType";
import { LoadingContext, LocationContext } from "../../Layout";
import { Investor, IProject } from "../../../../types/global_types";
import {
  NextStepButton,
  PreviousStepButton,
  ProgressNumber,
  ProgressWrapper,
} from "./styles";
import { Actions, ResetButton } from "../../UniversalFilter/styles";
import { Action } from "../../LeftNav/styles";
import Button from "../../common/Button";

const currentProjectType = {
  crypto: "project",
};

interface Props {
  onClose: () => void;
}
export interface IStepProps {
  data: IProject;
  inputsHandler: (value: any, inputName: string, index?: number) => void;
  openInvestorsModal?: () => void;
  investorsHandler?: (investor: Investor) => void;
  validationErrors?: Array<string>;
  isChecked?: boolean;
  setIsChecked?: (value: boolean) => void;
}

export const calculatePageFullness = (): string => {
  return "75";
};

export const calculateRating = (data: IProject): string => {
  let rating = 100;

  if (!data?.investors.length) {
    rating -= 10;
  }
  if (!data.totalRaised) {
    rating -= 2;
  }
  if (!data.banner) {
    rating -= 2;
  }

  return String(rating);
};

const CreatingProjectModal: FC<Props> = ({ onClose }) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const { path } = useContext(LocationContext);
  const [isAddInvestors, setIsAddInvestors] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Array<string>>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [projectData, setProjectData] = useState<IProject>({
    name: "",
    status: "Active",
    niche: "",
    totalRaised: "",
    rating: "",
    fullness: "",
    banner: "",
    lastFunding: new Date(),
    investors: [],
    socialmedia: [],
  });

  const confirmCreateProject = async (): Promise<void> => {
    if (!isChecked) {
      setValidationErrors(["checkbox"]);

      return;
    }

    loadingStateHandler(true);

    const projectType: string = getProjectType(path);

    const { isSuccess, error }: { isSuccess: boolean; error: string } =
      await createProject({
        ...projectData,
        projectType,
        fullness: `${calculatePageFullness()}`,
        rating: calculateRating(projectData),
      });

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>The project has been sent for verification of moderation</p>
        </div>
      );
      onClose();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Your limit on creating projects for today has been reached</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const inputsHandler = useCallback(
    (value: any, inputName: string, index?: number): void => {
      if (inputName === "descriptionText" && value?.length > 300) return;

      setProjectData({ ...projectData, [inputName]: value });
    },
    [projectData]
  );

  const investorsHandler = (investor: Investor): void => {
    setProjectData((prev: IProject) => {
      const isAdded: boolean = !!prev?.investors?.find(
        (inv: Investor) => inv._id === investor._id
      );

      if (isAdded) {
        return {
          ...prev,
          investors: prev.investors?.filter(
            (inv: Investor) => inv._id !== investor._id
          ),
        };
      }
      return {
        ...prev,
        investors: [...prev?.investors, investor],
      };
    });
  };

  const openInvestorsModal = (): void => {
    setIsAddInvestors(true);
  };

  const handleStep = () => {
    switch (progressValue) {
      case 1:
        return (
          <FirstStep
            validationErrors={validationErrors}
            data={projectData}
            inputsHandler={inputsHandler}
          />
        );
      case 2:
        return (
          <SecondStep
            data={projectData}
            inputsHandler={inputsHandler}
            investorsHandler={investorsHandler}
            openInvestorsModal={openInvestorsModal}
          />
        );
      case 3:
        return (
          <ThirdStep
            isChecked={isChecked}
            setIsChecked={(value: boolean) => {
              setIsChecked(value);
              setValidationErrors([]);
            }}
            validationErrors={validationErrors}
            data={projectData}
            inputsHandler={inputsHandler}
          />
        );
      default:
        return (
          <FirstStep
            validationErrors={validationErrors}
            data={projectData}
            inputsHandler={inputsHandler}
          />
        );
    }
  };

  const nextStepHandler = () => {
    if (progressValue === 1) {
      const isNameError = projectData.name.length < 4;
      const isCategoryError = projectData.niche.length < 4;

      projectData.name.length < 4 &&
        setValidationErrors((prev: Array<any>) => {
          return [...prev, "name"];
        });

      projectData.niche.length < 2 &&
        setValidationErrors((prev: Array<any>) => {
          return [...prev, "niche"];
        });

      if (isNameError || isCategoryError) {
        setTimeout(() => {
          setValidationErrors([]);
        }, 3000);
        return;
      }
    }

    setProgressValue((state) => state + 1);
  };

  return (
    <>
      {isAddInvestors ? (
        <AddInvestorsModal
          selectedInvestors={projectData.investors}
          onClose={() => {
            setIsAddInvestors(false);
          }}
          addInvestors={investorsHandler}
        />
      ) : (
        <Modal
          title="New Project"
          onClose={onClose}
          variant="big"
          className="creating_project_modal"
        >
          <ProgressWrapper>
            <ProgressNumber defaultValue={1} value={progressValue}>
              1
            </ProgressNumber>
            <ProgressNumber defaultValue={2} value={progressValue}>
              2
            </ProgressNumber>
            <ProgressNumber defaultValue={3} value={progressValue}>
              3
            </ProgressNumber>
          </ProgressWrapper>
          {handleStep()}
          <Actions>
            <Action
              onClick={() =>
                progressValue !== 1
                  ? setProgressValue((state) => state - 1)
                  : onClose()
              }
              actionType="red"
            >
              {progressValue === 1 ? "Cancel" : "Back"}
            </Action>
            <Button
              onClick={
                progressValue === 3 ? confirmCreateProject : nextStepHandler
              }
              variant={"primary"}
            >
              {progressValue === 3 ? "Submit for Review" : "Next"}
            </Button>
          </Actions>
          <ResetButton>
            <button
              onClick={() => {
                setProgressValue(1);
                setProjectData({
                  name: "",
                  status: "Active",
                  niche: "",
                  totalRaised: "",
                  rating: "",
                  fullness: "",
                  banner: "",
                  lastFunding: new Date(),
                  investors: [],
                });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="12"
                viewBox="0 0 13 12"
                fill="none"
              >
                <path
                  d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Reset</span>
            </button>
          </ResetButton>
        </Modal>
      )}
    </>
  );
};

export default CreatingProjectModal;
