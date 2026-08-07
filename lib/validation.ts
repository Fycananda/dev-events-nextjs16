import { z } from "zod";

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters"),
  overview: z
    .string()
    .trim()
    .min(1, "Overview is required")
    .max(500, "Overview cannot exceed 500 characters"),
  image: z.url("Image must be valid URL").trim(),
  venue: z.string().trim().min(1, "Venue is required"),
  location: z.string().trim().min(1, "Location is required"),
  date: z.string().trim().min(1, "Date is required"),
  time: z.string().trim().min(1, "Time is required"),
  mode: z.enum(["online", "offline", "hybrid"], {
    error: "Mode must be either online, offline, or hybrid",
  }),
  audience: z.string().trim().min(1, "Audience is required"),
  organizer: z.string().trim().min(1, "Organizer is required"),
  agenda: z
    .string()
    .trim()
    .min(1, "Agenda is required")
    .transform((val) =>
      val
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length > 0, "At least one agenda item is required"),
  tags: z
    .string()
    .trim()
    .min(1, "Tag is required")
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length > 0, "At least one tag is required"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
