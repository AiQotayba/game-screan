import { promises as fs } from "node:fs";
import path from "node:path";
import type { Match } from "@game-screan/shared";

export type AppStateFile = {
  matches: Match[];
  activeMatchId: string | null;
};

const filePath =
  process.env.DATA_FILE ??
  path.join(process.cwd(), "data", "app-state.json");

let chain: Promise<void> = Promise.resolve();

export async function readAppState(): Promise<AppStateFile> {
  try {
    const text = await fs.readFile(filePath, "utf-8");
    return JSON.parse(text) as AppStateFile;
  } catch {
    return { matches: [], activeMatchId: null };
  }
}

async function writeAppState(state: AppStateFile): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

export async function withAppState<T>(
  fn: (state: AppStateFile) => Promise<{ next: AppStateFile; result: T }>,
): Promise<T> {
  const job = chain.then(async () => {
    const current = await readAppState();
    const { next, result } = await fn(current);
    await writeAppState(next);
    return result;
  });

  chain = job.then(
    () => undefined,
    () => undefined,
  );

  return job;
}
