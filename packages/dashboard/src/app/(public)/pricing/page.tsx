import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import PricingContent from "./pricing-content";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    titleZh: "價格方案 - 免費開始，隨需擴展",
    titleEn: "Pricing - Start Free, Scale as You Grow",
    descriptionZh:
      "BugSpark 提供免費方案、入門方案和團隊方案。以 HK$ 計價，適合香港及亞太區開發團隊。沒有隱藏費用，隨時取消。",
    descriptionEn:
      "BugSpark offers Free, Starter and Team plans. Start free with 50 reports/month. No hidden fees, cancel anytime.",
    path: "/pricing",
  });
}

async function getFaqJsonLd() {
  const locale = await getLocale();
  const isZh = locale === "zh-HK";
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: isZh ? "BugSpark 可以免費使用嗎？" : "Is BugSpark free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "可以！免費方案包含每月 50 則回報、螢幕截圖擷取和主控台日誌 — 非常適合副業專案和個人開發者。"
            : "Yes! The free plan includes 50 reports per month, screenshot capture, and console logs — perfect for side projects and individual developers.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "可以自行託管 BugSpark 嗎？" : "Can I self-host BugSpark?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "當然可以。BugSpark 是開源軟體，可以在您自己的基礎設施上自行託管，不限專案、使用者和回報數量。"
            : "Absolutely. BugSpark is open-source and can be self-hosted on your own infrastructure with unlimited projects, users, and reports.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "你們接受哪些付款方式？" : "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "我們接受所有主要信用卡、PayPal，以及企業年付方案的銀行轉帳。"
            : "We accept all major credit cards, PayPal, and bank transfers for annual Enterprise plans.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "可以隨時升級或降級嗎？" : "Can I upgrade or downgrade anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "可以。您可以隨時更改方案。升級立即生效，降級在下一個計費週期生效。"
            : "Yes. You can change your plan at any time. Upgrades take effect immediately and downgrades apply at the next billing cycle.",
        },
      },
      {
        "@type": "Question",
        name: isZh ? "付費方案有免費試用嗎？" : "Is there a free trial for paid plans?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isZh
            ? "有 — 入門方案和團隊方案都包含 14 天免費試用，無需信用卡即可開始。"
            : "Yes — both Starter and Team plans include a 14-day free trial. No credit card required to start.",
        },
      },
    ],
  };
}

export default async function PricingPage() {
  const faqJsonLd = await getFaqJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PricingContent />
    </>
  );
}
