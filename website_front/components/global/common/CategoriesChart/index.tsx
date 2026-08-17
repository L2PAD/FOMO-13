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
  ChartBar,
  ChartLabel,
  ChartWrapper,
  Header,
  Wrapper,
} from "./styles";
import UserAvatar from "../UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import ArrowSelectIcon from "../../Icons/ArrowSelectIcon";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";

export interface CategoriesChartProjectItem {
  logo?: string;
  name: string;
  nich?: string;
  locked: number;
  unlocked: number;
  symbol?: string;
}

export interface CategoriesChartItem {
  name: string;
  locked: number;
  unlocked: number;
  symbol?: string;
  items?: Array<CategoriesChartProjectItem>;
}

const categories: Array<CategoriesChartItem> = [
  {
    name: "DeFi",
    locked: 890000000,
    unlocked: 1700000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 220000000,
        unlocked: 450000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 180000000,
        unlocked: 400000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 250000000,
        unlocked: 480000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 240000000,
        unlocked: 370000000,
      },
    ],
  },
  {
    name: "Infrastrusture",
    locked: 800000000,
    unlocked: 940000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 220000000,
        unlocked: 450000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 180000000,
        unlocked: 400000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 250000000,
        unlocked: 480000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 240000000,
        unlocked: 370000000,
      },
    ],
  },
  {
    name: "AI & Machine Learning",
    locked: 650000000,
    unlocked: 910000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 220000000,
        unlocked: 450000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 180000000,
        unlocked: 400000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 250000000,
        unlocked: 480000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 240000000,
        unlocked: 370000000,
      },
    ],
  },
  {
    name: "Gaming & Metaverse",
    locked: 600000000,
    unlocked: 640000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 220000000,
        unlocked: 450000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 180000000,
        unlocked: 400000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 250000000,
        unlocked: 480000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 240000000,
        unlocked: 370000000,
      },
    ],
  },
  {
    name: "Others",
    locked: 300000000,
    unlocked: 280000000,
    items: [
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 220000000,
        unlocked: 450000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 180000000,
        unlocked: 400000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 250000000,
        unlocked: 480000000,
      },
      {
        logo: "/3a9d03242b158ca9ee106d78331f822f.png",
        name: "DeFi",
        nich: "DeFi & Liquidity",
        locked: 240000000,
        unlocked: 370000000,
      },
    ],
  },
];

const getNormalizedBarWidth = (value: number, maxValue: number): number => {
  if (!value || value <= 0) return 0;

  return Math.min(100, (value / maxValue) * 100);
};

const formatTokenSymbol = (symbol?: string): string => {
  return String(symbol || "TKN").toUpperCase();
};

const getProjectShareWidth = (
  value: number,
  project: CategoriesChartProjectItem
): number => {
  const total = (project.locked || 0) + (project.unlocked || 0);

  return getNormalizedBarWidth(value, total || 1);
};

const getCategoryShareWidth = (
  value: number,
  category: CategoriesChartItem
): number => {
  const total = (category.locked || 0) + (category.unlocked || 0);

  return getNormalizedBarWidth(value, total || 1);
};

interface CategoriesChartProps {
  items?: Array<CategoriesChartItem>;
  allowFallback?: boolean;
}

const CategoriesChart: FC<CategoriesChartProps> = ({
  items,
  allowFallback = true,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<number>(-1);
  const chartItems = useMemo(() => {
    const sourceItems = items?.length ? items : allowFallback ? categories : [];

    return [...sourceItems]
      .map((item) => ({
        ...item,
        items: [...(item.items || [])].sort((a, b) => {
          return b.locked + b.unlocked - (a.locked + a.unlocked);
        }),
      }))
      .sort((a, b) => b.locked + b.unlocked - (a.locked + a.unlocked))
      .slice(0, 5);
  }, [allowFallback, items]);
  const totalDistribution = useMemo(() => {
    const locked = chartItems.reduce((sum, item) => sum + (item.locked || 0), 0);
    const unlocked = chartItems.reduce(
      (sum, item) => sum + (item.unlocked || 0),
      0
    );
    const total = locked + unlocked;

    return {
      lockedWidth: getNormalizedBarWidth(locked, total || 1),
      unlockedWidth: getNormalizedBarWidth(unlocked, total || 1),
    };
  }, [chartItems]);

  const handleSelectedCategories = (id: number): void => {
    setSelectedCategories(id === selectedCategories ? -1 : id);
  };

  return (
    <Wrapper variant="main">
      <Header>
        <ChartWrapper>
          <ChartBar width={totalDistribution.lockedWidth} height={10} bg="red" />
          <ChartLabel width={120}>Locked Tokens</ChartLabel>
        </ChartWrapper>

        <ChartWrapper>
          <ChartBar
            width={totalDistribution.unlockedWidth}
            height={10}
            bg="green"
          />
          <ChartLabel width={120}>Unlocked Tokens</ChartLabel>
        </ChartWrapper>
      </Header>
      <CategoriesList>
        {chartItems.map((item, i) => {
          const symbol = formatTokenSymbol(item.symbol);

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
                      width={getCategoryShareWidth(item.locked, item)}
                      bg="red"
                    />
                    <ChartLabel width={90} style={{ fontWeight: "var(--font-weight-semibold)" }}>
                      {symbol} {clarifyAmount(item.locked)}
                    </ChartLabel>
                  </ChartWrapper>
                  <ChartWrapper>
                    <ChartBar
                      height={20}
                      width={getCategoryShareWidth(item.unlocked, item)}
                      bg="green"
                    />
                    <ChartLabel width={90} style={{ fontWeight: "var(--font-weight-semibold)" }}>
                      {symbol} {clarifyAmount(item.unlocked)}
                    </ChartLabel>
                  </ChartWrapper>
                </CategoriesBars>
              </CategoriesButton>
              <CategoriesProject isOpen={selectedCategories === i}>
                {(item.items || []).map((project, j) => (
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
                        <span>{project.nich || "-"}</span>
                      </div>
                    </div>
                    <CategoriesItemCharts>
                      <ChartWrapper>
                        <ChartBar
                          width={getProjectShareWidth(project.locked, project)}
                          height={10}
                          bg="red"
                        />
                        <ChartLabel width={50}>
                          {formatTokenSymbol(project.symbol || symbol)}{" "}
                          {clarifyAmount(project.locked)}
                        </ChartLabel>
                      </ChartWrapper>

                      <ChartWrapper>
                        <ChartBar
                          width={getProjectShareWidth(project.unlocked, project)}
                          height={10}
                          bg="green"
                        />
                        <ChartLabel width={50}>
                          {formatTokenSymbol(project.symbol || symbol)}{" "}
                          {clarifyAmount(project.unlocked)}
                        </ChartLabel>
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

export default CategoriesChart;
