import { z } from "zod";
import { DownloadFormSchema } from "./download.validation";
import { FORMAT_EMBROIDERY } from "@/types/embroidery.types";

const ConversionFormatEnum = z.enum(FORMAT_EMBROIDERY);
export type ConversionFormat = z.infer<typeof ConversionFormatEnum>;

const MAX_FILE_SIZE = 1000000; // 1MB
const ACCEPTED_EMB_TYPES = Object.values(FORMAT_EMBROIDERY) as string[];

export const ConversionFormSchema = DownloadFormSchema.pick({ file_name: true }).and(
  z.object({
    file: z
      .instanceof(File, { message: "Please select an file." })
      .refine((file) => file, {
        message: "File is empty.",
      })
      .refine((file) => file.size > 0, {
        message: "File is empty.",
      })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: `Max size is 1MB.`,
      })
      .refine((file) => ACCEPTED_EMB_TYPES.includes(file.name.split(".").pop()?.toLocaleUpperCase() + ""), {
        message: "Only .dst formats are supported.",
      }),
    select_format: ConversionFormatEnum,
  })
);

export type TypeConversionFormSchema = z.output<typeof ConversionFormSchema>;
