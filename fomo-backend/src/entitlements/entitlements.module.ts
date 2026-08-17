import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { Capability, CapabilitySchema } from "./models/capability.model";
import { Plan, PlanSchema } from "./models/plan.model";
import { Subscription, SubscriptionSchema } from "./models/subscription.model";
import { Entitlement, EntitlementSchema } from "./models/entitlement.model";
import {
  AiCreditTransaction,
  AiCreditTransactionSchema,
  AiCreditReservation,
  AiCreditReservationSchema,
  AiUsageEvent,
  AiUsageEventSchema,
  AiCreditRule,
  AiCreditRuleSchema,
} from "./models/ai-credit.model";
import {
  AiProviderPrice,
  AiProviderPriceSchema,
  AiGlobalSettings,
  AiGlobalSettingsSchema,
} from "./models/ai-provider-price.model";
import { AiProviderCredential, AiProviderCredentialSchema } from "./models/ai-provider-credential.model";
import { ProviderCredentialsService } from "./ai/provider-credentials.service";
import { AccessResolverService } from "./access-resolver.service";
import { SubscriptionService } from "./subscription.service";
import { AiCreditsService } from "./ai-credits.service";
import { EntitlementsSeedService } from "./entitlements-seed.service";
import { EntitlementsAdminController } from "./entitlements-admin.controller";
import { OpenAiProvider } from "./ai/openai.provider";
import { MockAiProvider } from "./ai/mock.provider";
import { AiProviderPricingService } from "./ai/ai-provider-pricing.service";
import { CreditPricingService } from "./ai/credit-pricing.service";
import { AiAnalyticsService } from "./ai/ai-analytics.service";
import { FomoAiGateway } from "./ai/fomo-ai-gateway.service";
import { FomoKnowledgeProvider } from "./ai/fomo-knowledge.provider";
import { FomoAiService } from "./ai/fomo-ai.service";
import { FomoAiPublicController } from "./fomo-ai-public.controller";
import { ProductsPublicController } from "./products-public.controller";
import { AiConversation, AiConversationSchema, AiMessage, AiMessageSchema } from "./models/ai-conversation.model";
import { NftBenefitRule, NftBenefitRuleSchema } from "./models/nft-benefit-rule.model";
import { NftAccessActivation, NftAccessActivationSchema } from "./models/nft-access-activation.model";
import { NftOwnershipProvider } from "./nft-ownership.provider";
import { NftAccessService } from "./nft-access.service";
import { AccessEngineController } from "./access-engine.controller";
import { MeNftAccessController } from "./me-nft-access.controller";

/**
 * FOMO Monetization Core: Capability -> Plan -> Subscription -> Entitlement ->
 * AccessResolver + AI Credits ledger + FomoAiGateway (metered AI). Commercial/
 * orchestration layer OVER existing modules — does not execute Web3 and does
 * not emulate NFT/staking.
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Capability.name, schema: CapabilitySchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
      { name: AiCreditTransaction.name, schema: AiCreditTransactionSchema },
      { name: AiCreditReservation.name, schema: AiCreditReservationSchema },
      { name: AiUsageEvent.name, schema: AiUsageEventSchema },
      { name: AiCreditRule.name, schema: AiCreditRuleSchema },
      { name: AiProviderPrice.name, schema: AiProviderPriceSchema },
      { name: AiGlobalSettings.name, schema: AiGlobalSettingsSchema },
      { name: AiProviderCredential.name, schema: AiProviderCredentialSchema },
      { name: AiConversation.name, schema: AiConversationSchema },
      { name: AiMessage.name, schema: AiMessageSchema },
      { name: NftBenefitRule.name, schema: NftBenefitRuleSchema },
      { name: NftAccessActivation.name, schema: NftAccessActivationSchema },
    ]),
  ],
  controllers: [EntitlementsAdminController, FomoAiPublicController, ProductsPublicController, AccessEngineController, MeNftAccessController],
  providers: [
    AccessResolverService,
    SubscriptionService,
    AiCreditsService,
    EntitlementsSeedService,
    NftOwnershipProvider,
    NftAccessService,
    OpenAiProvider,
    MockAiProvider,
    AiProviderPricingService,
    CreditPricingService,
    AiAnalyticsService,
    ProviderCredentialsService,
    FomoAiGateway,
    FomoKnowledgeProvider,
    FomoAiService,
  ],
  exports: [
    AccessResolverService,
    AiCreditsService,
    AiProviderPricingService,
    CreditPricingService,
    SubscriptionService,
    FomoAiGateway,
    FomoKnowledgeProvider,
    FomoAiService,
    AiAnalyticsService,
    MongooseModule,
  ],
})
export class EntitlementsModule {}
