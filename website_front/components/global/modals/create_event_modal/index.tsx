/* eslint-disable */
import React, { FC, useState, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import { LocationContext } from "../../Layout";
import EventDatePicker from "../../EventDatePicker";
import EventTimeInput from "../../timeInput/TimeInput";
import Modal from "../../common/Modal";
import InputWithLabel from "../../common/components_for_modals/input_with_label";
import { ModalRow } from "../create_news_modal/styles";
import { SubmitButton } from "../2FAModal/styles";
import ModalDatePicker from "../../common/components_for_modals/modal_date_picker";
import ModalSelectProject from "../../modal_select-project";
import fetchProjects from "../../../../http/projects/fetchProjects";
import { IProject } from "../../../../types/global_types";
import { IEvent, INft } from "../../../../types/global_types";
import createEvent from "../../../../http/events/createEvent";
import Checkbox from "../../common/Checkbox";
import {
  CheckboxWrapper,
  ConfirmButton,
  DateWrapper,
  DaysLabels,
  Label,
  ModalBody,
  ModalWrapper,
  TimeWrapper,
  TitleInput,
} from "./styles";

interface Props {
  initialProject?: IProject;
  onSuccessCreate: (newEvent: IEvent) => void;
  isOpen?: boolean;
  onClose: () => void;
  date: Date;
}

const CreateEventModal: FC<Props> = ({
  onSuccessCreate,
  onClose,
  date,
  initialProject,
  isOpen,
}) => {
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [eventData, setEventData] = useState<IEvent>({
    name: "",
    stars: 0,
    time: "00:00",
    endTime: "00:00",
  });
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [allProjects, setAllProjects] = useState<Array<IProject | INft>>([]);
  const [selectedProject, setSelectedProject] = useState<IProject | INft>();
  const userRole = useSelector((state: any) => state.auth.role);
  const { path } = useContext(LocationContext);

  const inputsHandler = (value: any, name: string): void => {
    setEventData((prev: IEvent) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const projectHandler = (project: IProject | INft) => {
    setSelectedProject(project);
    inputsHandler(project._id || "", "projectId");
  };

  const confirmCreateEvent = async () => {
    const { isSuccess, event } = await createEvent({
      ...eventData,
      page: path,
      date,
      endDate:
        eventData.endDate || new Date(date.getTime() + 24 * 60 * 60 * 1000),
      isProjectEvent: !!initialProject,
      // projectId:initialProject ? initialProject._id : selectedProject?._id || allProjects?.length && allProjects[0]._id || ''
    });
    if (event && isSuccess) {
      setEventData({
        name: "",
        stars: 0,
        time: "00:00",
        endTime: "00:00",
      });
      onSuccessCreate({ ...event, project: selectedProject, date });
      onClose();
    }
  };

  useEffect(() => {
    // const fetchData = async () => {
    //     const {isSuccess,projects} = await fetchProjects('all/active')
    //     if(isSuccess && projects[0]){
    //         inputsHandler(projects[0]._id,'projectId')
    //         initialProject ? setSelectedProject(initialProject) : setSelectedProject(projects[0])
    //         setAllProjects(projects)
    //         setEventData((prev:IEvent) => {
    //             return {...prev,date}
    //         })
    //     }
    //     setLoadingProjects(false)
    // }
    // fetchData()
  }, []);

  return (
    <ModalWrapper isOpen={!!isOpen}>
      <ModalBody>
        <TitleInput
          onChange={(e: any) => inputsHandler(e.target.value, "name")}
          placeholder="New Event"
          value={eventData.name}
        ></TitleInput>
        <hr />
        <DaysLabels>
          <CheckboxWrapper>
            <Label>all day:</Label>
            <Checkbox
              checked={isAllDay}
              onChange={() => setIsAllDay((prev: boolean) => !prev)}
            />
          </CheckboxWrapper>
          <DateWrapper>
            <Label>starts:</Label>
            <EventDatePicker
              date={eventData.date || date}
              onChange={(value: any) => inputsHandler(value, "date")}
            />
          </DateWrapper>
          {!isAllDay ? (
            <TimeWrapper>
              <Label>starts time:</Label>
              <EventTimeInput
                initial={eventData.time}
                handler={(time: any) => inputsHandler(time, "time")}
              />
            </TimeWrapper>
          ) : (
            <></>
          )}
          <DateWrapper>
            <Label>ends:</Label>
            <EventDatePicker
              date={
                eventData.endDate ||
                new Date(date.getTime() + 24 * 60 * 60 * 1000)
              }
              onChange={(value: any) => inputsHandler(value, "endDate")}
            />
          </DateWrapper>
          {!isAllDay ? (
            <TimeWrapper>
              <Label>ends time:</Label>
              <EventTimeInput
                initial={eventData.endTime}
                handler={(time: any) => inputsHandler(time, "endTime")}
              />
            </TimeWrapper>
          ) : (
            <></>
          )}
        </DaysLabels>
        <hr />
        <ConfirmButton onClick={confirmCreateEvent}>Add Notes</ConfirmButton>
      </ModalBody>
    </ModalWrapper>
  );
};

export default CreateEventModal;
