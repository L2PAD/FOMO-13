import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Funds } from "src/funds/funds.model";
import { Person } from "src/persons/person.model";
import { Project } from "src/projects/project.model";
import {
  InvestorResolverInput,
  InvestorResolverService,
} from "./investor-resolver.service";

type CryptoLinkingEntityType = "project" | "fund" | "person";
type GraphEntityType = CryptoLinkingEntityType | "investor";
type EntityFilterKey =
  | "projects"
  | "funds"
  | "persons"
  | "exchanges"
  | "tokens"
  | "assets";
type RelationFilterKey =
  | "investedIn"
  | "coinvestedWith"
  | "founded"
  | "hasToken"
  | "tradedOn"
  | "worksAt";
type ContextScopeKey =
  | "founder"
  | "investment"
  | "ecosystem"
  | "partnership"
  | "market"
  | "event"
  | "mention";

type GraphFilterOptions = {
  entityTypes?: string[];
  relationTypes?: string[];
  contextScopes?: string[];
};

type GraphFilterCriteria = {
  entityTypes?: Set<EntityFilterKey>;
  relationTypes?: Set<RelationFilterKey>;
  contextScopes?: Set<ContextScopeKey>;
};

type EntitySummary = {
  _id: string;
  id: string;
  nodeId: string;
  type: CryptoLinkingEntityType;
  entityType: CryptoLinkingEntityType;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  label?: string;
};

type GraphNode = {
  id: string;
  entityId?: string;
  entityType: GraphEntityType;
  label: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  size?: number;
  confidence?: string;
  matchedBy?: string;
  metadata?: Record<string, any>;
};

type GraphLink = {
  source: string;
  target: string;
  value: number;
  relation: string;
  relationType?: RelationFilterKey;
  contextScopes?: ContextScopeKey[];
  roundId?: string;
  roundStage?: string;
  date?: Date | string;
  fundsRaised?: number;
  confidence?: string;
  matchedBy?: string;
  metadata?: Record<string, any>;
};

type InvestorReference = {
  id?: number | string;
  name?: string;
  investorSlug?: string;
  ventureType?: string;
  type?: string;
  tier?: string;
  image?: string;
  lead?: boolean;
  count?: number;
  lastRoundDate?: Date | string;
};

const INVESTOR_RESOLVE_BATCH_SIZE = 8;
const MAX_ENTITY_COINVESTORS = 40;

@Injectable()
export class CryptoLinkingGraphService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Funds.name) private readonly fundsModel: Model<Funds>,
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
    private readonly investorResolverService: InvestorResolverService
  ) {}

  async search(query: string, rawLimit?: string | number) {
    const value = String(query || "").trim();
    const limit = this.boundedLimit(rawLimit, 10, 20);
    if (value.length < 2) {
      return { isSuccess: true, items: [], total: 0 };
    }

    const regex = new RegExp(this.escapeRegex(value), "i");
    const objectId = this.isObjectId(value) ? new Types.ObjectId(value) : null;
    const perTypeLimit = Math.max(4, Math.ceil(limit / 3) + 2);

    const [projects, funds, persons] = await Promise.all([
      this.projectModel
        .find(
          this.searchQuery(
            ["name", "slug", "symbol", "sourceKey"],
            regex,
            objectId
          )
        )
        .select(this.entityProjection())
        .limit(perTypeLimit)
        .lean(),
      this.fundsModel
        .find(this.searchQuery(["name", "slug", "sourceKey"], regex, objectId))
        .select(this.entityProjection())
        .limit(perTypeLimit)
        .lean(),
      this.personModel
        .find(this.searchQuery(["name", "slug", "sourceKey"], regex, objectId))
        .select(this.entityProjection())
        .limit(perTypeLimit)
        .lean(),
    ]);

    const items = [
      ...(projects as any[]).map((project) =>
        this.toEntitySummary("project", project)
      ),
      ...(funds as any[]).map((fund) => this.toEntitySummary("fund", fund)),
      ...(persons as any[]).map((person) =>
        this.toEntitySummary("person", person)
      ),
    ];

    const rankedItems = this.rankSearchResults(items, value).slice(0, limit);
    return {
      isSuccess: true,
      items: rankedItems,
      total: rankedItems.length,
    };
  }

  async graph(
    entityType: string,
    id: string,
    rawLimit?: string | number,
    rawFilters: GraphFilterOptions = {}
  ) {
    const type = this.normalizeEntityType(entityType);
    const entityId = String(id || "").trim();
    const limit = this.boundedLimit(rawLimit, 120, 300);
    const filters = this.normalizeGraphFilters(rawFilters);

    if (!type) {
      throw new BadRequestException(
        "entityType must be project, fund, or person."
      );
    }

    if (!entityId) {
      throw new BadRequestException("Entity id is required.");
    }

    const entity = await this.findEntity(type, entityId);
    if (!entity) {
      throw new NotFoundException("Crypto-linking entity not found.");
    }

    return type === "project"
      ? this.projectGraph(entity, limit, filters)
      : this.investorGraph(type, entity, limit, filters);
  }

  private async projectGraph(
    project: any,
    limit: number,
    filters: GraphFilterCriteria
  ) {
    const selectedEntity = this.toEntitySummary("project", project);
    const nodes = new Map<string, GraphNode>();
    const links = new Map<string, GraphLink>();

    this.addNode(nodes, this.toGraphNode(selectedEntity));
    await this.addProjectFallbackRelations(
      project,
      selectedEntity.nodeId,
      nodes,
      links,
      limit,
      filters
    );

    return this.toGraphResponse(selectedEntity, nodes, links);
  }

  private async investorGraph(
    type: "fund" | "person",
    entity: any,
    limit: number,
    filters: GraphFilterCriteria
  ) {
    const selectedEntity = this.toEntitySummary(type, entity);
    const nodes = new Map<string, GraphNode>();
    const links = new Map<string, GraphLink>();

    this.addNode(nodes, this.toGraphNode(selectedEntity));

    await this.addEntityCoInvestorRelations(
      entity,
      selectedEntity.nodeId,
      nodes,
      links,
      limit,
      filters
    );

    await this.addPortfolioRelations(
      entity,
      selectedEntity.nodeId,
      nodes,
      links,
      limit,
      filters
    );

    return this.toGraphResponse(selectedEntity, nodes, links);
  }

  private async resolveInvestorNode(
    investor: InvestorReference,
    cache: Map<string, Promise<GraphNode>>
  ) {
    const key = this.rawInvestorKey(investor);
    if (!cache.has(key)) {
      cache.set(key, this.resolveInvestorNodeUncached(investor));
    }

    return cache.get(key);
  }

  private async resolveInvestorNodeUncached(
    investor: InvestorReference
  ): Promise<GraphNode> {
    const input = this.toInvestorResolverInput(investor);
    const result = await this.investorResolverService.resolve(input);
    const confidence = result.confidence;
    const canUseResolvedEntity =
      (result.type === "fund" || result.type === "person") &&
      ["exact", "high", "medium"].includes(confidence);

    if (canUseResolvedEntity) {
      const candidate = result.candidates?.[0];
      const resolvedType = result.type as "fund" | "person";
      const entityId =
        resolvedType === "fund" ? result.fundId : result.personId;
      return {
        id: `${resolvedType}:${
          entityId?.toString() || candidate?.id?.toString()
        }`,
        entityId: entityId?.toString() || candidate?.id?.toString(),
        entityType: resolvedType,
        label: candidate?.name || investor.name || "Unknown investor",
        name: candidate?.name || investor.name || "Unknown investor",
        slug: candidate?.slug || investor.investorSlug,
        logo: investor.image,
        size: investor.lead ? 7 : 5,
        confidence,
        matchedBy: result.matchedBy,
      };
    }

    const name = investor.name || investor.investorSlug || "Unknown investor";
    return {
      id: `investor:${this.safeNodeId(this.rawInvestorKey(investor))}`,
      entityType: "investor",
      label: name,
      name,
      slug: investor.investorSlug,
      logo: investor.image,
      size: investor.lead ? 6 : 4,
      confidence,
      matchedBy: result.matchedBy,
    };
  }

  private async addEntityCoInvestorRelations(
    entity: any,
    entityNodeId: string,
    nodes: Map<string, GraphNode>,
    links: Map<string, GraphLink>,
    limit: number,
    filters: GraphFilterCriteria
  ) {
    if (
      links.size >= limit ||
      !Array.isArray(entity?.coInvestors) ||
      !this.coInvestorLinksCanPass(filters)
    ) {
      return;
    }

    const coInvestors = entity.coInvestors
      .filter((investor: InvestorReference) =>
        this.rawInvestorEntityMayPass(investor, filters)
      )
      .slice(0, MAX_ENTITY_COINVESTORS);
    const investorCache = new Map<string, Promise<GraphNode>>();

    for (
      let index = 0;
      index < coInvestors.length && links.size < limit;
      index += INVESTOR_RESOLVE_BATCH_SIZE
    ) {
      const chunk = coInvestors.slice(
        index,
        index + INVESTOR_RESOLVE_BATCH_SIZE
      );
      const coInvestorNodes = await Promise.all(
        chunk.map((investor: InvestorReference) =>
          this.resolveInvestorNode(investor, investorCache)
        )
      );

      for (let nodeIndex = 0; nodeIndex < chunk.length; nodeIndex += 1) {
        if (links.size >= limit) return;

        const coInvestor = chunk[nodeIndex];
        const coInvestorNode = coInvestorNodes[nodeIndex];
        if (!coInvestorNode || coInvestorNode.id === entityNodeId) continue;

        this.addNode(nodes, coInvestorNode);
        this.addLink(
          links,
          {
            source: entityNodeId,
            target: coInvestorNode.id,
            value: this.toNumber(coInvestor.count) || 1,
            relation: "coinvested_with",
            date: coInvestor.lastRoundDate,
            confidence: coInvestorNode.confidence,
            matchedBy: coInvestorNode.matchedBy,
            metadata: {
              investorSlug: coInvestor.investorSlug,
              ventureType: coInvestor.ventureType,
              count: coInvestor.count,
            },
          },
          nodes,
          entityNodeId,
          filters
        );
      }
    }
  }

  private async addProjectFallbackRelations(
    project: any,
    projectNodeId: string,
    nodes: Map<string, GraphNode>,
    links: Map<string, GraphLink>,
    limit: number,
    filters: GraphFilterCriteria
  ) {
    const investorIds = this.uniqueObjectIds(project?.investors || []);
    const personIds = this.uniqueObjectIds([
      ...(project?.team || []),
      ...(project?.advisors || []),
    ]);
    const includeFunds =
      investorIds.length &&
      this.graphEntityTypeAllowed("fund", filters) &&
      this.linkMetadataAllowed(
        "linked_investor",
        undefined,
        undefined,
        filters
      );
    const includePersons =
      personIds.length &&
      this.graphEntityTypeAllowed("person", filters) &&
      this.linkMetadataAllowed("linked_person", undefined, undefined, filters);

    if (!includeFunds && !includePersons) return;

    const [funds, persons] = await Promise.all([
      includeFunds
        ? this.fundsModel
            .find({ _id: { $in: investorIds } })
            .select(this.entityProjection())
            .limit(limit)
            .lean()
        : Promise.resolve([]),
      includePersons
        ? this.personModel
            .find({ _id: { $in: personIds } })
            .select(this.entityProjection())
            .limit(limit)
            .lean()
        : Promise.resolve([]),
    ]);

    for (const fund of funds as any[]) {
      if (links.size >= limit) break;
      const node = this.toGraphNode(this.toEntitySummary("fund", fund));
      this.addNode(nodes, node);
      this.addLink(
        links,
        {
          source: node.id,
          target: projectNodeId,
          value: 1,
          relation: "linked_investor",
        },
        nodes,
        projectNodeId,
        filters
      );
    }

    for (const person of persons as any[]) {
      if (links.size >= limit) break;
      const node = this.toGraphNode(this.toEntitySummary("person", person));
      this.addNode(nodes, node);
      this.addLink(
        links,
        {
          source: node.id,
          target: projectNodeId,
          value: 1,
          relation: "linked_person",
        },
        nodes,
        projectNodeId,
        filters
      );
    }
  }

  private async addPortfolioRelations(
    entity: any,
    entityNodeId: string,
    nodes: Map<string, GraphNode>,
    links: Map<string, GraphLink>,
    limit: number,
    filters: GraphFilterCriteria
  ) {
    if (links.size >= limit || !Array.isArray(entity?.portfolioCoins)) return;
    if (!this.projectInvestmentLinksCanPass(filters)) return;

    const portfolioCoins = entity.portfolioCoins.slice(0, limit);
    const slugs = this.uniqueStrings(
      portfolioCoins.map((coin: any) => coin?.slug)
    );
    const names = this.uniqueStrings(
      portfolioCoins.map((coin: any) => coin?.name)
    );
    const projectLookupConditions = [
      ...(slugs.length ? [{ slug: { $in: slugs } }] : []),
      ...(names.length
        ? [
            {
              name: {
                $in: names
                  .slice(0, 20)
                  .map(
                    (name) => new RegExp(`^${this.escapeRegex(name)}$`, "i")
                  ),
              },
            },
          ]
        : []),
    ];
    const projects = await this.projectModel
      .find(
        projectLookupConditions.length
          ? { $or: projectLookupConditions }
          : { _id: { $exists: false } }
      )
      .select(this.entityProjection())
      .limit(portfolioCoins.length)
      .lean();
    const projectsBySlug = new Map(
      (projects as any[]).map((project) => [project.slug, project])
    );
    const projectsByName = new Map(
      (projects as any[]).map((project) => [
        this.normalizeName(project.name),
        project,
      ])
    );

    for (const coin of portfolioCoins) {
      if (links.size >= limit) break;
      const project =
        (coin?.slug && projectsBySlug.get(coin.slug)) ||
        projectsByName.get(this.normalizeName(coin?.name));
      const node = project
        ? this.toGraphNode(this.toEntitySummary("project", project))
        : {
            id: `project:raw:${this.safeNodeId(coin?.slug || coin?.name)}`,
            entityType: "project" as const,
            label: coin?.name || coin?.slug || "Portfolio project",
            name: coin?.name || coin?.slug || "Portfolio project",
            slug: coin?.slug,
            symbol: coin?.symbol,
            logo: coin?.image,
            size: 5,
          };

      this.addNode(nodes, node);
      this.addLink(
        links,
        {
          source: entityNodeId,
          target: node.id,
          value: this.toNumber(coin?.fundsRaised) || 1,
          relation: "portfolio",
          date: coin?.lastRoundDate,
          fundsRaised: this.toNumber(coin?.fundsRaised),
        },
        nodes,
        entityNodeId,
        filters
      );
    }
  }

  private toInvestorResolverInput(
    investor: InvestorReference
  ): InvestorResolverInput {
    return {
      name: investor?.name,
      slug: investor?.investorSlug,
      type: this.normalizeInvestorType(investor?.ventureType || investor?.type),
      source: investor?.id ? "dropstab" : undefined,
      sourceId: investor?.id,
      sourceKey: investor?.investorSlug,
      dropstabId: investor?.id,
    };
  }

  private normalizeInvestorType(value: any): "fund" | "person" | "unknown" {
    const normalized = String(value || "").toLowerCase();
    if (!normalized) return "unknown";
    if (/(angel|person|individual|founder|advisor)/.test(normalized))
      return "person";
    if (
      /(fund|venture|capital|vc|labs|dao|investor|incubator|accelerator)/.test(
        normalized
      )
    )
      return "fund";
    return "unknown";
  }

  private async findEntity(type: CryptoLinkingEntityType, id: string) {
    const model = this.entityModel(type);
    const query = this.isObjectId(id)
      ? { _id: new Types.ObjectId(id) }
      : {
          $or: [
            { slug: id },
            { sourceKey: id },
            { name: new RegExp(`^${this.escapeRegex(id)}$`, "i") },
          ],
        };

    return model.findOne(query).select(this.entityProjection()).lean();
  }

  private entityModel(type: CryptoLinkingEntityType): Model<any> {
    if (type === "project") return this.projectModel as Model<any>;
    if (type === "fund") return this.fundsModel as Model<any>;
    return this.personModel as Model<any>;
  }

  private toEntitySummary(
    type: CryptoLinkingEntityType,
    entity: any
  ): EntitySummary {
    const id = entity?._id?.toString();
    return {
      _id: id,
      id,
      nodeId: `${type}:${id}`,
      type,
      entityType: type,
      name: entity?.name || entity?.slug || "Unknown entity",
      slug: entity?.slug,
      symbol: entity?.symbol,
      logo: entity?.logo || entity?.image,
      label:
        type === "project" && entity?.symbol
          ? `${entity.name} (${entity.symbol})`
          : entity?.name,
    };
  }

  private toGraphNode(entity: EntitySummary): GraphNode {
    return {
      id: entity.nodeId,
      entityId: entity.id,
      entityType: entity.type,
      label: entity.label || entity.name,
      name: entity.name,
      slug: entity.slug,
      symbol: entity.symbol,
      logo: entity.logo,
      size: 8,
    };
  }

  private addNode(nodes: Map<string, GraphNode>, node: GraphNode) {
    if (!nodes.has(node.id)) {
      nodes.set(node.id, node);
      return;
    }

    const existing = nodes.get(node.id);
    nodes.set(node.id, {
      ...existing,
      ...node,
      size: Math.max(existing?.size || 0, node.size || 0),
    });
  }

  private addLink(
    links: Map<string, GraphLink>,
    link: GraphLink,
    nodes?: Map<string, GraphNode>,
    selectedNodeId?: string,
    filters?: GraphFilterCriteria
  ) {
    if (
      nodes &&
      selectedNodeId &&
      filters &&
      !this.isLinkAllowed(link, nodes, selectedNodeId, filters)
    ) {
      return false;
    }

    const key = [
      link.source,
      link.target,
      link.relation,
      link.roundId || link.date?.toString() || "",
    ].join("|");
    if (links.has(key)) return false;

    links.set(key, {
      ...link,
      relationType: this.relationFilterKey(link),
      contextScopes: this.contextFilterKeys(link),
    });
    return true;
  }

  private toGraphResponse(
    selectedEntity: EntitySummary,
    nodes: Map<string, GraphNode>,
    links: Map<string, GraphLink>
  ) {
    const visibleNodeIds = new Set<string>([selectedEntity.nodeId]);
    for (const link of links.values()) {
      visibleNodeIds.add(link.source);
      visibleNodeIds.add(link.target);
    }
    const visibleNodes = Array.from(nodes.values()).filter((node) =>
      visibleNodeIds.has(node.id)
    );

    return {
      isSuccess: true,
      selectedEntity,
      graphData: {
        nodes: visibleNodes,
        links: Array.from(links.values()),
      },
      totalNodes: visibleNodes.length,
      totalLinks: links.size,
    };
  }

  private searchQuery(
    fields: string[],
    regex: RegExp,
    objectId: Types.ObjectId | null
  ) {
    const or: any[] = fields.map((field) => ({ [field]: regex }));
    if (objectId) or.unshift({ _id: objectId });
    return {
      isDuplicate: { $ne: true },
      $or: or,
    };
  }

  private rankSearchResults(items: EntitySummary[], query: string) {
    const normalizedQuery = this.normalizeName(query);
    const typePriority: Record<CryptoLinkingEntityType, number> = {
      project: 0,
      fund: 1,
      person: 2,
    };

    return items.sort((a, b) => {
      const scoreA = this.searchScore(a, normalizedQuery);
      const scoreB = this.searchScore(b, normalizedQuery);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return typePriority[a.type] - typePriority[b.type];
    });
  }

  private searchScore(item: EntitySummary, normalizedQuery: string) {
    const name = this.normalizeName(item.name);
    const slug = this.normalizeName(item.slug);
    if (name === normalizedQuery || slug === normalizedQuery) return 100;
    if (name.startsWith(normalizedQuery) || slug.startsWith(normalizedQuery))
      return 80;
    if (name.includes(normalizedQuery) || slug.includes(normalizedQuery))
      return 50;
    return 10;
  }

  private normalizeGraphFilters(
    options: GraphFilterOptions
  ): GraphFilterCriteria {
    return {
      entityTypes: this.normalizeFilterSet<EntityFilterKey>(
        options.entityTypes,
        ["projects", "funds", "persons", "exchanges", "tokens", "assets"]
      ),
      relationTypes: this.normalizeFilterSet<RelationFilterKey>(
        options.relationTypes,
        [
          "investedIn",
          "coinvestedWith",
          "founded",
          "hasToken",
          "tradedOn",
          "worksAt",
        ]
      ),
      contextScopes: this.normalizeFilterSet<ContextScopeKey>(
        options.contextScopes,
        [
          "founder",
          "investment",
          "ecosystem",
          "partnership",
          "market",
          "event",
          "mention",
        ]
      ),
    };
  }

  private normalizeFilterSet<T extends string>(
    values: string[] | undefined,
    allowedValues: readonly T[]
  ) {
    if (!Array.isArray(values)) return undefined;

    const allowed = new Set<string>(allowedValues);
    return new Set(
      values
        .map((value) => String(value || "").trim())
        .filter((value): value is T => allowed.has(value))
    );
  }

  private projectInvestmentLinksCanPass(filters: GraphFilterCriteria) {
    if (filters.entityTypes && !filters.entityTypes.has("projects")) {
      return false;
    }

    return this.investmentRelationCanPass(filters);
  }

  private coInvestorLinksCanPass(filters: GraphFilterCriteria) {
    if (filters.relationTypes && !filters.relationTypes.has("coinvestedWith")) {
      return false;
    }

    if (
      filters.contextScopes &&
      !filters.contextScopes.has("partnership") &&
      !filters.contextScopes.has("investment") &&
      !filters.contextScopes.has("event") &&
      !filters.contextScopes.has("mention")
    ) {
      return false;
    }

    return true;
  }

  private investmentRelationCanPass(filters: GraphFilterCriteria) {
    if (filters.relationTypes && !filters.relationTypes.has("investedIn")) {
      return false;
    }

    if (
      filters.contextScopes &&
      !filters.contextScopes.has("investment") &&
      !filters.contextScopes.has("event") &&
      !filters.contextScopes.has("mention")
    ) {
      return false;
    }

    return true;
  }

  private linkMetadataAllowed(
    relation: string,
    date: Date | string | undefined,
    confidence: string | undefined,
    filters: GraphFilterCriteria
  ) {
    const link: GraphLink = {
      source: "",
      target: "",
      value: 1,
      relation,
      date,
      confidence,
    };

    if (
      filters.relationTypes &&
      !filters.relationTypes.has(this.relationFilterKey(link))
    ) {
      return false;
    }

    if (filters.contextScopes) {
      const contextScopes = this.contextFilterKeys(link);
      return contextScopes.some((scope) => filters.contextScopes.has(scope));
    }

    return true;
  }

  private rawInvestorEntityMayPass(
    investor: InvestorReference,
    filters: GraphFilterCriteria
  ) {
    if (!filters.entityTypes) return true;

    const normalizedType = this.normalizeInvestorType(
      investor?.ventureType || investor?.type
    );

    if (normalizedType === "fund") {
      return (
        filters.entityTypes.has("funds") || filters.entityTypes.has("assets")
      );
    }

    if (normalizedType === "person") {
      return (
        filters.entityTypes.has("persons") || filters.entityTypes.has("assets")
      );
    }

    return (
      filters.entityTypes.has("funds") ||
      filters.entityTypes.has("persons") ||
      filters.entityTypes.has("assets")
    );
  }

  private isLinkAllowed(
    link: GraphLink,
    nodes: Map<string, GraphNode>,
    selectedNodeId: string,
    filters: GraphFilterCriteria
  ) {
    const sourceNode = nodes.get(link.source);
    const targetNode = nodes.get(link.target);

    if (filters.entityTypes) {
      const relatedNodes = [sourceNode, targetNode].filter(
        (node): node is GraphNode => Boolean(node && node.id !== selectedNodeId)
      );
      if (
        !relatedNodes.every((node) =>
          this.isNodeAllowedByEntityFilter(node, filters.entityTypes)
        )
      ) {
        return false;
      }
    }

    if (
      filters.relationTypes &&
      !filters.relationTypes.has(this.relationFilterKey(link))
    ) {
      return false;
    }

    if (filters.contextScopes) {
      const contextScopes = this.contextFilterKeys(link);
      if (!contextScopes.some((scope) => filters.contextScopes.has(scope))) {
        return false;
      }
    }

    return true;
  }

  private isNodeAllowedByEntityFilter(
    node: GraphNode,
    entityTypes: Set<EntityFilterKey>
  ) {
    return this.graphEntityTypeAllowed(node.entityType, { entityTypes });
  }

  private graphEntityTypeAllowed(
    entityType: GraphEntityType,
    filters: GraphFilterCriteria
  ) {
    if (!filters.entityTypes) return true;
    if (entityType === "project") return filters.entityTypes.has("projects");
    if (entityType === "fund") return filters.entityTypes.has("funds");
    if (entityType === "person") return filters.entityTypes.has("persons");
    if (entityType === "investor") return filters.entityTypes.has("assets");
    return false;
  }

  private relationFilterKey(link: GraphLink): RelationFilterKey {
    const relation = String(
      link.relation || link.roundStage || ""
    ).toLowerCase();

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

  private contextFilterKeys(link: GraphLink): ContextScopeKey[] {
    const relation = String(
      link.relation || link.roundStage || ""
    ).toLowerCase();
    const keys = new Set<ContextScopeKey>();

    if (
      /found|linked_person|work|advisor|member|employee|collaborator|team/.test(
        relation
      )
    ) {
      keys.add("founder");
    }

    if (
      /invest|portfolio|lead|led|linked_investor/.test(relation)
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

  private normalizeEntityType(value: string): CryptoLinkingEntityType | null {
    const normalized = String(value || "").toLowerCase();
    if (
      normalized === "project" ||
      normalized === "fund" ||
      normalized === "person"
    )
      return normalized;
    return null;
  }

  private boundedLimit(
    rawLimit: string | number,
    defaultLimit: number,
    maxLimit: number
  ) {
    const parsed = Number(rawLimit);
    if (!Number.isFinite(parsed) || parsed <= 0) return defaultLimit;
    return Math.min(Math.floor(parsed), maxLimit);
  }

  private entityProjection() {
    return {
      _id: 1,
      name: 1,
      slug: 1,
      symbol: 1,
      logo: 1,
      image: 1,
      source: 1,
      sourceId: 1,
      sourceKey: 1,
      rawIcoData: 1,
      aliases: 1,
      sourceMappings: 1,
      investors: 1,
      team: 1,
      advisors: 1,
      portfolioCoins: 1,
      coInvestors: 1,
      dropstabId: 1,
    };
  }

  private rawInvestorKey(investor: InvestorReference) {
    return String(
      investor?.id ||
        investor?.investorSlug ||
        this.normalizeName(investor?.name) ||
        "unknown-investor"
    );
  }

  private safeNodeId(value: any) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || "unknown";
  }

  private normalizeName(value: any) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private toNumber(value: any) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(
        values
          .flat()
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )
    );
  }

  private uniqueObjectIds(values: any[]) {
    const ids = this.uniqueStrings(values).filter((value) =>
      this.isObjectId(value)
    );
    return ids.map((value) => new Types.ObjectId(value));
  }

  private isObjectId(value: any) {
    return /^[a-f\d]{24}$/i.test(String(value || "").trim());
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
