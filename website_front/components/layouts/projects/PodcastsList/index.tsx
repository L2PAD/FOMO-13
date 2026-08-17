import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchIconStyle } from "../OTC/DealsList/styles";
import Filter from "../../../global/Filter";
import image from "../../../../public/static/nextjs.jpg";
import { TwitterActionsWrapper } from "../../../global/ActionTwitterItem/styles";
import Pagination from "../../../global/Pagintaion";
import {
  ActionsWrapper,
  AddFavAction,
  PageDescriptionWrapper,
  PodcastWrapper,
  SearchInput,
  SubTabsAction,
  SubTabsFavWrapper,
  SubTabsWrapper,
} from "./styles";
import { PageWrapper } from "../../Cave/styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";
import Tabs from "../../../global/Tabs";
import CommentBlock from "../../../global/CommentBlock";
import CreatePodcastModal from "../modals/CreatePodcastModal";
import { Sort } from "../../../global/common/Sort";

const filters = [
  {
    type: "date",
    title: "Date",
  },
  {
    type: "range",
    title: "Rating",
    range: [0, 100],
    step: 1,
  },
  {
    type: "range",
    title: "Time",
    range: [0, 100],
    step: 1,
  },
  {
    type: "select",
    title: "Theme",
    placeholder: "Choose theme",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
];

const PodcastsList = () => {
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [activeTab, setActiveTab] = useState("Telegram");
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [modal, setMoal] = useState(false);

  return (
    <PageWrapper>
      <PageDescriptionWrapper>
        <Typography variant="h1">Podcast</Typography>
        <br />
        <Subtitle>
          A place where you can find discussion about the most recent events,
          technologies and tendencies with different types of people from the
          cryptosphere.
        </Subtitle>
      </PageDescriptionWrapper>
      <Tabs
        items={["Telegram", "Twitter", "Discord", "Live"]}
        activeItem={activeTab}
        onClick={(value: string) => setActiveTab(value)}
      />
      <SubTabsWrapper>
        <div>
          <SubTabsAction
            onClick={() => setActiveSubTab(0)}
            active={activeSubTab === 0}
          >
            Featured
          </SubTabsAction>
          <SubTabsAction
            onClick={() => setActiveSubTab(1)}
            active={activeSubTab === 1}
          >
            Popular
          </SubTabsAction>
          <SubTabsAction
            onClick={() => setActiveSubTab(2)}
            active={activeSubTab === 2}
          >
            New
          </SubTabsAction>
        </div>
        <SubTabsFavWrapper>
          <AddFavAction onClick={() => setMoal(true)}>
            + Create podcast
          </AddFavAction>
        </SubTabsFavWrapper>
      </SubTabsWrapper>
      <br />
      <div>
        <SearchInput
          type="text"
          placeholder="Search"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
      </div>
      <ActionsWrapper>
        <Filter filters={filters} />
        <Sort
          label="Sort by"
          type="name / date"
          options={[
            {
              label: "Name",
              items: ["A-Z", "Z-A"],
              value: name,
              setValue: setName,
            },
            {
              label: "Date",
              items: ["New", "Old"],
              value: date,
              setValue: setDate,
            },
          ]}
        />
      </ActionsWrapper>
      <TwitterActionsWrapper>
        {Array(10)
          .fill("")
          .map((item, i) => {
            return (
              <PodcastWrapper variant="default" key={i}>
                <Image width={100} height={100} src={image.src} alt="item" />
                <Link href="/utility/podcasts/123/">Podcast name</Link>
              </PodcastWrapper>
            );
          })}
      </TwitterActionsWrapper>
      <Pagination
        page={page}
        total={20}
        limit={20}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
      <CommentBlock />
      {modal && <CreatePodcastModal onClose={() => setMoal(false)} />}
    </PageWrapper>
  );
};

export default PodcastsList;
