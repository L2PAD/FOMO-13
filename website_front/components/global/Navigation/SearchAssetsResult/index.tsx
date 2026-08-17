import React, {
  FC,
  memo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/router";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../helpers/imageFallbacks";
import { IGlobalAsset } from "../../../../types/global_types";
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
  assets: Array<IGlobalAsset>;
  isVisible: boolean;
  isLoading: boolean;
  onClick?: (item: IGlobalAsset) => void;
}

const formatAssetSymbol = (value?: string | null): string =>
  String(value || "").trim().toUpperCase();

const MemoizedSearchResultsItem = memo(
  ({
    item,
    onClick,
    type,
  }: {
    item: IGlobalAsset;
    onClick?: (item: IGlobalAsset) => void;
    type: "projects" | "funds" | "persons";
  }) => {
    const router = useRouter();
    const handleClick = () => {
      if (onClick) onClick(item);
    };

    return (
      <SearchResultsItem onClick={handleClick} tabIndex={0}>
        <img
          src={getProjectImage(item.logo, item.name || item.ticker)}
          alt={item.name}
          loading="lazy"
          onError={setProjectImageFallback}
        />
        <SearchResultsItemInfo>
          <SearchResultsItemTitle>{item.name}</SearchResultsItemTitle>
          <SearchResultsItemDescription>
            {formatAssetSymbol(item.symbol || item.ticker)}
          </SearchResultsItemDescription>
        </SearchResultsItemInfo>
      </SearchResultsItem>
    );
  }
);

const SearchAssetsResults: FC<IProps> = ({
  className,
  assets,
  isVisible,
  isLoading,
  onClick,
}) => {
  const [visibleProjects, setVisibleProjects] = useState<IGlobalAsset[]>([]);
  const [limit, setLimit] = useState(25);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!assets.length) return;

    setVisibleProjects(assets.slice(0, limit));
  }, [assets, limit]);

  return (
    <SearchResultsWrapper className={className} isVisible={isVisible}>
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <Placeholder
            key={index}
            width="100%"
            height="60px"
            marginBottom="2px"
          />
        ))
      ) : (
        <>
          {assets.length > 0 ? (
            <SearchResultsItems>
              <SearchResultsList>
                {visibleProjects.map((item) => (
                  <MemoizedSearchResultsItem
                    key={item._id}
                    item={item}
                    onClick={onClick}
                    type="projects"
                  />
                ))}
                <div ref={observerRef} style={{ height: "10px" }} />
              </SearchResultsList>
            </SearchResultsItems>
          ) : (
            <EmptyList
              imgWidth={80}
              gap={15}
              textWidth={130}
              fontSize={12}
              lineHeight={150}
            />
          )}
        </>
      )}
    </SearchResultsWrapper>
  );
};

export default SearchAssetsResults;
