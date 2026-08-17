import React, { FC, useEffect, useState } from "react";
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
import fetchAssets from "../../../../http/assets/fetchAssets";
import SearchAssetsResults from "../../Navigation/SearchAssetsResult";

const SelectedItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;

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

const FullWidthSearchInput = styled(SearchInput)`
  width: 100%;

  &.crypto-market-search input {
    width: 100%;
  }
`;

interface IProps {
  assets: Array<any>;
  placeholder?: string;
  isOneProject?: boolean;
  className?: string;
  isSelectedVisible?: boolean;
  fetchAssetsRequest?: (
    searchValue: string
  ) => Promise<{ isSuccess?: boolean; assets: Array<any> }>;
  onChange: (items: Array<any>) => void;
}

const AssetsSearch: FC<IProps> = ({
  assets,
  placeholder,
  isOneProject,
  className,
  isSelectedVisible = true,
  fetchAssetsRequest,
  onChange,
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedValue, setDebouncedValue] = useState<string>(searchValue);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  const { data, isLoading } = useQuery(
    ["search-assets", debouncedValue, Boolean(fetchAssetsRequest)],
    () => {
      if (fetchAssetsRequest) return fetchAssetsRequest(debouncedValue);

      return fetchAssets(
        "",
        `/assets?searchValue=${debouncedValue}&page=1&limit=25`
      );
    },
    {
      enabled: !!debouncedValue,
      refetchOnWindowFocus: false,
    }
  );

  const addAsset = (item: any): void => {
    if (assets.find((inv: any) => inv._id === item._id)) return;

    const updatedInvestors = [item, ...assets];

    if (isOneProject) {
      console.log(item);
      setIsOpen(false);
      onChange([item]);

      return;
    }

    onChange(updatedInvestors);
  };

  const removeAsset = (item: any): void => {
    const updatedInvestors = assets.filter((inv: any) => inv._id !== item._id);
    onChange(updatedInvestors);
  };

  return (
    <>
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}
      <SearchContainer className="projects-search-container">
        <SearchWrapper className={className}>
          <FullWidthSearchInput
            className="crypto-market-search"
            onFocus={(value: boolean) => setIsOpen(value)}
            type="text"
            placeholder={placeholder || "Search for an asset"}
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle className="asset-icon" />}
            value={searchValue}
          />
        </SearchWrapper>
        <SearchAssetsResults
          className="assets-search-results"
          isLoading={isLoading}
          isVisible={isOpen}
          assets={data?.assets || []}
          onClick={(item: any) => addAsset(item)}
        />
        {isSelectedVisible ? (
          <SelectedItems>
            {assets.map((item: any) => (
              <div key={item._id}>
                <img
                  src={getProjectImage(item.logo, item.name || item.symbol)}
                  alt={item.name}
                  onError={setProjectImageFallback}
                />
                <span>{item.name}</span>
                <button onClick={() => removeAsset(item)}>
                  <CloseIcon fill="#738094" />
                </button>
              </div>
            ))}
          </SelectedItems>
        ) : (
          <></>
        )}
      </SearchContainer>
    </>
  );
};

export default AssetsSearch;
