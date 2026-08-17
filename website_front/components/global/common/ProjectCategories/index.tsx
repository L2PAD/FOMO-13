import React from "react";
import { useTranslation } from "i18n";
import { Chip, Chips, Title, Wrapper } from "./styles";

type CategoryItem =
  | string
  | {
      value?: string;
      name?: string;
      label?: string;
    };

interface ProjectCategoriesProps {
  items?: CategoryItem[];
  fallback?: string;
  limit?: number;
  title?: string;
  className?: string;
}

const normalizeCategory = (item: CategoryItem): string => {
  if (typeof item === "string") return item.trim();
  return String(item?.value || item?.name || item?.label || "").trim();
};

const ProjectCategories: React.FC<ProjectCategoriesProps> = ({
  items = [],
  fallback,
  limit = 4,
  title = "Category",
  className,
}) => {
  const { translateText } = useTranslation();
  const values = items
    .map(normalizeCategory)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
  const fallbackValue = String(fallback || "").trim();
  const visibleValues = values.length ? values.slice(0, limit) : fallbackValue ? [fallbackValue] : [];

  return (
    <Wrapper className={className}>
      <Title>{translateText(title)}</Title>
      <Chips>
        {visibleValues.length ? (
          visibleValues.map((value) => <Chip key={value}>{value}</Chip>)
        ) : (
          <Chip>{translateText("Unknown")}</Chip>
        )}
      </Chips>
    </Wrapper>
  );
};

export default ProjectCategories;
