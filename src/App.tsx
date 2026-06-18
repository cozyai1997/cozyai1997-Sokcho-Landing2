import {
  ArrowRight,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  HardHat,
  House,
  MapPin,
  MessageSquare,
  Mountain,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Train,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type UnitKey = "84A" | "84B" | "84C" | "84D" | "84E" | "84F" | "84G" | "93" | "98" | "101A" | "101B";
type LeadSubmission = {
  id: string;
  name: string;
  phone: string;
  type: string;
  visitDate?: string;
  visitTime?: string;
  createdAt: string;
  source: string;
  smsStatus?: SmsStatus;
  smsSentAt?: string | null;
  smsError?: string | null;
  smsMessageId?: string | null;
};

type LeadInput = {
  name: string;
  phone: string;
  type: string;
  visitDate: string;
  visitTime: string;
};

type SmsStatus = "not_configured" | "pending" | "sent" | "failed" | "skipped";

type SmsSettings = {
  enabled: boolean;
  subject: string;
  bodyTemplate: string;
  imageId: string;
  updatedAt?: string;
};

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

type VisitTimeOption = {
  value: string;
  label: string;
  status?: string;
  disabled?: boolean;
};

type UnitSummaryItem = {
  label: string;
  value: string;
  note?: string;
};

type UnitPlanInfo = {
  label: string;
  title: string;
  body: string;
  households: string;
  image: string;
  loftDetailImage?: string;
  summary: UnitSummaryItem[];
};

const navItems = [
  { label: "리조트 라이프", href: "#summary" },
  { label: "설악과 동해", href: "#premium" },
  { label: "공간의 장면", href: "#valuable" },
  { label: "세대 타입", href: "#unit" },
  { label: "방문예약", href: "#lead" },
];

const heroStats = [
  { value: "228", label: "PRIVATE HOUSEHOLDS", detail: "테라스 라이프를 위한 희소 단지", icon: Building2 },
  { value: "14", label: "LOW-RISE VILLAGE", detail: "지하2층~지상4층의 낮은 스카이라인", icon: House },
  { value: "84~101㎡", label: "RESORT UNITS", detail: "다락과 테라스를 품은 다양한 타입", icon: Compass },
  { value: "속초IC 약 1km", label: "WEEKEND ACCESS", detail: "서울과 동해를 잇는 빠른 여정", icon: Train },
];

const premiumCards = [
  {
    title: "Weekend Route",
    body: "속초IC 약 1km, 양양고속도로와 예정 교통망이 주말 별장 같은 접근성을 더합니다.",
    icon: Train,
  },
  {
    title: "Mountain & Sea",
    body: "설악산의 능선과 동해의 바람을 일상 반경 안에서 함께 누리는 입지입니다.",
    icon: Mountain,
  },
  {
    title: "City Convenience",
    body: "이마트, 문화예술회관, 의료원, 학교 등 속초의 생활 인프라를 가볍게 이용합니다.",
    icon: MapPin,
  },
  {
    title: "Terrace Scene",
    body: "복층, 루프탑, 썬큰 테라스가 머무는 시간마다 다른 장면을 만듭니다.",
    icon: House,
  },
];

const valueCards = [
  {
    title: "Road Trip Ready",
    body: "속초IC와 광역 교통 기대감이 세컨드하우스처럼 가벼운 이동을 돕습니다.",
    image: "/assets/Rapid transportation network.png",
  },
  {
    title: "Seorak Hideaway",
    body: "계절마다 표정이 달라지는 설악과 동해를 가까이 둔 휴식의 자리입니다.",
    image: "/assets/sea-mountain-panorama.jpg?v=20260526094252",
  },
  {
    title: "Terrace Journal",
    body: "복층, 루프탑, 썬큰 테라스가 가족의 취향을 담는 야외 거실이 됩니다.",
    image: "/assets/complex-wide.jpg",
  },
];

const valuableFeatures = [
  {
    number: "02",
    category: "LIVING PREMIUM",
    title: "모던함과 개방감이 극대화된 거실",
    body: "높은 천정고와 밝은 채광, 넓은 거실 동선으로 일상에서도 호텔 라운지 같은 여유를 느낄 수 있습니다.",
    label: "OPEN LIVING",
    tone: "green",
    imageSide: "right",
    images: [{ src: "/assets/valuable-02-living-room.png", caption: "거실 이미지" }],
  },
  {
    number: "03",
    category: "TERRACE PREMIUM",
    title: "삶의 여유로움을 누리는 특별한 공간",
    body: "테라스와 다락, 옥외 공간을 활용해 가족의 취향에 맞춘 휴식과 취미의 장면을 완성합니다.",
    label: "TERRACE LIFE",
    tone: "gold",
    imageSide: "left",
    images: [{ src: "/assets/valuable-03-terrace.png", caption: "테라스 이미지" }],
  },
  {
    number: "04",
    category: "DINING PREMIUM",
    title: "주방과 다이닝이 이어지는 생활 중심 공간",
    body: "주방, 식당, 거실이 자연스럽게 연결되는 구조로 가족의 생활 흐름과 손님맞이까지 고려했습니다.",
    label: "DINING ROOM",
    tone: "blue",
    imageSide: "right",
    images: [{ src: "/assets/dining-gallery.jpg", caption: "모델하우스 이미지" }],
  },
  {
    number: "05",
    category: "SPECIAL SPACE",
    title: "복층 구조가 만드는 프라이빗 라이프",
    body: "다락과 서재, 계단부까지 입체적으로 활용해 같은 면적에서도 더 넓게 쓰는 공간감을 제공합니다.",
    label: "LOFT & STUDY",
    tone: "cyan",
    imageSide: "left",
    images: [
      { src: "/assets/valuable-05-study.jpg", caption: "서재 이미지" },
      { src: "/assets/valuable-05-duplex-layout.png", caption: "복층 구조 이미지" },
      { src: "/assets/valuable-05-attic-staircase.png", caption: "다락 계단 이미지" },
    ],
  },
];

const lifeCards = [
  {
    title: "TERRACE HOURS",
    body: "아침의 커피, 오후의 독서, 저녁의 바람을 담는 테라스와 다락",
    image: "/assets/terrace-hours-courtyard.jpg",
  },
  {
    title: "QUIET COMMUNITY",
    body: "228세대가 공유하는 낮은 밀도의 커뮤니티와 여유로운 생활 리듬",
    image: "/assets/community-main.jpg",
  },
];

const unitPlans: Record<UnitKey, UnitPlanInfo> = {
  "84A": {
    label: "84A",
    title: "실사용 약 122.18㎡ 기본형",
    body: "3층 배치, 전용 84.96㎡에 발코니 서비스 면적을 더한 실속형 타입입니다.",
    households: "총 17세대",
    image: "/assets/unit-84a-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "3층" },
      { label: "세대수", value: "17세대" },
      { label: "전용면적", value: "84.9649㎡", note: "25.70평" },
      { label: "공급면적", value: "104.7567㎡", note: "31.69평" },
      { label: "서비스면적", value: "37.2216㎡", note: "11.26평" },
      { label: "실사용면적", value: "122.1865㎡", note: "36.96평" },
    ],
  },
  "84B": {
    label: "84B",
    title: "실사용 약 131.51㎡ 테라스형",
    body: "2층 배치, 발코니와 테라스 서비스 면적을 함께 누리는 확장감 있는 타입입니다.",
    households: "총 17세대",
    image: "/assets/unit-84b-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "2층" },
      { label: "세대수", value: "17세대" },
      { label: "전용면적", value: "84.9649㎡", note: "25.70평" },
      { label: "공급면적", value: "104.7567㎡", note: "31.69평" },
      { label: "서비스면적", value: "46.5513㎡", note: "14.08평" },
      { label: "실사용면적", value: "131.5162㎡", note: "39.78평" },
    ],
  },
  "84C": {
    label: "84C",
    title: "실사용 약 132.33㎡ 테라스형",
    body: "2층 일부 세대에 계획된 희소 타입으로 테라스 활용도를 높인 평면입니다.",
    households: "총 2세대",
    image: "/assets/unit-84c-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "2층" },
      { label: "세대수", value: "2세대" },
      { label: "전용면적", value: "84.9649㎡", note: "25.70평" },
      { label: "공급면적", value: "104.7567㎡", note: "31.69평" },
      { label: "서비스면적", value: "47.3722㎡", note: "14.33평" },
      { label: "실사용면적", value: "132.3371㎡", note: "40.03평" },
    ],
  },
  "84D": {
    label: "84D",
    title: "실사용 약 140.98㎡ 와이드형",
    body: "3층 배치, 넓은 테라스 서비스 면적으로 여유로운 외부공간을 더했습니다.",
    households: "총 27세대",
    image: "/assets/unit-84d-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "3층" },
      { label: "세대수", value: "27세대" },
      { label: "전용면적", value: "84.9649㎡", note: "25.70평" },
      { label: "공급면적", value: "104.7567㎡", note: "31.69평" },
      { label: "서비스면적", value: "56.0250㎡", note: "16.95평" },
      { label: "실사용면적", value: "140.9899㎡", note: "42.65평" },
    ],
  },
  "84E": {
    label: "84E",
    title: "실사용 약 241.64㎡ 다락 특화형",
    body: "3~4층 배치, 테라스와 다락을 모두 더한 대표 복층 특화 타입입니다.",
    households: "총 46세대",
    image: "/assets/unit-84e-pdf.jpg?v=20260526-top-safe",
    loftDetailImage: "/assets/unit-84e-loft-detail.jpg?v=20260526-loft-detail",
    summary: [
      { label: "층", value: "3~4층" },
      { label: "세대수", value: "46세대" },
      { label: "전용면적", value: "84.9649㎡", note: "25.70평" },
      { label: "공급면적", value: "104.7567㎡", note: "31.69평" },
      { label: "서비스면적", value: "156.6839㎡", note: "47.40평" },
      { label: "실사용면적", value: "241.6488㎡", note: "73.10평" },
    ],
  },
  "84F": {
    label: "84F",
    title: "실사용 약 116.23㎡ 저층형",
    body: "1~3층에 고르게 배치된 타입으로 실용적인 발코니 서비스 면적을 갖췄습니다.",
    households: "총 14세대",
    image: "/assets/unit-84f-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "1~3층" },
      { label: "세대수", value: "14세대" },
      { label: "전용면적", value: "84.9048㎡", note: "25.68평" },
      { label: "공급면적", value: "104.9426㎡", note: "31.75평" },
      { label: "서비스면적", value: "31.3350㎡", note: "9.48평" },
      { label: "실사용면적", value: "116.2398㎡", note: "35.16평" },
    ],
  },
  "84G": {
    label: "84G",
    title: "실사용 약 224.68㎡ 다락 특화형",
    body: "3~4층 배치, 테라스와 다락이 더해져 입체적인 라이프스타일을 담는 타입입니다.",
    households: "총 5세대",
    image: "/assets/unit-84g-pdf.jpg?v=20260526-top-safe",
    loftDetailImage: "/assets/unit-84g-loft-detail.jpg?v=20260526-loft-detail",
    summary: [
      { label: "층", value: "3~4층" },
      { label: "세대수", value: "5세대" },
      { label: "전용면적", value: "84.9048㎡", note: "25.68평" },
      { label: "공급면적", value: "104.9426㎡", note: "31.75평" },
      { label: "서비스면적", value: "139.7830㎡", note: "42.28평" },
      { label: "실사용면적", value: "224.6878㎡", note: "67.97평" },
    ],
  },
  "93": {
    label: "93",
    title: "실사용 약 132.64㎡ 중대형",
    body: "1층 배치, 전용 93.68㎡에 발코니 서비스 면적을 더한 여유형 타입입니다.",
    households: "총 19세대",
    image: "/assets/unit-93-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "1층" },
      { label: "세대수", value: "19세대" },
      { label: "전용면적", value: "93.6819㎡", note: "28.34평" },
      { label: "공급면적", value: "114.9213㎡", note: "34.76평" },
      { label: "서비스면적", value: "38.9616㎡", note: "11.79평" },
      { label: "실사용면적", value: "132.6435㎡", note: "40.12평" },
    ],
  },
  "98": {
    label: "98",
    title: "실사용 약 162.30㎡ 테라스형",
    body: "2층 배치, 넓어진 주거 면적과 테라스 서비스 면적이 조화를 이루는 타입입니다.",
    households: "총 27세대",
    image: "/assets/unit-98-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "2층" },
      { label: "세대수", value: "27세대" },
      { label: "전용면적", value: "98.8419㎡", note: "29.90평" },
      { label: "공급면적", value: "121.0783㎡", note: "36.63평" },
      { label: "서비스면적", value: "63.4646㎡", note: "19.20평" },
      { label: "실사용면적", value: "162.3065㎡", note: "49.10평" },
    ],
  },
  "101A": {
    label: "101A",
    title: "실사용 약 146.05㎡ 대형 타입",
    body: "1층 배치, 전용 101.31㎡ 기반의 여유로운 공간감과 서비스 면적을 갖췄습니다.",
    households: "총 27세대",
    image: "/assets/unit-101a-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "1층" },
      { label: "세대수", value: "27세대" },
      { label: "전용면적", value: "101.3143㎡", note: "30.65평" },
      { label: "공급면적", value: "127.7227㎡", note: "38.64평" },
      { label: "서비스면적", value: "44.7428㎡", note: "13.53평" },
      { label: "실사용면적", value: "146.0571㎡", note: "44.18평" },
    ],
  },
  "101B": {
    label: "101B",
    title: "실사용 약 165.64㎡ 대형 타입",
    body: "1층 배치, 전용 101.30㎡에 넓은 테라스 서비스 면적을 더한 타입입니다.",
    households: "총 27세대",
    image: "/assets/unit-101b-pdf.jpg?v=20260526-top-safe",
    summary: [
      { label: "층", value: "1층" },
      { label: "세대수", value: "27세대" },
      { label: "전용면적", value: "101.3045㎡", note: "30.64평" },
      { label: "공급면적", value: "126.5834㎡", note: "38.29평" },
      { label: "서비스면적", value: "64.3372㎡", note: "19.46평" },
      { label: "실사용면적", value: "165.6417㎡", note: "50.11평" },
    ],
  },
};

const unitOrder: UnitKey[] = ["84A", "84B", "84C", "84D", "84E", "84F", "84G", "93", "98", "101A", "101B"];
const leadTypeOptions = [...unitOrder, "상담 후 결정"];
const launchVideoUrl = "https://www.youtube.com/embed/zlkLa8TpfUI?autoplay=1&mute=1&playsinline=1&rel=0";
const inquiryPhone = "1544-7006";
const inquiryPhoneHref = `tel:${inquiryPhone.replace(/-/g, "")}`;
const naverMapUrl = "https://naver.me/xFLzjQKa";
const leadStorageKey = "sokcho-landing2-leads";
const smsSettingsStorageKey = "sokcho-landing2-sms-settings";
const adPopupStorageKey = "sokcho-landing2-web-ad-hidden-date";
const webAdBannerSrc = "/assets/web-ad-banner.png?v=20260527";
const duplicateReservationMessage = "이미 방문예약 접수된 고객입니다.";
const defaultSmsBodyTemplate = `안녕하세요, {{name}} 고객님
속초 중앙하이츠 THE 228 입니다.
방문 날짜/일정 : {{visitDate}} {{visitTime}}
모델하우스를 방문하셔서, 해당 문자 메시지를 보여주시면 친절히 안내 및 상담 도와드리겠습니다.
감사합니다.`;
const defaultSmsSettings: SmsSettings = {
  enabled: false,
  subject: "속초 중앙하이츠 THE 228 방문예약",
  bodyTemplate: defaultSmsBodyTemplate,
  imageId: "",
};
const smsTemplateVariables = ["{{name}}", "{{phone}}", "{{visitDate}}", "{{visitTime}}", "{{type}}"];
const visitTimeOptions: VisitTimeOption[] = [
  { value: "10:00", label: "오전 10시" },
  { value: "11:00", label: "오전 11시" },
  { value: "12:00", label: "오후 12시" },
  { value: "13:00", label: "오후 1시" },
  { value: "14:00", label: "오후 2시" },
  { value: "15:00", label: "오후 3시" },
  { value: "16:00", label: "오후 4시" },
  { value: "17:00", label: "오후 5시" },
  { value: "18:00", label: "오후 6시" },
  { value: "19:00", label: "오후 7시" },
];

function readLocalLeads(): LeadSubmission[] {
  try {
    const raw = window.localStorage.getItem(leadStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalLeads(leads: LeadSubmission[]) {
  window.localStorage.setItem(leadStorageKey, JSON.stringify(leads));
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
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

function readLocalSmsSettings(): SmsSettings {
  try {
    const raw = window.localStorage.getItem(smsSettingsStorageKey);
    return raw ? normalizeSmsSettings(JSON.parse(raw)) : defaultSmsSettings;
  } catch {
    return defaultSmsSettings;
  }
}

function writeLocalSmsSettings(settings: SmsSettings) {
  window.localStorage.setItem(smsSettingsStorageKey, JSON.stringify(settings));
}

async function fetchLeads(): Promise<LeadSubmission[]> {
  try {
    const response = await fetch("/api/leads");
    if (!response.ok) {
      throw new Error("API unavailable");
    }
    const data = await response.json();
    return Array.isArray(data.leads) ? data.leads : [];
  } catch {
    return readLocalLeads();
  }
}

async function saveLead(input: LeadInput): Promise<LeadSubmission> {
  try {
    const response = await fetch("/api/leads", {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiRequestError(data?.message ?? "API unavailable", response.status);
    }
    const data = await response.json();
    return data.lead;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      throw error;
    }

    const localLeads = readLocalLeads();
    const normalizedPhone = normalizePhone(input.phone);
    const hasDuplicate = localLeads.some((lead) => normalizePhone(lead.phone) === normalizedPhone);

    if (hasDuplicate) {
      throw new Error(duplicateReservationMessage);
    }

    const lead: LeadSubmission = {
      ...input,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      source: "landing2-resort-magazine",
      smsStatus: "skipped",
      smsSentAt: null,
      smsError: null,
      smsMessageId: null,
    };
    writeLocalLeads([lead, ...localLeads]);
    return lead;
  }
}

async function deleteLeads(ids?: string[]) {
  const targetIds = ids?.filter(Boolean) ?? [];
  const response = await fetch("/api/leads", {
    body: targetIds.length > 0 ? JSON.stringify({ ids: targetIds }) : undefined,
    headers: targetIds.length > 0 ? { "Content-Type": "application/json" } : undefined,
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "접수 내역 삭제 중 오류가 발생했습니다.");
  }

  if (targetIds.length > 0) {
    const idSet = new Set(targetIds);
    writeLocalLeads(readLocalLeads().filter((lead) => !idSet.has(lead.id)));
  } else {
    writeLocalLeads([]);
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTodayDateValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function getVisitTimeLabel(value?: string) {
  return visitTimeOptions.find((option) => option.value === value)?.label ?? value ?? "";
}

function formatVisitDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatVisitSchedule(lead: LeadSubmission) {
  const schedule = [formatVisitDate(lead.visitDate), getVisitTimeLabel(lead.visitTime)].filter(Boolean).join(" ");
  return schedule || "-";
}

function getSmsStatusLabel(status?: SmsStatus) {
  switch (status) {
    case "sent":
      return "발송완료";
    case "failed":
      return "발송실패";
    case "pending":
      return "대기";
    case "skipped":
      return "발송안함";
    case "not_configured":
    default:
      return "설정필요";
  }
}

function renderSmsPreview(template: string) {
  const sampleValues: Record<string, string> = {
    name: "홍길동",
    phone: "010-0000-0000",
    visitDate: formatVisitDate(getTodayDateValue()),
    visitTime: "오전 10시",
    type: "84A",
  };

  return template.replace(/\{\{\s*(name|phone|visitDate|visitTime|type)\s*\}\}/g, (_, key: string) => sampleValues[key] ?? "");
}

function downloadCsv(leads: LeadSubmission[]) {
  const headers = ["접수일시", "이름", "연락처", "방문 일정", "관심 타입", "문자 상태", "문자 오류", "저장 위치"];
  const rows = leads.map((lead) => [
    formatDateTime(lead.createdAt),
    lead.name,
    lead.phone,
    formatVisitSchedule(lead),
    lead.type,
    getSmsStatusLabel(lead.smsStatus),
    lead.smsError ?? "",
    lead.source,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sokcho-the228-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function scrollToHash(hash: string) {
  const element = document.querySelector(hash);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getTodayStorageDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shouldShowWebAdPopup() {
  try {
    return window.localStorage.getItem(adPopupStorageKey) !== getTodayStorageDate();
  } catch {
    return true;
  }
}

async function fetchSmsSettings(): Promise<SmsSettings> {
  try {
    const response = await fetch("/api/sms-template");
    if (!response.ok) {
      throw new Error("API unavailable");
    }
    const data = await response.json();
    return normalizeSmsSettings(data.settings);
  } catch {
    return readLocalSmsSettings();
  }
}

async function saveSmsSettings(settings: SmsSettings): Promise<SmsSettings> {
  const normalized = normalizeSmsSettings(settings);

  try {
    const response = await fetch("/api/sms-template", {
      body: JSON.stringify(normalized),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message ?? "API unavailable");
    }

    const data = await response.json();
    return normalizeSmsSettings(data.settings);
  } catch (error) {
    writeLocalSmsSettings(normalized);
    throw error instanceof Error ? error : new Error("문자 설정 저장 중 오류가 발생했습니다.");
  }
}

function Header() {
  return (
    <header className="site-header lux-header">
      <a className="brand lux-brand" href="#top" aria-label="속초 중앙하이츠 THE 228 홈">
        <img className="brand-logo" src="/assets/Sokcho-logo.png" alt="속초 중앙하이츠 THE 228" />
        <span className="brand-copy">
          <span>SOKCHO THE 228</span>
          <strong>PREMIUM TERRACE HOUSE</strong>
        </span>
      </a>
      <nav className="nav-links lux-nav" aria-label="주요 메뉴">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="lux-header-actions">
        <a className="header-cta header-video" href={inquiryPhoneHref} aria-label={`전화 상담 ${inquiryPhone}`}>
          <Phone size={17} />
          {inquiryPhone}
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="lux-hero" id="top">
      <div className="lux-hero-media" />
      <div className="lux-hero-shade" />
      <div className="lux-hero-inner">
        <div className="lux-hero-copy">
          <p className="lux-eyebrow">PREMIUM TERRACE HOUSE</p>
          <h1>
            설악의 능선과
            <br />
            동해의 빛을 담은
            <br />
            <span>THE 228</span>
          </h1>
          <p>
            속초 중앙하이츠 THE 228을 휴양지의 하루처럼 읽는 새로운 랜딩페이지.
            숲, 바다, 테라스가 이어지는 228세대의 리조트 라이프를 소개합니다.
          </p>
          <div className="lux-hero-actions">
            <button className="btn btn-gold" onClick={() => scrollToHash("#lead")}>
              방문예약 <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost" onClick={() => scrollToHash("#summary")}>
              입지 자세히 보기
            </button>
          </div>
        </div>

        <aside className="lux-hero-panel" aria-label="핵심 프리미엄 요약">
          <span>THE VALUE</span>
          <strong>228세대의 낮은 밀도와 테라스 라이프</strong>
          <dl>
            <div>
              <dt>총 세대수</dt>
              <dd>228세대</dd>
            </div>
            <div>
              <dt>주택형</dt>
              <dd>84~101㎡</dd>
            </div>
            <div>
              <dt>접근성</dt>
              <dd>속초IC 약 1km</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="lux-feature-strip" aria-label="핵심 사업 정보">
        {heroStats.map(({ value, detail, icon: Icon }) => (
          <article key={value}>
            <Icon size={28} aria-hidden="true" />
            <div>
              <strong>{value}</strong>
              <span>{detail}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Summary() {
  return (
    <section className="lux-section lux-about" id="summary">
      <div className="lux-section-inner lux-about-grid">
        <div className="lux-copy-block">
          <span className="section-label">ABOUT THE 228</span>
          <h2>집이라기보다, 자주 돌아오고 싶은 속초의 한 장면</h2>
          <p>
            설악의 능선이 하루의 배경이 되고, 동해의 바람이 테라스까지 닿는 곳.
            속초 중앙하이츠 THE 228은 주거와 휴식의 경계를 부드럽게 잇는 저층형 테라스 하우스입니다.
          </p>
          <button className="lux-outline-button" type="button" onClick={() => scrollToHash("#premium")}>
            프리미엄 보기 <ArrowRight size={16} />
          </button>
        </div>

        <div className="lux-about-list">
          {premiumCards.map(({ title, body, icon: Icon }) => (
            <article key={title}>
              <Icon size={30} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="lux-image-row" aria-label="속초 중앙하이츠 THE 228 주요 이미지">
        {[
          { src: "/assets/complex-wide.jpg", title: "낮은 밀도" },
          { src: "/assets/sea-mountain-panorama.jpg?v=20260526094252", title: "설악과 동해" },
          { src: "/assets/summary-terrace-view.jpg", title: "테라스 하우스" },
          { src: "/assets/interior-overview.jpg", title: "입체적 공간" },
        ].map((item) => (
          <figure key={item.title}>
            <img src={item.src} alt={`${item.title} 이미지`} />
            <figcaption>{item.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Premium() {
  return (
    <section className="lux-premium-band" id="premium">
      <img src="/assets/summary-terrace-view.jpg" alt="속초 중앙하이츠 THE 228 테라스 하우스 조감 이미지" />
      <div className="lux-premium-overlay" />
      <div className="lux-premium-copy">
        <span className="section-label">PREMIUM 01</span>
        <h2>주말의 여행감과 일상의 편의가 같은 주소 안에 있습니다</h2>
        <p>입지, 자연, 생활 인프라, 특화 설계를 고급 분양 랜딩의 흐름으로 다시 정돈했습니다.</p>
        <div className="lux-premium-metrics">
          <div>
            <span>PRIVATE</span>
            <strong>228</strong>
            <em>총 세대수</em>
          </div>
          <div>
            <span>TYPE</span>
            <strong>84~101㎡</strong>
            <em>다양한 주택형</em>
          </div>
          <div>
            <span>ACCESS</span>
            <strong>약 1km</strong>
            <em>속초IC 접근성</em>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueSection() {
  return (
    <section className="lux-section lux-premium-icons">
      <div className="lux-section-inner">
        <div className="lux-section-heading">
          <span className="section-label">PREMIUM 02</span>
          <h2>희소한 입지가 선사하는 특별함</h2>
          <p>속초IC, 설악과 동해, 테라스 특화 공간이 하나의 생활권 안에서 연결됩니다.</p>
        </div>
        <div className="lux-icon-grid">
          {[
            { icon: Train, title: "교통 프리미엄", body: premiumCards[0].body },
            { icon: Mountain, title: "자연 프리미엄", body: premiumCards[1].body },
            { icon: MapPin, title: "생활 프리미엄", body: premiumCards[2].body },
            { icon: House, title: "공간 프리미엄", body: premiumCards[3].body },
            { icon: Building2, title: "저층 단지", body: heroStats[1].detail },
            { icon: Compass, title: "세컨드 라이프", body: heroStats[3].detail },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon size={34} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MostValuableSection() {
  return (
    <section className="lux-section lux-scenes" id="valuable" aria-labelledby="valuable-title">
      <div className="lux-section-inner">
        <div className="lux-scenes-head">
          <div>
            <span className="section-label">SPACE & LOCATION</span>
            <h2 id="valuable-title">공간의 품격을 높이는 장면들</h2>
          </div>
          <p>
            속초 중앙하이츠 THE 228의 입지, 조망, 테라스 특화 요소를 큰 이미지 중심으로 보여줍니다.
          </p>
        </div>
        <div className="lux-scene-grid">
          {valueCards.map((card, index) => (
            <article className={index === 0 ? "wide" : ""} key={card.title}>
              <img src={card.image} alt={`${card.title} 이미지`} />
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LifeSection() {
  return (
    <section className="lux-community" id="life">
      <div className="lux-community-inner">
        <div className="lux-community-copy">
          <span className="section-label">COMMUNITY</span>
          <h2>테라스, 다락, 커뮤니티가 머무는 시간을 길게 만듭니다</h2>
          <p>
            낮은 밀도의 단지 안에서 가족의 취향이 자연스럽게 드러납니다.
            실내의 편안함과 야외의 개방감을 이어주는 장면들을 살펴보세요.
          </p>
          <button className="lux-outline-button dark" type="button" onClick={() => scrollToHash("#lead")}>
            방문 상담 예약 <ArrowRight size={16} />
          </button>
        </div>
        <div className="lux-community-gallery">
          {[
            { title: lifeCards[0].title, body: lifeCards[0].body, image: lifeCards[0].image },
            { title: lifeCards[1].title, body: lifeCards[1].body, image: "/assets/community-main.jpg" },
            { title: "LIVING ROOM", body: valuableFeatures[0].title, image: "/assets/valuable-02-living-room.png" },
            { title: "SPECIAL SPACE", body: valuableFeatures[3].title, image: "/assets/valuable-05-study.jpg" },
          ].map((card) => (
            <article key={card.title}>
              <img src={card.image} alt={`${card.title} 이미지`} />
              <div>
                <span>{card.title}</span>
                <h3>{card.body}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function UnitPlan() {
  const [selected, setSelected] = useState<UnitKey>("84A");
  const [isPlanVisible, setIsPlanVisible] = useState(false);
  const [isLoftDetailVisible, setIsLoftDetailVisible] = useState(false);
  const unitKeys = useMemo(() => unitOrder, []);
  const unit = unitPlans[selected];
  const currentPlanImage = unit.loftDetailImage && isPlanVisible && isLoftDetailVisible ? unit.loftDetailImage : unit.image;
  const currentPlanLabel = unit.loftDetailImage && isPlanVisible && isLoftDetailVisible ? "다락 상세정보" : "기본 평면도";

  useEffect(() => {
    setIsLoftDetailVisible(false);

    if (!isPlanVisible || !unit.loftDetailImage) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setIsLoftDetailVisible((visible) => !visible);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isPlanVisible, unit.loftDetailImage]);

  const handleShowPlan = () => {
    setIsLoftDetailVisible(false);
    setIsPlanVisible(true);
    window.requestAnimationFrame(() => {
      document.getElementById("unit-plan-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <section className="lux-section lux-unit" id="unit">
      <div className="lux-section-inner">
        <div className="lux-scenes-head">
          <div>
            <span className="section-label">UNIT PLAN</span>
            <h2>84㎡부터 101㎡까지, 테라스와 다락을 더한 실용적 공간 설계</h2>
          </div>
          <p>선택한 타입의 평면과 요약 정보를 한 화면에서 확인할 수 있습니다.</p>
        </div>

        <div className="unit-layout lux-unit-layout">
          <div className="unit-tabs lux-unit-tabs" role="tablist" aria-label="세대 타입 선택">
            {unitKeys.map((key) => (
              <button
                key={key}
                className={key === selected ? "active" : ""}
                onClick={() => {
                  setSelected(key);
                  setIsPlanVisible(false);
                  setIsLoftDetailVisible(false);
                }}
                role="tab"
                aria-selected={key === selected}
              >
                {unitPlans[key].label}
              </button>
            ))}
          </div>

          <div className="unit-card lux-unit-card">
            <div className="unit-copy lux-unit-copy">
              <span>{unit.households}</span>
              <h3>{unit.label} TYPE</h3>
              <p>{unit.title}</p>
              <small>{unit.body}</small>
              <dl className="unit-summary-grid lux-unit-summary">
                {unit.summary.slice(0, 4).map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>
                      {item.value}
                      {item.note && <small>{item.note}</small>}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                className="link-button lux-unit-more"
                onClick={handleShowPlan}
                aria-controls="unit-plan-detail"
                aria-expanded={isPlanVisible}
              >
                {unit.loftDetailImage ? "다락 상세 전환" : "평면 크게 보기"} <ChevronRight size={16} />
              </button>
            </div>

            <figure
              className="unit-image lux-unit-image is-visible"
              id="unit-plan-detail"
              aria-label={`${unit.label} ${currentPlanLabel}`}
              aria-live="polite"
            >
              <img src={currentPlanImage} alt={`${unit.label} ${currentPlanLabel}`} />
              <figcaption>{currentPlanLabel}</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeadSection() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [draftVisitTime, setDraftVisitTime] = useState("");
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const todayDateValue = useMemo(() => getTodayDateValue(), []);
  const selectedVisitTimeLabel = getVisitTimeLabel(visitTime);

  useEffect(() => {
    if (!isTimeModalOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsTimeModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTimeModalOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();
    const visitDateValue = String(formData.get("visitDate") ?? "").trim();
    const visitTimeValue = String(formData.get("visitTime") ?? "").trim();

    if (!visitDateValue || !visitTimeValue) {
      setSubmitted(false);
      setSubmitError("방문 희망 날짜와 시간을 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await saveLead({ name, phone, type, visitDate: visitDateValue, visitTime: visitTimeValue });
      setSubmitted(true);
      setVisitDate("");
      setVisitTime("");
      setDraftVisitTime("");
      form.reset();
    } catch (error) {
      setSubmitted(false);
      setSubmitError(error instanceof Error ? error.message : "접수 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="lead lux-lead" id="lead">
      <div className="lead-copy lux-lead-copy">
        <span className="section-label">CONTACT</span>
        <h2>이번 주말, 속초의 다음 주소를 직접 확인해 보세요</h2>
        <p>리조트처럼 머무는 테라스 라이프가 궁금하다면 방문 상담 일정을 남겨주세요.</p>
        <div className="lead-points">
          <span><Phone size={18} /> {inquiryPhone}</span>
          <span><CalendarDays size={18} /> 방문 상담 예약</span>
          <span><ShieldCheck size={18} /> 개인정보 동의 후 접수</span>
        </div>
        <figure className="lead-benefit-visual">
          <img
            src="/assets/gift.png?v=20260527"
            alt="방문 상담만 해도 사은품 증정, 방문 고객 한정 혜택 안내"
          />
        </figure>
      </div>
      <form className="lead-form lux-lead-form" onSubmit={handleSubmit}>
        <label>
          이름
          <input name="name" placeholder="홍길동" required />
        </label>
        <label>
          연락처
          <input name="phone" placeholder="010-0000-0000" required inputMode="tel" />
        </label>
        <div className="schedule-field">
          <div className="schedule-grid">
            <label>
              방문 날짜
              <input
                name="visitDate"
                type="date"
                min={todayDateValue}
                value={visitDate}
                onChange={(event) => {
                  setVisitDate(event.currentTarget.value);
                  setSubmitted(false);
                }}
                required
              />
            </label>
            <div className="time-field">
              <span>방문 시간</span>
              <input name="visitTime" type="hidden" value={visitTime} readOnly />
              <button
                className={`time-select-button${visitTime ? " selected" : ""}`}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isTimeModalOpen}
                onClick={() => {
                  setDraftVisitTime(visitTime);
                  setIsTimeModalOpen(true);
                  setSubmitted(false);
                }}
              >
                <span>{selectedVisitTimeLabel || "시간 선택"}</span>
                <Clock size={18} />
              </button>
            </div>
          </div>
        </div>
        <label>
          관심 타입
          <select name="type" defaultValue="84A">
            {leadTypeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="agree">
          <input type="checkbox" required />
          개인정보 수집 및 이용에 동의합니다.
        </label>
        <button className="btn btn-gold" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중" : "방문예약 등록"} <ArrowRight size={18} />
        </button>
        {isTimeModalOpen && (
          <div
            className="time-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visit-time-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsTimeModalOpen(false);
              }
            }}
          >
            <div className="time-modal-panel">
              <div className="time-modal-head">
                <h3 id="visit-time-title">방문 희망 시간 선택</h3>
                <p>방문을 희망하시는 시간을 선택해 주세요.</p>
              </div>
              <div className="time-options" role="radiogroup" aria-label="방문 희망 시간">
                {visitTimeOptions.map((option) => (
                  <button
                    className={`time-option${draftVisitTime === option.value ? " active" : ""}`}
                    type="button"
                    key={option.value}
                    disabled={option.disabled}
                    role="radio"
                    aria-checked={draftVisitTime === option.value}
                    onClick={() => setDraftVisitTime(option.value)}
                  >
                    <span className="time-radio" aria-hidden="true" />
                    <span className="time-label">{option.label}</span>
                    {option.status && <span className="time-status">{option.status}</span>}
                  </button>
                ))}
              </div>
              <div className="time-actions">
                <button className="time-cancel" type="button" onClick={() => setIsTimeModalOpen(false)}>
                  취소
                </button>
                <button
                  className="time-complete"
                  type="button"
                  disabled={!draftVisitTime}
                  onClick={() => {
                    setVisitTime(draftVisitTime);
                    setIsTimeModalOpen(false);
                  }}
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        )}
        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}
        {submitted && (
          <p className="form-success" role="status">
            <CheckCircle2 size={18} /> 접수가 완료되었습니다. 확인 후 안내드리겠습니다.
          </p>
        )}
      </form>
    </section>
  );
}

function FloatingQuick() {
  return (
    <nav className="floating-quick" aria-label="하단 빠른 메뉴">
      <a className="floating-bar-action" href={naverMapUrl} target="_blank" rel="noreferrer" aria-label="홍보관 위치보기">
        <MapPin size={22} />
        <span>홍보관 위치보기</span>
      </a>
      <a className="floating-bar-brand" href="#top" aria-label="속초 중앙하이츠 THE 228 홈">
        <strong>Sokcho THE 228</strong>
        <span>속초 중앙하이츠</span>
      </a>
      <button
        className="floating-bar-action floating-bar-reservation"
        type="button"
        onClick={() => scrollToHash("#lead")}
        aria-label="홍보관 방문 예약하기"
      >
        <CalendarDays size={22} />
        <span>홍보관 방문 예약하기</span>
        <ChevronRight className="floating-bar-chevron" size={17} />
      </button>
    </nav>
  );
}

function AdminPage() {
  const [leads, setLeads] = useState<LeadSubmission[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState("");
  const [smsSettings, setSmsSettings] = useState<SmsSettings>(defaultSmsSettings);
  const [isSmsLoading, setIsSmsLoading] = useState(true);
  const [isSmsSaving, setIsSmsSaving] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");

  async function loadLeads() {
    setIsLoading(true);
    setAdminMessage("");
    try {
      setLeads(await fetchLeads());
      setSelectedLeadIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSmsTemplate() {
    setIsSmsLoading(true);
    setSmsMessage("");
    try {
      setSmsSettings(await fetchSmsSettings());
    } finally {
      setIsSmsLoading(false);
    }
  }

  async function handleClear() {
    const confirmed = window.confirm("저장된 관심고객 접수 내역을 모두 삭제할까요?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteLeads();
      setLeads([]);
      setSelectedLeadIds(new Set());
      setAdminMessage("접수 내역을 삭제했습니다.");
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "접수 내역 삭제 중 오류가 발생했습니다.");
    }
  }

  async function handleDeleteSelected() {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) {
      return;
    }

    const confirmed = window.confirm(`선택한 ${ids.length}건의 접수 내역을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteLeads(ids);
      const idSet = new Set(ids);
      setLeads((items) => items.filter((lead) => !idSet.has(lead.id)));
      setSelectedLeadIds(new Set());
      setAdminMessage(`선택한 ${ids.length}건을 삭제했습니다.`);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "선택 삭제 중 오류가 발생했습니다.");
    }
  }

  function toggleLeadSelection(id: string, selected: boolean) {
    setSelectedLeadIds((current) => {
      const next = new Set(current);

      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  function toggleAllVisibleLeads(selected: boolean) {
    setSelectedLeadIds(selected ? new Set(leads.map((lead) => lead.id)) : new Set());
  }

  async function handleSmsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistSmsSettings(smsSettings, "문자 설정을 저장했습니다.", smsSettings);
  }

  async function persistSmsSettings(nextSettings: SmsSettings, successMessage: string, fallbackSettings: SmsSettings) {
    setIsSmsSaving(true);
    setSmsMessage("");

    try {
      const saved = await saveSmsSettings(nextSettings);
      setSmsSettings(saved);
      setSmsMessage(successMessage);
    } catch (error) {
      setSmsSettings(fallbackSettings);
      setSmsMessage(error instanceof Error ? error.message : "문자 설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSmsSaving(false);
    }
  }

  async function handleSmsEnabledChange(enabled: boolean) {
    const previousSettings = smsSettings;
    const nextSettings = { ...smsSettings, enabled };
    setSmsSettings(nextSettings);
    await persistSmsSettings(
      nextSettings,
      enabled ? "자동 문자 발송을 켰습니다." : "자동 문자 발송을 껐습니다.",
      previousSettings,
    );
  }

  useEffect(() => {
    void loadLeads();
    void loadSmsTemplate();
  }, []);

  const latestLead = leads[0];
  const today = new Date().toDateString();
  const todayCount = leads.filter((lead) => new Date(lead.createdAt).toDateString() === today).length;
  const smsPreview = useMemo(() => renderSmsPreview(smsSettings.bodyTemplate), [smsSettings.bodyTemplate]);
  const selectedCount = selectedLeadIds.size;
  const allVisibleSelected = leads.length > 0 && leads.every((lead) => selectedLeadIds.has(lead.id));

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-top">
          <div>
            <span className="section-label">ADMIN</span>
            <h1>관심고객 접수 관리</h1>
            <p>랜딩페이지에서 등록된 상담 신청 내역을 확인합니다.</p>
          </div>
          <button className="admin-back" type="button" onClick={() => { window.location.hash = "#top"; }}>
            <ArrowLeft size={18} /> 현장 페이지
          </button>
        </div>

        <div className="admin-stats">
          <article>
            <span>전체 접수</span>
            <strong>{leads.length}</strong>
          </article>
          <article>
            <span>오늘 접수</span>
            <strong>{todayCount}</strong>
          </article>
          <article>
            <span>최근 접수</span>
            <strong>{latestLead ? formatDateTime(latestLead.createdAt) : "-"}</strong>
          </article>
        </div>

        <form className="admin-sms-settings" onSubmit={handleSmsSubmit}>
          <div className="admin-sms-head">
            <div>
              <span className="section-label">SMS</span>
              <h2><MessageSquare size={22} /> 문자 설정</h2>
              <p>방문예약 저장 후 고객에게 발송되는 SOLAPI MMS 문구를 관리합니다.</p>
            </div>
            <label className="admin-sms-toggle">
              <input
                type="checkbox"
                disabled={isSmsSaving || isSmsLoading}
                checked={smsSettings.enabled}
                onChange={(event) => {
                  void handleSmsEnabledChange(event.currentTarget.checked);
                }}
              />
              <span>{smsSettings.enabled ? "자동 발송 ON" : "자동 발송 OFF"}</span>
            </label>
          </div>

          <div className="admin-sms-grid">
            <label>
              제목
              <input
                value={smsSettings.subject}
                maxLength={80}
                onChange={(event) => {
                  const subject = event.currentTarget.value;
                  setSmsSettings((settings) => ({ ...settings, subject }));
                }}
              />
            </label>
            <label>
              MMS imageId
              <input
                value={smsSettings.imageId}
                placeholder="SOLAPI Storage 업로드 후 imageId 입력"
                maxLength={80}
                onChange={(event) => {
                  const imageId = event.currentTarget.value;
                  setSmsSettings((settings) => ({ ...settings, imageId }));
                }}
              />
            </label>
          </div>

          <label className="admin-sms-body">
            본문 템플릿
            <textarea
              value={smsSettings.bodyTemplate}
              rows={8}
              maxLength={1800}
              onChange={(event) => {
                const bodyTemplate = event.currentTarget.value;
                setSmsSettings((settings) => ({ ...settings, bodyTemplate }));
              }}
            />
          </label>

          <div className="admin-sms-meta">
            <div className="admin-sms-vars" aria-label="사용 가능한 변수">
              {smsTemplateVariables.map((variable) => (
                <code key={variable}>{variable}</code>
              ))}
            </div>
            <div className="admin-sms-preview">
              <strong>미리보기</strong>
              <pre>{smsPreview}</pre>
            </div>
          </div>

          <div className="admin-sms-actions">
            <button
              type="button"
              onClick={() => setSmsSettings((settings) => ({ ...settings, bodyTemplate: defaultSmsBodyTemplate }))}
            >
              기본 문구
            </button>
            <button type="submit" disabled={isSmsSaving || isSmsLoading}>
              <Save size={17} /> {isSmsSaving ? "저장 중" : "문자 설정 저장"}
            </button>
          </div>

          {smsMessage && <p className="admin-message">{smsMessage}</p>}
        </form>

        <div className="admin-toolbar">
          <button type="button" onClick={loadLeads}>
            <RefreshCw size={17} /> 새로고침
          </button>
          <button type="button" onClick={() => downloadCsv(leads)} disabled={leads.length === 0}>
            <Download size={17} /> CSV 다운로드
          </button>
          <button className="admin-danger" type="button" onClick={handleDeleteSelected} disabled={selectedCount === 0}>
            <Trash2 size={17} /> 선택 삭제{selectedCount > 0 ? ` ${selectedCount}` : ""}
          </button>
          <button className="admin-danger" type="button" onClick={handleClear} disabled={leads.length === 0}>
            <Trash2 size={17} /> 전체 삭제
          </button>
        </div>

        {adminMessage && <p className="admin-message">{adminMessage}</p>}

        <div className="admin-table-wrap">
          {isLoading ? (
            <div className="admin-empty">접수 내역을 불러오는 중입니다.</div>
          ) : leads.length === 0 ? (
            <div className="admin-empty">아직 저장된 관심고객 접수 내역이 없습니다.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-select-cell">
                    <input
                      type="checkbox"
                      aria-label="접수 내역 전체 선택"
                      checked={allVisibleSelected}
                      onChange={(event) => toggleAllVisibleLeads(event.currentTarget.checked)}
                    />
                  </th>
                  <th>접수일시</th>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>방문 일정</th>
                  <th>관심 타입</th>
                  <th>문자 상태</th>
                  <th>저장 위치</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="admin-select-cell">
                      <input
                        type="checkbox"
                        aria-label={`${lead.name} 접수 내역 선택`}
                        checked={selectedLeadIds.has(lead.id)}
                        onChange={(event) => toggleLeadSelection(lead.id, event.currentTarget.checked)}
                      />
                    </td>
                    <td>{formatDateTime(lead.createdAt)}</td>
                    <td>{lead.name}</td>
                    <td><a href={`tel:${lead.phone}`}>{lead.phone}</a></td>
                    <td>{formatVisitSchedule(lead)}</td>
                    <td><span className="admin-chip">{lead.type}</span></td>
                    <td>
                      <span className={`admin-sms-status ${lead.smsStatus ?? "not_configured"}`}>
                        {getSmsStatusLabel(lead.smsStatus)}
                      </span>
                      {lead.smsError && <small className="admin-sms-error">{lead.smsError}</small>}
                    </td>
                    <td>{lead.source === "browser-storage" ? "브라우저 임시 저장" : "관리자 페이지 저장"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="admin-note">
          접수 내역은 관리자 페이지 저장 방식으로 보관되며, 배포된 사이트에서도 이 화면에서 확인할 수 있습니다.
        </p>
      </section>
    </main>
  );
}

function WebAdPopup({
  onClose,
  onHideToday,
}: {
  onClose: () => void;
  onHideToday: () => void;
}) {
  return (
    <div
      className="ad-popup"
      role="dialog"
      aria-modal="true"
      aria-label="속초 중앙하이츠 THE 228 웹광고 배너"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="ad-popup-panel">
        <div className="ad-popup-visual">
          <img
            src={webAdBannerSrc}
            alt="속초 중앙하이츠 THE 228 프리미엄 테라스 하우스 혜택 안내"
          />
        </div>
        <div className="ad-popup-actions">
          <button type="button" className="ad-popup-today" onClick={onHideToday}>
            오늘하루보지않기
          </button>
          <button type="button" className="ad-popup-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function LaunchVideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="video-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-video-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="video-modal-panel">
        <div className="video-modal-header">
          <div>
            <span>UNIT VIDEO</span>
            <h2 id="launch-video-title">속초 중앙하이츠 THE 228 유니트 영상</h2>
          </div>
          <button className="video-modal-close" type="button" onClick={onClose} aria-label="영상 팝업 닫기">
            <X size={22} />
          </button>
        </div>
        <div className="video-modal-frame">
          <iframe
            src={launchVideoUrl}
            title="속초 중앙하이츠 THE 228 YouTube Shorts"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <button className="video-modal-dismiss" type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || "#top");
  const [showAdPopup, setShowAdPopup] = useState(() => window.location.hash !== "#admin" && shouldShowWebAdPopup());
  const [showLaunchVideo, setShowLaunchVideo] = useState(false);
  const isAdminPage = currentHash === "#admin";

  useEffect(() => {
    function handleHashChange() {
      const nextHash = window.location.hash || "#top";
      setCurrentHash(nextHash);
      if (nextHash === "#admin") {
        setShowAdPopup(false);
        setShowLaunchVideo(false);
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const hasOpenPopup = showAdPopup || showLaunchVideo;

    if (!hasOpenPopup || isAdminPage) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showAdPopup) {
          setShowAdPopup(false);
        } else {
          setShowLaunchVideo(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAdminPage, showAdPopup, showLaunchVideo]);

  function handleHideAdToday() {
    try {
      window.localStorage.setItem(adPopupStorageKey, getTodayStorageDate());
    } catch {
      // The popup can still close even if storage is unavailable.
    }
    setShowAdPopup(false);
  }

  if (isAdminPage) {
    return <AdminPage />;
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Summary />
        <Premium />
        <ValueSection />
        <MostValuableSection />
        <LifeSection />
        <UnitPlan />
        <LeadSection />
      </main>
      <FloatingQuick />
      {showAdPopup && <WebAdPopup onClose={() => setShowAdPopup(false)} onHideToday={handleHideAdToday} />}
      {showLaunchVideo && <LaunchVideoModal onClose={() => setShowLaunchVideo(false)} />}
      <footer className="site-footer simple-footer">
        <div className="simple-footer-inner">
          <img className="footer-logo" src="/assets/Sokcho-logo.png" alt="속초 중앙하이츠 THE 228" />

          <div className="simple-footer-phone">
            <span>대표/문의</span>
            <a href={inquiryPhoneHref}>{inquiryPhone}</a>
          </div>

          <div className="simple-footer-copy">
            <p>본 홈페이지의 내용은 소비자의 이해를 돕기 위한 것으로 실제와 차이가 있을 수 있습니다.</p>
            <p>현장주소 : 강원도 속초시 장사동 661 | 시행수탁자 : 교보자산신탁(주) | 시공 : 대신건설(주) | 시행위탁자 : 천마이엔씨건설(주)</p>
            <p>견본주택을 방문하셔서 직접 확인하시기 바랍니다.</p>
            <p>Copyrights © 2026 속초 중앙하이츠 THE228. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
