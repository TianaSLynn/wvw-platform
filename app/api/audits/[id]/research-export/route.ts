import ExcelJS from "exceljs";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api-response";
import { getAnonymityThreshold } from "@/lib/audit-privacy";
import { getRiskBand, scoreResponse, type QuestionType } from "@/lib/scoring";

type ResearchRow = { domain: string; questionCode: string; question: string; questionType: string; riskTag: string; riskWeight: number; responseCount: number; average: number | null; riskBand: string };

function xml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);
}

async function domainChart(rows: Array<{ domain: string; score: number }>) {
  const width = 1100, rowHeight = 58, height = Math.max(260, 110 + rows.length * rowHeight);
  const bars = rows.map((row, index) => {
    const y = 70 + index * rowHeight, barWidth = Math.max(2, Math.round(row.score * 7));
    const color = row.score < 40 ? "#b42318" : row.score < 60 ? "#d97706" : row.score < 80 ? "#2563eb" : "#15803d";
    return `<text x="20" y="${y + 22}" font-size="18" fill="#0F1C3F">${xml(row.domain.slice(0, 42))}</text><rect x="360" y="${y}" width="700" height="28" rx="6" fill="#e5e7eb"/><rect x="360" y="${y}" width="${barWidth}" height="28" rx="6" fill="${color}"/><text x="${Math.min(1060, 372 + barWidth)}" y="${y + 21}" font-size="16" font-weight="700" fill="#0F1C3F">${row.score}</text>`;
  }).join("");
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fff"/><text x="20" y="35" font-size="25" font-weight="700" fill="#0F1C3F">Anonymous Domain Score Profile</text>${bars}</svg>`)).png().toBuffer();
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id: auditId } = await params;
    const audit = await db.audit.findFirst({
      where: { id: auditId, orgId: user.orgId },
      select: {
        id: true, name: true, code: true, customFields: true,
        client: { select: { name: true } },
        sections: { orderBy: { sortOrder: "asc" }, select: { title: true, checklistItems: { orderBy: { sortOrder: "asc" }, select: { id: true, qId: true, question: true, questionType: true, reverseScored: true, riskTag: true, riskWeight: true, scenarioOptions: true } } } },
      },
    });
    if (!audit) return notFound("Audit");
    const responses = await db.surveyResponse.findMany({ where: { auditId: audit.id }, select: { responses: true } });
    const customFields = audit.customFields && typeof audit.customFields === "object" ? audit.customFields as Record<string, unknown> : null;
    const threshold = getAnonymityThreshold(customFields);
    if (responses.length < threshold) return badRequest(`Anonymous research export is suppressed until ${threshold} responses are received. Current count: ${responses.length}.`);
    const responseMaps = responses.map((response) => response.responses as Record<string, string>);
    const rows: ResearchRow[] = [];
    for (const section of audit.sections) for (const item of section.checklistItems) {
      const scores = responseMaps.map((response) => response[item.id]).filter((value): value is string => value !== undefined).map((value) => scoreResponse(value, item.questionType as QuestionType, item.reverseScored, item.scenarioOptions as Array<{ letter: string; score: number }> | null)).filter((value): value is number => value !== null);
      const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
      rows.push({ domain: section.title, questionCode: item.qId ?? item.id, question: item.question, questionType: item.questionType, riskTag: item.riskTag ?? "", riskWeight: item.riskWeight, responseCount: scores.length, average, riskBand: average == null ? "NOT_SCORED" : getRiskBand(average) });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "WVW Intelligence";
    workbook.subject = "Threshold-released anonymous organizational audit research";
    const plum = "FF4C1D4F", gold = "FFC9A84C", navy = "FF0F1C3F";
    const dashboard = workbook.addWorksheet("Dashboard", { views: [{ showGridLines: false }] });
    dashboard.columns = [{ width: 30 }, { width: 70 }];
    dashboard.mergeCells("A1:B2");
    dashboard.getCell("A1").value = "WVW Intelligence — Anonymous Research Workbook";
    dashboard.getCell("A1").font = { size: 20, bold: true, color: { argb: "FFFFFFFF" } };
    dashboard.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: plum } };
    dashboard.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
    const metadata: Array<[string, string | number | Date]> = [["Client", audit.client.name], ["Audit", audit.name], ["Audit code", audit.code ?? audit.id], ["Anonymous responses released", responses.length], ["Minimum release threshold", threshold], ["Generated", new Date()], ["Research note", "Individual identities, invitation identifiers, names, emails, roles, departments, and raw response records are excluded."]];
    metadata.forEach((values, index) => { const row = dashboard.getRow(index + 4); row.values = values; row.getCell(1).font = { bold: true, color: { argb: navy } }; row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F2E7" } }; });
    dashboard.getCell("B9").numFmt = "yyyy-mm-dd hh:mm";
    dashboard.getRow(10).height = 45; dashboard.getCell("B10").alignment = { wrapText: true, vertical: "top" };

    const research = workbook.addWorksheet("Anonymous Question Summary", { views: [{ state: "frozen", ySplit: 1 }] });
    research.columns = [{ header: "Domain", key: "domain", width: 32 }, { header: "Question Code", key: "questionCode", width: 20 }, { header: "Question", key: "question", width: 70 }, { header: "Question Type", key: "questionType", width: 18 }, { header: "Risk Tag", key: "riskTag", width: 24 }, { header: "Risk Weight", key: "riskWeight", width: 14 }, { header: "Anonymous Response Count", key: "responseCount", width: 25 }, { header: "Average Score (0-100)", key: "average", width: 22 }, { header: "Risk Band", key: "riskBand", width: 16 }];
    research.addRows(rows);
    research.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; research.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
    research.getColumn("question").alignment = { wrapText: true, vertical: "top" }; research.autoFilter = { from: "A1", to: "I1" };
    research.addConditionalFormatting({ ref: `H2:H${rows.length + 1}`, rules: [{ type: "colorScale", priority: 1, cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }], color: [{ argb: "FFFECACA" }, { argb: "FFFEF3C7" }, { argb: "FFBBF7D0" }] }] });

    const domains = [...new Set(rows.map((row) => row.domain))].map((domain) => { const scored = rows.filter((row) => row.domain === domain && row.average !== null); return { domain, score: scored.length ? Math.round(scored.reduce((sum, row) => sum + (row.average ?? 0), 0) / scored.length) : 0, questions: scored.length }; });
    const summary = workbook.addWorksheet("Domain Summary", { views: [{ state: "frozen", ySplit: 1 }, { showGridLines: false }] });
    summary.columns = [{ header: "Domain", key: "domain", width: 42 }, { header: "Average Score", key: "score", width: 18 }, { header: "Questions Scored", key: "questions", width: 18 }, { header: "Risk Band", key: "risk", width: 18 }];
    summary.addRows(domains.map((domain) => ({ ...domain, risk: getRiskBand(domain.score) })));
    summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: plum } };
    summary.addConditionalFormatting({ ref: `B2:B${domains.length + 1}`, rules: [{ type: "colorScale", priority: 1, cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }], color: [{ argb: "FFFECACA" }, { argb: "FFFEF3C7" }, { argb: "FFBBF7D0" }] }] });
    const chartPng = await domainChart(domains);
    const image = workbook.addImage({ base64: chartPng.toString("base64"), extension: "png" });
    summary.addImage(image, { tl: { col: 0, row: domains.length + 3 }, ext: { width: 850, height: Math.max(260, 110 + domains.length * 45) } });
    summary.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${audit.client.name}-${audit.code ?? "audit"}-anonymous-research.xlsx`.replace(/[^a-z0-9_.-]+/gi, "-").toLowerCase();
    return new Response(new Uint8Array(buffer), { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return serverError(error); }
}
