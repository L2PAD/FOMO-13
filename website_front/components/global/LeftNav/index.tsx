import React, { useContext, useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import MenuIcon from "../../../assets/icons/left-nav/menu.svg";
import CryptoIcon from "../../../assets/icons/left-nav/icon1.svg";
import NftsIcon from "../../../assets/icons/left-nav/icon2.svg";
import EarlylandIcon from "../../../assets/icons/left-nav/icon3.svg";
import GemsLabIcon from "../../../assets/icons/left-nav/icon4.svg";
import UtilityIcon from "../../../assets/icons/left-nav/icon5.svg";
import DashboardIcon from "../../../assets/icons/left-nav/icon6.svg";
import ArrowSelectIcon from "../Icons/ArrowSelectIcon";
import EditIcon from "../../../assets/icons/left-nav/edit-contained.svg";
import OpenEye from "../../../assets/icons/left-nav/open-eye.png";
import ClosedEye from "../../../assets/icons/left-nav/closed-eye.png";
import OpenGrayEye from "../../../assets/icons/left-nav/gray-small-eye.png";
import ClosedGrayEye from "../../../assets/icons/left-nav/eye-closed.svg";
import FomoLogo from "../Icons/FomoLogo";
import updateUser from "../../../http/user/updateUser";
import { AuthContext, LayoutContext, LoadingContext } from "../Layout";
import {
  Action,
  ArrowWrapper,
  EditActions,
  EditBtn,
  EditItem,
  EmptyStateButtons,
  ExploreButton,
  ExploreMenuSection,
  EyeButton,
  Header,
  ItemName,
  LinkItem,
  ListWrapper,
  MenuItem,
  MenuTitle,
  SearchContainer,
  SubMenu,
  Wrapper,
} from "./styles";
import { useRouter } from "next/router";
import { NavLogin } from "../../../staticContent/global";
import { Search } from "lucide-react";
import { STORAGE_UPDATES_KEY } from "../NavBar";
import { IFomoNotification } from "../NavBar/index";
import { useTranslation } from "i18n";

const icons = {
  crypto: CryptoIcon,
  nfts: NftsIcon,
  earlyland: EarlylandIcon,
  gemsLab: GemsLabIcon,
  utility: UtilityIcon,
  dashboard: DashboardIcon,
};

const getStoredSeenUpdateIds = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_UPDATES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

type IconTypes =
  | "crypto"
  | "nfts"
  | "earlyland"
  | "gemsLab"
  | "utility"
  | "dashboard";

export interface NavItem {
  name: string;
  href?: string;
  isVisible: boolean;
  icon?: IconTypes;
  items?: NavItem[];
  isUpdate?: boolean;
}

export const filterNavItems = (navItems: Array<NavItem>): Array<NavItem> => {
  return navItems
    .filter((item) => item.isVisible)
    .map((item) => ({
      ...item,
      items: item.items ? filterNavItems(item.items) : undefined,
    }));
};

const LeftNav = ({
  isOpenMenu,
  setIsOpenMenu,
  showOnDesktop = true,
  className,
}: {
  isOpenMenu: boolean;
  setIsOpenMenu: React.Dispatch<React.SetStateAction<boolean>>;
  showOnDesktop?: boolean;
  className?: string;
}) => {
  const router = useRouter();
  const { t, translateText } = useTranslation();
  const { isAuth, userData, refetchAuthData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { layout } = useContext(LayoutContext);
  const userMenu: Array<NavItem> =
    isAuth && userData?.userMenu?.length
      ? filterNavItems(userData.userMenu)
      : filterNavItems(NavLogin)
  const [editedMenu, setEditedMenu] = useState<Array<NavItem>>(
    userData?.userMenu?.length ? userData.userMenu : NavLogin
  );
  const [isEditState, setIsEditState] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [search, setSearch] = useState<string>("");
  const [isExploreMenuOpen, setIsExploreMenuOpen] = useState<boolean>(false);
  const [seenUpdateIds, setSeenUpdateIds] = useState<string[]>([]);
  const [isSeenUpdateIdsHydrated, setIsSeenUpdateIdsHydrated] =
    useState<boolean>(false);
  const nav: Array<NavItem> = isEditState ? editedMenu : userMenu;
  const navRef = useRef<HTMLDivElement>(null);
  const currentPath = useMemo(() => router.asPath.split("?")[0], [router.asPath]);

  const toggleSection = (name: string) => {
    setOpenSections((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const getActiveSection = (): string => {
    const path: string = router.pathname.split("/")[1];

    switch (path) {
      case "/":
        return "Crypto";
      case "earlyland":
        return "Earlyland";
      case "gemslab":
        return "GemsLab";
      case "utility":
        return "Utility";
      case "dashboard":
        return "Dashboard";
      default:
        return "Crypto";
    }
  };

  const getNavIcon = (icon: string): any => {
    switch (icon) {
      case "crypto":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4.5 6.5C4.5 7.03043 4.92143 7.53914 5.67157 7.91421C6.42172 8.28929 7.43913 8.5 8.5 8.5C9.56087 8.5 10.5783 8.28929 11.3284 7.91421C12.0786 7.53914 12.5 7.03043 12.5 6.5C12.5 5.96957 12.0786 5.46086 11.3284 5.08579C10.5783 4.71071 9.56087 4.5 8.5 4.5C7.43913 4.5 6.42172 4.71071 5.67157 5.08579C4.92143 5.46086 4.5 5.96957 4.5 6.5Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.5 9.16667V6.5"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 6.5V16.5C4.5 17.6067 6.29333 18.5 8.5 18.5C8.87702 18.5013 9.25362 18.4746 9.62667 18.42"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 14C4.5 15.1067 6.29333 16 8.5 16C8.88603 15.999 9.27148 15.97 9.65333 15.9133"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 11.5C4.5 12.6067 6.29333 13.5 8.5 13.5C8.87702 13.5013 9.25362 13.4746 9.62667 13.42"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 9C4.5 10.1067 6.29333 11 8.5 11C8.88603 10.999 9.27148 10.97 9.65333 10.9133"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 12.6667C11.5 13.1972 11.9214 13.7059 12.6716 14.081C13.4217 14.456 14.4391 14.6667 15.5 14.6667C16.5609 14.6667 17.5783 14.456 18.3284 14.081C19.0786 13.7059 19.5 13.1972 19.5 12.6667C19.5 12.1363 19.0786 11.6276 18.3284 11.2525C17.5783 10.8775 16.5609 10.6667 15.5 10.6667C14.4391 10.6667 13.4217 10.8775 12.6716 11.2525C11.9214 11.6276 11.5 12.1363 11.5 12.6667Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 12.6667V17.5001C11.5 18.6067 13.2933 19.5001 15.5 19.5001C17.7067 19.5001 19.5 18.6067 19.5 17.5001V12.6667"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.5 15C19.5 16.1067 17.7067 17 15.5 17C13.2933 17 11.5 16.1067 11.5 15"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15.086 19.5C15.351 19.4999 15.6052 19.3947 15.7927 19.2073L19.2073 15.7927C19.3947 15.6052 19.4999 15.351 19.5 15.086V5.5C19.5 5.23478 19.3946 4.98043 19.2071 4.79289C19.0196 4.60536 18.7652 4.5 18.5 4.5H8.914C8.64897 4.50006 8.3948 4.60532 8.20733 4.79267L4.79267 8.20733C4.60532 8.3948 4.50006 8.64897 4.5 8.914V18.5C4.5 18.7652 4.60536 19.0196 4.79289 19.2071C4.98043 19.3946 5.23478 19.5 5.5 19.5H15.086Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 19.41V8.5"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 15.5H19.41"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.79297 19.2073L8.5003 15.5"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 8.50006L19.2073 4.79272"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.4998 8.5H4.58984"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 4.58984V15.4998"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "earlyland":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M18.4286 18H5.57143M3 14.1197H7.5M7.5 14.1197H16.5M7.5 14.1197C7.5 11.7266 9.51472 9.78654 12 9.78654C14.4853 9.78654 16.5 11.7266 16.5 14.1197M16.5 14.1197H21M5.25 10.7924L3.32143 9.5544M9.1875 7.00094L8.16017 5.00022M14.4591 6.85707L15.7448 5M20.7745 9.5544L18.6967 10.5436"
              stroke="#070B35"
              strokeLinecap="round"
            />
          </svg>
        );
      case "gemsLab":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9.96284 13.0001H6.32017C6.08389 12.9976 5.85405 13.0771 5.66979 13.225C5.48552 13.373 5.3582 13.5802 5.30951 13.8114L4.51817 17.8114C4.49151 17.9582 4.49778 18.1092 4.53651 18.2533C4.57525 18.3975 4.64549 18.5312 4.74217 18.6449C4.83885 18.7586 4.95957 18.8495 5.0956 18.9109C5.23164 18.9723 5.37961 19.0028 5.52884 19.0001H10.7542C10.9034 19.0028 11.0513 18.9723 11.1874 18.9109C11.3234 18.8495 11.444 18.7586 11.5407 18.6449C11.6373 18.5312 11.7075 18.3974 11.7461 18.2533C11.7848 18.1091 11.7909 17.9582 11.7642 17.8114L10.9728 13.8114C10.9243 13.5802 10.7971 13.373 10.6129 13.2251C10.4288 13.0772 10.199 12.9976 9.96284 13.0001Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.6791 13.0001H14.0364C13.8002 12.9976 13.5705 13.0772 13.3863 13.2251C13.2022 13.373 13.075 13.5802 13.0264 13.8114L12.2351 17.8114C12.2083 17.9582 12.2145 18.1091 12.2531 18.2533C12.2918 18.3974 12.362 18.5312 12.4586 18.6449C12.5552 18.7586 12.6759 18.8495 12.8119 18.9109C12.9479 18.9723 13.0959 19.0028 13.2451 19.0001H18.4704C18.6197 19.0028 18.7676 18.9723 18.9037 18.9109C19.0397 18.8495 19.1604 18.7586 19.2571 18.6449C19.3538 18.5312 19.424 18.3975 19.4628 18.2533C19.5015 18.1092 19.5078 17.9582 19.4811 17.8114L18.6898 13.8114C18.6411 13.5802 18.5138 13.373 18.3295 13.225C18.1452 13.0771 17.9154 12.9976 17.6791 13.0001Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.9628 7.00006H10.3202C10.0839 6.9976 9.85406 7.07711 9.66979 7.22503C9.48552 7.37296 9.3582 7.58016 9.30951 7.81139L8.51817 11.8114C8.49151 11.9582 8.49778 12.1092 8.53651 12.2533C8.57525 12.3975 8.64549 12.5312 8.74217 12.6449C8.83885 12.7586 8.95957 12.8495 9.0956 12.9109C9.23164 12.9723 9.37961 13.0028 9.52884 13.0001H14.7542C14.9034 13.0028 15.0513 12.9723 15.1874 12.9109C15.3234 12.8495 15.444 12.7586 15.5407 12.6449C15.6373 12.5312 15.7075 12.3974 15.7461 12.2533C15.7848 12.1091 15.7909 11.9582 15.7642 11.8114L14.9728 7.81139C14.9243 7.58022 14.7971 7.37302 14.6129 7.22509C14.4288 7.07716 14.199 6.99763 13.9628 7.00006Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 6H19.5"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 5V7"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 8.5H6.5"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 7.5V9.5"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "utility":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M17.0001 14.5001L19.2075 12.2928C19.3949 12.1053 19.5002 11.8509 19.5002 11.5858C19.5002 11.3206 19.3949 11.0663 19.2075 10.8788L17.8001 9.47479C17.6409 9.85244 17.3914 10.1852 17.0734 10.4437C16.7554 10.7023 16.3787 10.8787 15.9765 10.9573C15.5743 11.0361 15.1589 11.0147 14.7669 10.8951C14.3749 10.7755 14.0183 10.5614 13.7285 10.2717C13.4388 9.98187 13.2247 9.62528 13.1051 9.23328C12.9855 8.84128 12.9641 8.4259 13.0429 8.02371C13.1216 7.62151 13.298 7.24484 13.5565 6.92684C13.8151 6.60884 14.1478 6.35928 14.5255 6.20012L13.1215 4.79279C12.9339 4.60532 12.6796 4.5 12.4145 4.5C12.1493 4.5 11.8949 4.60532 11.7075 4.79279L9.50012 7.00012C9.50012 6.50567 9.35349 6.02232 9.07879 5.6112C8.80409 5.20007 8.41364 4.87964 7.95683 4.69042C7.50001 4.5012 6.99735 4.45169 6.51239 4.54816C6.02744 4.64462 5.58198 4.88272 5.23235 5.23236C4.88272 5.58198 4.64462 6.02744 4.54816 6.5124C4.45169 6.99735 4.5012 7.50002 4.69042 7.95683C4.87964 8.41364 5.20007 8.80409 5.61119 9.0788C6.02231 9.3535 6.50567 9.50012 7.00012 9.50012L4.79279 11.7075C4.60532 11.895 4.5 12.1493 4.5 12.4145C4.5 12.6796 4.60532 12.9339 4.79279 13.1215L6.20012 14.5255C6.35928 14.1478 6.60884 13.8151 6.92684 13.5565C7.24483 13.298 7.62151 13.1216 8.02371 13.0429C8.4259 12.9642 8.84128 12.9855 9.23328 13.1051C9.62527 13.2247 9.98187 13.4388 10.2717 13.7286C10.5614 14.0184 10.7755 14.375 10.8951 14.767C11.0147 15.1589 11.0361 15.5743 10.9573 15.9765C10.8786 16.3787 10.7022 16.7554 10.4437 17.0734C10.1852 17.3914 9.85245 17.641 9.47479 17.8001L10.8788 19.2048C11.0663 19.3923 11.3206 19.4976 11.5858 19.4976C11.8509 19.4976 12.1053 19.3923 12.2928 19.2048L14.5001 17.0001C14.5001 17.4946 14.6467 17.9779 14.9214 18.3891C15.1961 18.8002 15.5866 19.1206 16.0434 19.3098C16.5002 19.4991 17.0029 19.5485 17.4878 19.4521C17.9728 19.3556 18.4183 19.1175 18.7679 18.7679C19.1175 18.4183 19.3556 17.9728 19.4521 17.4879C19.5485 17.0029 19.499 16.5003 19.3098 16.0434C19.1206 15.5866 18.8001 15.1961 18.389 14.9215C17.9779 14.6467 17.4945 14.5001 17.0001 14.5001Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "dashboard":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M11 12.3506C11.0004 12.5234 10.9321 12.6893 10.8102 12.8118C10.6883 12.9343 10.5228 13.0034 10.35 13.0039H5.15C5.06441 13.0037 4.9797 12.9867 4.9007 12.9538C4.8217 12.9208 4.74996 12.8726 4.68959 12.812C4.62923 12.7513 4.58141 12.6793 4.54888 12.6001C4.51635 12.521 4.49974 12.4362 4.5 12.3506V5.15724C4.49983 5.07162 4.51652 4.9868 4.54912 4.90763C4.58173 4.82846 4.62961 4.75648 4.69003 4.69582C4.75045 4.63515 4.82222 4.58697 4.90126 4.55405C4.9803 4.52112 5.06505 4.50408 5.15067 4.50391L10.3507 4.51257C10.5234 4.51328 10.6887 4.58247 10.8105 4.70495C10.9322 4.82744 11.0004 4.99322 11 5.16591V12.3506Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.498 8.36259C19.4968 8.5338 19.4277 8.69753 19.3058 8.81778C19.1839 8.93804 19.0193 9.00499 18.848 9.00392H13.648C13.5632 9.00454 13.4792 8.98843 13.4006 8.95653C13.322 8.92462 13.2505 8.87754 13.1901 8.81798C13.1298 8.75842 13.0817 8.68754 13.0488 8.6094C13.0158 8.53126 12.9986 8.44739 12.998 8.36259V5.15392C12.9991 4.98289 13.068 4.81926 13.1896 4.69901C13.3113 4.57875 13.4757 4.5117 13.6467 4.51259L18.8467 4.50392C19.0181 4.50268 19.183 4.56953 19.3051 4.68979C19.4272 4.81004 19.4966 4.97386 19.498 5.14526V8.36259Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 18.8606C10.9995 18.9456 10.9822 19.0297 10.9492 19.108C10.9162 19.1863 10.8681 19.2574 10.8076 19.3172C10.7471 19.3769 10.6754 19.4241 10.5967 19.4562C10.518 19.4882 10.4337 19.5044 10.3487 19.5039L5.14867 19.4953C4.97745 19.496 4.81296 19.4287 4.69133 19.3082C4.5697 19.1877 4.50088 19.0238 4.5 18.8526V15.6466C4.50044 15.5617 4.5176 15.4777 4.55051 15.3995C4.58342 15.3212 4.63143 15.2502 4.6918 15.1905C4.75217 15.1308 4.82371 15.0836 4.90233 15.0516C4.98095 15.0196 5.06511 15.0034 5.15 15.0039H10.35C10.5214 15.003 10.6861 15.0702 10.808 15.1907C10.9299 15.3112 10.9989 15.4752 11 15.6466V18.8606Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.6487 19.5039C13.563 19.5037 13.4782 19.4867 13.3992 19.4537C13.3201 19.4207 13.2483 19.3725 13.1878 19.3118C13.1274 19.251 13.0795 19.179 13.047 19.0997C13.0144 19.0205 12.9978 18.9356 12.998 18.8499V11.6579C12.9978 11.5723 13.0144 11.4874 13.0469 11.4082C13.0794 11.329 13.1272 11.257 13.1876 11.1963C13.248 11.1356 13.3197 11.0873 13.3987 11.0543C13.4777 11.0213 13.5624 11.0042 13.648 11.0039H18.848C18.9337 11.0042 19.0184 11.0213 19.0974 11.0543C19.1764 11.0873 19.2481 11.1356 19.3085 11.1963C19.3689 11.257 19.4167 11.329 19.4492 11.4082C19.4817 11.4874 19.4983 11.5723 19.498 11.6579V18.8412C19.4984 19.014 19.4303 19.1798 19.3085 19.3024C19.1868 19.425 19.0215 19.4944 18.8487 19.4952L13.6487 19.5039Z"
              stroke="#070B35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (!isOpenMenu || !target) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest('[data-left-nav-trigger="true"]')
      ) {
        return;
      }

      if (navRef.current && !navRef.current.contains(target)) {
        setIsOpenMenu(false);
        setIsEditState(false);
        setOpenSections({});
        setIsExploreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenMenu, setIsOpenMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncSeenUpdateIds = () => {
      setSeenUpdateIds(getStoredSeenUpdateIds());
      setIsSeenUpdateIdsHydrated(true);
    };

    syncSeenUpdateIds();
    window.addEventListener("storage", syncSeenUpdateIds);
    window.addEventListener("fomo-updates-seen-change", syncSeenUpdateIds);

    return () => {
      window.removeEventListener("storage", syncSeenUpdateIds);
      window.removeEventListener("fomo-updates-seen-change", syncSeenUpdateIds);
    };
  }, []);

  const updateMenuItem = (
    menu: NavItem[],
    targetName: string,
    isVisible: boolean,
    sectionIndex: number
  ): NavItem[] => {
    return menu.map((item) => {
      if (item.name === targetName) {
        return {
          ...item,
          isVisible,
          items: item.items
            ? updateVisibilityForAll(item.items, isVisible)
            : item.items,
        };
      }

      if (item.items) {
        return {
          ...item,
          items: updateMenuItem(
            item.items,
            targetName,
            isVisible,
            sectionIndex
          ),
        };
      }

      return item;
    });
  };

  const updateVisibilityForAll = (
    menu: NavItem[],
    isVisible: boolean
  ): NavItem[] => {
    return menu.map((item) => ({
      ...item,
      isVisible,
      items: item.items
        ? updateVisibilityForAll(item.items, isVisible)
        : undefined,
    }));
  };

  const handleUpdateMenuItem = (
    targetName: string,
    isVisible: boolean,
    sectionIndex: number
  ): void => {
    setEditedMenu((prevMenu: any) => {
      const section: any = prevMenu[sectionIndex];
      const updatedSection: Array<NavItem> = updateMenuItem(
        [section],
        targetName,
        isVisible,
        sectionIndex
      );

      return [
        ...prevMenu.slice(0, sectionIndex),
        updatedSection[0],
        ...prevMenu.slice(sectionIndex + 1),
      ];
    });
  };

  const confirmUpdateMenu = async (): Promise<void> => {
    loadingStateHandler(true);

    const userData = await updateUser({ userMenu: editedMenu });

    if (userData) await refetchAuthData();

    setIsEditState(false);
    loadingStateHandler(false);
  };

  const filteredNav: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];

    for (let i = 0; i < nav.length; i++) {
      const item = nav[i];
      const itemName = translateText(item.name).toLowerCase();
      const searchLower = search.toLowerCase();

      let match = itemName.includes(searchLower);

      if (!match && item.items) {
        for (let j = 0; j < item.items.length; j++) {
          const subItem = item.items[j];
          if (translateText(subItem.name).toLowerCase().includes(searchLower)) {
            match = true;
            break;
          }
        }
      }

      if (match) {
        items.push({
          ...item,
          isUpdate: !!(
            isSeenUpdateIdsHydrated &&
            layout?.updates?.find((update: IFomoNotification) => {
              return (
                update.page.toLowerCase() === item.name.toLowerCase() &&
                !seenUpdateIds.includes(String(update._id))
              );
            })
          ),
        });
      }
    }

    return items;
  }, [isSeenUpdateIdsHydrated, layout, search, nav, seenUpdateIds, translateText]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSeenUpdateIdsHydrated || !layout?.updates) return;

    const activeSection = getActiveSection().toLowerCase();
    const nextSeenIds = layout.updates
      .filter(
        (update: IFomoNotification) =>
          update.page.toLowerCase() === activeSection &&
          !seenUpdateIds.includes(String(update._id))
      )
      .map((update: IFomoNotification) => String(update._id));

    if (!nextSeenIds.length) return;

    const updatedSeenIds = Array.from(
      new Set([...seenUpdateIds, ...nextSeenIds])
    );

    window.localStorage.setItem(
      STORAGE_UPDATES_KEY,
      JSON.stringify(updatedSeenIds)
    );
    window.dispatchEvent(new Event("fomo-updates-seen-change"));
    setSeenUpdateIds(updatedSeenIds);
  }, [currentPath, isSeenUpdateIdsHydrated, layout?.updates, seenUpdateIds]);

  useEffect(() => {
    if (userData?.userMenu?.length) {
      setEditedMenu(userData.userMenu);
    }
  }, [userData]);

  useEffect(() => {
    if (!isOpenMenu) {
      setIsExploreMenuOpen(false);
    }
  }, [isOpenMenu]);

  const handleExploreButtonClick = (): void => {
    setIsOpenMenu(true);
    setIsExploreMenuOpen((prev) => !prev);
  };


  return (
    <Wrapper
      isOpen={isOpenMenu}
      showOnDesktop={showOnDesktop}
      ref={navRef}
      className={className}
    >
      <Header isOpen={isOpenMenu}>
        <div className="nav-logo-wrapper">
          <FomoLogo />
        </div>
        <button
          onClick={() => {
            setIsOpenMenu((prev: boolean) => !prev);
            setIsEditState(false);
            setOpenSections({});
          }}
        >
          <Image src={MenuIcon} alt="Nav Menu" />
        </button>
      </Header>
      <SearchContainer>
        <Search />
        <input
          type="text"
          placeholder={`${t("common.actions.search")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchContainer>
      <ListWrapper>
        {filteredNav.map((item: NavItem, index: number) => (
          <MenuItem
            isActive={getActiveSection() === item.name && !isOpenMenu}
            isOpen={isOpenMenu}
            isVisible={item.isVisible}
            key={index}
            className={getActiveSection() === item.name ? "active" : ""}
          >
            <MenuTitle
              className="left-nav-title"
              onClick={() => {
                toggleSection(item.name);
                setIsOpenMenu(true);
              }}
            >
              <div className="icon-wrapper">
                {item.icon ? getNavIcon(item.icon) : <></>}
                {item.isUpdate ? <div className="update-marker"></div> : <></>}
              </div>
              <ItemName className="nav-item-name">
                {translateText(item.name)}
              </ItemName>
              {isEditState ? (
                <EyeButton
                  onClick={() =>
                    handleUpdateMenuItem(item.name, !item.isVisible, index)
                  }
                >
                  <Image
                    src={item.isVisible ? OpenEye : ClosedEye}
                    alt="is visible"
                  />
                </EyeButton>
              ) : (
                <ArrowWrapper
                  isOpen={openSections[item.name]}
                  className="nav-item-arrow"
                >
                  <ArrowSelectIcon />
                </ArrowWrapper>
              )}
            </MenuTitle>
            {item.items && (
              <SubMenu isOpen={openSections[item.name] || isEditState}>
                {item.items.map((subItem) => {
                  const isAllSectionHide: boolean = !item.isVisible;
                  return subItem.items ? (
                    <div key={subItem.name}>
                      {isEditState ? (
                        <EditItem
                          className={!subItem.isVisible ? "nav-item-link" : ""}
                          onClick={() =>
                            !isAllSectionHide &&
                            handleUpdateMenuItem(
                              subItem.name,
                              !subItem.isVisible,
                              index
                            )
                          }
                        >
                          {translateText(subItem.name)}
                          <Image
                            src={
                              subItem.isVisible ? OpenGrayEye : ClosedGrayEye
                            }
                            alt="is visible"
                          />
                        </EditItem>
                      ) : (
                        <LinkItem onClick={() => toggleSection(subItem.name)}>
                          <span>{translateText(subItem.name)}</span>
                          <ArrowWrapper
                            isOpen={openSections[subItem.name]}
                            className="nav-item-arrow sub-item"
                          >
                            <ArrowSelectIcon fill="#738094" />
                          </ArrowWrapper>
                        </LinkItem>
                      )}

                      {subItem.items ? (
                        <SubMenu
                          isOpen={openSections[subItem.name] || isEditState}
                          className="second-sub-menu"
                        >
                          {subItem.items.map((subSubItem) => {
                            const isSubAllSectionHide: boolean =
                              !subItem.isVisible;
                            return isEditState ? (
                              <EditItem
                                className={
                                  !subSubItem.isVisible ? "nav-item-link" : ""
                                }
                                onClick={() =>
                                  !isAllSectionHide &&
                                  !isSubAllSectionHide &&
                                  handleUpdateMenuItem(
                                    subSubItem.name,
                                    !subSubItem.isVisible,
                                    index
                                  )
                                }
                              >
                                {translateText(subSubItem.name)}
                                <Image
                                  src={
                                    subSubItem.isVisible
                                      ? OpenGrayEye
                                      : ClosedGrayEye
                                  }
                                  alt="is visible"
                                />
                              </EditItem>
                            ) : (
                              <Link
                                href={subSubItem.href || ""}
                                key={subSubItem.name}
                                className={
                                  currentPath === subSubItem.href
                                    ? "active"
                                    : ""
                                }
                              >
                                {translateText(subSubItem.name)}
                              </Link>
                            );
                          })}
                        </SubMenu>
                      ) : (
                        <></>
                      )}
                    </div>
                  ) : isEditState ? (
                    <EditItem
                      className={!subItem.isVisible ? "nav-item-link" : ""}
                      onClick={() =>
                        !isAllSectionHide &&
                        handleUpdateMenuItem(
                          subItem.name,
                          !subItem.isVisible,
                          index
                        )
                      }
                    >
                      {translateText(subItem.name)}
                      <Image
                        src={subItem.isVisible ? OpenGrayEye : ClosedGrayEye}
                        alt="is visible"
                      />
                    </EditItem>
                  ) : (
                    <Link
                      href={subItem.href || ""}
                      key={subItem.name}
                      className={
                        currentPath === subItem.href
                          ? "active"
                          : ""
                      }
                    >
                      {translateText(subItem.name)}
                    </Link>
                  );
                })}
              </SubMenu>
            )}
          </MenuItem>
        ))}
      </ListWrapper>
      {isOpenMenu && isAuth ? (
        isEditState ? (
          <EditActions>
            <Action onClick={confirmUpdateMenu} actionType="green">
              {t("common.actions.accept")}
            </Action>
            <Action onClick={() => setIsEditState(false)} actionType="red">
              {t("common.actions.cancel")}
            </Action>
          </EditActions>
        ) : (
          <EmptyStateButtons>
            <ExploreMenuSection>
              <ExploreButton
                as="a"
                isOpen={false}
                href={layout?.intelUrl || "/"}
                target="_blank"
                rel="noreferrer noopener"
                data-testid="leftnav-intel-link"
              >
                <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.56002 14.2795C8.98087 14.4234 8.3737 14.5 7.74802 14.5C3.74505 14.5 0.5 11.366 0.5 7.5C0.5 3.63401 3.74505 0.5 7.74802 0.5C11.4442 0.5 14.4941 3.17198 14.94 6.625M1.406 10.125H3.52001C4.35396 10.125 5.03001 9.47208 5.03001 8.66667V6.77083C5.03001 5.96542 5.70606 5.3125 6.54002 5.3125H8.05002C8.88397 5.3125 9.56002 4.65958 9.56002 3.85417V1.375M14.126 11.8911L16.2008 11.1983C16.5897 11.0685 16.6027 10.5419 16.2207 10.3942L11.0765 8.40669C10.7186 8.26842 10.3607 8.60562 10.4949 8.95458L12.4545 14.0502C12.5977 14.4226 13.1427 14.4234 13.2871 14.0515L14.126 11.8911Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>FOMO Intel</span>
                <span className="intel-pro">PRO</span>
                <span className="intel-ext" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 7h9v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </ExploreButton>
            </ExploreMenuSection>
            <EditBtn onClick={() => setIsEditState((prev: boolean) => !prev)}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.56559 1.70246H2.7746C1.51837 1.70246 0.5 2.7208 0.5 3.97699V11.5588C0.5 12.815 1.51837 13.8333 2.7746 13.8333H10.3566C11.6128 13.8333 12.6312 12.815 12.6312 11.5588L12.6312 7.7679M4.291 10.0424L7.04957 9.48657C7.19601 9.45706 7.33048 9.38495 7.43608 9.2793L13.6114 3.10078C13.9075 2.80455 13.9073 2.32438 13.611 2.0284L12.3028 0.721761C12.0066 0.425904 11.5267 0.426105 11.2307 0.722211L5.05473 6.90137C4.94933 7.00683 4.87737 7.14101 4.84783 7.28715L4.291 10.0424Z" stroke="#738094" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t("common.actions.editList")}</span>
            </EditBtn>
          </EmptyStateButtons >
        )
      ) :
        <EmptyStateButtons>
          <ExploreButton
            as="a"
            isOpen={false}
            href={layout?.intelUrl || "/"}
            target="_blank"
            rel="noreferrer noopener"
            data-testid="leftnav-intel-link-collapsed"
          >
            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.56002 14.2795C8.98087 14.4234 8.3737 14.5 7.74802 14.5C3.74505 14.5 0.5 11.366 0.5 7.5C0.5 3.63401 3.74505 0.5 7.74802 0.5C11.4442 0.5 14.4941 3.17198 14.94 6.625M1.406 10.125H3.52001C4.35396 10.125 5.03001 9.47208 5.03001 8.66667V6.77083C5.03001 5.96542 5.70606 5.3125 6.54002 5.3125H8.05002C8.88397 5.3125 9.56002 4.65958 9.56002 3.85417V1.375M14.126 11.8911L16.2008 11.1983C16.5897 11.0685 16.6027 10.5419 16.2207 10.3942L11.0765 8.40669C10.7186 8.26842 10.3607 8.60562 10.4949 8.95458L12.4545 14.0502C12.5977 14.4226 13.1427 14.4234 13.2871 14.0515L14.126 11.8911Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isOpenMenu ? (
              <>
                <span>FOMO Intel</span>
                <span className="intel-pro">PRO</span>
                <span className="intel-ext" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 7h9v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </>
            ) : (
              <></>
            )}
          </ExploreButton>
          {
            isAuth
              ?
              <EditBtn onClick={() => {
                setIsEditState((prev: boolean) => !prev)
                setIsOpenMenu(true)
              }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.56559 1.70246H2.7746C1.51837 1.70246 0.5 2.7208 0.5 3.97699V11.5588C0.5 12.815 1.51837 13.8333 2.7746 13.8333H10.3566C11.6128 13.8333 12.6312 12.815 12.6312 11.5588L12.6312 7.7679M4.291 10.0424L7.04957 9.48657C7.19601 9.45706 7.33048 9.38495 7.43608 9.2793L13.6114 3.10078C13.9075 2.80455 13.9073 2.32438 13.611 2.0284L12.3028 0.721761C12.0066 0.425904 11.5267 0.426105 11.2307 0.722211L5.05473 6.90137C4.94933 7.00683 4.87737 7.14101 4.84783 7.28715L4.291 10.0424Z" stroke="#738094" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </EditBtn>
              :
              <></>
          }
        </EmptyStateButtons>
      }
    </Wrapper>
  );
};

export default LeftNav;
