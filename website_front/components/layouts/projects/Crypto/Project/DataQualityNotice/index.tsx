import React, { FC, useId, useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Database,
  ExternalLink,
  FileText,
  Github,
  Globe2,
} from "lucide-react";
import { useTranslation } from "i18n";
import type { DataQualityNoticeStatus } from "./styles";
import {
  Content,
  Description,
  IconWrapper,
  Notice,
  SourceControl,
  SourceItem,
  SourceLink,
  SourceLinkIcon,
  SourceLinkText,
  SourcesTooltip,
  SourceTitle,
  SourceTrigger,
  Title,
} from "./styles";
import { buildDataQualitySources } from "./sources";
import type { DataQualitySourceProject } from "./sources";

interface DataQualityNoticeProps {
  status: DataQualityNoticeStatus;
  className?: string;
  title?: string;
  description?: string;
  project?: DataQualitySourceProject | null;
}

const defaultCopy: Record<
  DataQualityNoticeStatus,
  { title: string; description: string }
> = {
  warning: {
    title: "Data quality notice",
    description: "Data may contain inaccuracies in some fields.",
  },
  verified: {
    title: "Reviewed and verified",
    description: "This data has been reviewed and verified by the FOMO Team.",
  },
};

const DataQualityNotice: FC<DataQualityNoticeProps> = ({
  status,
  className,
  title,
  description,
  project,
}) => {
  const { translateText } = useTranslation();
  const sourcesTooltipId = useId();
  const sources = useMemo(() => buildDataQualitySources(project), [project]);
  const sourcesLabel = translateText("Sources");
  const translatedTitle = translateText(title || defaultCopy[status].title);
  const translatedDescription = translateText(
    description || defaultCopy[status].description
  );

  return (
    <Notice
      $status={status}
      className={className}
      role="note"
      aria-label={translatedTitle}
    >
      <IconWrapper $status={status} aria-hidden="true">
        {status === "verified" ? <BadgeCheck /> : <AlertTriangle />}
      </IconWrapper>
      <Content>
        <Title $status={status}>{translatedTitle}</Title>
        <Description>{translatedDescription}</Description>
      </Content>
      {sources.length ? (
        <SourceControl>
          <SourceTrigger
            type="button"
            aria-haspopup="dialog"
            aria-controls={sourcesTooltipId}
          >
            <Database aria-hidden="true" />
            <span>{sourcesLabel}</span>
          </SourceTrigger>
          <SourcesTooltip
            id={sourcesTooltipId}
            role="dialog"
            aria-label={sourcesLabel}
          >
            {sources.map((source) => {
              const SourceIcon =
                source.kind === "github"
                  ? Github
                  : source.kind === "documentation"
                    ? FileText
                    : Globe2;

              return (
                <SourceItem key={source.url}>
                  <SourceTitle>{source.title}</SourceTitle>
                  <SourceLink
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={source.url}
                  >
                    <SourceLinkIcon aria-hidden="true">
                      <SourceIcon />
                    </SourceLinkIcon>
                    <SourceLinkText>{source.url}</SourceLinkText>
                    <ExternalLink aria-hidden="true" />
                  </SourceLink>
                </SourceItem>
              );
            })}
          </SourcesTooltip>
        </SourceControl>
      ) : null}
    </Notice>
  );
};

export default DataQualityNotice;
