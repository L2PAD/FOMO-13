import React, { FC } from "react";
import { Arrow, LinkItem, ListItem, Wrapper } from "./styles";
import { useTranslation } from "i18n";

interface Props {
  items: { title: string; link: string }[];
  className?: string;
}

const BreadCrumbs: FC<Props> = ({ items, className }) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper className={className} aria-label="Breadcrumb" role="list">
      {items.map((item, i) => {
        const isLastItem = i === items.length - 1;
        return (
          <ListItem key={`${item.title}-${i}`}>
            <LinkItem $active={isLastItem} href={item.link}>
              {translateText(item.title)}
            </LinkItem>
            {!isLastItem ? (
              <Arrow>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="7"
                  height="11"
                  viewBox="0 0 7 11"
                  fill="none"
                >
                  <path
                    d="M1 0.5L6 5.5L1 10.5"
                    stroke="#738094"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Arrow>
            ) : null}
          </ListItem>
        );
      })}
    </Wrapper>
  );
};

export default BreadCrumbs;
