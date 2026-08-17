export const splitArray = (arr: Array<any>, chunkSize: number): Array<any> => {
  let result = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
};
