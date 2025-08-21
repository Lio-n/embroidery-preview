import { object, string, type output } from "zod";

export const formSchema = object({
  file_name: string()
    .min(2, {
      message: "File name must be at least 2 characters.",
    })
    .max(20, {
      message: "File name cannot exceed 20 characters.",
    }),
  select_format: string(),
});
export type TypeFormSchema = output<typeof formSchema>;
