import React from "react";
import UniversalTable from "../../../global/common/UniversalTable";
import RelationInsights from "./RelationInsights";
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
import Link from "next/link";

interface EcosystemTableProps {
  selectedEntity: any;
  relationsData: any[];
  filters: {
    persons: boolean;
    funds: boolean;
    projects: boolean;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
  hopLevel: number;
}

const EcosystemTable: React.FC<EcosystemTableProps> = ({
  selectedEntity,
  relationsData,
  filters,
  dateRange,
  hopLevel,
}) => {
  // Calculate real metrics from data
  const totalRelations = relationsData.length;
  const activeRelations = relationsData.filter(
    (item) => item.status === "Active"
  ).length;
  const personsCount = relationsData.filter(
    (item) => item.type === "persons"
  ).length;
  const fundsCount = relationsData.filter(
    (item) => item.type === "funds"
  ).length;
  const projectsCount = relationsData.filter(
    (item) => item.type === "projects"
  ).length;

  // Network reach calculations using real hop level from graph
  // Invert: as we go deeper (hopLevel increases), remaining hops decrease
  const networkHops = 4 - hopLevel; // hopLevel 1 -> 3 hops, hopLevel 2 -> 2 hops, hopLevel 3 -> 1 hop
  const reachableEntities = totalRelations * (networkHops + 1) * 5;

  return (
    <TableSection>
      <TableContentWrapper>
        <TableWrapper>
          <TableTitle>
            <EntityName>Relations</EntityName>
            <Link href={"/crypto/persons/1"}>
              <EntityAvatar
                src={selectedEntity.logo || "/static/projects/avatar1.jpg"}
                alt={selectedEntity.name}
                onError={(e) => {
                  e.currentTarget.src = "/static/projects/avatar1.jpg";
                }}
              />
            </Link>
            <Link href={"/crypto/persons/1"}>
              <RelationsLabel>{selectedEntity.name}</RelationsLabel>
            </Link>
          </TableTitle>
          <UniversalTable
            isLoading={false}
            page={1}
            items={relationsData}
            sortValue={undefined}
            gridColumns="0.15fr 0.35fr 0.35fr 0.15fr"
            favKey="ecosystem-relations"
            sortHeaders={[
              { label: "Type" },
              { label: "Entity" },
              { label: "Relation" },
              { label: "Status" },
            ]}
            type="custom"
            isFavButton={false}
            minWidth={800}
            className="connections"
            link=""
          />
          <Pagination
            totalPage={5}
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
          personsCount={personsCount}
          fundsCount={fundsCount}
          projectsCount={projectsCount}
        />
      </TableContentWrapper>
    </TableSection>
  );
};

export default EcosystemTable;
