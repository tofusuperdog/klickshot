"use client";

import { useEffect, useMemo, useState } from "react";

function toNumber(value) {
  return Number(value || 0);
}

function formatNumber(value, digits = 0) {
  return toNumber(value).toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(value) {
  return toNumber(value).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", {
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

export default function BillingPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
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
          setError(result.error || "ไม่สามารถโหลดรายงานรอบบิลได้");
          return;
        }

        setReports(Array.isArray(result.data) ? result.data : []);
      } catch {
        if (!isCurrent) return;
        setReports([]);
        setError("ไม่สามารถเชื่อมต่อข้อมูลรอบบิลได้");
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
  }, []);

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
          <h1>รายงานรอบบิล</h1>
          <p>ตรวจสอบยอดรายได้ที่ได้รับ ยอดดูรวม และรายละเอียดแยกตามซีรีย์</p>
        </div>
      </header>

      <section className="partner-billing-summary">
        <span>
          <small>รายงานที่ส่งแล้ว</small>
          <strong>{formatNumber(reports.length)}</strong>
        </span>
        <span>
          <small>รายได้รวม</small>
          <strong>{formatMoney(totals.revenue)}</strong>
        </span>
        <span>
          <small>ยอดดูตอนฟรี</small>
          <strong>{formatNumber(totals.free)}</strong>
        </span>
        <span>
          <small>ยอดดูตอนเสียเงิน</small>
          <strong>{formatNumber(totals.paid)}</strong>
        </span>
      </section>

      {error ? <p className="partner-billing-error">{error}</p> : null}

      <section className="partner-billing-list" aria-busy={isLoading}>
        {isLoading ? (
          <div className="partner-billing-state">กำลังโหลดรายงานรอบบิล...</div>
        ) : reports.length === 0 ? (
          <div className="partner-billing-state">ยังไม่มีรายงานรอบบิลที่ถูกส่งมา</div>
        ) : (
          reports.map((report) => (
            <article className="partner-billing-card" key={report.report_id}>
              <div className="partner-billing-card-main">
                <div>
                  <p className="partner-billing-period">
                    {formatDate(report.start_date)} - {formatDate(report.end_date)}
                  </p>
                  <h2>{report.report_name}</h2>
                  <span>ส่งเมื่อ {report.sent_at ? new Date(report.sent_at).toLocaleDateString("th-TH") : "-"}</span>
                </div>
                <button type="button" onClick={() => setSelectedReport(report)}>
                  ดูรายละเอียด
                </button>
              </div>

              <div className="partner-billing-metrics">
                <span>
                  <small>รายได้ที่ได้รับ</small>
                  <strong>{formatMoney(report.revenue_share_amount)}</strong>
                </span>
                <span>
                  <small>ตอนฟรี</small>
                  <strong>{formatNumber(report.total_free_views)}</strong>
                </span>
                <span>
                  <small>ตอนเสียเงิน</small>
                  <strong>{formatNumber(report.total_paid_views)}</strong>
                </span>
                <span>
                  <small>ยอดดูถ่วงน้ำหนัก</small>
                  <strong>{formatNumber(report.adjusted_views, 1)}</strong>
                </span>
              </div>
            </article>
          ))
        )}
      </section>

      {selectedReport ? (
        <div
          className="partner-billing-detail-backdrop"
          role="presentation"
          onClick={() => setSelectedReport(null)}
        >
          <section
            className="partner-billing-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-billing-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="partner-billing-detail-head">
              <div>
                <p className="section-label">รายละเอียดรอบบิล</p>
                <h2 id="partner-billing-detail-title">{selectedReport.report_name}</h2>
                <span>
                  {formatDate(selectedReport.start_date)} - {formatDate(selectedReport.end_date)}
                </span>
              </div>
              <button
                type="button"
                className="partner-billing-detail-close"
                aria-label="ปิดรายละเอียดรายงาน"
                onClick={() => setSelectedReport(null)}
              >
                ×
              </button>
            </div>

            <div className="partner-billing-detail-summary">
              <span>
                <small>รายได้ที่ได้รับ</small>
                <strong>{formatMoney(selectedReport.revenue_share_amount)}</strong>
              </span>
              <span>
                <small>ยอดดูตอนฟรี</small>
                <strong>{formatNumber(selectedReport.total_free_views)}</strong>
              </span>
              <span>
                <small>ยอดดูตอนเสียเงิน</small>
                <strong>{formatNumber(selectedReport.total_paid_views)}</strong>
              </span>
              <span>
                <small>ยอดดูถ่วงน้ำหนัก</small>
                <strong>{formatNumber(selectedReport.adjusted_views, 1)}</strong>
              </span>
            </div>

            <div className="partner-billing-series-table">
              <div className="partner-billing-series-head">
                <span>ซีรีย์</span>
                <span>ตอนฟรี</span>
                <span>ตอนเสียเงิน</span>
                <span>ยอดดูถ่วงน้ำหนัก</span>
                <span>ยอดเงิน</span>
              </div>
              {getSeriesDetails(selectedReport).length === 0 ? (
                <div className="partner-billing-series-empty">
                  ไม่มีข้อมูลซีรีย์ในรอบบิลนี้
                </div>
              ) : (
                getSeriesDetails(selectedReport).map((series) => (
                  <div className="partner-billing-series-row" key={series.series_id}>
                    <span>{series.series_title || `ซีรีย์ #${series.series_id}`}</span>
                    <span>{formatNumber(series.total_free_views)}</span>
                    <span>{formatNumber(series.total_paid_views)}</span>
                    <span>{formatNumber(series.adjusted_views, 1)}</span>
                    <span>{formatMoney(series.revenue_contribution_amount)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
