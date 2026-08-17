import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    Optional,
    UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Comment, CommentDocument } from './models/comment.model';
import { User, UserDocument } from 'src/user/user.model';
import { Message, MessageDocument } from 'src/message/models/message.model';
import commentDto from './dto/comment.dto';
import { ActivityService } from '../activity/activity.service';
import { FilesService } from 'src/files/files.service';
import { UserActionLogsService } from 'src/user-action-logs/user-action-logs.service';
import { FomoAiGateway } from 'src/entitlements/ai/fomo-ai-gateway.service';
import { SocialNotificationsService } from 'src/notifications/social-notifications.service';

type TopicSort = 'newest' | 'oldest' | 'top';

type TopicListQuery = {
    page: number;
    limit: number;
    search?: string;
    sort: TopicSort;
    filter?: string;
    category?: string;
    fromDate?: Date;
    toDate?: Date;
};

type TopicContributor = {
    name: string;
    username: string;
    avatar: string;
    badge: string;
    xp: number;
    upvotes: number;
    comments: number;
    engagement: string;
};

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(Comment.name) private readonly CommentModel: Model<CommentDocument>,
        @InjectModel(User.name) private readonly UserModel: Model<UserDocument>,
        @InjectModel(Message.name) private readonly MessageModel: Model<MessageDocument>,
        private readonly activityService: ActivityService,
        private readonly filesService: FilesService,
        private readonly userActionLogsService: UserActionLogsService,
        private readonly aiGateway: FomoAiGateway,
        @Optional() private readonly notifications?: SocialNotificationsService,
    ) { }

    async getReportedComments(): Promise<Array<commentDto>> {
        const comments = await this.CommentModel.aggregate([
            {
                $match: {
                    reports: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: this.UserModel.collection.name,
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                },
            },
            {
                $addFields: {
                    reportsCount: {
                        $cond: {
                            if: { $isArray: '$reports' },
                            then: { $size: '$reports' },
                            else: 0
                        }
                    }
                }
            },
            {
                $match: {
                    reportsCount: { $gt: 0 }
                }
            },
            {
                $sort: { reportsCount: -1 }
            },
            {
                $limit: 20
            }
        ]);

        return comments;
    }

    async getAllReportedContent(): Promise<any> {
        const comments = await this.CommentModel.aggregate([
            {
                $match: {
                    reports: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: this.UserModel.collection.name,
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                },
            },
            {
                $addFields: {
                    reportsCount: {
                        $cond: {
                            if: { $isArray: '$reports' },
                            then: { $size: '$reports' },
                            else: 0
                        }
                    },
                    contentType: 'comment'
                }
            },
            {
                $match: {
                    reportsCount: { $gt: 0 }
                }
            },
            {
                $project: {
                    _id: 1,
                    text: 1,
                    date: 1,
                    author: { $arrayElemAt: ['$author', 0] },
                    reportsCount: 1,
                    contentType: 1,
                    page: 1,
                    isTopic: 1,
                    topicName: 1,
                    topicKey: 1,
                    audience: 1,
                    moderationStatus: 1,
                    reportDetails: 1
                }
            }
        ]);

        const messages = await this.MessageModel.aggregate([
            {
                $match: {
                    reports: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: this.UserModel.collection.name,
                    localField: 'from',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $lookup: {
                    from: this.UserModel.collection.name,
                    localField: 'to',
                    foreignField: '_id',
                    as: 'recipient'
                }
            },
            {
                $addFields: {
                    reportsCount: {
                        $cond: {
                            if: { $isArray: '$reports' },
                            then: { $size: '$reports' },
                            else: 0
                        }
                    },
                    contentType: 'message'
                }
            },
            {
                $match: {
                    reportsCount: { $gt: 0 }
                }
            },
            {
                $project: {
                    _id: 1,
                    text: '$message',
                    date: 1,
                    author: { $arrayElemAt: ['$sender', 0] },
                    recipient: { $arrayElemAt: ['$recipient', 0] },
                    reportsCount: 1,
                    contentType: 1,
                    chatId: 1,
                    attachments: 1
                }
            }
        ]);

        const allReported = [...comments, ...messages].sort((a, b) => b.reportsCount - a.reportsCount);

        return {
            total: allReported.length,
            comments: comments.length,
            messages: messages.length,
            data: allReported.slice(0, 50)
        };
    }

    async getAllComments(page: string, userId?: string, isTopic?: boolean): Promise<Array<any>> {
        const matchStage: Record<string, any> = {};

        if (isTopic) matchStage.isTopic = true;
        if (page) matchStage.page = page;
        if (userId) matchStage.author = new mongoose.Types.ObjectId(userId);

        const comments = await this.CommentModel.find(matchStage)
            .sort({ date: -1 })
            .lean();

        return this.attachAuthorsAndCounts(comments, false);
    }

    async getTopicComments(query: Record<string, string | undefined> = {}, viewerId?: string): Promise<{
        items: Array<any>;
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }> {
        const options = this.parseTopicListQuery(query);
        const following = await this.getViewerFollowing(viewerId);
        const matchStage = this.buildTopicListMatchStage(options, viewerId, following);
        const total = await this.CommentModel.countDocuments(matchStage);
        const sortStage = this.getTopicSortStage(options.sort);
        const skip = (options.page - 1) * options.limit;

        const topics = await this.CommentModel.find(matchStage)
            .sort(sortStage)
            .skip(skip)
            .limit(options.limit)
            .lean();

        const descendantMap = await this.loadDescendantMap(
            topics.flatMap((topic) => (topic.answers || []).map((answerId: any) => answerId.toString()))
        );
        const authorMap = await this.loadAuthorMap(topics.map((topic) => topic.author));

        const items = topics.map((topic) => {
            const rootId = topic._id.toString();
            const replyCount = this.countDescendants(topic.answers || [], descendantMap);

            return this.serializeCommentNode(
                topic,
                authorMap,
                descendantMap,
                false,
                1,
                rootId,
                replyCount,
            );
        });

        return {
            items,
            total,
            page: options.page,
            limit: options.limit,
            hasMore: skip + items.length < total,
        };
    }

    async getTopicDetail(topicId: string, viewerId?: string): Promise<any> {
        const topic = await this.findTopicById(topicId);
        if ((topic as any).moderationStatus === "REMOVED") {
            throw new HttpException("Topic not found", HttpStatus.NOT_FOUND);
        }
        await this.assertAudienceAccess(topic, viewerId);
        const descendantMap = await this.loadDescendantMap(
            (topic.answers || []).map((answerId: any) => answerId.toString())
        );
        const authorIds = [
            topic.author,
            ...Array.from(descendantMap.values()).map((comment) => comment.author),
        ];
        const authorMap = await this.loadAuthorMap(authorIds);
        const replyCount = this.countDescendants(topic.answers || [], descendantMap);
        const serializedTopic = this.serializeCommentNode(
            topic,
            authorMap,
            descendantMap,
            true,
            20,
            topic._id.toString(),
            replyCount,
        );

        const heuristic = this.buildTopicInsights(serializedTopic);
        const stored: any = (topic as any).aiSummary || null;
        let aiSummary = stored;
        if (stored && stored.status === "READY") {
            const flattened = this.flattenReplies(serializedTopic.answersList || []);
            const curContent = this.hashString(`${serializedTopic.topicName}|${serializedTopic.text}`);
            const isStale = stored.contentVersion !== curContent || stored.commentsVersion !== flattened.length;
            aiSummary = { ...stored, status: isStale ? "STALE" : "READY" };
        }

        // Overlay the real (LLM) summary text onto the UI insights shape when available.
        const insights = aiSummary && aiSummary.status && aiSummary.status !== "FAILED" && aiSummary.overview
            ? {
                ...heuristic,
                overview: aiSummary.overview,
                takeaways: (aiSummary.keyTakeaways && aiSummary.keyTakeaways.length) ? aiSummary.keyTakeaways : heuristic.takeaways,
                pulse: aiSummary.communityPulse ? [aiSummary.communityPulse, ...(Array.isArray(heuristic.pulse) ? heuristic.pulse : [])] : heuristic.pulse,
                aiGenerated: true,
              }
            : { ...heuristic, aiGenerated: false };

        // Whether FOMO AI is actively participating in this discussion:
        // either the admin has auto-replies enabled, or the AI has already posted.
        let aiParticipating = false;
        try {
            const flat = this.flattenReplies(serializedTopic.answersList || []);
            const hasAiReply = flat.some((c: any) => c.authorType === "SYSTEM_AI");
            const settings: any = await this.getBuzzAiSettings().catch(() => null);
            aiParticipating = Boolean(hasAiReply || settings?.autoReplyEnabled);
        } catch {
            aiParticipating = false;
        }

        return {
            topic: serializedTopic,
            insights,
            aiParticipating,
            aiSummary: aiSummary
                ? { status: aiSummary.status, provider: aiSummary.provider, model: aiSummary.model, generatedAt: aiSummary.generatedAt }
                : { status: "NONE" },
        };
    }

    async getComments(commentsId: Array<mongoose.Types.ObjectId>): Promise<Array<any>> {
        const comments = await this.CommentModel.find({
            _id: { $in: commentsId }
        }).sort({ date: -1 }).lean();

        return this.attachAuthorsAndCounts(comments, false);
    }

    async createComment(comment: commentDto): Promise<any> {
        const payload = await this.prepareCommentPayload(comment);

        if (payload.isTopic && !payload.topicName) {
            throw new UnprocessableEntityException('Topic name is required');
        }

        const createdComment = await this.CommentModel.create(payload);

        await this.activityService.createActivity({
            title: '',
            text: payload.text,
            type: 'comments',
            createdAt: new Date(),
            userId: new mongoose.Types.ObjectId(payload.author),
            link: `${payload.path || payload.page || ''}`
        });

        await this.userActionLogsService.log({
            userId: payload.author,
            actorId: payload.author,
            actorType: 'user',
            category: 'comments',
            action: payload.isTopic ? 'comments.topic_created' : 'comments.comment_created',
            title: payload.isTopic ? 'Topic created' : 'Comment created',
            entityType: 'comment',
            entityId: createdComment._id,
            metadata: {
                page: payload.page,
                path: payload.path,
                topicName: payload.topicName,
                topicKey: payload.topicKey,
                categoryKey: payload.categoryKey,
                isTopic: payload.isTopic,
            },
        });

        return this.getCommentByIdWithAuthor(createdComment._id.toString());
    }

    async removeComment(id: string, userId?: string, isAdmin?: boolean): Promise<CommentDocument> {
        if (userId && !isAdmin) {
            const removed = await this.CommentModel.findOneAndDelete({
                _id: new mongoose.Types.ObjectId(id),
                author: new mongoose.Types.ObjectId(userId)
            });

            if (removed) {
                await this.userActionLogsService.log({
                    userId,
                    actorId: userId,
                    actorType: 'user',
                    category: 'comments',
                    action: 'comments.comment_removed',
                    title: 'Comment removed',
                    entityType: 'comment',
                    entityId: removed._id,
                    metadata: {
                        page: removed.page,
                        path: removed.path,
                        isTopic: removed.isTopic,
                    },
                });
            }

            return removed;
        }

        const removed = await this.CommentModel.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) });

        if (removed) {
            await this.userActionLogsService.log({
                userId: removed.author,
                actorId: userId,
                actorType: isAdmin ? 'admin' : 'user',
                category: 'comments',
                action: 'comments.comment_removed',
                title: isAdmin ? 'Comment removed by staff' : 'Comment removed',
                entityType: 'comment',
                entityId: removed._id,
                metadata: {
                    page: removed.page,
                    path: removed.path,
                    isTopic: removed.isTopic,
                },
            });
        }

        return removed;
    }

    async addLike(commentId: string, userId: string): Promise<any> {
        const id = new mongoose.Types.ObjectId(userId);
        const comment = await this.CommentModel.findById(commentId);

        if (!comment) {
            throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
        }

        comment.likes = comment.likes || [];
        comment.dislikes = comment.dislikes || [];

        if (comment.dislikes.some((dislike) => dislike.toString() === userId)) {
            comment.dislikes = comment.dislikes.filter((dislike) => dislike.toString() !== userId);
        }

        if (comment.likes.some((like) => like.toString() === userId)) {
            comment.likes = comment.likes.filter((like) => like.toString() !== userId);
        } else {
            comment.likes.push(id);
            // Notify the content owner about the like (self-likes are ignored).
            void this.notifications?.emit({
                recipient: String((comment as any).author),
                actor: userId,
                type: "LIKE",
                topicId: (comment as any).isTopic ? comment._id : null,
                commentId: (comment as any).isTopic ? null : comment._id,
                preview: (comment as any).topicName || (comment as any).text || "",
            });
        }

        await comment.save();

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'comments',
            action: 'comments.like_toggled',
            title: 'Comment like toggled',
            entityType: 'comment',
            entityId: comment._id,
            metadata: {
                page: comment.page,
                path: comment.path,
            },
        });

        return this.getCommentByIdWithAuthor(commentId);
    }

    // Toggle a repost on a topic. Reposts feed the Fomies "FOMO" block.
    async toggleRepost(topicId: string, userId: string): Promise<any> {
        const id = new mongoose.Types.ObjectId(userId);
        const comment = await this.CommentModel.findById(topicId);
        if (!comment) {
            throw new HttpException('Topic not found', HttpStatus.NOT_FOUND);
        }
        const arr: any[] = ((comment as any).reposts || []).map((x: any) => x.toString());
        const has = arr.includes(userId);
        (comment as any).reposts = has
            ? (comment as any).reposts.filter((x: any) => x.toString() !== userId)
            : [...((comment as any).reposts || []), id];
        await comment.save();

        // Notify the topic owner when someone reposts to their Follow Me feed.
        if (!has) {
            void this.notifications?.emit({
                recipient: String((comment as any).author),
                actor: userId,
                type: "REPOST",
                topicId: comment._id,
                preview: (comment as any).topicName || (comment as any).text || "",
            });
        }

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'comments',
            action: 'comments.repost_toggled',
            title: 'Topic repost toggled',
            entityType: 'comment',
            entityId: comment._id,
            metadata: { page: comment.page, path: comment.path },
        }).catch(() => undefined);

        return {
            repostsCount: ((comment as any).reposts || []).length,
            reposted: !has,
        };
    }

    // Topics reposted by a given user — powers the Fomies reposts feed.
    async getRepostsForUser(userId: string): Promise<any[]> {
        const uid = new mongoose.Types.ObjectId(userId);
        const topics = await this.CommentModel.find({
            isTopic: true,
            reposts: uid,
            moderationStatus: 'PUBLISHED',
        })
            .sort({ date: -1 })
            .limit(50)
            .lean();
        return this.attachAuthorsAndCounts(topics, false);
    }

    async addDislike(commentId: string, userId: string): Promise<any> {
        const id = new mongoose.Types.ObjectId(userId);
        const comment = await this.CommentModel.findById(commentId);

        if (!comment) {
            throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
        }

        comment.likes = comment.likes || [];
        comment.dislikes = comment.dislikes || [];

        if (comment.likes.some((like) => like.toString() === userId)) {
            comment.likes = comment.likes.filter((like) => like.toString() !== userId);
        }

        if (comment.dislikes.some((dislike) => dislike.toString() === userId)) {
            comment.dislikes = comment.dislikes.filter((dislike) => dislike.toString() !== userId);
        } else {
            comment.dislikes.push(id);
        }

        await comment.save();

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'comments',
            action: 'comments.dislike_toggled',
            title: 'Comment dislike toggled',
            entityType: 'comment',
            entityId: comment._id,
            metadata: {
                page: comment.page,
                path: comment.path,
            },
        });

        return this.getCommentByIdWithAuthor(commentId);
    }

    async addReply(commentId: string, userId: string, comment: commentDto): Promise<any> {
        const parentComment = await this.CommentModel.findById(commentId);

        if (!parentComment) {
            throw new HttpException('Parent comment not found', HttpStatus.NOT_FOUND);
        }

        const reply = await this.createComment({
            ...comment,
            isTopic: false,
            topicName: undefined,
            author: new mongoose.Types.ObjectId(userId),
            page: parentComment.page,
            path: comment.path || parentComment.path || parentComment.page,
        });

        parentComment.answers = parentComment.answers || [];
        parentComment.answers.push(new mongoose.Types.ObjectId(reply._id));
        await parentComment.save();

        // Notify the parent author that someone replied to their post/comment.
        void this.notifications?.emit({
            recipient: String((parentComment as any).author),
            actor: userId,
            type: "REPLY",
            topicId: (parentComment as any).isTopic ? parentComment._id : null,
            commentId: (parentComment as any).isTopic ? reply._id : parentComment._id,
            preview: (comment.text || "").slice(0, 200),
        });

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'comments',
            action: 'comments.reply_created',
            title: 'Comment reply created',
            entityType: 'comment',
            entityId: reply._id,
            metadata: {
                parentId: parentComment._id,
                page: parentComment.page,
                path: comment.path || parentComment.path || parentComment.page,
            },
        });

        const topicId = await this.resolveRootTopicId(parentComment._id.toString());

        // BUZZ-AI Stage 3: best-effort AI auto-reply / @FOMOAI mention (never blocks the human reply)
        this.maybeAutoReply(topicId, comment.text || "", userId).catch(() => {});

        return {
            reply,
            parentId: parentComment._id,
            topicId,
        };
    }

    // ── BUZZ-AI Stage 3: FOMO AI participant ──────────────────────────────
    private readonly AI_USER_ID = "6a0000000000000000000a11";
    private readonly AI_REPLY_OP = "buzz_thread_reply";

    private readonly DEFAULT_BUZZ_AI_SETTINGS = {
        autoReplyEnabled: true,
        mentionsEnabled: true,
        minComments: 3,
        minUniqueParticipants: 2,
        cooldownSec: 20,
        maxRepliesPerThread: 8,
        maxRepliesPerDay: 200,
        dailyCogsUsdLimit: 5,
        monthlyCogsUsdLimit: 100,
    };

    async getBuzzAiSettings(): Promise<any> {
        const doc = await this.CommentModel.db.collection("buzz_ai_settings").findOne({ _id: "singleton" as any });
        return { ...this.DEFAULT_BUZZ_AI_SETTINGS, ...(doc || {}), _id: "singleton" };
    }

    async updateBuzzAiSettings(patch: any): Promise<any> {
        const allowed = Object.keys(this.DEFAULT_BUZZ_AI_SETTINGS);
        const set: any = { updatedAt: new Date() };
        allowed.forEach((k) => { if (patch[k] !== undefined) set[k] = patch[k]; });
        await this.CommentModel.db.collection("buzz_ai_settings").updateOne(
            { _id: "singleton" as any }, { $set: set }, { upsert: true },
        );
        return this.getBuzzAiSettings();
    }

    async getBuzzAiBudget(): Promise<any> {
        const s = await this.getBuzzAiSettings();
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const ops = ["buzz_post_summary", "buzz_thread_reply", "buzz_market_digest"];
        const sum = async (from: Date) => {
            const r = await this.CommentModel.db.collection("ai_usage_events").aggregate([
                { $match: { operationType: { $in: ops }, createdAt: { $gte: from } } },
                { $group: { _id: null, cost: { $sum: "$providerCostUsd" } } },
            ]).toArray();
            return Number(r[0]?.cost || 0);
        };
        const daySpend = await sum(dayStart);
        const monthSpend = await sum(monthStart);
        return {
            dailyCogsUsdLimit: s.dailyCogsUsdLimit,
            monthlyCogsUsdLimit: s.monthlyCogsUsdLimit,
            daySpendUsd: Number(daySpend.toFixed(6)),
            monthSpendUsd: Number(monthSpend.toFixed(6)),
            dayRemainingUsd: Number(Math.max(0, s.dailyCogsUsdLimit - daySpend).toFixed(6)),
            monthRemainingUsd: Number(Math.max(0, s.monthlyCogsUsdLimit - monthSpend).toFixed(6)),
        };
    }

    /**
     * BUZZ CRM — consolidated dashboard statistics.
     * Discussion activity + moderation + AI participation + COGS + 14-day series.
     */
    async getBuzzStats(): Promise<any> {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const since14 = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
        since14.setHours(0, 0, 0, 0);
        const col = this.CommentModel;

        const [topics, topicsToday, replies, repliesToday, aiTotal, aiToday, aiMonth, reportedOpen, removed, hidden] =
            await Promise.all([
                col.countDocuments({ isTopic: true }),
                col.countDocuments({ isTopic: true, date: { $gte: dayStart } }),
                col.countDocuments({ isTopic: { $ne: true }, authorType: { $ne: "SYSTEM_AI" } }),
                col.countDocuments({ isTopic: { $ne: true }, authorType: { $ne: "SYSTEM_AI" }, date: { $gte: dayStart } }),
                col.countDocuments({ authorType: "SYSTEM_AI" }),
                col.countDocuments({ authorType: "SYSTEM_AI", date: { $gte: dayStart } }),
                col.countDocuments({ authorType: "SYSTEM_AI", date: { $gte: monthStart } }),
                col.countDocuments({ "reports.0": { $exists: true }, moderationStatus: { $ne: "REMOVED" } }),
                col.countDocuments({ moderationStatus: "REMOVED" }),
                col.countDocuments({ moderationStatus: "HIDDEN" }),
            ]);

        const likesAgg = await col.aggregate([
            { $project: { n: { $size: { $ifNull: ["$likes", []] } } } },
            { $group: { _id: null, total: { $sum: "$n" } } },
        ]);
        const reactions = Number(likesAgg?.[0]?.total || 0);

        const uniqueAll = (await col.distinct("author", { authorType: { $ne: "SYSTEM_AI" } })).length;
        const uniqueMonth = (await col.distinct("author", { authorType: { $ne: "SYSTEM_AI" }, date: { $gte: monthStart } })).length;

        const budget = await this.getBuzzAiBudget();
        const totalCogsAgg = await this.CommentModel.db.collection("ai_usage_events").aggregate([
            { $match: { operationType: { $in: ["buzz_post_summary", "buzz_thread_reply", "buzz_market_digest"] } } },
            { $group: { _id: null, cost: { $sum: "$providerCostUsd" }, count: { $sum: 1 } } },
        ]).toArray();
        const totalCogsUsd = Number((totalCogsAgg?.[0]?.cost || 0).toFixed(6));
        const totalAiOps = Number(totalCogsAgg?.[0]?.count || 0);

        const seriesAgg = await col.aggregate([
            { $match: { date: { $gte: since14 } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    topics: { $sum: { $cond: [{ $eq: ["$isTopic", true] }, 1, 0] } },
                    ai: { $sum: { $cond: [{ $eq: ["$authorType", "SYSTEM_AI"] }, 1, 0] } },
                    total: { $sum: 1 },
                },
            },
        ]);
        const seriesMap: Record<string, any> = {};
        (seriesAgg || []).forEach((r: any) => { seriesMap[r._id] = r; });
        const series: Array<{ date: string; topics: number; replies: number; ai: number }> = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date(since14.getTime() + i * 24 * 60 * 60 * 1000);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const row = seriesMap[key] || {};
            const topicsN = Number(row.topics || 0);
            const totalN = Number(row.total || 0);
            const aiN = Number(row.ai || 0);
            series.push({ date: key, topics: topicsN, ai: aiN, replies: Math.max(0, totalN - topicsN - aiN) });
        }

        return {
            activity: {
                topics, topicsToday,
                replies, repliesToday,
                reactions,
                activeUsersTotal: uniqueAll,
                activeUsersMonth: uniqueMonth,
            },
            moderation: { reportedOpen, removed, hidden },
            ai: {
                repliesTotal: aiTotal,
                repliesToday: aiToday,
                repliesMonth: aiMonth,
                operationsTotal: totalAiOps,
            },
            cogs: {
                totalUsd: totalCogsUsd,
                dayUsd: budget.daySpendUsd,
                monthUsd: budget.monthSpendUsd,
                dailyLimitUsd: budget.dailyCogsUsdLimit,
                monthlyLimitUsd: budget.monthlyCogsUsdLimit,
                dayRemainingUsd: budget.dayRemainingUsd,
                monthRemainingUsd: budget.monthRemainingUsd,
            },
            series,
        };
    }

    private async ensureAiUser(): Promise<mongoose.Types.ObjectId> {
        const _id = new mongoose.Types.ObjectId(this.AI_USER_ID);
        const users = this.CommentModel.db.collection("users");
        const existing = await users.findOne({ _id });
        if (!existing) {
            await users.insertOne({
                _id, name: "FOMO AI", username: "fomo_ai", nickname: "FOMO AI",
                isSystemAi: true, createdAt: new Date(), updatedAt: new Date(),
            } as any);
        }
        return _id;
    }

    private async ensureAiReplyRule(): Promise<void> {
        const col = this.CommentModel.db.collection("ai_credit_rules");
        const exists = await col.findOne({ operationType: this.AI_REPLY_OP });
        if (!exists) {
            await col.insertOne({
                operationType: this.AI_REPLY_OP, name: "Buzz Thread Reply (internal)", active: true,
                billingContext: "INTERNAL", capabilityRequired: "",
                baseCredits: 0, fixedCredits: 0, minCredits: 0, maxCredits: 0,
                estInputTokens: 1500, estOutputTokens: 350,
                modelClass: "FAST", modelPolicy: {}, pricingMode: "COST_BASED",
                safetyFactor: 1.2, targetMarkup: 2, version: 1,
                createdAt: new Date(), updatedAt: new Date(),
            } as any);
        }
    }

    /** AUTO / @FOMOAI trigger — best-effort, enforces rules before generating. */
    private async maybeAutoReply(topicId: string, humanText: string, requesterId: string): Promise<void> {
        if (!topicId) return;
        const s = await this.getBuzzAiSettings();
        const mentioned = s.mentionsEnabled && /@fomoai\b/i.test(humanText || "");

        const topic = await this.CommentModel.findById(topicId);
        if (!topic) return;
        const flattened = await this.CommentModel.find({ _id: { $in: (topic.answers || []) } }).lean();
        const humanReplies = flattened.filter((c: any) => c.authorType !== "SYSTEM_AI" && c.moderationStatus !== "REMOVED");
        const uniqueAuthors = new Set(humanReplies.map((c: any) => String(c.author))).size;

        let allowed = mentioned;
        if (!allowed && s.autoReplyEnabled) {
            allowed = humanReplies.length >= s.minComments && uniqueAuthors >= s.minUniqueParticipants;
        }
        if (!allowed) return;

        try {
            await this.aiThreadReply(topicId, requesterId, mentioned ? "MENTION" : "AUTO");
        } catch { /* swallow: never break the human reply flow */ }
    }

    /**
     * Generate a FOMO AI reply and persist it as a normal comment
     * (authorType=SYSTEM_AI) via the SAME engine. INTERNAL billing, COGS tracked.
     * Enforces cooldown, per-thread/per-day caps and daily/monthly COGS budgets.
     */
    async aiThreadReply(topicId: string, requesterId: string, trigger: "MANUAL" | "AUTO" | "MENTION" = "MANUAL"): Promise<any> {
        const topic = await this.CommentModel.findById(topicId);
        if (!topic) throw new HttpException("Topic not found", HttpStatus.NOT_FOUND);

        const s = await this.getBuzzAiSettings();
        const flattened = await this.CommentModel.find({ _id: { $in: (topic.answers || []) } }).lean();
        const aiReplies = flattened.filter((c: any) => c.authorType === "SYSTEM_AI");

        if (aiReplies.length >= s.maxRepliesPerThread) {
            throw new HttpException("AI reply limit reached for this thread", HttpStatus.TOO_MANY_REQUESTS);
        }
        const lastAi = aiReplies.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (lastAi && Date.now() - new Date(lastAi.date).getTime() < s.cooldownSec * 1000) {
            throw new HttpException("FOMO AI is on cooldown, try again shortly", HttpStatus.TOO_MANY_REQUESTS);
        }

        // per-day cap
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const repliesToday = await this.CommentModel.countDocuments({ authorType: "SYSTEM_AI", date: { $gte: dayStart } });
        if (repliesToday >= s.maxRepliesPerDay) {
            throw new HttpException("Daily AI reply limit reached", HttpStatus.TOO_MANY_REQUESTS);
        }

        // COGS budget
        const budget = await this.getBuzzAiBudget();
        if (budget.dayRemainingUsd <= 0 || budget.monthRemainingUsd <= 0) {
            throw new HttpException("AI budget exhausted", HttpStatus.TOO_MANY_REQUESTS);
        }

        await this.ensureAiReplyRule();

        const recent = flattened
            .filter((c: any) => c.moderationStatus !== "REMOVED")
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-12).map((c: any) => `- ${c.text}`).join("\n");
        const input = `TOPIC: ${topic.topicName || ""}\n${topic.text || ""}\n\nRECENT REPLIES:\n${recent || "(none yet)"}\n`;

        const result: any = await this.aiGateway.execute({
            userId: requesterId || "system",
            operation: this.AI_REPLY_OP,
            billingContext: "INTERNAL",
            mode: "CHAT",
            system:
                "You are FOMO AI, a concise, helpful crypto community assistant participating in a discussion thread. " +
                "Reply in 2-4 sentences, add real value, stay neutral and factual, never give financial advice.",
            input,
            context: { source: "BUZZ_THREAD_REPLY", topicId, trigger },
        });

        if (!result?.ok || !result?.content) {
            throw new HttpException(
                result?.errorCode === "unknown_operation" ? "AI reply operation not configured" : "FOMO AI is temporarily unavailable",
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        const aiUserId = await this.ensureAiUser();
        const text = String(result.content).trim().slice(0, 5000);
        const reply = await this.CommentModel.create({
            author: aiUserId, authorType: "SYSTEM_AI", text, isTopic: false,
            page: topic.page, path: topic.path || topic.page, date: new Date(),
        } as any);

        topic.answers = topic.answers || [];
        topic.answers.push(new mongoose.Types.ObjectId(reply._id));
        await topic.save();

        return {
            reply: {
                _id: reply._id, text, authorType: "SYSTEM_AI",
                author: { _id: aiUserId, name: "FOMO AI", username: "fomo_ai", isSystemAi: true },
                date: reply.date,
            },
            topicId, trigger, provider: result.provider, model: result.model,
            providerCostUsd: result.cost?.providerCostUsd ?? 0,
        };
    }


    async addReport(commentId: string, userId: string, reason?: string): Promise<any> {
        const id = new mongoose.Types.ObjectId(userId);
        const comment = await this.CommentModel.findById(commentId);

        if (!comment) {
            throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
        }

        comment.reports = comment.reports || [];
        (comment as any).reportDetails = (comment as any).reportDetails || [];

        if (comment.reports.some((report) => report.toString() === userId)) {
            throw new HttpException('The report has already been submitted by this user', HttpStatus.CONFLICT);
        }

        const allowedReasons = ['spam', 'scam', 'abuse', 'misleading', 'other'];
        const normalizedReason = allowedReasons.includes(String(reason || '').toLowerCase())
            ? String(reason).toLowerCase()
            : 'other';

        comment.reports.push(id);
        (comment as any).reportDetails.push({ user: id, reason: normalizedReason, date: new Date() });
        await comment.save();

        await this.userActionLogsService.log({
            userId,
            actorId: userId,
            actorType: 'user',
            category: 'comments',
            action: 'comments.report_created',
            title: 'Comment report created',
            severity: 'warning',
            entityType: 'comment',
            entityId: comment._id,
            metadata: {
                commentAuthor: comment.author,
                page: comment.page,
                path: comment.path,
            },
        });

        return this.getCommentByIdWithAuthor(commentId);
    }

    async regenerateTopicSummary(topicId: string, userId?: string): Promise<any> {
        const topic = await this.findTopicById(topicId);
        const descendantMap = await this.loadDescendantMap(
            (topic.answers || []).map((answerId: any) => answerId.toString())
        );
        const authorIds = [
            topic.author,
            ...Array.from(descendantMap.values()).map((comment: any) => comment.author),
        ];
        const authorMap = await this.loadAuthorMap(authorIds);
        const replyCount = this.countDescendants(topic.answers || [], descendantMap);
        const serializedTopic = this.serializeCommentNode(
            topic,
            authorMap,
            descendantMap,
            true,
            20,
            topic._id.toString(),
            replyCount,
        );

        const flattened = this.flattenReplies(serializedTopic.answersList || []);
        const contentVersion = this.hashString(`${serializedTopic.topicName}|${serializedTopic.text}`);
        const commentsVersion = flattened.length;

        const commentsText = flattened
            .slice(0, 40)
            .map((r: any) => `- ${r.text}`)
            .join("\n");

        const system =
            "You are FOMO's crypto community analyst. Summarize a discussion thread for a sidebar widget. " +
            "Be concise, factual and neutral. Do NOT invent market data. Output strictly matches the JSON schema.";
        const input =
            `TOPIC: ${serializedTopic.topicName || "(untitled)"}\n` +
            `CATEGORY: ${serializedTopic.categoryKey || "-"} / ${serializedTopic.topicKey || "-"}\n` +
            `POST:\n${serializedTopic.text || ""}\n\n` +
            `COMMENTS (${flattened.length}):\n${commentsText || "(no comments yet)"}\n`;

        const jsonSchema = {
            type: "object",
            properties: {
                overview: { type: "string", description: "1-2 sentence overview of the post" },
                keyTakeaways: { type: "array", items: { type: "string" }, description: "3-5 short bullet takeaways" },
                communityPulse: { type: "string", description: "1 sentence on discussion sentiment/state" },
            },
            required: ["overview", "keyTakeaways", "communityPulse"],
            additionalProperties: false,
        };

        const result: any = this.aiGateway
            ? await this.aiGateway.execute({
            userId: userId || String(topic.author),
            operation: "buzz_post_summary",
            billingContext: "INTERNAL",
            mode: "STRUCTURED",
            jsonSchema,
            system,
            input,
            idempotencyKey: `buzz-sum-${topicId}-${contentVersion}-${commentsVersion}`,
            context: { source: "BUZZ_SUMMARY", topicId },
        })
            : { ok: false, errorCode: "gateway_unavailable" };

        if (!result?.ok || !result?.content) {
            await this.CommentModel.updateOne(
                { _id: topic._id },
                { $set: { "aiSummary.status": "FAILED" } },
            );
            throw new HttpException(
                result?.errorCode === "unknown_operation"
                    ? "AI summary operation is not configured"
                    : "AI Summary temporarily unavailable",
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        let parsed: any = {};
        try { parsed = typeof result.content === "string" ? JSON.parse(result.content) : result.content; }
        catch { parsed = {}; }

        const aiSummary = {
            overview: parsed.overview || "",
            keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
            communityPulse: parsed.communityPulse || "",
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            providerCostUsd: result.cost?.providerCostUsd ?? null,
            creditsCharged: result.credits?.captured ?? 0,
            generatedAt: new Date(),
            contentVersion,
            commentsVersion,
            status: "READY" as const,
        };

        await this.CommentModel.updateOne({ _id: topic._id }, { $set: { aiSummary } });

        // Build the same insights shape returned by getTopicDetail so the client
        // can update the AI Summary panel immediately after regeneration.
        const heuristic = this.buildTopicInsights(serializedTopic);
        const insights = {
            ...heuristic,
            overview: aiSummary.overview || heuristic.overview,
            takeaways: (aiSummary.keyTakeaways && aiSummary.keyTakeaways.length) ? aiSummary.keyTakeaways : heuristic.takeaways,
            pulse: aiSummary.communityPulse ? [aiSummary.communityPulse, ...(Array.isArray(heuristic.pulse) ? heuristic.pulse : [])] : heuristic.pulse,
            aiGenerated: true,
        };

        return { topicId, aiSummary, insights };
    }

    private hashString(str: string): string {
        let h = 0;
        const s = String(str || "");
        for (let i = 0; i < s.length; i++) {
            h = (h << 5) - h + s.charCodeAt(i);
            h |= 0;
        }
        return String(h >>> 0);
    }

    async generateTopicSuggestion(topicId: string, _userId?: string): Promise<any> {
        const detail = await this.getTopicDetail(topicId);
        const suggestion = this.buildTopicSuggestion(detail.topic);

        return {
            topicId,
            suggestion,
            updatedAt: new Date().toISOString(),
        };
    }

    private parseTopicListQuery(query: Record<string, string | undefined>): TopicListQuery {
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
        const sort = this.normalizeTopicSort(query.sort);

        return {
            page,
            limit,
            sort,
            search: this.normalizeOptionalString(query.search),
            filter: this.normalizeOptionalString(query.filter),
            category: this.normalizeOptionalString(query.category),
            fromDate: this.parseOptionalDate(query.fromDate),
            toDate: this.parseOptionalDate(query.toDate),
        };
    }

    private async getViewerFollowing(viewerId?: string): Promise<string[]> {
        if (!viewerId) return [];
        try {
            const viewer = await this.UserModel.findById(viewerId, { following: 1 }).lean();
            return (viewer?.following || []).map((id: any) => id.toString());
        } catch {
            return [];
        }
    }

    private async assertAudienceAccess(topic: any, viewerId?: string): Promise<void> {
        if (!topic || topic.audience !== "FOLLOWERS") return;
        const authorId = topic.author?.toString();
        if (viewerId && authorId === viewerId) return;
        if (viewerId) {
            const following = await this.getViewerFollowing(viewerId);
            if (following.includes(authorId)) return;
        }
        throw new HttpException("This post is available to followers only", HttpStatus.FORBIDDEN);
    }

    async setModerationStatus(commentId: string, status: "PUBLISHED" | "HIDDEN" | "REMOVED"): Promise<any> {
        const allowed = ["PUBLISHED", "HIDDEN", "REMOVED"];
        if (!allowed.includes(status)) {
            throw new BadRequestException(`Invalid moderation status: ${status}`);
        }
        const updated = await this.CommentModel.findByIdAndUpdate(
            commentId,
            { moderationStatus: status },
            { new: true },
        );
        if (!updated) throw new HttpException("Comment not found", HttpStatus.NOT_FOUND);
        return { id: commentId, moderationStatus: status };
    }

    async dismissReports(commentId: string): Promise<any> {
        const updated = await this.CommentModel.findByIdAndUpdate(
            commentId,
            { reports: [], reportDetails: [] },
            { new: true },
        );
        if (!updated) throw new HttpException("Comment not found", HttpStatus.NOT_FOUND);
        return { id: commentId, reports: 0 };
    }

    private buildTopicListMatchStage(options: TopicListQuery, viewerId?: string, following: string[] = []): Record<string, any> {
        const matchStage: Record<string, any> = { isTopic: true, moderationStatus: { $nin: ["HIDDEN", "REMOVED"] } };

        // Followers-only audience gate: PUBLIC posts always visible; FOLLOWERS posts
        // visible only to the author or users who follow the author.
        const audienceOr: Record<string, any>[] = [
            { audience: { $ne: "FOLLOWERS" } },
        ];
        if (viewerId) {
            audienceOr.push({ author: new mongoose.Types.ObjectId(viewerId) });
            if (following.length) {
                audienceOr.push({ author: { $in: following.map((id) => new mongoose.Types.ObjectId(id)) } });
            }
        }
        matchStage.$and = [{ $or: audienceOr }];

        if (options.search) {
            matchStage.$or = [
                { topicName: { $regex: options.search, $options: 'i' } },
                { text: { $regex: options.search, $options: 'i' } },
            ];
        }

        if (options.category && options.category !== 'all') {
            matchStage.categoryKey = options.category;
        }

        if (options.filter && options.filter !== 'all') {
            matchStage.topicKey = options.filter;
        }

        if (options.fromDate || options.toDate) {
            matchStage.date = {};

            if (options.fromDate) {
                matchStage.date.$gte = options.fromDate;
            }

            if (options.toDate) {
                const inclusiveEnd = new Date(options.toDate);
                inclusiveEnd.setHours(23, 59, 59, 999);
                matchStage.date.$lte = inclusiveEnd;
            }
        }

        return matchStage;
    }

    private getTopicSortStage(sort: TopicSort): Record<string, 1 | -1> {
        switch (sort) {
            case 'oldest':
                return { date: 1 };
            case 'top':
                return { likes: -1, date: -1 };
            case 'newest':
            default:
                return { date: -1 };
        }
    }

    private normalizeTopicSort(value?: string): TopicSort {
        if (value === 'oldest' || value === 'top') {
            return value;
        }

        return 'newest';
    }

    private normalizeOptionalString(value?: string): string | undefined {
        const normalized = String(value || '').trim();
        return normalized ? normalized : undefined;
    }

    private parseOptionalDate(value?: string): Date | undefined {
        if (!value) {
            return undefined;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new BadRequestException(`Invalid date: ${value}`);
        }

        return parsed;
    }

    private async prepareCommentPayload(comment: commentDto): Promise<Record<string, any>> {
        const text = String(comment.text || '').trim();
        if (!text) {
            throw new UnprocessableEntityException('Text is required');
        }

        const topicName = this.normalizeOptionalString(comment.topicName);
        const topicKey = this.normalizeOptionalString(comment.topicKey);
        const categoryKey = this.normalizeOptionalString(comment.categoryKey);
        const page = this.normalizeOptionalString(comment.page);
        const path = this.normalizeOptionalString(comment.path);
        const image = await this.normalizeImageInput(comment.image);

        // Rich forum fields.
        const bodyHtml = this.sanitizeBodyHtml(comment.bodyHtml);
        const rawImages = Array.isArray(comment.images) ? comment.images.slice(0, 10) : [];
        const images: string[] = [];
        for (const img of rawImages) {
            const stored = await this.normalizeImageInput(img);
            if (stored) images.push(stored);
        }
        if (image && !images.includes(image)) images.unshift(image);
        const coverImage = images[0] || image;
        const mediaUrls = Array.isArray(comment.mediaUrls)
            ? comment.mediaUrls
                .map((u: any) => String(u || "").trim())
                .filter((u: string) => /^https?:\/\//i.test(u))
                .slice(0, 8)
            : [];
        const tags = Array.isArray(comment.tags)
            ? Array.from(
                new Set(
                    comment.tags
                        .map((t: any) => String(t || "").trim().replace(/^#/, "").slice(0, 40))
                        .filter(Boolean)
                )
            ).slice(0, 12)
            : [];

        return {
            author: comment.author,
            date: comment.date || new Date(),
            text,
            page,
            path,
            isTopic: Boolean(comment.isTopic),
            topicName,
            topicKey,
            categoryKey,
            image: coverImage,
            bodyHtml,
            images,
            mediaUrls,
            tags,
            answers: [],
            likes: [],
            dislikes: [],
            reports: [],
            reportDetails: [],
            audience: comment.audience === "FOLLOWERS" ? "FOLLOWERS" : "PUBLIC",
            moderationStatus: "PUBLISHED",
            viewsCount: 0,
        };
    }

    // Minimal HTML allow-list sanitizer for the forum composer output.
    private sanitizeBodyHtml(input?: string): string {
        let html = String(input || "");
        if (!html.trim()) return "";
        // Drop scripts/styles/iframes and inline event handlers / js: urls.
        html = html
            .replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "")
            .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
            .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
            .replace(/javascript:/gi, "");
        return html.slice(0, 20000);
    }

    private async normalizeImageInput(image?: string): Promise<string | undefined> {
        const normalized = String(image || '').trim();
        if (!normalized) {
            return undefined;
        }

        if (normalized.startsWith('data:image/')) {
            return this.filesService.writeBase64File(normalized);
        }

        return normalized;
    }

    private async loadAuthorMap(authorIds: Array<any>): Promise<Map<string, any>> {
        const uniqueIds = Array.from(
            new Set(
                authorIds
                    .filter(Boolean)
                    .map((authorId) => authorId.toString())
            )
        ).map((authorId) => new mongoose.Types.ObjectId(authorId));

        if (!uniqueIds.length) {
            return new Map();
        }

        const authors = await this.UserModel.find({
            _id: { $in: uniqueIds }
        }).lean();

        return new Map(authors.map((author) => [author._id.toString(), author]));
    }

    private async loadDescendantMap(rootIds: string[]): Promise<Map<string, any>> {
        const map = new Map<string, any>();
        let nextIds = Array.from(new Set(rootIds.filter(Boolean)));

        while (nextIds.length) {
            const idsToLoad = nextIds
                .filter((id) => !map.has(id))
                .map((id) => new mongoose.Types.ObjectId(id));

            if (!idsToLoad.length) {
                break;
            }

            const comments = await this.CommentModel.find({
                _id: { $in: idsToLoad }
            }).lean();

            nextIds = [];

            comments.forEach((comment) => {
                const normalized = this.normalizeStoredComment(comment);
                const currentId = normalized._id.toString();
                map.set(currentId, normalized);

                (normalized.answers || []).forEach((answerId: any) => {
                    const key = answerId.toString();
                    if (!map.has(key)) {
                        nextIds.push(key);
                    }
                });
            });
        }

        return map;
    }

    private normalizeStoredComment(comment: any): any {
        return {
            ...comment,
            answers: Array.isArray(comment.answers) ? comment.answers : [],
            likes: Array.isArray(comment.likes) ? comment.likes : [],
            dislikes: Array.isArray(comment.dislikes) ? comment.dislikes : [],
            reports: Array.isArray(comment.reports) ? comment.reports : [],
            viewsCount: Number(comment.viewsCount || 0),
        };
    }

    private serializeCommentNode(
        comment: any,
        authorMap: Map<string, any>,
        descendantMap: Map<string, any>,
        includeChildren: boolean,
        childDepth: number,
        topicId: string,
        replyCountOverride?: number,
    ): any {
        const normalized = this.normalizeStoredComment(comment);
        const childNodes = includeChildren
            ? (normalized.answers || [])
                .map((answerId: any) => {
                    const child = descendantMap.get(answerId.toString());
                    if (!child) {
                        return null;
                    }

                    return this.serializeCommentNode(
                        child,
                        authorMap,
                        descendantMap,
                        childDepth > 1,
                        Math.max(childDepth - 1, 0),
                        topicId,
                    );
                })
                .filter(Boolean)
            : [];

        const replyCount = replyCountOverride ?? this.countDescendants(normalized.answers || [], descendantMap);
        const author = authorMap.get(normalized.author?.toString());

        return {
            ...normalized,
            author: author ? [author] : [],
            answers: childNodes,
            replies: childNodes,
            answersList: childNodes,
            replyCount,
            topicId,
            likes: normalized.likes.map((like: any) => like.toString()),
            dislikes: normalized.dislikes.map((dislike: any) => dislike.toString()),
            reports: normalized.reports.map((report: any) => report.toString()),
            reposts: (normalized.reposts || []).map((r: any) => r.toString()),
            repostsCount: (normalized.reposts || []).length,
        };
    }

    private countDescendants(answerIds: Array<any>, descendantMap: Map<string, any>): number {
        return (answerIds || []).reduce((count, answerId) => {
            const comment = descendantMap.get(answerId.toString());
            if (!comment) {
                return count;
            }

            return count + 1 + this.countDescendants(comment.answers || [], descendantMap);
        }, 0);
    }

    private async attachAuthorsAndCounts(comments: Array<any>, includeChildren: boolean): Promise<Array<any>> {
        const normalized = comments.map((comment) => this.normalizeStoredComment(comment));
        const descendantMap = includeChildren
            ? await this.loadDescendantMap(
                normalized.flatMap((comment) => (comment.answers || []).map((answerId: any) => answerId.toString()))
            )
            : new Map<string, any>();
        const authorMap = await this.loadAuthorMap(normalized.map((comment) => comment.author));

        return normalized.map((comment) =>
            this.serializeCommentNode(
                comment,
                authorMap,
                descendantMap,
                includeChildren,
                includeChildren ? 20 : 1,
                comment._id.toString(),
            )
        );
    }

    private async getCommentByIdWithAuthor(commentId: string): Promise<any> {
        const comment = await this.CommentModel.findById(commentId).lean();
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        const [serialized] = await this.attachAuthorsAndCounts([comment], false);
        return serialized;
    }

    private async findTopicById(topicId: string): Promise<any> {
        const topic = await this.CommentModel.findOne({
            _id: new mongoose.Types.ObjectId(topicId),
            isTopic: true,
        }).lean();

        if (!topic) {
            throw new NotFoundException('Topic not found');
        }

        return this.normalizeStoredComment(topic);
    }

    private async resolveRootTopicId(commentId: string): Promise<string> {
        let currentId = commentId;
        let currentComment = await this.CommentModel.findById(currentId).lean();

        while (currentComment && !currentComment.isTopic) {
            const parent = await this.CommentModel.findOne({
                answers: new mongoose.Types.ObjectId(currentId)
            }).select('_id isTopic').lean();

            if (!parent) {
                break;
            }

            currentId = parent._id.toString();
            currentComment = parent as any;
        }

        return currentId;
    }

    private buildTopicInsights(topic: any): any {
        const flattenedReplies = this.flattenReplies(topic.answersList || []);
        const textChunks = [
            topic.topicName,
            topic.text,
            ...flattenedReplies.map((reply) => reply.text),
        ].filter(Boolean);
        const overview = topic.text || topic.topicName || '';
        const takeaways = this.extractTakeaways(textChunks, 6);
        const contributors = this.buildTopicContributors(topic, flattenedReplies);
        const sentiment = this.calculateSentiment(topic, flattenedReplies);
        const pulse = this.buildPulseDescriptions(topic, flattenedReplies, contributors, sentiment);

        return {
            overview,
            takeaways,
            pulse,
            sentiment,
            contributors,
            updatedAt: new Date().toISOString(),
        };
    }

    private flattenReplies(replies: Array<any>): Array<any> {
        const flattened: Array<any> = [];

        replies.forEach((reply) => {
            flattened.push(reply);

            if (Array.isArray(reply.answersList) && reply.answersList.length) {
                flattened.push(...this.flattenReplies(reply.answersList));
            }
        });

        return flattened;
    }

    private extractTakeaways(texts: string[], limit: number): string[] {
        const sentences = texts
            .flatMap((text) =>
                String(text || '')
                    .split(/(?<=[.!?])\s+/)
                    .map((sentence) => sentence.trim())
                    .filter(Boolean)
            )
            .filter((sentence) => sentence.length >= 24);

        return Array.from(new Set(sentences)).slice(0, limit);
    }

    private calculateSentiment(topic: any, replies: Array<any>) {
        const allComments = [topic, ...replies];
        const likes = allComments.reduce((sum, comment) => sum + (comment.likes?.length || 0), 0);
        const dislikes = allComments.reduce((sum, comment) => sum + (comment.dislikes?.length || 0), 0);
        const totalSignals = likes + dislikes;
        const positive = totalSignals ? Math.round((likes / totalSignals) * 100) : 50;
        const negative = totalSignals ? Math.round((dislikes / totalSignals) * 100) : 20;
        const neutral = Math.max(0, 100 - positive - negative);

        return {
            score: positive,
            label: positive >= 60 ? 'Positive' : negative >= 50 ? 'Negative' : 'Mixed',
            positive,
            neutral,
            negative,
        };
    }

    private buildTopicContributors(topic: any, replies: Array<any>): TopicContributor[] {
        const statsMap = new Map<string, {
            author: any;
            replies: number;
            upvotes: number;
            downvotes: number;
        }>();

        [topic, ...replies].forEach((comment) => {
            const author = comment.author?.[0];
            if (!author?._id) {
                return;
            }

            const key = author._id.toString();
            const current = statsMap.get(key) || {
                author,
                replies: 0,
                upvotes: 0,
                downvotes: 0,
            };

            current.replies += comment._id?.toString() === topic._id?.toString() ? 0 : 1;
            current.upvotes += comment.likes?.length || 0;
            current.downvotes += comment.dislikes?.length || 0;
            statsMap.set(key, current);
        });

        return Array.from(statsMap.values())
            .sort((a, b) => (b.upvotes + b.replies) - (a.upvotes + a.replies))
            .slice(0, 5)
            .map((item, index) => {
                const author = item.author;
                const rating = Number(author.rating || 0);
                const xp = Math.max(0, Math.round(rating * 8) + item.upvotes + item.replies * 5);

                return {
                    name: author.name || author.username || 'User',
                    username: `@${(author.username || author.name || 'user').toLowerCase().replace(/^@/, '')}`,
                    avatar: author.avatar || author.photo || author.twitterData?.photo || '',
                    badge: index === 0 ? 'Astral Sage' : index === 1 ? 'Cosmic Explorer' : 'Stellar Awakening',
                    xp,
                    upvotes: item.upvotes,
                    comments: item.replies,
                    engagement: `${Math.max(1, Math.round(((item.upvotes + item.replies) / Math.max(1, item.downvotes + 1)) * 10) / 10)}x`,
                };
            });
    }

    private buildPulseDescriptions(
        topic: any,
        replies: Array<any>,
        contributors: TopicContributor[],
        sentiment: { label: string; score: number; positive: number; neutral: number; negative: number }
    ): string[] {
        const totalReplies = replies.length;
        const topContributor = contributors[0];
        const mostRecentReply = replies
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return [
            totalReplies
                ? `The thread already has ${totalReplies} community replies, which signals active discussion around this topic.`
                : 'The discussion is still early, so the first replies will likely shape the thread narrative.',
            `Sentiment currently looks ${sentiment.label.toLowerCase()} with an engagement score of ${sentiment.score}%.`,
            topContributor
                ? `${topContributor.username} is the strongest contributor so far with ${topContributor.upvotes} upvotes and ${topContributor.comments} comments.`
                : 'No standout contributor has emerged yet.',
            mostRecentReply
                ? `The latest reply came on ${new Date(mostRecentReply.date).toLocaleString()}.`
                : 'There are no replies yet, so the next contribution will define the conversation pace.',
        ].filter(Boolean);
    }

    private buildTopicSuggestion(topic: any): string {
        const firstReply = this.flattenReplies(topic.answersList || [])[0];
        const prefix = topic.topicName ? `Interesting take on "${topic.topicName}".` : 'Interesting point.';
        const followUp = firstReply?.text
            ? ` I agree with the part about ${this.summarizeFragment(firstReply.text)}.`
            : ' Thanks for opening the discussion.';

        return `${prefix}${followUp} One thing I would add is a bit more context on the execution risk and what signal we should watch next.`;
    }

    private summarizeFragment(text: string): string {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80)
            .replace(/[.,!?;:]+$/, '');
    }
}
