import React from "react";
import { FlexContainer, PageWrapper } from "../styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import CommentBlock from "../../../global/CommentBlock";
import { ActivitiesUpdates } from "../components/ActivitiesUpdates";
import { Crypto } from "../components/Crypto";
import { Rating } from "../components/Rating";
import { Projects } from "../components/Projects";

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

const NFTsPage = () => {
  return (
    <PageWrapper>
      <Typography variant="h1">NFTs</Typography>
      <br />
      <Subtitle>
        NFT marketplace for zkSync projects where you can buy and sell your
        NFT’s
      </Subtitle>
      <br />
      <Typography variant="h2">All Crypto Activities</Typography>
      <br />
      <Typography variant="p">
        Everyone can vote on the proposals. However, number of votes are
        allocated based on the FOMO NFT key. 1 NFT = 1 VOTE
      </Typography>
      <br />
      <FlexContainer>
        <ActivitiesUpdates />
        <ActivitiesUpdates />
      </FlexContainer>
      <br />
      <br />
      <Typography variant="h2">Digest</Typography>
      <br />
      <Typography variant="p">
        Everyone can vote on the proposals. However, number of votes are
        allocated based on the FOMO NFT key. 1 NFT = 1 VOTE
      </Typography>
      <br />
      <FlexContainer>
        <Crypto header="Hot NFT Projectss" />
        <Crypto header="Recently added" />
      </FlexContainer>
      <br />
      <br />
      <Rating header="Top NFT by ROI" data={data1} />
      <br />
      <br />
      <Rating header="Top Gainers" data={data2} />
      <br />
      <br />
      <Projects header="Heatmap Projects" />
      <CommentBlock />
    </PageWrapper>
  );
};

export default NFTsPage;
