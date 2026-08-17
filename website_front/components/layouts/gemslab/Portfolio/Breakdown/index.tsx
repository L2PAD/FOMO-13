import React, { FC, useMemo, useState } from "react";
import {
  ActionsWrapper,
  Body,
  Header,
  TableHeader,
  TableList,
  TableRow,
  Wrapper,
} from "./styles";
import Tabs from "../../../../global/Tabs";
import EntityInfo from "../../../../global/common/EntityInfo";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { Button } from "../../../../global/common/Button";
import UpdateEntityActions from "../../../../global/UpdateEntityActions";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { Overflow } from "../../../../global/common/BarDoubleChart/styles";
import EmptyList from "../../../../global/EmptyList";
import Placeholder from "../../../../global/common/Placeholder";
import { IPortfolio, IPortfolioAsset } from "../../../../../types/global_types";
import { useQuery } from "react-query";
import { fetchPortfolioAssets, removePortfolioAssets, updatePortfolioAssetsOrder } from "../../../../../http/portfolio";
import imageLoader from "../../../../../helpers/imageLoader";
import CreateOwnAsset from "../../../projects/modals/CreateOwnAsset";
import {
  formatPortfolioTokenAmount,
  getPortfolioDisplaySymbol,
  sanitizePortfolioLabel,
} from "../helpers/portfolio";

interface IProps {
  isPortfolioOwner?: boolean;
  portfolio: IPortfolio | undefined
  portfolioRefetch: any
  isPublic?: boolean;
  variant?: "default" | "core";
}

interface ICategoryItem {
  name: string;
  tokens: string;
  totalValue: number;
  percentOfPortfolio: number;
  currentProfitValue: number;
  currentProfitPercent: number;
}

const PortfolioRowsSkeleton = () => (
  <div role="status" aria-label="Loading portfolio holdings">
    {[0, 1, 2, 3, 4].map((item) => (
      <div
        key={item}
        style={{
          display: "grid",
          gridTemplateColumns: "2.4fr 2.4fr 2.4fr 2.4fr 2.4fr",
          gap: 18,
          minWidth: 800,
          padding: "14px 10px",
          borderTop: "1px solid #f0f2f5",
        }}
      >
        {["72%", "58%", "54%", "62%", "48%"].map((width, index) => (
          <Placeholder
            key={`${item}-${index}`}
            width={width}
            height="14px"
            borderRadius="999px"
            marginBottom="0"
          />
        ))}
      </div>
    ))}
  </div>
);

const Breakdown: FC<IProps> = ({
  portfolio,
  portfolioRefetch,
  isPortfolioOwner = true,
  isPublic = false,
  variant = "default",
}) => {
  const isCore = variant === "core";
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Asset");
  const [isAddAsset, setIsAddAsset] = useState<boolean>(false);
  const [deletedAssets, setDeletedAssets] = useState<string[]>([]);
  const [reorderedAssets, setReorderedAssets] = useState<IPortfolioAsset[]>([]);
  const [draggedAsset, setDraggedAsset] = useState<string | null>(null);
  const { data, isLoading, refetch } = useQuery(['portfolio-assets', portfolio?._id, isPublic],
    () => fetchPortfolioAssets(portfolio?._id || '', isPublic),
    {
      refetchOnWindowFocus: false,
      enabled: !!portfolio?._id
    }
  );
  const displayAssets = reorderedAssets.length > 0 ? reorderedAssets : (data?.data || []);

  const categoryItems: ICategoryItem[] = useMemo(() => {
    if (!displayAssets || displayAssets.length === 0) return [];

    const totalPortfolioValue = displayAssets.reduce((sum: number, asset: IPortfolioAsset) => {
      const value = asset.amountUsd ? parseFloat(asset.amountUsd.replace('$', '').replace(/,/g, '')) || 0 : 0;
      return sum + value;
    }, 0);

    const categoriesMap: Record<string, ICategoryItem> = {};

    displayAssets.forEach((asset: IPortfolioAsset) => {
      const categoryName = sanitizePortfolioLabel(asset.category, 'Uncategorized');
      const assetValue = asset.amountUsd ? parseFloat(asset.amountUsd.replace('$', '').replace(/,/g, '')) || 0 : 0;
      const investedValue = asset.invested ? parseFloat(asset.invested.replace('$', '').replace(/,/g, '')) || 0 : 0;
      const profitValue = asset.profitUsd || 0;
      const assetSymbol = getPortfolioDisplaySymbol(asset);

      if (!categoriesMap[categoryName]) {
        categoriesMap[categoryName] = {
          name: categoryName,
          tokens: '',
          totalValue: 0,
          percentOfPortfolio: 0,
          currentProfitValue: 0,
          currentProfitPercent: 0
        };
      }

      if (assetSymbol && !categoriesMap[categoryName].tokens.split(", ").includes(assetSymbol)) {
        categoriesMap[categoryName].tokens = categoriesMap[categoryName].tokens
          ? `${categoriesMap[categoryName].tokens}, ${assetSymbol}`
          : assetSymbol;
      }

      categoriesMap[categoryName].totalValue += assetValue;
      categoriesMap[categoryName].currentProfitValue += profitValue;
    });

    Object.keys(categoriesMap).forEach(categoryName => {
      const category = categoriesMap[categoryName];
      category.percentOfPortfolio = totalPortfolioValue > 0
        ? (category.totalValue / totalPortfolioValue) * 100
        : 0;

      const categoryInvested = displayAssets
        .filter((asset: IPortfolioAsset) => {
          return sanitizePortfolioLabel(asset.category, 'Uncategorized') === categoryName;
        })
        .reduce((sum: number, asset: IPortfolioAsset) => {
          const invested = asset.invested ? parseFloat(asset.invested.replace('$', '').replace(/,/g, '')) || 0 : 0;
          return sum + invested;
        }, 0);

      category.currentProfitPercent = categoryInvested > 0
        ? (category.currentProfitValue / categoryInvested) * 100
        : 0;
    });

    return Object.values(categoriesMap).sort((a, b) => b.totalValue - a.totalValue);
  }, [displayAssets]);

  const confirmSave = async (): Promise<void> => {
    const changesMade = deletedAssets.length > 0 || reorderedAssets.length > 0;

    if (!changesMade) {
      setIsEdit(false);
      return;
    }

    try {
      if (deletedAssets.length > 0) {
        const deleteSuccess = await removePortfolioAssets(portfolio?._id || '', deletedAssets);
        if (!deleteSuccess) {
          console.error('Failed to delete assets');
          return;
        }
      }

      if (reorderedAssets.length > 0) {
        const updatedAssets = reorderedAssets.map((asset, index) => ({
          projectId: asset.projectId,
          index: reorderedAssets.length - 1 - index
        }));

        const reorderSuccess = await updatePortfolioAssetsOrder(portfolio?._id || '', updatedAssets);
        if (!reorderSuccess) {
          console.error('Failed to reorder assets');
          return;
        }
      }

      setDeletedAssets([]);
      setReorderedAssets([]);
      await refetch();
      await portfolioRefetch();
      setIsEdit(false);

    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleDeleteAsset = (projectId: string) => {
    setDeletedAssets(prev => [...prev, projectId]);
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedAsset(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (!draggedAsset || draggedAsset === targetProjectId || !displayAssets) return;

    const assets = [...displayAssets];
    const draggedIndex = assets.findIndex(asset => asset.projectId === draggedAsset);
    const targetIndex = assets.findIndex(asset => asset.projectId === targetProjectId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [movedAsset] = assets.splice(draggedIndex, 1);
    assets.splice(targetIndex, 0, movedAsset);

    setReorderedAssets(assets);
    setDraggedAsset(null);
  };

  const handleCancel = () => {
    setIsEdit(false);
    setDeletedAssets([]);
    setReorderedAssets([]);
  };

  const getContent = (): React.ReactNode => {
    if (activeTab === "ICO") {
      return (
        <Body variant="main" $core={isCore}>
          <Overflow>
            <TableHeader className="ico" $core={isCore}>
              <div>Project</div>
              <div>Invested</div>
              <div>Allocation</div>
              <div>Avg. price</div>
              <div>TGE Date</div>
              <div>Claimed</div>
              <div>Status</div>
            </TableHeader>
            <TableList $core={isCore}>
              <br />
              <EmptyList />
              <br />
            </TableList>
          </Overflow>
        </Body>
      );
    }

    if (activeTab === "Category") {
      return (
        <Body variant="main" $core={isCore}>
          <Overflow>
            <TableHeader className="category" $core={isCore}>
              <div>Category</div>
              <div>Tokens</div>
              <div>Total Value</div>
              <div>% of Portfolio</div>
              <div>Current Profit</div>
            </TableHeader>
          <TableList $core={isCore}>
              {isLoading ? (
                isCore ? <PortfolioRowsSkeleton /> : <EmptyList />
              ) : categoryItems.length ? categoryItems.map((item, i: number) => {
                return (
                  <TableRow className="category" key={i} $core={isCore}>
                    <div className="table-column item">
                      <div className="value bold">{item.name}</div>
                    </div>
                    <div className="item">
                      <div className="value">{item.tokens}</div>
                    </div>
                    <div className="item">
                      <div className="value">
                        {item.totalValue
                          ? `$${clarifyAmount(Number(item.totalValue))}`
                          : "-"}
                      </div>
                    </div>
                    <div className="item">
                      <div className="value">
                        {item.percentOfPortfolio
                          ? `${item.percentOfPortfolio.toFixed(2)}%`
                          : "-"}
                      </div>
                    </div>
                    <div className="table-column item">
                      <div
                        className={
                          item.currentProfitValue < 0
                            ? "value red"
                            : "value green"
                        }
                      >
                        ${clarifyAmount(item.currentProfitValue)}
                      </div>
                      <div
                        className={
                          item.currentProfitPercent < 0
                            ? "small-value red"
                            : "small-value green"
                        }
                      >
                        {item.currentProfitPercent.toFixed(3)}%
                      </div>
                    </div>
                  </TableRow>
                );
              }) : (
                <EmptyList />
              )}
            </TableList>
          </Overflow>
        </Body>
      );
    }

    return (
      <Body variant="main" $core={isCore} aria-busy={isLoading}>
        <Overflow>
          <TableHeader $core={isCore}>
            <div>Token</div>
            <div>Amount Held</div>
            <div>Invested</div>
            <div>Avg. Buy Price</div>
            <div>Current Profit</div>
          </TableHeader>
          <TableList $core={isCore}>
            {isLoading ? (
              isCore ? <PortfolioRowsSkeleton /> : <EmptyList />
            ) : displayAssets.length ? displayAssets.map((item: IPortfolioAsset, i: number) => {
              const isDeleted: boolean = deletedAssets.includes(item.projectId);
              const displaySymbol = getPortfolioDisplaySymbol(item);
              const tokenAmount = formatPortfolioTokenAmount(item.amountTkn, displaySymbol);
              return (
                <TableRow
                  isDeleted={isDeleted}
                  $core={isCore}
                  key={item._id}
                  draggable={isEdit && !isDeleted}
                  onDragStart={(e) => isEdit && !isDeleted && handleDragStart(e, item.projectId)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => isEdit && !isDeleted && handleDrop(e, item.projectId)}
                  style={{
                    cursor: isEdit && !isDeleted ? 'grab' : 'default',
                    opacity: draggedAsset === item.projectId ? 0.5 : undefined
                  }}
                >
                  {isEdit && !isDeleted ? (
                    <button
                      className="edit-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.projectId)}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 12C7.5 11.1716 8.17157 10.5 9 10.5C9.82843 10.5 10.5 11.1716 10.5 12C10.5 12.8284 9.82843 13.5 9 13.5C8.17157 13.5 7.5 12.8284 7.5 12ZM7.5 6C7.5 5.17157 8.17157 4.5 9 4.5C9.82843 4.5 10.5 5.17157 10.5 6C10.5 6.82843 9.82843 7.5 9 7.5C8.17157 7.5 7.5 6.82843 7.5 6ZM7.5 18C7.5 17.1716 8.17157 16.5 9 16.5C9.82843 16.5 10.5 17.1716 10.5 18C10.5 18.8284 9.82843 19.5 9 19.5C8.17157 19.5 7.5 18.8284 7.5 18ZM13.5 12C13.5 11.1716 14.1716 10.5 15 10.5C15.8284 10.5 16.5 11.1716 16.5 12C16.5 12.8284 15.8284 13.5 15 13.5C14.1716 13.5 13.5 12.8284 13.5 12ZM13.5 6C13.5 5.17157 14.1716 4.5 15 4.5C15.8284 4.5 16.5 5.17157 16.5 6C16.5 6.82843 15.8284 7.5 15 7.5C14.1716 7.5 13.5 6.82843 13.5 6ZM13.5 18C13.5 17.1716 14.1716 16.5 15 16.5C15.8284 16.5 16.5 17.1716 16.5 18C16.5 18.8284 15.8284 19.5 15 19.5C14.1716 19.5 13.5 18.8284 13.5 18Z" fill="#738094" />
                      </svg>
                      <div className="item">
                        <EntityInfo
                          img={imageLoader(item.img)}
                          name={item.name}
                          niche={displaySymbol}
                          variant="default"
                        />
                      </div>
                    </button>
                  ) : (
                    <div className="item">
                      <EntityInfo
                        img={imageLoader(item.img)}
                        name={item.name}
                        niche={displaySymbol}
                        variant="default"
                      />
                    </div>
                  )}

                  <div className="table-column item">
                    <div className="value bold">{item.amountUsd}</div>
                    <span>{tokenAmount}</span>
                  </div>
                  <div className="item">
                    <div className="value">{item.invested}</div>
                  </div>
                  <div className="item">
                    <div className="value">{item.avgBuyPrice}</div>
                  </div>
                  <div className="table-column item">
                    <div className={item.profitUsd < 0 ? "value red" : "value green"}>
                      {clarifyAmount(item.profitUsd)}$
                    </div>
                    <div className={item.profitPercent < 0 ? "small-value red" : "small-value green"}>
                      {item.profitPercent}%
                    </div>
                  </div>
                  {isEdit && !isDeleted && (
                    <button
                      onClick={() => handleDeleteAsset(item.projectId)}
                      className="remove-item"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="#738094" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </TableRow>
              );
            }) : (
              <EmptyList />
            )}
          </TableList>
        </Overflow>
      </Body>
    );
  };

  return (
    <Wrapper $core={isCore}>
      <Header $core={isCore}>
        <h2>{isCore ? "Holdings" : "Portfolio Breakdown"}</h2>
        <Tabs
          className="secondary"
          onClick={(value: string) => setActiveTab(value)}
          activeItem={activeTab}
          items={["Category", "Asset"]}
        />
        {isPortfolioOwner ? (
          <ActionsWrapper $core={isCore} $isEditing={isEdit}>
            <Button
              onClick={() => setIsAddAsset(true)}
              className="outlined-default"
              variant="outlined"
            >
              + Add Asset
            </Button>
            <UpdateEntityActions
              isActiveEdit={isEdit}
              isResetButton={false}
              buttonText="Edit"
              onCancel={handleCancel}
              onSave={confirmSave}
              onReset={() => { }}
              updateEditState={setIsEdit}
            />
          </ActionsWrapper>
        ) : (
          <></>
        )}
      </Header>
      {getContent()}
      <CreateOwnAsset
        portfolioId={portfolio?._id}
        isVisible={isAddAsset}
        onClose={async () => {
          await refetch();
          await portfolioRefetch();
          setIsAddAsset(false);
          setIsEdit(false);
        }}
      />
    </Wrapper>
  );
};

export default Breakdown;
