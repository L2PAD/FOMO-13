import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SpaceportControlController } from './spaceport-control.controller';
import { SpaceportControlService } from './spaceport-control.service';
import { SpaceportChainService } from './spaceport-chain.service';
import {
  SpaceportChainEvent,
  SpaceportChainEventSchema,
  SpaceportIndexCursor,
  SpaceportIndexCursorSchema,
} from './model/spaceport-chain-event.model';
import {
  SpaceportAdminAction,
  SpaceportAdminActionSchema,
} from './model/spaceport-admin-action.model';
import {
  SpaceportPurchase,
  SpaceportPurchaseSchema,
} from '../spaceport-purchases/model/spaceport-purchase.model';
import {
  SpaceportOpening,
  SpaceportOpeningSchema,
} from '../spaceport-openings/model/spaceport-opening.model';
import {
  SpaceportFusion,
  SpaceportFusionSchema,
} from '../spaceport-fusions/model/spaceport-fusion.model';
import {
  NftAccessActivation,
  NftAccessActivationSchema,
} from '../entitlements/models/nft-access-activation.model';
import { User, UserSchema } from '../user/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpaceportChainEvent.name, schema: SpaceportChainEventSchema },
      { name: SpaceportIndexCursor.name, schema: SpaceportIndexCursorSchema },
      { name: SpaceportAdminAction.name, schema: SpaceportAdminActionSchema },
      { name: SpaceportPurchase.name, schema: SpaceportPurchaseSchema },
      { name: SpaceportOpening.name, schema: SpaceportOpeningSchema },
      { name: SpaceportFusion.name, schema: SpaceportFusionSchema },
      { name: NftAccessActivation.name, schema: NftAccessActivationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [SpaceportControlController],
  providers: [SpaceportControlService, SpaceportChainService],
  exports: [SpaceportControlService, SpaceportChainService],
})
export class SpaceportControlModule {}
