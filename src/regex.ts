export const fuzzyRgx = /^#, fuzzy/;
export const msgctxtStartRgx = regexWithKey("msgctxt");
export const msgidStartRgx = regexWithKey("msgid");
export const msgidPluralStartRgx = regexWithKey("msgid_plural");
export const msgstrStartRgx = regexWithKey("msgstr");
export const msgstrPluralStartRgx = regexWithKey("msgstr\\[\\d+\\]");
export const continuationLineRgx = /^"(.*?)\s*"$/;

function regexWithKey(key: string) {
  return new RegExp(`^${key}\\s+"(.*?)"\\s*$`);
}
