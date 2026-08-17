export default function (interval: string) {
  let today = new Date();

  switch (interval) {
    case "24H":
      today.setHours(today.getHours() - 24);
      break;
    case "7D":
      today.setDate(today.getDate() - 7);
      break;
    case "1M":
      today.setMonth(today.getMonth() - 1);
      break;
    case "3M":
      today.setMonth(today.getMonth() - 3);
      break;
    case "1Y":
      today.setFullYear(today.getFullYear() - 1);
      break;
    default:
      today.setDate(today.getDate() - 7);
  }

  return today;
}
