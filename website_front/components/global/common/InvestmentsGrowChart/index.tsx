import React, { useEffect, useMemo, useState } from "react";
import {
  CategoriesBars,
  CategoriesBlock,
  CategoriesButton,
  CategoriesItem,
  CategoriesItemCharts,
  CategoriesList,
  CategoriesName,
  CategoriesProject,
  ChartBar,
  ChartLabel,
  ChartWrapper,
  Header,
  HeaderBarTrack,
  HeaderMetricValue,
  HeaderWrapper,
  Modes,
  Wrapper,
} from "./styles";
import UserAvatar from "../UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import ArrowSelectIcon from "../../Icons/ArrowSelectIcon";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { TimeButton } from "../PriceChart/styles";
import PlaceholderTable from "../PlaceholderTable";
import EmptySection from "../../EmptySection";

const categories = [
  {
    name: "DeFi",
    a: 890000000,
    b: 1700000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 220,
        b: 450,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 180,
        b: 400,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 250,
        b: 480,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 240,
        b: 370,
      },
    ],
  },
  {
    name: "Infrastrusture",
    a: 800000000,
    b: 940000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 220,
        b: 450,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 180,
        b: 400,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 250,
        b: 480,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 240,
        b: 370,
      },
    ],
  },
  {
    name: "AI & Machine Learning",
    a: 650000000,
    b: 910000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 220,
        b: 450,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 180,
        b: 400,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 250,
        b: 480,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 240,
        b: 370,
      },
    ],
  },
  {
    name: "Gaming & Metaverse",
    a: 600000000,
    b: 640000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 220,
        b: 450,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 180,
        b: 400,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 250,
        b: 480,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 240,
        b: 370,
      },
    ],
  },
  {
    name: "Others",
    a: 300000000,
    b: 280000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 220,
        b: 450,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 180,
        b: 400,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 250,
        b: 480,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        a: 240,
        b: 370,
      },
    ],
  },
];

export type InvestmentsGrowChartProject = {
  logo?: string;
  name: string;
  nich?: string;
  a: number;
  b: number;
};

export type InvestmentsGrowChartCategory = {
  name: string;
  a: number;
  b: number;
  items: InvestmentsGrowChartProject[];
};

interface IProps {
  categoriesByTab?: Record<string, InvestmentsGrowChartCategory[]>;
  primaryLabel?: string;
  secondaryLabel?: string;
  defaultMode?: string;
  isLoading?: boolean;
}

const MAX_VALUE = 1700000000;
const MAX_VALUE_ITEMS = 480;

const getNormalizedBarWidth = (value: number, maxValue: number): number => {
  if (!value || value <= 0) return 0;

  return Math.min(100, (value / maxValue) * 100);
};

const InvestmentsGrowChart: React.FC<IProps> = ({
  categoriesByTab,
  primaryLabel = "Investment Amount ($B)",
  secondaryLabel = "Current Valuation ($B)",
  defaultMode = "30D",
  isLoading = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>(defaultMode);
  const [selectedCategories, setSelectedCategories] = useState<number>(-1);
  const customCategories = categoriesByTab?.[selectedMode] || [];
  const hasExternalCategories = Boolean(categoriesByTab);
  const visibleCategories = hasExternalCategories
    ? customCategories
    : categories;
  const maxCategoryValue = Math.max(
    ...visibleCategories.flatMap((item) => [item.a, item.b]),
    hasExternalCategories ? 1 : MAX_VALUE,
  );
  const maxItemValue = Math.max(
    ...visibleCategories.flatMap((item) =>
      (item.items || []).flatMap((project) => [project.a, project.b]),
    ),
    hasExternalCategories ? 1 : MAX_VALUE_ITEMS,
  );
  const totalDistribution = useMemo(() => {
    const totalRaised = visibleCategories.reduce(
      (sum, item) => sum + Number(item.a || 0),
      0,
    );
    const marketValue = visibleCategories.reduce(
      (sum, item) => sum + Number(item.b || 0),
      0,
    );
    const total = totalRaised + marketValue;

    return {
      totalRaised,
      marketValue,
      totalRaisedWidth: getNormalizedBarWidth(totalRaised, total || 1),
      marketValueWidth: getNormalizedBarWidth(marketValue, total || 1),
    };
  }, [visibleCategories]);

  useEffect(() => {
    setSelectedCategories((currentCategory) =>
      currentCategory >= visibleCategories.length ? -1 : currentCategory,
    );
  }, [visibleCategories.length]);

  useEffect(() => {
    setSelectedCategories(-1);
  }, [selectedMode]);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  const handleSelectedCategories = (id: number): void => {
    setSelectedCategories(id === selectedCategories ? -1 : id);
  };

  return (
    <Wrapper variant="main">
      <HeaderWrapper>
        <Header>
          <ChartWrapper>
            <HeaderBarTrack>
              <ChartBar
                width={
                  totalDistribution.totalRaised > 0
                    ? Math.max(totalDistribution.totalRaisedWidth, 4)
                    : 0
                }
                height={10}
                bg="red"
              />
            </HeaderBarTrack>
            <ChartLabel width={120}>{primaryLabel}</ChartLabel>
            <HeaderMetricValue>
              ${clarifyAmount(totalDistribution.totalRaised)}
            </HeaderMetricValue>
          </ChartWrapper>

          <ChartWrapper>
            <HeaderBarTrack>
              <ChartBar
                width={
                  totalDistribution.marketValue > 0
                    ? Math.max(totalDistribution.marketValueWidth, 4)
                    : 0
                }
                height={10}
                bg="green"
              />
            </HeaderBarTrack>
            <ChartLabel width={120}>{secondaryLabel}</ChartLabel>
            <HeaderMetricValue>
              ${clarifyAmount(totalDistribution.marketValue)}
            </HeaderMetricValue>
          </ChartWrapper>
        </Header>

        <Modes>
          <TimeButton
            onClick={() => setSelectedMode("30D")}
            active={selectedMode === "30D"}
          >
            30D
          </TimeButton>

          <TimeButton
            onClick={() => setSelectedMode("90D")}
            active={selectedMode === "90D"}
          >
            90D
          </TimeButton>

          <TimeButton
            onClick={() => setSelectedMode("6M")}
            active={selectedMode === "6M"}
          >
            6M
          </TimeButton>

          <TimeButton
            onClick={() => setSelectedMode("YTD")}
            active={selectedMode === "YTD"}
          >
            YTD
          </TimeButton>

          <TimeButton
            onClick={() => setSelectedMode("All Time")}
            active={selectedMode === "All Time"}
          >
            All Time
          </TimeButton>
        </Modes>
      </HeaderWrapper>
      <CategoriesList>
        {isLoading ? (
          <PlaceholderTable height="58px" />
        ) : !visibleCategories.length ? (
          <EmptySection />
        ) : visibleCategories.map((item, i) => {
          return (
            <CategoriesBlock key={i}>
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
                      width={(item.a / maxCategoryValue) * 100}
                      bg="red"
                    />
                    <ChartLabel width={90} style={{ fontWeight: "var(--font-weight-semibold)" }}>
                      ${clarifyAmount(item.a)}
                    </ChartLabel>
                  </ChartWrapper>
                  <ChartWrapper>
                    <ChartBar
                      height={20}
                      width={(item.b / maxCategoryValue) * 100}
                      bg="green"
                    />
                    <ChartLabel width={90} style={{ fontWeight: "var(--font-weight-semibold)" }}>
                      ${clarifyAmount(item.b)}
                    </ChartLabel>
                  </ChartWrapper>
                </CategoriesBars>
              </CategoriesButton>
              <CategoriesProject isOpen={selectedCategories === i}>
                {item.items.map((project, j) => (
                  <CategoriesItem key={j}>
                    <div className="project">
                      <UserAvatar
                        avatar={imageLoader(project.logo)}
                        name={project.name}
                        variant="default"
                        size="small"
                      />
                      <div className="project-info">
                        <div>{project.name}</div>
                        <span>{project.nich || item.name}</span>
                      </div>
                    </div>
                    <CategoriesItemCharts>
                      <ChartWrapper>
                        <ChartBar
                          width={(project.a / maxItemValue) * 100}
                          height={10}
                          bg="red"
                        />
                        <ChartLabel width={50}>${clarifyAmount(project.a)}</ChartLabel>
                      </ChartWrapper>

                      <ChartWrapper>
                        <ChartBar
                          width={(project.b / maxItemValue) * 90}
                          height={10}
                          bg="green"
                        />
                        <ChartLabel width={50}>${clarifyAmount(project.b)}</ChartLabel>
                      </ChartWrapper>
                    </CategoriesItemCharts>
                  </CategoriesItem>
                ))}
              </CategoriesProject>
            </CategoriesBlock>
          );
        })}
      </CategoriesList>
    </Wrapper>
  );
};

export default InvestmentsGrowChart;
