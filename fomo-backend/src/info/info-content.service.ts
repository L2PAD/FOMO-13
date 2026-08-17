import { Injectable } from "@nestjs/common";

import { INFO_VERSION } from "./info.constants";
import { InfoRepositoryService } from "./info-repository.service";
import { InfoBootstrap, InfoDocument } from "./models/info.models";

@Injectable()
export class InfoContentService {
  constructor(private readonly repository: InfoRepositoryService) {}

  async getBootstrap(): Promise<InfoBootstrap> {
    const [
      navigation,
      heroSettings,
      heroButtons,
      about,
      utilitiesSettings,
      utilities,
      utilityNavButtons,
      platform,
      nftSettings,
      ecosystem,
      roadmap,
      evolutionLevels,
      evolutionBadges,
      team,
      partners,
      community,
      faq,
      footer,
      cookieConsent,
      seo,
    ] = await Promise.all([
      this.list("navigation-items"),
      this.one("hero-settings"),
      this.list("hero-buttons"),
      this.one("about-settings"),
      this.one("utilities-settings"),
      this.list("utilities"),
      this.list("utility-nav-buttons"),
      this.one("platform-settings"),
      this.one("nft-mechanics-settings"),
      this.list("drawer-cards"),
      this.one("roadmap"),
      this.list("evolution-levels"),
      this.list("evolution-badges"),
      this.list("team-members"),
      this.list("partners"),
      this.one("community-settings"),
      this.list("faq"),
      this.one("footer-settings"),
      this.one("cookie-consent-settings"),
      this.one("seo-settings"),
    ]);

    const hero = {
      ...heroSettings,
      buttons: heroButtons,
      action_buttons:
        heroButtons.length > 0
          ? heroButtons
          : heroSettings.action_buttons || [],
    };
    const nftMechanics = {
      ...nftSettings,
      items: ecosystem,
    };

    return {
      version: INFO_VERSION,
      updatedAt: this.findLatestTimestamp([
        navigation,
        hero,
        about,
        utilitiesSettings,
        utilities,
        utilityNavButtons,
        platform,
        nftMechanics,
        ecosystem,
        roadmap,
        evolutionLevels,
        evolutionBadges,
        team,
        partners,
        community,
        faq,
        footer,
        cookieConsent,
        seo,
      ]),
      navigation,
      hero,
      about,
      utilities: {
        settings: utilitiesSettings,
        items: utilities,
        navButtons: utilityNavButtons,
      },
      platform,
      nftMechanics,
      ecosystem,
      roadmap,
      evolution: {
        levels: evolutionLevels,
        badges: evolutionBadges,
      },
      team,
      partners,
      community,
      faq,
      footer,
      cookieConsent,
      seo,
    };
  }

  private async list(resource: string): Promise<InfoDocument[]> {
    return this.repository.readResource(resource) as Promise<InfoDocument[]>;
  }

  private async one(resource: string): Promise<InfoDocument> {
    return this.repository.readResource(resource) as Promise<InfoDocument>;
  }

  private findLatestTimestamp(values: unknown[]): string {
    let latest = 0;
    const visit = (value: any): void => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") return;

      const candidate = Date.parse(String(value.updated_at || ""));
      if (Number.isFinite(candidate)) latest = Math.max(latest, candidate);

      Object.values(value).forEach(visit);
    };
    values.forEach(visit);

    return new Date(latest || 0).toISOString();
  }
}
