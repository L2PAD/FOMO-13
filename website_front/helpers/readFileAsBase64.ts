export const readFileAsBase64 = (file: File | undefined): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) return "";

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result?.toString() || "");
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
};
