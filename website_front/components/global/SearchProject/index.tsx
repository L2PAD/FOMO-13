import React, { FC, useEffect, useState } from "react";
import {
  Dropdown,
  Option,
  Project,
  SelectButton,
  SelectWrapper,
  Wrapper,
} from "./styles";
import { IProject } from "../../../types/global_types";
import { useQuery } from "react-query";
import fetchProjects from "../../../http/projects/fetchProjects";
import { SearchInput } from "../../layouts/projects/P2PExchange/styles";
import EmptyList from "../EmptyList";

const PROJECT_ID_FIELD = "_id";

interface IProps {
  label: string;
  onChange: (project: IProject) => void;
  className?: string;
  initialProject?: IProject;
  displaySymbol?: boolean;
  fetchProjectsRequest?: (
    queryString: string,
    searchValue: string
  ) => Promise<{ projects: Array<IProject>; total?: number; isSuccess?: boolean }>;
}

const SearchProject: FC<IProps> = ({
  label,
  onChange,
  className,
  initialProject,
  displaySymbol = false,
  fetchProjectsRequest,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selected, setSelected] = useState<IProject | null>(null);
  const [queryString, setQueryString] = useState<string>("");

  const { data, isLoading } = useQuery(
    ["search-projects", fetchProjectsRequest ? "custom" : "fomo-v2", queryString],
    () =>
      fetchProjectsRequest
        ? fetchProjectsRequest(queryString, searchValue)
        : fetchProjects("market", "", "", queryString, {
            source: "fomo-v2",
          }),
    {
      refetchOnWindowFocus: false,
      enabled: isOpen,
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchValue) {
        params.append("searchValue", searchValue);
      }
      setQueryString(`?${params.toString()}`);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSelect = (option: IProject) => {
    setSelected(option);
    onChange(option);
    setIsOpen(false);
    setSearchValue("");
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const getProjectSymbol = (project?: IProject | null): string => {
    return String(project?.symbol || project?.ticker || "")
      .trim()
      .toUpperCase();
  };

  const getProjectLabel = (project?: IProject | null): string => {
    if (!project) return label;
    if (displaySymbol) return getProjectSymbol(project) || project.name || label;
    return project.niche || project.name || label;
  };

  const getProjectKey = (project: IProject): string => {
    const projectAny = project as any;

    return String(projectAny[PROJECT_ID_FIELD] || project.coingeckoId || project.name);
  };

  return (
    <Wrapper className={className}>
      <label htmlFor={label}>{label}</label>
      <SelectWrapper>
        <SelectButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
          {
            initialProject || selected
              ?
              <Project>
                <img
                  src={
                    selected
                      ? String(selected.logo)
                      : initialProject
                        ? String(initialProject.logo)
                        : ""
                  }
                  alt="Project logo"
                />
                <div>
                  {getProjectLabel(selected || initialProject)}
                </div>
                <span>
                  $
                  {Number(
                    selected
                      ? selected.price
                      : initialProject
                        ? initialProject.price
                        : 0
                  ).toFixed(2)}
                </span>
              </Project>
              :
              <Project style={{color:'var(--main-gray)'}}>
                Select asset
              </Project>
          }

          <span className="arrow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M2 5L7.00081 9.58L12 5"
                stroke="#738094"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </SelectButton>
        <Dropdown isOpen={isOpen}>
          <SearchInput
            className="width100 search-project-dropdown-input"
            type="text"
            placeholder="Search projects..."
            value={searchValue}
            onChange={(value: string) => handleSearchChange(value)}
          />
          <div className="searchResults">
            {isLoading ? (
              <Option style={{padding:'20px'}}>Loading...</Option>
            ) : data?.projects?.length ? (
              data?.projects.map((option: IProject) => (
                <Option
                  key={getProjectKey(option)}
                  onClick={() => handleSelect(option)}
                >
                  <img
                    src={String(option.logo)}
                    alt={option.name}
                    width="20"
                    height="20"
                  />
                  {getProjectLabel(option)}
                  <span>${Number(option.price).toFixed(2)}</span>
                </Option>
              ))
            ) : (
              <div>
                <EmptyList
                  imgWidth={120}
                  gap={10}
                  fontSize={16}
                  lineHeight={150}
                  textWidth={220}
                />
              </div>
            )}
          </div>
        </Dropdown>
      </SelectWrapper>
    </Wrapper>
  );
};

export default SearchProject;
