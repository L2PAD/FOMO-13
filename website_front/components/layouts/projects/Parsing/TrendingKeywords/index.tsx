import React, { useState } from "react";
import { DescriptionWrapper, Header, Items, Wrapper } from "./styles";
import ArrowRefresh from "../../../../global/Icons/ArrowRefresh";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import { useQuery } from "react-query";
import getRandomKeywords from "../../../../../http/parcing/getRandomKeywords";
import Placeholder from "../../../../global/common/Placeholder";
import { useTranslation } from "i18n";


const TrendingKeywords = () => {
  const { translateText } = useTranslation();
  const { data, isLoading, refetch } = useQuery(
    "random-keywords",
    () => getRandomKeywords(),
    {
      refetchInterval: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
    }
  );
  const [isDescriptionModal, setIsDescriptionModal] = useState<boolean>(false);

  return (
    <Wrapper>
      <Header>
        <div className="title">
          {translateText("Trending Keywords/Phrases")}
          <button
            onClick={async () => {
              await refetch();
            }}
            onMouseEnter={() => setIsDescriptionModal(true)}
            onMouseLeave={() => setIsDescriptionModal(false)}
          >
            <ArrowRefresh />
          </button>
          <DescriptionWrapper>
            <DescriptionComponent
              isDate={false}
              date={new Date()}
              isVisible={isDescriptionModal}
              text={translateText("Refresh list")}
              className="description-component"
            />
          </DescriptionWrapper>
        </div>
        <div className="description">
          {translateText("Updated automatically every hour")}
        </div>
      </Header>
      <Items>
        {isLoading ? (
          <Placeholder height="100%" />
        ) : (
          data?.keywords &&
          data?.keywords.length &&
          data?.keywords?.map((item: string, i: number) => {
            return (
              <div className="item" key={`${item}${i}`}>
                {item.replace('@','')}
              </div>
            );
          })
        )}
      </Items>
    </Wrapper>
  );
};

export default TrendingKeywords;
