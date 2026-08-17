export default (path: string): string => {
  const types = [
    {
      key: "crypto",
      value: "project",
    },
    {
      key: "gemslab",
      value: "gemslab",
    },
    {
      key: "earlyland",
      value: "earlyland",
    },
    {
      key: "compendium",
      value: "compendium",
    },
    {
      key: "nfts",
      value: "nfts",
    },
  ];

  const projectType: { key: string; value: string } | undefined = types.find(
    (type: { key: string; value: string }) => type.key === path
  );

  return projectType?.value || "";
};
