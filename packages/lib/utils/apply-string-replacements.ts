export const applyStringReplacements = (
  text: string,
  replacements: { original: string; replacement: string }[],
): string => {
  let result = text;
  for (const { original, replacement } of replacements) {
    if (!original) continue;
    // Use a global regex for replacement
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOriginal, 'g');
    result = result.replace(regex, replacement);
  }
  return result;
};
