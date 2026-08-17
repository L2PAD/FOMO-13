/* eslint-disable */
import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import copy from "clipboard-copy";
import Image from "next/image";
import { useDisconnect } from "@reown/appkit/react";
import {
  AuthContext,
  LayoutContext,
  LoadingContext,
  MessagesContext,
} from "../Layout";
import UserAvatar from "../common/UserAvatar";
import Typography from "../common/Typography";
import SettingsIcon from "../Icons/SettingsIcon";
import {
  CloseIcon,
  CopyIcon,
  TelegramIcon,
} from "../Icons";
import DefaultWalletIcon from "../Icons/DefaultWalletIcon";
import TaskIcon from "../Icons/TaskIcon";
import SupportIcon from "../Icons/SupportIcon";
import SingInIcon from "../Icons/SingInIcon";
import FeedIcon from "../Icons/FeedIcon";
import RocketIcon from "../Icons/RocketIcon";
import ClockIcon from "../Icons/ClockIcon";
import CartIcon from "../Icons/CartIcon";
import InviteIcon from "../Icons/InviteIcon";
import QuestionMarkIcon from "../Icons/QuestionMarkIcon";
import copyRefLink from "../../../http/user/copyRefLink";
import logOut from "../../../http/auth/logOut";
import OpenEyeIcon from "../../../assets/icons/nav/eye-icon.png";
import ClosedEyeIcon from "../../../assets/icons/left-nav/closed-eye.png";
import imageLoader from "../../../helpers/imageLoader";
import updateUser from "../../../http/user/updateUser";
import { TELEGRAM_LINK } from "../../../config/api";
import {
  DropdownRowWithLink,
  DropdownRow,
  UserDropdownWrapper,
  UserDropdownRow,
  DropdownNumber,
  EyeIcon,
  CreateButtonsWrapper,
  DropdownBlockWrapper,
  DropdownBlockList,
  DropdownBlockButton,
  LogOutBtn,
  SectionWrapper,
  SectionTitle,
  UserDetails,
} from "./styles";
import CreateButton from "../common/CreateButton";
import ArrowSelectIcon from "../Icons/ArrowSelectIcon";
import BalanceComponent from "./BalanceComponent";
import WalletCopyChip from "./WalletCopyChip";
import VerifyIcon from "../Icons/VerifyIcon";
import BuyFomoNftBanner from "./BuyFomoNftBanner";
import styled from "styled-components";
import fetchBazaarActivity, {
  EMPTY_BAZAAR_ACTIVITY,
} from "../../../http/deals/fetchBazaarActivity";
import { IFomoNotification, STORAGE_UPDATES_KEY } from "../NavBar";
import { useTranslation } from "i18n";
import {
  fetchSocialNotifications,
  markSocialRead,
  ISocialNotification,
} from "../../../http/notifications/socialNotifications";

const TelegramConnectButton = styled.button`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: #229ed9;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.85;
    transform: translateY(1px);
  }

  svg {
    flex-shrink: 0;
  }
`;

const formatCompactNumber = (value?: number): string => {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue)) return "0";

  return numberValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const formatCurrencyLabel = (currency: string, value: number): string => {
  const formattedValue = formatCompactNumber(value);

  if (currency === "USD") return `$${formattedValue}`;
  if (currency === "EUR") return `€${formattedValue}`;
  if (currency === "UAH") return `₴${formattedValue}`;

  return `${formattedValue} ${currency}`;
};

const formatProfitUsd = (value?: number): string => {
  const profit = Number(value || 0);
  const sign = profit < 0 ? "-" : "";

  return `${sign}$${formatCompactNumber(Math.abs(profit))}`;
};

const getStoredSeenUpdateIds = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(STORAGE_UPDATES_KEY);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

interface Props {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenAuthModal: () => void;
  onOpenSupportModal: () => void;
  onOpenMultiWalletModal: () => void;
  onOpenCreateProject: () => void;
  onOpenCreatePerson: () => void;
  onOpenCreateFund: () => void;
  onOpenCreateNews: () => void;
}

const UserDropdownPanel = ({
  isOpen,
  setIsOpen,
  onOpenAuthModal,
  onOpenSupportModal,
  onOpenMultiWalletModal,
  onOpenCreateProject,
  onOpenCreatePerson,
  onOpenCreateFund,
  onOpenCreateNews,
}: Props) => {
  const { translateText } = useTranslation();
  const { disconnect } = useDisconnect();
  const { messages } = useContext(MessagesContext);
  const { layout } = useContext(LayoutContext);
  const { userData, refetchAuthData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [seenUpdateIds, setSeenUpdateIds] = useState<string[]>([]);
  const [socialNotifs, setSocialNotifs] = useState<ISocialNotification[]>([]);
  const [isStatistics, setIsStatistics] = useState(true);
  const [isOtcP2P, setIsOtcP2P] = useState(true);
  const router = useRouter();
  const {
    data: bazaarActivityData,
    isLoading: isBazaarActivityLoading,
    isError: isBazaarActivityError,
  } = useQuery(
    ["bazaar-activity", userData?._id],
    fetchBazaarActivity,
    {
      enabled: Boolean(isOpen && userData?._id),
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  );
  const bazaarActivity = bazaarActivityData?.data || EMPTY_BAZAAR_ACTIVITY;
  const updatesCount = Array.isArray(layout?.updates)
    ? layout.updates.filter(
      (update: IFomoNotification) =>
        !seenUpdateIds.includes(String(update._id))
    ).length
    : 0;
  const bazaarMetricValue = (value?: number): string => {
    if (isBazaarActivityLoading) return "...";
    if (isBazaarActivityError || bazaarActivityData?.isSuccess === false) return "-";

    return formatCompactNumber(value);
  };

  const bazaarProfitValue = (value?: number): string => {
    if (isBazaarActivityLoading) return "...";
    if (isBazaarActivityError || bazaarActivityData?.isSuccess === false) return "-";

    return formatProfitUsd(value);
  };

  useEffect(() => {
    const syncSeenUpdateIds = () => setSeenUpdateIds(getStoredSeenUpdateIds());

    syncSeenUpdateIds();
    window.addEventListener("storage", syncSeenUpdateIds);
    window.addEventListener("fomo-updates-seen-change", syncSeenUpdateIds);

    return () => {
      window.removeEventListener("storage", syncSeenUpdateIds);
      window.removeEventListener("fomo-updates-seen-change", syncSeenUpdateIds);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !userData?._id) return;
    let active = true;
    fetchSocialNotifications(20).then((rows) => {
      if (!active) return;
      setSocialNotifs(rows);
      if (rows.some((r) => !r.read)) {
        markSocialRead().then(() => {
          if (typeof window !== "undefined")
            window.dispatchEvent(new Event("fomo-social-seen"));
        });
      }
    });
    return () => { active = false; };
  }, [isOpen, userData?._id]);

  const notifLabel: Record<string, string> = {
    REPOST: "reposted your post",
    REPLY: "replied to your post",
    LIKE: "liked your post",
    FOLLOW: "started following you",
    QUOTE: "quoted your post",
  };

  const copyReferralLink = async (): Promise<void> => {
    const refLink = await copyRefLink();

    copy(refLink);

    toast.success(
      <div>
        <h3>{translateText("Copied!")}</h3>
        <p>{translateText("You have succesfuly copied a referral link")}</p>
      </div>
    );
  };

  const copyFomoId = async (): Promise<void> => {
    copy(String(userData.fomoId || 0));

    toast.success(
      <div>
        <h3>{translateText("Copied!")}</h3>
        <p>{translateText("You have succesfuly copied your FOMO ID")}</p>
      </div>
    );
  };

  const updateMenuState = async (): Promise<void> => {
    await updateUser({ isMenuDisplay: !userData.isMenuDisplay });
    await refetchAuthData();
  };

  const logout = async () => {
    loadingStateHandler(true);
    await disconnect();
    logOut();
    await refetchAuthData();
    loadingStateHandler(false);
    router.push("/");
  };

  const connectTelegram = (): void => {
    if (typeof window === "undefined") return;

    localStorage.setItem("telegram-connect-redirect", router.asPath || "/core/profile");
    window.open(`${TELEGRAM_LINK}?start=connect`, "_blank", "noopener,noreferrer");
  };

  return (
    <UserDropdownWrapper isOpen={isOpen}>

      <SectionWrapper>
        <UserDropdownRow>
          <div>
            <UserAvatar
              avatar={
                !userData.photo
                  ? userData?.twitterData?.photo
                    ? //@ts-ignore
                    userData?.twitterData?.photo
                    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  : imageLoader(userData.photo)
              }
              name="username"
              size="medium"
              variant="default"
            />
            <UserDetails >
              <div>
                {userData?.twitterData?.name}
                {
                  userData?.verificationStatus
                    ?
                    <VerifyIcon />
                    :
                    <></>
                }
              </div>
              <span>
                {
                  userData?.verificationStatus
                    ?
                    translateText('Verified member')
                    :
                    translateText('Unverified member')
                }
              </span>
            </UserDetails>

          </div>
          <button onClick={() => setIsOpen(false)}>
            <CloseIcon fill="#738094" />
          </button>
        </UserDropdownRow>
        <WalletCopyChip address={userData?.wallet} />
      </SectionWrapper>

      <SectionWrapper>
        <BalanceComponent />
      </SectionWrapper>

      <SectionWrapper>
        <SectionTitle>{translateText("NOTIFICATIONS")}</SectionTitle>
        <div data-testid="wallet-notif-list" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 240, overflowY: "auto" }}>
          {socialNotifs.length === 0 ? (
            <div style={{ padding: "14px 4px", color: "#94a3b8", fontSize: 13 }}>
              {translateText("No notifications yet")}
            </div>
          ) : (
            socialNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => { if (n.topicId) router.push(`/utility/news?topic=${n.topicId}`); setIsOpen(false); }}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px",
                  borderRadius: 10, cursor: "pointer",
                  background: n.read ? "#fff" : "#f2fbf8", border: "1px solid #eef1f4",
                }}
              >
                <span style={{
                  flex: "0 0 auto", width: 8, height: 8, marginTop: 6, borderRadius: 999,
                  background: n.type === "LIKE" ? "#ef4444" : n.type === "REPLY" ? "#3b82f6" : n.type === "FOLLOW" ? "#8b5cf6" : "#05a584",
                }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#1a1d26" }}>
                    <b>{n.actor?.name || "Someone"}</b> {notifLabel[n.type] || "interacted"}
                  </div>
                  {n.preview ? (
                    <div style={{ fontSize: 12, color: "#52606d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.preview}</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <SectionTitle>
          {translateText("IDENTITY")}
        </SectionTitle>
        <DropdownRowWithLink onClick={copyFomoId}>
          <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.9373 4.31961L12.6973 5.75961H9.84125L9.36125 8.63961H12.2413L12.0013 10.0796H9.12125L8.40125 14.3996H6.86525L7.58525 10.0796H4.41725L3.69725 14.3996H2.16125L2.88125 10.0796H0.00125003L0.24125 8.63961H3.12125L3.60125 5.75961H0.69725L0.93725 4.31961H3.84125L4.56125 -0.000391483H6.09725L5.37725 4.31961H8.54525L9.26525 -0.000391483H10.8013L10.0813 4.31961H12.9373ZM4.65725 8.63961H7.82525L8.30525 5.75961H5.13725L4.65725 8.63961Z" fill="#728094" />
          </svg>
          <div className="info-row">
            <span>{translateText("FOMO ID")}: </span>
            <b>{userData.fomoId || "132871"}</b>
          </div>
          <div className="copy-icon">
            <CopyIcon type="new" className="small-icon" fill="var(--main-gray)" />
          </div>
        </DropdownRowWithLink>
        <DropdownRowWithLink>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
          >
            <path
              d="M2.5 2.5L8.43079 6.60593C8.77324 6.84301 9.22677 6.84301 9.56921 6.60593L15.5 2.5M3 13H15C16.1046 13 17 12.1046 17 11V3C17 1.89543 16.1046 1 15 1H3C1.89543 1 1 1.89543 1 3V11C1 12.1046 1.89543 13 3 13Z"
              stroke="var(--main-gray)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="info-row">{userData.email && !/@wallet\.fomo$/i.test(userData.email) && !/^0x[a-fA-F0-9]{40}@/.test(userData.email) ? userData.email : translateText("No email")}</div>
        </DropdownRowWithLink>
        {userData?.telegramData ? (
          <DropdownRowWithLink>
            <TelegramIcon fill="var(--main-gray)" type={"default"} />
            <div className="info-row">
              @{userData?.telegramData?.username || "-"}
            </div>
          </DropdownRowWithLink>
        ) : (
          <TelegramConnectButton type="button" onClick={connectTelegram}>
            <TelegramIcon fill="#ffffff" type={"default"} />
            <span>{translateText("Connect Telegram")}</span>
          </TelegramConnectButton>
        )}

      </SectionWrapper>
      <SectionWrapper>
        <SectionTitle>
          {translateText("FEATURES")}
        </SectionTitle>
        <DropdownBlockWrapper className="features" style={{ marginTop: "20px" }}>
          <Link className="feature" href="/core/profile">
            <SettingsIcon type="new" fill="#070B35" />
            <span>
              {translateText("My Profile")}
            </span>
          </Link>
          <Link className="feature" href="/core/spaceport">
            <RocketIcon fill="#070B35" />
            <span>
              {translateText("Spaceport")}
            </span>
          </Link>
          <Link className="feature" href="/core/profile?tab=tasks">
            <TaskIcon fill="#070B35" />
            <span>{translateText("Tasks")}</span>
          </Link>
          <Link className="feature" href="/utility/news">
            <FeedIcon className="feed-icon" fill="#070B35" />
            <span>{translateText("Feed")}</span>
          </Link>
        </DropdownBlockWrapper>
      </SectionWrapper>

      <SectionWrapper>
        <SectionTitle>
          {translateText("ACTIVITY")}
        </SectionTitle>
        <DropdownBlockWrapper>
          <DropdownBlockButton
            isOpen={isStatistics}
            onClick={() => setIsStatistics((prev: boolean) => !prev)}
          >
            <div className="block-title">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1V20.2H20.2M5.8 13.0001L10 8.80013L13 11.8001L18.4001 6.4" stroke="#05A584" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{translateText("Statistics")}</span>
            </div>
            <ArrowSelectIcon fill="var(--main-gray)" className="rotate-arrow" />
          </DropdownBlockButton>
          <DropdownBlockList isOpen={isStatistics}>
            <DropdownRow
              className="list-row"
              isPositive={Number(userData?.points || 100) > 0}
            >
              <span>{translateText("My Points")}:</span>
              <i>
                {
                  //@ts-ignore
                  userData?.points || 100
                }
              </i>
            </DropdownRow>
            <DropdownRow className="list-row" isPositive={false}>
              <span>{translateText("Score")}:</span>
              <i>0</i>
            </DropdownRow>
            <DropdownRow
              className="list-row"
              isPositive={Number(userData?.partners || 0) > 0}
            >
              <span>{translateText("Partners")}:</span>
              <i>
                {
                  //@ts-ignore
                  userData?.partners || 0
                }
              </i>
            </DropdownRow>
            <DropdownRow className="list-row" isPositive={false}>
              <span>{translateText("Awards")}:</span>
              <i>0</i>
            </DropdownRow>
          </DropdownBlockList>
        </DropdownBlockWrapper>
        <DropdownBlockWrapper>
          <DropdownBlockButton
            isOpen={isOtcP2P}
            onClick={() => setIsOtcP2P((prev: boolean) => !prev)}
          >

            <div className="block-title">
              <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 10H5.38462L8.30769 1L10.5 10L12.6923 19L15.6154 10H20" stroke="#05A584" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{translateText("Bazaar Activity")}</span>
            </div>
            <ArrowSelectIcon fill="var(--main-gray)" className="rotate-arrow" />
          </DropdownBlockButton>
          <DropdownBlockList isOpen={isOtcP2P}>
            <DropdownRow
              className="list-row"
              isPositive={bazaarActivity.rating.percent > 0}
            >
              <span>{translateText("Rating")}:</span>
              <i>{bazaarMetricValue(bazaarActivity.rating.percent)}</i>
            </DropdownRow>
            <DropdownRow
              className="list-row"
              isPositive={bazaarActivity.sells > 0}
            >
              <span>{translateText("Sells")}:</span>
              <i>{bazaarMetricValue(bazaarActivity.sells)}</i>
            </DropdownRow>
            <DropdownRow
              className="list-row"
              isPositive={bazaarActivity.buys > 0}
            >
              <span>{translateText("Buys")}:</span>
              <i>{bazaarMetricValue(bazaarActivity.buys)}</i>
            </DropdownRow>
            <DropdownRow
              className="list-row"
              isPositive={bazaarActivity.profit.usd > 0}
            >
              <span>{translateText("Profit (PNL)")}:</span>
              <i>{bazaarProfitValue(bazaarActivity.profit.usd)}</i>
            </DropdownRow>
          </DropdownBlockList>
        </DropdownBlockWrapper>
      </SectionWrapper>

      {/* 
      <CreateButtonsWrapper>
        <CreateButton className="no-border" onClick={onOpenCreateProject}>
          Create Project
        </CreateButton>
        <CreateButton className="no-border" onClick={onOpenCreatePerson}>
          Create Person
        </CreateButton>
        <CreateButton className="no-border" onClick={onOpenCreateFund}>
          Create Fund
        </CreateButton>
        <CreateButton className="no-border" onClick={onOpenCreateNews}>
          Create News
        </CreateButton>
      </CreateButtonsWrapper> */}

      <SectionWrapper>
        <SectionTitle>
          {translateText("TOOLS & SUPPORT")}
        </SectionTitle>
        <DropdownBlockWrapper>

          {/* <DropdownRowWithLink className="tool-link">
            <button onClick={onOpenMultiWalletModal}>
              <DefaultWalletIcon fill="var(--main-gray)" />
              <span>Multi-chain wallet</span>
            </button>
          </DropdownRowWithLink> */}

          <DropdownRowWithLink className="tool-link">
            <Link href="/core/fomo-chat?tab=clink">
              <ClockIcon />
              <span>Chat</span>
            </Link>
            <DropdownNumber isActive={messages?.length > 0}>
              {messages?.length || 0}
            </DropdownNumber>
          </DropdownRowWithLink>

          <DropdownRowWithLink className="tool-link">
            <Link href="/utility">
              <SupportIcon />
              <span>{translateText("Bazaar")}</span>
            </Link>
            <DropdownNumber isActive={Number((bazaarActivity as any)?.activeDeals || (bazaarActivity as any)?.deals?.length || 0) > 0}>
              {Number((bazaarActivity as any)?.activeDeals || (bazaarActivity as any)?.deals?.length || 0)}
            </DropdownNumber>
          </DropdownRowWithLink>

          <DropdownRowWithLink className="tool-link">
            <Link href="/gemslab/profile">
              <InviteIcon />
              <span>{translateText("Invites")}</span>
            </Link>
            <DropdownNumber isActive={userData?.invites?.length > 0}>
              {userData?.invites?.length || 0}
            </DropdownNumber>
          </DropdownRowWithLink>

          <DropdownRowWithLink className="tool-link">
            <Link href="#">
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 0C0.223858 0 0 0.223858 0 0.5C0 0.776142 0.223858 1 0.5 1V0.5V0ZM2.41045 0.5L2.89118 0.362517C2.8298 0.147927 2.63364 0 2.41045 0V0.5ZM5.51493 11.3552L5.0342 11.4927C5.10164 11.7285 5.33015 11.8806 5.5737 11.8518L5.51493 11.3552ZM15.0672 10.2245L15.1259 10.721C15.3376 10.696 15.5101 10.5394 15.5556 10.3312L15.0672 10.2245ZM16.5 3.66611L16.9885 3.77283C17.0208 3.62497 16.9844 3.47044 16.8895 3.35255C16.7945 3.23466 16.6513 3.16611 16.5 3.16611V3.66611ZM3.31592 3.66611L2.83519 3.80359V3.80359L3.31592 3.66611ZM0.5 0.5V1H2.41045V0.5V0H0.5V0.5ZM5.51493 11.3552L5.5737 11.8518L15.1259 10.721L15.0672 10.2245L15.0084 9.72795L5.45615 10.8587L5.51493 11.3552ZM15.0672 10.2245L15.5556 10.3312L16.9885 3.77283L16.5 3.66611L16.0115 3.55939L14.5787 10.1178L15.0672 10.2245ZM2.41045 0.5L1.92972 0.637483L2.83519 3.80359L3.31592 3.66611L3.79665 3.52863L2.89118 0.362517L2.41045 0.5ZM3.31592 3.66611L2.83519 3.80359L5.0342 11.4927L5.51493 11.3552L5.99565 11.2178L3.79665 3.52863L3.31592 3.66611ZM16.5 3.66611V3.16611H3.31592V3.66611V4.16611H16.5V3.66611ZM8.5 14.3162H8C8 14.6686 7.69022 15 7.25 15V15.5V16C8.1905 16 9 15.2715 9 14.3162H8.5ZM7.25 15.5V15C6.80979 15 6.5 14.6686 6.5 14.3162H6H5.5C5.5 15.2715 6.3095 16 7.25 16V15.5ZM6 14.3162H6.5C6.5 13.9639 6.80979 13.6325 7.25 13.6325V13.1325V12.6325C6.3095 12.6325 5.5 13.361 5.5 14.3162H6ZM7.25 13.1325V13.6325C7.69022 13.6325 8 13.9639 8 14.3162H8.5H9C9 13.361 8.1905 12.6325 7.25 12.6325V13.1325ZM15.1667 14.3162H14.6667C14.6667 14.6686 14.3569 15 13.9167 15V15.5V16C14.8572 16 15.6667 15.2715 15.6667 14.3162H15.1667ZM13.9167 15.5V15C13.4765 15 13.1667 14.6686 13.1667 14.3162H12.6667H12.1667C12.1667 15.2715 12.9762 16 13.9167 16V15.5ZM12.6667 14.3162H13.1667C13.1667 13.9639 13.4765 13.6325 13.9167 13.6325V13.1325V12.6325C12.9762 12.6325 12.1667 13.361 12.1667 14.3162H12.6667ZM13.9167 13.1325V13.6325C14.3569 13.6325 14.6667 13.9639 14.6667 14.3162H15.1667H15.6667C15.6667 13.361 14.8572 12.6325 13.9167 12.6325V13.1325Z" fill="#728094" />
              </svg>
              <span>{translateText("Cart")}</span>
            </Link>
            <b>0</b>
          </DropdownRowWithLink>

          <DropdownRowWithLink className="tool-link">
            <Link href="/updates">
              <svg width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.83333 17.5909C6.54101 18.1562 7.47553 18.5 8.5 18.5C9.52447 18.5 10.459 18.1562 11.1667 17.5909M1.00763 14.6818C0.586021 14.6818 0.35054 14.0194 0.605574 13.6514C1.19736 12.7975 1.76855 11.5451 1.76855 10.037L1.79296 7.85166C1.79296 3.79145 4.79581 0.5 8.5 0.5C12.2588 0.5 15.3058 3.83993 15.3058 7.95995L15.2814 10.037C15.2814 11.5555 15.8329 12.8147 16.4006 13.669C16.6458 14.0379 16.4097 14.6818 15.9933 14.6818H1.00763Z" stroke="#728094" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{translateText("FOMO Updates")}</span>
            </Link>
            <DropdownNumber isActive={updatesCount > 0}>
              {updatesCount}
            </DropdownNumber>
          </DropdownRowWithLink>

          <DropdownRowWithLink className="tool-link">
            <Link href="/faq">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.49913 12.5V12.5352M6.5 6.03777C6.5 4.91234 7.39543 4 8.5 4C9.60457 4 10.5 4.91234 10.5 6.03777C10.5 7.1632 9.60457 8.07555 8.5 8.07555C8.5 8.07555 8.49913 8.68377 8.49913 9.43406M16.5 8.5C16.5 12.9183 12.9183 16.5 8.5 16.5C4.08172 16.5 0.5 12.9183 0.5 8.5C0.5 4.08172 4.08172 0.5 8.5 0.5C12.9183 0.5 16.5 4.08172 16.5 8.5Z" stroke="#728094" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              <span>{translateText("FAQ and Risk")}</span>
            </Link>
          </DropdownRowWithLink>

          <DropdownRowWithLink className="tool-link">
            <button onClick={onOpenSupportModal}>
              <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.4 0C3.78 0 0 3.63429 0 8.16V10.56C0 10.6286 0 10.6286 0 10.6971C0 10.7657 0 10.9029 0 10.9714C0 12.8914 1.54 14.4 3.5 14.4C3.92 14.4 4.2 14.1257 4.2 13.7143V8.22857C4.2 7.81714 3.92 7.54286 3.5 7.54286C2.73 7.54286 1.96 7.81714 1.4 8.22857V8.09143C1.4 4.38857 4.55 1.37143 8.4 1.37143C12.25 1.37143 15.4 4.38857 15.4 8.16V8.22857C14.84 7.81714 14.07 7.54286 13.3 7.54286C12.88 7.54286 12.6 7.81714 12.6 8.22857V13.7143C12.6 14.1257 12.88 14.4 13.3 14.4C13.79 14.4 14.28 14.2629 14.7 14.1257C14 15.5657 12.74 16.6629 11.2 17.28C11.2 17.2114 11.2 17.2114 11.2 17.1429C11.2 16.7314 10.92 16.4571 10.5 16.4571H8.4C7.98 16.4571 7.7 16.7314 7.7 17.1429V18.5143C7.7 18.9257 7.98 19.2 8.4 19.2C13.02 19.2 16.8 15.6343 16.8 11.2457V10.56V8.91429V8.16C16.8 3.63429 13.02 0 8.4 0Z" fill="#728094" />
              </svg>
              <span>{translateText("Support")}</span>
            </button>
          </DropdownRowWithLink>
        </DropdownBlockWrapper>
      </SectionWrapper>

      <SectionWrapper>
        <DropdownBlockWrapper style={{ marginTop: '0px' }}>
          <DropdownRowWithLink className="tool-link" onClick={copyReferralLink}>
            <svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 9.50004L13.5 3.50003C13.5 1.84317 12.1568 0.500016 10.5 0.500036L4.725 0.500104M8.3 16.5L2.45 16.5C1.37305 16.5 0.500002 15.6046 0.500002 14.5L0.5 5.8334C0.5 4.72884 1.37304 3.83341 2.45 3.83341L8.3 3.83341C9.37695 3.83341 10.25 4.72884 10.25 5.8334L10.25 14.5C10.25 15.6046 9.37696 16.5 8.3 16.5Z" stroke="#728094" stroke-linecap="round" />
            </svg>
            <span> {translateText("Copy referral link")}</span>
          </DropdownRowWithLink>
          <DropdownRowWithLink className="tool-link" onClick={updateMenuState}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 16L6 1M16.5 13.5L16.5 3.5C16.5 1.84315 15.1569 0.500001 13.5 0.500001L3.5 0.5C1.84315 0.5 0.500001 1.84314 0.5 3.5L0.5 13.5C0.5 15.1569 1.84314 16.5 3.5 16.5H13.5C15.1569 16.5 16.5 15.1569 16.5 13.5Z" stroke="#728094" />
            </svg>
            <span>{translateText("Menu display (Sidebar)")}</span>
            <EyeIcon>
              {userData?.isMenuDisplay ? (
                <Image src={OpenEyeIcon} alt={"open menu"} />
              ) : (
                <Image src={ClosedEyeIcon} alt={"closed menu"} />
              )}
            </EyeIcon>
          </DropdownRowWithLink>
        </DropdownBlockWrapper>

        <LogOutBtn className="log-out-btn" onClick={logout}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="16"
            viewBox="0 0 18 16"
            fill="none"
          >
            <path
              d="M11.8483 15L15.1267 15C15.6235 15 16.1 14.8156 16.4513 14.4874C16.8026 14.1592 17 13.7141 17 13.25L17 2.75C17 2.28587 16.8026 1.84075 16.4513 1.51256C16.1 1.18438 15.6235 1 15.1267 1L11.8483 1M11.6155 8L0.999999 8M0.999999 8L5.05615 12M0.999999 8L5.05615 4"
              stroke="#FF5858"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span>{translateText("Log out")}</span>
        </LogOutBtn>
      </SectionWrapper>

      <SectionWrapper>
        <BuyFomoNftBanner />
      </SectionWrapper>
    </UserDropdownWrapper>
  );
};

export default UserDropdownPanel;
