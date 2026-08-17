import React from "react";
import moment from "moment";
import Link from "next/link";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import image from "../../../../../public/static/main/where_next.png";
import NewsItem from "../../../../global/NewsItem";
import {
  ContentText,
  ContentWrapper,
  Date,
  ImageStyle,
  PageWrapper,
  RecommendedItemsWrapper,
  RecommendedTitle,
  Title,
} from "./styles";

const items = [
  { title: "News", link: "/gemslab/news" },
  {
    title: "Spooky Ooki: Why You Should Put A Legal Wrapper On Your DAO",
    link: "/gemslab/news/234",
  },
];

const NewsItemPage = () => {
  return (
    <PageWrapper>
      <BreadCrumbs items={items} />
      <ContentWrapper>
        <Date variant="p">
          {moment().format("MMM DD, YYYY")} &#9679; News theme
        </Date>
        <Title variant="h1">
          Spooky Ooki: Why You Should Put A Legal Wrapper On Your DAO
        </Title>
        <ImageStyle width={100} height={100} src={image.src} alt="" />
        <ContentText>
          <p>
            Despite the crypto winter among us, bullish investors are still
            deploying capital into crypto startups, and curious crypto users are
            still experimenting with new products.
          </p>
          <p>
            While valuations are being meaningfully reset and the bar for a
            significant Seed round being significantly higher than it was in
            2021 (some level of product-market fit is now table stakes), most
            crypto VCs remain both patient and bullish on early stage crypto
            long-term. Investors, patiently waiting for valuations to bottom
            out, are refocusing their theses on infrastructure vs consumer, and
            carefully deploying the billions of dollars that was raised in the
            past year.
          </p>
          <p>
            At CoinList, we are proud to see so many CoinList Seed alumni
            projects from 2020 and 2021 showing strong growth in this bear
            market, including projects such as Acala, Biconomy, Injective,
            Parsiq, and Rabbithole.
          </p>
          <h2>CoinList Seed Fall 2022 Batch</h2>
          <p>
            For those not familiar, we introduced CoinList Seed in Spring 2020
            as a platform for early-stage crypto entrepreneurs to connect with
            the global CoinList community.
          </p>
          <p>
            Participating teams have benefited from broad exposure to the
            CoinList community of over 10 million users, collaborations with
            other CoinList Seed companies, access to the CoinList partner
            ecosystem (custodians, market makers, exchanges, etc), mentorship
            opportunities, and some love from crypto media.
          </p>
        </ContentText>
      </ContentWrapper>
      <div>
        <RecommendedTitle variant="p">Recommended for you</RecommendedTitle>
        <RecommendedItemsWrapper>
          {Array(3)
            .fill("")
            .map((item, i) => {
              return (
                <Link href="/gemslab/news/234" key={i}>
                  <NewsItem />
                </Link>
              );
            })}
        </RecommendedItemsWrapper>
      </div>
    </PageWrapper>
  );
};

export default NewsItemPage;
