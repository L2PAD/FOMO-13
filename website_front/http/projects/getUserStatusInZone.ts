export const zones = {
  0: "red-status",
  1: "green-status",
  2: "yellow-status",
};

export default (index: any): any => {
  // @ts-ignore
  return zones[index] || "red";
};
