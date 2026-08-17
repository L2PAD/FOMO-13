import React, { useMemo, useState } from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import Pagination from "../../../../../global/Pagintaion";
import EmptySection from "../../../../../global/EmptySection";
import { Body, Footer, Header, Row, Wrapper } from "./styles";
import { ProfileTableScroll as Overflow } from "../../../shared/ProfilePageShell";
import type {
  FundVolatilityProject,
  FundVolatilitySortDirection,
  FundVolatilitySortField,
} from "../../../../../../http/funds/fetchFundPerformanceVolatility";

interface IProps {
  projects?: FundVolatilityProject[];
  isLoading?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  sortField?: FundVolatilitySortField;
  sortDirection?: FundVolatilitySortDirection;
  onSortChange?: (
    field: FundVolatilitySortField,
    direction: FundVolatilitySortDirection,
  ) => void;
  onPageChange?: (page: number) => void;
}

type VolatilityProject = NonNullable<IProps["projects"]>[number];
type SortField = FundVolatilitySortField;
type SortDirection = FundVolatilitySortDirection;

const statusWeight: Record<string, number> = {
  Insufficient: 0,
  Low: 1,
  Medium: 2,
  High: 3,
};

const normalizeRiskStatus = (
  status: string,
): "Low" | "Medium" | "High" | "Insufficient" => {
  if (/insufficient|missing/i.test(status)) return "Insufficient";
  if (/high/i.test(status)) return "High";
  if (/medium/i.test(status)) return "Medium";
  return "Low";
};

const PortfolioVolatility: React.FC<IProps> = ({
  projects: items = [],
  isLoading = false,
  page = 1,
  limit = 10,
  total = 0,
  sortField: controlledSortField,
  sortDirection: controlledSortDirection,
  onSortChange,
  onPageChange,
}) => {
  const visibleProjects = items;
  const [sortField, setSortField] = useState<SortField>("volatility");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const activeSortField = controlledSortField || sortField;
  const activeSortDirection = controlledSortDirection || sortDirection;
  const isServerSorted = Boolean(onSortChange);

  const sortedProjects = useMemo(() => {
    const getValue = (project: VolatilityProject): string | number => {
      if (activeSortField === "volatility") return Number(project.volatility);
      if (activeSortField === "status") {
        return statusWeight[
          normalizeRiskStatus(String(project.riskLevel || project.status || ""))
        ] || 0;
      }

      return String(project[activeSortField] || "").toLowerCase();
    };

    if (isServerSorted) return visibleProjects;

    return [...visibleProjects].sort((firstProject, secondProject) => {
      const firstValue = getValue(firstProject);
      const secondValue = getValue(secondProject);
      const direction = activeSortDirection === "asc" ? 1 : -1;
      const firstMissing =
        activeSortField === "volatility" && !Number.isFinite(Number(firstValue));
      const secondMissing =
        activeSortField === "volatility" && !Number.isFinite(Number(secondValue));

      if (firstMissing && secondMissing) {
        return String(firstProject.name || "").localeCompare(
          String(secondProject.name || ""),
        );
      }
      if (firstMissing) return 1;
      if (secondMissing) return -1;

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        return (firstValue - secondValue) * direction;
      }

      return String(firstValue).localeCompare(String(secondValue)) * direction;
    });
  }, [activeSortDirection, activeSortField, isServerSorted, visibleProjects]);

  const handleSort = (field: SortField): void => {
    if (field === activeSortField) {
      const nextDirection = activeSortDirection === "asc" ? "desc" : "asc";
      setSortDirection(nextDirection);
      onSortChange?.(field, nextDirection);
      return;
    }

    const nextDirection =
      field === "volatility" || field === "status" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(nextDirection);
    onSortChange?.(field, nextDirection);
  };
  const totalPages = Math.ceil(total / limit);
  const showPagination = Boolean(onPageChange && totalPages > 1);

  return (
    <>
      <Overflow>
        <Wrapper variant="main">
          <Header>
            <div onClick={() => handleSort("name")}>Project Name</div>
            <div onClick={() => handleSort("investedRound")}>Invested Round</div>
            <div onClick={() => handleSort("volatility")}>Volatility (%)</div>
            <div onClick={() => handleSort("status")}>Risk Level</div>
          </Header>
          <Body>
            {isLoading ? (
              <PlaceholderTable height="48px" />
            ) : sortedProjects.length ? (
              sortedProjects.map((item, i: number) => {
                const riskStatus = normalizeRiskStatus(
                  String(item.riskLevel || item.status || ""),
                );
                const volatility = Number(item.volatility);

                return (
                  <Row key={`${item.marketAssetId || item.id || item.name}-${i}`}>
                    <div className="project">
                      <UserAvatar
                        avatar={imageLoader(item.logo || item.image)}
                        name={item.name}
                        variant="default"
                        size="small"
                        fallbackType="project"
                      />
                      <div className="project-info">
                        <div>{item.name}</div>
                        <span>{item.niche || item.category || "-"}</span>
                      </div>
                    </div>
                    <div className="value">{item.investedRound || "-"}</div>
                    <div className="bold">
                      {Number.isFinite(volatility) ? `${volatility}%` : "-"}
                    </div>

                    <div className={`status ${riskStatus}`}>
                      {riskStatus === "Insufficient" ? "-" : riskStatus}
                    </div>
                  </Row>
                );
              })
            ) : (
              <EmptySection />
            )}
          </Body>
        </Wrapper>
      </Overflow>
      {showPagination ? (
        <Footer>
          <Pagination
            page={page}
            total={total}
            limit={Math.min(page * limit, total)}
            onePageLimit={limit}
            totalPage={totalPages}
            onChange={(nextPage) => onPageChange?.(nextPage)}
          />
        </Footer>
      ) : null}
    </>
  );
};

export default PortfolioVolatility;
