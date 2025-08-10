export const validateFile = (file: File | null) => {
  if (!file) return;
  const allowedExtensions = [".jef", ".dst", ".exp"];
  const extension = file.name.toLowerCase().split(".").pop();

  if (!allowedExtensions.includes(`.${extension}`)) {
    alert("Invalid file format. Please upload a JEF or DST file.");
    return;
  }

  if (file.size > 1024 * 1024) {
    alert("File size exceeds 1MB limit.");
    return;
  }

  return true;
};
