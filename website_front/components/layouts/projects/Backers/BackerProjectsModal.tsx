import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useQuery } from "react-query";
import MainModal from "../../../global/common/MainModal";
import UserAvatar from "../../../global/common/UserAvatar";
import PlaceholderTable from "../../../global/common/PlaceholderTable";
import EmptyList from "../../../global/EmptyList";
import { SearchIconStyle, SearchInput, SearchWrapper } from "../Networks/styles";
import imageLoader from "../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { useDebounce } from "../../../../hooks/useDebounce";
import fetchBackerProjects, {
  BackerProjectItem,
} from "../../../../http/backers/fetchBackerProjects";

interface Props {
  backer: any | null;
  isVisible: boolean;
  onClose: () => void;
}

const LIMIT = 20;

const ProjectsList = styled.div`
  margin-top: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ProjectRow = styled.a`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(115, 128, 148, 0.12);

  &:hover {
    opacity: 0.82;
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const ProjectInfo = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  .project-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  p,
  span {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    font-size: 14px;
    line-height: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
  }

  span {
    font-size: 13px;
    line-height: 16px;
    color: var(--main-gray);
  }
`;

const ProjectMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 13px;
  line-height: 16px;
  color: var(--main-gray);
  white-space: nowrap;

  strong {
    color: #04a584;
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 520px) {
    align-items: flex-start;
    padding-left: 42px;
  }
`;

const Sentinel = styled.div`
  width: 100%;
  height: 32px;
`;

const getBackerIdentifier = (backer: any): string => {
  const { _id: mongoId } = backer || {};

  return String(
    backer?.backerId ||
      backer?.canonicalBackerId ||
      backer?.routeId ||
      backer?.slug ||
      backer?.id ||
      mongoId ||
      ""
  ).trim();
};

const getProjectKey = (project: BackerProjectItem): string => {
  const { _id: mongoId } = project;

  return String(
    project.canonicalProjectId ||
      project.id ||
      mongoId ||
      project.slug ||
      project.name
  );
};

const mergeProjects = (
  previousProjects: BackerProjectItem[],
  nextProjects: BackerProjectItem[]
) => {
  const seen = new Set<string>();

  return [...previousProjects, ...nextProjects].filter((project) => {
    const key = getProjectKey(project);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatRoundTypes = (roundTypes?: string[]): string => {
  const values = Array.isArray(roundTypes)
    ? roundTypes.filter(Boolean).slice(0, 2)
    : [];

  if (!values.length) return "";

  return values
    .map((value) =>
      String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    )
    .join(", ");
};

const formatRaisedAmount = (value?: number): string => {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) return "";

  return `$${clarifyAmount(amount, true)}`;
};

const BackerProjectsModal: FC<Props> = ({ backer, isVisible, onClose }) => {
  const backerIdentifier = useMemo(() => getBackerIdentifier(backer), [backer]);
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 400);
  const [offset, setOffset] = useState(0);
  const [projects, setProjects] = useState<BackerProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastElement, setLastElement] = useState<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    setOffset(0);
    setProjects([]);
    setTotal(0);
    setHasMore(false);
  }, [backerIdentifier, debouncedSearchValue, isVisible]);

  const { isFetching } = useQuery(
    ["backer-projects", backerIdentifier, debouncedSearchValue, offset],
    () =>
      fetchBackerProjects(backerIdentifier, {
        offset,
        limit: LIMIT,
        search: debouncedSearchValue,
      }),
    {
      enabled: isVisible && Boolean(backerIdentifier),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (!data.isSuccess) {
          if (offset === 0) setProjects([]);
          setTotal(0);
          setHasMore(false);
          return;
        }

        setProjects((previousProjects) =>
          offset === 0
            ? data.projects
            : mergeProjects(previousProjects, data.projects)
        );
        setTotal(data.total);
        setHasMore(data.hasMore);
      },
    }
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (lastElement && hasMore && !isFetching) {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetching) {
            setOffset((value) => value + LIMIT);
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(lastElement);
      cleanup = () => {
        if (observerRef.current) observerRef.current.disconnect();
      };
    }

    return cleanup;
  }, [lastElement, hasMore, isFetching]);

  const title = `${backer?.name || "Fund"} Projects${total > 0 ? ` (${total})` : ""}`;
  const showEmpty = !isFetching && projects.length === 0;

  return (
    <MainModal
      variant="big"
      title={title}
      onClose={onClose}
      isVisible={isVisible}
    >
      <SearchWrapper>
        <SearchInput
          placeholder="Search"
          type="string"
          value={searchValue}
          onChange={(value: string) => {
            setSearchValue(value);
            setOffset(0);
          }}
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <ProjectsList>
        {projects.map((project) => {
          const href = project.href || "#";
          const roundTypes = formatRoundTypes(project.roundTypes);
          const raisedAmount = formatRaisedAmount(project.totalKnownRaisedAmountUsd);

          return (
            <ProjectRow
              key={getProjectKey(project)}
              href={href}
              onClick={(event) => {
                if (href === "#") event.preventDefault();
              }}
            >
              <ProjectInfo>
                <UserAvatar
                  avatar={imageLoader(project.logo || project.image)}
                  name={String(project.name || "")}
                  variant="default"
                  size="otc"
                  fallbackType="project"
                />
                <div className="project-text">
                  <p>{project.name || "-"}</p>
                  <span>
                    {[project.symbol?.toUpperCase(), project.category]
                      .filter(Boolean)
                      .join(" · ") || project.slug || ""}
                  </span>
                </div>
              </ProjectInfo>
              <ProjectMeta>
                <strong>{raisedAmount || `${project.roundsCount || 0} rounds`}</strong>
                <span>{roundTypes || project.lastRoundDate || ""}</span>
              </ProjectMeta>
            </ProjectRow>
          );
        })}
        {showEmpty ? <EmptyList /> : null}
        {isFetching && !showEmpty ? <PlaceholderTable height="68px" /> : null}
        <Sentinel ref={setLastElement} />
      </ProjectsList>
    </MainModal>
  );
};

export default BackerProjectsModal;
