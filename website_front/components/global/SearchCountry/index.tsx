import React, { useState, useEffect, FC } from "react";
import styled from "styled-components";
import { SearchWrapper } from "../../layouts/projects/Networks/styles";
import {
  SearchIconStyle,
  SearchInput,
} from "../../layouts/projects/P2PExchange/styles";
import Loader from "../loader";
import Placeholder from "../common/Placeholder";
import { ICountry } from "../GlobalMap";
import imageLoader from "../../../helpers/imageLoader";

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #f9f9f9;

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

const CountryList = styled.ul`
  margin-top: 5px;
  max-height: 320px;
  overflow-y: auto;
  list-style: none;
  padding: 6px;
  background: white;
`;

const CountryItem = styled.button`
  width: 100%;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  display: flex;
  align-items: center;
  gap: 8px;

  & .name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  & .code {
    font-size: 14px;
    color: var(--main-gray);
  }
  transition: all 0.3s ease;
  &:hover {
    background: var(--input-hover);
  }
  &:active {
    background: var(--input-active);
  }
`;

const PlaceholdersList = styled.div`
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Flag = styled.img`
  position: absolute;
  top: 12px;
  left: 8px;
  width: 20px;
  height: 15px;
  object-fit: cover;
`;

interface IProps {
  className?: "modal-search" | "small-search" | string;
  countries?: ICountry[];
  selectedCountry: ICountry | null;
  placeholder?: string;
  disabled?: boolean;
  onChange: (country: any) => void;
}

const SearchCountry: FC<IProps> = ({
  className,
  countries: countryOptions = [],
  selectedCountry,
  disabled,
  placeholder = "Find country or region",
  onChange,
}) => {
  const [query, setQuery] = useState<string>("");
  const [countries, setCountries] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCountries = async (name: string) => {
    try {
      if (countryOptions.length) {
        const normalizedName = name.trim().toLowerCase();
        setIsLoading(false);
        setCountries(
          countryOptions
            .filter((country) => {
              return [
                country.id,
                country.properties?.name,
                country.region,
                country.subregion,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value).toLowerCase().includes(normalizedName)
                );
            })
            .slice(0, 20)
        );
        return;
      }

      setIsLoading(true);

      const response = await fetch(
        `https://restcountries.com/v3.1/name/${name}`
      );

      const data = await response.json();

      setIsLoading(false);

      setCountries(data);
    } catch (error) {
      console.error("Error fetching countries:", error);

      setIsLoading(false);
      setCountries([]);
    }
  };

  useEffect(() => {
    if (selectedCountry?.id === query) return;

    const delayDebounceFn = setTimeout(() => {
      if (query) {
        fetchCountries(query);
      } else {
        setCountries([]);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [query, countryOptions, selectedCountry?.id]);

  return (
    <Container className={className}>
      <SearchWrapper
        style={
          countries.length ? { marginBottom: "12px" } : { marginBottom: "0px" }
        }
      >
        <SearchInput
          disabled={!!disabled}
          value={query}
          onChange={(value: string) => setQuery(value)}
          placeholder={placeholder}
          type="text"
          leftIcon={
            selectedCountry?.img && query.length ? (
              <Flag src={selectedCountry.img} alt={selectedCountry.id} />
            ) : (
              <SearchIconStyle />
            )
          }
        />
      </SearchWrapper>
      <SearchResults>
        {isLoading ? (
          <></>
        ) : countries?.length ? (
          <CountryList>
            {countries.map((country, i) => {
              const isLocalCountry = Boolean(country?.properties);
              const countryId = isLocalCountry ? country.id : country.cca3;
              const countryName = isLocalCountry
                ? country.properties?.name
                : country.name?.common;
              const countryRegion = isLocalCountry
                ? country.region
                : country.region;
              const countrySubregion = isLocalCountry
                ? country.subregion
                : country.subregion;
              const countryFlag = isLocalCountry
                ? country.img
                : country.flags?.png;
              const countryLocationLabel = [countryRegion, countrySubregion]
                .filter(Boolean)
                .join(", ");
              const countryQueryLabel = countryLocationLabel
                ? `${countryId} (${countryLocationLabel})`
                : String(countryId || countryName || "");

              return (
                <CountryItem
                  onClick={() => {
                    onChange(
                      isLocalCountry
                        ? country
                        : {
                            geometry: country.latlng,
                            id: country.cca3,
                            properties: { name: country.name.common },
                            rsmKey: country.cca3,
                            svgPath: country.coatOfArms.svg || "",
                            type: "Feature",
                            img: country.flags.png,
                            region: country.region,
                            subregion: country.subregion,
                          }
                    );
                    setQuery(countryQueryLabel);
                    setCountries([]);
                  }}
                  key={countryId || i}
                >
                  {countryFlag ? (
                    <img
                      src={countryFlag}
                      alt={countryName}
                      width="20"
                      height="15"
                    />
                  ) : null}
                  <span className="name">{countryName}</span>
                  <span className="code">{countryId}</span>
                </CountryItem>
              );
            })}
          </CountryList>
        ) : (
          <></>
        )}
      </SearchResults>
    </Container>
  );
};

export default SearchCountry;
