import React, { useState } from "react";
import FilterSortHeader from "../../../global/FilterSortHeader";
import { ActionsTableProjects } from "../../../../staticContent/global";
import {
  DiscordIcon,
  InstagramIcon,
  LinkedinIcon,
  TelegramIcon,
  TwitterIcon,
  YouTubeIcon,
} from "../../../global/Icons";
import ActionsTable from "../../../global/Tables/ActionsTable";
import Pagination from "../../../global/Pagintaion";
import RendererComponent from "./rendererComponent";
import {
  PageDescriptionWrapper,
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  SocialButton,
  SocialsWrapper,
  TableWrapper,
} from "./styles";

import { PageWrapper } from "../Onchain/styles";
import CommentBlock from "../../../global/CommentBlock";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";

const filters = [
  {
    type: "checkbox",
    title: "Category",
    items: ["Funds", "Persons", "Projects"],
  },
  {
    type: "range",
    title: "Subscribers",
    range: [0, 15000],
    step: 1,
  },
  {
    type: "range",
    title: "Rating",
    range: [0, 100],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Peculiarities",
    items: ["Red flag", "Smart money"],
  },
];

const SocialNetworks = () => {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [activeSocial, setActiveSocial] = useState("twitter");
  const [page, setPage] = useState(1);

  const chooseSocial = (value: string) => {
    setActiveSocial(value);
  };

  return (
    <PageWrapper>
      <PageDescriptionWrapper>
        <Typography variant="h1">L2 Social network</Typography>
        <br />
        <Subtitle>
          This section shows social network connections between
          people/projects/funds. It will give some clues and understanding who
          you are dealing with.
        </Subtitle>
        <br />
      </PageDescriptionWrapper>
      <SocialsWrapper>
        <SocialButton
          active={activeSocial === "twitter"}
          onClick={() => chooseSocial("twitter")}
        >
          <TwitterIcon />
          <span>Twitter</span>
        </SocialButton>
        <SocialButton
          active={activeSocial === "discord"}
          onClick={() => chooseSocial("discord")}
        >
          <DiscordIcon />
          <span>Discord</span>
        </SocialButton>
        <SocialButton
          active={activeSocial === "telegram"}
          onClick={() => chooseSocial("telegram")}
        >
          <TelegramIcon />
          <span>Telegram</span>
        </SocialButton>
        <SocialButton
          active={activeSocial === "instagram"}
          onClick={() => chooseSocial("instagram")}
        >
          <InstagramIcon />
          <span>Instagram</span>
        </SocialButton>
        <SocialButton
          active={activeSocial === "youtube"}
          onClick={() => chooseSocial("youtube")}
        >
          <YouTubeIcon />
          <span>YouTube</span>
        </SocialButton>
        <SocialButton
          active={activeSocial === "linkedin"}
          onClick={() => chooseSocial("linkedin")}
        >
          <LinkedinIcon />
          <span>Linkedin</span>
        </SocialButton>
      </SocialsWrapper>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search the project/fund/person"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <FilterSortHeader
        isGrid={false}
        filters={filters}
        sort={{
          label: "Sort by",
          type: "name",
          options: [
            {
              label: "Name",
              items: ["A-Z", "Z-A"],
              value: sortValue,
              setValue: setSortValue,
            },
          ],
        }}
      />
      <TableWrapper>
        <ActionsTable
          type="project"
          cardsData={{
            show: 10,
            //@ts-ignore
            cards: ActionsTableProjects.map((item) => ({
              ...item,
              rendererContent: <RendererComponent />,
            })),
          }}
        />
        <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </TableWrapper>
      <CommentBlock />
    </PageWrapper>
  );
};

export default SocialNetworks;
