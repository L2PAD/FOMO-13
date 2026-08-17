import React, { useState } from "react";
import { useQuery } from "react-query";
import useComments from "../../../../hooks/useComments";
import Typography from "../../../global/common/Typography";
import CommentBlock from "../../../global/CommentBlock";
import fetchTwitterAccs from "../../../../http/parcing/fetchTwitterAccs";
import { IParcingTwitterAcc } from "../../../../types/global_types";
import { MainInfoRight, ModeSwitchWrapper } from "./styles";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
} from "../CryptoMarket/styles";
import TrendingKeywords from "./TrendingKeywords";
import Tabs from "../../../global/Tabs";
import { useRouter } from "next/router";
import LiveParsing from "./LiveParsing";
import ButtonSwitch from "../../../UI/inputs/button-switch";
import CustomTwitterAccs from "./CustomTwitterAccs";
import { Header } from "./CustomTwitterAccs/styles";
import TwitterAccountsList from "./CustomTwitterAccs/TwitterAccsList";
import SentimentAI from "./SentimentAI";
import TrendingTokensAnalytics from "./TrendingTokens";
import SentimentsPostsParsing from "./SentimentPosts";
import { useTranslation } from "i18n";

const tabs = ["Global", "Custom", "Sentiment AI"];

const ParcingLayout = () => {
  const { t, translateText } = useTranslation();
  const { comments, confirmAddComment } = useComments(
    "comments/utility",
    "comments/utility"
  );
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [mode, setMode] = useState<"Twitter" | "LinkedIn">("Twitter");
  const router = useRouter();
  const { data, refetch } = useQuery(["twitter-accs"], () => {
    return fetchTwitterAccs();
  });

  const updateActiveTab = (value: string) => {
    router.push("", { query: { tab: value.toLowerCase() } }, { shallow: true });
    setActiveTab(value);
  };

  const getContent = (): React.ReactNode => {
    if (activeTab === "Global") {
      return (
        <>
          <Header style={{ marginTop: "20px" }}>
            <div className="title">{translateText("Twitter Accounts")}</div>
            <div className="description">
              {translateText("Updated automatically every minute")}
            </div>
          </Header>
          <TwitterAccountsList
            data={data}
            refetch={refetch}
            isCreatingParsing={false}
          />
          {/* <TwitterAccs
            accounts={data?.accs || []}
          /> */}
          <LiveParsing type="public" />
        </>
      );
    }

    if (activeTab === "Sentiment AI") return <>
      <SentimentAI />
      <TrendingTokensAnalytics/>
    </>;

    return <CustomTwitterAccs />;
  };

  return (
    <PageWrapper>
      <MainInfo style={{ marginBottom: "40px" }}>
        <MainInfoDescription>
          <Typography className="main-title" variant="h1">
            {t("parsing.title")}
          </Typography>
          <br />
          <p>{t("parsing.description")}</p>
        </MainInfoDescription>
        <MainInfoRight>
          <ModeSwitchWrapper>
            <ButtonSwitch
              className="bg-switch"
              rightLabel="LinkedIn"
              leftLabel="Twitter"
              leftIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="17"
                  viewBox="0 0 16 17"
                  fill="none"
                >
                  <path
                    d="M8.0176 16.5H7.9824C3.58095 16.5 0 12.9191 0 8.51761V8.48239C0 4.08095 3.58095 0.5 7.9824 0.5H8.0176C12.419 0.5 16 4.08095 16 8.48239V8.51761C16 12.9191 12.419 16.5 8.0176 16.5ZM7.9824 1.04158C3.87936 1.04158 0.541584 4.37936 0.541584 8.48239V8.51761C0.541584 12.6206 3.87936 15.9584 7.9824 15.9584H8.0176C12.1206 15.9584 15.4584 12.6206 15.4584 8.51761V8.48239C15.4584 4.37936 12.1206 1.04158 8.0176 1.04158H7.9824Z"
                    fill="#738094"
                  />
                  <path
                    d="M3.40502 4.26953L6.96972 9.03547L3.38281 12.9105H4.19032L7.33096 9.51803L9.86828 12.9105H12.6157L8.85064 7.87648L12.1895 4.26953H11.382L8.48994 7.39394L6.15301 4.26953H3.40555H3.40502ZM4.59217 4.8642H5.85406L11.4275 12.3158H10.1656L4.59217 4.8642Z"
                    fill="#738094"
                  />
                </svg>
              }
              rightIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="17"
                  viewBox="0 0 16 17"
                  fill="none"
                >
                  <path
                    d="M8.0176 16.5H7.9824C3.58096 16.5 0 12.919 0 8.5176V8.4824C0 4.08096 3.58096 0.5 7.9824 0.5H8.0176C12.419 0.5 16 4.08096 16 8.4824V8.5176C16 12.919 12.419 16.5 8.0176 16.5ZM7.9824 1.04158C3.87937 1.04158 0.541583 4.37937 0.541583 8.4824V8.5176C0.541583 12.6206 3.87937 15.9584 7.9824 15.9584H8.0176C12.1206 15.9584 15.4584 12.6206 15.4584 8.5176V8.4824C15.4584 4.37937 12.1206 1.04158 8.0176 1.04158H7.9824Z"
                    fill="#04A584"
                  />
                  <path
                    d="M3.95725 5.90826C3.75361 5.71925 3.65234 5.48529 3.65234 5.20692C3.65234 4.92854 3.75416 4.68428 3.95725 4.49473C4.16088 4.30571 4.42301 4.21094 4.74417 4.21094C5.06533 4.21094 5.31717 4.30571 5.52026 4.49473C5.7239 4.68374 5.82517 4.9215 5.82517 5.20692C5.82517 5.49233 5.72336 5.71925 5.52026 5.90826C5.31663 6.09728 5.05829 6.19205 4.74417 6.19205C4.43005 6.19205 4.16088 6.09728 3.95725 5.90826ZM5.65403 6.99251V12.7875H3.82294V6.99251H5.65403Z"
                    fill="#04A584"
                  />
                  <path
                    d="M11.7508 7.56396C12.15 7.99723 12.3493 8.5919 12.3493 9.34903V12.6841H10.6103V9.58407C10.6103 9.20225 10.5112 8.90547 10.3135 8.69425C10.1158 8.48304 9.84934 8.37688 9.51573 8.37688C9.18211 8.37688 8.91564 8.48249 8.71796 8.69425C8.52029 8.90547 8.42118 9.20225 8.42118 9.58407V12.6841H6.67188V6.97527H8.42118V7.7324C8.59828 7.48002 8.83713 7.28072 9.13716 7.13395C9.4372 6.98718 9.7746 6.91406 10.1499 6.91406C10.8182 6.91406 11.3522 7.1307 11.7508 7.56396Z"
                    fill="#04A584"
                  />
                </svg>
              }
              onChange={(value: boolean) =>
                setMode(value ? "LinkedIn" : "Twitter")
              }
              checked={mode === "LinkedIn"}
            />
          </ModeSwitchWrapper>
          <TrendingKeywords />
        </MainInfoRight>
      </MainInfo>
      <Tabs
        className="big"
        items={tabs}
        activeItem={activeTab}
        onClick={updateActiveTab}
      />
      {getContent()}
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default ParcingLayout;
