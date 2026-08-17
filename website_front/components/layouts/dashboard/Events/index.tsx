import React, { useState } from "react";
import { PageWrapper } from "../styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Rating } from "../components/Rating";
import { SearchInput, SearchWrapper } from "../../projects/P2PExchange/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";

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

const EventsPage = () => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <PageWrapper>
      <Typography variant="h1">Events</Typography>
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
      </SearchWrapper>
      <br />
      <Subtitle>
        NFTs marketplace for zkSync projects where you can buy/sell your NFT.
      </Subtitle>
      <br />
      <Typography variant="h2">Digest</Typography>
      <br />
      <Rating header="Top Rated Projects by ROI" data={data1} />
      <br />
      <br />
      <Rating header="Top Gainers" data={data2} />
      <br />
      В разработке...
      <CommentBlock />
    </PageWrapper>
  );
};

export default EventsPage;
