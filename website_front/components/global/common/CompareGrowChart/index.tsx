import React, { FC, useMemo, useState } from "react";
import {
  CategoriesBars,
  CategoriesBlock,
  CategoriesButton,
  CategoriesItem,
  CategoriesItemCharts,
  CategoriesList,
  CategoriesName,
  CategoriesProject,
  CategoriesProjectContent,
  ChartBar,
  ChartLabel,
  ChartWrapper,
  ShowMoreButton,
  Wrapper,
} from "./styles";
import UserAvatar from "../UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import ArrowSelectIcon from "../../Icons/ArrowSelectIcon";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import PlaceholderTable from "../PlaceholderTable";
import EmptySection from "../../EmptySection";
import { FundComparisonEntryAgeCategory } from "../../../../http/funds/fetchFundComparison";

interface IProps {
  categories?: FundComparisonEntryAgeCategory[];
  isLoading?: boolean;
}

const CompareGrowChart: FC<IProps> = ({
  categories = [],
  isLoading = false,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<number>(-1);
  const maxCategoryValue = useMemo(() => {
    return Math.max(...categories.map((item) => Number(item.a || 0)), 1);
  }, [categories]);
  const maxItemValue = useMemo(() => {
    return Math.max(
      ...categories.flatMap((item) =>
        (item.items || []).map((project) => Number(project.a || 0)),
      ),
      1,
    );
  }, [categories]);

  const handleSelectedCategories = (id: number): void => {
    setSelectedCategories(id === selectedCategories ? -1 : id);
  };

  return (
    <Wrapper variant="main">
      <CategoriesList>
        {isLoading ? (
          <PlaceholderTable height="58px" />
        ) : !categories.length ? (
          <EmptySection />
        ) : categories.map((item, i) => {
          return (
            <CategoriesBlock key={item.key || item.name || i}>
              <CategoriesButton
                isOpen={selectedCategories === i}
                onClick={() => handleSelectedCategories(i)}
              >
                <ArrowSelectIcon className="rotate-90" fill="#738094" />
                <CategoriesName>{item.name}</CategoriesName>
                <CategoriesBars>
                  <ChartWrapper>
                    <ChartBar
                      height={20}
                      width={(Number(item.a || 0) / maxCategoryValue) * 100}
                      bg={item.bgColor || "blue"}
                    />
                    <ChartLabel width={90} style={{ fontWeight: "var(--font-weight-semibold)" }}>
                      Avg ROI - {clarifyAmount(item.a)}x
                    </ChartLabel>
                  </ChartWrapper>
                </CategoriesBars>
              </CategoriesButton>
              <CategoriesProject isOpen={selectedCategories === i}>
                <CategoriesProjectContent>
                  {(item.items || []).map((project, j) => (
                    <CategoriesItem key={`${project.name}-${j}`}>
                      <div className="project">
                        <UserAvatar
                          avatar={imageLoader(project.logo)}
                          name={project.name}
                          variant="default"
                          size="small"
                        />
                        <div className="project-info">
                          <div>{project.name}</div>
                          <span>{project.niche || project.fundName}</span>
                        </div>
                      </div>
                      <CategoriesItemCharts>
                        <ChartWrapper>
                          <ChartBar
                            width={(Number(project.a || 0) / maxItemValue) * 100}
                            height={10}
                            bg={item.bgColor || "blue"}
                          />
                          <ChartLabel width={90}>
                            Avg ROI - {clarifyAmount(project.a)}x
                          </ChartLabel>
                        </ChartWrapper>
                      </CategoriesItemCharts>
                    </CategoriesItem>
                  ))}
                  {(item.items || []).length > 8 ? (
                    <ShowMoreButton>Show More</ShowMoreButton>
                  ) : null}
                </CategoriesProjectContent>
              </CategoriesProject>
            </CategoriesBlock>
          );
        })}
      </CategoriesList>
    </Wrapper>
  );
};

export default CompareGrowChart;
