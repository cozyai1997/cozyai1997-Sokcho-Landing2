import { requireAdminAuth } from "./_admin-auth.js";
import { fetchSmsSettings, normalizePhone, sendReservationMms, type SmsStatus } from "./_sms.js";
import { getSupabaseClient, readPayload, type VercelRequest, type VercelResponse } from "./_supabase.js";

type LeadSubmission = {
  id: string;
  name: string;
  phone: string;
  type: string;
  visitDate: string;
  visitTime: string;
  createdAt: string;
  source: string;
  smsStatus: SmsStatus;
  smsSentAt: string | null;
  smsError: string | null;
  smsMessageId: string | null;
};

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  type: string;
  visit_date: string;
  visit_time: string;
  created_at: string;
  source: string;
  sms_status: SmsStatus | null;
  sms_sent_at: string | null;
  sms_error: string | null;
  sms_message_id: string | null;
};

type LeadInput = {
  name: string;
  phone: string;
  type: string;
  visitDate: string;
  visitTime: string;
};

type DeleteInput = {
  ids: string[];
};

const tableName = "sokcho_landing2_leads";
const selectColumns =
  "id,name,phone,type,visit_date,visit_time,created_at,source,sms_status,sms_sent_at,sms_error,sms_message_id";
const duplicateReservationMessage = "이미 방문예약 접수된 고객입니다.";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "문자 발송 준비 중 오류가 발생했습니다.";
}

function toLead(row: LeadRow): LeadSubmission {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    type: row.type,
    visitDate: row.visit_date,
    visitTime: row.visit_time,
    createdAt: row.created_at,
    source: row.source,
    smsStatus: row.sms_status ?? "not_configured",
    smsSentAt: row.sms_sent_at,
    smsError: row.sms_error,
    smsMessageId: row.sms_message_id,
  };
}

function parsePayload(payload: unknown): LeadInput | null {
  const data = readPayload(payload);
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const name = String(record.name ?? "").trim();
  const phone = String(record.phone ?? "").trim();
  const type = String(record.type ?? "").trim();
  const visitDate = String(record.visitDate ?? "").trim();
  const visitTime = String(record.visitTime ?? "").trim();

  if (!name || !phone || !type || !visitDate || !visitTime) {
    return null;
  }

  return { name, phone, type, visitDate, visitTime };
}

function parseDeletePayload(payload: unknown): DeleteInput {
  const data = readPayload(payload);
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const ids = Array.isArray(record.ids)
    ? record.ids
        .map((id) => String(id).trim())
        .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    : [];

  return { ids: Array.from(new Set(ids)) };
}

async function hasDuplicatePhone(supabase: ReturnType<typeof getSupabaseClient>, phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return false;
  }

  const { data, error } = await supabase.from(tableName).select("id,phone").limit(2000);

  if (error) {
    throw error;
  }

  return (data ?? []).some((row) => {
    const record = row as Pick<LeadRow, "phone">;
    return normalizePhone(record.phone) === normalizedPhone;
  });
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    if ((request.method === "GET" || request.method === "DELETE") && !requireAdminAuth(request, response)) {
      return;
    }

    const supabase = getSupabaseClient();

    if (request.method === "GET") {
      const { data, error } = await supabase
        .from(tableName)
        .select(selectColumns)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      response.status(200).json({ leads: (data ?? []).map((row) => toLead(row as LeadRow)) });
      return;
    }

    if (request.method === "POST") {
      const input = parsePayload(request.body);

      if (!input) {
        response.status(400).json({ message: "필수 입력값이 누락되었습니다." });
        return;
      }

      if (await hasDuplicatePhone(supabase, input.phone)) {
        response.status(409).json({ message: duplicateReservationMessage });
        return;
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert({
          name: input.name,
          phone: input.phone,
          type: input.type,
          visit_date: input.visitDate,
          visit_time: input.visitTime,
          source: "landing2-resort-magazine",
        })
        .select(selectColumns)
        .single();

      if (error) {
        throw error;
      }

      const lead = toLead(data as LeadRow);
      const smsResult = await (async () => {
        try {
          const smsSettings = await fetchSmsSettings(supabase);
          return await sendReservationMms(input, smsSettings);
        } catch (smsError) {
          return {
            status: "failed" as SmsStatus,
            sentAt: null,
            error: getErrorMessage(smsError),
            messageId: null,
          };
        }
      })();
      const { data: updatedData, error: updateError } = await supabase
        .from(tableName)
        .update({
          sms_status: smsResult.status,
          sms_sent_at: smsResult.sentAt,
          sms_error: smsResult.error,
          sms_message_id: smsResult.messageId,
        })
        .eq("id", lead.id)
        .select(selectColumns)
        .single();

      if (updateError) {
        response.status(201).json({
          lead: {
            ...lead,
            smsStatus: smsResult.status,
            smsSentAt: smsResult.sentAt,
            smsError: updateError.message || smsResult.error,
            smsMessageId: smsResult.messageId,
          },
        });
        return;
      }

      response.status(201).json({ lead: toLead(updatedData as LeadRow) });
      return;
    }

    if (request.method === "DELETE") {
      const deleteInput = parseDeletePayload(request.body);
      const query =
        deleteInput.ids.length > 0
          ? supabase.from(tableName).delete().in("id", deleteInput.ids)
          : supabase.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await query;

      if (error) {
        throw error;
      }

      response.status(200).json({ deletedIds: deleteInput.ids, leads: deleteInput.ids.length > 0 ? undefined : [] });
      return;
    }

    response.setHeader("Allow", "GET, POST, DELETE");
    response.status(405).json({ message: "허용되지 않는 요청입니다." });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.",
    });
  }
}
