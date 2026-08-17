import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import SearchResults from "../../Navigation/SearchResults";
import { SearchContainer } from "../../../layouts/projects/CryptoMarket/styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import {
  SearchIconStyle,
  SearchWrapper,
} from "../../../layouts/projects/Networks/styles";
import fetchFundsByQuery from "../../../../http/funds/fetchFundsByQuery";
import fetchFundingRoundInvestors from "../../../../http/funding-rounds/fetchFundingRoundInvestors";
import fetchPersonsByQuery from "../../../../http/investors/fetchPersonsByQuery";
import imageLoader from "../../../../helpers/imageLoader";
import { CloseIcon } from "../../Icons";

type InvestorSearchItem = {
  _id: string;
  id?: string | number;
  dropstabId?: string | number;
  slug?: string;
  investorSlug?: string;
  name: string;
  logo?: string;
  avatar?: string;
  image?: string;
  metadataLogo?: string;
  banner?: string;
  type?: string;
  investorType?: "fund" | "person" | "round";
};

const SelectedItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  div {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #ffffff;
    border: 1px solid #dbe8ee;
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 14px;
    color: #070b35;

    img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
      background: #eef4f7;
    }

    span {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

interface IProps {
  className?: "light-gray" | string;
  investors: Array<any>;
  onChange: (investors: Array<any>) => void;
  source?: "funds" | "fundingRounds";
}

const getInvestorKey = (item: any): string => {
  return String(
    item?._id ||
      item?.id ||
      item?.dropstabId ||
      item?.slug ||
      item?.investorSlug ||
      item?.name ||
      ""
  );
};

const getInvestorImage = (item: any): string => {
  return (
    item?.logo ||
    item?.avatar ||
    item?.image ||
    item?.metadataLogo ||
    item?.logo_url ||
    ""
  );
};

const normalizeInvestor = (
  item: any,
  investorType: InvestorSearchItem["investorType"]
): InvestorSearchItem | null => {
  const name = String(item?.name || "").trim();

  if (!name) return null;

  const slug = item?.slug || item?.investorSlug;
  const id = item?._id || item?.id || item?.dropstabId || slug || name;
  const logo = getInvestorImage(item);

  return {
    ...item,
    _id: String(id),
    id: item?.id,
    dropstabId: item?.dropstabId || item?.id,
    slug,
    investorSlug: item?.investorSlug || slug,
    name,
    logo,
    avatar: item?.avatar || logo,
    image: item?.image || logo,
    metadataLogo: item?.metadataLogo || logo,
    banner:
      investorType === "person"
        ? item?.currentRole || item?.specialization || "Person"
        : item?.type || item?.ventureType || "Fund",
    investorType,
  };
};

const uniqueInvestors = (items: InvestorSearchItem[]): InvestorSearchItem[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getInvestorKey(item).toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const InvestorsSearch: FC<IProps> = ({
  className,
  investors,
  onChange,
  source = "funds",
}) => {
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data: searchResults = [], isLoading } = useQuery(
    ["search-investors", source, searchValue],
    async () => {
      const query = searchValue.trim();

      if (source === "fundingRounds") {
        const [roundsResponse, fundsResponse, personsResponse] =
          await Promise.allSettled([
            fetchFundingRoundInvestors(query),
            fetchFundsByQuery(`?name=${encodeURIComponent(query)}&limit=10`),
            fetchPersonsByQuery(`?name=${encodeURIComponent(query)}&limit=10`),
          ]);
        const roundInvestors =
          roundsResponse.status === "fulfilled"
            ? roundsResponse.value.investors || []
            : [];
        const funds =
          fundsResponse.status === "fulfilled"
            ? fundsResponse.value.funds || []
            : [];
        const persons =
          personsResponse.status === "fulfilled"
            ? personsResponse.value.persons || []
            : [];

        return uniqueInvestors([
          ...roundInvestors
            .map((item) => normalizeInvestor(item, "round"))
            .filter(Boolean),
          ...funds
            .map((item) => normalizeInvestor(item, "fund"))
            .filter(Boolean),
          ...persons
            .map((item) => normalizeInvestor(item, "person"))
            .filter(Boolean),
        ] as InvestorSearchItem[]);
      }

      const [fundsResponse, personsResponse] = await Promise.all([
        fetchFundsByQuery(`?name=${encodeURIComponent(query)}&limit=10`),
        fetchPersonsByQuery(`?name=${encodeURIComponent(query)}&limit=10`),
      ]);

      return uniqueInvestors([
        ...(fundsResponse.funds || [])
          .map((item) => normalizeInvestor(item, "fund"))
          .filter(Boolean),
        ...(personsResponse.persons || [])
          .map((item) => normalizeInvestor(item, "person"))
          .filter(Boolean),
      ] as InvestorSearchItem[]);
    },
    {
      refetchOnWindowFocus: false,
      enabled: searchValue.trim().length > 0,
    }
  );

  const selectedInvestors = useMemo(
    () =>
      investors
        .map((item) => normalizeInvestor(item, item?.investorType || "fund"))
        .filter(Boolean) as InvestorSearchItem[],
    [investors]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isOpen]);

  const addInvestor = (item: any): void => {
    const nextInvestor = normalizeInvestor(item, item?.investorType || "fund");

    if (!nextInvestor) return;

    if (
      selectedInvestors.find(
        (inv: any) => getInvestorKey(inv) === getInvestorKey(nextInvestor)
      )
    ) {
      return;
    }

    const updatedInvestors: Array<any> = [nextInvestor, ...selectedInvestors];

    onChange(updatedInvestors);
    setSearchValue("");
    setIsOpen(false);
  };

  const removeInvestor = (item: any): void => {
    const itemKey = getInvestorKey(item);
    const updatedInvestors: Array<any> = selectedInvestors.filter(
      (inv: any) => getInvestorKey(inv) !== itemKey
    );

    onChange(updatedInvestors);
  };

  return (
    <div ref={searchRef}>
      <SearchContainer>
        <SearchWrapper>
          <SearchInput
            className={`${className} small-input`}
            onFocus={(value: boolean) => setIsOpen(true)}
            type="text"
            placeholder="Search investors"
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle />}
            value={searchValue}
          />
        </SearchWrapper>
        <SearchResults
          isLoading={isLoading}
          isVisible={isOpen}
          funds={[]}
          projects={searchResults as any}
          persons={[]}
          onClick={(item: any) => addInvestor(item)}
        />
        <SelectedItems>
          {selectedInvestors.map((item: any) => {
            const image = getInvestorImage(item);

            return (
              <div key={getInvestorKey(item)}>
                {image ? (
                  <img src={imageLoader(String(image))} alt={item.name} />
                ) : (
                  <img alt={item.name} />
                )}
                <span>{item.name}</span>
                <button type="button" onClick={() => removeInvestor(item)}>
                  <CloseIcon fill="#738094" />
                </button>
              </div>
            );
          })}
        </SelectedItems>
      </SearchContainer>
    </div>
  );
};

export default InvestorsSearch;
