import React, { FC, useContext, useState } from "react";
import { useQuery } from "react-query";
import { LoadingContext } from "../../../../global/Layout";
import { getTrackBackground, Range as DefaultRange } from "react-range";
import Modal from "../../../../global/common/Modal";
import Checkbox from "../../../../global/common/Checkbox";
import { ActionsWrapper, CheckboxesWrapper } from "../CustomizeTabModal/styles";
import { ContentRow, RangeInputsWrapper, RangeWrapper } from "./styles";
import {
  ICreateAlert,
  IProject,
  NotificationsTypes,
} from "../../../../../types/global_types";
import {
  DropdownWrapper,
  ProjectItem,
  ProjectsWrapper,
  SelectedProject,
  SelectWrapper,
} from "../../../../global/modals/SupportModal/styles";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../../helpers/imageFallbacks";
import { ArrowDownIcon } from "../../../../global/Icons";
import fetchProjects from "../../../../../http/projects/fetchProjects";
import createAlert from "../../../../../http/utils/createAlert";
import Loader from "../../../../global/loader";

interface Props {
  onClose: () => void;
}

const CreateAlertModal: FC<Props> = ({ onClose }) => {
  const { loadingState, loadingStateHandler } = useContext(LoadingContext);
  const [project, setProject] = useState<any>({});
  const [selectIsOpen, setSelectIsOpen] = useState(false);
  const { data } = useQuery("projects", () => fetchProjects("all/active"));
  const [alertData, setAlertData] = useState<ICreateAlert>({
    name: "",
    projectId: "",
    sensitivity: [0, 100],
    notificationTypes: ["telegram"],
  });
  const [values, setValues] = useState([0, 100]);

  const onChangePrice = (value: NotificationsTypes) => {
    if (alertData.notificationTypes.includes(value)) {
      setAlertData((prev: any) => {
        return {
          ...prev,
          notificationTypes: alertData.notificationTypes.filter(
            (item) => item !== value
          ),
        };
      });
    } else {
      setAlertData((prev: any) => {
        return {
          ...prev,
          notificationTypes: [...alertData.notificationTypes, value],
        };
      });
    }
  };

  const chooseProject = (project: any) => {
    setProject(project);
    setSelectIsOpen(false);
  };

  const confirmSendAlert = async (): Promise<any> => {
    loadingStateHandler(true);

    const data: ICreateAlert = {
      ...alertData,
      projectId: project._id,
      sensitivity: values,
    };
    await createAlert(data);

    loadingStateHandler(false);
    onClose();
  };

  return (
    <>
      <Modal title="Create alert" onClose={onClose} variant="small">
        <ContentRow>
          <span>AI Sensitivity</span>
          <input
            placeholder="Some name"
            onChange={(e: any) =>
              setAlertData((prev: any) => {
                return {
                  ...prev,
                  name: e.target.value,
                };
              })
            }
            type="text"
          />
        </ContentRow>
        <ProjectsWrapper>
          <ContentRow>
            <span>Project</span>
          </ContentRow>
          <SelectWrapper open={selectIsOpen}>
            <div onClick={() => setSelectIsOpen((state) => !state)}>
              <SelectedProject>
                {project?.name ? (
                  <img
                    alt={project.name}
                    src={getProjectImage(project?.logo, project?.name)}
                    onError={setProjectImageFallback}
                  />
                ) : (
                  <></>
                )}
                <span>{project?.name || "Select project"}</span>
              </SelectedProject>
              <ArrowDownIcon />
            </div>
            {selectIsOpen ? (
              <DropdownWrapper>
                {data?.projects?.length ? (
                  data.projects.map((item: IProject) => {
                    return (
                      <ProjectItem
                        key={item._id}
                        onClick={() => chooseProject(item)}
                      >
                        <img
                          alt={item.name}
                          src={getProjectImage(item.logo, item.name || item.symbol)}
                          onError={setProjectImageFallback}
                        />
                        <span>{item.name}</span>
                      </ProjectItem>
                    );
                  })
                ) : (
                  <></>
                )}
              </DropdownWrapper>
            ) : (
              <></>
            )}
          </SelectWrapper>
        </ProjectsWrapper>
        <ContentRow>
          <span>AI Sensitivity</span>
          <RangeInputsWrapper>
            <div>
              <p>From</p>
              <input type="text" placeholder="No min set" value={values[0]} />
            </div>
            <div>
              <p>To</p>
              <input type="text" placeholder="No max set" value={values[1]} />
            </div>
          </RangeInputsWrapper>
          <RangeWrapper>
            <DefaultRange
              onChange={setValues}
              max={100}
              step={1}
              values={values}
              renderTrack={({ props, children }) => {
                return (
                  <div
                    {...props}
                    style={{
                      background: getTrackBackground({
                        values: [values[0] / 10, values[1] / 10],
                        colors: [
                          "rgba(39, 122, 210, 0.1)",
                          "#04A584",
                          "rgba(39, 122, 210, 0.1)",
                        ],
                        min: 0,
                        max: 10,
                      }),
                      height: "8px",
                      width: "100%",
                      borderRadius: 8,
                    }}
                  >
                    {children}
                  </div>
                );
              }}
              renderThumb={({ props }) => {
                return (
                  <div
                    {...props}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "100%",
                      border: "3px solid white",
                      background: "#04A584",
                      cursor: "pointer",
                      position: "absolute",
                    }}
                  />
                );
              }}
            />
          </RangeWrapper>
        </ContentRow>
        <CheckboxesWrapper>
          <p>Where send alert?</p>
          <div>
            {/* <Checkbox
                        checked={chosenPrice.includes('Discord')}
                        onChange={() => onChangePrice('Discord')}
                        label='Discord'
                    /> */}
            <Checkbox
              checked={alertData.notificationTypes.includes("telegram")}
              onChange={() => onChangePrice("telegram")}
              label="Telegram"
            />
            <Checkbox
              checked={alertData.notificationTypes.includes("email")}
              onChange={() => onChangePrice("email")}
              label="Email"
            />
          </div>
        </CheckboxesWrapper>
        <ActionsWrapper>
          <button disabled={!project._id} onClick={confirmSendAlert}>
            Create alert
          </button>
        </ActionsWrapper>
      </Modal>
      {loadingState ? <Loader isVisible={loadingState} /> : <></>}
    </>
  );
};

export default CreateAlertModal;
