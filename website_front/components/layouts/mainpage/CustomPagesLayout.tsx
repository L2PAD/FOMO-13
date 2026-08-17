/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useConnectWallet } from "../../../hooks/useConnectWallet";
import sliceAddress from "../../../helpers/sliceAddress";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import logoImage from "../../../public/static/logo-beta.png";
import DottedBurgerIcon from "../../global/Icons/DottedBurgerIcon";
import WalletAuthSteps from "../../global/WalletAuthSteps/WalletAuthSteps";
import FomoLogo from "../../global/Icons/FomoLogo";
import {
  CloseIcon,
  DiscordIcon,
  EmailIcon,
  InstagramIcon,
  MediumIcon,
  TelegramIcon,
  TikTokIcon,
  TwitterIcon,
  YouTubeIcon,
} from "../../global/Icons";

const SocialIcons = {
  Instagram: InstagramIcon,
  Discord: DiscordIcon,
  Email: EmailIcon,
  Medium: MediumIcon,
  Telegram: TelegramIcon,
  TikTok: TikTokIcon,
  Twitter: TwitterIcon,
  YouTube: YouTubeIcon,
};

interface IProps {
  children: any;
  socialMediaList?: Array<any>;
}

const CustomPagesLayout: FC<IProps> = ({ socialMediaList, children }: any) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const { accounts } = useConnectWallet();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 450);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <Head>
        <title>FOMO</title>
        <meta name="description" content="Welcome to FOMO!" />
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {isOpenMenu && (
        <div className="overlay" onClick={() => setIsOpenMenu(false)} />
      )}
      <div className="main-header-wrapper">
        <div className="main-header-left-wrapper">
          <Link href="/">
            <div className="main-logo-wrapper">
              <FomoLogo />
            </div>
          </Link>
          <div className="social-dropdown-wrapper">
            <button
              className="social-dropdown-button"
              onClick={() => setIsOpenMenu((state) => !state)}
            >
              {isOpenMenu ? <CloseIcon /> : <DottedBurgerIcon />}
            </button>
            {isOpenMenu && (
              <div className="social-menu-dropdown">
                <div className="social-menu-dropdown-navigation-list">
                  <Link href="/evolution">Evolution</Link>
                  <Link href="/fomo-team">Fomo TEAM</Link>
                  <Link href="/about">Fomo info</Link>
                  <Link href="/crypto">Go to web-site</Link>
                </div>
                <div className="social-menu-dropdown-social-list">
                  {socialMediaList?.length ? (
                    socialMediaList.map((item: any, index: number) => {
                      if (isMobile && index >= 4) return null;

                      //@ts-ignore
                      const SocialIcon = SocialIcons[item.name];
                      return (
                        <a
                          key={item.name}
                          target={"_blank"}
                          href={`${item.url}`}
                        >
                          <SocialIcon />
                          {item.name}
                        </a>
                      );
                    })
                  ) : (
                    <></>
                  )}

                  <a
                    className={
                      "social-menu-dropdown-social-list-item whitepaper"
                    }
                    target={"_blank"}
                    href={"https://whitepaper.fomo.wiki/fomo"}
                  >
                    +Whitepaper
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          {accounts.length ? (
            <button>{sliceAddress(accounts[0])}</button>
          ) : (
            <button onClick={() => router.push("/invite")}>
              Connect wallet
            </button>
          )}
        </div>
      </div>
      {children}
      <WalletAuthSteps />
    </>
  );
};

export default CustomPagesLayout;
