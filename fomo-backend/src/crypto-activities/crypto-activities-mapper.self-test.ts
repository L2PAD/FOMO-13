import { mapParserActivityToCryptoActivity } from "./mappers/parser-activity.mapper";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function isoDate(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);

  return date.toISOString().slice(0, 10);
}

function runFullPayloadCheck(): void {
  const mapped = mapParserActivityToCryptoActivity({
    _id: "parser-1",
    source: "dropstab",
    sourceUrl: "https://dropstab.com/coins/example/activities",
    canonicalUrl: "https://dropstab.com/coins/example/activities",
    originalUrl: "https://dropstab.com/coins/example",
    externalId: "example:quest",
    title: "Example Quest",
    projectName: "Example",
    projectLogo: "https://cdn.example/logo.png",
    coinSlug: "example",
    coinSymbol: "EX",
    activityType: "Quest",
    status: "UPCOMING",
    startDate: isoDate(-1),
    endDate: isoDate(1),
    description: {
      about: "Long description",
      aboutHtml: "<p><strong>Long</strong> description</p>",
      howToParticipate: "Complete tasks",
      howToParticipateHtml: "<p>Complete <strong>tasks</strong></p>",
    },
    links: {
      website: "https://example.com",
      twitter: "https://x.com/example",
      custom: [{ label: "Docs", url: "https://docs.example.com" }],
    },
    tags: ["Quest", "Social"],
    requirements: ["Follow X", "Join Discord"],
    rewards: [{ label: "Points" }],
    taskGuide: {
      title: "Example guide",
      descriptionHtml: "<p>Guide details</p>",
      steps: [{ title: "Step 1", description: "Follow X", descriptionHtml: "<p><strong>Follow</strong> X</p>" }],
    },
    sourceMeta: { parser: "self-test" },
    rawSourceData: { id: 1 },
  });

  assert(mapped, "Full payload should map");
  assert(mapped?.sourceUrl === "https://dropstab.com/coins/example/activities", "sourceUrl should be preserved");
  assert(mapped?.originalUrl === "https://dropstab.com/coins/example", "originalUrl should be preserved");
  assert(mapped?.description?.about === "Long description", "description.about should be preserved");
  assert(mapped?.description?.aboutHtml === "<p><strong>Long</strong> description</p>", "description.aboutHtml should be preserved");
  assert(mapped?.description?.howToParticipateHtml === "<p>Complete <strong>tasks</strong></p>", "description.howToParticipateHtml should be preserved");
  assert(mapped?.status === "Active", "status should be resolved from active date range");
  assert(mapped?.socialLinks?.twitter === "https://x.com/example", "social link should be normalized");
  assert(mapped?.links?.some((link: any) => link.url === "https://docs.example.com"), "custom link should be preserved");
  assert(mapped?.requirements?.length === 2, "requirements should be preserved");
  assert(mapped?.rewards?.length === 1, "rewards should be preserved");
  assert(mapped?.taskGuide?.ctaUrl === mapped?.sourceUrl, "taskGuide ctaUrl should fall back to sourceUrl");
  assert(mapped?.taskGuide?.descriptionHtml === "<p>Guide details</p>", "taskGuide.descriptionHtml should be preserved");
  assert(mapped?.taskGuide?.steps?.[0]?.descriptionHtml === "<p><strong>Follow</strong> X</p>", "step descriptionHtml should be preserved");
  assert(mapped?.sourceMeta?.parser === "self-test", "sourceMeta should be preserved");
  assert(mapped?.rawSourceData?.id === 1, "rawSourceData should be preserved");
}

function runSparsePayloadCheck(): void {
  const mapped = mapParserActivityToCryptoActivity({
    _id: "parser-2",
    source: "airdrops_io",
    sourceUrl: "https://airdrops.io/example/",
    title: "Example Airdrop",
  });

  assert(mapped, "Sparse payload should map");
  assert(mapped?.projectName === "Example Airdrop", "projectName should fall back to title");
  assert(Array.isArray(mapped?.tags), "tags should default to an array");
  assert(Array.isArray(mapped?.requirements), "requirements should default to an array");
  assert(Array.isArray(mapped?.rewards), "rewards should default to an array");
  assert(mapped?.description?.about === "", "description.about should default to empty string");
}

function runDateStatusCheck(): void {
  const upcoming = mapParserActivityToCryptoActivity({
    _id: "parser-upcoming",
    source: "airdrops_io",
    title: "Upcoming Activity",
    startDate: isoDate(1),
    endDate: isoDate(5),
    status: "LIVE",
  });
  const ended = mapParserActivityToCryptoActivity({
    _id: "parser-ended",
    source: "airdrops_io",
    title: "Ended Activity",
    startDate: isoDate(-5),
    endDate: isoDate(-1),
    status: "LIVE",
  });

  assert(upcoming?.status === "Upcoming", "future start date should resolve to Upcoming");
  assert(ended?.status === "Ended", "past end date should resolve to Ended");
}

runFullPayloadCheck();
runSparsePayloadCheck();
runDateStatusCheck();

console.log("crypto-activities mapper self-test: OK");
