import { Logger, Provider } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import mongoose, { Connection } from "mongoose";
import {
  ADMIN_DATA_SYNC_DEV_CONNECTION,
  ADMIN_DATA_SYNC_PROD_CONNECTION,
} from "./admin-data-sync.constants";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";

const logger = new Logger("AdminDataSyncMongo");

export const adminDataSyncProdConnectionProvider: Provider = {
  provide: getConnectionToken(ADMIN_DATA_SYNC_PROD_CONNECTION),
  useFactory: (config: AdminDataSyncConfigService): Connection => {
    logger.log(config.formatConnectionSummary());
    return createConnection({
      connectionName: ADMIN_DATA_SYNC_PROD_CONNECTION,
      dbName: config.getProdDbName(),
      uri: config.getProdMongoUri(),
      canOpen: () => config.canOpenProdConnection(),
    });
  },
  inject: [AdminDataSyncConfigService],
};

export const adminDataSyncDevConnectionProvider: Provider = {
  provide: getConnectionToken(ADMIN_DATA_SYNC_DEV_CONNECTION),
  useFactory: (config: AdminDataSyncConfigService): Connection => {
    return createConnection({
      connectionName: ADMIN_DATA_SYNC_DEV_CONNECTION,
      dbName: config.getDevDbName(),
      uri: config.getDevMongoUri(),
      canOpen: () => config.canOpenDevConnection(),
    });
  },
  inject: [AdminDataSyncConfigService],
};

function createConnection(input: {
  connectionName: string;
  dbName: string;
  uri: string;
  canOpen: () => boolean;
}): Connection {
  const connection = mongoose.createConnection();

  connection.on("connected", () => {
    logger.log(
      `Admin Data Sync Mongo connected to ${input.dbName} via ${input.connectionName}`
    );
  });
  connection.on("error", (error) => {
    logger.warn(
      `Admin Data Sync Mongo connection ${input.connectionName} error: ${
        error?.name || "MongoError"
      }`
    );
  });

  if (!input.canOpen()) {
    logger.log(
      `Admin Data Sync Mongo connection ${input.connectionName} is disabled by routing guard.`
    );
    return connection;
  }

  connection
    .openUri(input.uri, {
      dbName: input.dbName,
      maxPoolSize: 5,
      minPoolSize: 0,
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: true,
    })
    .catch((error) => {
      logger.warn(
        `Admin Data Sync Mongo initial connection ${input.connectionName} failed: ${
          error?.name || "MongoError"
        }`
      );
    });

  return connection;
}
