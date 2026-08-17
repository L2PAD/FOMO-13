import React, { FC, useMemo, useState } from "react";
import MainModal from "../../../../../global/common/MainModal";
import { Content, Item, List } from "./styles";
import { SearchInput } from "../../../P2PExchange/TopMembers/styles";
import { SearchIconStyle, SearchWrapper } from "../../../Networks/styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import RatingCircle from "../../../../../global/RatingCircle";
import EmptyList from "../../../../../global/EmptyList";
import { getBackerHref } from "../../../../../../helpers/backerRoute";
import { getInvestorRating } from "../../../../../../helpers/investorRating";

export type TopModalVariants = "Top Followers" | "Projects" | "Funds";

export interface TopModalInterface {
  onClose: () => void;
  isVisible: boolean;
  investors?: Array<any>;
}

const TopInvestorsModal: FC<TopModalInterface> = ({
  onClose,
  isVisible,
  investors,
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const filteredInvestors = useMemo(() => {
    const list = investors || [];
    const search = searchValue.trim().toLowerCase();

    if (!search) return list;

    return list.filter((item) => {
      return (
        String(item?.name || "").toLowerCase().includes(search) ||
        String(item?.niche || "").toLowerCase().includes(search) ||
        String(item?.type || "").toLowerCase().includes(search) ||
        String(item?.entityType || "").toLowerCase().includes(search)
      );
    });
  }, [investors, searchValue]);

  return (
    <MainModal
      variant="big"
      title="Investors"
      onClose={onClose}
      isVisible={isVisible}
    >
      <Content>
        <SearchWrapper>
          <SearchInput
            placeholder="Search"
            type="string"
            value={searchValue}
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle />}
          />
        </SearchWrapper>
        <List variant="main">
          {filteredInvestors?.length ? (
            filteredInvestors.map((item, index: number) => {
              const itemId = item.id || Reflect.get(item, "_id");
              const href =
                item.url ||
                (item.entityType === "person"
                  ? getBackerHref(item, "person")
                  : getBackerHref(item, "fund"));

              return (
                <Item href={href} key={itemId || item.slug || index}>
                  <div className="project">
                    <UserAvatar
                      avatar={imageLoader(item.logo)}
                      name={item.name}
                      variant="default"
                      size="otc"
                    />
                    <div className="project-info">
                      <div>{item.name}</div>
                      <span>{item.niche || item.type || item.entityType}</span>
                    </div>
                  </div>
                  <div className="twitter-info">
                    <RatingCircle
                      rating={getInvestorRating(item)}
                      variant="success"
                    />
                  </div>
                </Item>
              );
            })
          ) : (
            <EmptyList />
          )}
        </List>
      </Content>
    </MainModal>
  );
};

export default TopInvestorsModal;
