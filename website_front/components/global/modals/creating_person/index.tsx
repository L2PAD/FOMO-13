/* eslint-disable */
import React, { FC, useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import Modal from "../../common/Modal";
import FirstStep from "./steps/first_step";
import ThirdStep from "./steps/third_step";
import createPerson from "../../../../http/projects/createPerson";
import AddInvestorsModal from "../add_investors_modal";
import { LoadingContext, LocationContext } from "../../Layout";
import { Investor, IPerson } from "../../../../types/global_types";
import {
  NextStepButton,
  PreviousStepButton,
  ProgressNumber,
  ProgressWrapper,
} from "./styles";
import { Actions, ResetButton } from "../../UniversalFilter/styles";
import { Action } from "../../LeftNav/styles";
import Button from "../../common/Button";

interface Props {
  onClose: () => void;
}
export interface IStepProps {
  data: IPerson;
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

export const calculateRating = (data: IPerson): string => {
  let rating = 0;

  if (!data.totalRaised) {
    rating -= 0;
  }
  if (!data.banner) {
    rating -= 0;
  }

  return String(rating);
};

export const personDefault: IPerson = {
  name: "",
  status: "Active",
  niche: "",
  totalRaised: "",
  rating: "",
  fullness: "",
  banner: "",
  lastFunding: new Date(),
  investors: [],
  company: "",
  position: "",
  participated: [],
  descriptionText: "",
};

const CreatePersonModal: FC<Props> = ({ onClose }) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const { path } = useContext(LocationContext);
  const [isAddInvestors, setIsAddInvestors] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState(1);
  const [projectData, setProjectData] = useState<IPerson>(personDefault);
  const [validationErrors, setValidationErrors] = useState<Array<string>>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const confirmCreatePerson = async (): Promise<void> => {
    if (!isChecked) {
      setValidationErrors(["checkbox"]);

      return;
    }

    loadingStateHandler(true);

    const { isSuccess, error }: { isSuccess: boolean; error: string } =
      await createPerson({
        ...projectData,
        fullness: `${calculatePageFullness()}`,
        rating: calculateRating(projectData),
      });

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>The person has been sent for verification of moderation</p>
        </div>
      );
      onClose();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Your limit on creating persons for today has been reached</p>
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
          <ThirdStep
            validationErrors={validationErrors}
            isChecked={isChecked}
            data={projectData}
            setIsChecked={(value: boolean) => {
              setIsChecked(value);
              setValidationErrors([]);
            }}
            inputsHandler={inputsHandler}
          />
        );
      default:
        return <FirstStep data={projectData} inputsHandler={inputsHandler} />;
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
    <Modal
      title="New Person"
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
          onClick={progressValue === 2 ? confirmCreatePerson : nextStepHandler}
          variant={"primary"}
        >
          {progressValue === 2 ? "Submit for Review" : "Next"}
        </Button>
      </Actions>
      <ResetButton>
        <button
          onClick={() => {
            setProgressValue(1);
            setProjectData(personDefault);
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
  );
};

export default CreatePersonModal;
