import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MoneyLedgerEntry, MoneyLedgerEntrySchema } from "./models/money-ledger.model";
import { Purchase, PurchaseSchema } from "./models/purchase.model";
import { MoneyService } from "./money.service";
import { MoneySagaService } from "./money-saga.service";
import { MoneyController } from "./money.controller";
import { IntegrationsController } from "./integrations.controller";
import { MoneyAdminController } from "./money-admin.controller";
import { WithdrawalExecutorService } from "./withdrawal-executor.service";
import { MoneyAcquiringService } from "./money-acquiring.service";
import { MoneyChainService } from "./money-chain.service";
import { MoneyWorkerService } from "./money-worker.service";
import { AdminPermissionsService } from "./admin-permissions.service";
import { MoneyPermissionGuard } from "./money-permission.guard";
import { EntitlementsModule } from "../entitlements/entitlements.module";
import { Deposit, DepositSchema } from "../deposits/model/deposit.model";
import { Withdraw, WithdrawSchema } from "../withdraws/model/withdraw.model";

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: MoneyLedgerEntry.name, schema: MoneyLedgerEntrySchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Deposit.name, schema: DepositSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
    ]),
    EntitlementsModule, // SubscriptionService + Plan model (via exported MongooseModule)
  ],
  controllers: [MoneyController, MoneyAdminController, IntegrationsController],
  providers: [MoneyService, MoneySagaService, MoneyWorkerService, WithdrawalExecutorService, MoneyAcquiringService, MoneyChainService, AdminPermissionsService, MoneyPermissionGuard],
  exports: [MoneyService, MoneySagaService],
})
export class MoneyModule {}
