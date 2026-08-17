/* eslint-disable */
import React, { FC, useContext, useState } from "react";
import { LayoutContext } from "../Layout";
import moment from "moment";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/static/logo-beta.png";
import Typography from "../common/Typography";
import Modal from "../common/Modal";
import {
  ArrowRightIcon,
  DiscordIcon,
  EmailIcon,
  InstagramIcon,
  LinkIcon,
  TelegramIcon,
  TikTokIcon,
  TwitterIcon,
  YouTubeIcon,
} from "../Icons";
import {
  FomoLabel,
  FooterContent,
  FooterWrapper,
  InboxInputWrapper,
  InboxTitle,
  InboxWrapper,
  LeftWrapper,
  ListItemsWrapper,
  ListsWrapper,
  ListTitle,
  ModalText,
  TwoLinksWrapper,
} from "./styles";
import FomoLogo from "../Icons/FomoLogo";
import { sanitizedHtml } from "../../../helpers/sanitizeHtml";

const SocialIcons = {
  instagram: InstagramIcon,
  discord: DiscordIcon,
  email: EmailIcon,
  telegramEn: TelegramIcon,
  telegramRu: TelegramIcon,
  tikTok: TikTokIcon,
  twitter: TwitterIcon,
  youtube: YouTubeIcon,
  linktree: LinkIcon,
};

const SocialNames = {
  instagram: "Instagram",
  discord: "Discord",
  email: "Email",
  telegramEn: "Telegram",
  telegramRu: "Telegram",
  tikTok: "TikTok",
  twitter: "Twitter",
  youtube: "YouTube",
  linktree: "Linktree",
};

const CurrentModalTitle = {
  terms: "Terms of use",
  policy: "Privat policy",
  disclaimer: "Disclaimer",
  careers: "Careers",
};

interface IProps {
  layoutData: any;
}

const AboutFooter: FC<IProps> = ({ layoutData }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [legalHTML, setLegalHTML] = useState<string>("");
  const [legalTitle, setLegalTitle] = useState<string>("");
  const socialList: Array<any> | undefined =
    layoutData?.layout?.footer?.social &&
    Object.entries(layoutData?.layout?.footer?.social);

  const openModalHandler = (
    key: "terms" | "policy" | "disclaimer" | "careers"
  ) => {
    const html: string = layoutData?.layout?.footer?.legal[key];
    const title: string = CurrentModalTitle[key];
    setLegalHTML(html);
    setLegalTitle(title);
    setIsVisible(true);
  };

  return (
    <>
      <FooterWrapper>
        <FooterContent>
          <LeftWrapper>
            <FomoLogo />
            <InboxWrapper>
              <InboxTitle>
                <div>Supercharge your inbox</div>
                <span>Sign up for our developer newsletter</span>
              </InboxTitle>
              <InboxInputWrapper>
                <input type="email" placeholder="Enter your email address" />
              </InboxInputWrapper>
            </InboxWrapper>
          </LeftWrapper>
          <ListsWrapper>
            <div>
              <ListTitle variant="p">Services</ListTitle>
              <ListItemsWrapper>
                <li>
                  <Link href="/crypto/projects">Projects</Link>
                </li>
                <li>
                  <Link href="/crypto/funds">Funds</Link>
                </li>
                <li>
                  <Link href="/crypto/persons">Persons</Link>
                </li>
                <li>
                  <Link href="/crypto/calendar">Calendar</Link>
                </li>
                <li>
                  <Link href="/crypto/news">News</Link>
                </li>
              </ListItemsWrapper>
            </div>
            <div>
              <ListTitle variant="p">Contacts</ListTitle>
              <TwoLinksWrapper>
                <ListItemsWrapper>
                  {socialList ? (
                    socialList
                      .slice(0, Math.ceil(socialList.length / 2))
                      .filter((item: any) => !!item[1]?.length)
                      .map((item: any, i: number) => {
                        // @ts-ignore
                        const name: string = SocialNames[item[0]];
                        // @ts-ignore
                        const Icon: any = SocialIcons[item[0]];

                        return (
                          <li key={i}>
                            <a target={"_blank"} href={`${item[1]}`}>
                              <Icon fill={"#070B35"} />
                              {name}
                            </a>
                          </li>
                        );
                      })
                  ) : (
                    <></>
                  )}
                </ListItemsWrapper>
                {/* <ListItemsWrapper>
                {
                  socialList
                  ?
                  socialList.slice(Math.ceil(socialList.length / 2),socialList.length).map((item:any,i:number) => {
                    // @ts-ignore
                    const name : string = SocialNames[item[0]]
                    // @ts-ignore
                    const Icon : any = SocialIcons[item[0]]
             
                    return (
                      <li
                      key={i}
                      >
                        <a 
                        target={'_blank'}
                        href={`${item[1]}`}>
                          <Icon fill={"#070B35"}/>
                          {name}
                        </a>
                      </li>
                    )
                  })
                  :
                  <></>
                }
              </ListItemsWrapper> */}
              </TwoLinksWrapper>
            </div>
            <div>
              <ListTitle variant="p">Legal</ListTitle>
              <ListItemsWrapper>
                <li>
                  <button onClick={() => openModalHandler("policy")}>
                    Privat policy
                  </button>
                </li>
                <li>
                  <button onClick={() => openModalHandler("terms")}>
                    Terms of use
                  </button>
                </li>
                <li>
                  <button onClick={() => openModalHandler("disclaimer")}>
                    Disclaimer
                  </button>
                </li>
                {/* <li>
                <button
                onClick={() => openModalHandler('careers')}
                >Careers</button>
              </li>
              <li>
                <a href="/">Whitepaper</a>
              </li> */}
              </ListItemsWrapper>
            </div>
          </ListsWrapper>
          <FomoLabel>© FOMO, {moment().format("YYYY")}</FomoLabel>
        </FooterContent>
      </FooterWrapper>
      {isVisible ? (
        <Modal
          variant={"big"}
          title={legalTitle}
          onClose={() => {
            setIsVisible(false);
            setLegalHTML("");
            setLegalTitle("");
          }}
        >
          <ModalText
            dangerouslySetInnerHTML={sanitizedHtml(legalHTML)}
          ></ModalText>
        </Modal>
      ) : (
        <></>
      )}
    </>
  );
};

export default AboutFooter;
