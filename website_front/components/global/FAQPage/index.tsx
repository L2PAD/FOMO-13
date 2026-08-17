import React, { useMemo, useState } from "react";
import { ChevronDown, CircleHelp, Layers3, ShieldCheck } from "lucide-react";
import { FAQItem } from "../../../types/global_types";
import {
  Answer,
  CategoryLink,
  CategoryNav,
  EmptyState,
  FaqItem,
  FaqList,
  Hero,
  HeroBadge,
  HeroContent,
  HeroIcon,
  HeroStats,
  LayoutGrid,
  Page,
  PageInner,
  QuestionButton,
  ResultsBar,
  Section,
  SectionDescription,
  SectionHeader,
  SectionIndex,
  SectionTitle,
  Sections,
  ToggleAllButton,
} from "./styles";

interface FAQPageProps {
  faq: FAQItem[];
}

interface FAQSection {
  section: FAQItem;
  sectionIndex: number;
  id: string;
  items: FAQItem["items"];
}

const makeSectionId = (section: FAQItem, index: number): string => {
  const slug = section.title
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);

  return `faq-${slug || section._id || index + 1}`;
};

const itemKey = (sectionIndex: number, itemIndex: number): string =>
  `${sectionIndex}:${itemIndex}`;

const FAQPage = ({ faq }: FAQPageProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set());

  const totalQuestions = useMemo(
    () => faq.reduce((total, section) => total + section.items.length, 0),
    [faq]
  );

  const sections = useMemo<FAQSection[]>(
    () =>
      faq.map((section, sectionIndex) => ({
        section,
        sectionIndex,
        id: makeSectionId(section, sectionIndex),
        items: section.items,
      })),
    [faq]
  );

  const questionKeys = useMemo(
    () =>
      sections.flatMap(({ section, sectionIndex, items }) =>
        items.map((item) =>
          itemKey(sectionIndex, section.items.indexOf(item))
        )
      ),
    [sections]
  );
  const allOpen =
    questionKeys.length > 0 && questionKeys.every((key) => openItems.has(key));

  const toggleItem = (key: string) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setOpenItems((current) => {
      const next = new Set(current);
      questionKeys.forEach((key) => {
        if (allOpen) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  return (
    <Page>
      <PageInner>
        <Hero>
          <HeroContent>
            <HeroBadge>
              <CircleHelp size={16} aria-hidden="true" />
              FOMO help center
            </HeroBadge>
            <h1>Questions, answered.</h1>
            <p>
              Find clear guidance about FOMO, platform features, account safety,
              data, and market risks.
            </p>
            <HeroStats>
              <span>
                <Layers3 size={16} aria-hidden="true" />
                {faq.length} topics
              </span>
              <span>
                <ShieldCheck size={16} aria-hidden="true" />
                {totalQuestions} answers
              </span>
            </HeroStats>
          </HeroContent>
          <HeroIcon aria-hidden="true">
            <CircleHelp size={50} strokeWidth={1.5} />
          </HeroIcon>
        </Hero>

        <LayoutGrid>
          <CategoryNav aria-label="FAQ topics">
            <span>Browse by topic</span>
            {sections.map(({ section, sectionIndex, id }) => (
              <CategoryLink
                key={section._id || section.title}
                href={`#${id}`}
              >
                <span>{String(sectionIndex + 1).padStart(2, "0")}</span>
                {section.title}
              </CategoryLink>
            ))}
          </CategoryNav>

          <Sections>
            <ResultsBar>
              <div>
                <strong>All questions</strong>
                <span> grouped by topic</span>
              </div>
              {questionKeys.length ? (
                <ToggleAllButton type="button" onClick={toggleAll}>
                  {allOpen ? "Collapse all" : "Expand all"}
                </ToggleAllButton>
              ) : null}
            </ResultsBar>

            {sections.length ? (
              sections.map(({ section, sectionIndex, id, items }) => (
                <Section key={section._id || id} id={id}>
                  <SectionHeader>
                    <SectionIndex>{String(sectionIndex + 1).padStart(2, "0")}</SectionIndex>
                    <div>
                      <SectionTitle>{section.title}</SectionTitle>
                      {section.description ? (
                        <SectionDescription>{section.description}</SectionDescription>
                      ) : null}
                    </div>
                    <span>{items.length}</span>
                  </SectionHeader>

                  <FaqList>
                    {items.map((item) => {
                      const originalIndex = section.items.indexOf(item);
                      const key = itemKey(sectionIndex, originalIndex);
                      const isOpen = openItems.has(key);
                      const answerId = `faq-answer-${sectionIndex}-${originalIndex}`;

                      return (
                        <FaqItem key={key} $open={isOpen}>
                          <QuestionButton
                            type="button"
                            $open={isOpen}
                            onClick={() => toggleItem(key)}
                            aria-expanded={isOpen}
                            aria-controls={answerId}
                          >
                            <span>{item.title}</span>
                            <ChevronDown size={20} aria-hidden="true" />
                          </QuestionButton>
                          <Answer id={answerId} $open={isOpen} aria-hidden={!isOpen}>
                            <div>
                              <p>{item.description}</p>
                            </div>
                          </Answer>
                        </FaqItem>
                      );
                    })}
                  </FaqList>
                </Section>
              ))
            ) : (
              <EmptyState>
                <CircleHelp size={28} aria-hidden="true" />
                <h2>No questions available</h2>
                <p>FAQ content is being updated.</p>
              </EmptyState>
            )}
          </Sections>
        </LayoutGrid>
      </PageInner>
    </Page>
  );
};

export default FAQPage;
