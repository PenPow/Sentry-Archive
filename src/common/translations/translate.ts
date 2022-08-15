import english from "./data/en-GB.js";

const languages: Record<string, Language> = {
	english,
};

export default languages;

export type Language = Record<
string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
string | string[] | ((...args: any[]) => string)
>;

export function getLang(locale: Locale): Language {
	switch (locale) {
	  case "en-GB":
	  case "en-US":
	  default:
			return languages.english;
	}
}

export const keys = Object.keys(languages.english).length;

export function translate<K extends translationKeys>(
	lang: Locale,
	key: K,
	...params: getArgs<K>
): string {
	const language = getLang(lang);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let value: string | ((...any: any[]) => string) | string[] = language[key];

	if (!value) {
	  if (!["en-GB", "en-US"].includes(lang)) {
			value = languages.english[key];
	  }

	  if (!value) value = key;
	}

	if (Array.isArray(value)) return value.join("\n");

	if (typeof value === "function") return value(...(params));

	return value;
}

export type translationKeys = keyof typeof english;
type getArgs<K extends translationKeys> = typeof english[K] extends
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(...any: any[]) => unknown ? Parameters<typeof english[K]>
	: [];

export type Locale =
  | "da"
  | "de"
  | "en-GB"
  | "en-US"
  | "es-ES"
  | "fr"
  | "hr"
  | "it"
  | "lt"
  | "hu"
  | "nl"
  | "no"
  | "pl"
  | "pt-BR"
  | "ro"
  | "fi"
  | "sv-SE"
  | "vi"
  | "tr"
  | "cs"
  | "el"
  | "bg"
  | "ru"
  | "uk"
  | "hi"
  | "th"
  | "zh-CN"
  | "ja"
  | "zh-TW"
  | "ko"; // REF: https://discord.com/developers/docs/reference#locales
