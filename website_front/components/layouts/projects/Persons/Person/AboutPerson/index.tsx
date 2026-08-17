import React, { FC } from "react";
import Image from "next/image";
import SocialLinks, {
  xIcon,
  tgIcon,
  linkIcon,
} from "../../../../../global/common/SocialLinks";
import {
  IPerson,
  IPersonAchievements,
  IPersonInfoBlock,
} from "../../../../../../types/global_types";
import xNewIcon from "../../../../../../assets/icons/project-page-icons/x.png";
import dsIcon from "../../../../../../assets/icons/project-page-icons/discord.png";
import mediumIcon from "../../../../../../assets/icons/project-page-icons/medium.png";
import youTubeIcon from "../../../../../../assets/icons/project-page-icons/youtube.png";
import telegramIcon from "../../../../../../assets/icons/project-page-icons/telegram.png";
import gitHubIcon from "../../../../../../assets/icons/project-page-icons/github.png";
import linkedinIcon from "../../../../../../assets/icons/project-page-icons/linkedin.png";
import imageLoader from "../../../../../../helpers/imageLoader";

import {
  Body,
  DetailsItem,
  DetailsItems,
  DetailsTitle,
  PersonDetailsBlock,
  SocialMediaInfo,
  Wrapper,
} from "./styles";
import AboutProjectEdit from "../../../Crypto/Project/AboutEdit";
import EmptyList from "../../../../../global/EmptyList";
import { getServiceByUrl } from "../../../../../../helpers/getServiceByUrl";
import PersonEditBlock from "../EditBlock";
import PersonEditRow from "../EditRow";
import EditAchievements from "../EditAchievements";
import EmptySection from "../../../../../global/EmptySection";
import { useTranslation } from "i18n";
import { sanitizedHtml } from "../../../../../../helpers/sanitizeHtml";

const text = `
    <p>
    Laurent Ghaul is a highly regarded <span>venture capitalist, strategic advisor, and thought leader</span> in the world of blockchain investments, AI-driven finance, and Web3 innovation. With over <span>12 years of experience</span>, he has built a reputation for identifying <span>high-potential early-stage projects</span> and providing the financial backing and strategic guidance needed to scale them into industry leaders.
    </p>
    <br/>
    <p>
    His expertise spans across <span>Decentralized Finance (DeFi), Non-Fungible Tokens (NFTs), GameFi, and AI-powered blockchain solutions.</span> Throughout his career, Laurent has played an instrumental role in shaping investment strategies for <span>emerging crypto-native funds, Web3 accelerators, and institutional players entering the blockchain space.</span> His keen analytical skills, deep market insights, and ability to anticipate industry trends have led to multiple high-ROI investments across various market cycles.
    </p>
    <br/>
    <ul>
        <li>
            <span>
            Current Role:
            </span>
            Managing Partner at <a href="#">Nexus Capital</a>
        </li>
        
        <li>
            <span>
            Investment Focus:
            </span>
            Early-stage blockchain startups, AI-driven financial models, decentralized finance innovations
        </li>
        
        <li>
            <span>
            Specialization Areas:
            </span>
            Venture Capital, Institutional Blockchain Investments, Tokenomics, and Web3 Ecosystem Growth           
        </li>
    </ul>
`;

const links = [
  {
    name: "X",
    icon: xNewIcon,
  },
  {
    name: "Discord",
    icon: dsIcon,
  },
  {
    name: "Telegram",
    icon: telegramIcon,
  },
  {
    name: "LinkedIn",
    icon: linkedinIcon,
  },
];

interface IProps {
  person: IPerson;
  isEditState: boolean;
  projectDataToUpdate: IPerson | null;
  isFullAuth?: boolean;
  inputsHandler: (name: string, value: any) => void;
  setIsEditState: () => void;
}

const AboutPerson: FC<IProps> = ({
  person,
  isEditState,
  projectDataToUpdate,
  isFullAuth,
  setIsEditState,
  inputsHandler,
}) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper>
      <h2>{translateText("Who is")} {person.name}?</h2>
      {isEditState && projectDataToUpdate ? (
        <AboutProjectEdit
          isCategories={false}
          project={projectDataToUpdate}
          inputsHandler={inputsHandler}
        />
      ) : (
        <Body variant="main">
          {person?.descriptionText ? (
            <div dangerouslySetInnerHTML={sanitizedHtml(person.descriptionText)} />
          ) : (
            <EmptySection isFullAuth={isFullAuth} onClick={setIsEditState} />
          )}
          {person?.socialmedia?.length ? (
            <SocialMediaInfo>
              <div className="media-title">{translateText("Connect with")} {person.name}</div>
              <div className="links-items">
                {person?.socialmedia?.length ? (
                  person.socialmedia.map((item: any) => {
                    const link: string = item.href ? item.href : item;

                    if (!link) return <></>;

                    const service = getServiceByUrl(link);

                    return (
                      <a
                        href={link}
                        target="_blank"
                        key={item.name}
                        rel="noreferrer"
                      >
                        {service?.icon ? (
                          <Image
                            //@ts-ignore
                            src={service?.icon}
                            alt={item.name}
                          />
                        ) : (
                          <img
                            src={imageLoader(String(person.logo))}
                            alt={item.name}
                          />
                        )}
                        <span>{service?.domain || link}</span>
                      </a>
                    );
                  })
                ) : (
                  <></>
                )}
              </div>
            </SocialMediaInfo>
          ) : (
            <></>
          )}
        </Body>
      )}
      <h2>{translateText("Background & Experience")}</h2>
      {isEditState ? (
        <PersonEditBlock
          onChange={(items: Array<IPersonInfoBlock>) =>
            inputsHandler("educationBlock", items)
          }
          header="educationBlock"
          items={projectDataToUpdate?.educationBlock || []}
        />
      ) : (
        <PersonDetailsBlock variant="main">
          <DetailsTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
            >
              <path
                d="M18.4475 18.7547L18.0662 18.1089L18.4475 18.7547ZM18.939 17.8936H18.189H18.939ZM10.9657 21.9043L10.5634 22.5373L10.9657 21.9043ZM13.0555 21.9386L13.4369 22.5844L13.0555 21.9386ZM1.90419 8.6376L1.52025 7.99333H1.52025L1.90419 8.6376ZM1.90419 9.49662L1.52025 10.1409H1.52025L1.90419 9.49662ZM12.512 15.2081L12.896 15.8524L12.512 15.2081ZM11.4882 15.2081L11.8721 14.5638L11.4882 15.2081ZM22.096 8.6376L22.48 7.99333L22.096 8.6376ZM22.096 9.49662L21.7121 8.85235L22.096 9.49662ZM6.01768 18.7591L6.42002 18.1261L6.01768 18.7591ZM12.512 2.92613L12.1281 3.5704L12.512 2.92613ZM11.4882 2.92613L11.8721 3.5704L11.4882 2.92613ZM22.9501 9.05046C22.9501 8.63625 22.6143 8.30046 22.2001 8.30046C21.7859 8.30046 21.4501 8.63625 21.4501 9.05046H22.9501ZM21.4501 14.4505C21.4501 14.8647 21.7859 15.2005 22.2001 15.2005C22.6143 15.2005 22.9501 14.8647 22.9501 14.4505H21.4501ZM12.1281 3.5704L21.7121 9.28187L22.48 7.99333L12.896 2.28186L12.1281 3.5704ZM21.7121 8.85235L12.1281 14.5638L12.896 15.8524L22.48 10.1409L21.7121 8.85235ZM2.28814 9.28187L11.8721 3.5704L11.1042 2.28186L1.52025 7.99333L2.28814 9.28187ZM11.8721 14.5638L5.93808 11.0275L5.17018 12.316L11.1042 15.8524L11.8721 14.5638ZM5.93808 11.0275L2.28814 8.85235L1.52025 10.1409L5.17018 12.316L5.93808 11.0275ZM4.80413 11.6718V17.9151H6.30413V11.6718H4.80413ZM5.61534 19.392L10.5634 22.5373L11.368 21.2714L6.42002 18.1261L5.61534 19.392ZM13.4369 22.5844L18.8289 19.4005L18.0662 18.1089L12.6742 21.2928L13.4369 22.5844ZM19.689 17.8936L19.689 11.6718H18.189L18.189 17.8936H19.689ZM18.8289 19.4005C19.3619 19.0857 19.689 18.5127 19.689 17.8936H18.189C18.189 17.982 18.1423 18.0639 18.0662 18.1089L18.8289 19.4005ZM10.5634 22.5373C11.4361 23.0921 12.5464 23.1103 13.4369 22.5844L12.6742 21.2928C12.2694 21.5318 11.7647 21.5235 11.368 21.2714L10.5634 22.5373ZM1.52025 7.99333C0.706791 8.47809 0.706795 9.65613 1.52025 10.1409L2.28814 8.85235C2.45083 8.94931 2.45083 9.18491 2.28814 9.28187L1.52025 7.99333ZM12.1281 14.5638C12.0492 14.6108 11.951 14.6108 11.8721 14.5638L11.1042 15.8524C11.6562 16.1813 12.344 16.1813 12.896 15.8524L12.1281 14.5638ZM21.7121 9.28187C21.5494 9.18491 21.5494 8.94931 21.7121 8.85235L22.48 10.1409C23.2934 9.65613 23.2934 8.47809 22.48 7.99333L21.7121 9.28187ZM4.80413 17.9151C4.80413 18.5138 5.11013 19.0709 5.61534 19.392L6.42002 18.1261C6.34784 18.0803 6.30413 18.0007 6.30413 17.9151H4.80413ZM12.896 2.28186C12.344 1.95292 11.6562 1.95292 11.1042 2.28186L11.8721 3.5704C11.951 3.52341 12.0492 3.52341 12.1281 3.5704L12.896 2.28186ZM21.4501 9.05046V14.4505H22.9501V9.05046H21.4501Z"
                fill="#070B35"
              />
            </svg>
            {translateText("Education")}
          </DetailsTitle>
          {person.educationBlock ? (
            person.educationBlock?.map((item: IPersonInfoBlock, i: number) => {
              return (
                <DetailsItem key={i}>
                  <div className="detail-title">
                    <div className="detail-dote" />
                    {item.name}
                  </div>
                  <div className="detail-name">{item.value}</div>
                  <div className="detail-date">{item.date}</div>
                </DetailsItem>
              );
            })
          ) : (
            <EmptySection isFullAuth={isFullAuth} onClick={setIsEditState} />
          )}
        </PersonDetailsBlock>
      )}
      <br />
      {isEditState ? (
        <PersonEditBlock
          onChange={(items: Array<IPersonInfoBlock>) =>
            inputsHandler("experienceBlock", items)
          }
          header="experienceBlock"
          items={projectDataToUpdate?.experienceBlock || []}
        />
      ) : (
        <PersonDetailsBlock variant="main">
          <DetailsTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
            >
              <path
                d="M17 14.5H14"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.211 10.7411L12.5102 11.4231C12.376 11.4757 12.232 11.5019 12.0868 11.4999C11.9416 11.4979 11.7984 11.4679 11.6659 11.4117C11.5314 11.3547 11.4103 11.273 11.3094 11.1712C11.2085 11.0695 11.1299 10.9497 11.0781 10.8189C10.9762 10.5702 10.9739 10.2947 11.0719 10.0446C11.1698 9.79443 11.3611 9.58712 11.6094 9.46198L13.3094 8.65711C13.4932 8.5667 13.695 8.51399 13.9017 8.50243C14.1083 8.49086 14.3152 8.52069 14.509 8.58998L18 9.89549"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 14.7583H8.23503L10.5885 16.3129C10.6986 16.4206 10.8527 16.4871 11.0183 16.4983C11.1839 16.5095 11.3481 16.4646 11.4762 16.373L14.7645 14.0217C14.8944 13.9286 14.9775 13.7954 14.996 13.6502C15.0146 13.505 14.9673 13.3593 14.864 13.2438L13.0524 11.5"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 9.16585L10.8217 8.92327C10.645 8.70413 10.4378 8.56448 10.2199 8.51757C10.002 8.47066 9.78062 8.51805 9.57669 8.65523L7 10.5"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 15.4987H6.06736C6.30135 15.5116 6.53079 15.4287 6.70555 15.268C6.8803 15.1074 6.98616 14.8821 7 14.6415V10.3577C6.98597 10.1172 6.88002 9.89214 6.70529 9.73169C6.53056 9.57123 6.30123 9.48841 6.06736 9.50131H4"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 15.4987H17.9326C17.6986 15.5116 17.4692 15.4287 17.2945 15.268C17.1197 15.1074 17.0138 14.8821 17 14.6415V10.3577C17.014 10.1172 17.12 9.89214 17.2947 9.73169C17.4694 9.57123 17.6988 9.48841 17.9326 9.50131H20"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 12.5C3 14.8869 3.94821 17.1761 5.63604 18.864C7.32387 20.5518 9.61305 21.5 12 21.5C14.3869 21.5 16.6761 20.5518 18.364 18.864C20.0518 17.1761 21 14.8869 21 12.5C21 10.1131 20.0518 7.82387 18.364 6.13604C16.6761 4.44821 14.3869 3.5 12 3.5C9.61305 3.5 7.32387 4.44821 5.63604 6.13604C3.94821 7.82387 3 10.1131 3 12.5Z"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {translateText("Professional Experience")}
          </DetailsTitle>
          {person?.experienceBlock ? (
            person.experienceBlock.map((item: IPersonInfoBlock, i: number) => {
              return (
                <DetailsItem key={i}>
                  <div className="detail-title">
                    <div className="detail-dote" />
                    {item.name}
                  </div>
                  <div className="detail-name green">{item.value}</div>
                  <div className="detail-date">{item.date}</div>
                </DetailsItem>
              );
            })
          ) : (
            <EmptySection isFullAuth={isFullAuth} onClick={setIsEditState} />
          )}
        </PersonDetailsBlock>
      )}

      <br />
      {isEditState ? (
        <PersonEditRow
          onChange={(items: Array<string>) =>
            inputsHandler("contributionsBlock", items)
          }
          header="contributionsBlock"
          items={projectDataToUpdate?.contributionsBlock || []}
        />
      ) : (
        <PersonDetailsBlock variant="main">
          <DetailsTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
            >
              <path
                d="M14.8239 2.89844L16.6542 7.84465L21.6004 9.67491L16.6542 11.5052L14.8239 16.4514L12.9937 11.5052L8.04745 9.67491L12.9937 7.84465L14.8239 2.89844Z"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M6.35333 14.1926L7.95216 16.5467L10.3063 18.1455L7.95216 19.7443L6.35333 22.0984L4.75451 19.7443L2.40039 18.1455L4.75451 16.5467L6.35333 14.1926Z"
                stroke="#070B35"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {translateText("Major Contributions")}
          </DetailsTitle>

          <DetailsItems>
            {person?.contributionsBlock?.length ? (
              person.contributionsBlock.map((item: string, i: number) => {
                return (
                  <DetailsItem key={i} className="row-item">
                    {item}
                  </DetailsItem>
                );
              })
            ) : (
              <EmptySection isFullAuth={isFullAuth} onClick={setIsEditState} />
            )}
          </DetailsItems>
        </PersonDetailsBlock>
      )}
      <h2>{translateText("Key Achievements")}</h2>
      {isEditState ? (
        <EditAchievements
          item={projectDataToUpdate?.achievementsBlock || null}
          onChange={(item: IPersonAchievements) =>
            inputsHandler("achievementsBlock", item)
          }
        />
      ) : person.achievementsBlock?.totalInvestments ||
        person.achievementsBlock?.highestRoi ? (
        <PersonDetailsBlock variant="main">
          <DetailsItem>
            <div className="detail-title">
              {translateText("Total Investments")}:{" "}
              {person.achievementsBlock?.totalInvestments || "$0"}
            </div>
          </DetailsItem>
          <DetailsItem className="row-item">
            <div className="detail-title">{translateText("Highest ROI")}:</div>
            <div
              className={
                Number(person.achievementsBlock?.highestRoi) > 0
                  ? "detail-value green"
                  : "detail-value red"
              }
            >
              {person.achievementsBlock?.highestRoi || "-"}
            </div>
          </DetailsItem>
          <DetailsItem>
            <div style={{ marginBottom: "8px" }} className="detail-title">
              {translateText("Notable Deals")}:
            </div>
            <DetailsItems className="small-items">
              {person?.achievementsBlock?.deals ? (
                person?.achievementsBlock?.deals.map(
                  (item: string, i: number) => {
                    return (
                      <DetailsItem key={i} className="row-item">
                        {item}
                      </DetailsItem>
                    );
                  }
                )
              ) : (
                <EmptySection
                  isFullAuth={isFullAuth}
                  onClick={setIsEditState}
                />
              )}
            </DetailsItems>
          </DetailsItem>
        </PersonDetailsBlock>
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
      <h2>{translateText("Network & Influence")}</h2>
      {isEditState ? (
        <PersonEditRow
          onChange={(items: Array<string>) =>
            inputsHandler("networkBlock", items)
          }
          header="networkBlock"
          items={projectDataToUpdate?.networkBlock || []}
        />
      ) : (
        <PersonDetailsBlock variant="main">
          <DetailsTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
            >
              <path
                d="M17 14.5H14"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.211 10.7411L12.5102 11.4231C12.376 11.4757 12.232 11.5019 12.0868 11.4999C11.9416 11.4979 11.7984 11.4679 11.6659 11.4117C11.5314 11.3547 11.4103 11.273 11.3094 11.1712C11.2085 11.0695 11.1299 10.9497 11.0781 10.8189C10.9762 10.5702 10.9739 10.2947 11.0719 10.0446C11.1698 9.79443 11.3611 9.58712 11.6094 9.46198L13.3094 8.65711C13.4932 8.5667 13.695 8.51399 13.9017 8.50243C14.1083 8.49086 14.3152 8.52069 14.509 8.58998L18 9.89549"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 14.7583H8.23503L10.5885 16.3129C10.6986 16.4206 10.8527 16.4871 11.0183 16.4983C11.1839 16.5095 11.3481 16.4646 11.4762 16.373L14.7645 14.0217C14.8944 13.9286 14.9775 13.7954 14.996 13.6502C15.0146 13.505 14.9673 13.3593 14.864 13.2438L13.0524 11.5"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 9.16585L10.8217 8.92327C10.645 8.70413 10.4378 8.56448 10.2199 8.51757C10.002 8.47066 9.78062 8.51805 9.57669 8.65523L7 10.5"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 15.4987H6.06736C6.30135 15.5116 6.53079 15.4287 6.70555 15.268C6.8803 15.1074 6.98616 14.8821 7 14.6415V10.3577C6.98597 10.1172 6.88002 9.89214 6.70529 9.73169C6.53056 9.57123 6.30123 9.48841 6.06736 9.50131H4"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 15.4987H17.9326C17.6986 15.5116 17.4692 15.4287 17.2945 15.268C17.1197 15.1074 17.0138 14.8821 17 14.6415V10.3577C17.014 10.1172 17.12 9.89214 17.2947 9.73169C17.4694 9.57123 17.6988 9.48841 17.9326 9.50131H20"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 12.5C3 14.8869 3.94821 17.1761 5.63604 18.864C7.32387 20.5518 9.61305 21.5 12 21.5C14.3869 21.5 16.6761 20.5518 18.364 18.864C20.0518 17.1761 21 14.8869 21 12.5C21 10.1131 20.0518 7.82387 18.364 6.13604C16.6761 4.44821 14.3869 3.5 12 3.5C9.61305 3.5 7.32387 4.44821 5.63604 6.13604C3.94821 7.82387 3 10.1131 3 12.5Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {translateText("Strategic Partnerships")}
          </DetailsTitle>
          {person?.networkBlock?.length ? (
            person.networkBlock.map((item: string, i: number) => {
              return (
                <DetailsItem key={i} className="row-item">
                  {item}
                </DetailsItem>
              );
            })
          ) : (
            <EmptySection isFullAuth={isFullAuth} onClick={setIsEditState} />
          )}
        </PersonDetailsBlock>
      )}
      <br />
      {isEditState ? (
        <PersonEditRow
          onChange={(items: Array<string>) =>
            inputsHandler("influenceBlock", items)
          }
          header="influenceBlock"
          items={projectDataToUpdate?.influenceBlock || []}
        />
      ) : (
        <PersonDetailsBlock variant="main">
          <DetailsTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
            >
              <path
                d="M16.0258 21.0713L16.0261 17.8576C16.0263 16.0824 14.5872 14.6432 12.812 14.6432H5.61481C3.83987 14.6432 2.40095 16.082 2.40075 17.8569L2.40039 21.0713M21.6001 21.0715L21.6004 17.8577C21.6005 16.0825 20.1615 14.6434 18.3863 14.6434M15.4067 4.56109C16.196 5.14673 16.7075 6.08559 16.7075 7.14392C16.7075 8.20225 16.196 9.1411 15.4067 9.72674M12.4942 7.14374C12.4942 8.91882 11.0552 10.3578 9.28013 10.3578C7.50506 10.3578 6.06608 8.91882 6.06608 7.14374C6.06608 5.36867 7.50506 3.92969 9.28013 3.92969C11.0552 3.92969 12.4942 5.36867 12.4942 7.14374Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {translateText("Social Media Influence")}
          </DetailsTitle>
          {person.influenceBlock?.length ? (
            person.influenceBlock.map((item: string, i: number) => {
              return (
                <DetailsItem key={i} className="row-item">
                  {item}
                </DetailsItem>
              );
            })
          ) : (
            <EmptySection isFullAuth={isFullAuth} onClick={setIsEditState} />
          )}
        </PersonDetailsBlock>
      )}
    </Wrapper>
  );
};

export default AboutPerson;
