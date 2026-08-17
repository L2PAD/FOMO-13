import React, { useState } from "react";
import {
  Body,
  Header,
  Section,
  TableHeader,
  TableList,
  TableRow,
  Wrapper,
} from "./styles";
import Tabs from "../../../../global/Tabs";
import EntityInfo from "../../../../global/common/EntityInfo";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { getPortfolioTransactions, Transaction } from "../../../../../http/portfolio";
import EmptyList from "../../../../global/EmptyList";
import { useQuery } from "react-query";
import { getPortfolioDisplaySymbol } from "../helpers/portfolio";
import Placeholder from "../../../../global/common/Placeholder";

interface TransactionsListProps {
  portfolioId: string;
  isPublic?: boolean;
  variant?: "default" | "core";
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  portfolioId,
  isPublic = false,
  variant = "default",
}) => {
  const isCore = variant === "core";
  const [activeTab, setActiveTab] = useState<string>("Asset");
  const {
    data: transactions = [],
    isLoading: loading,
    isError,
  } = useQuery<Transaction[]>(
    ['portfolio-transactions', portfolioId, isPublic],
    () => getPortfolioTransactions(portfolioId, isPublic),
    {
      enabled: !!portfolioId,
      refetchOnWindowFocus: false,
    },
  );

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const transactionSections = Object.entries(groupedTransactions).map(([date, items]) => ({
    date,
    items
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatQuantity = (quantity: number, symbol: string) => {
    return symbol ? `${quantity.toFixed(4)} ${symbol}` : quantity.toFixed(4);
  };

  const getChangeValueClassName = (
    value: number,
    baseClassName: "value" | "small-value",
  ) => {
    if (value > 0) return `${baseClassName} green`;
    if (value < 0) return `${baseClassName} red`;

    return baseClassName;
  };

  const formatGainLossValue = (value: number, currency: string) => {
    if (value === 0) return "--";

    return formatCurrency(value, currency);
  };

  const formatGainLossPercent = (value: number) => {
    if (value === 0) return "--";

    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    if (!isCore) {
      return (
        <Wrapper>
          <Header>
            <h2>Transactions</h2>
          </Header>
          <Body variant="main">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </Body>
        </Wrapper>
      );
    }

    return (
      <Wrapper $core>
        <Header $core>
          <h2>Transactions</h2>
        </Header>
        <Body variant="main" $core>
          <div role="status" aria-label="Loading transactions">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1.5fr 1.5fr 1.5fr 1.5fr",
                  gap: 16,
                  minWidth: 720,
                  padding: "15px 10px",
                  borderTop: "1px solid #f0f2f5",
                }}
              >
                {["72%", "56%", "48%", "54%", "50%"].map((width, index) => (
                  <Placeholder
                    key={`${row}-${index}`}
                    width={width}
                    height="14px"
                    borderRadius="999px"
                    marginBottom="0"
                  />
                ))}
              </div>
            ))}
          </div>
        </Body>
      </Wrapper>
    );
  }

  if (isError) {
    return (
      <Wrapper $core={isCore}>
        <Header $core={isCore}>
          <h2>Transactions</h2>
        </Header>
        <Body variant="main" $core={isCore}>
          <div className="text-center py-8 text-red-500">
            Failed to load transactions
          </div>
        </Body>
      </Wrapper>
    );
  }

  return (
    <Wrapper $core={isCore}>
      <Header $core={isCore}>
        <h2>Transactions</h2>
      </Header>
      <Body variant="main" $core={isCore}>
        <TableHeader $core={isCore}>
          <div>Transaction</div>
          <div>Quantity</div>
          <div>Price</div>
          <div>Total</div>
          <div>Gain / Loss</div>
        </TableHeader>

        {transactionSections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <br />
            <br />
            <EmptyList imgWidth={150} lineHeight={120} fontSize={18} />
            <br />
            <br />
          </div>
        ) : (
          transactionSections.map((section, sectionIndex) => (
            <Section key={sectionIndex} $core={isCore}>
              <div className="section-title">{section.date}</div>
              <TableList $core={isCore}>
                {section.items.map((transaction, itemIndex) => {
                  const displaySymbol = getPortfolioDisplaySymbol(
                    transaction.projectId,
                    transaction.currency,
                  );

                  return (
                    <TableRow key={`${sectionIndex}-${itemIndex}`} $core={isCore}>
                      <div className="item">
                        <EntityInfo
                          img={transaction.projectId.logo}
                          name={transaction.projectId.name}
                          niche={displaySymbol}
                          variant="default"
                        />
                      </div>

                      <div className="table-column item">
                        <div className="value bold">
                          {formatQuantity(transaction.quantity, displaySymbol)}
                        </div>
                      </div>

                      <div className="item">
                        <div className="value">
                          {formatCurrency(transaction.price, transaction.priceCurrency)}
                        </div>
                      </div>

                      <div className="item">
                        <div className="value">
                          {formatCurrency(transaction.total, transaction.priceCurrency)}
                        </div>
                      </div>

                      <div className="table-column item">
                        <div className={getChangeValueClassName(transaction.gainLoss, "value")}>
                          {formatGainLossValue(
                            transaction.gainLoss,
                            transaction.priceCurrency,
                          )}
                        </div>
                        <div
                          className={getChangeValueClassName(
                            transaction.gainLossPercent,
                            "small-value",
                          )}
                        >
                          {formatGainLossPercent(transaction.gainLossPercent)}
                        </div>
                      </div>
                    </TableRow>
                  );
                })}
              </TableList>
            </Section>
          ))
        )}
      </Body>
    </Wrapper>
  );
};

export default TransactionsList;
