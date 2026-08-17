import { Check, Filter } from "lucide-react";
import React, { useState } from "react";
import styled from "styled-components";

type EntityFilterKey =
  | "projects"
  | "funds"
  | "persons"
  | "exchanges"
  | "tokens"
  | "assets";

export type RelationFilterKey =
  | "investedIn"
  | "coinvestedWith"
  | "founded"
  | "hasToken"
  | "tradedOn"
  | "worksAt";

export type ContextScopeKey =
  | "founder"
  | "investment"
  | "ecosystem"
  | "partnership"
  | "market"
  | "event"
  | "mention";

export type GraphViewMode = "standard" | "clustered";

const FilterButton = styled.button`
  position: absolute;
  top: 20px;
  right: 154px;
  z-index: 12;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: #0171d9;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 2px 2px 8px 0px #00053014;
  transition: background 0.2s ease, opacity 0.2s ease;

  &:hover {
    background: #0b7ee8;
  }

  &:active {
    opacity: 0.82;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    top: 14px;
    right: 142px;
  }
`;

const Popup = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 68px;
  right: 20px;
  z-index: 12;
  width: 206px;
  max-width: calc(100vw - 32px);
  max-height: calc(100% - 86px);
  overflow-y: auto;
  background: #0f172a;
  border: 1px solid rgba(129, 97, 255, 0.45);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 2px 2px 8px 0px #00053014;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  transform: translateY(${({ isOpen }) => (isOpen ? "0" : "-8px")});
  transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(115, 128, 148, 0.45);
    border-radius: 999px;
  }

  @media (max-width: 768px) {
    top: 62px;
    right: 14px;
    padding: 18px;
  }
`;

const PopupSection = styled.div`
  & + & {
    margin-top: 24px;
  }
`;

const PopupTitle = styled.div`
  margin-bottom: 14px;
  color: #738094;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 15px;
  text-transform: uppercase;
`;

const GraphViewButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const GraphViewButton = styled.button<{ isActive: boolean }>`
  height: 36px;
  border: 1px solid ${({ isActive }) => (isActive ? "#0171d9" : "#273449")};
  border-radius: 8px;
  background: ${({ isActive }) => (isActive ? "#0171d9" : "#172033")};
  color: ${({ isActive }) => (isActive ? "#ffffff" : "#738094")};
  cursor: pointer;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 15px;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: #0171d9;
  }
`;

const FilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterItem = styled.button<{ isActive: boolean }>`
  width: 100%;
  min-height: 28px;
  border: none;
  border-radius: 5px;
  display: grid;
  grid-template-columns: 16px 14px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 5px 4px;
  background: ${({ isActive }) => (isActive ? "#172033" : "transparent")};
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease, opacity 0.2s ease;

  &:hover {
    background: #172033;
  }

  &:active {
    opacity: 0.78;
  }
`;

const Checkbox = styled.span<{ isActive: boolean }>`
  width: 14px;
  height: 14px;
  border: 1px solid ${({ isActive }) => (isActive ? "#12b79a" : "#9ca3af")};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ isActive }) => (isActive ? "#12b79a" : "transparent")};
  color: #ffffff;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const ColorDot = styled.span<{ color: string; $line?: boolean }>`
  width: ${({ $line }) => ($line ? "14px" : "8px")};
  height: ${({ $line }) => ($line ? "2px" : "8px")};
  border-radius: ${({ $line }) => ($line ? "999px" : "50%")};
  background: ${({ color }) => color};
`;

const ContextBadge = styled.span<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ color }) => color};
  color: #ffffff;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
`;

const Label = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #f8fafc;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ResetButton = styled.button`
  width: 100%;
  height: 28px;
  margin-top: 24px;
  border: 1px solid #273449;
  border-radius: 8px;
  background: #172033;
  color: #738094;
  cursor: pointer;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  transition: border-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    color: #f8fafc;
  }
`;

const FlowButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-top: 12px;
`;

const FlowButton = styled.button<{ isActive: boolean }>`
  padding: 8px;
  border: 1px solid ${({ isActive }) => (isActive ? "#0171d9" : "#273449")};
  background: ${({ isActive }) => (isActive ? "#0171d9" : "#172033")};
  color: ${({ isActive }) => (isActive ? "#ffffff" : "#738094")};
  border-radius: 8px;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: #0171d9;
  }
`;

interface FilterPopupProps {
  tab: "ecosystem" | "influence" | "on-chain";
  filters: Record<string, boolean>;
  onFilterChange: (filterName: any) => void;
  relationFilters?: Record<RelationFilterKey, boolean>;
  onRelationFilterChange?: (filterName: RelationFilterKey) => void;
  contextFilters?: Record<ContextScopeKey, boolean>;
  onContextFilterChange?: (filterName: ContextScopeKey) => void;
  graphView?: GraphViewMode;
  onGraphViewChange?: (mode: GraphViewMode) => void;
  onResetAll?: () => void;
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
  onOnChainFilterChange: (
    filterName: keyof FilterPopupProps["onChainFilters"]
  ) => void;
  flowDirection: "all" | "in" | "out" | "self";
  onFlowDirectionChange: (direction: "all" | "in" | "out" | "self") => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  tab,
  filters,
  onFilterChange,
  relationFilters,
  onRelationFilterChange,
  contextFilters,
  onContextFilterChange,
  graphView,
  onGraphViewChange,
  onResetAll,
  onChainFilters,
  onOnChainFilterChange,
  flowDirection,
  onFlowDirectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localGraphView, setLocalGraphView] = useState<GraphViewMode>(
    "standard"
  );
  const activeGraphView = graphView || localGraphView;
  const handleGraphViewChange = (mode: GraphViewMode) => {
    if (onGraphViewChange) {
      onGraphViewChange(mode);
      return;
    }

    setLocalGraphView(mode);
  };

  const regularFilterConfig: Array<{
    name: EntityFilterKey;
    label: string;
    color: string;
  }> = [
    { name: "projects", label: "Projects", color: "#3B82F6" },
    { name: "funds", label: "Funds", color: "#22C55E" },
    { name: "persons", label: "Persons", color: "#F59E0B" },
    { name: "exchanges", label: "Exchanges", color: "#EF4444" },
    { name: "tokens", label: "Tokens", color: "#8A53FF" },
    { name: "assets", label: "Assets", color: "#64748B" },
  ];
  const relationFilterConfig: Array<{
    name: RelationFilterKey;
    label: string;
    color: string;
  }> = [
    { name: "investedIn", label: "invested in", color: "#12B79A" },
    { name: "coinvestedWith", label: "coinvested with", color: "#3B82F6" },
    { name: "founded", label: "founded", color: "#F59E0B" },
    { name: "hasToken", label: "has token", color: "#8A53FF" },
    { name: "tradedOn", label: "traded on", color: "#EF4444" },
    { name: "worksAt", label: "works at", color: "#EC4899" },
  ];
  const contextFilterConfig: Array<{
    name: ContextScopeKey;
    label: string;
    short: string;
    color: string;
  }> = [
    { name: "founder", label: "Founder", short: "F", color: "#F59E0B" },
    { name: "investment", label: "Investment", short: "I", color: "#10B981" },
    { name: "ecosystem", label: "Ecosystem", short: "E", color: "#3B82F6" },
    { name: "partnership", label: "Partnership", short: "P", color: "#8B5CF6" },
    { name: "market", label: "Market", short: "M", color: "#EF4444" },
    { name: "event", label: "Event", short: "E", color: "#06B6D4" },
    { name: "mention", label: "Mention", short: "M", color: "#64748B" },
  ];
  const onChainFilterConfig = [
    {
      name: "centralizedExchanges" as const,
      label: "Centralized exchanges",
      color: "#FF5858",
    },
    {
      name: "depositAddresses" as const,
      label: "Deposit addresses",
      color: "#FFC702",
    },
    {
      name: "individualsAndFunds" as const,
      label: "Individuals and funds",
      color: "#6366F1",
    },
    {
      name: "decentralizedExchanges" as const,
      label: "Decentralized exchanges",
      color: "#22C55E",
    },
    { name: "lending" as const, label: "Lending", color: "#86EFAC" },
    { name: "misc" as const, label: "Misc", color: "#374151" },
    {
      name: "uncategorized" as const,
      label: "Uncategorized",
      color: "#9CA3AF",
    },
    { name: "all" as const, label: "All", color: "#E5E7EB" },
  ];

  const isOnChain = tab === "on-chain";
  const activeFilterConfig = isOnChain
    ? onChainFilterConfig
    : regularFilterConfig;
  const activeFilters = isOnChain ? onChainFilters : filters;

  return (
    <>
      <FilterButton type="button" onClick={() => setIsOpen(!isOpen)}>
        <Filter color="currentColor" strokeWidth={1.7} />
        Filter
      </FilterButton>

      <Popup isOpen={isOpen}>
        <PopupSection>
          <PopupTitle>Graph View</PopupTitle>
          <GraphViewButtons>
            <GraphViewButton
              type="button"
              isActive={activeGraphView === "standard"}
              onClick={() => handleGraphViewChange("standard")}
            >
              Standard
            </GraphViewButton>
            <GraphViewButton
              type="button"
              isActive={activeGraphView === "clustered"}
              onClick={() => handleGraphViewChange("clustered")}
            >
              Clustered
            </GraphViewButton>
          </GraphViewButtons>
        </PopupSection>

        <PopupSection>
          <PopupTitle>{isOnChain ? "Transfer Type" : "Entity Type"}</PopupTitle>
          <FilterList>
            {activeFilterConfig.map((filter) => {
              const isActive =
                activeFilters[filter.name as keyof typeof activeFilters] ??
                true;
              return (
                <FilterItem
                  key={filter.name}
                  type="button"
                  isActive={Boolean(isActive)}
                  onClick={() => {
                    if (isOnChain) {
                      onOnChainFilterChange(filter.name as any);
                    } else {
                      onFilterChange(filter.name);
                    }
                  }}
                >
                  <Checkbox isActive={Boolean(isActive)}>
                    {isActive && <Check />}
                  </Checkbox>
                  <ColorDot color={filter.color} />
                  <Label>{filter.label}</Label>
                </FilterItem>
              );
            })}
          </FilterList>
        </PopupSection>

        {!isOnChain && relationFilters && onRelationFilterChange && (
          <PopupSection>
            <PopupTitle>Relation Type</PopupTitle>
            <FilterList>
              {relationFilterConfig.map((filter) => {
                const isActive = relationFilters[filter.name];
                return (
                  <FilterItem
                    key={filter.name}
                    type="button"
                    isActive={isActive}
                    onClick={() => onRelationFilterChange(filter.name)}
                  >
                    <Checkbox isActive={isActive}>{isActive && <Check />}</Checkbox>
                    <ColorDot color={filter.color} $line />
                    <Label>{filter.label}</Label>
                  </FilterItem>
                );
              })}
            </FilterList>
          </PopupSection>
        )}

        {!isOnChain && contextFilters && onContextFilterChange && (
          <PopupSection>
            <PopupTitle>Context Scopes</PopupTitle>
            <FilterList>
              {contextFilterConfig.map((filter) => {
                const isActive = contextFilters[filter.name];
                return (
                  <FilterItem
                    key={filter.name}
                    type="button"
                    isActive={isActive}
                    onClick={() => onContextFilterChange(filter.name)}
                  >
                    <Checkbox isActive={isActive}>{isActive && <Check />}</Checkbox>
                    <ContextBadge color={filter.color}>{filter.short}</ContextBadge>
                    <Label>{filter.label}</Label>
                  </FilterItem>
                );
              })}
            </FilterList>
          </PopupSection>
        )}

        {isOnChain && (
          <PopupSection>
            <PopupTitle>Flow Direction</PopupTitle>
            <FlowButtonsWrapper>
              <FlowButton
                type="button"
                isActive={flowDirection === "all"}
                onClick={() => onFlowDirectionChange("all")}
              >
                All
              </FlowButton>
              <FlowButton
                type="button"
                isActive={flowDirection === "in"}
                onClick={() => onFlowDirectionChange("in")}
              >
                In
              </FlowButton>
              <FlowButton
                type="button"
                isActive={flowDirection === "out"}
                onClick={() => onFlowDirectionChange("out")}
              >
                Out
              </FlowButton>
              <FlowButton
                type="button"
                isActive={flowDirection === "self"}
                onClick={() => onFlowDirectionChange("self")}
              >
                Self
              </FlowButton>
            </FlowButtonsWrapper>
          </PopupSection>
        )}

        {onResetAll && (
          <ResetButton type="button" onClick={onResetAll}>
            Reset All
          </ResetButton>
        )}
      </Popup>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 11,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FilterPopup;
