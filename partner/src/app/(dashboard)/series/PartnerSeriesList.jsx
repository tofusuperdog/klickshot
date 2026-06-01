"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePartnerLanguage } from "@/components/PartnerLanguageProvider";

const rangeOptions = [1, 7, 14];
const detailRangeOptions = [1, 7, 14];
const partnerTimeZone = "Asia/Bangkok";

function SeriesMetricIcon({ type }) {
  if (type === "series") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 10h5" />
        <path d="M8 14h8" />
        <path d="M3 9h1" />
        <path d="M3 15h1" />
      </svg>
    );
  }

  if (type === "free") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 12v8H4v-8" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 7v13" />
        <path d="M12 7H8.5a2.5 2.5 0 1 1 2.5-2.5c0 2.5 1 2.5 1 2.5z" />
        <path d="M12 7h3.5A2.5 2.5 0 1 0 13 4.5c0 2.5-1 2.5-1 2.5z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
      <path d="M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      <path d="M5 15v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
    </svg>
  );
}

function toNumber(value) {
  return Number(value || 0);
}

function formatNumber(value, locale) {
  return toNumber(value).toLocaleString(locale);
}

function formatDate(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: partnerTimeZone,
    year: "numeric",
  }).format(value);
}

function formatDateRange(days, locale) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(days - 1, 0));

  if (days === 1) {
    return formatDate(end, locale);
  }

  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}

function getSeriesTitleRows(series, language, t) {
  const titleMap = {
    th: {
      value: series.title_th,
      fallback: t("common.noThaiTitle"),
    },
    en: {
      value: series.title_en,
      fallback: t("common.noEnglishTitle"),
    },
    zh: {
      value: series.title_cn,
      fallback: t("common.noChineseTitle"),
    },
  };
  const orders = {
    th: ["th", "en", "zh"],
    en: ["en", "th", "zh"],
    zh: ["zh", "en", "th"],
  };

  return (orders[language] || orders.th).map((key) => titleMap[key]);
}

function PosterFallback() {
  return (
    <div className="partner-series-poster-fallback" aria-hidden="true">
      <span />
    </div>
  );
}

function buildEpisodeRows(rows) {
  return rows.map((row) => ({
    episode_no: toNumber(row.episode_no),
    label: `EP${row.episode_no}`,
    views: toNumber(row.views),
    is_free: Boolean(row.is_free),
  }));
}

function getFreeAreas(rows) {
  const areas = [];
  let current = null;

  rows.forEach((row) => {
    if (row.is_free && !current) {
      current = { start: row.episode_no, end: row.episode_no };
      return;
    }

    if (row.is_free && current) {
      current.end = row.episode_no;
      return;
    }

    if (!row.is_free && current) {
      areas.push(current);
      current = null;
    }
  });

  if (current) {
    areas.push(current);
  }

  return areas;
}

function DetailTooltip({ active, payload, label, locale, t }) {
  if (!active || !payload?.length) return null;

  const isFree = Boolean(payload[0]?.payload?.is_free);
  const episodeLabel = `EP${label}${isFree ? t("series.freeEpisodeSuffix") : ""}`;

  return (
    <div className="partner-series-detail-tooltip">
      <p>{episodeLabel}</p>
      <span>
        <small>{t("series.episodeThisViews")}</small>
        <strong>{formatNumber(payload[0]?.value, locale)}</strong>
      </span>
    </div>
  );
}

export default function PartnerSeriesList() {
  const { language, locale, t } = usePartnerLanguage();
  const [dateRange, setDateRange] = useState(1);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [detailRange, setDetailRange] = useState(1);
  const [detailRows, setDetailRows] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailView, setDetailView] = useState("table");

  useEffect(() => {
    let isCurrent = true;

    async function loadRows() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/partner/series-overview?days=${dateRange}`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!isCurrent) return;

        if (!response.ok) {
          setRows([]);
          setError(data.error || t("series.loadError"));
          return;
        }

        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!isCurrent) return;
        setRows([]);
        setError(t("series.connectError"));
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

  useEffect(() => {
    if (!selectedSeries) return undefined;

    let isCurrent = true;

    async function loadDetailRows() {
      setIsDetailLoading(true);
      setDetailError("");

      try {
        const params = new URLSearchParams({
          seriesId: String(selectedSeries.series_id),
          days: String(detailRange),
        });
        const response = await fetch(`/api/partner/series-episode-views?${params.toString()}`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!isCurrent) return;

        if (!response.ok) {
          setDetailRows([]);
          setDetailError(data.error || t("series.detailLoadError"));
          return;
        }

        setDetailRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!isCurrent) return;
        setDetailRows([]);
        setDetailError(t("series.detailConnectError"));
      } finally {
        if (isCurrent) {
          setIsDetailLoading(false);
        }
      }
    }

    loadDetailRows();

    return () => {
      isCurrent = false;
    };
  }, [detailRange, selectedSeries, t]);

  function openSeriesDetails(series) {
    setDetailView("table");
    setSelectedSeries(series);
  }

  const summary = useMemo(
    () =>
      rows.reduce(
        (current, row) => ({
          series: current.series + 1,
          total: current.total + toNumber(row.total_views),
          free: current.free + toNumber(row.free_views),
          paid: current.paid + toNumber(row.paid_views),
        }),
        { series: 0, total: 0, free: 0, paid: 0 },
      ),
    [rows],
  );
  const episodeRows = useMemo(() => buildEpisodeRows(detailRows), [detailRows]);
  const freeAreas = useMemo(() => getFreeAreas(episodeRows), [episodeRows]);
  const dateRangeLabel = useMemo(() => formatDateRange(dateRange, locale), [dateRange, locale]);
  const summaryCards = [
    {
      key: "series",
      icon: "series",
      label: t("series.totalSeries"),
      value: summary.series,
    },
    {
      key: "total",
      icon: "total",
      label: t("series.total"),
      value: summary.total,
      suffix: t("dashboard.freePaid"),
    },
    {
      key: "free",
      icon: "free",
      label: t("common.free"),
      value: summary.free,
      suffix: t("dashboard.ofThisPartner"),
    },
    {
      key: "paid",
      icon: "paid",
      label: t("common.paid"),
      value: summary.paid,
      suffix: t("dashboard.ofThisPartner"),
    },
  ];

  return (
    <>
      <header className="content-header partner-series-header">
        <div>
          <p className="section-label">Klickshot Partner</p>
          <h1>{t("series.title")}</h1>
          <p>{t("series.copy")}</p>
        </div>
      </header>

      <section className="partner-series-toolbar">
        <div className="partner-series-range">
          <CalendarIcon />
          <span>
            <strong>{dateRangeLabel}</strong>
          </span>
        </div>

        <div className="partner-series-filter" aria-label={t("series.dateRange")}>
          {rangeOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={dateRange === option ? "active" : ""}
              onClick={() => setDateRange(option)}
            >
              {option === 1 ? t("common.today") : t("common.days", { count: option })}
            </button>
          ))}
        </div>
      </section>

      <section className="partner-series-summary" aria-label={t("series.title")}>
        {summaryCards.map((card) => (
          <span className={`partner-series-summary-card ${card.key}`} key={card.key}>
            <i>
              <SeriesMetricIcon type={card.icon} />
            </i>
            <span>
              <small>{card.label}</small>
              <strong>
                {formatNumber(card.value, locale)}
                {card.suffix ? <em>{card.suffix}</em> : null}
              </strong>
            </span>
          </span>
        ))}
      </section>

      {error ? <p className="partner-series-error">{error}</p> : null}

      <section className="partner-series-list" aria-busy={isLoading}>
        {isLoading ? (
          <div className="partner-series-state">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="partner-series-state">{t("series.empty")}</div>
        ) : (
          rows.map((series, index) => {
            const titleRows = getSeriesTitleRows(series, language, t);

            return (
              <article className="partner-series-card" key={series.series_id}>
                <div className="partner-series-rank">#{index + 1}</div>
                <div className="partner-series-poster">
                  {series.poster_url ? (
                    <img src={series.poster_url} alt={titleRows[0].value || t("common.seriesPoster")} />
                  ) : (
                    <PosterFallback />
                  )}
                </div>

                <div className="partner-series-info">
                  <div>
                    <h2>{titleRows[0].value || titleRows[0].fallback}</h2>
                    <p>{titleRows[1].value || titleRows[1].fallback}</p>
                    <p>{titleRows[2].value || titleRows[2].fallback}</p>
                  </div>
                  <button type="button" onClick={() => openSeriesDetails(series)}>
                    <span>{t("common.details")}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>

                <div className="partner-series-metrics">
                  <span>
                    <small>{t("series.total")}</small>
                    <strong>{formatNumber(series.total_views, locale)}</strong>
                  </span>
                  <span>
                    <small>{t("common.free")}</small>
                    <strong>{formatNumber(series.free_views, locale)}</strong>
                  </span>
                  <span>
                    <small>{t("common.paid")}</small>
                    <strong>{formatNumber(series.paid_views, locale)}</strong>
                  </span>
                </div>
              </article>
            );
          })
        )}
      </section>

      {selectedSeries ? (
        <div
          className="partner-series-detail-backdrop"
          role="presentation"
          onClick={() => setSelectedSeries(null)}
        >
          <section
            className="partner-series-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-series-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="partner-series-detail-head">
              <div>
                <p className="section-label">{t("series.episodeViewsKicker")}</p>
                <h2 id="partner-series-detail-title">{selectedSeries.title_th || t("series.detailTitle")}</h2>
                <span>{selectedSeries.title_en || t("common.noEnglishTitle")}</span>
                <span>{selectedSeries.title_cn || t("common.noChineseTitle")}</span>
              </div>
              <button
                type="button"
                className="partner-series-detail-close"
                aria-label={t("series.closeDetails")}
                onClick={() => setSelectedSeries(null)}
              >
                x
              </button>
            </div>

            <div className="partner-series-detail-controls" aria-label={t("series.dateRange")}>
              {detailRangeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={detailRange === option ? "active" : ""}
                  onClick={() => setDetailRange(option)}
                >
                  {option === 1 ? t("common.today") : t("common.days", { count: option })}
                </button>
              ))}
            </div>

            <div className="partner-series-detail-view-toggle" aria-label={t("series.viewMode")}>
              <button
                type="button"
                className={detailView === "table" ? "active" : ""}
                onClick={() => setDetailView("table")}
              >
                {t("series.tableView")}
              </button>
              <button
                type="button"
                className={detailView === "chart" ? "active" : ""}
                onClick={() => setDetailView("chart")}
              >
                {t("series.chartView")}
              </button>
            </div>

            {detailError ? <p className="partner-series-detail-error">{detailError}</p> : null}

            <div className="partner-series-detail-chart-title">
              <p className="section-label">{t("series.episodeAnalyticsKicker")}</p>
              <h3>{t("series.episodeViewsTitle")}</h3>
            </div>

            <div className="partner-series-detail-content" aria-busy={isDetailLoading}>
              {isDetailLoading ? (
                <div className="partner-series-detail-state">{t("common.loading")}</div>
              ) : episodeRows.length === 0 ? (
                <div className="partner-series-detail-state">{t("series.episodeEmpty")}</div>
              ) : detailView === "table" ? (
                <div className="partner-series-detail-table-wrap">
                  <div className="partner-series-detail-table">
                    <div className="partner-series-detail-table-head">
                      <span>{t("series.episodeColumn")}</span>
                      <span>{t("series.typeColumn")}</span>
                      <span>{t("series.viewsColumn")}</span>
                    </div>
                    {episodeRows.map((row) => (
                      <div className="partner-series-detail-table-row" key={row.episode_no}>
                        <span>EP{row.episode_no}</span>
                        <span>{row.is_free ? t("common.free") : t("common.paid")}</span>
                        <span>{formatNumber(row.views, locale)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="partner-series-detail-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={episodeRows} margin={{ top: 10, right: 22, left: 4, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,255,217,0.12)" />
                      {freeAreas.map((area) => (
                        <ReferenceArea
                          key={`${area.start}-${area.end}`}
                          x1={area.start - 0.5}
                          x2={area.end + 0.5}
                          fill="rgba(63, 242, 198, 0.11)"
                          strokeOpacity={0}
                          ifOverflow="extendDomain"
                        />
                      ))}
                      <XAxis
                        dataKey="episode_no"
                        type="number"
                        domain={[0.5, "dataMax + 0.5"]}
                        tickFormatter={(value) => `EP${value}`}
                        stroke="rgba(228,242,237,0.58)"
                        tick={{ fill: "rgba(228,242,237,0.68)", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        stroke="rgba(228,242,237,0.58)"
                        tick={{ fill: "rgba(228,242,237,0.68)", fontSize: 12 }}
                        width={46}
                        allowDecimals={false}
                      />
                      <Tooltip content={<DetailTooltip locale={locale} t={t} />} />
                      <Legend
                        payload={[
                          { value: t("series.episodeViewsTitle"), type: "plainline", color: "#7dd3fc" },
                          { value: t("series.freeAreaLegend"), type: "square", color: "rgba(63, 242, 198, 0.22)" },
                        ]}
                        wrapperStyle={{ color: "rgba(228,242,237,0.72)", fontSize: 12, paddingTop: 10 }}
                      />
                      <Line
                        type="monotone"
                        name={t("series.episodeViewsTitle")}
                        dataKey="views"
                        stroke="#7dd3fc"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#051512" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
