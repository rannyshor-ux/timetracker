"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { decimalToHMS } from "@/lib/timeFormat";

type PreviewRow = {
  project: string;
  client: string;
  user: string;
  phase: string;
  date: string;
  hours: string;
  description: string;
};

type ImportResult = {
  imported: number;
  skipped: number;
  newProjects: number;
  newEmployees: number;
  newPhases: number;
};

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setRawFile(file);
    setResult(null);
    setError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      setTotalRows(rows.length);

      const fmtDate = (v: unknown): string => {
        if (!v) return "";
        if (v instanceof Date) return v.toLocaleDateString("he-IL");
        if (typeof v === "number") {
          const d = new Date(new Date(Date.UTC(1899, 11, 30)).getTime() + v * 86400000);
          return d.toLocaleDateString("he-IL");
        }
        return String(v);
      };

      const str = (v: unknown) => String(v ?? "");
      const mapped: PreviewRow[] = rows.slice(0, 10).map((row) => ({
        project: str(row["Project"] || row["פרויקט"]),
        client: str(row["Client"] || row["לקוח"]),
        user: str(row["User"] || row["משתמש"]),
        phase: str(row["Tags"] || row["תגיות"]) || "כללי",
        date: fmtDate(row["Start Date"] || row["תאריך התחלה"]),
        hours: (() => { const v = parseFloat(str(row["Duration (decimal)"] || row["משך (עשרוני)"])); return isNaN(v) ? "" : decimalToHMS(v); })(),
        description: str(row["Description"] || row["תיאור"]),
      }));
      setPreview(mapped);
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!rawFile) return;
    setImporting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", rawFile);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בייבוא");
      setResult(data);
      setPreview([]);
      setFileName("");
      setRawFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בייבוא");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">ייבוא נתונים מ-Clockify</h1>
        <p className="text-gray-500 text-sm mt-1">
          ייצא מ-Clockify קובץ Excel (Detailed report) והעלה אותו כאן
        </p>
      </div>

      {/* How to export from Clockify */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 text-sm text-gray-400 space-y-1">
        <p className="font-medium text-gray-300">איך לייצא מ-Clockify:</p>
        <ol className="list-decimal list-inside space-y-0.5 mr-4">
          <li>כנס ל-Clockify → Reports → Detailed</li>
          <li>בחר את טווח התאריכים הרצוי</li>
          <li>לחץ Export → Excel (.xlsx)</li>
          <li>העלה את הקובץ כאן</li>
        </ol>
      </div>

      {/* Upload area */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div
          className="border-2 border-dashed border-gray-700 rounded-lg px-6 py-10 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-gray-400 text-sm">
            {fileName ? (
              <span className="text-amber-400 font-medium">{fileName}</span>
            ) : (
              <>לחץ לבחירת קובץ <span className="text-gray-600">.xlsx</span></>
            )}
          </p>
          {totalRows > 0 && (
            <p className="text-gray-600 text-xs mt-1">{totalRows} שורות נמצאו בקובץ</p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">
              תצוגה מקדימה — {preview.length} שורות ראשונות מתוך {totalRows}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800/60 text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-right">פרויקט</th>
                  <th className="px-4 py-2 text-right">לקוח</th>
                  <th className="px-4 py-2 text-right">עובד</th>
                  <th className="px-4 py-2 text-right">שלב (Tag)</th>
                  <th className="px-4 py-2 text-right">תאריך</th>
                  <th className="px-4 py-2 text-center">שעות</th>
                  <th className="px-4 py-2 text-right">תיאור</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/40">
                    <td className="px-4 py-2 text-gray-200">{row.project || <span className="text-red-400">חסר</span>}</td>
                    <td className="px-4 py-2 text-gray-400">{row.client}</td>
                    <td className="px-4 py-2 text-gray-300">{row.user}</td>
                    <td className="px-4 py-2 text-amber-400">{row.phase}</td>
                    <td className="px-4 py-2 text-gray-400">{row.date}</td>
                    <td className="px-4 py-2 text-gray-200 text-center font-medium">{row.hours}</td>
                    <td className="px-4 py-2 text-gray-500 max-w-xs truncate">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-900/20 border-t border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              פרויקטים, שלבים ועובדים חדשים ייווצרו אוטומטית. רשומות כפולות ידולגו.
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-amber-500 text-gray-900 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {importing ? "מייבא..." : `ייבא ${totalRows} רשומות`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl px-6 py-5 space-y-3">
          <p className="text-emerald-400 font-semibold text-base">✓ הייבוא הושלם בהצלחה</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "רשומות יובאו", value: result.imported, color: "text-emerald-400" },
              { label: "דולגו (כפולות)", value: result.skipped, color: "text-gray-400" },
              { label: "פרויקטים חדשים", value: result.newProjects, color: "text-amber-400" },
              { label: "עובדים חדשים", value: result.newEmployees, color: "text-blue-400" },
              { label: "שלבים חדשים", value: result.newPhases, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 rounded-lg px-4 py-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            <a href="/" className="text-amber-400 hover:underline">כנס ללוח הבקרה ←</a> לצפייה בנתונים המיובאים.
          </p>
        </div>
      )}
    </div>
  );
}
