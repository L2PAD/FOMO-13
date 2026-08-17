import React, { FC, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import { SearchContainer } from "../../../layouts/projects/CryptoMarket/styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import {
  SearchIconStyle,
  SearchWrapper,
} from "../../../layouts/projects/Networks/styles";
import fetchFundsByQuery from "../../../../http/funds/fetchFundsByQuery";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../helpers/imageFallbacks";
import { CloseIcon } from "../../Icons";
import fetchProjects from "../../../../http/projects/fetchProjects";
import SearchResults from "../../Navigation/SearchResults";

const SelectedItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;

  div {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f5fbfd;
    padding: 4px 8px;
    font-size: 14px;

    img {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    button {
      height: 12px;
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
`;

interface IProps {
  projects: Array<any>;
  placeholder?: string;
  isOneProject?: boolean;
  className?: string;
  onChange: (projects: Array<any>) => void;
}

const ProjectsSearch: FC<IProps> = ({
  projects,
  placeholder,
  isOneProject,
  className,
  onChange,
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data, isLoading } = useQuery(["search-projects", searchValue], () => {
    return fetchProjects(`all`, "", "", `?searchValue=${searchValue}`);
  });

  const addInvestor = (item: any): void => {
    if (projects.find((inv: any) => inv._id === item._id)) return;

    const updatedInvestors: Array<any> = [item, ...projects];

    onChange(updatedInvestors);

    if (isOneProject) setIsOpen(false);
  };

  const removeInvestor = (item: any): void => {
    const updatedInvestors: Array<any> = projects.filter(
      (inv: any) => inv._id !== item._id
    );

    onChange(updatedInvestors);
  };

  return (
    <>
      {isOpen ? <Overlay onClick={() => setIsOpen(false)} /> : <></>}
      <SearchContainer className="projects-search-container">
        <SearchWrapper className={className}>
          <SearchInput
            className="small-input"
            onFocus={(value: boolean) => setIsOpen(true)}
            type="text"
            placeholder={
              placeholder ||
              "Search and select projects, funds, or companies this person is involved with"
            }
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle className="small-icon" />}
            value={searchValue}
          />
        </SearchWrapper>
        {/* <SearchResults
          isLoading={isLoading}
          isVisible={isOpen}
          projects={data?.projects || []}
          onClick={(item: any) => addInvestor(item)}
        /> */}
        <SelectedItems>
          {projects.map((item: any) => {
            return (
              <div key={item._id}>
                <img
                  src={getProjectImage(item.logo, item.name || item.symbol)}
                  alt={item.name}
                  onError={setProjectImageFallback}
                />
                <span>{item.name}</span>
                <button onClick={() => removeInvestor(item)}>
                  <CloseIcon fill="#738094" />
                </button>
              </div>
            );
          })}
        </SelectedItems>
      </SearchContainer>
    </>
  );
};

export default ProjectsSearch;
