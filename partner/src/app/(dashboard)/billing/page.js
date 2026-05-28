"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function BillingPage() {
  const { locale, t } = usePartnerLanguage();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadReports() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/partner/billing", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));

        if (!isCurrent) return;

        if (!response.ok) {
          setReports([]);
          setError(result.error || t("billing.loadError"));
          return;
        }

        setReports(Array.isArray(result.data) ? result.data : []);
      } catch {
        if (!isCurrent) return;
        setReports([]);
        setError(t("billing.connectError"));
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isCurrent = false;
    };
  }, [t]);

  const totals = useMemo(
    () =>
      reports.reduce(
        (current, report) => ({
          revenue: current.revenue + toNumber(report.revenue_share_amount),
          free: current.free + toNumber(report.total_free_views),
          paid: current.paid + toNumber(report.total_paid_views),
          adjusted: current.adjusted + toNumber(report.adjusted_views),
        }),
        { revenue: 0, free: 0, paid: 0, adjusted: 0 },
      ),
    [reports],
  );

  return (
    <>
      <header className="content-header partner-billing-header">
        <div>
          <p className="section-label">Klickshot Partner</p>
          <h1>{t("billing.title")}</h1>
          <p>{t("billing.copy")}</p>
        </div>
      </header>

      <section className="partner-billing-summary">
        <span>
          <small>{t("billing.sentReports")}</small>
          <strong>{formatNumber(reports.length, locale)}</strong>
        </span>
        <span>
          <small>{t("billing.totalRevenue")}</small>
          <strong>{formatMoney(totals.revenue, locale)}</strong>
        </span>
        <span>
          <small>{t("billing.freeEpisodeViews")}</small>
          <strong>{formatNumber(totals.free, locale)}</strong>
        </span>
        <span>
          <small>{t("billing.paidEpisodeViews")}</small>
          <strong>{formatNumber(totals.paid, locale)}</strong>
        </span>
      </section>

      {error ? <p className="partner-billing-error">{error}</p> : null}

      <section className="partner-billing-list" aria-busy={isLoading}>
        {isLoading ? (
          <div className="partner-billing-state">{t("billing.loading")}</div>
        ) : reports.length === 0 ? (
          <div className="partner-billing-state">{t("billing.empty")}</div>
        ) : (
          reports.map((report) => (
            <article className="partner-billing-card" key={report.report_id}>
              <div className="partner-billing-card-main">
                <div>
                  <p className="partner-billing-period">
                    {formatDate(report.start_date, locale)} - {formatDate(report.end_date, locale)}
                  </p>
                  <h2>{report.report_name}</h2>
                  <span>{t("billing.sentOn", { date: report.sent_at ? new Date(report.sent_at).toLocaleDateString(locale) : "-" })}</span>
                </div>
                <Link href={`/billing/${report.report_id}`}>
                  {t("billing.viewDetails")}
                </Link>
              </div>

              <div className="partner-billing-metrics">
                <span>
                  <small>{t("billing.revenueReceived")}</small>
                  <strong>{formatMoney(report.revenue_share_amount, locale)}</strong>
                </span>
                <span>
                  <small>{t("billing.freeEpisodes")}</small>
                  <strong>{formatNumber(report.total_free_views, locale)}</strong>
                </span>
                <span>
                  <small>{t("billing.paidEpisodes")}</small>
                  <strong>{formatNumber(report.total_paid_views, locale)}</strong>
                </span>
                <span>
                  <small>{t("billing.adjustedViews")}</small>
                  <strong>{formatNumber(report.adjusted_views, locale, 1)}</strong>
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
