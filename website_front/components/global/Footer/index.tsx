/* eslint-disable */
import React, { FC, useContext, useMemo } from "react";
import { useRouter } from "next/router";
import { LayoutContext } from "../Layout";
import moment from "moment";
import Link from "next/link";
import FooterLogo from "../../../assets/icons/fomo-logo/logo-footer.svg";
import {
  DiscordIcon,
  InstagramIcon,
  LinkedinIcon,
  TelegramIcon,
  TikTokIcon,
  TwitterIcon,
  YouTubeIcon,
  EmailIcon,
} from "../Icons/Footer";
import {
  FomoLabel,
  FooterBottom,
  FooterContent,
  FooterWrapper,
  InboxTitle,
  LeftWrapper,
  ListItemsWrapper,
  ListsWrapper,
  ListTitle,
  AppPromo,
  AppPromoHead,
  AppPromoText,
  StoreButtons,
  StoreButton,
} from "./styles";
import Image from "next/image";

const SocialIcons = {
  instagram: InstagramIcon,
  discord: DiscordIcon,
  email: EmailIcon,
  telegramEn: TelegramIcon,
  telegramRu: TelegramIcon,
  tikTok: TikTokIcon,
  twitter: TwitterIcon,
  youtube: YouTubeIcon,
  linktree: LinkedinIcon,
};

const SOCIAL_ORDER = [
  "email",
  "twitter",
  "linktree",
  "telegramEn",
  "telegramRu",
  "discord",
  "youtube",
  "instagram",
  "tikTok",
];

interface IProps {
  layout?: any;
}

const Footer: FC<IProps> = ({ layout }) => {
  const router = useRouter();
  const layoutData = layout ? layout : useContext(LayoutContext);
  const socialList: Array<any> | undefined =
    layoutData?.layout?.footer?.social &&
    Object.entries(layoutData?.layout?.footer?.social);

  const orderedSocialList = useMemo(() => {
    if (!socialList?.length) return [];

    const sorted = socialList
      .filter((item: any) => !!item[1]?.length)
      .sort((a: any, b: any) => {
        const aIndex = SOCIAL_ORDER.indexOf(a[0]);
        const bIndex = SOCIAL_ORDER.indexOf(b[0]);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });

    const seen = new Set<string>();
    return sorted.filter((item: any) => {
      const key = item[0] === "telegramEn" || item[0] === "telegramRu" ? "telegram" : item[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [socialList]);

  const appLayout: any = layoutData?.layout;
  // Footer config is fully admin-managed via CRM → Контент → Футер (footer.apps),
  // with graceful fallback to legacy layout-root fields for backward compatibility.
  const apps: any = appLayout?.footer?.apps || {};
  const intelUrl: string =
    apps?.fomoIntel || appLayout?.intelUrl || "https://i.fomo.cx/";
  const appStoreUrl: string = apps?.appStore || appLayout?.appStoreUrl || intelUrl;
  const googlePlayUrl: string = apps?.googlePlay || appLayout?.googlePlayUrl || intelUrl;
  const fomoAiUrl: string = apps?.fomoAi || appLayout?.fomoAiUrl || "/ai";
  const miniAppUrl: string = apps?.telegramMiniApp || appLayout?.telegramMiniAppUrl || "";
  const whitepaperUrl: string = apps?.whitepaper || appLayout?.whitepaperUrl || "";
  const lightpaperUrl: string = apps?.lightpaper || appLayout?.lightpaperUrl || "";
  const resourcesEnabled: boolean = Boolean(whitepaperUrl || lightpaperUrl);

  return (
    <FooterWrapper>
      <FooterContent>
        <LeftWrapper>
          <a href="/">
            <Image src={FooterLogo} alt="FOMO" className="footer-logo" />
          </a>
          <InboxTitle>
            <span>All crypto in one place</span>
          </InboxTitle>
          <ListItemsWrapper className="social">
            {orderedSocialList.length
              ? orderedSocialList.map((item: any, i: number) => {
                // @ts-ignore
                const Icon: any = SocialIcons[item[0]];

                return (
                  <li key={i}>
                    <a target="_blank" rel="noreferrer" href={`${item[1]}`}>
                      <Icon />
                    </a>
                  </li>
                );
              })
              : null}
            {miniAppUrl ? (
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={miniAppUrl}
                  aria-label="FOMO Telegram Mini App"
                  data-testid="footer-telegram-miniapp"
                  title="Telegram Mini App"
                  style={{ position: "relative", display: "inline-flex" }}
                >
                  <TelegramIcon />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute", right: -6, bottom: -4,
                      fontSize: 7, fontWeight: 800, letterSpacing: 0.3,
                      lineHeight: 1, padding: "2px 3px", borderRadius: 4,
                      background: "#00DD73", color: "#04121f",
                    }}
                  >
                    APP
                  </span>
                </a>
              </li>
            ) : null}
          </ListItemsWrapper>
        </LeftWrapper>

        <ListsWrapper>
          <div className="footer-nav-cols">
            <div>
              <ListTitle variant="p">Products</ListTitle>
              <ListItemsWrapper>
                <li>
                  <a target="_blank" rel="noreferrer" href={intelUrl}>Fomo Intel</a>
                </li>
                <li>
                  <Link href={fomoAiUrl} scroll={true}>Fomo AI</Link>
                </li>
              </ListItemsWrapper>
            </div>

            <div>
              <ListTitle variant="p">Services</ListTitle>
              <ListItemsWrapper>
                <li>
                  <Link href="/" scroll={true}>Crypto</Link>
                </li>
                <li>
                  <Link href="/utility" scroll={true}>Utility</Link>
                </li>
                <li>
                  <Link href="/core/profile" scroll={true}>Core</Link>
                </li>
              </ListItemsWrapper>
            </div>

            {resourcesEnabled ? (
              <div>
                <ListTitle variant="p">Resources</ListTitle>
                <ListItemsWrapper>
                  {whitepaperUrl ? (
                    <li>
                      <a target="_blank" rel="noreferrer" href={whitepaperUrl}>Whitepaper</a>
                    </li>
                  ) : null}
                  {lightpaperUrl ? (
                    <li>
                      <a target="_blank" rel="noreferrer" href={lightpaperUrl}>Lightpaper</a>
                    </li>
                  ) : null}
                </ListItemsWrapper>
              </div>
            ) : null}

            <div>
              <ListTitle variant="p">About Us</ListTitle>
              <ListItemsWrapper>
                <li>
                  <a target="_blank" rel="noreferrer" href="https://i.fomo.cx">About</a>
                </li>
                <li>
                  <button onClick={() => router.push("/legal?type=terms")}>Terms of Use</button>
                </li>
                <li>
                  <button onClick={() => router.push("/legal?type=policy")}>Privacy Policy</button>
                </li>
                <li>
                  <button onClick={() => router.push("/legal?type=disclaimer")}>Disclaimer</button>
                </li>
              </ListItemsWrapper>
            </div>
          </div>

          <AppPromo data-testid="footer-app-promo">
            <AppPromoHead>
              <span className="app-spark" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                </svg>
              </span>
              Get the FOMO Intel app
              <span className="app-pro">PRO</span>
            </AppPromoHead>
            <AppPromoText>
              Deeper analytics, AI-powered forecasts and in-app trading on iOS and Android.
            </AppPromoText>
            <StoreButtons>
              <StoreButton
                href={appStoreUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Download FOMO Intel on the App Store"
                data-testid="footer-app-store"
              >
                <span className="store-ico" aria-hidden="true">
                  <svg width="20" height="22" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                </span>
                <span className="store-copy">
                  <span className="store-top">Download on the</span>
                  <span className="store-name">App Store</span>
                </span>
              </StoreButton>

              <StoreButton
                href={googlePlayUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Get FOMO Intel on Google Play"
                data-testid="footer-google-play"
              >
                <span className="store-ico" aria-hidden="true">
                  <svg width="19" height="21" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l.1.1 9.4-9.4v-.2L3.7 2.2l-.1.1zM16.3 15.4l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.7 2.1-.1-.1zM13.3 12.2l-9.5 9.6c.3.2.7.2 1 0l11.6-6.6-3.1-3z" />
                    <path d="M13.3 11.9 3.8 2.4c.4-.3.7-.3 1.1-.1l11.5 6.6-3.1 3z" opacity="0.85" />
                  </svg>
                </span>
                <span className="store-copy">
                  <span className="store-top">Get it on</span>
                  <span className="store-name">Google Play</span>
                </span>
              </StoreButton>
            </StoreButtons>
          </AppPromo>
        </ListsWrapper>
      </FooterContent>

      <div
        aria-hidden="true"
        data-testid="footer-wordmark"
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: 0.82,
          marginTop: "clamp(8px, 1.5vw, 24px)",
        }}
      >
        <span
          style={{
            display: "block",
            fontWeight: 800,
            fontSize: "clamp(28px, 8vw, 132px)",
            letterSpacing: "0.02em",
            textAlign: "center",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.045) 45%, rgba(255,255,255,0) 85%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          FOMO
        </span>
      </div>

      <FooterBottom>
        <div className="disclaimer-text">
          By using FOMO you acknowledge that markets involve risk and confirm that you have read and accepted the Terms of Use.
          FOMO is an analytical platform and does not provide financial advice. Always do your own research.
        </div>
        <FomoLabel>(c) {moment().format("YYYY")} FOMO</FomoLabel>
      </FooterBottom>
    </FooterWrapper>
  );
};

export default Footer;
