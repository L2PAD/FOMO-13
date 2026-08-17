import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "i18n";
import sliceAddress from "../../../../helpers/sliceAddress";
import { CopyIcon } from "../../Icons";
import {
  CategoryChip,
  CategoryField,
  CategoryIcon,
  CategoryMain,
  CategoryText,
  ContractAddress,
  ContractCopyButton,
  ContractInfo,
  ContractItem,
  ContractsDropdown,
  Fields,
  HiddenCategoryCount,
  HiddenCategoryItem,
  HiddenCategoryList,
  HiddenCategoryPopover,
  SmartContractChip,
  SmartContractField,
  Title,
} from "./styles";

type CategoryItem =
  | string
  | {
      value?: string;
      name?: string;
      title?: string;
      label?: string;
      slug?: string;
    };

export interface ProjectHeaderContract {
  contract?: string;
  address?: string;
  contractAddress?: string;
  tokenAddress?: string;
  value?: string;
  networkImage?: string;
  chainLogo?: string;
  logo?: string;
  networkName?: string;
  network?: string;
  chain?: string;
}

interface ProjectHeaderMetadataProps {
  categories?: CategoryItem[];
  contracts?: ProjectHeaderContract[];
  categoryEditor?: React.ReactNode;
  onCopyContract?: (address: string) => void;
  className?: string;
}

const getCategoryLabel = (category: CategoryItem): string => {
  if (typeof category === "string") return category.trim();

  return String(
    category?.value ||
      category?.name ||
      category?.title ||
      category?.label ||
      category?.slug ||
      ""
  ).trim();
};

const getContractAddress = (item: ProjectHeaderContract): string =>
  String(
    item?.contract ||
      item?.address ||
      item?.contractAddress ||
      item?.tokenAddress ||
      item?.value ||
      ""
  ).trim();

const getContractLogo = (item: ProjectHeaderContract): string => {
  const logo = String(
    item?.networkImage || item?.chainLogo || item?.logo || ""
  ).trim();

  return logo === "null" || logo === "undefined" ? "" : logo;
};

const CategorySvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M11.0237 4.97959L11.0193 4.97956M13.2241 1.6455L9.19611 1.33565C8.83899 1.30818 8.4877 1.43813 8.23443 1.6914L1.69286 8.23297C1.21371 8.71212 1.21371 9.48898 1.69286 9.96813L6.03074 14.306C6.50988 14.7852 7.28674 14.7852 7.76589 14.306L14.3075 7.76443C14.5607 7.51116 14.6907 7.15987 14.6632 6.80275L14.3534 2.77472C14.3069 2.17134 13.8275 1.69191 13.2241 1.6455Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SmartContractSvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5.33334 5.66667L3 8L5.33334 10.3333M10.6667 5.66667L13 8L10.6667 10.3333M9 4L7 12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProjectHeaderMetadata: React.FC<ProjectHeaderMetadataProps> = ({
  categories = [],
  contracts = [],
  categoryEditor,
  onCopyContract,
  className,
}) => {
  const { translateText } = useTranslation();
  const smartContractRef = useRef<HTMLDivElement | null>(null);
  const [isContractsOpen, setIsContractsOpen] = useState(false);
  const categoryValues = useMemo(
    () =>
      categories
        .map(getCategoryLabel)
        .filter(Boolean)
        .filter(
          (category, index, values) =>
            values.findIndex(
              (value) => value.toLowerCase() === category.toLowerCase()
            ) === index
        ),
    [categories]
  );
  const contractValues = useMemo(
    () =>
      contracts
        .map((item) => ({ ...item, address: getContractAddress(item) }))
        .filter((item) => item.address)
        .filter(
          (item, index, values) =>
            values.findIndex(
              (value) =>
                value.address.toLowerCase() === item.address.toLowerCase()
            ) === index
        ),
    [contracts]
  );
  const primaryCategory = categoryValues[0] || "-";
  const hiddenCategories = categoryValues.slice(1);

  useEffect(() => {
    if (!isContractsOpen) return undefined;

    const closeOnOutsideAction = (event: Event) => {
      const target = event.target as Node | null;
      if (target && smartContractRef.current?.contains(target)) return;
      setIsContractsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsContractsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideAction);
    document.addEventListener("touchstart", closeOnOutsideAction);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideAction);
      document.removeEventListener("touchstart", closeOnOutsideAction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isContractsOpen]);

  return (
    <Fields className={className}>
      <SmartContractField
        ref={smartContractRef}
        className={isContractsOpen ? "is-open" : undefined}
      >
        <Title>{translateText("Smart contracts")}</Title>
        <SmartContractChip
          type="button"
          aria-haspopup={contractValues.length ? "true" : undefined}
          aria-expanded={contractValues.length ? isContractsOpen : undefined}
          onClick={() => {
            if (contractValues.length) setIsContractsOpen((value) => !value);
          }}
        >
          <CategoryMain>
            <CategoryIcon>
              <SmartContractSvg />
            </CategoryIcon>
            <CategoryText>
              {contractValues.length
                ? sliceAddress(contractValues[0].address)
                : "-"}
            </CategoryText>
          </CategoryMain>
        </SmartContractChip>
        {contractValues.length ? (
          <ContractsDropdown
            role="group"
            aria-label={translateText("Smart contracts")}
          >
            {contractValues.map((item) => {
              const networkName = String(
                item.networkName || item.network || item.chain || "Contract"
              );
              const logo = getContractLogo(item);

              return (
                <ContractItem key={item.address}>
                  <ContractInfo>
                    {logo ? <img src={logo} alt={networkName} /> : null}
                    <span>{networkName}</span>
                  </ContractInfo>
                  <ContractCopyButton
                    type="button"
                    aria-label={`${translateText("Copy smart contract")} ${networkName}`}
                    onClick={() => {
                      onCopyContract?.(item.address);
                      setIsContractsOpen(false);
                    }}
                  >
                    <ContractAddress>
                      {sliceAddress(item.address)}
                    </ContractAddress>
                    <CopyIcon />
                  </ContractCopyButton>
                </ContractItem>
              );
            })}
          </ContractsDropdown>
        ) : null}
      </SmartContractField>

      <CategoryField>
        <Title>{translateText("Category")}</Title>
        {categoryEditor || (
          <CategoryChip
            className={hiddenCategories.length ? "has-hidden" : undefined}
          >
            <CategoryMain>
              <CategoryIcon>
                <CategorySvg />
              </CategoryIcon>
              <CategoryText>{primaryCategory}</CategoryText>
            </CategoryMain>
            {hiddenCategories.length ? (
              <HiddenCategoryPopover>
                <HiddenCategoryCount
                  tabIndex={0}
                  aria-label={`${hiddenCategories.length} ${translateText("more categories")}`}
                >
                  +{hiddenCategories.length}
                </HiddenCategoryCount>
                <HiddenCategoryList>
                  {hiddenCategories.map((category) => (
                    <HiddenCategoryItem key={category}>
                      <CategorySvg />
                      <span>{category}</span>
                    </HiddenCategoryItem>
                  ))}
                </HiddenCategoryList>
              </HiddenCategoryPopover>
            ) : null}
          </CategoryChip>
        )}
      </CategoryField>
    </Fields>
  );
};

export default ProjectHeaderMetadata;
