import { BadRequestException, HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Trading, TradingDocument, TradingStatsData } from './models/trading.model';
import axios from 'axios'
import { TwitterService } from 'src/twitter/twitter.service';
import { SocialParcingService } from 'src/social-parcing/social-pacing.service';
import { IKeywordTweet, TwitterKeywords, TwitterKeywordsDocument } from 'src/social-parcing/models/twitter-keywords.model';
import { TwitterAcc, TwitterAccDocument } from 'src/social-parcing/models/twitter-acc.model';
import { CreateTradingDto } from './dto/create-dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProjectsService } from 'src/projects/projects.service';
import { Project, ProjectDocument } from 'src/projects/project.model';
import { TwitterAccsParcingService } from 'src/social-parcing/twitter-accs-parcing.service';
import { TwitterPerson, TwitterPersonDocument } from 'src/social-parcing/models/twitter-person.model';

@Injectable()
export class TradingService {
    API = 'http://127.0.0.1:8050'
    constructor(
        @InjectModel(Trading.name) private tradingModel: Model<TradingDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(TwitterPerson.name) private twitterPerson: Model<TwitterPersonDocument>,
        private readonly parserService: TwitterService,
        private readonly socialParcingService: SocialParcingService,
        private readonly twitterAccsParcingService: TwitterAccsParcingService,
    ) {
        // this.updateTopTokens()
        // this.getTradingData()
        // this.updateTradingTokensForAllPrivate()
    }
    private async fetchProjectData(symbol: string) {
        try {
            const headers = {
                "X-CMC_PRO_API_KEY": process.env.COINMARKET_KEY,
            };

            const response = await axios.get(
                "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
                {
                    params: {
                        symbol: symbol.toUpperCase(), // тикер токена
                        convert: "USD",
                    },
                    headers,
                }
            );

            const data = response.data.data[symbol.toUpperCase()];
            if (!data) throw new Error(`CoinMarketCap: нет данных для ${symbol}`);

            return {
                price: data.quote.USD.price,
                percentChange1h: data.quote.USD.percent_change_1h ?? 0,
                percentChange24h: data.quote.USD.percent_change_24h ?? 0,
                volume24h: data.quote.USD.volume_24h ?? 0,
                marketCap: data.quote.USD.market_cap ?? 0,
                circulatingSupply: data.circulating_supply ?? 0,
                maxSupply: data.max_supply ?? 0,
            };
        } catch (err: any) {
            console.error(`Ошибка при получении данных CMC для ${symbol}:`, err.message);
            return null;
        }
    }


    private async getTradingData() {
        // await this.tradingModel.deleteMany()
        // console.log(JSON.stringify((await this.tradingModel.find({})).slice(0, 2)))
    }

    private prepareNeuralNetworkData(token: ProjectDocument | any, twitterPosts: any[]): any {
        const safeNumber = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined) return defaultValue;
            const num = Number(value);
            return isNaN(num) ? defaultValue : num;
        };

        const aggregateTwitter = (posts: any[]): number[] => {
            if (!posts || !posts.length) return [0, 0, 0, 0, 0, 0];

            try {
                const weights: number[] = [];
                const sentiments: number[] = [];
                const likes: number[] = [];
                const comments: number[] = [];
                const views: number[] = [];

                for (const p of posts) {
                    try {
                        const friendsCount = safeNumber(p.friends_count);
                        const statusesCount = safeNumber(p.statuses_count);
                        const favouritesCount = safeNumber(p.favourites_count);
                        const retweetCount = safeNumber(p.retweet_count);
                        const postViews = safeNumber(p.views);

                        const authorWeight = (friendsCount + statusesCount) / 1000;
                        const verifiedWeight = p.is_blue_verified ? 2 : 1;
                        const postWeight = (favouritesCount + friendsCount + postViews) * verifiedWeight;

                        weights.push(postWeight + authorWeight);

                        const sentimentScore = p.mood?.score !== undefined
                            ? safeNumber(p.mood.score, 0.5)
                            : 0.5;
                        sentiments.push(sentimentScore);

                        likes.push(favouritesCount);
                        comments.push(retweetCount);
                        views.push(postViews);
                    } catch (postError) {
                        console.warn('Error processing twitter post:', postError);
                        continue;
                    }
                }

                if (weights.length === 0) return [0, 0, 0, 0, 0, 0];

                const totalWeight = weights.reduce((sum, w) => sum + w, 0);
                const weightedSentiment = totalWeight > 0
                    ? sentiments.reduce((sum, s, i) => sum + s * weights[i], 0) / totalWeight
                    : 0.5;

                const avg = (arr: number[]) => arr.length > 0
                    ? arr.reduce((a, b) => a + b, 0) / arr.length
                    : 0;

                const positiveSentimentRatio = sentiments.length > 0
                    ? sentiments.filter(s => s > 0.5).length / sentiments.length
                    : 0;

                return [
                    weightedSentiment,
                    posts.length,
                    avg(likes),
                    avg(comments),
                    avg(views),
                    positiveSentimentRatio
                ];
            } catch (error) {
                console.error('Error in aggregateTwitter:', error);
                return [0, 0, 0, 0, 0, 0];
            }
        };

        try {
            const twitterFeatures = aggregateTwitter(twitterPosts || []);

            const quotes = token?.quotes?.[0] || token?.usdQuote?.USD || {};
            const percentChange1h = safeNumber(quotes.percentChange1h || quotes.percent_change_1h);
            const percentChange24h = safeNumber(quotes.percentChange24h || quotes.percent_change_24h);
            const volume24h = safeNumber(quotes.volume24h || token.volume_24h);

            return {
                sentiment_token: twitterFeatures[0],
                posts_token: twitterFeatures[1],
                likes_token: twitterFeatures[2],
                comments_token: twitterFeatures[3],
                pct_change_1h: percentChange1h,
                pct_change_24h: percentChange24h,
                volume_24h: volume24h,
                price_up: percentChange1h > 0 ? 1 : 0,
                price_vs_support: this.calculatePriceVsSupport(token),
                recent_candle: this.calculateRecentCandlePattern(token),
                twitter_posts: (twitterPosts || []).map((item: any) => {
                    try {
                        return {
                            id: item.id || '',
                            createdAt: item.createdAt || new Date().toISOString(),
                            statuses_count: safeNumber(item.statuses_count),
                            media_count: safeNumber(item.media_count),
                            friends_count: safeNumber(item.friends_count),
                            favourites_count: safeNumber(item.favourites_count),
                            listed_count: safeNumber(item.listed_count),
                            views: safeNumber(item.views),
                            sentiment: safeNumber(item.mood?.score),
                            comments: 0,
                            mood: {
                                label: item.mood?.label || 'Neutral',
                                score: safeNumber(item.mood?.score, 0.5)
                            }
                        };
                    } catch (itemError) {
                        console.warn('Error processing twitter post item:', itemError);
                        return null;
                    }
                }).filter((item): item is NonNullable<typeof item> => item !== null)
            };
        } catch (error) {
            console.error('Error in prepareNeuralNetworkData:', error);
            return {
                sentiment_token: 0.5,
                posts_token: 0,
                likes_token: 0,
                comments_token: 0,
                pct_change_1h: 0,
                pct_change_24h: 0,
                volume_24h: 0,
                price_up: false,
                price_vs_support: 0,
                recent_candle: 0,
                twitter_posts: []
            };
        }
    }

    private async sendToNeuralNetwork(data: any): Promise<{ predicted_change_pct: number }> {
        try {
            const response = await axios.post(`${this.API}/predict`, data, {
                timeout: 20000
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка при запросе к нейросети:', error);
            return { predicted_change_pct: Math.random() };
        }
    }

    private calculatePriceVsSupport(token: any): number {
        return 1.0;
    }

    private calculateRecentCandlePattern(token: any): number {
        return 0.5;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // @Cron(CronExpression.EVERY_30_MINUTES)
    async updateTopTokens(): Promise<{ status: string; count: number }> {
        try {
            const url = 'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing';
            const params = {
                start: 1,
                limit: 5,
                sortBy: 'gainer_loser_1h',
                sortType: 'desc',
                convert: 'USD,BTC,ETH',
                cryptoType: 'all',
                tagType: 'all',
                audited: false,
                aux: 'ath,atl,high24h,low24h,num_market_pairs,cmc_rank,date_added,max_supply,circulating_supply,total_supply,volume_7d,volume_30d,self_reported_circulating_supply,self_reported_market_cap'
            };

            const response = await axios.get(url, { params });
            const tokens = response.data.data.cryptoCurrencyList;

            for (const token of tokens) {
                const keywordEntity: TwitterKeywordsDocument = await this.socialParcingService.addTwitterKeywords({
                    userId: '',
                    keywords: `@${token.slug}`,
                    isSentiment: true,
                    isPrivate: true
                });

                const { predicted_change_pct } = await this.sendToNeuralNetwork(this.prepareNeuralNetworkData(token, keywordEntity.tweets))

                const nnPrediction = { probabilityUp: predicted_change_pct, date: new Date() };
                const quote: any = token.quotes.find((item: any) => item.name === 'USD');

                const tradingData: TradingStatsData = {
                    symbol: token.symbol,
                    priceUSD: quote.price,
                    percentChange1h: quote.percentChange1h,
                    percentChange24h: quote.percentChange24h,
                    volume24h: quote.volume24h,
                    circulatingSupply: token.circulatingSupply,
                    maxSupply: token.maxSupply,
                    marketCap: quote.marketCap,
                    auditInfo: token.auditInfo || null,
                    neuralNetworkPrediction: nnPrediction,
                    mood: keywordEntity.mood,
                    otherSources: {},
                    twitterAccs: [],
                    keywords: [keywordEntity._id],
                    timestamp: new Date()
                };

                const updateFields: any = {
                    $push: { data: tradingData },
                    $set: {
                        currentData: tradingData,
                        name: token.name,
                        mood: keywordEntity.mood,
                        logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${token.id}.png`,
                    }
                };

                await this.tradingModel.findOneAndUpdate(
                    { coinId: token.id },
                    updateFields,
                    { upsert: true, new: true }
                );
            }

            console.log(`Обновлено ${tokens.length} токенов`);
            return { status: 'ok', count: tokens.length };
        } catch (err) {
            console.error('Ошибка при обновлении топ токенов', err);
            return { status: 'error', count: 0 };
        }
    }

    async createTradingByUser(userId: string | null, tradingInput: { projectId: string, twitterAccs: string[], keywords: string[] }): Promise<Trading> {
        try {
            const project: ProjectDocument = await this.projectModel.findById(tradingInput.projectId)

            if (!project) throw new HttpException('Project not founded', HttpStatus.BAD_REQUEST)

            const { mood, tweets } = await this.socialParcingService.getKeywords(userId, { ids: tradingInput.keywords || [], offset: 0, limit: 20 })

            const twitterAccIds = (tradingInput.twitterAccs || []).map(item => new Types.ObjectId(item));

            const accsData = await this.twitterAccsParcingService.getPrivateTweets(userId, {}, twitterAccIds)

            const accTweets = []

            for (let i = 0; i < accsData.length; i++) {
                const acc = accsData[i];

                accTweets.push(acc.tweets)
            }

            const neuralData: any = this.prepareNeuralNetworkData(project, tweets.map((item: any) => item.tweet))

            const data = await this.sendToNeuralNetwork(neuralData)

            const nnPrediction = { probabilityUp: data.predicted_change_pct, date: new Date() };

            const tradingData: TradingStatsData = {
                symbol: project.symbol,
                priceUSD: project.price,
                percentChange1h: project.usdQuote.percent_change_1h,
                percentChange24h: project.usdQuote.percent_change_24h,
                volume24h: project.volume24h,
                circulatingSupply: project.circulatingSupply,
                maxSupply: project.maxSupply,
                marketCap: project.marketCap,
                auditInfo: null,
                mood: mood,
                otherSources: {},
                neuralNetworkPrediction: nnPrediction,
                twitterAccs: twitterAccIds,
                keywords: tradingInput.keywords.map((item: string) => new mongoose.Types.ObjectId(item)),
                timestamp: new Date(),
            };

            const existing = await this.tradingModel.findOne({ projectId: new mongoose.Types.ObjectId(tradingInput.projectId) });

            if (existing) {
                existing.data.push(tradingData);
                existing.currentData = tradingData;
                return await existing.save();
            } else {
                const newTrading = new this.tradingModel({
                    projectId: new mongoose.Types.ObjectId(tradingInput.projectId),
                    name: project.name,
                    logo: project.logo,
                    data: [tradingData],
                    currentData: tradingData,
                    isPrivate: true,
                    userId: userId ? new Types.ObjectId(userId) : null,
                    mood: mood
                });
                return await newTrading.save();
            }
        } catch (error) {
            console.error('Ошибка при создании Trading пользователем:', error);
            throw new BadRequestException('Не удалось создать Trading');
        }
    }

    async getPrivateTradings(userId: string): Promise<Trading[]> {
        return this.tradingModel.find({ userId: new Types.ObjectId(userId), isPrivate: true }).sort({ createdAt: -1 });
    }

    async getPublicTradings(): Promise<Trading[]> {
        return this.tradingModel.find({ isPrivate: false }).sort({ 'currentData.timestamp': -1 }).limit(5);
    }

    // @Cron(CronExpression.EVERY_5_MINUTES)
    async updateTradingTokensForAllPrivate(): Promise<Trading[]> {
        try {
            const tradings = await this.tradingModel.find({ isPrivate: true });

            if (!tradings.length) {
                throw new HttpException('No private tradings found', HttpStatus.NOT_FOUND);
            }

            const updatedTradings: Trading[] = [];

            for (const trading of tradings) {
                const { twitterAccs = [], keywords = [] } = trading.currentData || {};

                const project: Project = await this.projectModel.findById(trading.projectId);
                if (!project) continue;

                const liveData = await this.fetchProjectData(project.symbol);
                if (!liveData) continue;

                // 🔹 обновляем твиттер-аккаунты
                const twitterAccUpdates = await Promise.all(
                    twitterAccs.map(async (accId) => {
                        try {
                            const twitterAcc = await this.twitterPerson.findById(accId);
                            if (!twitterAcc) {
                                console.warn(`TwitterAcc ${accId} не найден, пропускаем`);
                                return null;
                            }

                            return await this.socialParcingService.updateTwitterAccByUser({
                                id: twitterAcc._id.toString(),
                                username: twitterAcc.username,
                                isSentiment: true,
                                isPrivate: true,
                                userId: trading.userId?.toString() || null,
                            });
                        } catch (err) {
                            console.error(`Ошибка при обновлении twitterAcc ${accId}:`, err.message);
                            return null;
                        }
                    }),
                );

                const twitterAccIds = twitterAccUpdates.filter(Boolean).map((acc: any) => acc._id);

                // 🔹 обновляем твиты по ключевым словам
                await this.socialParcingService.updateKeywordsTweets(keywords);
                const { tweets, mood } = await this.socialParcingService.analyzeKeywordTweetMood(keywords);

                // 🔹 прогноз нейросети
                const neuralData = this.prepareNeuralNetworkData(project, tweets);
                const nnResult = await this.sendToNeuralNetwork(neuralData);

                const nnPrediction = {
                    probabilityUp: nnResult.predicted_change_pct,
                    date: new Date(),
                };

                // 🔹 данные рынка
                const actualPrice = liveData.price;
                const percentChange1h = liveData.percentChange1h;
                const percentChange24h = liveData.percentChange24h;
                const volume24h = liveData.volume24h;
                const marketCap = liveData.marketCap;
                const circulatingSupply = liveData.circulatingSupply;
                const maxSupply = liveData.maxSupply;

                const prevPrice = trading.currentData?.priceUSD || actualPrice;
                const predictedPrice = actualPrice * (1 + nnResult.predicted_change_pct / 100);
                const realChangePct = ((actualPrice - prevPrice) / prevPrice) * 100;
                const predictedVsActualPct = ((actualPrice - predictedPrice) / predictedPrice) * 100;

                trading.nnHistory.push({
                    predictedPrice,
                    actualPrice,
                    realChangePct,
                    predictedVsActualPct,
                    date: new Date(),
                });

                const tradingData: TradingStatsData = {
                    symbol: project.symbol,
                    priceUSD: actualPrice,
                    percentChange1h,
                    percentChange24h,
                    volume24h,
                    circulatingSupply,
                    maxSupply,
                    marketCap,
                    auditInfo: null,
                    mood,
                    otherSources: {},
                    neuralNetworkPrediction: nnPrediction,
                    twitterAccs: twitterAccIds,
                    keywords,
                    timestamp: new Date(),
                };

                trading.currentData = tradingData;
                trading.data.push(tradingData);

                trading.markModified('nnHistory');
                trading.markModified('currentData');
                trading.markModified('data');

                updatedTradings.push(await trading.save());

                await this.sleep(3000);
            }

            return updatedTradings;
        } catch (error) {
            console.error('Ошибка при массовом обновлении токенов Trading:', error);
            throw new BadRequestException('Не удалось обновить Trading токены');
        }
    }


}
