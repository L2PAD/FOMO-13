import React, { FC, useState } from "react";
import {
  Overlay,
  ModalWrapper,
  ModalHeader,
  ModalTitle,
  CloseButton,
  SectionsWrapper,
  FilterSection,
  SectionTitle,
  OptionsGrid,
  OptionsColumn,
  CheckboxItem,
  CheckboxBox,
  CheckboxLabel,
  ModalFooter,
  FooterButtons,
  CancelButton,
  ApplyButton,
  ResetButton,
} from "./styles";
import { useTranslation } from "i18n";

const CheckIcon: FC = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3.5L3.8 6.5L9 1.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ResetIcon: FC = () => (
  <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.748 7.668C2.426 9.797 4.37 11.335 6.662 11.335C9.518 11.335 11.834 8.947 11.834 6.001C11.834 3.056 9.518 0.668 6.662 0.668C4.748 0.668 3.076 1.741 2.182 3.335M3.753 4.001H1.167V1.335"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface FeedFilters {
  activityTypes: string[];
  difficulty: string[];
  status: string[];
  categories: string[];
  sorting: string[];
}

export const INITIAL_FILTERS: FeedFilters = {
  activityTypes: [],
  difficulty: [],
  status: [],
  categories: [],
  sorting: [],
};

export interface FeedFilterOption {
  value: string;
  label: string;
  count?: number;
}

const toOptions = (items: string[]): FeedFilterOption[] =>
  items.map((item) => ({ value: item, label: item }));

const columnsFromOptions = (
  options: FeedFilterOption[],
  columnCount = 3
): FeedFilterOption[][] => {
  const columns = Array.from({ length: columnCount }, () => [] as FeedFilterOption[]);

  options.forEach((option, index) => {
    columns[index % columnCount].push(option);
  });

  return columns.filter((column) => column.length > 0);
};

const DIFFICULTY_OPTIONS = columnsFromOptions(toOptions(["Easy", "Medium", "Hard"]));

const STATUS_OPTIONS = columnsFromOptions(toOptions(["Active", "Ending Soon", "Ended"]));

const SORTING_OPTIONS = columnsFromOptions(toOptions(["New", "Most Popular", "Ending Soon", "High potential"]));

interface CheckboxGroupProps {
  columns: FeedFilterOption[][];
  selected: string[];
  onToggle: (value: string) => void;
}

const CheckboxGroup: FC<CheckboxGroupProps> = ({ columns, selected, onToggle }) => {
  const { translateText } = useTranslation();

  return (
  <OptionsGrid>
    {columns.map((col) => (
      <OptionsColumn key={col.map((option) => option.value).join(",")}>
        {col.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <CheckboxItem
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggle(option.value)}
            >
              <CheckboxBox checked={checked}>
                {checked && <CheckIcon />}
              </CheckboxBox>
              <CheckboxLabel>{translateText(option.label)}</CheckboxLabel>
            </CheckboxItem>
          );
        })}
      </OptionsColumn>
    ))}
  </OptionsGrid>
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: FeedFilters;
  onApply: (filters: FeedFilters) => void;
  activityTypeOptions?: FeedFilterOption[];
  categoryOptions?: FeedFilterOption[];
}

const FeedFilterModal: FC<Props> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  activityTypeOptions = [],
  categoryOptions = [],
}) => {
  const { translateText } = useTranslation();
  const [draft, setDraft] = useState<FeedFilters>(filters);

  React.useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const toggle = (key: keyof FeedFilters, value: string) => {
    setDraft((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const handleReset = () => {
    setDraft(INITIAL_FILTERS);
    onApply(INITIAL_FILTERS);
    onClose();
  };
  const handleApply = () => { onApply(draft); onClose(); };
  const activityTypeColumns = columnsFromOptions(activityTypeOptions);
  const categoryColumns = columnsFromOptions(categoryOptions);

  return (
    <>
      <Overlay onClick={onClose} />
      <ModalWrapper>
        <ModalHeader>
          <ModalTitle>{translateText("Filter")}</ModalTitle>
          <CloseButton onClick={onClose} aria-label={translateText("Close filter")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </CloseButton>
        </ModalHeader>

        <SectionsWrapper>
          <FilterSection>
            <SectionTitle>{translateText("Activity Type")}</SectionTitle>
            <CheckboxGroup
              columns={activityTypeColumns}
              selected={draft.activityTypes}
              onToggle={(v) => toggle("activityTypes", v)}
            />
          </FilterSection>

          <FilterSection>
            <SectionTitle>{translateText("Difficulty")}</SectionTitle>
            <CheckboxGroup
              columns={DIFFICULTY_OPTIONS}
              selected={draft.difficulty}
              onToggle={(v) => toggle("difficulty", v)}
            />
          </FilterSection>

          <FilterSection>
            <SectionTitle>{translateText("Status")}</SectionTitle>
            <CheckboxGroup
              columns={STATUS_OPTIONS}
              selected={draft.status}
              onToggle={(v) => toggle("status", v)}
            />
          </FilterSection>

          <FilterSection>
            <SectionTitle>{translateText("Category")}</SectionTitle>
            <CheckboxGroup
              columns={categoryColumns}
              selected={draft.categories}
              onToggle={(v) => toggle("categories", v)}
            />
          </FilterSection>

          <FilterSection>
            <SectionTitle>{translateText("Sorting")}</SectionTitle>
            <CheckboxGroup
              columns={SORTING_OPTIONS}
              selected={draft.sorting}
              onToggle={(v) => toggle("sorting", v)}
            />
          </FilterSection>
        </SectionsWrapper>

        <ModalFooter>
          <FooterButtons>
            <CancelButton onClick={onClose}>{translateText("Cancel")}</CancelButton>
            <ApplyButton onClick={handleApply}>{translateText("Apply")}</ApplyButton>
          </FooterButtons>
          <ResetButton onClick={handleReset}>
            <ResetIcon />
            {translateText("Reset")}
          </ResetButton>
        </ModalFooter>
      </ModalWrapper>
    </>
  );
};

export default FeedFilterModal;
