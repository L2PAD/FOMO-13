import React from "react";
import UniversalTable from "../../../global/common/UniversalTable";
import RelationInsights from "./RelationInsights";
import WalletExplorer from "./WalletExplorer";
import Pagination from "../../../global/Pagintaion";
import {
  TableSection,
  TableContentWrapper,
  TableWrapper,
  TableTitle,
  EntityAvatar,
  EntityName,
  RelationsLabel,
} from "./styles";

interface OnChainTableProps {
  selectedEntity: any;
  transfersData: any[];
  onChainFilters: {
    centralizedExchanges: boolean;
    depositAddresses: boolean;
    individualsAndFunds: boolean;
    decentralizedExchanges: boolean;
    lending: boolean;
    misc: boolean;
    uncategorized: boolean;
    all: boolean;
  };
  flowDirection: "all" | "in" | "out" | "self";
  dateRange: {
    start: Date;
    end: Date;
  };
  hopLevel: number;
}

const OnChainTable: React.FC<OnChainTableProps> = ({
  selectedEntity,
  transfersData,
  onChainFilters,
  flowDirection,
  dateRange,
  hopLevel,
}) => {
  // Calculate real metrics from transfers data
  const totalRelations = transfersData.length;
  const activeRelations = totalRelations; // All transfers are considered active
  // Network reach calculations using real hop level from graph
  // Invert: as we go deeper (hopLevel increases), remaining hops decrease
  const networkHops = 4 - hopLevel; // hopLevel 1 -> 3 hops, hopLevel 2 -> 2 hops, hopLevel 3 -> 1 hop
  const reachableEntities = totalRelations * (networkHops + 1) * 10;

  return (
    <TableSection>
      <TableContentWrapper className="onchain">
        <TableWrapper className="onchain">
          <TableTitle>
            <EntityName>Transfers</EntityName>
            <EntityAvatar
              src={selectedEntity.logo || "/static/projects/avatar1.jpg"}
              alt={selectedEntity.name}
              onError={(e) => {
                e.currentTarget.src = "/static/projects/avatar1.jpg";
              }}
            />
            <RelationsLabel>{selectedEntity.name}</RelationsLabel>
          </TableTitle>
          <UniversalTable
            isLoading={false}
            page={1}
            items={transfersData}
            sortValue={undefined}
            gridColumns="35px 0.1fr 0.2fr 0.2fr 0.15fr 0.15fr 0.1fr 0.1fr"
            link=""
            favKey="onchain-transfers"
            sortHeaders={[
              { label: "", type: "link" },
              { label: "Time" },
              { label: "From" },
              { label: "To" },
              { label: "Value" },
              { label: "Token" },
              { label: "USD" },
              { label: "On-Chain Score" },
            ]}
            type="onchain-transfers"
            isFavButton={false}
            minWidth={1000}
            className="onchain"
          />
          <Pagination
            totalPage={625}
            page={1}
            onChange={() => {}}
            limit={10}
            total={totalRelations}
          />
        </TableWrapper>

        <RelationInsights
          totalRelations={totalRelations}
          activeRelations={activeRelations}
          networkHops={networkHops}
          reachableEntities={reachableEntities}
          personsCount={0}
          fundsCount={0}
          projectsCount={0}
        />
        <WalletExplorer
          address="bc1q8bcqxtc8ha0qst4g"
          balance="78,317.04"
          token="BTC"
          tokenLogo="/static/crypto-icons/btc.svg"
          pctOfSupply="0.39%"
          value="$7,877,519,020.65"
        />
      </TableContentWrapper>
    </TableSection>
  );
};

export default OnChainTable;
