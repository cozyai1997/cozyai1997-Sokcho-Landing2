import {
  defaultSmsBodyTemplate,
  defaultSmsSubject,
  normalizeSmsSettings,
  smsSettingsSelectColumns,
  smsSettingsTableName,
  toSmsSettings,
} from "./_sms.js";
import { requireAdminAuth } from "./_admin-auth.js";
import { getSupabaseClient, readPayload, type VercelRequest, type VercelResponse } from "./_supabase.js";

function parseSettingsPayload(payload: unknown) {
  const data = readPayload(payload);
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const settings = normalizeSmsSettings({
    enabled: Boolean(record.enabled),
    subject: String(record.subject ?? defaultSmsSubject),
    bodyTemplate: String(record.bodyTemplate ?? record.body_template ?? defaultSmsBodyTemplate),
    imageId: String(record.imageId ?? record.image_id ?? ""),
  });

  if (settings.subject.length > 80) {
    return { error: "문자 제목은 80자 이하로 입력해주세요." };
  }

  if (settings.bodyTemplate.length > 1800) {
    return { error: "문자 본문은 1,800자 이하로 입력해주세요." };
  }

  if (settings.imageId.length > 80) {
    return { error: "MMS imageId는 80자 이하로 입력해주세요." };
  }

  return { settings };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    if (request.method !== "GET" && request.method !== "PUT") {
      response.setHeader("Allow", "GET, PUT");
      response.status(405).json({ message: "허용되지 않는 요청입니다." });
      return;
    }

    if (!requireAdminAuth(request, response)) {
      return;
    }

    const supabase = getSupabaseClient();

    if (request.method === "GET") {
      const { data, error } = await supabase
        .from(smsSettingsTableName)
        .select(smsSettingsSelectColumns)
        .eq("id", "default")
        .maybeSingle();

      if (error) {
        throw error;
      }

      response.status(200).json({ settings: toSmsSettings(data) });
      return;
    }

    if (request.method === "PUT") {
      const result = parseSettingsPayload(request.body);
      if ("error" in result) {
        response.status(400).json({ message: result.error });
        return;
      }

      const settings = result.settings;
      const { data, error } = await supabase
        .from(smsSettingsTableName)
        .upsert(
          {
            id: "default",
            enabled: settings.enabled,
            subject: settings.subject,
            body_template: settings.bodyTemplate,
            image_id: settings.imageId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select(smsSettingsSelectColumns)
        .single();

      if (error) {
        throw error;
      }

      response.status(200).json({ settings: toSmsSettings(data) });
      return;
    }

  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "문자 설정 처리 중 오류가 발생했습니다.",
    });
  }
}
