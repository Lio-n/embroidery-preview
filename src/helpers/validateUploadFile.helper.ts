export const validateFile = (file: File | null) => {
  if (!file) return;
  const allowedExtensions = [".jef", ".dst", ".exp", ".xxx", ".pes"];
  const extension = file.name.toLowerCase().split(".").pop();

  if (!allowedExtensions.includes(`.${extension}`)) {
    alert(
      "Invalid file format. Please upload a JEF, DST, EXP, XXX or PES file."
    );
    return;
  }

  if (file.size > 1024 * 1024) {
    alert("File size exceeds 1MB limit.");
    return;
  }

  return true;
};
