import React, { FC, useState } from "react";
import { Wrapper } from "./styles";
import UniversalTable from "../../../../../global/common/UniversalTable";
import {
  dealsGridColumns,
  dealsSortHeaders,
} from "../../../../../../staticContent/tables";
import { useQuery } from "react-query";
import fetchDeals from "../../../../../../http/otc/fetchDeals";
import fetchMyNftMarketplaceDeals from "../../../../../../http/collections/fetchMyNftMarketplaceDeals";
import EmptySection from "../../../../../global/EmptySection";
import Pagination from "../../../../../global/Pagintaion";
import { useTranslation } from "i18n";

const limit = 10;

interface IProps {
  section?: "otc" | "p2p" | "allocation" | "nft-market";
  sectionEmptyTitle?: string;
  sectionEmptyDescription?: string;
}

const ProfileDealsList: FC<IProps> = ({
  section = "otc",
  sectionEmptyTitle,
  sectionEmptyDescription,
}) => {
  const { translateText } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const { isLoading, data, refetch } = useQuery(
    [`${section}-deals`, page],
    () => {
      const offset = (page - 1) * limit;

      if (section === "nft-market") {
        return fetchMyNftMarketplaceDeals({ limit, offset });
      }

      return fetchDeals(
        "all",
        `?limit=10&offset=${offset}&sortField=New`,
        section
      );
    }
  );
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const resolvedEmptyTitle =
    sectionEmptyTitle ||
    (section === "p2p"
      ? "No P2P activity yet"
      : section === "allocation"
        ? "No Allocation Market activity"
        : section === "nft-market"
          ? "No NFT Market activity"
          : "No OTC activity");
  const resolvedEmptyDescription =
    section === "allocation"
      ? "You haven't completed any Allocation Market deals yet. Start trading and build your private deal history!"
      : section === "nft-market"
        ? "You haven't completed any NFT Market deals yet. Start trading and build your private deal history!"
        : sectionEmptyDescription ||
          "You haven't completed any OTC deals yet. Start trading and build your private deal history!";

  return data?.deals?.length ? (
    <Wrapper>
      <UniversalTable
        isFavorite={isFavorite}
        setIsFavorite={setIsFavorite}
        link=""
        type={(section === "otc" || section === "nft-market") ? "otc" : "deals"}
        favKey="DEALS-OTC-ICO-FAV"
        gridColumns={dealsGridColumns}
        sortHeaders={dealsSortHeaders}
        updateSortValue={(name: string, value: 1 | -1) => console.log(name)}
        isLoading={isLoading}
        sortValue={{ name: "", value: 1 }}
        page={limit}
        items={data?.deals || []}
        isFavButton={false}
        minWidth={750}
      />
      {Number(data?.total) > limit ? (
        <Pagination
          page={page}
          total={Number(data?.total)}
          limit={
            Number(data?.total) < page * limit ? data?.total : page * limit
          }
          totalPage={Math.ceil(Number(data?.total) / limit)}
          onChange={(value) => {
            setPage(value);
          }}
        />
      ) : (
        <></>
      )}
    </Wrapper>
  ) : (
    <div className="dataBody">
      <EmptySection
        className="empty"
        title={translateText(resolvedEmptyTitle)}
        description={translateText(resolvedEmptyDescription)}
      />
    </div>
  );
};

export default ProfileDealsList;
