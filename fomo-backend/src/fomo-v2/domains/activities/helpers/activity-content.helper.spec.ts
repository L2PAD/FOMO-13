import {
  mergeActivitySourceContent,
  sanitizeActivityContent,
  sanitizeActivityHtml,
} from "./activity-content.helper";

describe("FOMO v2 activity content helpers", () => {
  it("removes executable HTML and unsafe URL protocols", () => {
    const html = sanitizeActivityHtml(
      '<p onclick="alert(1)">Safe <strong>text</strong></p>' +
        '<script>alert(1)</script><a href="javascript:alert(1)">bad</a>',
    );

    expect(html).toContain("<strong>text</strong>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
  });

  it("sanitizes every rich activity field before persistence", () => {
    const content = sanitizeActivityContent({
      name: "Demo",
      activityType: "airdrop",
      joinLink: "javascript:alert(1)",
      description: { aboutHtml: "<p>About</p><iframe src='x'></iframe>" },
      review: { textHtml: "<img src='javascript:x'>" },
      taskGuide: {
        descriptionHtml: "<p>Guide</p>",
        steps: [
          {
            title: "Step",
            ctaUrl: "https://example.com/task",
            descriptionHtml: "<svg onload='x'></svg><b>Do it</b>",
          },
        ],
      },
    });

    expect(content.joinLink).toBeUndefined();
    expect(content.description?.aboutHtml).toBe("<p>About</p>");
    expect(content.review?.textHtml).not.toContain("javascript:");
    expect(content.taskGuide?.steps?.[0].descriptionHtml).toBe("<b>Do it</b>");
    expect(content.taskGuide?.steps?.[0].ctaUrl).toBe(
      "https://example.com/task",
    );
  });

  it("bounds rich content and task-guide steps before storage", () => {
    const content = sanitizeActivityContent({
      description: { aboutHtml: "a".repeat(200_001) },
      taskGuide: {
        steps: Array.from({ length: 101 }, (_, index) => ({
          id: String(index),
          title: `Step ${index}`,
          descriptionHtml:
            index === 0 ? "b".repeat(100_001) : "<p>Short step</p>",
        })),
      },
    });

    expect(content.description?.aboutHtml).toHaveLength(200_000);
    expect(content.taskGuide?.steps).toHaveLength(100);
    expect(content.taskGuide?.steps?.[0].descriptionHtml).toHaveLength(100_000);
    expect(content.taskGuide?.steps?.at(-1)?.id).toBe("99");
  });

  it("does not overwrite manual field paths during another ingest", () => {
    const merged = mergeActivitySourceContent(
      {
        name: "Manual name",
        description: { about: "Manual about", howToParticipate: "Old guide" },
      },
      {
        name: "Parser name",
        description: { about: "Parser about", howToParticipate: "New guide" },
      },
      ["name", "description.about"],
    );

    expect(merged).toMatchObject({
      name: "Manual name",
      description: { about: "Manual about", howToParticipate: "New guide" },
    });
  });

  it("keeps sparse editorial patches sparse instead of materializing empty arrays", () => {
    const content = sanitizeActivityContent({
      review: { text: "Only this field was proposed" },
    });

    expect(content).toEqual({
      review: { text: "Only this field was proposed" },
    });
    expect(content).not.toHaveProperty("links");
    expect(content).not.toHaveProperty("investors");
    expect(content).not.toHaveProperty("tags");
  });
});
