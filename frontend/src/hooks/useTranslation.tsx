import { useState, useEffect } from "react";
import tr from "../locales/tr";
import en from "../locales/en";

const languages = {
  tr,
  en,
};

type Language = keyof typeof languages;
type TranslationKey = keyof typeof tr;

export default function useTranslation() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "tr";
  });

  useEffect(() => {
    localStorage.setItem("language", lang);
  }, [lang]);

  const t = (key: TranslationKey) => {
    return languages[lang][key] || key;
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
  };

  return { t, lang, changeLanguage };
}
