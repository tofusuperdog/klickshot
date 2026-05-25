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

const rangeOptions = [
  { value: 1, label: "วันนี้" },
  { value: 7, label: "7 วัน" },
  { value: 14, label: "14 วัน" },
];

const detailRangeOptions = [
  { value: 1, label: "วันนี้" },
  { value: 7, label: "7 วัน" },
  { value: 14, label: "14 วัน" },
];

function toNumber(value) {
  return Number(value || 0);
}

function formatNumber(value) {
  return toNumber(value).toLocaleString();
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

function DetailTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const isFree = Boolean(payload[0]?.payload?.is_free);
  const episodeLabel = `EP${label}${isFree ? " (ฟรี)" : ""}`;

  return (
    <div className="partner-series-detail-tooltip">
      <p>{episodeLabel}</p>
      <span>
        <small>ยอดดูตอนนี้</small>
        <strong>{formatNumber(payload[0]?.value)}</strong>
      </span>
    </div>
  );
}

export default function PartnerSeriesList() {
  const [dateRange, setDateRange] = useState(1);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [detailRange, setDetailRange] = useState(1);
  const [detailRows, setDetailRows] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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
          setError(data.error || "ไม่สามารถดึงข้อมูลซีรีส์ได้");
          return;
        }

        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!isCurrent) return;
        setRows([]);
        setError("ไม่สามารถเชื่อมต่อข้อมูลซีรีส์ได้");
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
  }, [dateRange]);

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
          setDetailError(data.error || "ไม่สามารถดึงข้อมูลรายละเอียดซีรีส์ได้");
          return;
        }

        setDetailRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!isCurrent) return;
        setDetailRows([]);
        setDetailError("ไม่สามารถเชื่อมต่อข้อมูลรายละเอียดซีรีส์ได้");
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
  }, [detailRange, selectedSeries]);

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

  return (
    <>
      <header className="content-header partner-series-header">
        <div>
          <p className="section-label">Klickshot Partner</p>
          <h1>ซีรีส์ของฉัน</h1>
          <p>ดูยอดของพาร์ทเนอร์นี้ แยกฟรีและเสียเงินตามช่วงเวลาที่เลือก</p>
        </div>
      </header>

      <section className="partner-series-toolbar">
        <div className="partner-series-summary">
          <span>
            <small>ซีรีส์ทั้งหมด</small>
            <em>ของพาร์ทเนอร์นี้</em>
            <strong>{formatNumber(summary.series)}</strong>
          </span>
          <span>
            <small>ยอดรวม</small>
            <em>ฟรี + เสียเงิน</em>
            <strong>{formatNumber(summary.total)}</strong>
          </span>
          <span>
            <small>ฟรี</small>
            <em>ของพาร์ทเนอร์นี้</em>
            <strong>{formatNumber(summary.free)}</strong>
          </span>
          <span>
            <small>เสียเงิน</small>
            <em>ของพาร์ทเนอร์นี้</em>
            <strong>{formatNumber(summary.paid)}</strong>
          </span>
        </div>

        <div className="partner-series-filter" aria-label="เลือกช่วงเวลา">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={dateRange === option.value ? "active" : ""}
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="partner-series-error">{error}</p> : null}

      <section className="partner-series-list" aria-busy={isLoading}>
        {isLoading ? (
          <div className="partner-series-state">กำลังโหลดข้อมูล...</div>
        ) : rows.length === 0 ? (
          <div className="partner-series-state">ยังไม่มีซีรีส์ในช่วงเวลานี้</div>
        ) : (
          rows.map((series, index) => (
            <article className="partner-series-card" key={series.series_id}>
              <div className="partner-series-rank">#{index + 1}</div>
              <div className="partner-series-poster">
                {series.poster_url ? (
                  <img src={series.poster_url} alt={series.title_th || "Series poster"} />
                ) : (
                  <PosterFallback />
                )}
              </div>

              <div className="partner-series-info">
                <div>
                  <h2>{series.title_th || "ไม่มีชื่อภาษาไทย"}</h2>
                  <p>{series.title_en || "ไม่มีชื่อภาษาอังกฤษ"}</p>
                </div>
                <button type="button" onClick={() => setSelectedSeries(series)}>
                  รายละเอียด
                </button>
              </div>

              <div className="partner-series-metrics">
                <span>
                  <small>ยอดรวม</small>
                  <em>ฟรี + เสียเงิน</em>
                  <strong>{formatNumber(series.total_views)}</strong>
                </span>
                <span>
                  <small>ฟรี</small>
                  <em>ของเรื่องนี้</em>
                  <strong>{formatNumber(series.free_views)}</strong>
                </span>
                <span>
                  <small>เสียเงิน</small>
                  <em>ของเรื่องนี้</em>
                  <strong>{formatNumber(series.paid_views)}</strong>
                </span>
              </div>
            </article>
          ))
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
                <p className="section-label">Episode views</p>
                <h2 id="partner-series-detail-title">{selectedSeries.title_th || "รายละเอียดซีรีส์"}</h2>
                <span>{selectedSeries.title_en || "ไม่มีชื่อภาษาอังกฤษ"}</span>
              </div>
              <button
                type="button"
                className="partner-series-detail-close"
                aria-label="ปิดรายละเอียด"
                onClick={() => setSelectedSeries(null)}
              >
                ×
              </button>
            </div>

            <div className="partner-series-detail-controls" aria-label="เลือกช่วงเวลา">
              {detailRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={detailRange === option.value ? "active" : ""}
                  onClick={() => setDetailRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {detailError ? <p className="partner-series-detail-error">{detailError}</p> : null}

            <div className="partner-series-detail-chart-title">
              <p className="section-label">Episode analytics</p>
              <h3>ยอดรับชมรายตอน</h3>
            </div>

            <div className="partner-series-detail-chart" aria-busy={isDetailLoading}>
              {isDetailLoading ? (
                <div className="partner-series-detail-state">กำลังโหลดข้อมูล...</div>
              ) : episodeRows.length === 0 ? (
                <div className="partner-series-detail-state">ยังไม่มีข้อมูลรายตอนในช่วงเวลานี้</div>
              ) : (
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
                    <Tooltip content={<DetailTooltip />} />
                    <Legend
                      payload={[
                        { value: "ยอดรับชมรายตอน", type: "plainline", color: "#7dd3fc" },
                        { value: "แถบเขียว = ตอนฟรี", type: "square", color: "rgba(63, 242, 198, 0.22)" },
                      ]}
                      wrapperStyle={{ color: "rgba(228,242,237,0.72)", fontSize: 12, paddingTop: 10 }}
                    />
                    <Line
                      type="monotone"
                      name="ยอดรับชมรายตอน"
                      dataKey="views"
                      stroke="#7dd3fc"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#051512" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
