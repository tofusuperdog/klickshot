"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePartnerLanguage } from "@/components/PartnerLanguageProvider";

const rangeOptions = [7, 14, 30];

const lineSeries = [
  { key: "platform_views", labelKey: "dashboard.allPartners", color: "#7dd3fc" },
  { key: "partner_views", labelKey: "dashboard.thisPartner", color: "#a7ffd9" },
  { key: "partner_free_views", labelKey: "common.free", color: "#34d399" },
  { key: "partner_paid_views", labelKey: "common.paid", color: "#ffd36c" },
];

function formatDateLabel(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

function toNumber(value) {
  return Number(value || 0);
}

function buildChartRows(rows) {
  return rows.map((row) => ({
    date: formatDateLabel(row.view_date),
    view_date: row.view_date,
    platform_views: toNumber(row.platform_views),
    partner_views: toNumber(row.partner_views),
    partner_free_views: toNumber(row.partner_free_views),
    partner_paid_views: toNumber(row.partner_paid_views),
  }));
}

function sumRows(rows, key) {
  return rows.reduce((sum, row) => sum + toNumber(row[key]), 0);
}

function CustomTooltip({ active, payload, label, locale, t }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="partner-chart-tooltip">
      <p>{t("dashboard.tooltipDate", { date: label })}</p>
      <div>
        {payload.map((item) => (
          <span key={item.dataKey}>
            <i style={{ backgroundColor: item.color }} />
            <small>{item.name}</small>
            <strong>{Number(item.value).toLocaleString(locale)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PartnerDashboardChart() {
  const { locale, t } = usePartnerLanguage();
  const [dateRange, setDateRange] = useState(7);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadRows() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/partner/dashboard-streaming?days=${dateRange}`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!isCurrent) return;

        if (!response.ok) {
          setRows([]);
          setError(data.error || t("dashboard.chartLoadError"));
          return;
        }

        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!isCurrent) return;
        setRows([]);
        setError(t("dashboard.chartConnectError"));
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      isCurrent = false;
    };
  }, [dateRange, t]);

  const chartRows = useMemo(() => buildChartRows(rows), [rows]);
  const summary = useMemo(
    () => ({
      platform: sumRows(rows, "platform_views"),
      partner: sumRows(rows, "partner_views"),
      free: sumRows(rows, "partner_free_views"),
      paid: sumRows(rows, "partner_paid_views"),
    }),
    [rows],
  );

  return (
    <>
      <header className="content-header partner-dashboard-header">
        <div>
          <p className="section-label">Klickshot Partner</p>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.copy")}</p>
        </div>
      </header>

      <section className="partner-summary-grid" aria-label={t("dashboard.summaryLabel")}>
        <article>
          <span>{t("dashboard.allPartners")}</span>
          <small>{t("dashboard.totalViews")}</small>
          <strong>{summary.platform.toLocaleString(locale)}</strong>
        </article>
        <article>
          <span>{t("dashboard.thisPartner")}</span>
          <small>{t("dashboard.freePaid")}</small>
          <strong>{summary.partner.toLocaleString(locale)}</strong>
        </article>
        <article>
          <span>{t("common.free")}</span>
          <small>{t("dashboard.ofThisPartner")}</small>
          <strong>{summary.free.toLocaleString(locale)}</strong>
        </article>
        <article>
          <span>{t("common.paid")}</span>
          <small>{t("dashboard.ofThisPartner")}</small>
          <strong>{summary.paid.toLocaleString(locale)}</strong>
        </article>
      </section>

      <section className="partner-chart-panel">
        <div className="partner-chart-head">
          <div>
            <p className="section-label">{t("dashboard.graphKicker")}</p>
            <h2>{t("dashboard.graphTitle")}</h2>
          </div>
          <select
            value={dateRange}
            onChange={(event) => setDateRange(Number(event.target.value))}
            aria-label={t("dashboard.dateRange")}
          >
            {rangeOptions.map((option) => (
              <option key={option} value={option}>
                {t("common.days", { count: option })}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="partner-chart-error">{error}</p> : null}

        <div className="partner-chart-wrap" aria-busy={isLoading}>
          {isLoading ? (
            <div className="partner-chart-state">{t("common.loading")}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ top: 8, right: 18, left: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,255,217,0.12)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(228,242,237,0.58)"
                  tick={{ fill: "rgba(228,242,237,0.68)", fontSize: 12 }}
                  interval={dateRange > 14 ? 3 : 0}
                />
                <YAxis
                  stroke="rgba(228,242,237,0.58)"
                  tick={{ fill: "rgba(228,242,237,0.68)", fontSize: 12 }}
                  width={64}
                  label={{
                    value: t("dashboard.yAxisEpisodes"),
                    angle: -90,
                    position: "insideLeft",
                    fill: "rgba(228,242,237,0.68)",
                    fontSize: 12,
                  }}
                />
                <Tooltip content={<CustomTooltip locale={locale} t={t} />} />
                <Legend
                  iconType="plainline"
                  wrapperStyle={{ color: "rgba(228,242,237,0.72)", fontSize: 12, paddingTop: 10 }}
                />
                {lineSeries.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    name={t(series.labelKey)}
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={3}
                    dot={dateRange <= 14 ? { r: 3.5, strokeWidth: 2, fill: "#051512" } : false}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </>
  );
}
