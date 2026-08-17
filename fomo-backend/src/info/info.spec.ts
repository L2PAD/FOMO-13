import "reflect-metadata";

import {
  GUARDS_METADATA,
  MODULE_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import {
  InfoAdminAnalyticsController,
  InfoAnalyticsController,
} from "./controllers/info-analytics.controller";
import { InfoAssetsController } from "./controllers/info-assets.controller";
import {
  InfoAdminContentController,
  InfoPublicController,
} from "./controllers/info-content.controller";
import { InfoContentService } from "./info-content.service";
import { InfoModule } from "./info.module";
import { InfoWalletController } from "./controllers/info-wallet.controller";
import { InfoRepositoryService } from "./info-repository.service";
import { InfoWalletService } from "./info-wallet.service";
import {
  cloneInfoDefault,
  normalizeInfoPayload,
  sanitizeInfoValue,
  serializeInfoDocument,
} from "./helpers/info-normalization";
import { INFO_SINGLETON_DEFAULTS } from "./info.constants";

describe("FOMO-INFO backend integration", () => {
  it("builds the complete bootstrap envelope without leaking resource naming", async () => {
    const records: Record<string, any> = {
      "navigation-items": [{ id: "nav", updated_at: "2026-01-01T00:00:00Z" }],
      "hero-settings": { title_line1: "FOMO" },
      "hero-buttons": [{ id: "launch" }],
      "about-settings": { title: "About" },
      "utilities-settings": { title_en: "Utilities" },
      utilities: [{ id: "arena" }],
      "utility-nav-buttons": [{ id: "utility-nav" }],
      "platform-settings": { section_title_en: "Platform" },
      "nft-mechanics-settings": { enabled: true },
      "drawer-cards": [{ id: "drawer" }],
      roadmap: { tasks: [] },
      "evolution-levels": [],
      "evolution-badges": [],
      "team-members": [],
      partners: [],
      "community-settings": {},
      faq: [],
      "footer-settings": {},
      "cookie-consent-settings": { enabled: true },
      "seo-settings": { title: "FOMO" },
    };
    const repository = {
      readResource: jest.fn((resource: string) =>
        Promise.resolve(records[resource])
      ),
    } as any;

    const result = await new InfoContentService(repository).getBootstrap();

    expect(Object.keys(result)).toEqual([
      "version",
      "updatedAt",
      "navigation",
      "hero",
      "about",
      "utilities",
      "platform",
      "nftMechanics",
      "ecosystem",
      "roadmap",
      "evolution",
      "team",
      "partners",
      "community",
      "faq",
      "footer",
      "cookieConsent",
      "seo",
    ]);
    expect(result.hero.buttons).toEqual(records["hero-buttons"]);
    expect(result.utilities.navButtons).toEqual(records["utility-nav-buttons"]);
    expect(result.nftMechanics.items).toEqual(records["drawer-cards"]);
    expect(result.updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("clones defaults and keeps defaults independent between requests", () => {
    const first = cloneInfoDefault(INFO_SINGLETON_DEFAULTS["hero-settings"]);
    const second = cloneInfoDefault(INFO_SINGLETON_DEFAULTS["hero-settings"]);
    (first.action_buttons as any[])[0].text = "Changed";

    expect((second.action_buttons as any[])[0].text).toBe("Launch App");
    expect(first).not.toBe(second);
  });

  it("returns canonical defaults through the same normalizer as Mongo records", async () => {
    const cursor: any = {
      sort: jest.fn(() => cursor),
      limit: jest.fn(() => cursor),
      toArray: jest.fn(async () => []),
    };
    const collection = {
      findOne: jest.fn(async () => null),
      find: jest.fn(() => cursor),
    };
    const repository = new InfoRepositoryService({
      db: { collection: jest.fn(() => collection) },
    } as any);

    await expect(
      repository.readSingleton("hero-settings")
    ).resolves.toMatchObject({
      badge_en: "Welcome to FOMO",
      title_line1_en: "The Future of",
    });
    await expect(
      repository.readSingleton("cookie-consent-settings")
    ).resolves.toMatchObject({
      title_en: "Cookie Consent",
      accept_button_text_en: "Accept",
    });
    await expect(
      repository.readSingleton("seo-settings")
    ).resolves.toMatchObject({
      site_title: "FOMO — Crypto Analytics Platform",
      site_keywords: ["crypto", "analytics", "FOMO"],
    });
    const navigation = (await repository.readResource(
      "navigation-items"
    )) as any[];
    expect(navigation[0]).toMatchObject({
      key: "home",
      label_en: "Home",
    });
  });

  it("normalizes legacy aliases to canonical snake_case fields", () => {
    expect(
      normalizeInfoPayload("about-settings", {
        whitepaper_url: "/whitepaper.pdf",
      })
    ).toMatchObject({
      whitepaper_url: "/whitepaper.pdf",
    });
    expect(
      normalizeInfoPayload("platform-settings", {
        services: [{ title_en: "Arena" }],
      })
    ).toMatchObject({
      services_list: [{ title_en: "Arena" }],
    });
    expect(
      normalizeInfoPayload("wallet-profiles", {
        walletAddress: "0xABC",
        termsAccepted: true,
      })
    ).toMatchObject({
      wallet_address: "0xabc",
      terms_accepted: true,
    });
    expect(
      normalizeInfoPayload("faq", {
        question: "What is FOMO?",
        answer: "An ecosystem",
      })
    ).toEqual({
      question_en: "What is FOMO?",
      answer_en: "An ecosystem",
    });
    expect(
      normalizeInfoPayload("hero-buttons", {
        text: "Launch",
        href: "/app",
        variant: "primary",
      })
    ).toEqual({
      text_en: "Launch",
      link: "/app",
      primary: true,
    });
    expect(
      normalizeInfoPayload("cookie-consent-settings", {
        title: "Cookies",
        accept_button_text: "Accept",
        cookie_policy_url: "/cookies",
      })
    ).toEqual({
      title_en: "Cookies",
      accept_button_text_en: "Accept",
      cookie_policy_url: "/cookies",
    });
    expect(
      normalizeInfoPayload("seo-settings", {
        title: "FOMO",
        description: "Crypto intelligence",
        keywords: ["crypto"],
      })
    ).toEqual({
      site_title: "FOMO",
      site_description: "Crypto intelligence",
      site_keywords: ["crypto"],
    });
    expect(
      normalizeInfoPayload("p2p-deals", {
        title: "Deal",
        seller_address: "0xABC",
      })
    ).toMatchObject({
      title_en: "Deal",
      seller_address: "0xabc",
    });
  });

  it("rejects Mongo operators and prototype-pollution keys", () => {
    expect(() => sanitizeInfoValue({ $set: { admin: true } })).toThrow(
      "Unsafe payload key"
    );
    const polluted = JSON.parse('{"__proto__":{"admin":true}}');
    expect(() => sanitizeInfoValue(polluted)).toThrow("Unsafe payload key");
  });

  it("strips Mongo internals from serialized documents", () => {
    expect(
      serializeInfoDocument({
        _id: "mongo-id",
        __v: 1,
        key: "default",
        title_en: "Safe",
      })
    ).toEqual({ title_en: "Safe" });
  });

  it("never lets a public filter expose inactive content", async () => {
    const cursor: any = {
      sort: jest.fn(() => cursor),
      limit: jest.fn(() => cursor),
      toArray: jest.fn(async () => []),
    };
    const collection = {
      find: jest.fn(() => cursor),
    };
    const repository = new InfoRepositoryService({
      db: { collection: jest.fn(() => collection) },
    } as any);

    await repository.readResource("utilities", {
      query: { is_active: "false" },
    });
    expect(collection.find).toHaveBeenCalledWith({
      is_active: { $ne: false },
    });

    await repository.readResource("utilities", {
      admin: true,
      query: { is_active: "false" },
    });
    expect(collection.find).toHaveBeenLastCalledWith({ is_active: false });
  });

  it("attaches a valid invite to an existing unfinished wallet profile", async () => {
    const profile: Record<string, any> = {
      id: "profile-1",
      wallet_address: "0xabc",
      referral_code: "OWNCODE",
      invite_code_used: null,
    };
    const walletCollection = {
      findOne: jest.fn(async () => profile),
      updateOne: jest.fn(async (_filter: unknown, update: any) => {
        Object.assign(profile, update.$set);
        return { matchedCount: 1 };
      }),
    };
    const inviteCollection = {
      updateOne: jest.fn(async () => ({ matchedCount: 1 })),
    };
    const service = new InfoWalletService({
      db: {
        collection: jest.fn((name: string) =>
          name === "info_wallet_profiles"
            ? walletCollection
            : inviteCollection
        ),
      },
    } as any);

    await expect(
      service.registerUser({
        wallet_address: "0xABC",
        invite_code: "welcome",
      })
    ).resolves.toMatchObject({
      wallet_address: "0xabc",
      invite_code_used: "WELCOME",
    });
    expect(inviteCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ code: "WELCOME" }),
      expect.objectContaining({ $inc: { used_count: 1 } })
    );
    expect(walletCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ wallet_address: "0xabc" }),
      expect.objectContaining({
        $set: expect.objectContaining({ invite_code_used: "WELCOME" }),
      })
    );
  });

  it("guards admin resources with the main JWT guard and role metadata", () => {
    expect(Reflect.getMetadata("roles", InfoAdminContentController)).toEqual([
      "admin",
      "moderator",
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, InfoAdminContentController)
    ).toContain(JwtAuthGuard);
    expect(Reflect.getMetadata("roles", InfoAssetsController)).toEqual([
      "admin",
      "moderator",
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, InfoAssetsController)
    ).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        InfoWalletController.prototype.getUser
      )
    ).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        InfoWalletController.prototype.getReferrals
      )
    ).toContain(JwtAuthGuard);
    expect(Reflect.getMetadata(PATH_METADATA, InfoPublicController)).toBe(
      "info"
    );
  });

  it("registers static controllers before generic resource controllers", () => {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      InfoModule
    ) as any[];

    expect(controllers.indexOf(InfoAssetsController)).toBeLessThan(
      controllers.indexOf(InfoAdminContentController)
    );
    expect(controllers.indexOf(InfoAnalyticsController)).toBeLessThan(
      controllers.indexOf(InfoPublicController)
    );
    expect(controllers.indexOf(InfoAdminAnalyticsController)).toBeLessThan(
      controllers.indexOf(InfoAdminContentController)
    );
  });
});
