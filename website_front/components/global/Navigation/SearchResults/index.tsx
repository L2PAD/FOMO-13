import React, { FC } from "react";
import { useRouter } from "next/router";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../helpers/imageFallbacks";
import { IProject } from "../../../../types/global_types";
import Placeholder from "../../common/Placeholder";
import {
  SearchResultsItems,
  SearchResultsList,
  SearchResultsTitle,
  SearchResultsWrapper,
  SearchResultsItem,
  SearchResultsItemInfo,
  SearchResultsItemTitle,
  SearchResultsItemDescription,
} from "./styles";
import EmptyList from "../../EmptyList";

interface IProps {
  className?: string;
  projects: Array<IProject>;
  funds: Array<IProject>;
  persons: Array<IProject>;
  isVisible: boolean;
  isLoading: boolean;
  onClick?: (item: IProject) => void;
}

const SearchResults: FC<IProps> = ({
  className,
  projects,
  funds,
  persons,
  isVisible,
  isLoading,
  onClick,
}) => {
  const router = useRouter();

  return (
    <SearchResultsWrapper className={className} isVisible={isVisible}>
      {!isLoading && projects.length === 0 && funds.length === 0 && persons.length === 0 ? (
        <>
          <br />
          <EmptyList imgWidth={120} lineHeight={150} fontSize={16} gap={20} />
          <br />
        </>
      ) : null}
      <></>
      <SearchResultsItems>
        <SearchResultsList>
          {isLoading ? (
            <div>
              <Placeholder width="100%" height="60px" marginBottom="2px" />
              <Placeholder width="100%" height="60px" marginBottom="2px" />
              <Placeholder width="100%" height="60px" marginBottom="2px" />
              <Placeholder width="100%" height="60px" marginBottom="2px" />
              <Placeholder width="100%" height="60px" marginBottom="2px" />
            </div>
          ) : (
            projects.map((item: IProject) => {
              return (
                <SearchResultsItem
                  onClick={() =>
                    onClick
                      ? onClick(item)
                      : router.push(
                        `/crypto/project/${item._id}?status=${item.status}`
                      )
                  }
                  tabIndex={0}
                  key={item._id}
                >
                  <img
                    src={getProjectImage(
                      item.logo || item.metadataLogo,
                      item.name || item.symbol
                    )}
                    alt={item.name}
                    onError={setProjectImageFallback}
                  />
                  <SearchResultsItemInfo>
                    <SearchResultsItemTitle>{item.name}</SearchResultsItemTitle>
                    <SearchResultsItemDescription>
                      {item.banner}
                    </SearchResultsItemDescription>
                  </SearchResultsItemInfo>
                </SearchResultsItem>
              );
            })
          )}
        </SearchResultsList>
      </SearchResultsItems>
    </SearchResultsWrapper>
  );
};

export default SearchResults;
