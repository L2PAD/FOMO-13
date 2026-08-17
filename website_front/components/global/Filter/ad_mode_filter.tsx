/* eslint-disable */
import React, { FC, useState } from "react";
import { Button } from "../common/Button";
import MainModal from "../common/MainModal";
import OtcRangeRow from "./otc-range_row";
import { AllocBottom, AllocFilterWrapper } from "./alloc-styles";
import {
  OtcDropdownWrapper,
  OtcDropdown,
  OtcBottom,
  Buttons,
  ResetWrapper,
  OtcColumn,
} from "./otc-styles";
import { DropdownRow } from "./styles";
import OtcCheckboxRow from "./otc_checkbox_row";
import { FilterButton } from "./styles";
import { RotateCcw, Info } from "lucide-react";
import styled from "styled-components";

const defaultAdModeFilters = [
  {
    type: "rangeWithRadio",
    title: "CPM",
    range: [0, 100],
    step: 1,
    key: "cpm",
    checkboxItems: ["per video", "per post", "per campaign"],
    checkboxKey: "cpmType",
    tooltip:
      "Cost Per Mille - the price you pay for 1,000 ad impressions or views",
  },
  {
    type: "rangeWithCheckbox",
    title: "Campaign Budget",
    range: [0, 10000000],
    step: 1000,
    key: "campaignBudget",
    checkboxItems: ["0 - $1000", "$1k - $10k", "$10k - $50k", "> $50k"],
    checkboxKey: "campaignBudgetRange",
    tooltip: "Total budget allocated for the advertising campaign",
  },
  {
    type: "rangeWithCheckbox",
    title: "Real Views",
    range: [1000, 10000000],
    step: 1000,
    key: "realViews",
    checkboxItems: ["0 - 10k", "10k - 100k", "100k - 1M", "> 1M"],
    checkboxKey: "realViewsRange",
    tooltip:
      "Estimated actual views from real users, excluding bots and fake engagement",
  },
  {
    type: "rangeWithCheckbox",
    title: "FOMO Score",
    range: [100, 1000],
    step: 1,
    key: "fomoScore",
    checkboxItems: [],
    checkboxKey: "fomoScoreSlider",
    tooltip:
      "A proprietary metric indicating the hype and urgency level around the ad content",
  },
  {
    type: "radio",
    title: "CPM Efficiency",
    items: ["Low", "Medium", "High"],
    key: "cpmEfficiency",
    tooltip:
      "How efficiently your budget converts to actual engagement and results",
  },
  {
    type: "radio",
    title: "Predictability",
    items: ["Unstable", "Medium", "Stable"],
    key: "predictability",
    tooltip: "Consistency and reliability of campaign performance over time",
  },
  {
    type: "checkbox",
    title: "Time-to-Reach",
    items: ["Fast (0~6h)", "Medium (6~24h)", "Slow (24h+)"],
    key: "timeToReach",
    tooltip: "How quickly your ad reaches the target audience after going live",
  },
  {
    type: "checkbox",
    title: "Promo Saturation",
    items: ["Low Ads", "Medium", "High Ads"],
    key: "promoSaturation",
    tooltip: "The level of promotional content density in the selected channel",
  },
  {
    type: "checkbox",
    title: "Promo Format",
    items: [
      "Native mention",
      "Dedicated post",
      "Pinned / Long-term",
      "Thread / Story",
      "Video integration",
      "Other",
    ],
    key: "promoFormat",
    tooltip: "The format and style of promotional content delivery",
  },
  {
    type: "checkbox",
    title: "Audience Fit",
    items: ["Retail", "Traders", "Builders", "Founders", "Degens", "Mixed"],
    key: "audienceFit",
  },
  {
    type: "checkbox",
    title: "Product Type",
    items: [
      "Crypto Project",
      "Telegram Channel",
      "Private Group",
      "Education",
      "Service / SaaS",
      "Other",
    ],
    key: "productType",
    tooltip: "The category of product or service being promoted",
  },
  {
    type: "checkbox",
    title: "Risk Level",
    items: ["Low Ads", "Medium Ads", "High Ads"],
    key: "riskLevel",
    tooltip:
      "Assessed risk level based on channel reputation, audience quality, and compliance",
  },
];

const initialAdModeFilterData = {
  cpm: [0, 100],
  cpmType: "per post",
  campaignBudget: [0, 10000000],
  campaignBudgetRange: "$1k - $10k",
  realViews: [1000, 10000000],
  realViewsRange: "10k - 100k",
  fomoScore: [100, 1000],
  fomoScoreSlider: "",
  predictability: "Medium",
  cpmEfficiency: "Medium",
  timeToReach: ["Fast (0~6h)", "Medium (6~24h)", "Slow (24h+)"],
  promoSaturation: ["Low Ads", "Medium", "High Ads"],
  promoFormat: [
    "Native mention",
    "Dedicated post",
    "Pinned / Long-term",
    "Thread / Story",
    "Video integration",
    "Other",
  ],
  audienceFit: ["Retail", "Traders", "Builders", "Founders", "Degens", "Mixed"],
  riskLevel: ["Low", "Medium", "High"],
  productType: [
    "Crypto Project",
    "Telegram Channel",
    "Private Group",
    "Education",
    "Service / SaaS",
    "Other",
  ],
};

interface Props {
  filters?: any;
  filterDataInitial?: any;
  right?: boolean;
  onSave: (filterData: any) => void;
  variant?: "small" | "big" | "medium";
  isOpen?: boolean;
  onClose?: () => void;
}

const AdModeFilter: FC<Props> = ({
  filterDataInitial,
  right,
  variant = "big",
  onSave,
  isOpen = false,
  onClose,
}) => {
  const [active, setActive] = useState(isOpen);
  const [filterData, setFilterData] = useState<any>(
    filterDataInitial || initialAdModeFilterData
  );
  const [isResetVisible, setIsResetVisible] = useState(false);

  React.useEffect(() => {
    setActive(isOpen);
  }, [isOpen]);

  const checkIfFiltersChanged = (currentFilters: any) => {
    return (
      JSON.stringify(currentFilters) !== JSON.stringify(initialAdModeFilterData)
    );
  };

  const inputsHandler = (value: any, key: string): void => {
    const updatedFilterData = { ...filterData, [key]: value };
    setFilterData(updatedFilterData);
    setIsResetVisible(checkIfFiltersChanged(updatedFilterData));
  };

  const handleResetFilters = () => {
    setFilterData(initialAdModeFilterData);
    setIsResetVisible(false);
  };

  const handleApply = () => {
    onSave(filterData);
    setActive(false);
    onClose?.();
  };

  const handleCancel = () => {
    setFilterData(filterDataInitial || initialAdModeFilterData);
    setActive(false);
    setIsResetVisible(false);
    onClose?.();
  };

  const renderRadioItem = (item: any) => {
    return (
      <>
        {item.title && (
          <div
            style={{
              fontWeight: "var(--font-weight-semibold)",
              fontSize: "16px",
              lineHeight: "19px",
              color: "#070b35",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {item.title}
            <button className="tooltip-button">
              <Info size={12} color="#738094" />
              <span
                className="tooltip-text"
                style={{
                  width: 300,
                  whiteSpace: "wrap",
                }}
              >
                {item.tooltip}
              </span>
            </button>
          </div>
        )}
        <div
          className="checkboxes"
          style={{ gridTemplateColumns: `repeat(${item.items.length}, 1fr)` }}
        >
          {item.items.map((option: string, i: number) => (
            <label
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={item.key}
                value={option}
                checked={filterData[item.key] === option}
                onChange={() => inputsHandler(option, item.key)}
                style={{
                  cursor: "pointer",
                  accentColor: "#04A584",
                }}
              />
              <span style={{ fontSize: "14px", color: "#070B35" }}>
                {option}
              </span>
            </label>
          ))}
        </div>
      </>
    );
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return "$0";
    return `$${value.toLocaleString("en-US")}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US");
  };

  const renderFilterItem = (item: any) => {
    switch (item.type) {
      case "checkbox":
        return (
          <OtcCheckboxRow
            data={filterData[item.key]}
            title={item.title}
            items={item.items}
            onChange={(value) => inputsHandler(value, item.key)}
            className={`otc-checkbox ${item.key}`}
            showInfoIcon={item.key !== "audienceFit"}
            tooltip={item.tooltip}
          />
        );
      case "radio":
        return renderRadioItem(item);
      case "range":
        return (
          <OtcRangeRow
            data={filterData[item.key]}
            title={item.title}
            step={item.step}
            range={item.range}
            onChange={(values) => inputsHandler(values, item.key)}
            tooltip={item.tooltip}
          />
        );
      case "rangeWithCheckbox":
        return (
          <>
            <OtcRangeRow
              data={filterData[item.key]}
              title={item.title}
              step={item.step}
              range={item.range}
              onChange={(values) => inputsHandler(values, item.key)}
              tooltip={item.tooltip}
            />
            {item.checkboxItems && item.checkboxItems.length > 0 && (
              <OtcCheckboxRow
                data={filterData[item.checkboxKey]}
                title=""
                items={item.checkboxItems}
                onChange={(value) => inputsHandler(value, item.checkboxKey)}
                className={`otc-checkbox ad-mode ${item.checkboxKey}`}
              />
            )}
          </>
        );
      case "rangeWithRadio":
        return (
          <>
            <OtcRangeRow
              data={filterData[item.key]}
              title={item.title}
              step={item.step}
              range={item.range}
              onChange={(values) => inputsHandler(values, item.key)}
              formatValue={
                item.key === "campaignBudget"
                  ? formatCurrency
                  : item.key === "realViews"
                    ? formatNumber
                    : undefined
              }
              showInfoIcon={item.key !== "fomoScore"}
              tooltip={item.tooltip}
            />
            {item.checkboxItems && item.checkboxItems.length > 0 && (
              <div
                className="checkboxes"
                style={{
                  gridTemplateColumns: `repeat(${item.checkboxItems.length}, 1fr)`,
                }}
              >
                {item.checkboxItems.map((option: string, i: number) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={item.checkboxKey}
                      value={option}
                      checked={filterData[item.checkboxKey] === option}
                      onChange={() => inputsHandler(option, item.checkboxKey)}
                      style={{
                        cursor: "pointer",
                        accentColor: "#04A584",
                      }}
                    />
                    <span style={{ fontSize: "14px", color: "#070B35" }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AllocFilterWrapper className="ad-mode-filter">
      <MainModal
        isVisible={active}
        className={`filter-modal ${variant}`}
        title="Ad Mode"
        variant="filter"
        onClose={handleCancel}
      >
        <OtcDropdown
          active={active}
          right={right}
          style={{
            flexDirection: "row",
            maxWidth: "100%",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {defaultAdModeFilters.map((item: any, i: number) => {
            return (
              <DropdownRow className={`row ${item.key}`} key={i}>
                {renderFilterItem(item)}
              </DropdownRow>
            );
          })}
        </OtcDropdown>

        <AllocBottom>
          <Buttons>
            <Button className="red-btn" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply}>
              Apply
            </Button>
          </Buttons>
          <ResetWrapper>
            <Button onClick={handleResetFilters} className="reset-btn">
              <RotateCcw size={16} />
              Reset
            </Button>
          </ResetWrapper>
        </AllocBottom>
      </MainModal>
    </AllocFilterWrapper>
  );
};

export default AdModeFilter;
