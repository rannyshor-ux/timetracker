import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

function formatDate(d: Date): string {
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function GET() {
  // Yesterday's date range (midnight to midnight)
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const start = new Date(yesterday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(yesterday);
  end.setHours(23, 59, 59, 999);

  const yesterdayStr = toDateString(yesterday);

  // Fetch yesterday's entries with all relations
  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      employee: true,
      phase: { include: { project: true } },
    },
    orderBy: { date: "asc" },
  });

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const dateLabel = formatDate(yesterday);
  const logUrl = `http://localhost:3000/log?date=${yesterdayStr}`;

  // Build HTML email
  const entriesHtml =
    entries.length === 0
      ? `<p style="color:#888;font-size:15px;">לא הוזנו שעות ביום זה.</p>`
      : `<table dir="rtl" style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
          <thead>
            <tr style="background:#1e293b;color:#e2e8f0;">
              <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #334155;">עובד</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #334155;">פרויקט</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #334155;">שלב</th>
              <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #334155;">שעות</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #334155;">תיאור</th>
            </tr>
          </thead>
          <tbody>
            ${entries
              .map(
                (e, i) => `
              <tr style="background:${i % 2 === 0 ? "#0f172a" : "#1e293b"};">
                <td style="padding:8px 12px;color:#e2e8f0;">${e.employee.name}</td>
                <td style="padding:8px 12px;color:#e2e8f0;">${e.phase.project.name}</td>
                <td style="padding:8px 12px;color:#e2e8f0;">${e.phase.name}</td>
                <td style="padding:8px 12px;color:#f59e0b;font-weight:bold;text-align:center;">${e.hours}</td>
                <td style="padding:8px 12px;color:#94a3b8;">${e.description}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <p style="margin-top:12px;font-size:15px;color:#e2e8f0;">
          <strong>סה"כ: <span style="color:#f59e0b;">${totalHours.toFixed(1)} שעות</span></strong>
        </p>`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"></head>
    <body style="background:#0d1117;color:#e2e8f0;font-family:Arial,sans-serif;padding:32px;margin:0;">
      <div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:32px;">

        <h1 style="color:#f59e0b;font-size:20px;margin:0 0 4px 0;">⏱ סיכום שעות יומי</h1>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px 0;">${dateLabel}</p>

        ${entriesHtml}

        <div style="margin-top:28px;text-align:center;">
          <a href="${logUrl}"
             style="display:inline-block;background:#f59e0b;color:#0d1117;text-decoration:none;
                    padding:12px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
            ${entries.length === 0 ? "הזן שעות עבודה" : "הזן שעות נוספות"} ←
          </a>
        </div>

        <p style="color:#334155;font-size:12px;margin-top:24px;text-align:center;">
          מערכת תיעוד שעות — משרד אדריכלים
        </p>
      </div>
    </body>
    </html>
  `;

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.REMINDER_EMAIL_FROM,
      pass: process.env.REMINDER_EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"מערכת תיעוד שעות" <${process.env.REMINDER_EMAIL_FROM}>`,
      to: process.env.REMINDER_EMAIL_TO,
      subject: `סיכום שעות — ${dateLabel}`,
      html,
    });
    return NextResponse.json({ ok: true, entries: entries.length, totalHours });
  } catch (err: unknown) {
    console.error("Email send error:", err);
    const message = err instanceof Error ? err.message : "שגיאה בשליחת מייל";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
