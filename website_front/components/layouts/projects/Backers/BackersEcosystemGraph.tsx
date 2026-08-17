import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "react-query";
import { ArrowRight, ChartLine, TrendingUp, Zap } from "lucide-react";
import ForceGraph from "../Connection/ForceGraph";
import FilterPopup, {
  type ContextScopeKey,
  type GraphViewMode,
  type RelationFilterKey,
} from "../Connection/FilterPopup";
import {
  BackersEcosystemGraphShell,
  BackersGraphIntelCtaBanner,
} from "./styles";
import BackersGraphIntelligence from "./BackersGraphIntelligence";
import fetchCryptoLinkingGraph, {
  type CryptoLinkingGraphContextScopeKey,
  type CryptoLinkingGraphEntityFilterKey,
  type CryptoLinkingGraphFilters,
  type CryptoLinkingGraphLink,
  type CryptoLinkingGraphNode,
  type CryptoLinkingGraphRelationFilterKey,
} from "../../../../http/crypto-linking/fetchCryptoLinkingGraph";
import { type CryptoLinkingSearchItem } from "../../../../http/crypto-linking/fetchCryptoLinkingSearch";

interface IBackersEcosystemGraphProps {
  selectedEntity: CryptoLinkingSearchItem | null;
}

type ForceGraphNodeType = "main" | "exchange" | "token" | "lock";
type PositionedGraphNode = CryptoLinkingGraphNode & {
  type: ForceGraphNodeType;
  size: number;
  x?: number;
  y?: number;
};

const defaultEntityFilters = {
  projects: true,
  funds: true,
  persons: true,
  exchanges: false,
  tokens: true,
  assets: true,
};

const defaultRelationFilters: Record<RelationFilterKey, boolean> = {
  investedIn: true,
  coinvestedWith: true,
  founded: false,
  hasToken: false,
  tradedOn: true,
  worksAt: true,
};

const defaultContextFilters: Record<ContextScopeKey, boolean> = {
  founder: true,
  investment: true,
  ecosystem: true,
  partnership: true,
  market: true,
  event: true,
  mention: true,
};

function getSelectedEntityId(entity: CryptoLinkingSearchItem | null) {
  if (!entity) return undefined;

  const { _id: mongoId, id } = entity;
  return mongoId || id;
}

function toActiveKeys<T extends string>(filterMap: Record<T, boolean>): T[] {
  return Object.entries(filterMap).reduce<T[]>((acc, [key, isActive]) => {
    if (isActive) {
      acc.push(key as T);
    }
    return acc;
  }, []);
}

function getForceGraphNodeType(
  node: CryptoLinkingGraphNode,
  rootNodeId: string
): ForceGraphNodeType {
  if (node.id === rootNodeId) return "main";
  if (node.entityType === "project") return "token";
  if (node.entityType === "fund" || node.entityType === "person")
    return "exchange";
  if (node.entityType === "funding_round") return "lock";
  return "lock";
}

function normalizeLinkValue(link: CryptoLinkingGraphLink) {
  const value = Number(link.value || link.fundsRaised);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function applyClusterPositions(
  nodes: PositionedGraphNode[],
  rootNodeId: string
): PositionedGraphNode[] {
  const clusterCenters: Record<string, { x: number; y: number }> = {
    project: { x: -160, y: -90 },
    fund: { x: 170, y: -85 },
    person: { x: 170, y: 125 },
    investor: { x: -160, y: 120 },
    funding_round: { x: 0, y: 96 },
    exchange: { x: 0, y: -190 },
    token: { x: 0, y: 190 },
    asset: { x: -210, y: 20 },
  };
  const totals = nodes.reduce<Record<string, number>>((acc, node) => {
    const key = String(node.entityType || node.type || "asset");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const indexes: Record<string, number> = {};

  return nodes.map((node) => {
    if (node.id === rootNodeId) {
      return { ...node, x: 0, y: 0 };
    }

    const key = String(node.entityType || node.type || "asset");
    const index = indexes[key] || 0;
    indexes[key] = index + 1;

    const center = clusterCenters[key] || clusterCenters.asset;
    const total = Math.max(1, totals[key] || 1);
    const angle = (index / total) * Math.PI * 2;
    const radius = 38 + Math.floor(index / 8) * 26;

    return {
      ...node,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
}

function applyTypeAwarePositions(
  nodes: PositionedGraphNode[],
  rootNodeId: string
): PositionedGraphNode[] {
  const layoutByType: Record<string, { radius: number; offset: number }> = {
    funding_round: { radius: 95, offset: -0.5 },
    project: { radius: 155, offset: 0.1 },
    fund: { radius: 220, offset: 0.85 },
    person: { radius: 235, offset: 1.55 },
    investor: { radius: 270, offset: 2.35 },
    exchange: { radius: 190, offset: 3.1 },
    token: { radius: 180, offset: 3.7 },
    asset: { radius: 250, offset: 4.4 },
  };
  const totals = nodes.reduce<Record<string, number>>((acc, node) => {
    if (node.id === rootNodeId) return acc;
    const key = String(node.entityType || "asset");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const indexes: Record<string, number> = {};

  return nodes.map((node) => {
    if (node.id === rootNodeId) {
      return { ...node, x: 0, y: 0 };
    }

    const key = String(node.entityType || "asset");
    const index = indexes[key] || 0;
    indexes[key] = index + 1;

    const layout = layoutByType[key] || layoutByType.asset;
    const total = Math.max(1, totals[key] || 1);
    const angle = layout.offset + (index / total) * Math.PI * 2;
    const ringOffset = Math.floor(index / 14) * 36;
    const radius = layout.radius + ringOffset;

    return {
      ...node,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
}

function getRelationFilterKey(link: CryptoLinkingGraphLink): RelationFilterKey {
  if (link.relationType) return link.relationType;

  const relation = String(link.relation || link.roundStage || "").toLowerCase();

  if (/co[-_\s]?invest|shared/.test(relation)) return "coinvestedWith";
  if (/found/.test(relation)) return "founded";
  if (
    /linked_person|work|advisor|member|employee|collaborator|team/.test(
      relation
    )
  )
    return "worksAt";
  if (/token/.test(relation)) return "hasToken";
  if (/trade|market|exchange/.test(relation)) return "tradedOn";
  return "investedIn";
}

function getContextFilterKeys(link: CryptoLinkingGraphLink): ContextScopeKey[] {
  if (link.contextScopes?.length) return link.contextScopes;

  const relation = String(link.relation || link.roundStage || "").toLowerCase();
  const keys = new Set<ContextScopeKey>();

  if (
    /found|linked_person|work|advisor|member|employee|collaborator|team/.test(
      relation
    )
  ) {
    keys.add("founder");
  }

  if (
    /invest|portfolio|lead|led|funding_round|linked_investor/.test(relation)
  ) {
    keys.add("investment");
  }

  if (/partner|co[-_\s]?invest|shared/.test(relation)) {
    keys.add("partnership");
    keys.add("investment");
  }

  if (/market|trade|token|exchange/.test(relation)) {
    keys.add("market");
  }

  if (link.date) {
    keys.add("event");
  }

  if (!link.confidence || link.confidence === "none") {
    keys.add("mention");
  }

  if (!keys.size) {
    keys.add("ecosystem");
  }

  return Array.from(keys);
}

const BackersEcosystemGraph = ({
  selectedEntity,
}: IBackersEcosystemGraphProps) => {
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [filters, setFilters] = useState(defaultEntityFilters);
  const [relationFilters, setRelationFilters] = useState(
    defaultRelationFilters
  );
  const [contextFilters, setContextFilters] = useState(defaultContextFilters);
  const [graphView, setGraphView] = useState<GraphViewMode>("standard");
  const [onChainFilters, setOnChainFilters] = useState({
    centralizedExchanges: true,
    depositAddresses: false,
    individualsAndFunds: false,
    decentralizedExchanges: false,
    lending: true,
    misc: false,
    uncategorized: false,
    all: false,
  });
  const [flowDirection, setFlowDirection] = useState<
    "all" | "in" | "out" | "self"
  >("all");
  const [focusedEntity, setFocusedEntity] =
    useState<CryptoLinkingSearchItem | null>(selectedEntity);
  const focusedEntityId = getSelectedEntityId(focusedEntity);

  useEffect(() => {
    setFocusedEntity(selectedEntity);
  }, [selectedEntity]);

  const activeEntityTypes = useMemo(
    () => toActiveKeys(filters) as CryptoLinkingGraphEntityFilterKey[],
    [filters]
  );
  const activeRelationTypes = useMemo(
    () =>
      toActiveKeys(relationFilters) as CryptoLinkingGraphRelationFilterKey[],
    [relationFilters]
  );
  const activeContextScopes = useMemo(
    () => toActiveKeys(contextFilters) as CryptoLinkingGraphContextScopeKey[],
    [contextFilters]
  );
  const activeGraphFilters = useMemo<CryptoLinkingGraphFilters>(
    () => ({
      entityTypes: activeEntityTypes,
      relationTypes: activeRelationTypes,
      contextScopes: activeContextScopes,
    }),
    [activeContextScopes, activeEntityTypes, activeRelationTypes]
  );
  const [graphFetchFilters, setGraphFetchFilters] =
    useState(activeGraphFilters);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setGraphFetchFilters(activeGraphFilters);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeGraphFilters]);

  const graphQuery = useQuery(
    [
      "crypto-linking-graph",
      focusedEntity?.type,
      focusedEntityId,
      graphFetchFilters.entityTypes,
      graphFetchFilters.relationTypes,
      graphFetchFilters.contextScopes,
    ],
    () =>
      fetchCryptoLinkingGraph(
        focusedEntity!.type,
        focusedEntityId!,
        160,
        graphFetchFilters
      ),
    {
      enabled: Boolean(focusedEntity?.type && focusedEntityId),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  );

  useEffect(() => {
    const updateDimensions = () => {
      if (!graphContainerRef.current || typeof window === "undefined") return;

      const rect = graphContainerRef.current.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top - 24;

      setDimensions({
        width: Math.floor(rect.width),
        height: Math.max(460, Math.floor(availableHeight)),
      });
    };

    updateDimensions();

    const frameId = window.requestAnimationFrame(updateDimensions);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateDimensions)
        : null;

    if (graphContainerRef.current && resizeObserver) {
      resizeObserver.observe(graphContainerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateDimensions);
      resizeObserver?.disconnect();
    };
  }, []);

  const externalGraphData = useMemo(() => {
    const data = graphQuery.data?.graphData;
    const rootNodeId =
      graphQuery.data?.selectedEntity?.nodeId || focusedEntity?.nodeId;

    if (!data || !rootNodeId) {
      return { nodes: [], links: [] };
    }

    const isNodeAllowed = (node: CryptoLinkingGraphNode) => {
      if (node.id === rootNodeId) return true;
      if (node.entityType === "fund") return filters.funds;
      if (node.entityType === "person") return filters.persons;
      if (node.entityType === "project") return filters.projects;
      if (node.entityType === "investor") return filters.assets;
      if (node.entityType === "funding_round") return filters.assets;
      return filters.exchanges || filters.tokens || filters.assets;
    };

    const allowedNodes = new Map(
      data.nodes.filter(isNodeAllowed).map((node) => [node.id, node])
    );
    const visibleNodeIds = new Set<string>([rootNodeId]);
    const visibleLinks = data.links.filter((link) => {
      const source = String(link.source);
      const target = String(link.target);
      const relationKey = getRelationFilterKey(link);
      const contextKeys = getContextFilterKeys(link);
      const isRelationVisible = relationFilters[relationKey];
      const isContextVisible = contextKeys.some((key) => contextFilters[key]);

      if (
        !isRelationVisible ||
        !isContextVisible ||
        !allowedNodes.has(source) ||
        !allowedNodes.has(target)
      ) {
        return false;
      }

      visibleNodeIds.add(source);
      visibleNodeIds.add(target);
      return true;
    });
    const nodes = data.nodes
      .filter(
        (node) => visibleNodeIds.has(node.id) && allowedNodes.has(node.id)
      )
      .map((node) => ({
        ...node,
        id: node.id,
        label: node.label || node.name,
        type: getForceGraphNodeType(node, rootNodeId),
        size: node.id === rootNodeId ? 8 : node.size || 5,
      }));
    const positionedNodes =
      graphView === "clustered"
        ? applyClusterPositions(nodes, rootNodeId)
        : applyTypeAwarePositions(nodes, rootNodeId);
    const pairCounts = new Map<string, number>();
    const processedLinks = visibleLinks.map((link) => {
      const key = [String(link.source), String(link.target)].sort().join("-");
      const connectionIndex = pairCounts.get(key) || 0;
      pairCounts.set(key, connectionIndex + 1);

      return {
        ...link,
        source: String(link.source),
        target: String(link.target),
        value: normalizeLinkValue(link),
        connectionIndex,
      };
    });

    return {
      nodes: positionedNodes,
      links: processedLinks.map((link) => {
        const key = [String(link.source), String(link.target)].sort().join("-");
        return {
          ...link,
          total: pairCounts.get(key) || 1,
        };
      }),
    };
  }, [
    contextFilters,
    filters.assets,
    filters.exchanges,
    filters.funds,
    filters.persons,
    filters.projects,
    filters.tokens,
    graphView,
    graphQuery.data,
    relationFilters,
    focusedEntity?.nodeId,
  ]);

  const handleExternalNodeSelect = useCallback((node: any) => {
    const entityType = String(node?.entityType || "");
    if (
      entityType !== "project" &&
      entityType !== "fund" &&
      entityType !== "person"
    ) {
      return;
    }

    const entityId =
      node?.entityId ||
      node?.slug ||
      (String(node?.id || "").startsWith(`${entityType}:raw:`)
        ? ""
        : String(node?.id || "").split(":")[1]);

    if (!entityId) return;

    const typedEntityType = entityType as CryptoLinkingSearchItem["type"];
    setFocusedEntity({
      _id: String(entityId),
      id: String(entityId),
      nodeId: node?.entityId
        ? `${typedEntityType}:${entityId}`
        : String(node?.id || `${typedEntityType}:${entityId}`),
      type: typedEntityType,
      entityType: typedEntityType,
      name: node?.name || node?.label || String(entityId),
      slug: node?.slug,
      symbol: node?.symbol,
      logo: node?.logo,
      label: node?.label || node?.name,
    });
  }, []);

  return (
    <>
      <BackersEcosystemGraphShell ref={graphContainerRef}>
        {dimensions.width > 0 && (
          <ForceGraph
            width={dimensions.width}
            height={dimensions.height}
            selectedEntity={focusedEntity}
            selectedTab="ecosystem"
            externalGraphData={externalGraphData}
            isLoading={graphQuery.isLoading}
            filters={filters}
            onChainFilters={onChainFilters}
            flowDirection={flowDirection}
            onExternalNodeSelect={handleExternalNodeSelect}
          >
            {focusedEntity && (
              <FilterPopup
                tab="ecosystem"
                filters={filters}
                graphView={graphView}
                onGraphViewChange={setGraphView}
                onFilterChange={(filterName) => {
                  const key = filterName as keyof typeof defaultEntityFilters;
                  setFilters((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }));
                }}
                relationFilters={relationFilters}
                onRelationFilterChange={(filterName) => {
                  setRelationFilters((prev) => ({
                    ...prev,
                    [filterName]: !prev[filterName],
                  }));
                }}
                contextFilters={contextFilters}
                onContextFilterChange={(filterName) => {
                  setContextFilters((prev) => ({
                    ...prev,
                    [filterName]: !prev[filterName],
                  }));
                }}
                onResetAll={() => {
                  setFilters(defaultEntityFilters);
                  setRelationFilters(defaultRelationFilters);
                  setContextFilters(defaultContextFilters);
                }}
                onChainFilters={onChainFilters}
                onOnChainFilterChange={(filterName) => {
                  setOnChainFilters((prev) => ({
                    ...prev,
                    [filterName]: !prev[filterName],
                  }));
                }}
                flowDirection={flowDirection}
                onFlowDirectionChange={setFlowDirection}
              />
            )}
          </ForceGraph>
        )}
      </BackersEcosystemGraphShell>
      <BackersGraphIntelligence
        selectedEntity={focusedEntity}
        graphData={externalGraphData}
        isLoading={graphQuery.isLoading}
      />
      <BackersGraphIntelCtaBanner>
        <div className="banner-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.4235 1L15.2538 5.94621L20.2 7.77647L15.2538 9.60673L13.4235 14.5529L11.5933 9.60673L6.64706 7.77647L11.5933 5.94621L13.4235 1Z"
              stroke="#8161FF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M4.95294 12.2941L6.55177 14.6482L8.90588 16.2471L6.55177 17.8459L4.95294 20.2L3.35411 17.8459L1 16.2471L3.35411 14.6482L4.95294 12.2941Z"
              stroke="#8161FF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="banner-copy">
          <div className="banner-title-row">
            <h3>Need deeper insights?</h3>
            <span>PRO</span>
          </div>
          <p>
            Unlock advanced analytics and real-time intelligence with FOMO
            Intel.
          </p>
          <div className="banner-features">
            <span>
              <ChartLine size={16} strokeWidth={1.8} />
              Advanced Charts
            </span>
            <span>
              <TrendingUp size={16} strokeWidth={1.8} />
              Market Signals
            </span>
            <span>
              <Zap size={16} strokeWidth={1.8} />
              Real-time Data
            </span>
          </div>
        </div>
        <button type="button">
          Open FOMO Intel
          <ArrowRight size={18} strokeWidth={1.8} />
        </button>
      </BackersGraphIntelCtaBanner>
    </>
  );
};

export default BackersEcosystemGraph;
