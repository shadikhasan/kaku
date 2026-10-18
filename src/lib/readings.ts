// Bengali pronunciation aids are paired with Hepburn romaji in every UI language.
// These are approximate sound guides; Japanese audio remains the pronunciation reference.
export const banglaReadings: Record<string, string> = {
  a: "আ",
  i: "ই",
  u: "উ",
  e: "এ",
  o: "ও",
  ka: "কা",
  ki: "কি",
  ku: "কু",
  ke: "কে",
  ko: "কো",
  sa: "সা",
  shi: "শি",
  su: "সু",
  se: "সে",
  so: "সো",
  ta: "তা",
  chi: "চি",
  tsu: "ৎসু",
  te: "তে",
  to: "তো",
  na: "না",
  ni: "নি",
  nu: "নু",
  ne: "নে",
  no: "নো",
  ha: "হা",
  hi: "হি",
  fu: "ফু",
  he: "হে",
  ho: "হো",
  ma: "মা",
  mi: "মি",
  mu: "মু",
  me: "মে",
  mo: "মো",
  ya: "ইয়া",
  yu: "ইউ",
  yo: "ইয়ো",
  ra: "রা",
  ri: "রি",
  ru: "রু",
  re: "রে",
  ro: "রো",
  wa: "ওয়া",
  wo: "ও",
  n: "ন্",
};

export function displayReading(romaji: string): string {
  const bangla = banglaReadings[romaji];
  return bangla ? `${bangla} (${romaji})` : romaji;
}

export function matchesReading(
  symbol: string,
  romaji: string,
  query: string,
): boolean {
  const normalized = query.normalize("NFC").toLowerCase().trim();
  return `${symbol} ${displayReading(romaji)}`
    .normalize("NFC")
    .toLowerCase()
    .includes(normalized);
}
