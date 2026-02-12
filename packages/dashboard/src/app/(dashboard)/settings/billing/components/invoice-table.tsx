"use client";

import { useTranslations } from "next-intl";
import { Download, FileText } from "lucide-react";
import type { InvoiceInfo } from "@/types";

const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  void: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  uncollectible: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const INVOICE_STATUS_KEY_MAP: Record<string, string> = {
  paid: "invoiceStatusPaid",
  open: "invoiceStatusOpen",
  void: "invoiceStatusVoid",
  uncollectible: "invoiceStatusUncollectible",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function formatAmount(amount: number): string {
  return `HK$${(amount / 100).toFixed(0)}`;
}

interface InvoiceTableProps {
  invoices: InvoiceInfo[];
  isLoading: boolean;
}

export function InvoiceTable({ invoices, isLoading }: InvoiceTableProps) {
  const t = useTranslations("billing");

  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t("billingHistory")}</h2>

      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          {t("loadingInvoices")}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("noInvoices")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-navy-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">{t("invoiceDate")}</th>
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">{t("invoiceAmount")}</th>
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">{t("invoiceStatus")}</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">{t("invoiceAction")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const statusStyle = INVOICE_STATUS_STYLES[invoice.status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
                const statusKey = INVOICE_STATUS_KEY_MAP[invoice.status] ?? "invoiceStatusOpen";
                return (
                  <tr key={invoice.id} className="border-b border-gray-100 dark:border-navy-700/50 last:border-0">
                    <td className="py-3 pr-4 text-gray-900 dark:text-white">{formatDate(invoice.date)}</td>
                    <td className="py-3 pr-4 text-gray-900 dark:text-white">{formatAmount(invoice.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                        {t(statusKey)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {invoice.invoicePdf ? (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {t("downloadPdf")}
                        </a>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
