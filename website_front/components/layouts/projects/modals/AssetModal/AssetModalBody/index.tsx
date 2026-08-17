import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../../../../global/common/Modal";
import { ArrowDownIcon } from "../../../../../global/Icons";
import { ActionsWrapper } from "../../CustomizeTabModal/styles";
import { SearchIconStyle } from "../../../../../global/Navigation/styles";
import Checkbox from "../../../../../global/common/Checkbox";
import UserAvatar from "../../../../../global/common/UserAvatar";
import {
  AssetCheckboxes,
  AssetRow,
  AssetsHeader,
  AssetsWrapper,
  CreateAssetWrapper,
  DropdownWrapper,
  ProjectsWrapper,
  SearchWrapper,
  SelectWrapper,
} from "../styles";
import MainModal from "../../../../../global/common/MainModal";
import { SearchInput } from "../../../P2PExchange/styles";
import {
  ResetButton,
  Actions,
} from "../../../../../global/UniversalFilter/styles";
import { Action } from "../../../../../global/LeftNav/styles";
import Button from "../../../../../global/common/Button";
import { useQuery } from "react-query";
import fetchAssets from "../../../../../../http/assets/fetchAssets";
import { IGlobalAsset } from "../../../../../../types/global_types";
import { DescriptionText } from "../../CustomizeTabModal/CustomizeTabBody";
import imageLoader from "../../../../../../helpers/imageLoader";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import EmptyList from "../../../../../global/EmptyList";
import { InputError } from "../../CreateOwnAsset/styles";

interface Props {
  isVisible?: boolean;
  buttonText?: string;
  description?: string;
  onClose: () => void;
  onConfirm?: (
    includedAssets: Array<string>,
    excludedAssets: Array<string>
  ) => void;
}

const limit = 10;

const AssetModalBody: FC<Props> = ({
  onClose,
  onConfirm,
  buttonText = "Apply",
  description,
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedValue, setDebouncedValue] = useState<string>(searchValue);
  const [includedAssets, setIncludedAssets] = useState<Array<string>>([]);
  const [excludedAssets, setExcludedAssets] = useState<Array<string>>([]);
  const [page, setPage] = useState<number>(1);
  const [assets, setAssets] = useState<IGlobalAsset[]>([]);
  const [lastElement, setLastElement] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const lastItemRef = (node: HTMLElement | null) => {
    setLastElement(node);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  const { isLoading } = useQuery(
    ["modal-assets", page, debouncedValue],
    () => {
      return fetchAssets(
        "",
        `/assets?searchValue=${debouncedValue}&page=${1}&limit=${limit}`
      );
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: ({ isSuccess, assets: newAssets }) => {
        if (isSuccess) {
          setAssets(newAssets);
        }
      },
    }
  );

  const toggleAssetToIncludes = (id: string): void => {
    if (excludedAssets.includes(id)) {
      setExcludedAssets(excludedAssets.filter((item: string) => item !== id));
    }

    if (includedAssets.includes(id)) {
      setIncludedAssets(includedAssets.filter((item: string) => item !== id));
      return;
    }

    setIncludedAssets((prev: Array<string>) => [...prev, id]);
  };

  const toggleAssetToExcludes = (id: string): void => {
    if (includedAssets.includes(id)) {
      setIncludedAssets(includedAssets.filter((item: string) => item !== id));
    }

    if (excludedAssets.includes(id)) {
      setExcludedAssets(excludedAssets.filter((item: string) => item !== id));
      return;
    }

    setExcludedAssets((prev: Array<string>) => [...prev, id]);
  };

  const confirmAssets = (): void => {
    const isError: boolean = !includedAssets.length && !excludedAssets.length;

    if (isError) {
      setIsError(isError);

      setTimeout(() => {
        setIsError(false);
      }, 3000);

      return;
    }

    onConfirm && onConfirm(includedAssets, excludedAssets);
  };

  useEffect(() => {
    if (!lastElement || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(lastElement);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [lastElement, hasMore, isLoading]);

  return (
    <>
      {description ? <DescriptionText>{description}</DescriptionText> : <></>}
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search for an asset"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle fill="rgba(115, 128, 148, 0.5)" />}
          value={searchValue}
        />
      </SearchWrapper>
      <AssetsWrapper>
        <AssetsHeader>
          <div>Asset</div>
          <div>Include</div>
          <div>Exclude</div>
        </AssetsHeader>
        <>
          {assets.length ? (
            <div className="assets-list">
              {assets.map((item: IGlobalAsset, i) => {
                return (
                  <AssetRow key={item._id}>
                    <div>
                      <UserAvatar
                        size="otc"
                        variant="default"
                        avatar={imageLoader(String(item.logo))}
                        name="name"
                      />
                      <div>
                        <p>{item.name}</p>
                        <span>{item.ticker}</span>
                      </div>
                    </div>
                    <AssetCheckboxes>
                      <Checkbox
                        checked={includedAssets.includes(String(item._id))}
                        onChange={() => toggleAssetToIncludes(String(item._id))}
                      />
                    </AssetCheckboxes>
                    <AssetCheckboxes>
                      <Checkbox
                        checked={excludedAssets.includes(String(item._id))}
                        onChange={() => toggleAssetToExcludes(String(item._id))}
                      />
                    </AssetCheckboxes>
                  </AssetRow>
                );
              })}
            </div>
          ) : (
            <EmptyList />
          )}
          {isLoading ? <PlaceholderTable height="68px" /> : <></>}
          <div style={{ width: "100%", height: "40px" }} ref={lastItemRef} />
        </>
      </AssetsWrapper>
      {isError ? (
        <InputError>
          No assets, no party! Pick at least one to build your tab.
        </InputError>
      ) : (
        <></>
      )}
      <Actions>
        <Action onClick={() => onClose()} actionType="red">
          Cancel
        </Action>
        <Button onClick={confirmAssets} variant="primary">
          {buttonText}
        </Button>
      </Actions>
      <ResetButton>
        <button
          onClick={() => {
            setIncludedAssets([]);
            setExcludedAssets([]);
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
    </>
  );
};

export default AssetModalBody;
