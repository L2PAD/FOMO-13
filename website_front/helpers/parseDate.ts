export default (date: any): any => {
  return new Date(date.split(".").reverse().join("-"));
};
