import React, { useState, useRef, useEffect, FC } from "react";
import styled from "styled-components";
import { SearchWrapper } from "../../layouts/projects/Networks/styles";
import { SearchInput } from "../../layouts/projects/P2PExchange/styles";
import Loader from "../loader";
import Placeholder from "../common/Placeholder";
import imageLoader from "../../../helpers/imageLoader";
import { IParcingTwitterAcc } from "../../../types/global_types";
import { useQuery } from "react-query";
import fetchTwitterAccs from "../../../http/parcing/fetchTwitterAccs";
import {
  OptionItem,
  SearchIconStyle,
} from "../common/DropdownWithSearch/styles";
import EntityInfo from "../common/EntityInfo";
import { CheckIcon } from "../Icons";
import OptionIcon from "../Icons/OptionIcon";
import { useDebounce } from "../../../hooks/useDebounce";
import PlaceholderTable from "../common/PlaceholderTable";
import EmptyList from "../EmptyList";

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  &.modal-search {
    margin-top: 7px;
    svg path {
      fill: #b5bcc7;
    }
    input {
      font-size: 14px;

      &::placeholder {
        font-size: 14px;
        color: #b5bcc7;
      }
    }
  }

  &.small-search {
    margin-bottom: 4px;
    svg path {
      fill: #b5bcc7;
    }
    input {
      width: 190px;
      font-size: 14px;

      &::placeholder {
        font-size: 14px;
        color: #b5bcc7;
      }
    }
  }
`;

const SearchResults = styled.div`
  position: absolute;
  z-index: 1;
  width: 100%;
  top: 36px;
`;

const Items = styled.ul`
  margin-top: 5px;
  max-height: 320px;
  overflow-y: auto;
  list-style: none;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Item = styled.button`
  width: 100%;
  background: #fff;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: var(--input-hover);
  }
  &:active {
    background: var(--input-active);
  }
`;

const Flag = styled.img`
  position: absolute;
  top: 12px;
  left: 8px;
  width: 20px;
  height: 15px;
  object-fit: cover;
`;

const EmptyWrapper = styled.div`
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
interface IProps {
  className?: "modal-search" | "small-search" | string;
  selectedItems: Array<IParcingTwitterAcc>;
  placeholder?: string;
  disabled?: boolean;
  type?: "" | "/user";
  subtype?: "default" | "sentiment";
  onChange: (item: any) => void;
}

const SearchParsingAccounts: FC<IProps> = ({
  className,
  selectedItems,
  disabled,
  placeholder = "Select an account",
  type = "",
  subtype = "default",
  onChange,
}) => {
  const [query, setQuery] = useState<string>("");
  const [items, setItems] = useState<Array<IParcingTwitterAcc>>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  const { isLoading } = useQuery(
    ["search-parsing-accs", type, subtype, debouncedQuery],
    () =>
      fetchTwitterAccs(
        `${type}?searchValue=${debouncedQuery}&type=${subtype}`
      ).then(({ isSuccess, accs }) => {
        setItems(accs);
      }),
    {
      refetchOnWindowFocus: false,
      enabled: !!debouncedQuery,
    }
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Container className={className} ref={wrapperRef}>
      <SearchWrapper>
        <SearchInput
          className="small-input"
          disabled={!!disabled}
          onFocus={() => setIsVisible(true)}
          value={query}
          onChange={(value: string) => {
            setQuery(value);
            setIsVisible(true);
          }}
          placeholder={placeholder}
          type="text"
          leftIcon={<SearchIconStyle fill="#B5BCC7" />}
        />
      </SearchWrapper>

      {isVisible && query.length > 0 && (
        <SearchResults>
          {isLoading ? (
            <>
              <div style={{ paddingTop: "5px" }} />
              <Placeholder height="320px" />
            </>
          ) : items?.length ? (
            <Items>
              {items.map((item) => {
                const isSelectedItem = !!selectedItems.find(
                  (acc) => acc._id === item._id
                );

                return (
                  <Item
                    onClick={() => {
                      onChange(item);
                      // setIsVisible(false); // ⛔️ не закрывай список здесь, если хочешь оставить его открытым
                    }}
                    key={item._id}
                  >
                    <OptionIcon label="2" value="1" isActive={isSelectedItem} />
                    <EntityInfo
                      img={item.avatar}
                      name={item.name || item.username}
                      username={item.username}
                      variant="default"
                    />
                  </Item>
                );
              })}
            </Items>
          ) : (
            <EmptyWrapper>
              <br />
              <EmptyList
                imgWidth={150}
                fontSize={14}
                lineHeight={120}
                gap={12}
              />
              <br />
              <br />
            </EmptyWrapper>
          )}
        </SearchResults>
      )}
    </Container>
  );
};

export default SearchParsingAccounts;
