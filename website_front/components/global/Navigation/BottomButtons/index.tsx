import { ArrowLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import React, { useEffect, useState } from "react";
import Crypto from "../../Icons/Crypto";
import EarlyLand from "../../Icons/EarlyLand";
import GemsLab from "../../Icons/GemsLab";
import Rocket from "../../Icons/Rocket";
import { ButtonsWrapper, NavMenuWrapper } from "./style";
import { getIcon } from "..";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  cryptoLinks,
  dashboardLinks,
  earlylandLinks,
  gemslabLinks,
  NavigationLinkItem,
  utilityLinks,
} from "./utils";
import { useTranslation } from "i18n";

const getCurrentLocation = (pathname: string) => {
  if (pathname === "/") {
    return "crypto";
  }
  if (pathname.includes("/earlyland")) {
    return "earlyland";
  }
  if (pathname.includes("/gemslab")) {
    return "gemsLab";
  }
  if (pathname.includes("/core")) {
    return "gemsLab";
  }
  if (pathname.includes("/utility")) {
    return "utility";
  }
  if (pathname.includes("/dashboard")) {
    return "dashboard";
  }

  return "default";
};

const filterVisibleLinks = (
  links: NavigationLinkItem[]
): NavigationLinkItem[] =>
  links
    .filter((link) => !link.disabled)
    .map((link) => ({
      ...link,
      tabs: link.tabs?.filter((tab) => !tab.disabled),
    }))
    .filter((link) => link.link || link.tabs?.length);

export const BottomButtons = () => {
  const router = useRouter();
  const { translateText } = useTranslation();
  const [activeButton, setActiveButton] =
    useState<string>(() => getCurrentLocation(router.asPath || router.pathname || ""));

  const [openedMenu, setOpenedMenu] = useState<string | null>(null);

  const isCryptoActive =
    (activeButton === "crypto" && !openedMenu) || openedMenu === "crypto";
  const isEarlyLandActive =
    (activeButton === "earlyland" && !openedMenu) || openedMenu === "earlyland";
  const isGemsLabActive =
    (activeButton === "gemsLab" && !openedMenu) || openedMenu === "gemsLab";
  const isRocketActive =
    (activeButton === "utility" && !openedMenu) || openedMenu === "utility";
  const isLayoutDashboardActive =
    (activeButton === "dashboard" && !openedMenu) || openedMenu === "dashboard";

  const [currentPagesList, setCurrentPagesList] = useState<NavigationLinkItem[]>(
    () => {
      switch (openedMenu) {
        case "crypto":
          return cryptoLinks;
        case "earlyland":
          return earlylandLinks;
        case "gemsLab":
          return gemslabLinks;
        case "utility":
          return filterVisibleLinks(utilityLinks);
        case "dashboard":
          return dashboardLinks;
        default:
          return [];
      }
    }
  );

  useEffect(() => {
    setActiveButton(getCurrentLocation(router.asPath || router.pathname || ""));
  }, [router.asPath, router.pathname]);

  useEffect(() => {
    setCurrentPagesList(() => {
      switch (openedMenu) {
        case "crypto":
          return cryptoLinks;
        case "earlyland":
          return earlylandLinks;
        case "gemsLab":
          return gemslabLinks;
        case "utility":
          return filterVisibleLinks(utilityLinks);
        case "dashboard":
          return dashboardLinks;
        default:
          return [];
      }
    });
  }, [openedMenu]);

  return (
    <>
      <ButtonsWrapper>
        <button
          className={isCryptoActive ? "active" : ""}
          onClick={() => {
            setOpenedMenu("crypto");
          }}
        >
          <Crypto />
          <span>{translateText("Crypto")}</span>
        </button>
        <button
          className={isEarlyLandActive ? "active" : ""}
          onClick={() => {
            setOpenedMenu("earlyland");
          }}
        >
          <EarlyLand />
          <span>{translateText("EarlyLand")}</span>
        </button>{" "}
        <button
          className={isGemsLabActive ? "active" : ""}
          onClick={() => {
            setOpenedMenu("gemsLab");
          }}
        >
          <GemsLab />
          <span>GemsLab</span>
        </button>{" "}
        <button
          className={isRocketActive ? "active" : ""}
          onClick={() => {
            setOpenedMenu("utility");
          }}
        >
          <Rocket />
          <span>{translateText("Utility")}</span>
        </button>{" "}
        <button
          className={isLayoutDashboardActive ? "active" : ""}
          onClick={() => {
            setOpenedMenu("dashboard");
          }}
        >
          <LayoutDashboard />
          <span>{translateText("Dash")}</span>
        </button>
      </ButtonsWrapper>
      {openedMenu && (
        <NavMenuWrapper>
          <div className="header">
            <button onClick={() => setOpenedMenu(null)}>
              <ArrowLeft />
            </button>
            <h2>{translateText(openedMenu)}</h2>
          </div>
          <div className="pagesList">
            {currentPagesList.map((page) => (
              <div key={page.title} className="pageItem">
                {page.tabs?.length && page.tabs?.length > 0 ? (
                  <div className="withTabs">
                    <span>{translateText(page.title)}</span>
                    <div className="tabsList">
                      {page.tabs.map((tab) =>
                        tab.disabled ? (
                          <div key={tab.link} className="disabled-link">
                            {tab.icon}
                            <span>{translateText(tab.title)}</span>
                            <ChevronRight className="chevron-icon" />
                          </div>
                        ) : (
                          <Link
                            key={tab.link}
                            href={tab.link}
                            onClick={() => {
                              setOpenedMenu(null);
                            }}
                          >
                            {tab.icon}
                            <span>{translateText(tab.title)}</span>
                            <ChevronRight className="chevron-icon" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                ) : page.disabled ? (
                  <div className="disabled-link">
                    {page.icon}
                    <span>{translateText(page.title)}</span>
                    <ChevronRight className="chevron-icon" />
                  </div>
                ) : (
                  <Link
                    href={page.link}
                    onClick={() => {
                      setOpenedMenu(null);
                    }}
                  >
                    {page.icon}
                    <span>{translateText(page.title)}</span>
                    <ChevronRight className="chevron-icon" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </NavMenuWrapper>
      )}
    </>
  );
};
