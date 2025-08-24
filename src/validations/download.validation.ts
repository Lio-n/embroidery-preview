import { z } from "zod";

const ExportFormatEnum = z.enum(["svg", "png", "jpg", "webp"]);
export type ExportFormat = z.infer<typeof ExportFormatEnum>;

export const formSchema = z.object({
  file_name: z
    .string()
    .trim()
    .min(2, {
      message: "File name must be at least 2 characters.",
    })
    .max(20, {
      message: "File name cannot exceed 20 characters.",
    })
    .regex(/^[a-zA-Z0-9_\-\s]+$/, {
      message: "Only letters, numbers, hyphens, underscores, and spaces are allowed.",
    }),
  select_format: ExportFormatEnum,
});

export type TypeFormSchema = z.output<typeof formSchema>;
