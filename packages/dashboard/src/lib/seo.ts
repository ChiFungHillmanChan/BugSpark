import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { BUGSPARK_DASHBOARD_URL } from "./constants";

const BASE_URL = BUGSPARK_DASHBOARD_URL;

export async function generatePageMetadata(opts: {
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  path: string;
}): Promise<Metadata> {
  const locale = await getLocale();
  const isZh = locale === "zh-HK";

  return {
    title: isZh ? opts.titleZh : opts.titleEn,
    description: isZh ? opts.descriptionZh : opts.descriptionEn,
    alternates: {
      canonical: `${BASE_URL}${opts.path}`,
      languages: { "zh-HK": opts.path, en: opts.path },
    },
    openGraph: {
      title: isZh ? opts.titleZh : opts.titleEn,
      description: isZh ? opts.descriptionZh : opts.descriptionEn,
      url: `${BASE_URL}${opts.path}`,
      locale: isZh ? "zh_HK" : "en_US",
      alternateLocale: isZh ? "en_US" : "zh_HK",
    },
  };
}
