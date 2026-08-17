import { Logger, Provider } from "@nestjs/common";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import mongoose, { Connection, Schema } from "mongoose";
import {
  FOMO_V2_BACKER_MODEL_DEFINITIONS,
} from "../fomo-v2/domains/backers";
import { FOMO_V2_FUNDING_MODEL_DEFINITIONS } from "../fomo-v2/domains/funding";
import { FOMO_V2_IMPORT_CANDIDATE_MODEL_DEFINITIONS } from "../fomo-v2/domains/import-candidates";
import { FOMO_V2_MARKET_MODEL_DEFINITIONS } from "../fomo-v2/domains/market";
import { FOMO_V2_REVIEW_MODEL_DEFINITIONS } from "../fomo-v2/domains/review";
import { FOMO_V2_UNLOCKS_MODEL_DEFINITIONS } from "../fomo-v2/domains/unlocks";
import { FOMO_V2_VESTING_MODEL_DEFINITIONS } from "../fomo-v2/domains/vesting";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSchema,
  FomoV2CanonicalProjectSource,
  FomoV2CanonicalProjectSourceSchema,
  FomoV2SourceEntity,
  FomoV2SourceEntitySchema,
  FomoV2SourceSnapshot,
  FomoV2SourceSnapshotSchema,
} from "../fomo-v2/models";
import { FOMO_V2_PROJECT_DOMAIN_SOURCE_MODEL_DEFINITIONS } from "../fomo-v2/shared/source-policy";
import {
  ADMIN_AI_CONNECTION_NAME,
  ADMIN_AI_PARSER_CONNECTION_NAME,
} from "./admin-ai-chat.constants";
import { AdminAiChatConfigService } from "./admin-ai-chat-config.service";
import {
  AiAdminToolRun,
  AiAdminToolRunSchema,
} from "./models/ai-admin-tool-run.model";
import {
  AdminAiChatArtifact,
  AdminAiChatArtifactSchema,
} from "./models/admin-ai-chat-artifact.model";
import {
  AdminAiChatFolder,
  AdminAiChatFolderSchema,
} from "./models/admin-ai-chat-folder.model";
import {
  AdminAiChatMessage,
  AdminAiChatMessageSchema,
} from "./models/admin-ai-chat-message.model";
import {
  AdminAiChatThread,
  AdminAiChatThreadSchema,
} from "./models/admin-ai-chat-thread.model";
import {
  AdminAiChatToolRun,
  AdminAiChatToolRunSchema,
} from "./models/admin-ai-chat-tool-run.model";

type AdminAiModelDefinition = {
  name: string;
  schema: Schema;
};

const logger = new Logger("AdminAiMongo");

export const ADMIN_AI_MODEL_DEFINITIONS: AdminAiModelDefinition[] = [
  { name: AdminAiChatArtifact.name, schema: AdminAiChatArtifactSchema },
  { name: AdminAiChatFolder.name, schema: AdminAiChatFolderSchema },
  { name: AdminAiChatThread.name, schema: AdminAiChatThreadSchema },
  { name: AdminAiChatMessage.name, schema: AdminAiChatMessageSchema },
  { name: AdminAiChatToolRun.name, schema: AdminAiChatToolRunSchema },
  { name: AiAdminToolRun.name, schema: AiAdminToolRunSchema },
  {
    name: FomoV2CanonicalProject.name,
    schema: FomoV2CanonicalProjectSchema,
  },
  {
    name: FomoV2CanonicalProjectSource.name,
    schema: FomoV2CanonicalProjectSourceSchema,
  },
  { name: FomoV2SourceEntity.name, schema: FomoV2SourceEntitySchema },
  { name: FomoV2SourceSnapshot.name, schema: FomoV2SourceSnapshotSchema },
  ...FOMO_V2_MARKET_MODEL_DEFINITIONS,
  ...FOMO_V2_BACKER_MODEL_DEFINITIONS,
  ...FOMO_V2_FUNDING_MODEL_DEFINITIONS,
  ...FOMO_V2_VESTING_MODEL_DEFINITIONS,
  ...FOMO_V2_UNLOCKS_MODEL_DEFINITIONS,
  ...FOMO_V2_IMPORT_CANDIDATE_MODEL_DEFINITIONS,
  ...FOMO_V2_REVIEW_MODEL_DEFINITIONS,
  ...FOMO_V2_PROJECT_DOMAIN_SOURCE_MODEL_DEFINITIONS,
];

export const adminAiConnectionProvider: Provider = {
  provide: getConnectionToken(ADMIN_AI_CONNECTION_NAME),
  useFactory: (adminAiConfig: AdminAiChatConfigService): Connection => {
    const connection = mongoose.createConnection();

    connection.on("connected", () => {
      logger.log(
        `Admin AI Mongo connected to ${adminAiConfig.getDbName()} via ${ADMIN_AI_CONNECTION_NAME}`
      );
    });
    connection.on("error", (error) => {
      logger.warn(`Admin AI Mongo connection error: ${error?.name || "MongoError"}`);
    });

    if (!adminAiConfig.canOpenConnection()) {
      logger.log(
        `Admin AI Mongo connection ${ADMIN_AI_CONNECTION_NAME} is disabled until AI_ADMIN_* points to fomo_dev.`
      );
      return connection;
    }

    connection
      .openUri(adminAiConfig.getMongoUri(), {
        dbName: adminAiConfig.getDbName(),
        maxPoolSize: 5,
        minPoolSize: 0,
        autoIndex: false,
        serverSelectionTimeoutMS: 5000,
        bufferCommands: true,
      })
      .catch((error) => {
        logger.warn(
          `Admin AI Mongo initial connection failed: ${error?.name || "MongoError"}`
        );
      });

    return connection;
  },
  inject: [AdminAiChatConfigService],
};

export const adminAiParserConnectionProvider: Provider = {
  provide: getConnectionToken(ADMIN_AI_PARSER_CONNECTION_NAME),
  useFactory: (adminAiConfig: AdminAiChatConfigService): Connection => {
    const connection = mongoose.createConnection();

    connection.on("connected", () => {
      logger.log(
        `Admin AI parser Mongo connected to ${adminAiConfig.getParserDbName()} via ${ADMIN_AI_PARSER_CONNECTION_NAME}`
      );
    });
    connection.on("error", (error) => {
      logger.warn(
        `Admin AI parser Mongo connection error: ${error?.name || "MongoError"}`
      );
    });

    if (!adminAiConfig.canOpenConnection()) {
      logger.log(
        `Admin AI parser Mongo connection ${ADMIN_AI_PARSER_CONNECTION_NAME} is disabled until AI_ADMIN_* points to parser_new_dev.`
      );
      return connection;
    }

    connection
      .openUri(adminAiConfig.getMongoUri(), {
        dbName: adminAiConfig.getParserDbName(),
        maxPoolSize: 3,
        minPoolSize: 0,
        autoIndex: false,
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
      })
      .catch((error) => {
        logger.warn(
          `Admin AI parser Mongo initial connection failed: ${error?.name || "MongoError"}`
        );
      });

    return connection;
  },
  inject: [AdminAiChatConfigService],
};

export const adminAiModelProviders: Provider[] = ADMIN_AI_MODEL_DEFINITIONS.map(
  (definition) => ({
    provide: getModelToken(definition.name, ADMIN_AI_CONNECTION_NAME),
    useFactory: (connection: Connection) => {
      return (
        connection.models[definition.name] ||
        connection.model(definition.name, definition.schema)
      );
    },
    inject: [getConnectionToken(ADMIN_AI_CONNECTION_NAME)],
  })
);
