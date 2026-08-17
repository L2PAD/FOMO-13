import React from "react";
import SectionNewsItem from "../../../../global/SectionNewsItem";
import { NewsRow, Section, Wrapper } from "./styles";
import { INews } from "../../../../../types/global_types";
import Typography from "../../../../global/common/Typography";
import Link from "next/link";

const sections: Array<{ title: string; news: Array<INews> }> = [
  {
    title: "Crypto Glossary",
    news: [
      {
        _id: "1",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "3 mins read",
        title: "10 Key Crypto Terms You Need to Know",
        text: "",
        type: "",
        isAdminCreate: false,
      },
      {
        _id: "2",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "5 mins read",
        title: "What is Blockchain? A Simple Explanation of a Complex Concept",
        text: "",
        type: "",
        isAdminCreate: false,
      },
      {
        _id: "3",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "3 mins read",
        title: "Decentralization: Why It’s Crucial for the Future?",
        text: "",
        type: "",
        isAdminCreate: false,
      },
    ],
  },
  {
    title: "How to Start Investing?",
    news: [
      {
        _id: "1",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "3 mins read",
        title: "First Steps in Investing: A Beginner’s Guide",
        text: "",
        type: "",
        isAdminCreate: false,
      },
      {
        _id: "2",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "5 mins read",
        title: "How to Avoid Risks When Investing in Cryptocurrency",
        text: "",
        type: "",
        isAdminCreate: false,
      },
      {
        _id: "3",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "3 mins read",
        title: "Strategies for Long-Term and Short-Term Investments",
        text: "",
        type: "",
        isAdminCreate: false,
      },
    ],
  },
  {
    title: "What is NFT?",
    news: [
      {
        _id: "1",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "3 mins read",
        title: "NFTs for Beginners: How to Create and Buy Tokens",
        text: "",
        type: "",
        isAdminCreate: false,
      },
      {
        _id: "2",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "5 mins read",
        title: "Why NFTs are Transforming the Art and Gaming Markets",
        text: "",
        type: "",
        isAdminCreate: false,
      },
      {
        _id: "3",
        image: "/blog-img.png",
        date: new Date(),
        readTime: "3 mins read",
        title: "Legal Aspects of Owning NFTs: What You Need to Know?",
        text: "",
        type: "",
        isAdminCreate: false,
      },
    ],
  },
];

const NewsSections = () => {
  return (
    <Wrapper>
      {sections.map(
        (item: { title: string; news: Array<INews> }, index: number) => {
          return (
            <Section key={index}>
              <Typography variant="h2">{item.title}</Typography>
              <NewsRow>
                {item.news.map((item: INews) => {
                  return (
                    <Link href={`news/${item._id}`}>
                      <SectionNewsItem key={item._id} newsItem={item} />
                    </Link>
                  );
                })}
              </NewsRow>
            </Section>
          );
        }
      )}
    </Wrapper>
  );
};

export default NewsSections;
