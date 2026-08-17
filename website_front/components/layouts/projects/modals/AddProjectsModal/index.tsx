import React, { FC, useMemo, useState } from "react";
import Modal from "../../../../global/common/Modal";
import {
  SearchIconStyle,
  SearchInput,
} from "../../../gemslab/Portfolio/Analytics/styles";
import { CheckIcon } from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import UsersRow from "../../../../global/UsersRow";
import Typography from "../../../../global/common/Typography";
import {
  FundDataWrapper,
  FundRow,
  FundsWrapper,
  HeaderWrapper,
  ProjectsWrapper,
  SubmitButton,
} from "./styles";
import { IProject } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import CreatingProjectModal from "../../../../global/modals/creating_project";

interface Props {
  onClose: () => void;
  onSubmit: (projects: Array<string>) => Promise<void>;
  projects: Array<IProject>;
  data: any;
  modalType?: "projects" | "persons";
}

const AddProjectsModal: FC<Props> = ({
  onClose,
  onSubmit,
  projects,
  data,
  modalType = "projects",
}) => {
  const [isCreateProject, setIsCreateProject] = useState<boolean>(false);
  const [selectedProjects, setSelectedProjects] = useState<Array<string>>(
    projects.map((item: IProject) => item._id || "")
  );
  const [searchValue, setSearchValue] = useState<string>("");

  const toggleProjects = (id: string): void => {
    if (selectedProjects.includes(id)) {
      setSelectedProjects((prev: Array<string>) => {
        return prev.filter((itemId: string) => itemId !== id);
      });
    } else {
      setSelectedProjects((prev: Array<string>) => {
        return [...prev, id];
      });
    }
  };

  const allProjects = useMemo(() => {
    const key = modalType;

    if (!searchValue) return data[key] || [];

    return (
      data[key]?.filter((item: IProject) =>
        item.name.toLowerCase().includes(searchValue.toLowerCase())
      ) || []
    );
  }, [data, searchValue]);

  return isCreateProject ? (
    <CreatingProjectModal onClose={() => setIsCreateProject(false)} />
  ) : (
    <Modal title={`Add ${modalType}`} onClose={onClose} variant="small-medium">
      <HeaderWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
        <button onClick={() => setIsCreateProject(true)}>
          + Create project
        </button>
      </HeaderWrapper>
      <FundsWrapper>
        {allProjects.map((item: IProject) => {
          const isSelected: boolean = selectedProjects.includes(
            String(item._id)
          );

          return (
            <FundRow
              background={isSelected ? "#04a58513" : "white"}
              onClick={() => toggleProjects(item._id || "")}
              key={item._id}
            >
              <div>
                <CheckIcon fill={isSelected ? "#04A584" : "#04a5855e"} />
              </div>
              <FundDataWrapper>
                <UserAvatar
                  size="small"
                  avatar={
                    item.metadataLogo || imageLoader(String(item.logo) || "")
                  }
                  name={item.name}
                  variant="default"
                />
                <Typography variant="p">{item.name}</Typography>
              </FundDataWrapper>
              <ProjectsWrapper>
                <UsersRow users={item.investors || []} />
                <p>
                  Total: <span>{item.investors.length} investors</span>
                </p>
              </ProjectsWrapper>
            </FundRow>
          );
        })}
      </FundsWrapper>
      <SubmitButton onClick={() => onSubmit(selectedProjects)}>
        Update {selectedProjects.length} {modalType}
      </SubmitButton>
    </Modal>
  );
};

export default AddProjectsModal;
