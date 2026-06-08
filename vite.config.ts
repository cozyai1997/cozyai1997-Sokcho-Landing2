import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type LeadSubmission = {
  id: string;
  name: string;
  phone: string;
  type: string;
  visitDate?: string;
  visitTime?: string;
  createdAt: string;
  source: string;
  smsStatus?: "not_configured" | "pending" | "sent" | "failed" | "skipped";
  smsSentAt?: string | null;
  smsError?: string | null;
  smsMessageId?: string | null;
};

type SmsSettings = {
  enabled: boolean;
  subject: string;
  bodyTemplate: string;
  imageId: string;
  updatedAt?: string;
};

const leadsFile = path.resolve(__dirname, "data", "sokcho-landing2-leads.json");
const smsSettingsFile = path.resolve(__dirname, "data", "sokcho-landing2-sms-template.json");
const duplicateReservationMessage = "이미 방문예약 접수된 고객입니다.";
const defaultSmsSettings: SmsSettings = {
  enabled: false,
  subject: "속초 중앙하이츠 THE 228 방문예약",
  bodyTemplate: `안녕하세요, {{name}} 고객님
속초 중앙하이츠 THE 228 입니다.
방문 날짜/일정 : {{visitDate}} {{visitTime}}
모델하우스를 방문하셔서, 해당 문자 메시지를 보여주시면 친절히 안내 및 상담 도와드리겠습니다.
감사합니다.`,
  imageId: "",
};

async function readLeads(): Promise<LeadSubmission[]> {
  try {
    const contents = await readFile(leadsFile, "utf-8");
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLeads(leads: LeadSubmission[]) {
  await mkdir(path.dirname(leadsFile), { recursive: true });
  await writeFile(leadsFile, JSON.stringify(leads, null, 2), "utf-8");
}

function normalizeSmsSettings(value: unknown): SmsSettings {
  const record = value && typeof value === "object" ? (value as Partial<SmsSettings>) : {};

  return {
    enabled: Boolean(record.enabled),
    subject: String(record.subject ?? defaultSmsSettings.subject).trim() || defaultSmsSettings.subject,
    bodyTemplate: String(record.bodyTemplate ?? defaultSmsSettings.bodyTemplate).trim() || defaultSmsSettings.bodyTemplate,
    imageId: String(record.imageId ?? "").trim(),
    updatedAt: record.updatedAt,
  };
}

async function readSmsSettings(): Promise<SmsSettings> {
  try {
    const contents = await readFile(smsSettingsFile, "utf-8");
    return normalizeSmsSettings(JSON.parse(contents));
  } catch {
    return defaultSmsSettings;
  }
}

async function writeSmsSettings(settings: SmsSettings) {
  await mkdir(path.dirname(smsSettingsFile), { recursive: true });
  await writeFile(smsSettingsFile, JSON.stringify(settings, null, 2), "utf-8");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-lead-storage-api",
      configureServer(server) {
        server.middlewares.use("/api/leads", async (request, response) => {
          try {
            if (request.method === "GET") {
              sendJson(response, 200, { leads: await readLeads() });
              return;
            }

            if (request.method === "POST") {
              const payload = JSON.parse(await readBody(request));
              const name = String(payload.name ?? "").trim();
              const phone = String(payload.phone ?? "").trim();
              const type = String(payload.type ?? "").trim();
              const visitDate = String(payload.visitDate ?? "").trim();
              const visitTime = String(payload.visitTime ?? "").trim();

              if (!name || !phone || !type || !visitDate || !visitTime) {
                sendJson(response, 400, { message: "필수 입력값이 누락되었습니다." });
                return;
              }

              const leads = await readLeads();
              const normalizedPhone = normalizePhone(phone);
              const hasDuplicate = leads.some((lead) => normalizePhone(lead.phone) === normalizedPhone);

              if (hasDuplicate) {
                sendJson(response, 409, { message: duplicateReservationMessage });
                return;
              }

              const lead: LeadSubmission = {
                id: crypto.randomUUID(),
                name,
                phone,
                type,
                visitDate,
                visitTime,
                createdAt: new Date().toISOString(),
                source: "landing2-resort-magazine",
                smsStatus: "skipped",
                smsSentAt: null,
                smsError: null,
                smsMessageId: null,
              };

              await writeLeads([lead, ...leads]);
              sendJson(response, 201, { lead });
              return;
            }

            if (request.method === "DELETE") {
              const body = await readBody(request);
              const payload = body ? JSON.parse(body) : {};
              const ids = Array.isArray(payload.ids) ? payload.ids.map((id: unknown) => String(id)) : [];

              if (ids.length > 0) {
                const idSet = new Set(ids);
                await writeLeads((await readLeads()).filter((lead) => !idSet.has(lead.id)));
                sendJson(response, 200, { deletedIds: ids });
              } else {
                await writeLeads([]);
                sendJson(response, 200, { leads: [] });
              }
              return;
            }

            response.statusCode = 405;
            response.end();
          } catch (error) {
            sendJson(response, 500, {
              message: error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.",
            });
          }
        });

        server.middlewares.use("/api/sms-template", async (request, response) => {
          try {
            if (request.method === "GET") {
              sendJson(response, 200, { settings: await readSmsSettings() });
              return;
            }

            if (request.method === "PUT") {
              const payload = JSON.parse(await readBody(request));
              const settings = normalizeSmsSettings({
                enabled: Boolean(payload.enabled),
                subject: payload.subject,
                bodyTemplate: payload.bodyTemplate,
                imageId: payload.imageId,
                updatedAt: new Date().toISOString(),
              });

              await writeSmsSettings(settings);
              sendJson(response, 200, { settings });
              return;
            }

            response.statusCode = 405;
            response.end();
          } catch (error) {
            sendJson(response, 500, {
              message: error instanceof Error ? error.message : "문자 설정 저장 중 오류가 발생했습니다.",
            });
          }
        });
      },
    },
  ],
});
