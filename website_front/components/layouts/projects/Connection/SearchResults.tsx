import React from "react";
import styled from "styled-components";
import imageLoader from "../../../../helpers/imageLoader";
import { toClientAbsoluteUrl } from "../../../../helpers/getClientOrigin";

const ResultsWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10000;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f9fd;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .placeholder-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
  }

  span {
    font-size: 14px;
    color: #070b35;
    font-weight: var(--font-weight-medium);
  }
`;

const NoResults = styled.div`
  padding: 16px;
  text-align: center;
  color: #738094;
  font-size: 14px;
`;

interface SearchResultsProps {
  isVisible: boolean;
  results: Array<{ _id: string; name: string; logo: string }>;
  onSelect: (item: any) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  isVisible,
  results,
  onSelect,
}) => {
  const getImageSrc = (logo: string) => {
    if (logo.startsWith("/")) {
      return toClientAbsoluteUrl(logo);
    }

    return imageLoader(logo);
  };

  return (
    <ResultsWrapper isVisible={isVisible}>
      {results.length > 0 ? (
        results.map((item) => (
          <ResultItem key={item._id} onClick={() => onSelect(item)}>
            {item.logo ? (
              <img
                src={getImageSrc(item.logo)}
                alt={item.name}
              />
            ) : (
              <div className="placeholder-icon">
                {item.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{item.name}</span>
          </ResultItem>
        ))
      ) : (
        <NoResults>No results found</NoResults>
      )}
    </ResultsWrapper>
  );
};

export default SearchResults;
