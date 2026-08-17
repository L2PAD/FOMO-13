import React, { FC } from "react";
import Button from "../../../../../global/common/Button";
import { ColorRing } from "react-loader-spinner";
import imageLoader from "../../../../../../helpers/imageLoader";
import * as S from "./styles";

interface IProps {
  type?: any;
  loading?: boolean;
  label: string;
  inputLabel: string;
  items: Array<any>;
  selected: any;
  searchValue: string;
  btnHandler: any;
  inputHandler: any;
  selectHandler: any;
}

const SearchList: FC<IProps> = ({
  type,
  loading,
  label,
  inputLabel,
  items,
  selected,
  searchValue,
  btnHandler,
  inputHandler,
  selectHandler,
}) => {
  return selected ? (
    <div>
      <S.Label htmlFor="collection-name">{label}</S.Label>
      {type === "nfts" ? (
        <S.SelectedCollection>
          <S.SearchItemImg src={selected.image} alt="nft img" />
          <S.SearchItemBody>
            <S.SearchItemTitle>{selected.name}</S.SearchItemTitle>
            <S.SearchItemDesc>{selected.description}</S.SearchItemDesc>
          </S.SearchItemBody>
          <S.RemoveCollection>
            <Button variant="primary" onClick={btnHandler}>
              Remove
            </Button>
          </S.RemoveCollection>
        </S.SelectedCollection>
      ) : (
        <S.SelectedCollection>
          <S.SearchItemImg
            src={imageLoader(selected.project.logo || selected.image)}
            alt="collection img"
          />
          <S.SearchItemBody>
            <S.SearchItemTitle>
              {selected.title || selected.name}
            </S.SearchItemTitle>
            <S.SearchItemDesc>
              {selected.project.description || selected.description}
            </S.SearchItemDesc>
          </S.SearchItemBody>
          <S.RemoveCollection>
            <Button onClick={btnHandler}>Remove</Button>
          </S.RemoveCollection>
        </S.SelectedCollection>
      )}
    </div>
  ) : (
    <S.SearchWrapper>
      <S.InputWrapper>
        <S.Label htmlFor="input-name">{inputLabel}</S.Label>
        <S.Input
          value={searchValue}
          onChange={(e) => inputHandler(e.target.value)}
          placeholder="Name your collection"
          id="input-name"
          autoComplete="off"
        />
      </S.InputWrapper>
      {searchValue.length ? (
        loading ? (
          <S.Loading>
            <ColorRing
              visible
              height="100"
              width="100"
              wrapperClass="blocks-wrapper"
              colors={["#04A584", "#04A584", "#04A584", "#04A584", "#04A584"]}
            />
          </S.Loading>
        ) : items.length === 0 ? (
          <S.Loading>
            <ColorRing
              visible
              height="100"
              width="100"
              wrapperClass="blocks-wrapper"
              colors={["#04A584", "#04A584", "#04A584", "#04A584", "#04A584"]}
            />
          </S.Loading>
        ) : (
          <S.SearchResult>
            {type === "nfts"
              ? items.map((nft, index) => {
                  return (
                    <S.ResultWrapper key={index}>
                      <S.SearchItem onClick={() => selectHandler(nft)}>
                        <S.SearchItemImg src={nft.image} alt="nft img" />
                        <S.SearchItemBody>
                          <S.SearchItemTitle>
                            {nft.title || nft.name}
                          </S.SearchItemTitle>
                          <S.SearchItemDesc>
                            {nft?.project?.description || nft.description}
                          </S.SearchItemDesc>
                        </S.SearchItemBody>
                      </S.SearchItem>
                      <hr className="line" />
                    </S.ResultWrapper>
                  );
                })
              : items.map((collection) => {
                  return (
                    <S.ResultWrapper key={collection._id}>
                      <S.SearchItem onClick={() => selectHandler(collection)}>
                        <S.SearchItemImg
                          src={imageLoader(
                            collection.project.logo || collection.image
                          )}
                          alt="collection img"
                        />
                        <S.SearchItemBody>
                          <S.SearchItemTitle>
                            {collection.title || collection.name}
                          </S.SearchItemTitle>
                          <S.SearchItemDesc>
                            {collection.project.description ||
                              collection.description}
                          </S.SearchItemDesc>
                        </S.SearchItemBody>
                      </S.SearchItem>
                      <hr className="line" />
                    </S.ResultWrapper>
                  );
                })}
          </S.SearchResult>
        )
      ) : (
        <></>
      )}
    </S.SearchWrapper>
  );
};

export default SearchList;
