import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import moment from "moment";
import Image from "next/image";
import Pagination from "../../../../global/Pagintaion";
import {
  ContentWrapper,
  TabWrapper,
} from "../../../projects/P2PExchange/styles";
import CommentBlock from "../../../../global/CommentBlock";
import fetchOrders, {
  FetchUserOrdersQuery,
} from "../../../../../http/order/fetchOrders";
import { IOrder } from "../../../../../types/global_types";
import { FlexWrapper, MarketHeaderTitle } from "../styles";
import { TableHeaderRightWrapper } from "../../../projects/CryptoMarket/styles";
import AllIcon from "../../../../../assets/icons/all-sort.svg";
import UniversalTable, {
  ISortHeaderItem,
} from "../../../../global/common/UniversalTable";
import { ordersGridColumns } from "../../../../../staticContent/tables";
import OrdersFilter, {
  OrdersFiltersState,
  createInitialOrdersFilters,
} from "../../../../global/Filter/orders-filter";
import {
  formatTokenId,
  resolveMediaUrl,
} from "../NFTPage/helpers";
import { useTranslation } from "i18n";

const orderSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "ID",
    type: "div",
  },
  {
    label: "NFT",
    type: "div",
  },
  {
    label: "Price",
    type: "div",
  },
  {
    label: "Currency",
    type: "div",
  },
  {
    label: "Date & Time",
    type: "div",
  },
  {
    label: "Status",
    type: "div",
  },
];

const orderTabs = ["All", "Completed", "Approved", "Pending", "Rejected"] as const;
const ORDERS_PAGE_LIMIT = 20;

type OrderTab = (typeof orderTabs)[number];

type TableOrderItem = {
  _id: string;
  project: {
    name: string;
    type: string;
    logo: string;
  };
  allocSize: string;
  orderType: "ETH" | "USDC";
  date: string;
  status: Exclude<OrderTab, "All">;
};

const getOrderStatus = (order: IOrder): Exclude<OrderTab, "All"> => {
  const apiStatus = String((order as IOrder & { status?: string })?.status || "");

  if (apiStatus === "Completed" || apiStatus === "Approved" || apiStatus === "Pending" || apiStatus === "Rejected") {
    return apiStatus;
  }

  const isExpired =
    !!order?.endDate && moment(order.endDate).isValid()
      ? moment(order.endDate).valueOf() <= Date.now()
      : false;

  if (!order?.isActive) {
    return order?.isConfirm ? "Completed" : "Rejected";
  }

  if (order?.isConfirm) {
    return "Approved";
  }

  if (isExpired) {
    return "Rejected";
  }

  return "Pending";
};

const formatOrderPrice = (value?: number): string => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "0";
  }

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: numericValue < 1 ? 2 : 0,
    maximumFractionDigits: 6,
  });
};

const formatOrderDate = (value?: Date | string): string => {
  if (!value) {
    return "-";
  }

  const date = moment(value);

  if (!date.isValid()) {
    return "-";
  }

  return date.format("DD MMM YYYY, HH:mm");
};

const Orders = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [filterValue, setFilterValue] = useState<OrderTab>("All");
  const [appliedFilters, setAppliedFilters] = useState<OrdersFiltersState>(
    createInitialOrdersFilters()
  );
  const [hasAppliedCustomFilters, setHasAppliedCustomFilters] = useState(false);
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>({
    name: "",
    value: 1,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  const selectedStatuses = useMemo(() => {
    if (filterValue === "All") {
      return appliedFilters.orderStatus;
    }

    if (!appliedFilters.orderStatus.length) {
      return [filterValue];
    }

    if (!appliedFilters.orderStatus.includes(filterValue)) {
      return ["__NONE__"];
    }

    return [filterValue];
  }, [appliedFilters.orderStatus, filterValue]);

  const queryFilters = useMemo<FetchUserOrdersQuery>(
    () => ({
      page,
      limit: ORDERS_PAGE_LIMIT,
      statuses: selectedStatuses,
      currencies: appliedFilters.currencies,
      createdStartDate: appliedFilters.createdDates.startDate?.toISOString(),
      createdEndDate: appliedFilters.createdDates.endDate?.toISOString(),
      expirationStartDate: appliedFilters.expirationDates.startDate?.toISOString(),
      expirationEndDate: appliedFilters.expirationDates.endDate?.toISOString(),
      minPrice: appliedFilters.priceRange[0],
      maxPrice: appliedFilters.priceRange[1],
    }),
    [appliedFilters, page, selectedStatuses]
  );

  const { data, isLoading } = useQuery(
    ["orders", queryFilters],
    () => fetchOrders("user", undefined, queryFilters),
    {
      refetchOnWindowFocus: false,
    }
  );

  const maxPrice = Number(data?.maxPrice || 0);
  const total = Number(data?.total || 0);
  const totalPages = Math.max(1, Number(data?.totalPages || 1));
  const paginationLimit = Math.min(total, page * ORDERS_PAGE_LIMIT);

  useEffect(() => {
    if (!hasAppliedCustomFilters) {
      setAppliedFilters(createInitialOrdersFilters(maxPrice));
    }
  }, [hasAppliedCustomFilters, maxPrice]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleApplyFilters = (filters: OrdersFiltersState) => {
    setHasAppliedCustomFilters(
      JSON.stringify(filters) !== JSON.stringify(createInitialOrdersFilters(maxPrice))
    );
    setAppliedFilters(filters);
    setPage(1);
  };

  const tableOrders = useMemo<TableOrderItem[]>(() => {
    return (data?.orders || [])
      .map((order: IOrder) => {
        const nftName = String(order?.nft?.name || "NFT");
        const collectionName = String(
          order?.collection?.name || order?.project?.name || "Collection"
        );
        const nftImage = resolveMediaUrl(
          order?.nft?.displayImage ||
          order?.nft?.image ||
          order?.project?.logo
        );
        const orderId = String(order?._id || "-");
        const tokenIdLabel =
          order?.nft?.nftId !== null && typeof order?.nft?.nftId !== "undefined"
            ? formatTokenId(order?.nft?.nftId)
            : "#-";

        return {
          _id: `#${orderId.slice(-6).toUpperCase()}`,
          project: {
            name: nftName,
            type: `${collectionName} ${tokenIdLabel}`,
            logo: nftImage,
          },
          allocSize: formatOrderPrice(order?.price),
          orderType: order?.isUsdc ? "USDC" : "ETH",
          date: formatOrderDate(order?.created),
          status: getOrderStatus(order),
        };
      });
  }, [data?.orders]);

  return (
    <TabWrapper>
      <MarketHeaderTitle style={{ marginBottom: "20px" }}>{t("orders.title")}</MarketHeaderTitle>
      <FlexWrapper>
        <TableHeaderRightWrapper>
          <button
            className={filterValue === "All" ? "selectedSort" : ""}
            onClick={() => {
              setFilterValue("All");
              setPage(1);
            }}
          >
            <Image src={AllIcon} alt="all" />
            {t("orders.status.all")}
          </button>
          <button
            className={filterValue === "Completed" ? "selectedSort" : ""}
            onClick={() => {
              setFilterValue("Completed");
              setPage(1);
            }}
          >
            {t("orders.status.completed")}
          </button>
          <button
            className={filterValue === "Approved" ? "selectedSort" : ""}
            onClick={() => {
              setFilterValue("Approved");
              setPage(1);
            }}
          >
            {t("orders.status.approved")}
          </button>
          <button
            className={filterValue === "Pending" ? "selectedSort" : ""}
            onClick={() => {
              setFilterValue("Pending");
              setPage(1);
            }}
          >
            {t("orders.status.pending")}
          </button>
          <button
            className={filterValue === "Rejected" ? "selectedSort" : ""}
            onClick={() => {
              setFilterValue("Rejected");
              setPage(1);
            }}
          >
            {t("orders.status.rejected")}
          </button>
        </TableHeaderRightWrapper>
        <OrdersFilter onApply={handleApplyFilters} maxPrice={maxPrice} />
      </FlexWrapper>
      <ContentWrapper>
        <UniversalTable
          link=""
          favKey="project.name"
          type="orders"
          gridColumns={ordersGridColumns}
          sortHeaders={orderSortHeaders}
          updateSortValue={updateSortValue}
          isLoading={isLoading}
          sortValue={sortValue}
          page={page}
          isFavButton={false}
          minWidth={isMobile ? 760 : 1000}
          items={tableOrders}
        />
        {total > 0 ? (
          <Pagination
            page={page}
            total={total}
            limit={paginationLimit}
            totalPage={totalPages}
            onChange={(value) => setPage(value)}
          />
        ) : null}
      </ContentWrapper>
    </TabWrapper>
  );
};

export default Orders;
