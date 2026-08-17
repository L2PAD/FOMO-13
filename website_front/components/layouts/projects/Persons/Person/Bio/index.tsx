import React, { FC } from "react";
import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import EmptySection from "../../../../../global/EmptySection";
import { SocialMediaInfo } from "../AboutPerson/styles";
import { getServiceByUrl } from "../../../../../../helpers/getServiceByUrl";
import Image from "next/image";
import imageLoader from "../../../../../../helpers/imageLoader";
import { sanitizedHtml } from "../../../../../../helpers/sanitizeHtml";

export const Body = styled(BaseCard)`
  width: 100%;
  font-size: 16px;

  span {
    font-weight: var(--font-weight-semibold);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  li {
    a {
      font-weight: var(--font-weight-semibold);
      color: #04a584;
    }
  }
`;

const Wrapper = styled.div`
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin-bottom: 20px;
  }
`;

interface IProps {
  person: any;
}

const BioBlock: FC<IProps> = ({ person }) => {
  return (
    <Wrapper>
      <h2>Bio</h2>
      <Body variant="main">
        <div dangerouslySetInnerHTML={sanitizedHtml(person.descriptionText)} />
        {person?.socialmedia?.length ? (
          <SocialMediaInfo>
            <div className="media-title">Connect with {person.name}</div>
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
    </Wrapper>
  );
};

export default BioBlock;
