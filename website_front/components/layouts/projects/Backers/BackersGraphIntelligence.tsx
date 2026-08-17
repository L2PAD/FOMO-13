import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Database,
  GitFork,
  Network,
  ShieldCheck,
} from "lucide-react";
import imageLoader from "../../../../helpers/imageLoader";
import { toClientAbsoluteUrl } from "../../../../helpers/getClientOrigin";
import { type CryptoLinkingSearchItem } from "../../../../http/crypto-linking/fetchCryptoLinkingSearch";
import {
  BackersGraphBadge,
  BackersGraphCard,
  BackersGraphChart,
  BackersGraphContextBadge,
  BackersGraphHeader,
  BackersGraphIntelligenceGrid,
  BackersGraphIntelligenceSection,
  BackersGraphList,
  BackersGraphListItem,
  BackersGraphMetricGrid,
  BackersGraphPagination,
  BackersGraphRelationAvatar,
  BackersGraphRelationTable,
  BackersGraphSnapshot,
  BackersGraphSnapshotCard,
  BackersGraphTableFooter,
  BackersGraphTableHeader,
  BackersGraphTrendCard,
} from "./styles";

type IntelligenceNode = {
  id: string;
  label?: string;
  name?: string;
  entityType?: string;
  type?: string;
  entityId?: string;
  logo?: string;
  confidence?: string;
  matchedBy?: string;
};

type IntelligenceLink = {
  source: string | IntelligenceNode;
  target: string | IntelligenceNode;
  value?: number;
  relation?: string;
  roundStage?: string;
  date?: string | Date;
  fundsRaised?: number;
  confidence?: string;
  matchedBy?: string;
};

type IntelligenceGraphData = {
  nodes: IntelligenceNode[];
  links: IntelligenceLink[];
};

type IntelligenceRelationRow = {
  id: string;
  typeLabel: string;
  color: string;
  name: string;
  logo?: string;
  relationLabel: string;
  status: "Active" | "Historical";
};

interface IBackersGraphIntelligenceProps {
  selectedEntity: CryptoLinkingSearchItem | null;
  graphData: IntelligenceGraphData;
  isLoading: boolean;
}

const RELATIONS_PER_PAGE = 10;

const entityColors: Record<string, string> = {
  project: "#3b82f6",
  fund: "#f59e0b",
  person: "#8b5cf6",
  investor: "#64748b",
  token: "#22c55e",
  asset: "#14b8a6",
};

const BackersGraphIntelligence = ({
  selectedEntity,
  graphData,
  isLoading,
}: IBackersGraphIntelligenceProps) => {
  const [relationsPage, setRelationsPage] = useState(1);

  const intelligence = useMemo(
    () => buildIntelligence(selectedEntity, graphData),
    [graphData, selectedEntity]
  );

  useEffect(() => {
    setRelationsPage(1);
  }, [selectedEntity?._id, selectedEntity?.id, graphData.links.length]);

  if (!selectedEntity) return null;

  const totalRelations = intelligence.relations.length;
  const totalPages = Math.max(1, Math.ceil(totalRelations / RELATIONS_PER_PAGE));
  const safePage = Math.min(relationsPage, totalPages);
  const pageStartIndex = (safePage - 1) * RELATIONS_PER_PAGE;
  const visibleRelations = intelligence.relations.slice(
    pageStartIndex,
    pageStartIndex + RELATIONS_PER_PAGE
  );
  const showingFrom = totalRelations ? pageStartIndex + 1 : 0;
  const showingTo = Math.min(pageStartIndex + RELATIONS_PER_PAGE, totalRelations);

  return (
    <BackersGraphIntelligenceSection>
      <BackersGraphHeader>
        <h2>Graph Intelligence</h2>
        <div>
          <span>
            <strong>{isLoading ? "--" : intelligence.nodesCount}</strong> nodes
          </span>
          <span>
            <strong>{isLoading ? "--" : intelligence.edgesCount}</strong> edges
          </span>
        </div>
      </BackersGraphHeader>

      <BackersGraphIntelligenceGrid>
        <BackersGraphCard>
          <h3>
            <Network size={18} />
            Entity Type
          </h3>
          <BackersGraphList>
            {intelligence.entityTypeItems.map((item) => (
              <BackersGraphListItem key={item.label}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.label}
                </span>
                <strong>{item.value}</strong>
              </BackersGraphListItem>
            ))}
          </BackersGraphList>
        </BackersGraphCard>

        <BackersGraphCard>
          <h3>
            <GitFork size={18} />
            Edge Type
          </h3>
          <BackersGraphList>
            {intelligence.edgeTypeItems.map((item) => (
              <BackersGraphListItem key={item.label}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.label}
                </span>
                <strong>{item.value}</strong>
              </BackersGraphListItem>
            ))}
          </BackersGraphList>
        </BackersGraphCard>

        <BackersGraphCard>
          <h3>
            <ShieldCheck size={18} />
            Data Confidence
          </h3>
          <BackersGraphMetricGrid>
            <span>Coverage confidence</span>
            <strong className={intelligence.confidence.coverage.toLowerCase()}>
              {intelligence.confidence.coverage}
            </strong>
            <span>Duplicate entity risk</span>
            <strong>{intelligence.confidence.duplicateRisk}</strong>
            <span>Alias conflict risk</span>
            <strong>{intelligence.confidence.aliasRisk}</strong>
            <span>Cached Entities</span>
            <strong>{intelligence.confidence.cachedEntities}</strong>
          </BackersGraphMetricGrid>
        </BackersGraphCard>

        <BackersGraphCard className="highlights">
          <h3>
            <span>Network Highlights</span>
            <BackersGraphBadge>
              <Bot size={14} />
              AI Generated
            </BackersGraphBadge>
          </h3>
          {intelligence.highlights.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </BackersGraphCard>
      </BackersGraphIntelligenceGrid>

      <BackersGraphHeader className="snapshot">
        <h2>Discovery Snapshot</h2>
        <div>
          <span>
            <strong>{intelligence.discoverableEntities}</strong> discoverable entities
          </span>
        </div>
      </BackersGraphHeader>

      <BackersGraphSnapshot>
        {intelligence.snapshot.map((item) => (
          <BackersGraphSnapshotCard key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </BackersGraphSnapshotCard>
        ))}
      </BackersGraphSnapshot>

      <BackersGraphIntelligenceGrid className="lower">
        <BackersGraphCard>
          <h3>
            <Database size={18} />
            Coverage by Context
          </h3>
          <BackersGraphList>
            {intelligence.contextItems.map((item) => (
              <BackersGraphListItem key={item.label}>
                <span>
                  <BackersGraphContextBadge $color={item.color}>
                    {item.short}
                  </BackersGraphContextBadge>
                  {item.label}
                </span>
                <strong>{item.strength}</strong>
              </BackersGraphListItem>
            ))}
          </BackersGraphList>
        </BackersGraphCard>

        <BackersGraphCard>
          <h3>
            <Network size={18} />
            Most Connected
          </h3>
          <BackersGraphList>
            {intelligence.mostConnected.map((item) => (
              <BackersGraphListItem key={item.id}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.label}
                </span>
                <strong>{item.value}</strong>
              </BackersGraphListItem>
            ))}
          </BackersGraphList>
        </BackersGraphCard>

        <BackersGraphTrendCard>
          <h3>
            <span>
              <Activity size={18} />
              Network Activity Trend
            </span>
            <strong>30D</strong>
          </h3>
          <div className="trend-body">
            <BackersGraphChart>
              <TrendChart
                newEntities={intelligence.trend.newEntities}
                newRelations={intelligence.trend.newRelations}
              />
            </BackersGraphChart>
            <div className="trend-metrics">
              <span>Growth</span>
              <strong>{intelligence.trend.growth}</strong>
              <small>vs previous 30D</small>
              <span>New links</span>
              <strong>{intelligence.trend.newLinks}</strong>
              <small>relationships added</small>
              <span>Hot cluster</span>
              <strong>{intelligence.trend.hotCluster}</strong>
              <small>fastest growing segment</small>
            </div>
          </div>
        </BackersGraphTrendCard>
      </BackersGraphIntelligenceGrid>

      <BackersGraphTableHeader>
        <h2>Relations for {selectedEntity.symbol || selectedEntity.name}</h2>
      </BackersGraphTableHeader>
      <BackersGraphRelationTable>
        <thead>
          <tr>
            <th>Type</th>
            <th>Entity</th>
            <th>Relation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleRelations.length ? (
            visibleRelations.map((relation) => (
              <tr key={relation.id}>
                <td>
                  <span className="type-cell">
                    <i style={{ background: relation.color }} />
                    {relation.typeLabel}
                  </span>
                </td>
                <td>
                  <span className="entity-cell">
                    <BackersGraphRelationAvatar $color={relation.color}>
                      {relation.logo ? (
                        <img src={getImageSrc(relation.logo)} alt={relation.name} />
                      ) : (
                        relation.name.charAt(0).toUpperCase()
                      )}
                    </BackersGraphRelationAvatar>
                    {relation.name}
                  </span>
                </td>
                <td>{relation.relationLabel}</td>
                <td>
                  <span className={relation.status === "Active" ? "active" : ""}>
                    {relation.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="empty">
                No relations found for the selected filters
              </td>
            </tr>
          )}
        </tbody>
      </BackersGraphRelationTable>

      <BackersGraphTableFooter>
        <BackersGraphPagination>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setRelationsPage((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) =>
            getPaginationPage(index, safePage, totalPages)
          ).map((page) => (
            <button
              key={page}
              type="button"
              className={safePage === page ? "active" : undefined}
              onClick={() => setRelationsPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() =>
              setRelationsPage((page) => Math.min(totalPages, page + 1))
            }
          >
            <ChevronRight size={18} />
          </button>
        </BackersGraphPagination>
        <span>
          Showing {showingFrom} - {showingTo} out of {totalRelations}
        </span>
      </BackersGraphTableFooter>
    </BackersGraphIntelligenceSection>
  );
};

const TrendChart = ({
  newEntities,
  newRelations,
}: {
  newEntities: number[];
  newRelations: number[];
}) => {
  const width = 440;
  const height = 190;
  const padding = { top: 12, right: 16, bottom: 28, left: 34 };
  const maxValue = Math.max(1, ...newEntities, ...newRelations);
  const points = [0, 1, 2, 3];
  const toX = (index: number) =>
    padding.left +
    (index / Math.max(1, points.length - 1)) *
      (width - padding.left - padding.right);
  const toY = (value: number) =>
    height -
    padding.bottom -
    (value / maxValue) * (height - padding.top - padding.bottom);
  const relationPath = points
    .map((index) => `${index === 0 ? "M" : "L"} ${toX(index)} ${toY(newRelations[index] || 0)}`)
    .join(" ");
  const entityPath = points
    .map((index) => `${index === 0 ? "M" : "L"} ${toX(index)} ${toY(newEntities[index] || 0)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Network activity trend">
      {[0, 0.25, 0.5, 0.75, 1].map((item) => {
        const y = padding.top + item * (height - padding.top - padding.bottom);
        const value = Math.round(maxValue * (1 - item));
        return (
          <g key={item}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end">
              {value}
            </text>
          </g>
        );
      })}
      {points.map((index) => (
        <g key={index}>
          <line
            x1={toX(index)}
            y1={padding.top}
            x2={toX(index)}
            y2={height - padding.bottom}
          />
          <text x={toX(index)} y={height - 7} textAnchor="middle">
            Week {index + 1}
          </text>
        </g>
      ))}
      <path d={relationPath} className="relations" />
      <path d={entityPath} className="entities" />
      {points.map((index) => (
        <React.Fragment key={index}>
          <circle cx={toX(index)} cy={toY(newRelations[index] || 0)} r={3} className="relations-dot" />
          <circle cx={toX(index)} cy={toY(newEntities[index] || 0)} r={3} className="entities-dot" />
        </React.Fragment>
      ))}
    </svg>
  );
};

const buildIntelligence = (
  selectedEntity: CryptoLinkingSearchItem | null,
  graphData: IntelligenceGraphData
) => {
  const nodes = graphData.nodes || [];
  const links = graphData.links || [];
  const nodeById = new Map(nodes.map((node) => [String(node.id), node]));
  const rootNodeId =
    selectedEntity?.nodeId ||
    (selectedEntity ? `${selectedEntity.type}:${selectedEntity._id || selectedEntity.id}` : "");
  const typeCounts = countBy(nodes, (node) => normalizeEntityType(node.entityType || node.type));
  const relationCounts = countBy(links, (link) => link.relation || link.roundStage || "related");
  const entityTypeItems = toSortedItems(typeCounts, (label) => entityColors[label] || "#3b82f6");
  const edgeTypeItems = toSortedItems(relationCounts, (_, index) =>
    ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#64748b"][index % 5]
  );
  const duplicateLabels = nodes.length - new Set(nodes.map((node) => normalizeText(node.label || node.name))).size;
  const unresolvedLinks = links.filter((link) => !link.confidence || link.confidence === "none").length;
  const cachedEntities = nodes.filter((node) => node.entityId).length;
  const relations = links
    .map((link, index) => toRelationRow(link, index, nodeById, rootNodeId))
    .filter((row): row is IntelligenceRelationRow => Boolean(row));
  const mostConnected = getMostConnected(nodes, links, rootNodeId);
  const contextItems = buildContextItems(links);
  const trend = buildTrend(links, nodes);
  const topEntityType = entityTypeItems[0]?.label || "entities";
  const topRelationType = edgeTypeItems[0]?.label || "relationships";
  const topConnected = mostConnected[0]?.label || selectedEntity?.name || "the selected entity";

  return {
    nodesCount: nodes.length,
    edgesCount: links.length,
    discoverableEntities: nodes.length + links.length,
    entityTypeItems,
    edgeTypeItems,
    confidence: {
      coverage: getCoverageConfidence(nodes.length, links.length),
      duplicateRisk: duplicateLabels > 2 ? "Medium" : "Low",
      aliasRisk: unresolvedLinks > links.length * 0.35 ? "Medium" : "Low",
      cachedEntities,
    },
    highlights: [
      `${topRelationType} relationships dominate this graph. Most visible links are mapped through ${topEntityType.toLowerCase()}, which suggests ${selectedEntity?.name || "this entity"} is primarily discovered through connected funding and portfolio data.`,
      `${topEntityType} activity is the biggest cluster. The graph is centered around ${topConnected}, making it a useful discovery point for deeper research.`,
      `Centrality is concentrated around ${mostConnected.length || 0} visible entities. Repeated cross-cluster connections can indicate key investors, projects, or people worth reviewing first.`,
    ],
    snapshot: [
      { label: "Funds", value: typeCounts.fund || 0 },
      { label: "Investors", value: typeCounts.investor || 0 },
      { label: "Projects", value: typeCounts.project || 0 },
      { label: "Persons", value: typeCounts.person || 0 },
    ],
    contextItems,
    mostConnected,
    trend,
    relations,
  };
};

const toRelationRow = (
  link: IntelligenceLink,
  index: number,
  nodeById: Map<string, IntelligenceNode>,
  rootNodeId: string
): IntelligenceRelationRow | null => {
  const sourceId = getNodeId(link.source);
  const targetId = getNodeId(link.target);
  const otherNodeId = sourceId === rootNodeId ? targetId : targetId === rootNodeId ? sourceId : targetId;
  const node = nodeById.get(otherNodeId);

  if (!node) return null;

  const entityType = normalizeEntityType(node.entityType || node.type);
  const date = parseDate(link.date);
  return {
    id: `${sourceId}-${targetId}-${link.relation || "relation"}-${index}`,
    typeLabel: toTitleCase(entityType),
    color: entityColors[entityType] || "#3b82f6",
    name: node.label || node.name || "Unknown entity",
    logo: node.logo,
    relationLabel: humanizeRelation(link.relation || link.roundStage || "related"),
    status: date && Date.now() - date.getTime() > 365 * 24 * 60 * 60 * 1000 ? "Historical" : "Active",
  };
};

const getMostConnected = (
  nodes: IntelligenceNode[],
  links: IntelligenceLink[],
  rootNodeId: string
) => {
  const nodeById = new Map(nodes.map((node) => [String(node.id), node]));
  const degree = new Map<string, number>();

  links.forEach((link) => {
    const source = getNodeId(link.source);
    const target = getNodeId(link.target);
    degree.set(source, (degree.get(source) || 0) + 1);
    degree.set(target, (degree.get(target) || 0) + 1);
  });

  return Array.from(degree.entries())
    .filter(([id]) => id !== rootNodeId)
    .map(([id, value]) => {
      const node = nodeById.get(id);
      const entityType = normalizeEntityType(node?.entityType || node?.type);
      return {
        id,
        label: node?.label || node?.name || id,
        value,
        color: entityColors[entityType] || "#3b82f6",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

const buildContextItems = (links: IntelligenceLink[]) => {
  const counts = {
    founder: links.filter((link) => /founder|work|person|advisor/i.test(link.relation || "")).length,
    investment: links.filter((link) => /invest|portfolio|lead/i.test(link.relation || "")).length,
    ecosystem: links.length,
    partnership: links.filter((link) => /partner|co|shared/i.test(link.relation || "")).length,
    market: links.filter((link) => /market|trade|token/i.test(link.relation || "")).length,
    event: links.filter((link) => Boolean(link.date)).length,
    mention: links.filter((link) => link.confidence === "none").length,
  };

  return [
    { key: "founder", short: "F", label: "Founder", color: "#f59e0b" },
    { key: "investment", short: "I", label: "Investment", color: "#10b981" },
    { key: "ecosystem", short: "E", label: "Ecosystem", color: "#3b82f6" },
    { key: "partnership", short: "P", label: "Partnership", color: "#8b5cf6" },
    { key: "market", short: "M", label: "Market", color: "#ef4444" },
    { key: "event", short: "E", label: "Event", color: "#06b6d4" },
    { key: "mention", short: "M", label: "Mention", color: "#64748b" },
  ].map((item) => ({
    ...item,
    strength: strengthLabel(counts[item.key as keyof typeof counts], links.length),
  }));
};

const buildTrend = (links: IntelligenceLink[], nodes: IntelligenceNode[]) => {
  const datedLinks = links
    .map((link) => ({ link, date: parseDate(link.date) }))
    .filter((item): item is { link: IntelligenceLink; date: Date } => Boolean(item.date));
  const buckets = [0, 0, 0, 0];
  const entityBuckets = [0, 0, 0, 0];

  if (datedLinks.length) {
    const latest = Math.max(...datedLinks.map((item) => item.date.getTime()), Date.now());
    const start = latest - 30 * 24 * 60 * 60 * 1000;
    datedLinks.forEach(({ date }, index) => {
      const bucket = Math.min(
        3,
        Math.max(0, Math.floor(((date.getTime() - start) / (latest - start || 1)) * 4))
      );
      buckets[bucket] += 1;
      entityBuckets[bucket] += index % 2 === 0 ? 1 : 0;
    });
  } else {
    links.forEach((_, index) => {
      buckets[index % 4] += 1;
    });
    nodes.forEach((_, index) => {
      entityBuckets[index % 4] += 1;
    });
  }

  const firstHalf = buckets[0] + buckets[1];
  const secondHalf = buckets[2] + buckets[3];
  const growth = firstHalf ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : secondHalf ? 100 : 0;
  const typeCounts = countBy(nodes, (node) => normalizeEntityType(node.entityType || node.type));
  const hotCluster = toSortedItems(typeCounts, (label) => entityColors[label] || "#3b82f6")[0]?.label || "None";

  return {
    newRelations: buckets,
    newEntities: entityBuckets,
    growth: `${growth >= 0 ? "+" : ""}${growth}%`,
    newLinks: links.length,
    hotCluster,
  };
};

const getCoverageConfidence = (nodesCount: number, linksCount: number) => {
  if (!nodesCount || !linksCount) return "Low";
  if (linksCount >= Math.max(4, nodesCount * 0.75)) return "High";
  if (linksCount >= Math.max(2, nodesCount * 0.35)) return "Medium";
  return "Low";
};

const strengthLabel = (value: number, total: number) => {
  if (!value) return "Light";
  const ratio = value / Math.max(1, total);
  if (ratio >= 0.45) return "Strong";
  if (ratio >= 0.18) return "Medium";
  if (ratio >= 0.08) return "Emerging";
  return "Light";
};

const toSortedItems = (
  counts: Record<string, number>,
  color: (label: string, index: number) => string
) =>
  Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      label: humanizeRelation(label),
      value,
      color: color(label, index),
    }));

const countBy = <T,>(items: T[], getKey: (item: T) => string) =>
  items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const getPaginationPage = (index: number, currentPage: number, totalPages: number) => {
  if (totalPages <= 5) return index + 1;
  if (currentPage <= 3) return index + 1;
  if (currentPage >= totalPages - 2) return totalPages - 4 + index;
  return currentPage - 2 + index;
};

const getNodeId = (value: string | IntelligenceNode) =>
  typeof value === "object" && value ? String(value.id) : String(value || "");

const parseDate = (value?: string | Date) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeEntityType = (value: any) => {
  const type = String(value || "").toLowerCase();
  if (type === "main") return "project";
  if (type === "exchange") return "fund";
  if (type === "token") return "project";
  if (type === "lock") return "investor";
  return type || "unknown";
};

const humanizeRelation = (value: string) =>
  toTitleCase(String(value || "related").replace(/[_-]+/g, " "));

const toTitleCase = (value: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeText = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getImageSrc = (logo: string) => {
  if (logo.startsWith("/")) return toClientAbsoluteUrl(logo);
  return imageLoader(logo);
};

export default BackersGraphIntelligence;
