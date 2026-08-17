import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Topic, TopicDocument, TopicStatus } from "./models/topic.model";
import { Comment, CommentDocument } from "src/comments/models/comment.model";

const DEFAULT_TOPICS: Array<Partial<Topic>> = [
  { slug: "blockchain", name: "Blockchain", colorKey: "blue", sortOrder: 1 },
  { slug: "nfts", name: "NFTs", colorKey: "pink", sortOrder: 2 },
  { slug: "defi", name: "DeFi", colorKey: "green", sortOrder: 3 },
  { slug: "ai", name: "AI", colorKey: "purple", sortOrder: 4 },
  { slug: "analytics", name: "Analytics", colorKey: "indigo", sortOrder: 5 },
  { slug: "strategy", name: "Strategy", colorKey: "teal", sortOrder: 6 },
  { slug: "invests", name: "Invests", colorKey: "orange", sortOrder: 7 },
  { slug: "market", name: "Market", colorKey: "blue", sortOrder: 8 },
  { slug: "airdrops", name: "Airdrops", colorKey: "green", sortOrder: 9 },
  { slug: "scam", name: "Scam", colorKey: "red", sortOrder: 10 },
];

@Injectable()
export class TopicsService implements OnModuleInit {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const count = await this.topicModel.estimatedDocumentCount();
      if (count === 0) {
        await this.topicModel.insertMany(DEFAULT_TOPICS.map((t) => ({ ...t, status: "ACTIVE" })));
        this.logger.log(`[Topics] Seeded ${DEFAULT_TOPICS.length} default topics`);
      }
    } catch (e: any) {
      this.logger.warn(`[Topics] default seed skipped: ${e?.message || e}`);
    }
  }

  private normalizeSlug(value: string): string {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  private async withCounts(topics: any[]): Promise<any[]> {
    const slugs = topics.map((t) => t.slug);
    const counts = await this.commentModel.aggregate([
      { $match: { isTopic: true, topicKey: { $in: slugs }, moderationStatus: { $ne: "REMOVED" } } },
      { $group: { _id: "$topicKey", n: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c: any) => [c._id, c.n]));
    return topics.map((t) => ({ ...t, postsCount: map.get(t.slug) || 0 }));
  }

  async listPublic(): Promise<any[]> {
    const topics = await this.topicModel.find({ status: "ACTIVE" }).sort({ sortOrder: 1, name: 1 }).lean();
    return this.withCounts(topics);
  }

  async listAdmin(): Promise<any[]> {
    const topics = await this.topicModel.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    return this.withCounts(topics);
  }

  async create(dto: Partial<Topic>): Promise<any> {
    const slug = this.normalizeSlug(dto.slug || dto.name || "");
    if (!slug) throw new BadRequestException("slug or name is required");
    if (!dto.name) throw new BadRequestException("name is required");
    const exists = await this.topicModel.exists({ slug });
    if (exists) throw new ConflictException(`Topic slug '${slug}' already exists`);
    const created = await this.topicModel.create({
      slug,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      colorKey: dto.colorKey || "gray",
      status: (dto.status as TopicStatus) || "ACTIVE",
      sortOrder: dto.sortOrder ?? 0,
    });
    return created;
  }

  async update(id: string, dto: Partial<Topic>): Promise<any> {
    const patch: Record<string, any> = {};
    for (const key of ["name", "description", "icon", "colorKey", "status", "sortOrder"]) {
      if ((dto as any)[key] !== undefined) patch[key] = (dto as any)[key];
    }
    // slug is immutable once created (posts reference it); renaming label is allowed
    const updated = await this.topicModel.findByIdAndUpdate(id, patch, { new: true });
    if (!updated) throw new NotFoundException("Topic not found");
    return updated;
  }

  async setStatus(id: string, status: TopicStatus): Promise<any> {
    if (!["ACTIVE", "HIDDEN", "ARCHIVED"].includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    const updated = await this.topicModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) throw new NotFoundException("Topic not found");
    return updated;
  }
}
