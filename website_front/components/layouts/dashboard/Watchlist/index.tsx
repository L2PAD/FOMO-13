import React from "react";
import { FlexContainer, PageWrapper } from "../styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Rating } from "../components/Rating";
import { Projects } from "../components/Projects";
import { FearGreedIndex } from "../components/FearGreedIndex";
import { BTCDominance } from "../components/BTCDominance";
import { HotTrending } from "../components/HotTrending";

const data1 = [
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.9,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.9,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.8,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.8,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.75,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.75,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.6,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.6,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.5,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.5,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.4,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.4,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.3,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.3,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.25,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.25,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "450.3x",
      valueVariant: "default",
      fill: 0.1,
      fillVariant: "top",
    },
    bottomData: {
      value: "0.003x",
      valueVariant: "default",
      fill: 0.1,
      fillVariant: "bottom",
    },
  },
];

const data2 = [
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
    name: "SharkRace",
    price: "$111.8",
    topData: {
      value: "209.0%",
      valueVariant: "top",
      fill: 0.95,
      fillVariant: "top",
    },
    bottomData: {
      value: "-209.0%",
      valueVariant: "bottom",
      fill: 0.95,
      fillVariant: "bottom",
    },
  },
];

const WatchlistPage = () => {
  return (
    <PageWrapper>
      <Typography variant="h1">Watchlist</Typography>
      <br />
      <Subtitle>
        NFTs marketplace for zkSync projects where you can buy/sell your NFT.
      </Subtitle>
      <br />
      <br />
      <Rating header="" data={data1} />
      <br />
      <br />
      <Rating header="Total Monthly Raise" data={data2} />
      <br />
      <br />
      <FlexContainer>
        <FearGreedIndex />
        <BTCDominance />
      </FlexContainer>
      <br />
      <br />
      <HotTrending />
      <br />
      <br />
      <Projects header="Heatmap Projects" />
      <CommentBlock />
    </PageWrapper>
  );
};

export default WatchlistPage;
