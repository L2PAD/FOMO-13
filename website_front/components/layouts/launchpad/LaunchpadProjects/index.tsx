import React, { FC, useMemo, useState } from "react";
import CheckIcon from "../../../global/Icons/CheckIcon";
import Pagination from "../../../global/Pagintaion";
import { HowItWorksStep } from "./types";
import type { FomoV2LaunchpadSummary } from "../../../../types/fomoV2Launchpad";
import {
  mapLaunchpadSummaryToCard,
  mapLaunchpadSummaryToFeaturedCard,
  isLaunchpadFeatured,
} from "../../../../utils/fomoV2Launchpad";
import {
  Wrapper,
  Section,
  SectionTitle,
  FeaturedCard,
  FeaturedLeft,
  FeaturedTop,
  FeaturedLogo,
  FeaturedInfo,
  FeaturedNameRow,
  FeaturedName,
  FeaturedBadgesRow,
  FeaturedBadge,
  FeaturedMeta,
  FeaturedCategory,
  FeaturedDescription,
  FeaturedStatsRow,
  FeaturedStat,
  FeaturedRight,
  EligibleRow,
  ProgressSection,
  ProgressRow,
  ProgressLabel,
  ProgressValue,
  ProgressBarWrapper,
  ProgressBarFill,
  ProjectsGrid,
  ProjectCard,
  CardHeader,
  CardLeft,
  ProjectLogo,
  ProjectMeta,
  ProjectName,
  ProjectCategory,
  StatusBadge,
  StatBoxes,
  StatBox,
  StatLabel,
  StatValue,
  Divider,
  CardFooter,
  FooterStat,
  EligibleLabel,
  PaginationRow,
  HowItWorksSection,
  StepItem,
  StepNumber,
  StepTitle,
  StepDesc,
} from "./styles";
import { CircleDollarSign, Clock, Users } from "lucide-react";
import { useRouter } from "next/router";
import { LaunchpadProjectsSkeleton } from "../LaunchpadLoadingSkeletons";

interface LaunchpadProjectsProps {
  items: FomoV2LaunchpadSummary[];
  isLoading?: boolean;
  error?: string | null;
  searchValue?: string;
  selectedTypes?: string[];
  selectedCategories?: string[];
}

const BullishIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M2.40039 16.7992L7.77639 11.63L12.3844 16.0608L21.6004 7.19922M21.6004 7.19922H14.6884M21.6004 7.19922V13.8454" stroke="#05A584" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HOW_IT_WORKS: HowItWorksStep[] = [
  { num: "01", title: "Stake NFTs", desc: "Stake your FOMO NFTs to secure your position in the allocation queue." },
  { num: "02", title: "Get Allocation", desc: "Higher staking = better zone (Green > Yellow > Red) for guaranteed access." },
  { num: "03", title: "Participate & Claim", desc: "Invest during your window and claim tokens after distribution." },
];

const PAGE_LIMIT = 15;

const LaunchpadProjects: FC<LaunchpadProjectsProps> = ({
  items,
  isLoading,
  error,
  searchValue = "",
  selectedTypes = [],
  selectedCategories = [],
}) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => items.filter((item) => {
    const search = searchValue.trim().toLowerCase();
    const haystack = `${item.project.name} ${item.launch.title || ""} ${item.launch.category || ""}`.toLowerCase();
    const type = String(item.launch.saleType || "").toLowerCase();
    const categories = [item.launch.category, ...(item.project.categories || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (!search || haystack.includes(search))
      && (!selectedTypes.length || selectedTypes.some((value) => type.includes(value.toLowerCase())))
      && (!selectedCategories.length || selectedCategories.some((value) => categories.includes(value.toLowerCase())));
  }), [items, searchValue, selectedCategories, selectedTypes]);
  const featuredSource = filtered.find(isLaunchpadFeatured);
  const featured = featuredSource ? mapLaunchpadSummaryToFeaturedCard(featuredSource) : null;
  const allProjectItems = featuredSource
    ? filtered.filter((item) => item.id !== featuredSource.id)
    : filtered;
  const totalPages = Math.max(1, Math.ceil(allProjectItems.length / PAGE_LIMIT));
  const safePage = Math.min(page, totalPages);
  const projects = allProjectItems
    .slice((safePage - 1) * PAGE_LIMIT, safePage * PAGE_LIMIT)
    .map(mapLaunchpadSummaryToCard);

  if (isLoading) return <LaunchpadProjectsSkeleton />;

  return (
    <Wrapper>
      {featured && (
        <Section>
          <SectionTitle><BullishIcon />Featured Project</SectionTitle>
          <FeaturedCard onClick={() => router.push(`/utility/launchpad/${featured.id}`)}>
            <FeaturedLeft>
              <FeaturedTop>
                <FeaturedLogo>
                  {featured.logo ? <img src={featured.logo} alt={featured.name} /> : featured.name.slice(0, 2).toUpperCase()}
                </FeaturedLogo>
                <FeaturedInfo>
                  <FeaturedMeta>
                    <FeaturedNameRow>
                      <FeaturedName>{featured.name}</FeaturedName>
                      <FeaturedBadgesRow>
                        {featured.badges?.map((badge) => <FeaturedBadge key={badge.label} variant={badge.variant}>{badge.label}</FeaturedBadge>)}
                      </FeaturedBadgesRow>
                    </FeaturedNameRow>
                    <FeaturedCategory>{featured.category}</FeaturedCategory>
                  </FeaturedMeta>
                  {featured.description && <FeaturedDescription>{featured.description}</FeaturedDescription>}
                </FeaturedInfo>
              </FeaturedTop>
              <FeaturedStatsRow>
                {featured.raise && <FeaturedStat><CircleDollarSign color="#05A584" size={18} strokeWidth={0.8} />Raise: {featured.raise}</FeaturedStat>}
                {featured.participants && <FeaturedStat><Users color="#05A584" size={18} strokeWidth={0.8} />{featured.participants}</FeaturedStat>}
                {featured.timeLeft && <FeaturedStat><Clock color="#05A584" size={18} strokeWidth={0.8} />{featured.timeLeft}</FeaturedStat>}
              </FeaturedStatsRow>
            </FeaturedLeft>
            <FeaturedRight>
              {featured.isEligible && <EligibleRow><CheckIcon fill="#05a584" />Eligible</EligibleRow>}
              <ProgressSection>
                <ProgressRow><ProgressLabel>Funding Progress</ProgressLabel><ProgressValue>{featured.progress ?? 0}%</ProgressValue></ProgressRow>
                <ProgressBarWrapper><ProgressBarFill percent={featured.progress ?? 0} /></ProgressBarWrapper>
              </ProgressSection>
            </FeaturedRight>
          </FeaturedCard>
        </Section>
      )}

      <Section>
        <SectionTitle>All Projects</SectionTitle>
        {error && <p>{error}</p>}
        {!isLoading && !error && projects.length === 0 && <p>No launch projects match these filters.</p>}
        <ProjectsGrid>
          {projects.map((project) => (
            <ProjectCard key={project.id} onClick={() => router.push(`/utility/launchpad/${project.id}`)}>
              <CardHeader>
                <CardLeft>
                  <ProjectLogo>{project.logo ? <img src={project.logo} alt={project.name} /> : project.name.slice(0, 2).toUpperCase()}</ProjectLogo>
                  <ProjectMeta><ProjectName>{project.name}</ProjectName><ProjectCategory>{project.category}</ProjectCategory></ProjectMeta>
                </CardLeft>
                {project.status && <StatusBadge status={project.status}>{project.status}</StatusBadge>}
              </CardHeader>
              <StatBoxes>
                <StatBox><StatLabel>Total Raise</StatLabel><StatValue>{project.raise ?? "—"}</StatValue></StatBox>
                <StatBox><StatLabel>Allocation</StatLabel><StatValue>{project.allocation ?? "—"}</StatValue></StatBox>
              </StatBoxes>
              <ProgressSection>
                <ProgressRow><ProgressLabel>Funding Progress</ProgressLabel><ProgressValue>{project.progress ?? 0}%</ProgressValue></ProgressRow>
                <ProgressBarWrapper><ProgressBarFill percent={project.progress ?? 0} /></ProgressBarWrapper>
              </ProgressSection>
              <Divider />
              <CardFooter>
                {project.timeLeft && <FooterStat><Clock size={16} />{project.timeLeft}</FooterStat>}
                {project.isEligible && <EligibleLabel><CheckIcon fill="#05a584" />Eligible</EligibleLabel>}
              </CardFooter>
            </ProjectCard>
          ))}
        </ProjectsGrid>
        {allProjectItems.length > PAGE_LIMIT && (
          <PaginationRow>
            <Pagination page={safePage} totalPage={totalPages} total={allProjectItems.length} limit={PAGE_LIMIT} onChange={setPage} />
          </PaginationRow>
        )}
      </Section>

      <HowItWorksSection>
        {HOW_IT_WORKS.map((step) => (
          <StepItem key={step.num}><StepNumber>{step.num}</StepNumber><div><StepTitle>{step.title}</StepTitle><StepDesc>{step.desc}</StepDesc></div></StepItem>
        ))}
      </HowItWorksSection>
    </Wrapper>
  );
};

export default LaunchpadProjects;
