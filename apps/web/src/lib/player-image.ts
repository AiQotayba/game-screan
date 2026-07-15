import { getApiBase } from "./api-client";

const PLACEHOLDER = "#";

export function resolvePlayerImageSrc(image: string | undefined | null): string | null {
  const trimmed = image?.trim() ?? "";
  if (!trimmed || trimmed === PLACEHOLDER) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${getApiBase()}${trimmed}`;
  }
  return trimmed;
}

export function isValidPlayerImage(image: string | undefined | null): boolean {
  return resolvePlayerImageSrc(image) !== null;
}
