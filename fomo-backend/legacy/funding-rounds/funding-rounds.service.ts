import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FundingRound, FundingRoundDocument } from './models/funding-round.model';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { Funds, FundsDocument } from 'src/funds/funds.model';
import { Person, PersonDocument } from 'src/persons/person.model';
import { Project, ProjectDocument } from 'src/projects/project.model';
import { AppCacheService } from 'src/common/cache/cache.service';
import { CACHE_TTL_SECONDS } from 'src/common/cache/cache.constants';
import { CacheKeys } from 'src/common/cache/cache.keys';
import { hasFundingRoundToken } from './funding-round-token.util';

interface Coin {
    id: number;
    slug: string;
    symbol: string;
    // другие поля, если они есть в ответе API
}

type FundingRoundsListParams = {
    limit?: number;
    offset?: number;
    search?: string;
    mode?: string;
    categories?: string;
    fundingType?: string;
    fundsRaised?: string;
    preValuation?: string;
    fundingDates?: string;
    hasToken?: string;
    chain?: string;
    investors?: string;
    investorDropstabIds?: string;
    investorSlugs?: string;
    investorNames?: string;
    devStage?: string;
    companyType?: string;
    redFlags?: string;
    fomoScore?: string;
};

type RoundSortDirection = 1 | -1;

type FundingRoundFilterOption = {
    key: string;
    label: string;
    count: number;
};

@Injectable()
export class FundingRoundsService {
    private readonly logger = new Logger(FundingRoundsService.name);
    private readonly API_BASE_URL = 'https://api2.icodrops.com/portfolio/api/fundraisingRounds?sort=announceDate&order=DESC&page=0&size=50';
    private readonly PAGE_SIZE = 100;

    constructor(
        @InjectModel(FundingRound.name)
        private fundingRoundModel: Model<FundingRoundDocument>,
        @InjectModel(Funds.name)
        private fundModel: Model<FundsDocument>,
        @InjectModel(Person.name)
        private personModel: Model<PersonDocument>,
        @InjectModel(Project.name)
        private projectModel: Model<ProjectDocument>,
        private readonly cacheService: AppCacheService,
    ) {
        // this.fetchAllCoins()
        // this.getProjectInvestorsFundingRounds()
        // this.fetchAndSaveTopProjects()
        // this.removeAll()
    }

    private async removeAll() {
        await this.fundingRoundModel.deleteMany({})
    }

    private getHeaders(): any {
        return {
            Accept: '*/*',
            'x-dropstab-api-key': process.env.DROPSTAB_KEY,
        };
    }

    private async safeRequest(
        url: string,
        params = {},
        headers = {},
    ): Promise<any> {
        try {
            const response = await axios.get(url, { params, headers });
            return response.data;
        } catch (error) {
            this.logger.error(`Request failed to ${url}: ${error.message}`);
            throw new Error(error.message || 'Request failed');
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private chunkArray<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    private hasRequiredRoundFields(round: {
        image?: unknown;
        category?: unknown;
        stage?: unknown;
    }): boolean {
        const image = typeof round.image === 'string' ? round.image.trim() : '';
        const category = typeof round.category === 'string' ? round.category.trim() : '';
        const stage = typeof round.stage === 'string' ? round.stage.trim() : '';

        const invalidValues = new Set(['-', 'unknown', 'null', 'undefined']);

        return Boolean(
            image &&
            category &&
            stage &&
            !invalidValues.has(category.toLowerCase()) &&
            !invalidValues.has(stage.toLowerCase()),
        );
    }

    private parseCsv(value?: string): string[] {
        return String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    private parseNumericCsv(value?: string): number[] {
        return this.parseCsv(value)
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item));
    }

    private parseRangeFilter(value?: string): Array<{ from: number; to: number }> {
        return this.parseCsv(value).reduce((ranges: Array<{ from: number; to: number }>, item) => {
            const [from, to] = item.split('-').map((part) => Number(part));

            if (Number.isFinite(from) && Number.isFinite(to)) {
                ranges.push({ from, to });
            }

            return ranges;
        }, []);
    }

    private buildRangeCondition(field: string, value?: string): any | undefined {
        const ranges = this.parseRangeFilter(value);

        if (!ranges.length) return undefined;

        return {
            $or: ranges.map((range) => ({
                [field]: { $gte: range.from, $lte: range.to },
            })),
        };
    }

    private buildFundingDateCondition(value?: string): any | undefined {
        const values = this.parseCsv(value);
        if (!values.length) return undefined;

        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const conditions = values
            .map((item) => {
                if (item.startsWith('<')) {
                    const days = Number(item.replace(/\D/g, ''));
                    if (!Number.isFinite(days)) return undefined;

                    return { date: { $gte: new Date(now - days * day) } };
                }

                if (item.startsWith('>')) {
                    const days = Number(item.replace(/\D/g, ''));
                    if (!Number.isFinite(days)) return undefined;

                    return { date: { $lt: new Date(now - days * day) } };
                }

                return undefined;
            })
            .filter(Boolean);

        return conditions.length ? { $or: conditions } : undefined;
    }

    private escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private rangeFilterIncludesZero(value?: string): boolean {
        const items = this.parseCsv(value);

        return items.some((item) => {
            if (item === '0') return true;
            if (item.startsWith('>')) return false;

            const [from, to] = item.split('-').map((part) => Number(part));

            return Number.isFinite(from) && Number.isFinite(to) && from <= 0 && to >= 0;
        });
    }

    private async getTopFilterOptions(
        field: 'category' | 'stage',
        limit: number,
    ): Promise<FundingRoundFilterOption[]> {
        const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
        const valueField = `$${field}`;

        const options = await this.fundingRoundModel.aggregate([
            {
                $project: {
                    rawValue: {
                        $trim: {
                            input: { $ifNull: [valueField, ''] },
                        },
                    },
                    normalizedValue: {
                        $toLower: {
                            $trim: {
                                input: { $ifNull: [valueField, ''] },
                            },
                        },
                    },
                    fundsRaised: { $ifNull: ['$fundsRaised', 0] },
                    date: 1,
                },
            },
            {
                $match: {
                    rawValue: { $ne: '' },
                    normalizedValue: { $nin: ['-', 'unknown', 'null', 'undefined'] },
                },
            },
            {
                $group: {
                    _id: '$rawValue',
                    count: { $sum: 1 },
                    raised: { $sum: '$fundsRaised' },
                    latestDate: { $max: '$date' },
                },
            },
            {
                $sort: {
                    count: -1,
                    raised: -1,
                    latestDate: -1,
                    _id: 1,
                },
            },
            { $limit: safeLimit },
        ]);

        return options.map((item: any) => ({
            key: item._id,
            label: item._id,
            count: Number(item.count || 0),
        }));
    }

    async fetchAllCoins(): Promise<any[]> {
        let allCoins: any[] = [];
        let page = 0;

        while (true) {
            this.logger.log(`Fetching coins page ${page}`);
            const response = await axios.post(this.API_BASE_URL, {
                sort: 'announceDate',
                order: 'DESC',
                page,
                size: 50,
            });

            const content = response.data?.content || [];

            if (!content.length || allCoins.length >= 100) break;

            allCoins = [...allCoins, ...content];
            page++;
            await this.sleep(3000);
        }

        return allCoins;
    }

    async fetchAndSaveTopProjects() {
        const maxProjects = 100;
        let allCoins: any[] = [];
        let page = 1;

        while (allCoins.length < maxProjects) {
            this.logger.log(`Fetching coins page ${page}`);
            const response = await axios.post(this.API_BASE_URL, {
                sort: 'announceDate',
                order: 'DESC',
                page,
                size: 50,
            });

            const content = response?.data?.content || [];
            if (!content.length) break;

            allCoins = [...allCoins, ...content];
            page++;
            await this.sleep(3000);
        }

        const coinsToSave = allCoins.slice(0, maxProjects);

        await this.upsertProjectsAndRounds(coinsToSave);

        this.logger.log(`Fetched and saved ${coinsToSave.length} projects`);
    }


    async upsertProjectsAndRounds(coins: any[]) {
        const chunks = this.chunkArray(coins, 50);

        for (const chunk of chunks) {
            const validCoins = chunk.filter((apiData) =>
                this.hasRequiredRoundFields({
                    image: apiData.image,
                    category: apiData.category,
                    stage: apiData?.mainTag?.displayName || apiData.stage,
                }),
            );

            const projectOps = validCoins.map((apiData,i) => ({
                updateOne: {
                    filter: { slug: apiData.slug },
                    update: {
                        $set: {
                            projectType: "market",
                            projectStatus: "active",
                            capId: apiData.id || null,
                            status: "Active",
                            name: apiData.name,
                            slug: apiData.slug,
                            symbol: apiData.symbol || '',
                            niche: apiData.niche || '',
                            sections: ['funding-feed'],
                            type: apiData?.mainTag?.displayName || '-',
                            logo: apiData.image,
                            totalRaised: apiData.fundsRaised,
                            tags: apiData.allTags?.map((t: any) => t.displayName) || [],
                            mainCategory: apiData.category,
                            descriptionText: apiData.description,
                            twitterData: apiData.tweetscout,
                            investors: apiData.investors?.map((i: any) => new Types.ObjectId(i.id)) || [],
                            rank: apiData.rank || 1000000 + i,
                            trading: 'CURRENTLY_TRADING'
                        },
                    },
                    upsert: true,
                },
            }));

            if (projectOps.length) {
                await this.projectModel.bulkWrite(projectOps);
            }

            const roundOps = validCoins.map(apiData => ({
                updateOne: {
                    filter: { id: apiData.saleId },
                    update: {
                        $set: {
                            id: apiData.saleId,
                            coinSlug: apiData.slug,
                            coinSymbol: apiData.symbol || '',
                            fundsRaised: apiData.fundsRaised,
                            preValuation: apiData.preValuation,
                            preValuationInaccurate: apiData.preValuationInaccurate,
                            stage: apiData.stage,
                            category: apiData.category,
                            date: new Date(apiData.announceDate),
                            investors: apiData.investors?.map((i: any) => ({
                                id: i.id,
                                name: i.name,
                                investorSlug: i.slug,
                                ventureType: i.type || '',
                                tier: i.tier || '',
                                lead: apiData.leadInvestors?.some((li: any) => li.id === i.id),
                                image: i.image || '',
                            })) || [],
                            leadInvestors: apiData.leadInvestors?.map((i: any) => ({
                                id: i.id,
                                name: i.name,
                                investorSlug: i.slug,
                                ventureType: i.type || '',
                                tier: i.tier || '',
                                lead: true,
                                image: i.image || '',
                            })) || [],
                            tags: apiData.allTags?.map((t: any) => t.displayName) || [],
                            image: apiData.image,
                            saleId: apiData.saleId,
                            hasToken: hasFundingRoundToken(apiData, {
                                type: apiData.stage,
                                stage: apiData.stage,
                            }),
                        },
                    },
                    upsert: true,
                },
            }));

            if (roundOps.length) {
                await this.fundingRoundModel.bulkWrite(roundOps);
            }

            this.logger.log(`Processed chunk of ${chunk.length} coins, valid funding records: ${validCoins.length}`);
        }
    }

    async getRounds(slug: string) {
        return this.fundingRoundModel.aggregate([
            { $match: { coinSlug: slug } },
            { $sort: { date: -1 } },
            {
                $lookup: {
                    from: this.fundModel.collection.name,
                    localField: 'investors.id',
                    foreignField: 'dropstabId',
                    as: 'fundInvestors'
                }
            },
            {
                $lookup: {
                    from: this.personModel.collection.name,
                    localField: 'investors.id',
                    foreignField: 'dropstabId',
                    as: 'personInvestors'
                }
            },
            {
                $addFields: {
                    investors: {
                        $map: {
                            input: '$investors',
                            as: 'inv',
                            in: {
                                $mergeObjects: [
                                    '$$inv',
                                    {
                                        details: {
                                            $let: {
                                                vars: {
                                                    personMatch: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: '$personInvestors',
                                                                    as: 'p',
                                                                    cond: { $eq: ['$$p.dropstabId', '$$inv.id'] }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    },
                                                    fundMatch: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: '$fundInvestors',
                                                                    as: 'f',
                                                                    cond: { $eq: ['$$f.dropstabId', '$$inv.id'] }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                },
                                                in: { $ifNull: ['$$personMatch', '$$fundMatch'] }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            { $project: { fundInvestors: 0, personInvestors: 0 } }
        ]);
    }

    async getFilterOptions(limit?: number): Promise<{
        categories: FundingRoundFilterOption[];
        fundingTypes: FundingRoundFilterOption[];
    }> {
        const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

        return this.cacheService.wrap({
            key: CacheKeys.rounds.filters(safeLimit),
            ttl: CACHE_TTL_SECONDS.fundingRoundsFilters,
            factory: async () => {
                const [categories, fundingTypes] = await Promise.all([
                    this.getTopFilterOptions('category', safeLimit),
                    this.getTopFilterOptions('stage', safeLimit),
                ]);

                return {
                    categories,
                    fundingTypes,
                };
            },
        });
    }

    private objectIdString(value: any): string {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value.toHexString === 'function') return value.toHexString();
        if (value._id && value._id !== value) return this.objectIdString(value._id);
        if (typeof value.toString === 'function') return value.toString();
        return '';
    }

    private getRoundProjectIds(round: any): string[] {
        return Array.from(
            new Set(
                [
                    this.objectIdString(round?.projectId),
                    ...(Array.isArray(round?.projectLinks)
                        ? round.projectLinks.map((link: any) => this.objectIdString(link?.projectId))
                        : []),
                ].filter((id) => Types.ObjectId.isValid(id)),
            ),
        );
    }

    private getRoundProjectSlugs(round: any): string[] {
        return Array.from(
            new Set(
                [
                    typeof round?.coinSlug === 'string' ? round.coinSlug.trim() : '',
                ].filter(Boolean),
            ),
        );
    }

    private async listRoundsSortedByProjectFomoScore(
        query: Record<string, any>,
        direction: RoundSortDirection,
        offset: number,
        limit: number,
    ): Promise<any[]> {
        const rounds = await this.fundingRoundModel
            .find(query)
            .select('_id projectId projectLinks coinSlug fomoScore rating date')
            .sort({ date: -1, _id: 1 })
            .lean();
        const projectIds = Array.from(
            new Set(rounds.flatMap((round) => this.getRoundProjectIds(round))),
        );
        const projectSlugs = Array.from(
            new Set(rounds.flatMap((round) => this.getRoundProjectSlugs(round))),
        );
        const projectLookupConditions: any[] = [];

        if (projectIds.length) {
            projectLookupConditions.push({
                _id: { $in: projectIds.map((id) => new Types.ObjectId(id)) },
            });
        }

        if (projectSlugs.length) {
            projectLookupConditions.push({
                $or: [
                    { slug: { $in: projectSlugs } },
                    { sourceId: { $in: projectSlugs } },
                    { 'rawIcoData.slug': { $in: projectSlugs } },
                    { 'rawIcoData.sourceId': { $in: projectSlugs } },
                ],
            });
        }

        const projects = projectLookupConditions.length
            ? await this.projectModel
                .find(
                    projectLookupConditions.length === 1
                        ? projectLookupConditions[0]
                        : { $or: projectLookupConditions },
                )
                .select('_id slug sourceId rawIcoData.slug rawIcoData.sourceId fomoScore rating')
                .lean()
            : [];
        const projectScoreById = new Map<string, number>();
        const projectScoreBySlug = new Map<string, number>();

        for (const project of projects as any[]) {
            const score = this.getFomoScoreValue(project);

            projectScoreById.set(this.objectIdString(project?._id), score);
            [
                project?.slug,
                project?.sourceId,
                project?.rawIcoData?.slug,
                project?.rawIcoData?.sourceId,
            ]
                .map((value) => typeof value === 'string' ? value.trim() : '')
                .filter(Boolean)
                .forEach((slug) => {
                    const currentScore = projectScoreBySlug.get(slug);

                    if (currentScore === undefined || score > currentScore) {
                        projectScoreBySlug.set(slug, score);
                    }
                });
        }
        const roundSortMeta = new WeakMap<object, { score: number; date: number; id: string }>();

        for (const round of rounds as any[]) {
            roundSortMeta.set(round, {
                score: this.getRoundFomoSortScore(round, projectScoreById, projectScoreBySlug),
                date: new Date(round?.date || 0).getTime(),
                id: this.objectIdString(round?._id),
            });
        }

        const sortedRoundIds = rounds
            .sort((left, right) => {
                const leftMeta = roundSortMeta.get(left as object) || { score: 0, date: 0, id: '' };
                const rightMeta = roundSortMeta.get(right as object) || { score: 0, date: 0, id: '' };
                const scoreDiff = (leftMeta.score - rightMeta.score) * direction;

                if (scoreDiff !== 0) return scoreDiff;

                const dateDiff = rightMeta.date - leftMeta.date;

                if (dateDiff !== 0) return dateDiff;

                return leftMeta.id.localeCompare(rightMeta.id);
            })
            .slice(offset, offset + limit)
            .map((round) => round._id);

        if (!sortedRoundIds.length) {
            return [];
        }

        const fullRounds = await this.fundingRoundModel
            .find({ _id: { $in: sortedRoundIds } })
            .lean();
        const fullRoundById = new Map(
            (fullRounds as any[]).map((round) => [this.objectIdString(round?._id), round]),
        );

        return sortedRoundIds
            .map((id) => fullRoundById.get(this.objectIdString(id)))
            .filter(Boolean);
    }

    private toFiniteNumber(value: unknown): number | null {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }

        if (typeof value === 'string') {
            const parsed = Number(value.replace(/[^0-9.-]+/g, ''));
            return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
    }

    private getFomoScoreValue(value: any): number {
        return (
            this.toFiniteNumber(value?.fomoScore) ??
            this.toFiniteNumber(value?.rating) ??
            0
        );
    }

    private getRoundFomoSortScore(
        round: any,
        projectScoreById: Map<string, number>,
        projectScoreBySlug: Map<string, number>,
    ): number {
        const projectScores = [
            ...this.getRoundProjectIds(round)
                .map((id) => projectScoreById.get(id))
                .filter((score): score is number => score !== undefined),
            ...this.getRoundProjectSlugs(round)
                .map((slug) => projectScoreBySlug.get(slug))
                .filter((score): score is number => score !== undefined),
        ];

        if (projectScores.length) {
            return Math.max(...projectScores);
        }

        return this.getFomoScoreValue(round);
    }

    private likesCount(value: unknown): number {
        if (Array.isArray(value)) return value.length;
        return this.toFiniteNumber(value) || 0;
    }

    private redFlagsList(value: unknown): any[] {
        return Array.isArray(value) ? value : [];
    }

    private async enrichRoundsWithProjects(rounds: any[]): Promise<any[]> {
        const projectIds = Array.from(
            new Set(rounds.flatMap((round) => this.getRoundProjectIds(round))),
        );
        const projectSlugs = Array.from(
            new Set(rounds.flatMap((round) => this.getRoundProjectSlugs(round))),
        );
        const projectLookupConditions: any[] = [];

        if (projectIds.length) {
            projectLookupConditions.push({
                _id: { $in: projectIds.map((id) => new Types.ObjectId(id)) },
            });
        }

        if (projectSlugs.length) {
            projectLookupConditions.push({
                $or: [
                    { slug: { $in: projectSlugs } },
                    { sourceId: { $in: projectSlugs } },
                    { 'rawIcoData.slug': { $in: projectSlugs } },
                    { 'rawIcoData.sourceId': { $in: projectSlugs } },
                ],
            });
        }

        const projects = projectLookupConditions.length
            ? await this.projectModel
                .find(
                    projectLookupConditions.length === 1
                        ? projectLookupConditions[0]
                        : { $or: projectLookupConditions },
                )
                .select([
                    'name',
                    'slug',
                    'sourceId',
                    'logo',
                    'image',
                    'symbol',
                    'ticker',
                    'niche',
                    'rating',
                    'fomoScore',
                    'likes',
                    'redFlags',
                    'redFlagsList',
                    'mainCategory',
                    'tokenSymbol',
                    'coingeckoId',
                    'coinmarketcapId',
                    'coinMarketCapId',
                    'fdv',
                    'tgeDate',
                    'tokenomics',
                    'ico',
                    'ido',
                    'ieo',
                    'tokenMetrics',
                    'rawIcoData',
                    'dates',
                ].join(' '))
                .lean()
            : [];
        const projectById = new Map(
            (projects as any[]).map((project) => [this.objectIdString(project?._id), project]),
        );
        const projectBySlug = new Map<string, any>();

        for (const project of projects as any[]) {
            [
                project?.slug,
                project?.sourceId,
                project?.rawIcoData?.slug,
                project?.rawIcoData?.sourceId,
            ]
                .map((value) => typeof value === 'string' ? value.trim() : '')
                .filter(Boolean)
                .forEach((slug) => {
                    if (!projectBySlug.has(slug)) {
                        projectBySlug.set(slug, project);
                    }
                });
        }

        return rounds.map((round) => {
            const projectIdsForRound = this.getRoundProjectIds(round);
            const project = projectIdsForRound
                .map((id) => projectById.get(id))
                .find(Boolean) ||
                this.getRoundProjectSlugs(round)
                    .map((slug) => projectBySlug.get(slug))
                    .find(Boolean);
            const projectRedFlagsList = this.redFlagsList(project?.redFlagsList);
            const roundRedFlagsList = this.redFlagsList(round?.redFlagsList);
            const redFlags = project
                ? this.toFiniteNumber(project.redFlags) ?? projectRedFlagsList.length
                : this.toFiniteNumber(round?.redFlags) ?? roundRedFlagsList.length;
            const fomoScore =
                this.toFiniteNumber(project?.fomoScore) ??
                this.toFiniteNumber(project?.rating) ??
                this.toFiniteNumber(round?.fomoScore) ??
                0;
            const hasToken = project
                ? hasFundingRoundToken(project, { ...round, type: round?.stage })
                : typeof round?.hasToken === 'boolean'
                    ? round.hasToken
                    : hasFundingRoundToken(null, { ...round, type: round?.stage });

            return {
                ...round,
                hasToken,
                rating: project?.rating ?? round?.rating ?? fomoScore,
                fomoScore,
                likes: this.likesCount(project?.likes ?? round?.likes),
                redFlags,
                redFlagsList: projectRedFlagsList.length
                    ? projectRedFlagsList
                    : roundRedFlagsList,
                projectSnapshot: project
                    ? {
                        _id: project._id,
                        name: project.name,
                        slug: project.slug,
                        symbol: project.symbol || project.ticker || project.niche,
                        logo: project.logo || project.image,
                        mainCategory: project.mainCategory,
                    }
                    : undefined,
            };
        });
    }

    async listRounds(params: FundingRoundsListParams): Promise<{ rounds: any[]; total: number }> {
        const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 200);
        const offset = Math.max(Number(params.offset) || 0, 0);
        const search = this.escapeRegExp(String(params.search || '').trim().slice(0, 120));
        const mode = String(params.mode || 'all');
        const query: any = {};
        const andConditions: any[] = [];

        if (search) {
            andConditions.push({ $or: [
                { projectName: { $regex: search, $options: 'i' } },
                { coinSlug: { $regex: search, $options: 'i' } },
                { coinSymbol: { $regex: search, $options: 'i' } },
                { 'investors.name': { $regex: search, $options: 'i' } },
            ] });
        }

        const categories = this.parseCsv(params.categories).filter((item) => item !== 'all');
        if (categories.length) {
            andConditions.push({
                $or: [
                    { category: { $in: categories } },
                    { tags: { $in: categories } },
                ],
            });
        }

        const fundingTypes = this.parseCsv(params.fundingType).filter((item) => item !== 'all');
        if (fundingTypes.length) {
            andConditions.push({ stage: { $in: fundingTypes } });
        }

        const fundsRaisedCondition = this.buildRangeCondition('fundsRaised', params.fundsRaised);
        if (fundsRaisedCondition) andConditions.push(fundsRaisedCondition);

        const preValuationCondition = this.buildRangeCondition('preValuation', params.preValuation);
        if (preValuationCondition) andConditions.push(preValuationCondition);

        const fundingDateCondition = this.buildFundingDateCondition(params.fundingDates);
        if (fundingDateCondition) andConditions.push(fundingDateCondition);

        const hasToken = this.parseCsv(params.hasToken);
        if (hasToken.includes('yes') && !hasToken.includes('no')) {
            andConditions.push({ hasToken: true });
        }
        if (hasToken.includes('no') && !hasToken.includes('yes')) {
            andConditions.push({
                $or: [
                    { hasToken: false },
                    { hasToken: { $exists: false } },
                ],
            });
        }

        const chain = String(params.chain || '').trim();
        if (chain) {
            const chainRegex = new RegExp(this.escapeRegExp(chain), 'i');
            andConditions.push({
                $or: [
                    { platform: chainRegex },
                    { tags: chainRegex },
                    { source: chainRegex },
                ],
            });
        }

        const investorDropstabIds = this.parseNumericCsv(params.investorDropstabIds);
        const investorSlugs = this.parseCsv(params.investorSlugs);
        const investorNames = this.parseCsv(params.investorNames);
        const investorConditions: any[] = [];

        if (investorDropstabIds.length) {
            investorConditions.push({ 'investors.id': { $in: investorDropstabIds } });
        }
        if (investorSlugs.length) {
            investorConditions.push({ 'investors.investorSlug': { $in: investorSlugs } });
        }
        if (investorNames.length) {
            investorConditions.push({
                'investors.name': {
                    $in: investorNames.map(
                        (name) => new RegExp(`^${this.escapeRegExp(name)}$`, 'i'),
                    ),
                },
            });
        }
        if (investorConditions.length) {
            andConditions.push({ $or: investorConditions });
        }

        const devStage = this.parseCsv(params.devStage);
        if (devStage.length) {
            andConditions.push({
                $or: [
                    { stage: { $in: devStage } },
                    { tags: { $in: devStage } },
                ],
            });
        }

        const companyType = this.parseCsv(params.companyType);
        if (companyType.length) {
            andConditions.push({
                $or: [
                    { category: { $in: companyType } },
                    { tags: { $in: companyType } },
                    { source: { $in: companyType } },
                ],
            });
        }

        if (params.redFlags && !this.rangeFilterIncludesZero(params.redFlags)) {
            andConditions.push({ _id: null });
        }

        if (params.fomoScore && !this.rangeFilterIncludesZero(params.fomoScore)) {
            andConditions.push({ _id: null });
        }

        if (andConditions.length) {
            query.$and = andConditions;
        }

        const sort = (() => {
            switch (mode) {
                case 'old':
                    return { date: 1 as const };
                case 'fundsRaisedAsc':
                    return { fundsRaised: 1 as const, date: -1 as const };
                case 'fundsRaisedDesc':
                case 'trending':
                case 'smart':
                    return { fundsRaised: -1 as const, date: -1 as const };
                case 'preValuationAsc':
                    return { preValuation: 1 as const, date: -1 as const };
                case 'preValuationDesc':
                    return { preValuation: -1 as const, date: -1 as const };
                case 'new':
                case 'all':
                default:
                    return { date: -1 as const };
            }
        })();
        const fomoScoreSortDirection: RoundSortDirection | null =
            mode === 'fomoScoreAsc'
                ? 1
                : mode === 'fomoScoreDesc'
                    ? -1
                    : null;

        const [rounds, total] = await Promise.all([
            fomoScoreSortDirection
                ? this.listRoundsSortedByProjectFomoScore(
                    query,
                    fomoScoreSortDirection,
                    offset,
                    limit,
                )
                : this.fundingRoundModel.find(query).sort(sort).skip(offset).limit(limit).lean(),
            this.fundingRoundModel.countDocuments(query),
        ]);

        return {
            rounds: await this.enrichRoundsWithProjects(rounds),
            total,
        };
    }

    async getProjectInvestorsFundingRounds() {
        // const projects : Array<ProjectDocument> = await this.projectModel.find({}).limit(100)
        // console.log(projects[0])
        // const rounds: Array<FundingRoundDocument> = await this.fundingRoundModel.aggregate([
        //     { $sort: { date: -1 } },
        //     {
        //         $lookup: {
        //             from: this.fundModel.collection.name,
        //             localField: 'investors.id',
        //             foreignField: 'dropstabId',
        //             as: 'fundInvestors'
        //         }
        //     },

        //     {
        //         $lookup: {
        //             from: this.personModel.collection.name,
        //             localField: 'investors.id',
        //             foreignField: 'dropstabId',
        //             as: 'personInvestors'
        //         }
        //     },

        //     {
        //         $addFields: {
        //             investors: {
        //                 $map: {
        //                     input: '$investors',
        //                     as: 'inv',
        //                     in: {
        //                         $mergeObjects: [
        //                             '$$inv',
        //                             {
        //                                 details: {
        //                                     $let: {
        //                                         vars: {
        //                                             personMatch: {
        //                                                 $arrayElemAt: [
        //                                                     {
        //                                                         $filter: {
        //                                                             input: '$personInvestors',
        //                                                             as: 'p',
        //                                                             cond: { $eq: ['$$p.dropstabId', '$$inv.id'] }
        //                                                         }
        //                                                     },
        //                                                     0
        //                                                 ]
        //                                             },
        //                                             fundMatch: {
        //                                                 $arrayElemAt: [
        //                                                     {
        //                                                         $filter: {
        //                                                             input: '$fundInvestors',
        //                                                             as: 'f',
        //                                                             cond: { $eq: ['$$f.dropstabId', '$$inv.id'] }
        //                                                         }
        //                                                     },
        //                                                     0
        //                                                 ]
        //                                             }
        //                                         },
        //                                         in: { $ifNull: ['$$personMatch', '$$fundMatch'] }
        //                                     }
        //                                 }
        //                             }
        //                         ]
        //                     }
        //                 }
        //             }
        //         }
        //     },

        //     { $project: { fundInvestors: 0, personInvestors: 0 } }
        // ]).limit(10);

        // for (let i = 0; i < rounds.length; i++) {
        //     const fundingRound = rounds[i];

        //     await this.sleep(10000)
        // }
    }

    async calculateAllFundsInvestments(): Promise<
        { fund: string; total: number }[]
    > {
        const funds = await this.fundModel.find().sort().limit(5000).lean();
        if (!funds.length) {
            this.logger.warn('Фонды не найдены');
            return [];
        }

        const results: { fund: string; total: number }[] = [];

        for (const fund of funds) {
            const total = await this.calculateFundInvestment(fund.slug);
            results.push({ fund: fund.slug, total });
            await this.sleep(200);
        }

        this.logger.log(
            `Подсчитаны инвестиции для всех фондов (${results.length})`,
        );
        return results;
    }

    async calculateAllPersonsInvestments(): Promise<
        { person: string; total: number }[]
    > {
        const persons = await this.personModel.find().lean();
        if (!persons.length) {
            this.logger.warn('Персоны не найдены');
            return [];
        }

        const results: { person: string; total: number }[] = [];

        for (const person of persons) {
            const total = await this.calculatePersonInvestment(person.slug);
            results.push({ person: person.slug, total });
            await this.sleep(200);
        }

        this.logger.log(
            `Подсчитаны инвестиции для всех персон (${results.length})`,
        );
        return results;
    }


    async calculateFundInvestment(fundSlug: string): Promise<number> {
        const fund: any = await this.fundModel.findOne({ slug: fundSlug });
        if (!fund) {
            this.logger.warn(`Фонд ${fundSlug} не найден`);
            return 0;
        }

        const portfolioCoins = fund.portfolioCoins || [];
        if (!portfolioCoins.length) {
            this.logger.log(`У фонда ${fundSlug} нет проектов`);
            return 0;
        }

        const coinSlugs = portfolioCoins.map((c: any) => c.slug);

        const fundingRounds: any[] = await this.fundingRoundModel.find({
            coinSlug: { $in: coinSlugs },
            'investors.investorSlug': fundSlug,
        }).lean();

        let total = 0;

        for (const round of fundingRounds) {
            const investors = round.investors || [];
            const isLead = investors.find(
                (inv: any) => inv.investorSlug === fundSlug && inv.lead,
            );

            if (investors.length === 1) {
                total += round.fundsRaised;
            } else if (isLead) {
                total += round.fundsRaised * 0.5;
            } else {
                total += round.fundsRaised / investors.length;
            }
        }

        fund.investAmount = total;
        if (!!fund.roundsByCategory?.length) {
            fund.industryFocus = fund.roundsByCategory.find((item: any) => item.name !== 'Other')
            fund.categories = fund.roundsByCategory.map((item: any) => item.name)
        }

        await fund.save();

        this.logger.log(
            `Investment amount фонда ${fundSlug}: $${total.toLocaleString()}`,
        );

        return total;
    }

    async calculatePersonInvestment(personSlug: string): Promise<number> {
        const person: any = await this.personModel.findOne({ slug: personSlug });
        if (!person) {
            this.logger.warn(`Персона ${personSlug} не найдена`);
            return 0;
        }

        const portfolioCoins = person.portfolioCoins || [];
        if (!portfolioCoins.length) {
            this.logger.log(`У персоны ${personSlug} нет проектов`);
            await this.personModel.updateOne({ slug: personSlug }, { $set: { investAmount: 0 } });
            return 0;
        }

        const coinSlugs = portfolioCoins.map((c: any) => c.slug);

        const fundingRounds: any[] = await this.fundingRoundModel.find({
            coinSlug: { $in: coinSlugs },
            'investors.investorSlug': personSlug,
        }).lean();

        let total = 0;

        for (const round of fundingRounds) {
            const investors = round.investors || [];
            const isLead = investors.find(
                (inv: any) => inv.investorSlug === personSlug && inv.lead,
            );

            if (investors.length === 1) {
                total += round.fundsRaised;
            } else if (isLead) {
                total += round.fundsRaised * 0.5;
            } else {
                total += round.fundsRaised / investors.length;
            }
        }

        person.investAmount = total;
        await person.save();

        this.logger.log(
            `Investment amount персоны ${personSlug}: $${total.toLocaleString()}`,
        );

        return total;
    }

    async upsertProjectsBulk(apiDataArray: any[]) {
        const bulkOps = apiDataArray.map(apiData => ({
            updateOne: {
                filter: { slug: apiData.slug },
                update: {
                    $set: {
                        name: apiData.name,
                        type: apiData.category,
                        logo: apiData.image,
                        totalRaised: apiData.fundsRaised,
                        tags: apiData.allTags.map((t: any) => t.displayName),
                        mainCategory: apiData.mainTag,
                        descriptionText: apiData.description,
                        twitterData: apiData.tweetscout,
                        investors: apiData.investors.map((i: any) => new Types.ObjectId(i.id)),
                        rank: apiData.rank || 0,
                    },
                },
                upsert: true,
            },
        }));

        const result = await this.projectModel.bulkWrite(bulkOps);
        return result;
    }

    async upsertFundingRoundsBulk(apiDataArray: any[]) {
        const validData = apiDataArray.filter((apiData) =>
            this.hasRequiredRoundFields({
                image: apiData.image,
                category: apiData.category,
                stage: apiData.stage,
            }),
        );

        const bulkOps = validData.map(apiData => ({
            updateOne: {
                filter: { id: apiData.saleId },
                update: {
                    $set: {
                        id: apiData.saleId,
                        coinSlug: apiData.slug,
                        coinSymbol: apiData.symbol || '',
                        fundsRaised: apiData.fundsRaised,
                        preValuation: apiData.preValuation,
                        preValuationInaccurate: apiData.preValuationInaccurate,
                        stage: apiData.stage,
                        category: apiData.category,
                        date: new Date(apiData.announceDate),
                        investors: apiData.investors.map((i: any) => ({
                            id: i.id,
                            name: i.name,
                            investorSlug: i.slug,
                            ventureType: i.type || '',
                            tier: i.tier || '',
                            lead: apiData.leadInvestors.some((li: any) => li.id === i.id),
                            image: i.image || '',
                        })),
                        leadInvestors: apiData.leadInvestors.map((i: any) => ({
                            id: i.id,
                            name: i.name,
                            investorSlug: i.slug,
                            ventureType: i.type || '',
                            tier: i.tier || '',
                            lead: true,
                            image: i.image || '',
                        })),
                        tags: apiData.allTags.map((t: any) => t.displayName),
                        image: apiData.image,
                        saleId: apiData.saleId,
                        hasToken: hasFundingRoundToken(apiData, {
                            type: apiData.stage,
                            stage: apiData.stage,
                        }),
                    },
                },
                upsert: true,
            },
        }));

        if (!bulkOps.length) {
            return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
        }

        const result = await this.fundingRoundModel.bulkWrite(bulkOps);
        return result;
    }

    public async fetchAndSaveAllFundingRounds(): Promise<void> {
        try {
            const coins = await this.fetchAllCoins();
            this.logger.log(`Found ${coins.length} coins to process`);

            for (const [index, coin] of coins.entries()) {
                try {
                    this.logger.log(
                        `Processing coin ${index + 1}/${coins.length}: ${coin.slug} (${coin.symbol})`,
                    );
                    await this.fetchAndSaveFundingRoundsForCoin(coin.slug);

                    await this.sleep(1000);
                } catch (error) {
                    this.logger.error(
                        `Error processing coin ${coin.slug}: ${error.message}`,
                    );
                }
            }

            this.logger.log('Finished processing all coins');
        } catch (error) {
            this.logger.error(`Failed to fetch/save all funding rounds: ${error.message}`);
            throw error;
        }
    }

    public async fetchAndSaveFundingRoundsForCoin(coinSlug: string): Promise<FundingRound[]> {
        try {
            const url = `${this.API_BASE_URL}/fundingRounds/coin/${coinSlug}`;
            const headers = this.getHeaders();

            this.logger.log(`Fetching funding rounds for coin: ${coinSlug}`);
            const response = await this.safeRequest(url, {}, headers);

            if (!response || !response.data) {
                this.logger.warn(`No data received for coin: ${coinSlug}`);
                return [];
            }

            const fundingRoundsData = response.data;
            const savedRounds: FundingRound[] = [];

            for (const roundData of fundingRoundsData) {
                try {
                    const transformedRound = this.transformRoundData(roundData, coinSlug);
                    if (!transformedRound) {
                        continue;
                    }

                    const savedRound: any = await this.fundingRoundModel.findOneAndUpdate(
                        { id: transformedRound.id },
                        transformedRound,
                        { upsert: true, new: true },
                    );

                    savedRounds.push(savedRound);
                    this.logger.log(`Saved funding round ${transformedRound.id} for ${coinSlug}`);
                } catch (error) {
                    this.logger.error(`Error processing round for ${coinSlug}: ${error.message}`);
                }
            }

            return savedRounds;
        } catch (error) {
            this.logger.error(`Failed to fetch/save funding rounds for ${coinSlug}: ${error.message}`);
            throw error;
        }
    }

    private transformRoundData(roundData: any, coinSlug: string): Partial<FundingRound> | null {
        const transformedRound: Partial<FundingRound> = {
            id: roundData.id,
            coinSlug: coinSlug,
            coinSymbol: roundData.coinSymbol || '',
            fundsRaised: roundData.fundsRaised || 0,
            preValuation: roundData.preValuation || 0,
            preValuationInaccurate: roundData.preValuationInaccurate || false,
            stage: roundData.stage || '',
            investors: roundData.investors?.map(investor => ({
                id: investor.id,
                name: investor.name || '',
                investorSlug: investor.investorSlug || '',
                ventureType: investor.ventureType || '',
                tier: investor.tier || '',
                lead: investor.lead || false,
            })) || [],
            twitterPerformance: roundData.twitterPerformance || 0,
            category: roundData.category || '',
            date: roundData.date,
            tokenForSale: roundData.tokenForSale || null,
            tokenPrice: roundData.tokenPrice || null,
            totalSupplyPercent: roundData.totalSupplyPercent || 0,
            platform: roundData.platform || null,
            roiUsd: roundData.roiUsd || null,
            distributionType: roundData.distributionType || null,
            details: roundData.details?.map(detail => ({
                title: detail.title || '',
                url: detail.url || '',
            })) || [],
            image: roundData.image || '',
            saleId: roundData.saleId || roundData.id,
            hasToken: hasFundingRoundToken(roundData, {
                type: roundData.stage,
                stage: roundData.stage,
            }),
        };

        if (
            !this.hasRequiredRoundFields({
                image: (roundData as any)?.image,
                category: transformedRound.category,
                stage: transformedRound.stage,
            })
        ) {
            return null;
        }

        return transformedRound;
    }
}
