"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePartnerLanguage } from "@/components/PartnerLanguageProvider";

function toNumber(value) {
  return Number(value || 0);
}

function formatNumber(value, locale, digits = 0) {
  return toNumber(value).toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(value, locale) {
  return toNumber(value).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value, locale) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSeriesDetails(report) {
  const details = report?.series_details;

  if (Array.isArray(details)) return details;

  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getLocalizedSeriesTitle(series, language, fallback) {
  const titleTh = series.title_th || series.series_title_th || series.series_title;
  const titleEn = series.title_en || series.series_title_en || series.series_title;
  const titleCn = series.title_cn || series.series_title_cn || series.series_title;

  if (language === "en") {
    return titleEn || titleTh || titleCn || fallback;
  }

  if (language === "zh") {
    return titleCn || titleTh || titleEn || fallback;
  }

  return titleTh || titleEn || titleCn || fallback;
}

export default function BillingDetailPage() {
  const params = useParams();
  const reportId = params?.reportId;
  const { language, locale, t } = usePartnerLanguage();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reportId) return undefined;

    let isCurrent = true;

    async function loadReport() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/partner/billing?reportId=${encodeURIComponent(reportId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));

        if (!isCurrent) return;

        if (!response.ok || !result.data) {
          setReport(null);
          setError(result.error || t("billing.detailLoadError"));
          return;
        }

        setReport(result.data);
      } catch {
        if (!isCurrent) return;
        setReport(null);
        setError(t("billing.detailConnectError"));
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      isCurrent = false;
    };
  }, [reportId, t]);

  const seriesDetails = useMemo(() => getSeriesDetails(report), [report]);

  return (
    <>
      <header className="content-header partner-billing-header">
        <div>
          <p className="section-label">{t("billing.detailKicker")}</p>
          <h1>{report?.report_name || t("billing.detailTitle")}</h1>
          <p>
            {report
              ? `${formatDate(report.start_date, locale)} - ${formatDate(report.end_date, locale)}`
              : t("billing.detailCopy")}
          </p>
        </div>
        <Link className="partner-billing-back-link" href="/billing">
          {t("billing.backToBilling")}
        </Link>
      </header>

      {error ? <p className="partner-billing-error">{error}</p> : null}

      {isLoading ? (
        <div className="partner-billing-state">{t("billing.detailLoading")}</div>
      ) : !report ? (
        <div className="partner-billing-state">{t("billing.detailNotFound")}</div>
      ) : (
        <>
          <section className="partner-billing-detail-summary">
            <span>
              <small>{t("billing.revenueReceived")}</small>
              <strong>{formatMoney(report.revenue_share_amount, locale)}</strong>
            </span>
            <span>
              <small>{t("billing.freeEpisodeViews")}</small>
              <strong>{formatNumber(report.total_free_views, locale)}</strong>
            </span>
            <span>
              <small>{t("billing.paidEpisodeViews")}</small>
              <strong>{formatNumber(report.total_paid_views, locale)}</strong>
            </span>
            <span>
              <small>{t("billing.adjustedViews")}</small>
              <strong>{formatNumber(report.adjusted_views, locale, 1)}</strong>
            </span>
          </section>

          <section className="partner-billing-detail-page-panel">
            <div className="partner-billing-series-table">
              <div className="partner-billing-series-head">
                <span>{t("billing.series")}</span>
                <span>{t("billing.freeEpisodes")}</span>
                <span>{t("billing.paidEpisodes")}</span>
                <span>{t("billing.adjustedViews")}</span>
                <span>{t("billing.amount")}</span>
              </div>
              {seriesDetails.length === 0 ? (
                <div className="partner-billing-series-empty">
                  {t("billing.emptySeries")}
                </div>
              ) : (
                seriesDetails.map((series, index) => (
                  <div className="partner-billing-series-row" key={`${series.series_title || series.title_th || series.title_en || series.title_cn || "series"}-${index}`}>
                    <span>
                      {getLocalizedSeriesTitle(series, language, t("billing.seriesFallback", { id: index + 1 }))}
                    </span>
                    <span data-label={t("billing.freeEpisodes")}>
                      {formatNumber(series.total_free_views, locale)}
                    </span>
                    <span data-label={t("billing.paidEpisodes")}>
                      {formatNumber(series.total_paid_views, locale)}
                    </span>
                    <span data-label={t("billing.adjustedViews")}>
                      {formatNumber(series.adjusted_views, locale, 1)}
                    </span>
                    <span data-label={t("billing.amount")}>
                      {formatMoney(series.revenue_contribution_amount, locale)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
