export default (followersCount: number): string => {
  if (followersCount < 1000) {
    return String(followersCount);
  }

  if (followersCount > 100000 && followersCount < 1000000) {
    if (followersCount % 1000 === 0) {
      return `${String(followersCount / 1000)}k`;
    } else {
      return `${String(followersCount / 1000).split(".")[0]}k`;
    }
  }

  if (followersCount % 1000 === 0) {
    return `${String(followersCount / 1000000)}m`;
  } else {
    return `${String(followersCount / 1000000).split(".")[0]}.${
      String(followersCount / 1000000)
        .split(".")[1]
        .split("")[0]
    }M`;
  }
};
