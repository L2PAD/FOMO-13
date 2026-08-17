import React, { useContext } from "react";
import Image from "next/image";
// import { AboutContext } from "../../../pages/about";
import question from "../../../public/static/main/about/question.jpg";
import Typography from "../common/Typography";
import Button from "../common/Button";
import NewsBlock from "../NewsBlock";
import imageLoader from "../../../helpers/imageLoader";
import { FeatureItem, IInfoItem } from "../../../types/global_types";
import { AboutText, AboutWrapper } from "./styles";
import { useQuery } from "react-query";
import getLiveNews from "../../../http/news/getLiveNews";
import News from "../News";

const getStatus = (status: string): string => {
  const values = {
    done: "done",
    inwork: "work",
    upcoming: "upcoming",
  };

  // @ts-ignore
  return values[status];
};

const About = () => {
  const { data } = useQuery("live-news", () =>
    getLiveNews("twitter/livenews/about")
  );
  // const { portfolio, partners, progress, aboutUsText, featuresItems, whyFomo } =
  //   useContext(AboutContext);

  return (
    <>
    
    </>
    // <AboutWrapper>
    //   <Typography variant="h1" id="about">
    //     About us
    //   </Typography>
    //   <br />
    //   <AboutText dangerouslySetInnerHTML={{ __html: aboutUsText }} />
    //   <Button variant="secondary" className="button">
    //     +Whitepaper
    //   </Button>
    //   <div className="list">
    //     {featuresItems.map((item: FeatureItem, id: number) => {
    //       return (
    //         <div key={id}>
    //           <h2>{item.title}</h2>
    //           <p>{item.text}</p>
    //         </div>
    //       );
    //     })}
    //   </div>
    //   <Typography variant="h1">Why FOMO?</Typography>
    //   <div className="list">
    //     {whyFomo.map((item: FeatureItem, id: number) => {
    //       return (
    //         <div key={id}>
    //           <h3>{item.title}</h3>
    //           <p>{item.text}</p>
    //         </div>
    //       );
    //     })}
    //   </div>
    //   <Typography variant="h1" id="portfolio">
    //     Portfolio
    //   </Typography>
    //   <p className="bold">
    //     Learn from others, share your work, and extend your tool set with a
    //     diverse group
    //   </p>
    //   <div className="images">
    //     {portfolio?.map((item: IInfoItem, index: number) => {
    //       return (
    //         <a
    //           className="about-image"
    //           key={index}
    //           target="_blank"
    //           href={item.link}
    //           rel="noreferrer"
    //         >
    //           <img src={imageLoader(String(item.img))} alt="fomo_portfolio" />
    //         </a>
    //       );
    //     })}
    //   </div>
    //   <br />
    //   <br />
    //   <br />
    //   <Typography variant="h1" id="partners">
    //     Partners
    //   </Typography>
    //   <p className="bold">
    //     Learn from others, share your work, and extend your tool set with a
    //     diverse group
    //   </p>
    //   <div className="images">
    //     {partners?.map((item: IInfoItem, index: number) => {
    //       return (
    //         <a
    //           className="about-image"
    //           key={index}
    //           target="_blank"
    //           href={item.link}
    //           rel="noreferrer"
    //         >
    //           <img src={imageLoader(String(item.img))} alt="fomo partners" />
    //         </a>
    //       );
    //     })}
    //     {/* {Array.from({ length: 18 }, (_, i) => i).map((_, index) => (
    //       <Image
    //         key={index}
    //         width={111}
    //         height={111}
    //         alt="image"
    //         src={question.src}
    //       />
    //     ))} */}
    //   </div>
    //   <br />
    //   <br />
    //   <br />
    //   <Typography variant="h1" id="progress">
    //     Progress
    //   </Typography>
    //   <div className="statuses">
    //     <p className="bold done">Done</p>
    //     <p className="bold work">In work</p>
    //     <p className="bold upcoming">Upcoming</p>
    //   </div>
    //   <div className="list left status-list">
    //     {progress.map((column: Array<any>, index: number) => {
    //       return (
    //         <div key={index}>
    //           <Typography variant="h3">{index + 1}st Stage</Typography>
    //           {column.map((row: any, index: number) => {
    //             return (
    //               <p key={index} className={getStatus(row.status)}>
    //                 {row.text}
    //               </p>
    //             );
    //           })}
    //         </div>
    //       );
    //     })}
    //   </div>
    //   <Typography className="left" variant="h1">
    //     Last news
    //   </Typography>
    //   <br id="contact" />
    //   {/* <NewsBlock 
    //   liveNews={data?.news || []}
    //   /> */}
    //   <News
    //     variant="card"
    //     project={{
    //       metadataLogo: `https://pbs.twimg.com/profile_images/1759221362198036480/lOYJ69oL_400x400.jpg`,
    //       name: "FOMO",
    //       twitterAcc: "/FOMOWiki",
    //     }}
    //     items={data?.news}
    //   />
    // </AboutWrapper>
  );
};

export default About;
