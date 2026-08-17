import React, { useContext, useState, useEffect } from "react";
import { useQuery } from "react-query";
import {
  Card,
  CardsWrapper,
  ReferralConnectionsHeader,
  Wrapper,
  MobileCardSlider,
} from "./styles";
import EmptySection from "../../../../global/EmptySection";
import getRefList from "../../../../../http/ref/getRefList";
import UniversalTable from "../../../../global/common/UniversalTable";
import {
  cryptoMarketSortHeaders,
  refLinksGridColumns,
  refListLvlOneSortHeaders,
} from "../../../../../staticContent/tables";
import { AuthContext } from "../../../../global/Layout";
import { useTranslation } from "i18n";

const Connections = () => {
  const { translateText } = useTranslation();
  const { userData } = useContext(AuthContext);
  const [refLvl, setRefLvl] = useState<"refLvlOne" | "refLvlTwo">("refLvlOne");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { data, isLoading } = useQuery(["ref-list", refLvl], () =>
    getRefList(refLvl)
  );

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Card data for rendering
  const cardsData = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M26.709 34.2842L26.7095 28.9279C26.7098 25.9693 24.3114 23.5707 21.3527 23.5707H9.35736C6.39914 23.5707 4.00093 25.9686 4.0006 28.9269L4 34.2842M35.9995 34.2845L36 28.9282C36.0003 25.9696 33.6019 23.571 30.6432 23.571M25.6772 6.76719C26.9927 7.74325 27.8453 9.30801 27.8453 11.0719C27.8453 12.8358 26.9927 14.4005 25.6772 15.3766M20.823 11.0716C20.823 14.0301 18.4247 16.4284 15.4662 16.4284C12.5078 16.4284 10.1095 14.0301 10.1095 11.0716C10.1095 8.11315 12.5078 5.71484 15.4662 5.71484C18.4247 5.71484 20.823 8.11315 20.823 11.0716Z"
            stroke="#070B35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: translateText("Total Connections"),
      value: userData?.refLvlOne?.length + userData?.refLvlTwo?.length,
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M4 36L4.00067 29.9993C4.00105 26.6859 6.68723 24 10.0007 24H21M28 18.7857L32 14.5M32 14.5L36 18.7857M32 14.5V25.5M24 10C24 13.3137 21.3137 16 18 16C14.6863 16 12 13.3137 12 10C12 6.68629 14.6863 4 18 4C21.3137 4 24 6.68629 24 10Z"
            stroke="#070B35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: translateText("Level I Referrals"),
      value: userData?.refLvlOne?.length,
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M4 36L4.00067 29.9993C4.00105 26.6859 6.68723 24 10.0007 24H21M28 25.2857L32 21M32 21L36 25.2857M32 21V32M29 4C31.4271 5.36046 33 7.54146 33 10C33 12.4585 31.4271 14.6395 29 16M24 10C24 13.3137 21.3137 16 18 16C14.6863 16 12 13.3137 12 10C12 6.68629 14.6863 4 18 4C21.3137 4 24 6.68629 24 10Z"
            stroke="#070B35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: translateText("Level II Referrals"),
      value: userData?.refLvlTwo?.length,
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M26.709 34.2842L26.7095 28.928C26.7098 25.9693 24.3114 23.5707 21.3527 23.5707H9.35736C6.39914 23.5707 4.00093 25.9686 4.0006 28.9269L4 34.2842M20.823 11.0716C20.823 14.0301 18.4247 16.4284 15.4662 16.4284C12.5078 16.4284 10.1095 14.0301 10.1095 11.0716C10.1095 8.11315 12.5078 5.71484 15.4662 5.71484C18.4247 5.71484 20.823 8.11315 20.823 11.0716Z"
            stroke="#070B35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M29.9994 6.66797L31.416 9.71824L34.7547 10.1229L32.2915 12.4127L32.9383 15.7131L29.9994 14.078L27.0605 15.7131L27.7074 12.4127L25.2441 10.1229L28.5829 9.71824L29.9994 6.66797Z"
            stroke="#070B35"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: translateText("XP from Referrals"),
      value: userData?.activityXP || 0,
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M4 36L4.00067 29.9993C4.00105 26.6859 6.68723 24 10.0007 24H21.9998M27 29L29 31L36 24M29 4C31.4271 5.36046 33 7.54146 33 10C33 12.4585 31.4271 14.6395 29 16M24 10C24 13.3137 21.3137 16 18 16C14.6863 16 12 13.3137 12 10C12 6.68629 14.6863 4 18 4C21.3137 4 24 6.68629 24 10Z"
            stroke="#070B35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: translateText("Active Referrals"),
      value: userData?.refLvlOne?.length + userData?.refLvlTwo?.length,
    },
  ];

  // Render card content
  const renderCardContent = (item: any) => (
    <>
      {item.icon}
      <div className="card-key">{item.title}</div>
      <div className="card-value">{item.value}</div>
    </>
  );

  return (
    <Wrapper>
      <CardsWrapper>
        <h2>{translateText("Connections")}</h2>

        <div className="cards">
          {cardsData.map((card, index) => (
            <Card key={index}>{renderCardContent(card)}</Card>
          ))}
        </div>
      </CardsWrapper>

      <CardsWrapper>
        <ReferralConnectionsHeader>
          <h2>{translateText("Referral Connections")}</h2>
          <div className="lvls">
            <button
              onClick={() => setRefLvl("refLvlOne")}
              className={refLvl === "refLvlOne" ? "active-btn" : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M1 17L1.00034 13.9997C1.00052 12.3429 2.34361 11 4.00034 11H9.5M13 8.39286L15 6.25M15 6.25L17 8.39285M15 6.25V11.75M11 4C11 5.65685 9.65685 7 8 7C6.34314 7 5 5.65685 5 4C5 2.34315 6.34314 1 8 1C9.65685 1 11 2.34315 11 4Z"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {translateText("Level 1")}
            </button>
            <button
              onClick={() => setRefLvl("refLvlTwo")}
              className={refLvl === "refLvlTwo" ? "active-btn" : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M2 18L2.00034 14.9997C2.00052 13.3429 3.34361 12 5.00034 12H10.5M14 12.6429L16 10.5M16 10.5L18 12.6429M16 10.5V16M14.5 2C15.7135 2.68023 16.5 3.77073 16.5 5C16.5 6.22927 15.7135 7.31977 14.5 8M12 5C12 6.65685 10.6569 8 9 8C7.34314 8 6 6.65685 6 5C6 3.34315 7.34314 2 9 2C10.6569 2 12 3.34315 12 5Z"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {translateText("Level 2")}
            </button>
          </div>
        </ReferralConnectionsHeader>
        {data?.refList?.length ? (
          <UniversalTable
            type="refs"
            sortHeaders={refListLvlOneSortHeaders}
            link="#"
            favKey="FOMO-REF-LINKS-FAV"
            gridColumns={refLinksGridColumns}
            isFavorite={isFavorite}
            setIsFavorite={setIsFavorite}
            isLoading={isLoading}
            sortValue={{ name: "", value: -1 }}
            updateSortValue={(name: string, value: 1 | -1) =>
              console.log("test")
            }
            page={page}
            items={data?.refList || []}
          />
        ) : (
          <div className="dataBody">
            <EmptySection
              className="emptyBig"
              title={translateText("No connections yet")}
              description={translateText("Invite your friends and grow your network!")}
            />
          </div>
        )}
      </CardsWrapper>
    </Wrapper>
  );
};

export default Connections;
