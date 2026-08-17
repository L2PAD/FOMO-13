import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Layout, LayoutDocument } from './models/layout.model';
import { SocialMedia, SocialMediaDocument } from './models/socialmedia.model';
import { LayoutDto } from './dto/layout.dto';
import { FooterDto } from './dto/footer.dto';
import { SocialMediaDto } from './dto/socialmedia.dto';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { BannerDto } from './dto/banner.dto';
import { FilesService } from 'src/files/files.service';
import { NewsService } from '../news/news.service';

@Injectable()
export class LayoutService {
    constructor(
        @InjectModel(Layout.name) private readonly layoutModel: Model<LayoutDocument>,
        @InjectModel(SocialMedia.name) private readonly socialMediaModel: Model<SocialMediaDocument>,
        private readonly coinMarketCapService: CoinMarketCapService,
        private readonly newsService: NewsService
    ) { }

    async getLayout(): Promise<LayoutDto> {
        const layout = await this.layoutModel.findOne().lean()

        const statistics = await this.coinMarketCapService.getStatistics()

        const updates: any[] = await this.newsService.getFomoUpdates()

        const merged: any = { ...this.defaultLayout(), ...(layout || {}), header: statistics, updates }
        // Always return a valid promo config (stored value may be null / partial).
        const promoSeed = layout?.promo || (layout?.intelUrl ? { intel: { url: layout.intelUrl } } : null)
        merged.promo = this.sanitizePromo(promoSeed)
        if (merged.promo?.intel?.url) merged.intelUrl = merged.promo.intel.url
        return merged
    }

    async getSocialMedia(): Promise<SocialMediaDto> {
        const layout = await this.socialMediaModel.findOne().lean()

        return layout || { items: [] }
    }

    async editFooter(footer: FooterDto): Promise<FooterDto> {
        const layout = await this.layoutModel.findOne()

        if (!layout) {
            const newLayout = await this.layoutModel.create({ header: {}, footer })

            return newLayout.footer
        }

        layout.footer = footer

        await layout.save()

        return footer
    }

    async editBanner(banner: BannerDto): Promise<BannerDto> {        const layout = await this.layoutModel.findOne()

        if (!layout) {
            const newLayout = await this.layoutModel.create({ header: {}, banner })

            return newLayout.banner
        }

        layout.banner = banner

        await layout.save()

        return banner
    }

    async editIntel(intelUrl: string): Promise<{ intelUrl: string }> {
        const cleanUrl = (intelUrl || '').trim()

        const layout = await this.layoutModel.findOne()

        if (!layout) {
            const newLayout = await this.layoutModel.create({ header: {}, intelUrl: cleanUrl })

            return { intelUrl: newLayout.intelUrl }
        }

        layout.intelUrl = cleanUrl

        await layout.save()

        return { intelUrl: cleanUrl }
    }

    /**
     * Promo pills shown in the site header (managed from CRM → Реклама → «Баннер рекламы»).
     * Two pills: FOMO AI (green, internal → membership/AI) and FOMO Intel (black,
     * external URL). Admin controls which pill(s) show and the rotation interval.
     */
    async editPromo(promo: any): Promise<any> {
        const clean = this.sanitizePromo(promo)

        const layout = await this.layoutModel.findOne()

        if (!layout) {
            const created = await this.layoutModel.create({ header: {}, promo: clean, intelUrl: clean.intel.url })
            return created.promo
        }

        layout.promo = clean
        // Keep the legacy intelUrl in sync so old consumers still resolve the external link.
        if (clean.intel?.url) layout.intelUrl = clean.intel.url
        layout.markModified('promo')
        await layout.save()

        return clean
    }

    private sanitizePromo(p: any): any {
        const d = this.defaultPromo()
        const src = p && typeof p === 'object' ? p : {}
        const mode = ['both', 'ai', 'intel'].includes(src.mode) ? src.mode : d.mode
        const rot = Number(src.rotateSeconds)
        const rotateSeconds = [5, 10, 15].includes(rot) ? rot : d.rotateSeconds
        const pill = (s: any, def: any) => ({
            enabled: typeof s?.enabled === 'boolean' ? s.enabled : def.enabled,
            label: (typeof s?.label === 'string' && s.label.trim()) ? s.label.trim().slice(0, 40) : def.label,
            subtitle: (typeof s?.subtitle === 'string') ? s.subtitle.trim().slice(0, 120) : def.subtitle,
            url: (typeof s?.url === 'string' && s.url.trim()) ? s.url.trim().slice(0, 2048) : def.url,
        })
        return {
            mode,
            rotateSeconds,
            ai: pill(src.ai, d.ai),
            intel: pill(src.intel, d.intel),
        }
    }

    private defaultPromo(): any {
        return {
            mode: 'both',
            rotateSeconds: 10,
            ai: { enabled: true, label: 'FOMO AI', subtitle: 'Your crypto research copilot', url: '/utility/ai' },
            intel: { enabled: true, label: 'FOMO Intel', subtitle: 'Pro-grade market intelligence', url: 'https://i.fomo.cx/' },
        }
    }

    async editSocialMedia(socialMediaDto: SocialMediaDto): Promise<SocialMediaDto> {
        const socialMedia = await this.socialMediaModel.findOne()

        if (!socialMedia) {
            const newSocialMedia = await this.socialMediaModel.create(socialMediaDto)

            return newSocialMedia
        }

        socialMedia.items = socialMediaDto.items

        await socialMedia.save()

        return socialMedia
    }

    private defaultLayout(): LayoutDto {
        return {
            header: {},
            intelUrl: "https://i.fomo.cx/",
            promo: this.defaultPromo(),
            appStoreUrl: "",
            googlePlayUrl: "",
            footer: {
                social: {
                    email: "",
                    twitter: "",
                    telegramRu: "",
                    telegramEn: "",
                    youtube: "",
                },
                legal: {
                    policy: "",
                    terms: "",
                    disclaimer: "",
                },
                apps: {
                    telegramMiniApp: "",
                    appStore: "",
                    googlePlay: "",
                    fomoIntel: "",
                    fomoAi: "",
                    whitepaper: "",
                    lightpaper: "",
                },
            },
            banner: {
                text: "",
                link: "",
                isVisible: false,
            },
            updates: [],
        }
    }

}
