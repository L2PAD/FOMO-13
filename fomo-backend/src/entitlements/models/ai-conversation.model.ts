import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

/** A user's FOMO AI conversation thread (presentation layer, separate from the
 *  usage/credit ledger). */
@Schema({ collection: "ai_conversations", timestamps: true })
export class AiConversation {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: "New chat" })
  title: string;

  @Prop({ type: String, default: "ask_fomo" })
  operation: string;

  // Optional entity context (PROJECT/FUND/PERSON/PORTFOLIO/...) for context-aware chat.
  @Prop({ type: Object, default: null })
  context: Record<string, any> | null;

  @Prop({ type: Date, default: null })
  archivedAt: Date | null;

  @Prop({ type: Date, default: () => new Date() })
  lastMessageAt: Date;
}

export type AiConversationDocument = AiConversation & Document;
export const AiConversationSchema = SchemaFactory.createForClass(AiConversation);

/** A single message in a conversation. Presentation-ready — never stores raw
 *  provider objects; grounding metadata is stored for the sources UI. */
@Schema({ collection: "ai_messages", timestamps: true })
export class AiMessage {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ["user", "assistant"], required: true })
  role: string;

  @Prop({ type: String, default: "" })
  content: string;

  @Prop({ type: String, default: "" })
  operation: string;

  // Grounding contract (assistant messages only).
  @Prop({ type: Array, default: [] })
  sources: any[];

  // Presentation-ready sections: { fomoData:{text,available}, analysis:{text}, risks:{text} }
  @Prop({ type: Object, default: null })
  sections: Record<string, any> | null;

  // { grounded, connectedSources, missingSources[] }
  @Prop({ type: Object, default: null })
  grounding: Record<string, any> | null;

  @Prop({ type: String, default: "" })
  confidence: string;

  @Prop({ type: String, default: "" })
  coverage: string;

  @Prop({ type: Array, default: [] })
  limitations: string[];

  @Prop({ type: String, default: "" })
  dataMode: string;

  @Prop({ type: Number, default: 0 })
  creditsEstimated: number;

  @Prop({ type: Number, default: 0 })
  creditsCharged: number;

  @Prop({ type: String, default: "" })
  usageEventId: string;
}

export type AiMessageDocument = AiMessage & Document;
export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);
