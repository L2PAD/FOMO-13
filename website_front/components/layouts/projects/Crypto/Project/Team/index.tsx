import React, { FC } from "react";
import { Persons, Wrapper } from "./styles";
import { Title } from "../Fundraising/styles";
import { IPerson, IProject } from "../../../../../../types/global_types";
import { CardLinkWrapper, CardWrapper } from "../../../Persons/styles";
import TeamAchievements from "./Achievements";
import Partners from "./Partners";
import { EditIcon } from "../../../../../global/Icons";
import EmptySection from "../../../../../global/EmptySection";
import Person from "../../../../nfts/Persons/Person";
import { useTranslation } from "i18n";
import { USER_LOGO_FALLBACK } from "../../../../../../helpers/imageFallbacks";
import { getBackerHref } from "../../../../../../helpers/backerRoute";

const persons: Array<any> = [
  {
    _id: "677bc87a5fb46165b2696e92",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "SOME NAME",
    niche: "",
    logo: "/76110.21955271931_630c5fcaf8184351dc5c6ee5.png",
    rating: "88",
    banner: "TEXT",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Jan 06 2025 14:11:12 GMT+0200 (за східноєвропейським стандартним часом)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-12-30T16:38:27.816Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
  {
    _id: "677bc85f5fb46165b2696e7a",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "Person name",
    niche: "",
    logo: "/8487.158489296753_pd5rDfQK_400x400.jpg",
    rating: "88",
    banner: "BANNER",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Jan 06 2025 13:06:05 GMT+0200 (за східноєвропейським стандартним часом)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-12-30T16:38:27.816Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
  {
    _id: "6704245950fe78d60d85243c",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "Sofiane Delloue",
    niche: "",
    logo: "/65451.157411882035_60943.47384833696_p_L5tH2y_400x400.jpg",
    rating: "88",
    banner: "CEO",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [
      {
        text: "test",
        link: "",
        type: true,
      },
      {
        text: "tets2",
        link: "",
        type: true,
      },
    ],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Oct 07 2024 21:10:16 GMT+0300 (Восточная Европа, летнее время)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-10-06T15:07:39.773Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "<p>Sofiane Delloue, M.A. is founder of New Life company, an invitation-based life enhancement platform for innovators who seek excitement in interacting with upcoming cultures, technologies, and evolutions in economic models.&nbsp;</p>\n<p>More details about the scam with the Newcoin project will be written in the project section.</p>\n<p></p>\n",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
  {
    _id: "677bc87a5fb46165b2696e92",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "SOME NAME",
    niche: "",
    logo: "/76110.21955271931_630c5fcaf8184351dc5c6ee5.png",
    rating: "88",
    banner: "TEXT",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Jan 06 2025 14:11:12 GMT+0200 (за східноєвропейським стандартним часом)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-12-30T16:38:27.816Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
  {
    _id: "677bc85f5fb46165b2696e7a",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "Person name",
    niche: "",
    logo: "/8487.158489296753_pd5rDfQK_400x400.jpg",
    rating: "88",
    banner: "BANNER",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Jan 06 2025 13:06:05 GMT+0200 (за східноєвропейським стандартним часом)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-12-30T16:38:27.816Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
];

const advisors: Array<any> = [
  {
    _id: "677bc87a5fb46165b2696e92",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "SOME NAME",
    niche: "",
    logo: "/76110.21955271931_630c5fcaf8184351dc5c6ee5.png",
    rating: "88",
    banner: "TEXT",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Jan 06 2025 14:11:12 GMT+0200 (за східноєвропейським стандартним часом)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-12-30T16:38:27.816Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
  {
    _id: "677bc85f5fb46165b2696e7a",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "Person name",
    niche: "",
    logo: "/8487.158489296753_pd5rDfQK_400x400.jpg",
    rating: "88",
    banner: "BANNER",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Jan 06 2025 13:06:05 GMT+0200 (за східноєвропейським стандартним часом)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-12-30T16:38:27.816Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
  {
    _id: "6704245950fe78d60d85243c",
    projectStatus: "active",
    isDuplicate: false,
    status: "Active",
    name: "Sofiane Delloue",
    niche: "",
    logo: "/65451.157411882035_60943.47384833696_p_L5tH2y_400x400.jpg",
    rating: "88",
    banner: "CEO",
    investors: [],
    team: [],
    advisors: [],
    partners: [],
    comments: [],
    redFlags: 0,
    redFlagsList: [
      {
        text: "test",
        link: "",
        type: true,
      },
      {
        text: "tets2",
        link: "",
        type: true,
      },
    ],
    greenFlagsList: [],
    redStatus: false,
    totalRaised: "",
    lastFunding:
      "Mon Oct 07 2024 21:10:16 GMT+0300 (Восточная Европа, летнее время)",
    fullness: "75%",
    actionType: "projects",
    actionDate: "2024-10-06T15:07:39.773Z",
    price: 0,
    lowPrice: 0,
    highPrice: 0,
    bio: "<p>Sofiane Delloue, M.A. is founder of New Life company, an invitation-based life enhancement platform for innovators who seek excitement in interacting with upcoming cultures, technologies, and evolutions in economic models.&nbsp;</p>\n<p>More details about the scam with the Newcoin project will be written in the project section.</p>\n<p></p>\n",
    marketCap: 0,
    volume: 0,
    volumeGrowth: 0,
    totalSupply: 0,
    totalForSale: 0,
    totalAllocation: [],
    participated: [],
    colleagues: [],
    __v: 0,
  },
];

interface IProps {
  project: IProject;
  projectDataToUpdate?: IProject | null;
  isEditState?: boolean;
  inputsHandler?: (name: string, value: any) => void;
  openKeyMembersModal?: () => void;
  openAdvisorsModal?: () => void;
}

const TeamTab: FC<IProps> = ({
  project,
  projectDataToUpdate,
  isEditState,
  inputsHandler,
  openKeyMembersModal,
  openAdvisorsModal,
}) => {
  const { translateText } = useTranslation();
  const currentPersons: Array<any> = isEditState
    ? projectDataToUpdate?.team || []
    : project.team || [];
  const currentAdvisors: Array<any> = isEditState
    ? projectDataToUpdate?.advisors || []
    : project.advisors || [];
  const members: { name: string; description: string }[] =
    project?.organizations?.map((item: any) => {
      return {
        name: item.name,
        description: item.description,
        logo: item.logo,
        url: item.url,
      };
    }) || [];
  return (
    <Wrapper>
      <Title>
        {project.name} {translateText("Key Members")}
        {isEditState ? (
          <button onClick={openKeyMembersModal} className="edit-btn">
            <EditIcon fill="#04A584" />
          </button>
        ) : (
          <></>
        )}
      </Title>
      <Persons>
        {members.map((item: any) => {
          return (
            <CardLinkWrapper className="project-page" href={item.url || ``} key={item.name}>
              {/*//@ts-ignore*/}
              <CardWrapper
                redFlagsList={[]}
                banner={item.description}
                logo={item.logo || USER_LOGO_FALLBACK}
                name={item.name}
                niche={project.sector || ""}
                rating={"0"}
                redFlags={"0"}
              />
            </CardLinkWrapper>
          );
        })}
      </Persons>
      <Persons>
        {currentPersons.length ? (
          currentPersons.map((item: any, index: number) => {
            return (
              <CardLinkWrapper
                className="project-page"
                href={getBackerHref(item, "person")}
                key={index}
              >
                {/*//@ts-ignore*/}
                <CardWrapper
                  redFlagsList={
                    item.redFlagsList?.length ? item.redFlagsList : []
                  }
                  banner={item.banner}
                  logo={String(item.logo)}
                  name={item.name}
                  rating={item.rating}
                  redFlags={item.redFlagsList?.length}
                />
              </CardLinkWrapper>
            );
          })
        ) : (
          <EmptySection />
        )}
      </Persons>
      <Title>
        {translateText("Advisors")}
        {isEditState ? (
          <button onClick={openAdvisorsModal} className="edit-btn">
            <EditIcon fill="#04A584" />
          </button>
        ) : (
          <></>
        )}
      </Title>
      <Persons>
        {currentAdvisors.length ? (
          currentAdvisors.map((item: any, index: number) => {
            return (
              <CardLinkWrapper
                className="project-page"
                href={getBackerHref(item, "person")}
                key={index}
              >
                {/*//@ts-ignore*/}
                <CardWrapper
                  redFlagsList={
                    item.redFlagsList?.length ? item.redFlagsList : []
                  }
                  banner={item.banner}
                  logo={String(item.logo)}
                  name={item.name}
                  rating={item.rating}
                  redFlags={item.redFlagsList?.length}
                />
              </CardLinkWrapper>
            );
          })
        ) : (
          <EmptySection />
        )}
      </Persons>
      <Title>{translateText("Team Achievements")}</Title>
      <TeamAchievements
        project={project}
        projectDataToUpdate={projectDataToUpdate}
        inputsHandler={inputsHandler}
        isEditState={isEditState}
      />
      <Title style={{ marginTop: "20px" }}>{translateText("Key Partners/Collaborators")}</Title>
      <Partners
        project={project}
        projectDataToUpdate={projectDataToUpdate}
        inputsHandler={inputsHandler}
        isEditState={isEditState}
      />
    </Wrapper>
  );
};

export default TeamTab;
