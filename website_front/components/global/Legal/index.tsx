import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Clock3,
  FileCheck2,
  FileText,
  Printer,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { LayoutContext } from "../Layout";
import { sanitizeHtml } from "../../../helpers/sanitizeHtml";
import { normalizeLegalHtml } from "../../../helpers/normalizeLegalHtml";
import {
  Content,
  ContentCard,
  ContentHeading,
  ContentMeta,
  ContentTop,
  DocumentLink,
  DocumentNav,
  EmptyState,
  Hero,
  HeroCopy,
  HeroEyebrow,
  HeroIcon,
  HeroMeta,
  LayoutGrid,
  Outline,
  OutlineLink,
  Page,
  PageInner,
  PrintButton,
  Sidebar,
  Skeleton,
} from "./styles";

export type LegalType = "policy" | "terms" | "disclaimer";

interface LegalDocumentMeta {
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
}

export const LEGAL_DOCUMENTS: Record<LegalType, LegalDocumentMeta> = {
  policy: {
    title: "Privacy Policy",
    shortTitle: "Privacy",
    description:
      "How FOMO collects, uses and protects information when you use the platform.",
    icon: ShieldCheck,
  },
  terms: {
    title: "Terms of Use",
    shortTitle: "Terms",
    description:
      "The rules, responsibilities and conditions that apply when using FOMO.",
    icon: FileText,
  },
  disclaimer: {
    title: "Disclaimer",
    shortTitle: "Disclaimer",
    description:
      "Important information about platform content, market risk and limitations.",
    icon: Scale,
  },
};

const LEGAL_TYPES = Object.keys(LEGAL_DOCUMENTS) as LegalType[];

export const resolveLegalType = (value: unknown): LegalType => {
  const normalized = Array.isArray(value) ? value[0] : value;

  return LEGAL_TYPES.includes(normalized as LegalType)
    ? (normalized as LegalType)
    : "policy";
};

interface OutlineItem {
  id: string;
  label: string;
  level: 2 | 3;
}

const makeHeadingId = (label: string, index: number): string => {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || `section-${index + 1}`;
};

const getReadingTime = (html: string): number => {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return words ? Math.max(1, Math.ceil(words / 220)) : 0;
};

const Legal = () => {
  const router = useRouter();
  const { layout, isLoading } = useContext(LayoutContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [activeSection, setActiveSection] = useState("");

  const type = resolveLegalType(router.query.type);
  const document = LEGAL_DOCUMENTS[type];
  const DocumentIcon = document.icon;
  const rawHtml = String(layout?.footer?.legal?.[type] || "");
  const safeHtml = useMemo(
    () => sanitizeHtml(normalizeLegalHtml(rawHtml)),
    [rawHtml]
  );
  const readingTime = useMemo(() => getReadingTime(safeHtml), [safeHtml]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container || !safeHtml) {
      setOutline([]);
      setActiveSection("");
      return undefined;
    }

    const usedIds = new Set<string>();
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h2, h3")
    );
    const items = headings.map((heading, index): OutlineItem => {
      const label = heading.textContent?.trim() || `Section ${index + 1}`;
      const baseId = makeHeadingId(label, index);
      let id = baseId;
      let suffix = 2;

      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      usedIds.add(id);
      heading.id = id;

      return {
        id,
        label,
        level: heading.tagName.toLowerCase() === "h3" ? 3 : 2,
      };
    });

    setOutline(items);
    setActiveSection(items[0]?.id || "");

    if (!headings.length || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -68% 0px", threshold: [0, 1] }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [safeHtml]);

  const printDocument = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <Page>
      <PageInner>
        <Hero className="legal-hero">
          <HeroCopy>
            <HeroEyebrow>
              <FileCheck2 size={16} aria-hidden="true" />
              FOMO legal center
            </HeroEyebrow>
            <h1>{document.title}</h1>
            <p>{document.description}</p>
            <HeroMeta>
              <span>
                <ShieldCheck size={15} aria-hidden="true" />
                Official FOMO document
              </span>
              {readingTime ? (
                <span>
                  <Clock3 size={15} aria-hidden="true" />
                  About {readingTime} min read
                </span>
              ) : null}
            </HeroMeta>
          </HeroCopy>
          <HeroIcon aria-hidden="true">
            <DocumentIcon size={42} strokeWidth={1.6} />
          </HeroIcon>
          <PrintButton
            className="legal-print"
            type="button"
            onClick={printDocument}
            aria-label={`Print ${document.title}`}
          >
            <Printer size={17} aria-hidden="true" />
            Print
          </PrintButton>
        </Hero>

        <LayoutGrid className="legal-layout">
          <Sidebar className="legal-sidebar">
            <DocumentNav aria-label="Legal documents">
              <span>Legal documents</span>
              {LEGAL_TYPES.map((documentType) => {
                const item = LEGAL_DOCUMENTS[documentType];
                const Icon = item.icon;
                const isActive = documentType === type;

                return (
                  <DocumentLink
                    key={documentType}
                    href={`/legal?type=${documentType}`}
                    $active={isActive}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() =>
                      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.shortTitle}</span>
                  </DocumentLink>
                );
              })}
            </DocumentNav>

            {outline.length ? (
              <Outline aria-label="On this page">
                <span>On this page</span>
                {outline.map((item) => (
                  <OutlineLink
                    key={item.id}
                    href={`#${item.id}`}
                    $active={item.id === activeSection}
                    $nested={item.level === 3}
                    aria-current={item.id === activeSection ? "location" : undefined}
                  >
                    {item.label}
                  </OutlineLink>
                ))}
              </Outline>
            ) : null}
          </Sidebar>

          <ContentCard className="legal-content">
            <ContentTop>
              <ContentHeading>
                <FileText size={19} aria-hidden="true" />
                <span>Document</span>
              </ContentHeading>
              <ContentMeta>Use the navigation to move between sections</ContentMeta>
            </ContentTop>

            {isLoading ? (
              <Skeleton aria-label={`Loading ${document.title}`}>
                <span />
                <span />
                <span />
                <span />
              </Skeleton>
            ) : safeHtml ? (
              <Content ref={contentRef} dangerouslySetInnerHTML={{ __html: safeHtml }} />
            ) : (
              <EmptyState>
                <FileText size={28} aria-hidden="true" />
                <h2>Document temporarily unavailable</h2>
                <p>This legal document is being updated. Please check back soon.</p>
                <Link href="/">Return to FOMO</Link>
              </EmptyState>
            )}
          </ContentCard>
        </LayoutGrid>
      </PageInner>
    </Page>
  );
};

export default Legal;
