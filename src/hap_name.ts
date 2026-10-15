/**
 * HAP-NodeJS 2.2 `checkName` (Homebridge 2.4): a name must start and end with
 * a letter or number; the middle may hold letters, numbers, space separators
 * and ’ ' & ! . _ : ; ( ) / , -. Anything else logs "has an invalid 'Name'
 * characteristic" for every accessory and service carrying it (#40).
 */
export const HAP_NAME_PATTERN =
  /^[\p{L}\p{N}][\p{L}\p{N}\p{Zs}\u2019'&!._:;()/,-]*[\p{L}\p{N}]$/u;

/** Characteristic.Name maxLen. HAP cuts longer values mid-word. */
export const HAP_NAME_MAX_LENGTH = 64;

/**
 * A HomeKit-safe name: `base`, cleaned, then ` suffix`.
 *
 * A name that is already valid comes back unchanged, so no existing accessory
 * is renamed. Otherwise "+" reads as " Plus " ("Q5 Max+" -> "Q5 Max Plus"),
 * any other unsupported character becomes a space, whitespace collapses, the
 * base is cut so the suffix always fits in 64, and both ends are trimmed to a
 * letter, number or combining mark. Combining marks are kept: dropping them
 * would turn a Hindi or Thai word into a different word to silence a warning.
 * Fewer than two characters left means `fallback` is used instead.
 */
export function hapName(base: unknown, fallback: string, suffix = ""): string {
  const tail = suffix ? ` ${suffix}` : "";
  const budget = HAP_NAME_MAX_LENGTH - tail.length;
  const text = typeof base === "string" ? base.normalize("NFC") : "";

  if (text.length <= budget && HAP_NAME_PATTERN.test(text)) {
    return text + tail;
  }

  const spaced = text
    .replace(/\+/g, " Plus ")
    .replace(/[\uFE00-\uFE0F]/g, "")
    .replace(/[^\p{L}\p{Mn}\p{Mc}\p{N}\p{Zs}\u2019'&!._:;()/,-]+/gu, " ")
    .replace(/\s+/gu, " ");

  let cut = "";
  for (const character of spaced) {
    if (cut.length + character.length > budget) break;
    cut += character;
  }

  const cleaned = cut.replace(
    /^[^\p{L}\p{N}]+|[^\p{L}\p{Mn}\p{Mc}\p{N}]+$/gu,
    ""
  );
  return ([...cleaned].length >= 2 ? cleaned : fallback) + tail;
}
