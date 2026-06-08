import type { SupabaseClient } from "@supabase/supabase-js";
import { SolapiMessageService } from "solapi";

export type SmsStatus = "not_configured" | "pending" | "sent" | "failed" | "skipped";

export type SmsSettings = {
  enabled: boolean;
  subject: string;
  bodyTemplate: string;
  imageId: string;
  updatedAt?: string;
};

type SmsSettingsRow = {
  enabled: boolean;
  subject: string;
  body_template: string;
  image_id: string | null;
  updated_at: string;
};

export type LeadSmsInput = {
  name: string;
  phone: string;
  type: string;
  visitDate: string;
  visitTime: string;
};

export type SendSmsResult = {
  status: SmsStatus;
  sentAt: string | null;
  error: string | null;
  messageId: string | null;
};

export const smsSettingsTableName = "sokcho_landing2_sms_settings";
export const smsSettingsSelectColumns = "enabled,subject,body_template,image_id,updated_at";
export const defaultSmsSubject = "속초 중앙하이츠 THE 228 방문예약";
export const defaultSmsBodyTemplate = `안녕하세요, {{name}} 고객님
속초 중앙하이츠 THE 228 입니다.
방문 날짜/일정 : {{visitDate}} {{visitTime}}
모델하우스를 방문하셔서, 해당 문자 메시지를 보여주시면 친절히 안내 및 상담 도와드리겠습니다.
감사합니다.`;

export const defaultSmsSettings: SmsSettings = {
  enabled: false,
  subject: defaultSmsSubject,
  bodyTemplate: defaultSmsBodyTemplate,
  imageId: "",
};

export function toSmsSettings(row: SmsSettingsRow | null | undefined): SmsSettings {
  if (!row) {
    return defaultSmsSettings;
  }

  return {
    enabled: Boolean(row.enabled),
    subject: row.subject || defaultSmsSubject,
    bodyTemplate: row.body_template || defaultSmsBodyTemplate,
    imageId: row.image_id ?? "",
    updatedAt: row.updated_at,
  };
}

export async function fetchSmsSettings(supabase: SupabaseClient): Promise<SmsSettings> {
  const { data, error } = await supabase
    .from(smsSettingsTableName)
    .select(smsSettingsSelectColumns)
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return toSmsSettings(data as SmsSettingsRow | null);
}

export function normalizeSmsSettings(input: Partial<SmsSettings>): SmsSettings {
  return {
    enabled: Boolean(input.enabled),
    subject: String(input.subject ?? defaultSmsSubject).trim() || defaultSmsSubject,
    bodyTemplate: String(input.bodyTemplate ?? defaultSmsBodyTemplate).trim() || defaultSmsBodyTemplate,
    imageId: String(input.imageId ?? "").trim(),
  };
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function formatVisitDateForSms(value: string) {
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function renderSmsTemplate(template: string, input: LeadSmsInput) {
  const values: Record<string, string> = {
    name: input.name,
    phone: input.phone,
    type: input.type,
    visitDate: formatVisitDateForSms(input.visitDate),
    visitTime: input.visitTime,
  };

  return template.replace(/\{\{\s*(name|phone|visitDate|visitTime|type)\s*\}\}/g, (_, key: string) => values[key] ?? "");
}

function getSolapiEnv() {
  const apiKey = process.env.SOLAPI_API_KEY?.trim();
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim();
  const sender = normalizePhone(process.env.SOLAPI_SENDER ?? "");

  if (!apiKey || !apiSecret || !sender) {
    return null;
  }

  return { apiKey, apiSecret, sender };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "SOLAPI 문자 발송 중 오류가 발생했습니다.";
}

function extractSolapiMessageId(result: unknown) {
  const record = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
  const groupId = record.groupId;
  const messageList = record.messageList;
  const resultList = record.resultList;
  const firstMessage =
    Array.isArray(messageList) && messageList[0] && typeof messageList[0] === "object"
      ? (messageList[0] as Record<string, unknown>)
      : Array.isArray(resultList) && resultList[0] && typeof resultList[0] === "object"
        ? (resultList[0] as Record<string, unknown>)
        : null;
  const messageId = firstMessage?.messageId ?? firstMessage?.message_id;

  if (typeof messageId === "string") {
    return messageId;
  }

  return typeof groupId === "string" ? groupId : null;
}

export async function sendReservationMms(input: LeadSmsInput, settings: SmsSettings): Promise<SendSmsResult> {
  if (!settings.enabled) {
    return {
      status: "skipped",
      sentAt: null,
      error: null,
      messageId: null,
    };
  }

  if (!settings.imageId) {
    return {
      status: "not_configured",
      sentAt: null,
      error: "MMS imageId가 설정되지 않았습니다.",
      messageId: null,
    };
  }

  const solapiEnv = getSolapiEnv();
  if (!solapiEnv) {
    return {
      status: "not_configured",
      sentAt: null,
      error: "SOLAPI 환경변수가 설정되지 않았습니다.",
      messageId: null,
    };
  }

  const recipient = normalizePhone(input.phone);
  if (!recipient) {
    return {
      status: "failed",
      sentAt: null,
      error: "수신번호 형식이 올바르지 않습니다.",
      messageId: null,
    };
  }

  try {
    const messageService = new SolapiMessageService(solapiEnv.apiKey, solapiEnv.apiSecret);
    const result = await messageService.send({
      to: recipient,
      from: solapiEnv.sender,
      type: "MMS",
      subject: settings.subject,
      text: renderSmsTemplate(settings.bodyTemplate, input),
      imageId: settings.imageId,
    });

    return {
      status: "sent",
      sentAt: new Date().toISOString(),
      error: null,
      messageId: extractSolapiMessageId(result),
    };
  } catch (error) {
    return {
      status: "failed",
      sentAt: null,
      error: getErrorMessage(error),
      messageId: null,
    };
  }
}
