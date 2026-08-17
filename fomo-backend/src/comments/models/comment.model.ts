import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class Comment {
    @Prop({ required: true, ref: "User" })
    author: Types.ObjectId

    @Prop({ required: true, default: () => new Date() })
    date:Date

    @Prop({ required: true, trim: true, maxlength: 5000 })
    text:string

    @Prop({ trim: true, maxlength: 120 })
    page:string

    @Prop({ default: false })
    isTopic:boolean

    @Prop({ type: [Types.ObjectId], ref: "Comment", default: [] })
    answers:Array<Types.ObjectId>

    @Prop({ trim: true, maxlength: 200 })
    topicName:string 

    @Prop({ trim: true, maxlength: 64 })
    topicKey?: string

    @Prop({ trim: true, maxlength: 64 })
    categoryKey?: string

    @Prop({ trim: true, maxlength: 255 })
    image?: string

    @Prop({ default: 0 })
    viewsCount?: number

    @Prop({ type: [Types.ObjectId], ref: "User", default: [] })
    likes:Array<Types.ObjectId>

    @Prop({ type: [Types.ObjectId], ref: "User", default: [] })
    dislikes:Array<Types.ObjectId>

    @Prop({ type: [Types.ObjectId], ref: "User", default: [] })
    reports:Array<Types.ObjectId>

    @Prop({ type: [{ user: { type: Types.ObjectId, ref: "User" }, reason: String, date: Date }], default: [] })
    reportDetails: Array<{ user: Types.ObjectId; reason: string; date: Date }>

    @Prop({ enum: ["PUBLIC", "FOLLOWERS"], default: "PUBLIC" })
    audience: "PUBLIC" | "FOLLOWERS"

    @Prop({ enum: ["PUBLISHED", "HIDDEN", "REMOVED"], default: "PUBLISHED", index: true })
    moderationStatus: "PUBLISHED" | "HIDDEN" | "REMOVED"

    // BUZZ-AI Stage 3: distinguishes the FOMO AI participant from human authors.
    @Prop({ enum: ["USER", "SYSTEM_AI"], default: "USER", index: true })
    authorType: "USER" | "SYSTEM_AI"

    @Prop({ type: Object, default: null })
    aiSummary: {
        overview?: string;
        keyTakeaways?: string[];
        communityPulse?: string;
        provider?: string;
        model?: string;
        latencyMs?: number;
        providerCostUsd?: number;
        creditsCharged?: number;
        generatedAt?: Date;
        contentVersion?: string;
        commentsVersion?: number;
        status?: "READY" | "STALE" | "FAILED";
    } | null

    @Prop({ trim: true, maxlength: 255 })
    path:string

    // Rich forum post fields (Telegram-style composer).
    @Prop({ default: "" })
    bodyHtml: string;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ type: [String], default: [] })
    mediaUrls: string[];

    @Prop({ type: [String], default: [] })
    tags: string[];

    // Community reposts — userIds who reposted this topic (feeds the Fomies block).
    @Prop({ type: [Types.ObjectId], ref: "User", default: [] })
    reposts: Types.ObjectId[];

    // Follows attributed to THIS topic (follower userIds who followed the author
    // from this post). Feeds `followersFromContent` in the influence read-model.
    @Prop({ type: [Types.ObjectId], ref: "User", default: [] })
    followsFromContent: Types.ObjectId[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ author: 1, date: -1 });
