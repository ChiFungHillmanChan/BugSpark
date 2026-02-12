import type { Metadata } from "next";
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "BugSpark 可以免費使用嗎？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "可以！免費方案包含每月 50 則回報、螢幕截圖擷取和主控台日誌 — 非常適合副業專案和個人開發者。",
      },
    },
    {
      "@type": "Question",
      name: "可以自行託管 BugSpark 嗎？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "當然可以。BugSpark 是開源軟體，可以在您自己的基礎設施上自行託管，不限專案、使用者和回報數量。",
      },
    },
    {
      "@type": "Question",
      name: "你們接受哪些付款方式？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "我們接受所有主要信用卡、PayPal，以及企業年付方案的銀行轉帳。",
      },
    },
    {
      "@type": "Question",
      name: "可以隨時升級或降級嗎？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "可以。您可以隨時更改方案。升級立即生效，降級在下一個計費週期生效。",
      },
    },
    {
      "@type": "Question",
      name: "付費方案有免費試用嗎？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "有 — 入門方案和團隊方案都包含 14 天免費試用，無需信用卡即可開始。",
      },
    },
  ],
};

export default function PricingPage() {
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
