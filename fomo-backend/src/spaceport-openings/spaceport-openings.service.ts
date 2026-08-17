import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetadataService } from 'src/metadata/metadata.service';
import { CreateSpaceportOpeningDto } from './dto/create-spaceport-opening.dto';
import { SpaceportOpening } from './model/spaceport-opening.model';

@Injectable()
export class SpaceportOpeningsService {
  constructor(
    @InjectModel(SpaceportOpening.name)
    private readonly spaceportOpeningModel: Model<SpaceportOpening>,
    private readonly metadataService: MetadataService,
  ) {
    // this.removeAll().catch(err => {
    //   console.error('Error clearing spaceport openings on startup:', err);
    // });
  }

  private async removeAll() {
    await this.spaceportOpeningModel.deleteMany({});    
  }

  async create(dto: CreateSpaceportOpeningDto) {
    this.validateCreatePayload(dto);

    const openedAt = dto.openedAt ? new Date(dto.openedAt) : new Date();
    if (Number.isNaN(openedAt.getTime())) {
      throw new BadRequestException('Invalid openedAt');
    }

    const tokenId = Math.trunc(Number(dto.tokenId));
    const walletAddress = String(dto.walletAddress || '').trim().toLowerCase();
    const nftAddress = String(dto.nftAddress || '').trim().toLowerCase() || undefined;

    const mergedMetadata = await this.enrichMetadata(
      tokenId,
      (dto.metadata || {}) as Record<string, any>,
    );

    const saved = await this.spaceportOpeningModel.findOneAndUpdate(
      {
        tokenId,
        nftAddress: nftAddress || null,
      },
      {
        walletAddress,
        nftAddress,
        tokenId,
        txHash: String(dto.txHash || '').trim().toLowerCase() || undefined,
        openedAt,
        metadata: mergedMetadata,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      isSuccess: true,
      opening: this.serialize(saved),
    };
  }

  async getWalletOpenings(walletAddress: string, nftAddress?: string) {
    const normalizedWallet = String(walletAddress || '').trim().toLowerCase();
    if (!normalizedWallet) {
      throw new BadRequestException('walletAddress is required');
    }

    const normalizedNftAddress = String(nftAddress || '').trim().toLowerCase();
    const query: Record<string, any> = {
      walletAddress: normalizedWallet,
    };

    if (normalizedNftAddress) {
      query.nftAddress = normalizedNftAddress;
    }

    const openings = await this.spaceportOpeningModel
      .find(query)
      .sort({ openedAt: -1, createdAt: -1 })
      .lean();

    const enrichedOpenings = await Promise.all(
      openings.map(async item => ({
        ...item,
        metadata: await this.enrichMetadata(Number(item.tokenId), item.metadata || {}),
      })),
    );

    return {
      isSuccess: true,
      walletAddress: normalizedWallet,
      openedTokenIds: enrichedOpenings.map(item => Number(item.tokenId)),
      openings: enrichedOpenings.map(item => this.serialize(item)),
    };
  }

  private async getMockMetadata(tokenId: number): Promise<Record<string, any> | null> {
    try {
      return (await this.metadataService.getNftData(tokenId)) as Record<string, any>;
    } catch {
      return null;
    }
  }

  private async enrichMetadata(
    tokenId: number,
    metadata: Record<string, any>,
  ): Promise<Record<string, any>> {
    const metadataFromSmart = metadata || {};
    const mockMetadata = await this.getMockMetadata(tokenId);
    const smartRarityName = String(metadataFromSmart?.['rarityName'] || '').trim();
    const mockRarityName = this.extractMockRarityName(mockMetadata);
    const shouldOverrideRarityName =
      !smartRarityName || /premint|pre-mint/i.test(smartRarityName);
    const smartAttributes = Array.isArray(metadataFromSmart?.['attributes'])
      ? metadataFromSmart['attributes']
      : [];
    const mockAttributes = Array.isArray(mockMetadata?.['attributes'])
      ? mockMetadata['attributes']
      : [];

    return {
      ...metadataFromSmart,
      name: String(metadataFromSmart?.['name'] || mockMetadata?.['name'] || '').trim(),
      description: String(
        metadataFromSmart?.['description'] || mockMetadata?.['description'] || '',
      ).trim(),
      attributes: smartAttributes.length > 0 ? smartAttributes : mockAttributes,
      rarityName: shouldOverrideRarityName
        ? String(mockRarityName || smartRarityName || '').trim()
        : smartRarityName,
      image: String(mockMetadata?.image || metadataFromSmart?.image || '').trim(),
    };
  }

  private extractMockRarityName(
    metadata: Record<string, any> | null,
  ): string {
    if (!metadata || !Array.isArray(metadata.attributes)) {
      return '';
    }

    const rarityAttribute = metadata.attributes.find((attribute: any) => {
      return String(attribute?.trait_type || '').trim().toLowerCase() === 'rarity';
    });

    return String(rarityAttribute?.value || '').trim();
  }

  private serialize(opening: any) {
    return {
      _id: String(opening._id),
      walletAddress: String(opening.walletAddress || ''),
      nftAddress: String(opening.nftAddress || ''),
      tokenId: Number(opening.tokenId || 0),
      txHash: String(opening.txHash || ''),
      openedAt: opening.openedAt ? new Date(opening.openedAt).toISOString() : null,
      metadata: opening.metadata || {},
      createdAt: opening.createdAt ? new Date(opening.createdAt).toISOString() : null,
      updatedAt: opening.updatedAt ? new Date(opening.updatedAt).toISOString() : null,
    };
  }

  private validateCreatePayload(dto: CreateSpaceportOpeningDto): void {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Payload is required');
    }

    if (!dto.walletAddress || String(dto.walletAddress).trim().length < 10) {
      throw new BadRequestException('walletAddress is required');
    }

    const tokenId = Number(dto.tokenId);
    if (!Number.isInteger(tokenId) || tokenId < 0) {
      throw new BadRequestException('tokenId must be a valid integer');
    }
  }
}
