import React, { useEffect, useState } from "react";
import ResponsivePagination from "react-responsive-pagination";
import { TableWrapper } from "../styles";
import NewListings from "./NewListings";
import Bids from "./Bids";
import Activity from "./Activity";
import TopHolders from "./TopHolders";
import AmountDistribution from "./AmountDistribution";
import { PaginationWrapper } from "../../styles";
import Tabs from "../../../../../global/Tabs";
import Typography from "../../../../../global/common/Typography";

export const NFTS = () => {
  const [activeTab, setActiveTab] = useState("New Listings");
  const [page] = useState(1);
  const [total, setTotal] = useState(50);
  const [cursors] = useState<string[]>([]);
  const [cursor] = useState<string>();

  useEffect(() => {
    setTotal(cursors.length + 1);
  }, [cursors]);

  const pagination = (
    <PaginationWrapper>
      <div>
        <ResponsivePagination
          current={page}
          total={total}
          onPageChange={() => {}}
        />
      </div>
      <Typography variant="p">5 of {cursors.length * 5}</Typography>
    </PaginationWrapper>
  );

  const render = () => {
    switch (activeTab) {
      case "Bids":
        return (
          <>
            <Bids />
            {pagination}
          </>
        );
      case "Activity":
        return (
          <>
            <div style={{ width: 920 }}>
              <Activity />
            </div>
            {pagination}
          </>
        );
      case "New Listings":
        return (
          <>
            <div style={{ width: 920 }}>
              <NewListings cursor={cursor} />
            </div>
            {pagination}
          </>
        );
      case "Top holders":
        return (
          <>
            <TopHolders />
            {pagination}
          </>
        );
      case "Amount distribution":
        return <AmountDistribution />;

      default:
        return "";
    }
  };

  return (
    <TableWrapper>
      <div>
        <Tabs
          items={[
            "Bids",
            "Activity",
            "New Listings",
            "Top holders",
            "Amount distribution",
          ]}
          activeItem={activeTab}
          onClick={setActiveTab}
        />
      </div>
      {render()}
    </TableWrapper>
  );
};
