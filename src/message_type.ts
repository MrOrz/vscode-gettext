export type Message = {
  msgid: string;
  msgidLine: number;
  msgidPlural: string;
  msgidPluralLine: number;
  msgstr: string;
  msgstrLine: number;
  msgstrPlural: string[];
  msgstrPluralLine: number[];
  msgctxt: string;
  msgctxtLine: number;
  firstline: number;
  lastline: number;
  isfuzzy: boolean;
};
