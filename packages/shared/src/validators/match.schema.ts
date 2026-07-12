import { z } from "zod";
import { ROUND_VALUES, SEGMENT_VALUES } from "../types/match";

const playerCardSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  rank: z.number().int(),
  misses: z.number().int().min(0).max(3).default(0),
  passActive: z.boolean().default(false),
});

const playerPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    image: z.string().min(1).optional(),
    rank: z.number().int().optional(),
    misses: z.number().int().min(0).max(3).optional(),
    passActive: z.boolean().optional(),
  })
  .strict();

export const createMatchSchema = z
  .object({
    playerA: playerCardSchema.extend({ rank: z.literal(0) }),
    playerB: playerCardSchema.extend({ rank: z.literal(0) }),
    round: z.enum(ROUND_VALUES),
    segment: z.enum(SEGMENT_VALUES),
    isFinal: z.boolean(),
    timer: z.number().int().positive().nullable().optional(),
    question: z.string().nullable().optional(),
  })
  .strict();

export const patchMatchBodySchema = z
  .object({
    id: z.string().min(1),
    data: z
      .object({
        playerA: playerPatchSchema.optional(),
        playerB: playerPatchSchema.optional(),
        round: z.enum(ROUND_VALUES).optional(),
        segment: z.enum(SEGMENT_VALUES).optional(),
        timer: z.number().int().positive().nullable().optional(),
        isFinal: z.boolean().optional(),
        status: z.enum(["SETUP", "FINISHED"]).optional(),
        question: z.string().nullable().optional(),
      })
      .strict(),
  })
  .strict();

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type PatchMatchInput = z.infer<typeof patchMatchBodySchema>;
