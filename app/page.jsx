"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "hscomet-ta-schedule-v2";
const LOGIN_TA_KEY = "hscomet-login-ta"; // 이 기기에서 로그인 유지 (조교)
const LOGIN_ADMIN_KEY = "hscomet-login-admin"; // 이 기기에서 로그인 유지 (관리자)
const ADMIN_PASSWORD = "hscomet102"; // 처음 기본값 (관리 → 관리자 비밀번호에서 변경 가능, DB에 저장)
const SUPABASE_STATE_ID = "main";
const SUPABASE_URL_FALLBACK = "https://msdikmalqkhmkwqzbpkm.supabase.co";
const SUPABASE_ANON_KEY_FALLBACK = "sb_publishable_TmBNhYVTTgcsaeGavMkgeQ_QbIAmlTM";

const supabaseUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_FALLBACK
    : SUPABASE_URL_FALLBACK;
const supabaseAnonKey =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK
    : SUPABASE_ANON_KEY_FALLBACK;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// 혜성 코멧 학원 로고 (HS 마크, 파일 하나로 배포되도록 코드 안에 넣어둠)
const LOGO_SRC = "data:image/png;base64,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";

const NO_PERSON = "인원 없음";
const days = ["일", "월", "화", "수", "목", "금", "토"];
const classNames = ["한성 33기", "한성 34기", "한성 35기", "세종 17기", "세종 19기"];

// 기본 일정은 요일 번호(0=일 ~ 6=토)로 저장. 토·일은 기본 채워두고, 나머지 요일은 비워둠.
const defaultBaseSchedule = {
  0: [
    { id: "sun-1", title: "세종 17기", start: "09:30", end: "12:30", assistants: ["강지후", NO_PERSON] },
    { id: "sun-2", title: "한성 34기", start: "13:00", end: "16:00", assistants: ["강지후", "송은호"] },
    { id: "sun-3", title: "한성 35기", start: "16:00", end: "19:00", assistants: ["강지후", "송은호"] },
  ],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [
    { id: "sat-1", title: "한성 34기", start: "09:30", end: "12:30", assistants: ["이찬영", "송은호"] },
    { id: "sat-2", title: "한성 35기", start: "13:00", end: "16:00", assistants: ["이찬영", "정율제"] },
    { id: "sat-3", title: "한성 33기", start: "16:00", end: "19:00", assistants: ["이찬영", "정율제"] },
    { id: "sat-4", title: "세종 19기", start: "19:30", end: "22:30", assistants: ["정율제", NO_PERSON] },
  ],
};

// 저장된 옛 포맷({saturday: [...], sunday: [...]}) → 새 포맷(요일 번호 키)으로 이관
function normalizeBaseSchedule(input) {
  const base = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  if (!input || typeof input !== "object") return base;
  if (Array.isArray(input.saturday) || Array.isArray(input.sunday)) {
    if (Array.isArray(input.sunday)) base[0] = input.sunday;
    if (Array.isArray(input.saturday)) base[6] = input.saturday;
    return base;
  }
  for (let d = 0; d <= 6; d++) {
    if (Array.isArray(input[d])) base[d] = input[d];
    else if (Array.isArray(input[String(d)])) base[d] = input[String(d)];
  }
  return base;
}

const assistantSeed = ["강지후", "송은호", "정율제", "이찬영", NO_PERSON];
const assistantPasswordSeed = {
  강지후: "hscomet102",
  송은호: "hscomet102",
  정율제: "hscomet102",
  이찬영: "hscomet102",
};
const DEFAULT_ASSISTANT_PASSWORD = "hscomet102";
const HOURS_PER_CLASS = 3; // 수업 1회 = 3시간 (정산 계산 기준)

// 월화수목금토일 순 정렬용 (월=0 → 일=6)
const weekdaySortKey = (d) => (d === 0 ? 6 : d - 1);
const sortWeekdays = (arr) => [...arr].sort((a, b) => weekdaySortKey(a) - weekdaySortKey(b));

// 요일 색: 토 파랑 · 일 빨강 · 월 노랑 · 화 초록 · 그 외 요일과 추가 수업 보라
const dayTone = (w) => (w === 6 ? "sat" : w === 0 ? "sun" : w === 1 ? "mon" : w === 2 ? "tue" : "etc");
const dowOf = (key) => new Date(`${key}T00:00:00`).getDay();
const lessonTone = (l) => (l.type === "extra" ? "etc" : dayTone(dowOf(l.date)));
// 추가 수업 구분: 추가 / 직보 (예전 데이터는 수업명에 '직보'가 있으면 직보로 간주)
const kindOf = (l) => (l.type !== "extra" ? "" : l.kind || (/직보/.test(l.title || "") ? "직보" : "추가"));
// 수업명에서 기수 숫자만: "한성 34기" → "34"
const gisu = (title) => {
  const m = String(title || "").match(/(\d+)\s*기/);
  return m ? m[1] : String(title || "").replace(/^(한성|세종|심층)\s*/, "").trim();
};

// "HH:MM" + h시간 → "HH:MM" (자정을 넘으면 23:59로 제한)
function addHoursToTime(t, h) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || "");
  if (!m) return null;
  const total = Number(m[1]) * 60 + Number(m[2]) + h * 60;
  if (total >= 24 * 60) return "23:59";
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// 시급 입력 해석: 3 → 30,000 / 3.5 → 35,000 / 30000 → 30,000 (1000 미만은 '만원' 단위로 간주)
function parseHourlyRate(input) {
  const cleaned = String(input ?? "").replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n < 1000 ? n * 10000 : n);
}
// 원 → "154만원", "10.5만원"
function formatMan(won) {
  return `${parseFloat((Math.round(won) / 10000).toFixed(2))}만원`;
}
const won = (n) => Math.round(n).toLocaleString("ko-KR");

function pad(n) {
  return String(n).padStart(2, "0");
}
function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function md(key) {
  const d = new Date(`${key}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function prettyDate(key) {
  return `${md(key)}(${days[dowOf(key)]})`;
}
const EVENT_COLORS = [
  { key: "slate", label: "회색" },
  { key: "teal", label: "청록" },
  { key: "orange", label: "주황" },
  { key: "pink", label: "분홍" },
  { key: "brown", label: "갈색" },
];
function lastDayOfMonthKey(key) {
  const d = new Date(`${key}T00:00:00`);
  return dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
function eventRange(e) {
  return e.start === e.end ? md(e.start) : `${md(e.start)}–${md(e.end)}`;
}
function getMonthDates(year, month) {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function cleanAssistants(list) {
  const next = (list || []).map((x) => x || NO_PERSON);
  return next.length ? next : [NO_PERSON, NO_PERSON];
}
const byTime = (a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`);

function makeLesson({ date, title, start, end, assistants, type, id, manuallyAdded, kind }) {
  return {
    id: id || `${type}-${date}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date,
    title,
    start,
    end,
    assistants: cleanAssistants(assistants),
    type,
    kind: type === "extra" ? kind || "추가" : "",
    manuallyAdded: !!manuallyAdded,
    swap: false,
    swapRequests: [],
    swapHistory: [],
    substituteAssistants: [],
    attendance: {},
  };
}

function generateMonthLessons(year, month, baseSchedule) {
  const dates = getMonthDates(year, month).filter((d) => d.getMonth() === month - 1);
  const lessons = [];
  dates.forEach((d) => {
    const key = dateKey(d);
    const regular = (baseSchedule && baseSchedule[d.getDay()]) || [];
    regular.forEach((item, index) => {
      lessons.push(
        makeLesson({
          id: `${key}-regular-${index}`,
          date: key,
          title: item.title,
          start: item.start,
          end: item.end,
          assistants: item.assistants,
          type: "regular",
        })
      );
    });
  });
  return lessons;
}

function readLocal(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}
function writeLocal(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function AssistantSlot({ value, assistants, onChange, onRemove }) {
  return (
    <div className="hs-slot">
      <select value={value || NO_PERSON} onChange={(e) => onChange(e.target.value)}>
        <option value={NO_PERSON}>{NO_PERSON}</option>
        {assistants
          .filter((name) => name !== NO_PERSON)
          .map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        {value && value !== NO_PERSON && !assistants.includes(value) && <option value={value}>{value} (퇴직)</option>}
      </select>
      <button type="button" onClick={onRemove} aria-label="칸 삭제">
        ×
      </button>
    </div>
  );
}

// 입력 중에는 로컬로만 갖고 있다가 포커스가 빠지거나 Enter 때 반영
function TextInput({ value, onCommit, placeholder, className = "", type = "text" }) {
  const [local, setLocal] = useState(value || "");
  useEffect(() => {
    setLocal(value || "");
  }, [value]);
  return (
    <input
      type={type}
      className={className}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(local)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      placeholder={placeholder}
    />
  );
}

// 숫자에 쉼표: "30000" → "30,000" (소수점은 그대로: "3.5" → "3.5")
function withCommas(v) {
  const cleaned = String(v ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const [intPart, ...rest] = cleaned.split(".");
  const intFmt = intPart ? Number(intPart).toLocaleString("ko-KR") : "0";
  return rest.length ? `${intFmt}.${rest.join("")}` : intFmt;
}

// 금액 입력칸: 칠 때마다 쉼표가 붙고, 칸을 벗어나거나 Enter 때 숫자만 저장
function MoneyInput({ value, onCommit, placeholder }) {
  const [local, setLocal] = useState(withCommas(value));
  useEffect(() => {
    setLocal(withCommas(value));
  }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={local}
      onChange={(e) => setLocal(withCommas(e.target.value))}
      onBlur={() => onCommit(local.replace(/,/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      placeholder={placeholder}
    />
  );
}

const Icon = {
  cal: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  swap: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h14l-3-3M20 16H6l3 3" />
    </svg>
  ),
  won: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7.5 9l1.8 6 2.7-6 2.7 6 1.8-6M7 12h10" />
    </svg>
  ),
  stat: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 20V11M12 20V5M19 20v-6" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </svg>
  ),
};

export default function Page() {
  const today = new Date();
  const todayKey = dateKey(today);

  // ── 공유 데이터 (DB 저장) ──
  const [assistants, setAssistants] = useState(assistantSeed);
  const [assistantPasswords, setAssistantPasswords] = useState(assistantPasswordSeed);
  const [inactiveAssistants, setInactiveAssistants] = useState([]);
  const [baseSchedule, setBaseSchedule] = useState(defaultBaseSchedule);
  const [enabledWeekdays, setEnabledWeekdays] = useState(() => {
    const s = new Set([0, 6]);
    for (let d = 1; d <= 5; d++) if ((defaultBaseSchedule[d] || []).length > 0) s.add(d);
    return sortWeekdays([...s]);
  });
  const [lessons, setLessons] = useState(() =>
    generateMonthLessons(today.getFullYear(), today.getMonth() + 1, defaultBaseSchedule)
  );
  const [allowances, setAllowances] = useState({}); // { 이름: [{id, month:"YYYY-MM", desc, hours | amount}] }
  const [events, setEvents] = useState([]); // 수업 아닌 일정 [{id, title, start:"YYYY-MM-DD", end, color}]
  const [rates, setRates] = useState({}); // { 이름: { cls: "35000", etc: "30000" } }
  const [adminPassword, setAdminPassword] = useState(ADMIN_PASSWORD);

  // ── 이 기기 화면 상태 ──
  const [role, setRole] = useState("academy"); // academy(학원) | assistant(조교) | admin(관리자)
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [taTab, setTaTab] = useState("mine");
  const [adminTab, setAdminTab] = useState("sched");
  const [schedView, setSchedView] = useState("cal");
  const [selDay, setSelDay] = useState(todayKey);
  const [filterName, setFilterName] = useState("전체");
  const [openSection, setOpenSection] = useState("");
  const [currentAssistant, setCurrentAssistant] = useState("");
  const [assistantUnlocked, setAssistantUnlocked] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginKeep, setLoginKeep] = useState(true);
  const [loginErr, setLoginErr] = useState("");
  const [viaAdmin, setViaAdmin] = useState(false); // 관리자가 조교 화면을 보는 중
  const [taSessionPw, setTaSessionPw] = useState(""); // 이 기기에서 조교가 로그인할 때 쓴 비밀번호
  const [adminSessionPw, setAdminSessionPw] = useState(""); // 이 기기에서 관리자가 로그인할 때 쓴 비밀번호
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [bulkUntil, setBulkUntil] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 0); // 지난달 말일
    return dateKey(d);
  });
  const [saveStatus, setSaveStatus] = useState(supabase ? "DB 연결 준비 중" : "브라우저 저장 모드");
  const [storageReady, setStorageReady] = useState(false);
  const [swapApprovals, setSwapApprovals] = useState({});
  const [addWeekday, setAddWeekday] = useState("1");
  const [etcDesc, setEtcDesc] = useState("");
  const [etcVal, setEtcVal] = useState("");
  const [etcMode, setEtcMode] = useState("hours");
  const [toast, setToast] = useState("");
  const [captureFor, setCaptureFor] = useState(null); // 이미지 저장 중인 대상 ("전체" 또는 조교 이름)
  const [exporting, setExporting] = useState(false);
  const [newAssistant, setNewAssistant] = useState("");
  const [newAssistantPassword, setNewAssistantPassword] = useState("");
  const [extra, setExtra] = useState({
    date: todayKey,
    weekdays: [today.getDay()],
    repeat: "none",
    until: dateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    title: "",
    kind: "추가",
    start: "10:00",
    end: "13:00",
    assistants: [NO_PERSON, NO_PERSON],
    type: "extra",
  });
  const [evForm, setEvForm] = useState({ title: "", start: todayKey, end: todayKey, color: "slate" });
  const [undoStack, setUndoStack] = useState([]);
  const remoteUpdateRef = useRef(false);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  };

  // ── 저장 / 불러오기 ──
  const buildData = () => ({
    assistants,
    assistantPasswords,
    inactiveAssistants,
    baseSchedule,
    enabledWeekdays,
    lessons,
    allowances,
    events,
    rates,
    adminPassword,
  });

  const applySavedState = (data) => {
    if (!data) return;
    if (data.assistants) setAssistants(data.assistants);
    if (data.assistantPasswords) setAssistantPasswords(data.assistantPasswords);
    if (data.inactiveAssistants) setInactiveAssistants(data.inactiveAssistants);
    if (data.baseSchedule) {
      const normalized = normalizeBaseSchedule(data.baseSchedule);
      setBaseSchedule(normalized);
      const s = new Set([0, 6]);
      for (let d = 0; d <= 6; d++) if ((normalized[d] || []).length > 0) s.add(d);
      if (Array.isArray(data.enabledWeekdays)) data.enabledWeekdays.forEach((d) => s.add(Number(d)));
      setEnabledWeekdays(sortWeekdays([...s]));
    } else if (Array.isArray(data.enabledWeekdays)) {
      setEnabledWeekdays(sortWeekdays([...new Set(data.enabledWeekdays.map(Number))]));
    }
    if (data.lessons) setLessons(data.lessons);
    if (data.allowances) setAllowances(data.allowances);
    setEvents(Array.isArray(data.events) ? data.events : []);
    if (data.rates) setRates(data.rates);
    if (data.adminPassword) setAdminPassword(data.adminPassword);
  };

  const pushUndo = (label) => {
    setUndoStack((prev) => [...prev.slice(-19), { label, state: buildData() }]);
  };
  const undoLast = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    remoteUpdateRef.current = false;
    applySavedState(last.state);
    setUndoStack((prev) => prev.slice(0, -1));
    setSaveStatus(`되돌림: ${last.label}`);
    showToast(`되돌렸어요 · ${last.label}`);
  };

  useEffect(() => {
    const loadSavedState = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from("app_state").select("data").eq("id", SUPABASE_STATE_ID).maybeSingle();
          if (error) throw error;
          if (data?.data) {
            applySavedState(data.data);
            setSaveStatus("DB에서 일정 불러옴");
            return;
          }
        }
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          applySavedState(JSON.parse(saved));
          setSaveStatus(supabase ? "DB 데이터 없음 · 이 브라우저 저장값 불러옴" : "이 브라우저 저장값 불러옴");
        } else {
          setSaveStatus(supabase ? "DB 저장 준비 완료" : "브라우저 저장 모드");
        }
      } catch (error) {
        console.error("일정 불러오기 실패", error);
        setSaveStatus("일정 불러오기 실패");
      } finally {
        setStorageReady(true);
      }
    };
    loadSavedState();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("app_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state", filter: `id=eq.${SUPABASE_STATE_ID}` },
        (payload) => {
          if (!payload.new?.data) return;
          remoteUpdateRef.current = true;
          applySavedState(payload.new.data);
          setSaveStatus("DB 변경사항 반영됨");
          window.setTimeout(() => {
            remoteUpdateRef.current = false;
          }, 0);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    if (remoteUpdateRef.current) return;
    const data = buildData();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    if (!supabase) {
      setSaveStatus("이 브라우저에 저장됨");
      return;
    }
    setSaveStatus("DB 저장 중...");
    const timer = window.setTimeout(async () => {
      const { error } = await supabase
        .from("app_state")
        .upsert({ id: SUPABASE_STATE_ID, data, updated_at: new Date().toISOString() });
      if (error) {
        console.error("DB 저장 실패", error);
        setSaveStatus(`DB 저장 실패: ${error.message}`);
      } else {
        setSaveStatus("DB에 저장됨");
      }
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, assistants, assistantPasswords, inactiveAssistants, baseSchedule, enabledWeekdays, lessons, allowances, events, rates, adminPassword]);

  // ── 로그인 유지: 저장된 로그인 정보가 지금 비밀번호와 맞으면 자동 입장 ──
  useEffect(() => {
    if (!storageReady) return;
    const ta = readLocal(LOGIN_TA_KEY);
    const taOk = ta && ta.name && assistantPasswords[ta.name] === ta.pw && !inactiveAssistants.includes(ta.name);
    if (taOk) {
      setCurrentAssistant(ta.name);
      setAssistantUnlocked(true);
      setTaSessionPw(ta.pw);
    }
    const ad = readLocal(LOGIN_ADMIN_KEY);
    const adOk = ad && ad.pw === adminPassword;
    if (adOk) {
      setAdminUnlocked(true);
      setAdminSessionPw(ad.pw);
    }
    // 로그인해 둔 기기는 그 화면부터, 아니면 학원(보기 전용) 화면
    if (taOk) setRole("assistant");
    else if (adOk) setRole("admin");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady]);

  // ── 비밀번호가 바뀌면 그 사람으로 로그인된 모든 기기에서 로그아웃 ──
  useEffect(() => {
    if (!storageReady) return;
    if (assistantUnlocked && !viaAdmin && currentAssistant && assistantPasswords[currentAssistant] !== taSessionPw) {
      setAssistantUnlocked(false);
      setCurrentAssistant("");
      setTaSessionPw("");
      writeLocal(LOGIN_TA_KEY, null);
      showToast("비밀번호가 바뀌었어요. 다시 로그인해 주세요");
    }
    if (adminUnlocked && adminPassword !== adminSessionPw) {
      setAdminUnlocked(false);
      setAdminSessionPw("");
      writeLocal(LOGIN_ADMIN_KEY, null);
      if (viaAdmin) {
        setAssistantUnlocked(false);
        setCurrentAssistant("");
        setViaAdmin(false);
      }
      showToast("관리자 비밀번호가 바뀌었어요. 다시 로그인해 주세요");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, assistantPasswords, adminPassword, assistantUnlocked, adminUnlocked, currentAssistant, viaAdmin]);

  const activeAssistants = useMemo(
    () => assistants.filter((n) => !inactiveAssistants.includes(n)),
    [assistants, inactiveAssistants]
  );
  const loginOptions = activeAssistants.filter((n) => n !== NO_PERSON);
  const effectiveLoginName = loginOptions.includes(loginName) ? loginName : loginOptions[0] || "";

  const isAdminRole = role === "admin";
  const isAcademy = role === "academy";
  const authed = isAcademy ? true : isAdminRole ? adminUnlocked : assistantUnlocked;
  const monthPrefix = `${year}-${pad(month)}-`;
  const monthKey = `${year}-${pad(month)}`;

  const monthLessons = useMemo(
    () => lessons.filter((l) => l.date.startsWith(monthPrefix)).sort(byTime),
    [lessons, monthPrefix]
  );
  const myLessons = useMemo(
    () => monthLessons.filter((l) => l.assistants.includes(currentAssistant)),
    [monthLessons, currentAssistant]
  );
  const adminLessons = useMemo(
    () => (filterName === "전체" ? monthLessons : monthLessons.filter((l) => l.assistants.includes(filterName))),
    [monthLessons, filterName]
  );
  const monthEvents = useMemo(() => {
    const first = `${monthPrefix}01`;
    const last = `${monthPrefix}${pad(new Date(year, month, 0).getDate())}`;
    return events.filter((e) => e.start <= last && e.end >= first).sort((a, b) => a.start.localeCompare(b.start));
  }, [events, monthPrefix, year, month]);
  const eventsOn = (ds) => monthEvents.filter((e) => e.start <= ds && e.end >= ds);
  const pendingSwaps = useMemo(() => {
    const list = [];
    lessons.forEach((l) => (l.swapRequests || []).forEach((requester) => list.push({ lesson: l, requester })));
    return list.sort((a, b) => byTime(a.lesson, b.lesson));
  }, [lessons]);

  // 조교별 이번 달 배정 횟수 (정규/추가) + 수업별
  const assistantMonthlyStats = useMemo(() => {
    const result = {};
    assistants.filter((n) => n !== NO_PERSON).forEach((n) => (result[n] = { total: 0, reg: 0, ext: 0, present: 0, byClass: {} }));
    monthLessons.forEach((lesson) => {
      lesson.assistants
        .filter((n) => n && n !== NO_PERSON)
        .forEach((name) => {
          if (!result[name]) result[name] = { total: 0, reg: 0, ext: 0, present: 0, byClass: {} };
          const r = result[name];
          r.total += 1;
          if (lesson.type === "extra") r.ext += 1;
          else r.reg += 1;
          if (lesson.attendance?.[name] === "present") r.present += 1;
          r.byClass[lesson.title] = (r.byClass[lesson.title] || 0) + 1;
        });
    });
    return result;
  }, [monthLessons, assistants]);

  const classStats = useMemo(() => {
    const result = {};
    monthLessons.forEach((lesson) => {
      result[lesson.title] ||= {};
      lesson.assistants
        .filter((n) => n && n !== NO_PERSON)
        .forEach((n) => (result[lesson.title][n] = (result[lesson.title][n] || 0) + 1));
    });
    return result;
  }, [monthLessons]);

  // ── 정산 (출근 체크한 수업만) ──
  const myRates = rates[currentAssistant] || { cls: "", etc: "" };
  const myAllowances = (allowances[currentAssistant] || []).filter((a) => a.month === monthKey);

  const buildSettlement = (name) => {
    const r = rates[name] || {};
    const rc = parseHourlyRate(r.cls);
    const re = parseHourlyRate(r.etc);
    const mine = monthLessons.filter((l) => l.assistants.includes(name));
    const present = mine.filter((l) => l.attendance?.[name] === "present");
    const unchecked = mine.filter((l) => !l.attendance?.[name] && l.date <= todayKey);
    const reg = present.filter((l) => l.type !== "extra");
    const ext = present.filter((l) => l.type === "extra");
    const items = (allowances[name] || []).filter((a) => a.month === monthKey);
    const rateLabel = (x) => (x ? won(x) : "시급");
    const classMoney = (n) => (rc ? formatMan(n * HOURS_PER_CLASS * rc) : "(시급 미설정)");
    let total = 0;
    let complete = !!rc || (!reg.length && !ext.length);
    const out = [`[${month}월 급여 정산]`, "", `<${name}>`, ""];

    if (reg.length) {
      const c = {};
      reg.forEach((l) => (c[gisu(l.title)] = (c[gisu(l.title)] || 0) + 1));
      out.push(`*정규수업(${rateLabel(rc)})`);
      Object.keys(c)
        .sort((a, b) => (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0))
        .forEach((k) => out.push(`${k}기- ${c[k]}회`));
      out.push(`총 ${reg.length}회 -> ${classMoney(reg.length)}`, "");
      total += reg.length * HOURS_PER_CLASS * (rc || 0);
    }
    if (ext.length) {
      const c = {};
      ext.forEach((l) => {
        const k = `${gisu(l.title)}기 ${kindOf(l)}`;
        c[k] = (c[k] || 0) + 1;
      });
      out.push(`*추가&직보수업(${rateLabel(rc)})`);
      Object.keys(c)
        .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0) || (a.endsWith("추가") ? -1 : 1))
        .forEach((k) => out.push(`${k}- ${c[k]}회`));
      out.push(`총 ${ext.length}회 -> ${classMoney(ext.length)}`, "");
      total += ext.length * HOURS_PER_CLASS * (rc || 0);
    }
    if (items.length) {
      out.push(`*기타수당(${rateLabel(re)})`);
      items.forEach((it) => {
        if (it.amount != null) {
          out.push(`${it.desc} -> ${won(it.amount)}원`);
          total += it.amount;
        } else {
          out.push(`${it.desc}(${it.hours}H) -> ${re ? formatMan(it.hours * re) : "(시급 미설정)"}`);
          total += it.hours * (re || 0);
          if (!re) complete = false;
        }
      });
      out.push("");
    }
    out.push("", `“총 금액: ${complete ? won(total) : "—"}원 ”`, "", "");
    const dl = (arr) => {
      const g = {};
      arr.forEach((l) => (g[l.date] ||= []).push(gisu(l.title)));
      return Object.keys(g)
        .sort()
        .map((d) => `${prettyDate(d)} ${g[d].sort((x, y) => (parseInt(x, 10) || 0) - (parseInt(y, 10) || 0)).join(",")}`);
    };
    if (reg.length) out.push("<정규수업>", ...dl(reg), "");
    if (ext.length) out.push("<추가,직보수업>", ...dl(ext));
    return {
      text: out.join("\n").trimEnd(),
      reg: reg.length,
      ext: ext.length,
      etc: items.length,
      unchecked: unchecked.length,
      absent: mine.filter((l) => l.attendance?.[name] === "absent").length,
      planned: mine.length,
      plannedReg: mine.filter((l) => l.type !== "extra").length,
      plannedExt: mine.filter((l) => l.type === "extra").length,
    };
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const copySettlement = async () => {
    const s = buildSettlement(currentAssistant);
    const ok = await copyText(s.text);
    showToast(ok ? "정산 내역을 복사했어요" : "복사에 실패했어요. 길게 눌러 직접 복사해 주세요");
  };

  const setRateFor = (name, field, value) => {
    if ((rates[name]?.[field] || "") === value) return;
    setRates((prev) => ({ ...prev, [name]: { ...(prev[name] || {}), [field]: value } }));
  };

  const addAllowance = () => {
    const desc = etcDesc.trim();
    const v = parseFloat(String(etcVal).replace(/[^0-9.]/g, ""));
    if (!desc) return showToast("내용을 입력해 주세요");
    if (!(v > 0)) return showToast(etcMode === "hours" ? "시간을 입력해 주세요" : "금액을 입력해 주세요");
    const item =
      etcMode === "hours"
        ? { id: `etc-${Date.now()}`, month: monthKey, desc, hours: v }
        : { id: `etc-${Date.now()}`, month: monthKey, desc, amount: Math.round(v) };
    setAllowances((prev) => ({ ...prev, [currentAssistant]: [...(prev[currentAssistant] || []), item] }));
    setEtcDesc("");
    setEtcVal("");
    showToast("기타수당을 추가했어요");
  };
  const removeAllowance = (name, id) => {
    setAllowances((prev) => ({ ...prev, [name]: (prev[name] || []).filter((a) => a.id !== id) }));
    showToast("삭제했어요");
  };

  // ── 출근 / 결근 체크 ──
  const setAttendance = (id, name, status) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const att = { ...(l.attendance || {}) };
        if (att[name] === status) delete att[name];
        else att[name] = status;
        return { ...l, attendance: att };
      })
    );
  };

  // ── 월 이동 ──
  const moveMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
    const firstKey = `${y}-${pad(m)}-01`;
    setSelDay(todayKey.startsWith(`${y}-${pad(m)}-`) ? todayKey : firstKey);
  };

  // ── 로그인 ──
  const doLogin = () => {
    if (isAdminRole) {
      if (loginPw !== adminPassword) return setLoginErr("비밀번호가 맞지 않아요.");
      setAdminUnlocked(true);
      setAdminSessionPw(loginPw);
      if (loginKeep) writeLocal(LOGIN_ADMIN_KEY, { pw: loginPw });
    } else {
      const expected = assistantPasswords[effectiveLoginName];
      if (expected === undefined) return setLoginErr("비밀번호가 설정되지 않은 조교예요. 관리자에게 문의해 주세요.");
      if (loginPw !== expected) return setLoginErr("비밀번호가 맞지 않아요.");
      setCurrentAssistant(effectiveLoginName);
      setAssistantUnlocked(true);
      setViaAdmin(false);
      setTaSessionPw(loginPw);
      if (loginKeep) writeLocal(LOGIN_TA_KEY, { name: effectiveLoginName, pw: loginPw });
    }
    setLoginErr("");
    setLoginPw("");
    showToast("로그인했어요");
  };
  const logout = () => {
    if (isAdminRole) {
      setAdminUnlocked(false);
      writeLocal(LOGIN_ADMIN_KEY, null);
      if (viaAdmin) {
        setAssistantUnlocked(false);
        setCurrentAssistant("");
        setViaAdmin(false);
      }
    } else {
      setAssistantUnlocked(false);
      setCurrentAssistant("");
      if (viaAdmin) setViaAdmin(false);
      else writeLocal(LOGIN_TA_KEY, null);
    }
  };
  // 관리자로 로그인한 상태면 비밀번호 없이 아무 조교 화면이나 볼 수 있음
  const openAssistantAsAdmin = (name) => {
    if (!name) return;
    setCurrentAssistant(name);
    setAssistantUnlocked(true);
    setViaAdmin(true);
  };
  // 지정한 날짜까지의 수업에서, 체크 안 된 배정 조교를 모두 '출근'으로 (결근 체크는 그대로)
  const countBulkTargets = (until) => {
    let n = 0;
    lessons.forEach((l) => {
      if (l.date > until) return;
      l.assistants.forEach((name) => {
        if (name && name !== NO_PERSON && !l.attendance?.[name]) n += 1;
      });
    });
    return n;
  };
  const bulkMarkPresent = () => {
    if (!bulkUntil) return showToast("날짜를 골라 주세요");
    const n = countBulkTargets(bulkUntil);
    if (!n) return showToast("출근 처리할 수업이 없어요");
    if (!window.confirm(`${prettyDate(bulkUntil)}까지 체크 안 된 ${n}건을 모두 출근으로 처리할까요?\n(결근으로 체크된 건 그대로 둬요)`)) return;
    pushUndo("출근 일괄 처리");
    setLessons((prev) =>
      prev.map((l) => {
        if (l.date > bulkUntil) return l;
        const att = { ...(l.attendance || {}) };
        let changed = false;
        l.assistants.forEach((name) => {
          if (name && name !== NO_PERSON && !att[name]) {
            att[name] = "present";
            changed = true;
          }
        });
        return changed ? { ...l, attendance: att } : l;
      })
    );
    showToast(`${n}건을 출근으로 처리했어요`);
  };

  const changeAdminPassword = () => {
    const a = pwNew.trim();
    if (a.length < 4) return showToast("4자 이상으로 입력해 주세요");
    if (a !== pwConfirm.trim()) return showToast("두 칸의 비밀번호가 달라요");
    pushUndo("관리자 비밀번호 변경");
    setAdminPassword(a); // 이 기기를 포함해 관리자로 로그인된 모든 기기가 로그아웃됨
    setPwNew("");
    setPwConfirm("");
  };

  // ── 관리자: 일정 생성 / 저장 ──
  const loadMonth = () => {
    const existingRegular = lessons.filter((l) => l.date.startsWith(monthPrefix) && l.type === "regular");
    if (existingRegular.length > 0) {
      if (
        !window.confirm(
          `${year}년 ${month}월의 정규 수업을 기본 일정대로 다시 생성할까요?\n기존 정규 배정 ${existingRegular.length}개가 초기화됩니다. (추가 수업은 유지)`
        )
      )
        return;
    }
    pushUndo("기본 일정 생성");
    const newMonthLessons = generateMonthLessons(year, month, baseSchedule);
    setLessons((prev) => {
      const otherMonths = prev.filter((lesson) => !lesson.date.startsWith(monthPrefix));
      const preserved = prev.filter(
        (lesson) => lesson.date.startsWith(monthPrefix) && (lesson.type === "extra" || lesson.manuallyAdded === true)
      );
      return [...otherMonths, ...newMonthLessons, ...preserved].sort(byTime);
    });
    setFilterName("전체");
    showToast(`${month}월 정규 수업을 생성했어요`);
  };

  const saveNow = async () => {
    const data = buildData();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    if (!supabase) {
      setSaveStatus("이 브라우저에 저장됨 (수동 저장)");
      return;
    }
    setSaveStatus("저장 중...");
    const { error } = await supabase
      .from("app_state")
      .upsert({ id: SUPABASE_STATE_ID, data, updated_at: new Date().toISOString() });
    if (error) {
      console.error("수동 저장 실패", error);
      setSaveStatus(`저장 실패: ${error.message}`);
    } else {
      setSaveStatus("저장 완료 ✓");
      showToast("저장했어요");
    }
  };

  // ── 조교 관리 ──
  const addAssistant = () => {
    const name = newAssistant.trim();
    if (!name || name === NO_PERSON) return;
    if (assistants.includes(name)) {
      if (inactiveAssistants.includes(name)) {
        pushUndo("조교 복귀");
        setInactiveAssistants((prev) => prev.filter((n) => n !== name));
        setNewAssistant("");
        setNewAssistantPassword("");
        showToast(`${name} 조교가 복귀했어요`);
      }
      return;
    }
    pushUndo("조교 추가");
    setAssistants([...assistants.filter((x) => x !== NO_PERSON), name, NO_PERSON]);
    setAssistantPasswords((prev) => ({ ...prev, [name]: newAssistantPassword.trim() || DEFAULT_ASSISTANT_PASSWORD }));
    setNewAssistant("");
    setNewAssistantPassword("");
    showToast(`${name} 조교를 추가했어요`);
  };
  const setAssistantPassword = (name, pw) => {
    if ((assistantPasswords[name] || "") === pw) return;
    pushUndo("조교 비밀번호 변경");
    setAssistantPasswords((prev) => ({ ...prev, [name]: pw }));
  };
  // 퇴직 처리: 목록에서만 숨기고 과거 출근 기록은 그대로 둔다
  const retireAssistant = (name) => {
    if (!name || name === NO_PERSON) return;
    const inBase = Object.values(baseSchedule).reduce(
      (acc, arr) => acc + (arr || []).reduce((a, l) => a + l.assistants.filter((n) => n === name).length, 0),
      0
    );
    const msg =
      `${name} 조교를 퇴직 처리할까요?\n` +
      `- 로그인·배정 선택 목록에서 사라집니다.\n` +
      `- 과거 출근 기록과 통계는 그대로 유지됩니다.` +
      (inBase ? `\n- 기본 일정에 배정된 ${inBase}칸은 '인원 없음'으로 바뀝니다.` : "");
    if (!window.confirm(msg)) return;
    pushUndo("조교 퇴직 처리");
    setInactiveAssistants((prev) => [...new Set([...prev, name])]);
    if (inBase) {
      setBaseSchedule((prev) => {
        const next = {};
        Object.keys(prev).forEach((k) => {
          next[k] = (prev[k] || []).map((l) => ({ ...l, assistants: l.assistants.map((n) => (n === name ? NO_PERSON : n)) }));
        });
        return next;
      });
    }
  };
  const restoreAssistant = (name) => {
    pushUndo("조교 복귀");
    setInactiveAssistants((prev) => prev.filter((n) => n !== name));
  };

  // ── 수업 배정 수정 ──
  const updateLessonAssistant = (id, index, value) => {
    pushUndo("수업 조교 변경");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        const oldName = lesson.assistants[index];
        const nextValue = value || NO_PERSON;
        const nextAssistants = [...lesson.assistants];
        nextAssistants[index] = nextValue;
        let history = lesson.swapHistory || [];
        if (oldName && oldName !== NO_PERSON && oldName !== nextValue) {
          const swapIdx = history.findIndex((h) => h.to === oldName);
          if (swapIdx >= 0) {
            const entry = history[swapIdx];
            history =
              nextValue === entry.from
                ? history.filter((_, i) => i !== swapIdx)
                : history.map((h, i) => (i === swapIdx ? { ...h, to: nextValue } : h));
          }
        }
        const subs = [...new Set(history.map((h) => h.to).filter((to) => to && to !== NO_PERSON && nextAssistants.includes(to)))];
        return {
          ...lesson,
          assistants: nextAssistants,
          swapHistory: history,
          substituteAssistants: subs,
          swap: history.length > 0 || (lesson.swapRequests || []).length > 0,
        };
      })
    );
  };
  const addLessonAssistantSlot = (id) => {
    pushUndo("조교 칸 추가");
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, assistants: [...l.assistants, NO_PERSON] } : l)));
  };
  const removeLessonAssistantSlot = (id, index) => {
    pushUndo("조교 칸 삭제");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        const next = lesson.assistants.filter((_, i) => i !== index);
        const finalNext = next.length ? next : [NO_PERSON];
        return { ...lesson, assistants: finalNext, substituteAssistants: (lesson.substituteAssistants || []).filter((n) => finalNext.includes(n)) };
      })
    );
  };
  const clearLessonSwap = (id) => {
    pushUndo("대타 기록 초기화");
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, swap: false, swapRequests: [], swapHistory: [], substituteAssistants: [] } : l))
    );
  };
  // 대타 내역의 대체자(to)를 다른 조교로 변경. 배정도 함께 업데이트.
  const updateSwapReplacement = (lessonId, historyIndex, newReplacement) => {
    pushUndo("대타 대체자 변경");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        const history = lesson.swapHistory || [];
        const entry = history[historyIndex];
        if (!entry) return lesson;
        const oldTo = entry.to;
        const nextTo = newReplacement || NO_PERSON;
        if (oldTo === nextTo) return lesson;
        let replaced = false;
        const newAssistants = lesson.assistants.map((name) => {
          if (!replaced && name === oldTo) {
            replaced = true;
            return nextTo;
          }
          return name;
        });
        const newHistory = history.map((h, i) => (i === historyIndex ? { ...h, to: nextTo } : h));
        const oldToStillUsed = newHistory.some((h) => h.to === oldTo);
        let subs = (lesson.substituteAssistants || []).filter((n) => (n === oldTo ? oldToStillUsed : true));
        if (nextTo !== NO_PERSON && !subs.includes(nextTo)) subs = [...subs, nextTo];
        return { ...lesson, assistants: newAssistants, swapHistory: newHistory, substituteAssistants: subs };
      })
    );
  };
  const deleteLesson = (id) => {
    if (!window.confirm("이 수업을 삭제할까요?")) return;
    pushUndo("수업 삭제");
    setLessons((prev) => prev.filter((l) => l.id !== id));
    showToast("수업을 삭제했어요");
  };

  const addExtraLesson = () => {
    const isReg = extra.type === "regular";
    if (!extra.title.trim()) return window.alert("수업명을 입력해 주세요.");
    const targetDates = [];
    if (extra.repeat !== "none") {
      const start = new Date(`${extra.date}T00:00:00`);
      const end = new Date(`${extra.until}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return window.alert("날짜가 올바르지 않습니다.");
      if (start.getTime() > end.getTime()) return window.alert("반복 종료일이 시작 날짜보다 빠릅니다.");
      const wds =
        extra.repeat === "daily"
          ? [0, 1, 2, 3, 4, 5, 6]
          : extra.repeat === "custom" && extra.weekdays.length
            ? extra.weekdays
            : [start.getDay()];
      const cursor = new Date(start);
      let safety = 0;
      while (cursor.getTime() <= end.getTime() && safety < 500) {
        if (wds.includes(cursor.getDay())) targetDates.push(dateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
        safety += 1;
      }
      if (!targetDates.length) return window.alert("선택한 요일에 해당하는 날짜가 없습니다.");
    } else {
      targetDates.push(extra.date);
    }
    pushUndo(isReg ? `정규 수업 추가 (${targetDates.length}건)` : `추가 수업 등록 (${targetDates.length}건)`);
    setLessons((prev) => [
      ...prev,
      ...targetDates.map((date) =>
        makeLesson({
          date,
          title: extra.title,
          start: extra.start,
          end: extra.end,
          assistants: cleanAssistants(extra.assistants),
          type: isReg ? "regular" : "extra",
          kind: extra.kind,
          manuallyAdded: isReg,
        })
      ),
    ]);
    setExtra({ ...extra, assistants: [NO_PERSON, NO_PERSON] });
    showToast(`${targetDates.length}개 수업을 등록했어요`);
  };

  // ── 일정(수업 아님) ──
  const addEvent = () => {
    const title = evForm.title.trim();
    if (!title) return window.alert("일정 이름을 입력해 주세요.");
    const start = evForm.start;
    const end = evForm.end && evForm.end >= start ? evForm.end : start;
    pushUndo("일정 추가");
    setEvents((prev) => [...prev, { id: `ev-${Date.now()}`, title, start, end, color: evForm.color }]);
    setEvForm({ ...evForm, title: "" });
    showToast("일정을 추가했어요");
  };
  const deleteEvent = (id) => {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    pushUndo("일정 삭제");
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast("일정을 삭제했어요");
  };

  // ── 기본 일정(요일별) 편집 ──
  const updateBaseLesson = (dayNum, id, field, value) => {
    pushUndo("기본 일정 수정");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }));
  };
  const updateBaseAssistant = (dayNum, id, index, value) => {
    pushUndo("기본 조교 변경");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((l) => {
        if (l.id !== id) return l;
        const next = [...l.assistants];
        next[index] = value || NO_PERSON;
        return { ...l, assistants: next };
      }),
    }));
  };
  const addBaseAssistantSlot = (dayNum, id) => {
    pushUndo("기본 조교 칸 추가");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((l) => (l.id === id ? { ...l, assistants: [...l.assistants, NO_PERSON] } : l)),
    }));
  };
  const removeBaseAssistantSlot = (dayNum, id, index) => {
    pushUndo("기본 조교 칸 삭제");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((l) => {
        if (l.id !== id) return l;
        const next = l.assistants.filter((_, i) => i !== index);
        return { ...l, assistants: next.length ? next : [NO_PERSON] };
      }),
    }));
  };
  const addBaseLesson = (dayNum) => {
    pushUndo("기본 수업 추가");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: [
        ...(prev[dayNum] || []),
        { id: `d${dayNum}-${Date.now()}`, title: "새 정규 수업", start: "10:00", end: "13:00", assistants: [NO_PERSON, NO_PERSON] },
      ],
    }));
  };
  const deleteBaseLesson = (dayNum, id) => {
    pushUndo("기본 수업 삭제");
    setBaseSchedule((prev) => ({ ...prev, [dayNum]: (prev[dayNum] || []).filter((l) => l.id !== id) }));
  };
  const enableWeekday = (dayNum) => {
    const n = Number(dayNum);
    if (Number.isNaN(n) || n < 0 || n > 6 || enabledWeekdays.includes(n)) return;
    pushUndo(`${days[n]}요일 편집칸 추가`);
    setEnabledWeekdays(sortWeekdays([...enabledWeekdays, n]));
  };
  const disableWeekday = (dayNum) => {
    const n = Number(dayNum);
    if (n === 0 || n === 6) return;
    const cnt = (baseSchedule[n] || []).length;
    if (cnt > 0 && !window.confirm(`${days[n]}요일에 등록된 수업 ${cnt}개도 함께 지웁니다. 계속할까요?`)) return;
    pushUndo(`${days[n]}요일 편집칸 제거`);
    setBaseSchedule((prev) => ({ ...prev, [n]: [] }));
    setEnabledWeekdays(enabledWeekdays.filter((d) => d !== n));
  };
  // 현재 달의 정규 수업 배정을 요일별 기본 일정으로 저장 (각 요일 첫 등장 주 기준)
  const saveCurrentMonthAsBase = () => {
    const monthly = lessons.filter((l) => l.date.startsWith(monthPrefix) && l.type === "regular");
    const nextBase = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    let touched = false;
    for (let dayNum = 0; dayNum <= 6; dayNum++) {
      const byDate = {};
      monthly.forEach((l) => {
        if (dowOf(l.date) !== dayNum) return;
        (byDate[l.date] ||= []).push(l);
      });
      const dates = Object.keys(byDate).sort();
      if (!dates.length) {
        nextBase[dayNum] = baseSchedule[dayNum] || [];
        continue;
      }
      touched = true;
      nextBase[dayNum] = byDate[dates[0]]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((l, i) => ({ id: `d${dayNum}-${i + 1}`, title: l.title, start: l.start, end: l.end, assistants: cleanAssistants(l.assistants) }));
    }
    if (!touched) return window.alert("이번 달에 저장할 정규 수업이 없습니다. 먼저 ‘기본 일정으로 생성’을 눌러 주세요.");
    pushUndo("현재 달을 기본 일정으로 저장");
    setBaseSchedule(nextBase);
    const s = new Set(enabledWeekdays);
    for (let d = 0; d <= 6; d++) if ((nextBase[d] || []).length > 0) s.add(d);
    setEnabledWeekdays(sortWeekdays([...s]));
    showToast("이번 달 정규 수업을 기본 일정으로 저장했어요");
  };

  // ── 대타 ──
  const requestSwap = (id) => {
    pushUndo("대타 요청");
    setLessons((prev) =>
      prev.map((l) =>
        l.id !== id || l.swapRequests.includes(currentAssistant)
          ? l
          : { ...l, swap: true, swapRequests: [...l.swapRequests, currentAssistant] }
      )
    );
    showToast("대타 요청을 보냈어요");
  };
  const cancelSwapRequest = (id) => {
    pushUndo("대타 요청 취소");
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, swapRequests: l.swapRequests.filter((n) => n !== currentAssistant) } : l))
    );
    showToast("요청을 취소했어요");
  };
  const approveSwap = (id, requester) => {
    pushUndo("대타 승인");
    const replacement = swapApprovals[`${id}-${requester}`] || NO_PERSON;
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        return {
          ...lesson,
          assistants: lesson.assistants.map((name) => (name === requester ? replacement : name)),
          swap: true,
          swapRequests: lesson.swapRequests.filter((name) => name !== requester),
          substituteAssistants:
            replacement !== NO_PERSON
              ? [...new Set([...(lesson.substituteAssistants || []), replacement])]
              : lesson.substituteAssistants || [],
          swapHistory: [...(lesson.swapHistory || []), { from: requester, to: replacement }],
        };
      })
    );
    showToast(replacement === NO_PERSON ? "승인했어요 · 대타 미정" : `승인했어요 · ${requester} → ${replacement}`);
  };
  const rejectSwap = (id, requester) => {
    pushUndo("대타 요청 거절");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        const reqs = (lesson.swapRequests || []).filter((n) => n !== requester);
        return { ...lesson, swapRequests: reqs, swap: reqs.length > 0 || (lesson.swapHistory || []).length > 0 };
      })
    );
    showToast("요청을 거절했어요");
  };

  // ── 내보내기 ──
  const downloadCsv = (filename, rows) => {
    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const exportScheduleCsv = () => {
    const rows = [["날짜", "요일", "시작", "종료", "수업명", "조교", "구분", "대타내역", "출근체크"]];
    monthLessons.forEach((l) => {
      const names = l.assistants.filter((n) => n !== NO_PERSON).join(" · ") || "-";
      const swap = (l.swapHistory || []).map((h) => `${h.from}→${h.to}`).join(" / ");
      const att = l.assistants
        .filter((n) => n !== NO_PERSON)
        .map((n) => `${n}:${l.attendance?.[n] === "present" ? "출근" : l.attendance?.[n] === "absent" ? "결근" : "-"}`)
        .join(" / ");
      rows.push([l.date, days[dowOf(l.date)], l.start, l.end, l.title, names, l.type === "extra" ? kindOf(l) : "정규", swap, att]);
    });
    downloadCsv(`혜성코멧_${year}년${month}월_출근표.csv`, rows);
  };
  const exportAssistantSummaryCsv = () => {
    const classSet = new Set();
    Object.values(assistantMonthlyStats).forEach((s) => Object.keys(s.byClass).forEach((c) => classSet.add(c)));
    const classList = [...classSet].sort((a, b) => {
      const ai = classNames.indexOf(a);
      const bi = classNames.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    const rows = [["조교", "배정 합계", "출근 체크", ...classList]];
    assistants
      .filter((n) => n !== NO_PERSON && (!inactiveAssistants.includes(n) || (assistantMonthlyStats[n]?.total || 0) > 0))
      .forEach((name) => {
        const s = assistantMonthlyStats[name] || { total: 0, present: 0, byClass: {} };
        rows.push([name, s.total, s.present, ...classList.map((c) => s.byClass[c] || 0)]);
      });
    downloadCsv(`혜성코멧_${year}년${month}월_조교별출근.csv`, rows);
  };
  const captureTo = async (target, filename) => {
    setCaptureFor(target);
    await new Promise((r) => window.setTimeout(r, 300));
    const el = document.getElementById("schedule-capture");
    if (!el) throw new Error("캡처 대상 요소를 찾지 못했습니다.");
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const exportImage = async () => {
    setExporting(true);
    try {
      await captureTo("전체", `혜성코멧_${year}년${month}월_출근표.png`);
      showToast("이미지를 저장했어요");
    } catch (e) {
      console.error("이미지 저장 실패", e);
      window.alert("이미지 저장에 실패했습니다.\nnpm install html-to-image 로 설치했는지 확인해 주세요.\n\n(에러: " + (e?.message || e) + ")");
    } finally {
      setCaptureFor(null);
      setExporting(false);
    }
  };
  const exportPerAssistantImages = async () => {
    const targets = activeAssistants.filter((n) => n !== NO_PERSON);
    if (!targets.length) return window.alert("조교가 없습니다.");
    if (!window.confirm(`${targets.length}명의 개인 일정 이미지를 각각 다운로드합니다.\n‘여러 파일 다운로드 허용’ 팝업이 뜨면 허용해 주세요.\n\n계속할까요?`)) return;
    setExporting(true);
    try {
      for (const name of targets) {
        await captureTo(name, `혜성코멧_${year}년${month}월_${name}.png`);
        await new Promise((r) => window.setTimeout(r, 600));
      }
      showToast(`조교별 이미지 ${targets.length}장을 저장했어요`);
    } catch (e) {
      console.error("조교별 이미지 저장 실패", e);
      window.alert("이미지 저장에 실패했습니다.\n(에러: " + (e?.message || e) + ")");
    } finally {
      setCaptureFor(null);
      setExporting(false);
    }
  };

  // ════════════════════════ 화면 조각 ════════════════════════
  // (인라인 컴포넌트는 함수로 호출해서 입력 포커스가 풀리지 않게 함)

  const chips = (l, highlight) => (
    <div className="hs-ppl">
      {l.assistants.map((n, i) => {
        const h = (l.swapHistory || []).find((x) => x.to === n);
        if (n === NO_PERSON)
          return (
            <span key={i} className="hs-chip none">
              미정
            </span>
          );
        const att = l.attendance?.[n];
        const mark = att === "present" ? " ✓" : att === "absent" ? " ✗" : "";
        if (h)
          return (
            <span key={i} className={`hs-chip swap ${att === "absent" ? "absent" : ""}`}>
              {h.from} → {n}
              {mark}
            </span>
          );
        return (
          <span key={i} className={`hs-chip ${highlight && n === highlight ? "mine" : ""} ${att === "absent" ? "absent" : ""}`}>
            {n}
            {mark}
          </span>
        );
      })}
    </div>
  );

  const kindTag = (l) => {
    const k = kindOf(l);
    if (!k) return null;
    return <span className="hs-tag extra">{k}</span>;
  };

  // 조교용 수업 카드 (출근/결근 체크 + 대타 요청)
  const taCard = (l) => {
    const past = l.date < todayKey;
    const canCheck = l.date <= todayKey;
    const canSwap = l.date >= todayKey;
    const att = l.attendance?.[currentAssistant];
    const requested = (l.swapRequests || []).includes(currentAssistant);
    return (
      <div key={l.id} className={`hs-card ${lessonTone(l)} ${past && att ? "done" : ""}`}>
        <div className="hs-card-t">
          <b>
            {l.title}
            {kindTag(l)}
          </b>
          <span className="hs-time">
            {l.start}–{l.end}
          </span>
        </div>
        {chips(l, currentAssistant)}
        {canCheck && (
          <div className="hs-att" role="group" aria-label="출근 체크">
            <button type="button" className={att === "present" ? "on present" : ""} onClick={() => setAttendance(l.id, currentAssistant, "present")}>
              출근
            </button>
            <button type="button" className={att === "absent" ? "on absent" : ""} onClick={() => setAttendance(l.id, currentAssistant, "absent")}>
              결근
            </button>
          </div>
        )}
        {canSwap && !past && (
          <button
            type="button"
            className={`hs-act ${requested ? "pending" : ""}`}
            onClick={() => (requested ? cancelSwapRequest(l.id) : requestSwap(l.id))}
          >
            {requested ? "대타 요청 중 · 취소" : "대타 요청"}
          </button>
        )}
      </div>
    );
  };

  // 관리자용 수업 카드 (배정 수정)
  const adminCard = (l) => (
    <div key={l.id} className={`hs-card ${lessonTone(l)}`}>
      <div className="hs-card-t">
        <b>
          {l.title}
          {kindTag(l)}
          {(l.swapRequests || []).length > 0 && <span className="hs-tag rq">요청 {l.swapRequests.length}</span>}
        </b>
        <span className="hs-time">
          {l.start}–{l.end}
        </span>
      </div>
      {chips(l)}
      <div className="hs-edit">
        {l.assistants.map((name, index) => (
          <AssistantSlot
            key={`${l.id}-${index}`}
            value={name}
            assistants={activeAssistants}
            onChange={(v) => updateLessonAssistant(l.id, index, v)}
            onRemove={() => removeLessonAssistantSlot(l.id, index)}
          />
        ))}
      </div>
      {(l.swapHistory || []).length > 0 && (
        <div className="hs-swapbox">
          <div className="hs-swapbox-h">
            <span>대타 내역</span>
            <button type="button" onClick={() => clearLessonSwap(l.id)}>
              초기화
            </button>
          </div>
          {l.swapHistory.map((item, index) => (
            <div key={index} className="hs-swaprow">
              <span>{item.from} →</span>
              <select value={item.to || NO_PERSON} onChange={(e) => updateSwapReplacement(l.id, index, e.target.value)}>
                <option value={NO_PERSON}>{NO_PERSON}</option>
                {activeAssistants
                  .filter((n) => n !== NO_PERSON)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                {item.to && item.to !== NO_PERSON && !activeAssistants.includes(item.to) && <option value={item.to}>{item.to} (퇴직)</option>}
              </select>
            </div>
          ))}
        </div>
      )}
      <div className="hs-card-actions">
        <button type="button" onClick={() => addLessonAssistantSlot(l.id)}>
          + 조교 칸
        </button>
        <button type="button" className="danger" onClick={() => deleteLesson(l.id)}>
          삭제
        </button>
      </div>
    </div>
  );

  const byDateList = (list, renderCard) => {
    const g = {};
    list.forEach((l) => (g[l.date] ||= []).push(l));
    return Object.keys(g)
      .sort()
      .map((d) => {
        const allExtra = g[d].every((l) => l.type === "extra");
        const t = allExtra ? "etc" : dayTone(dowOf(d));
        return (
          <div key={d} className="hs-day">
            <div className={`hs-date ${t} ${d < todayKey ? "past" : ""}`}>
              <div className="d">{Number(d.slice(8))}</div>
              <div className="w">{days[dowOf(d)]}</div>
            </div>
            <div className="hs-cards">{g[d].sort(byTime).map(renderCard)}</div>
          </div>
        );
      });
  };

  const loginView = () => (
    <div className="hs-panel hs-login">
      <h2>{isAdminRole ? "관리자 로그인" : "조교 로그인"}</h2>
      {!isAdminRole && (
        <select value={effectiveLoginName} onChange={(e) => setLoginName(e.target.value)} aria-label="이름">
          {loginOptions.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      )}
      <input
        type="password"
        value={loginPw}
        onChange={(e) => setLoginPw(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") doLogin();
        }}
        placeholder="비밀번호"
        autoComplete="current-password"
      />
      <label className="hs-check">
        <input type="checkbox" checked={loginKeep} onChange={(e) => setLoginKeep(e.target.checked)} /> 이 기기에서 로그인 유지
      </label>
      <div className="hs-err">{loginErr}</div>
      <button type="button" className="hs-btn primary" onClick={doLogin}>
        로그인
      </button>
    </div>
  );

  // ── 조교 화면 ──
  const taMine = () => {
    const upcoming = myLessons.filter((l) => l.date >= todayKey);
    const past = myLessons.filter((l) => l.date < todayKey);
    const nextUp = upcoming[0];
    const reg = myLessons.filter((l) => l.type !== "extra").length;
    const presentCnt = myLessons.filter((l) => l.attendance?.[currentAssistant] === "present").length;
    return (
      <>
        <div className="hs-next">
          <small>다음 출근</small>
          <div className="big">
            {nextUp ? `${prettyDate(nextUp.date)} ${nextUp.start} · ${nextUp.title}${kindOf(nextUp) ? " " + kindOf(nextUp) : ""}` : "이번 달 남은 출근 없음"}
          </div>
          <div className="row">
            <span>
              이번 달 <b>{myLessons.length}회</b>
            </span>
            <span>
              정규 <b>{reg}</b>
            </span>
            <span>
              추가·직보 <b>{myLessons.length - reg}</b>
            </span>
            <span>
              출근 체크 <b>{presentCnt}</b>
            </span>
          </div>
        </div>
        {monthEvents.length > 0 && (
          <>
            <div className="hs-sec">{month}월 학원 일정</div>
            {eventChips(monthEvents)}
          </>
        )}
        <div className="hs-sec">남은 일정</div>
        {upcoming.length ? byDateList(upcoming, taCard) : <div className="hs-panel hs-empty">남은 출근이 없어요.</div>}
        {past.length > 0 && (
          <>
            <div className="hs-sec">지난 일정 · 출근 여부를 눌러 주세요</div>
            {byDateList([...past], taCard)}
          </>
        )}
      </>
    );
  };

  const taSwap = () => {
    const mine = lessons.filter((l) => (l.swapRequests || []).includes(currentAssistant)).sort(byTime);
    const hist = monthLessons.filter((l) => (l.swapHistory || []).some((h) => h.from === currentAssistant || h.to === currentAssistant));
    return (
      <>
        <div className="hs-sec first">내가 보낸 요청</div>
        {mine.length ? (
          <div className="hs-stack">
            {mine.map((l) => (
              <div key={l.id} className="hs-panel">
                <div className="hs-row-between">
                  <b>{l.title}</b>
                  <span className="hs-tag rq">승인 대기</span>
                </div>
                <div className="hs-meta">
                  {prettyDate(l.date)} {l.start}–{l.end}
                </div>
                <button type="button" className="hs-btn" onClick={() => cancelSwapRequest(l.id)}>
                  요청 취소
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="hs-panel hs-empty">
            보낸 대타 요청이 없어요.
            <br />내 일정에서 수업 카드의 "대타 요청"을 눌러 보내요.
          </div>
        )}
        <div className="hs-sec">이번 달 대타 기록</div>
        {hist.length ? (
          <div className="hs-stack">
            {hist.map((l) => (
              <div key={l.id} className="hs-panel">
                <b>
                  {prettyDate(l.date)} {l.title}
                </b>
                <div className="hs-ppl">
                  {l.swapHistory
                    .filter((h) => h.from === currentAssistant || h.to === currentAssistant)
                    .map((h, i) => (
                      <span key={i} className="hs-chip swap">
                        {h.from} → {h.to}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hs-panel hs-empty">대타 기록이 없어요.</div>
        )}
      </>
    );
  };

  const taPay = () => {
    const s = buildSettlement(currentAssistant);
    return (
      <>
        <div className="hs-rates readonly">
          <div>
            <small>수업 시급</small>
            <b>{parseHourlyRate(myRates.cls) ? `${won(parseHourlyRate(myRates.cls))}원` : "미설정"}</b>
          </div>
          <div>
            <small>기타 시급</small>
            <b>{parseHourlyRate(myRates.etc) ? `${won(parseHourlyRate(myRates.etc))}원` : "미설정"}</b>
          </div>
        </div>

        <div className="hs-tiles three">
          <div className="hs-panel">
            <small>정규 출근</small>
            <b>
              {s.reg}
              <span className="of"> / {s.plannedReg}회</span>
            </b>
          </div>
          <div className="hs-panel">
            <small>추가·직보 출근</small>
            <b>
              {s.ext}
              <span className="of"> / {s.plannedExt}회</span>
            </b>
          </div>
          <div className="hs-panel">
            <small>기타수당</small>
            <b>{s.etc}건</b>
          </div>
        </div>
        {s.unchecked > 0 && (
          <button type="button" className="hs-warn" onClick={() => setTaTab("mine")}>
            출근 체크 안 한 수업이 {s.unchecked}개 있어요. 체크한 수업만 정산에 들어가요. ›
          </button>
        )}

        <div className="hs-panel">
          <h3>기타수당 등록</h3>
          <input type="text" value={etcDesc} onChange={(e) => setEtcDesc(e.target.value)} placeholder="예: 34기 김소영T 유도 프린트 해설 제작" />
          <div className="hs-seg" role="group" aria-label="수당 종류">
            <button type="button" className={etcMode === "hours" ? "on" : ""} onClick={() => setEtcMode("hours")}>
              시간으로 (기타 시급)
            </button>
            <button type="button" className={etcMode === "amount" ? "on" : ""} onClick={() => setEtcMode("amount")}>
              금액으로 (택시비 등)
            </button>
          </div>
          <div className="hs-inline">
            <input
              type="text"
              inputMode="decimal"
              value={etcVal}
              onChange={(e) => setEtcVal(etcMode === "amount" ? withCommas(e.target.value) : e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addAllowance();
              }}
              placeholder={etcMode === "hours" ? "시간 (예: 1.5)" : "금액 (예: 31,100)"}
            />
            <button type="button" className="hs-btn primary" onClick={addAllowance}>
              추가
            </button>
          </div>
          {myAllowances.length ? (
            <div className="hs-etclist">
              {myAllowances.map((it) => (
                <div key={it.id} className="hs-etcitem">
                  <div>
                    {it.desc}
                    <div className="v">{it.amount != null ? `${won(it.amount)}원` : `${it.hours}H`}</div>
                  </div>
                  <button type="button" onClick={() => removeAllowance(currentAssistant, it.id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="hs-meta center">이번 달 등록한 기타수당이 없어요.</p>
          )}
        </div>

        <div className="hs-panel">
          <h3>정산 내역</h3>
          <pre className="hs-settle">{s.text}</pre>
          <button type="button" className="hs-btn primary" onClick={copySettlement}>
            정산 내역 복사
          </button>
        </div>
      </>
    );
  };

  // ── 관리자 화면 ──
  const smallCalendar = (list = adminLessons) => {
    const first = new Date(year, month - 1, 1).getDay();
    const count = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(<div key={`b${i}`} className="hs-cc blank" />);
    for (let d = 1; d <= count; d++) {
      const ds = `${monthPrefix}${pad(d)}`;
      const ls = list.filter((l) => l.date === ds);
      const w = (first + d - 1) % 7;
      const req = !isAcademy && ls.some((l) => (l.swapRequests || []).length);
      cells.push(
        <button
          type="button"
          key={ds}
          className={`hs-cc w${w} ${ds === selDay ? "sel" : ""} ${ds === todayKey ? "today" : ""}`}
          onClick={() => setSelDay(ds)}
          aria-label={`${month}월 ${d}일 수업 ${ls.length}개`}
        >
          <span className="n">{d}</span>
          {eventsOn(ds).map((e) => (
            <i key={e.id} className={`evbar ev-${e.color} ${e.start === ds || d === 1 ? "s" : ""} ${e.end === ds ? "e" : ""}`}>
              {e.start === ds || w === 0 || d === 1 ? e.title : "\u00a0"}
            </i>
          ))}
          {ls.slice(0, 3).map((l) => (
            <i key={l.id} className={`mini ${lessonTone(l)}`}>
              {gisu(l.title)}
              {kindOf(l) ? kindOf(l)[0] : ""}
            </i>
          ))}
          {ls.length > 3 && <i className="more">+{ls.length - 3}</i>}
          {req && <em className="hs-dot" />}
        </button>
      );
    }
    return (
      <div className="hs-smallcal">
        <div className="hs-panel hs-calp">
          <div className="hs-cal-h">
            {days.map((x, i) => (
              <span key={x} className={`w${i}`}>
                {x}
              </span>
            ))}
          </div>
          <div className="hs-cal">{cells}</div>
        </div>
        <div className="hs-calnote">
          <span>숫자 = 기수</span>
          <span>추 = 추가 · 직 = 직보</span>
          {!isAcademy && (
            <span>
              <em className="hs-dot" />
              대타 요청
            </span>
          )}
        </div>
      </div>
    );
  };

  const filterSelect = () => (
    <select className="hs-filter" value={filterName} onChange={(e) => setFilterName(e.target.value)} aria-label="조교별 보기">
      <option value="전체">전체 조교</option>
      {activeAssistants
        .filter((n) => n !== NO_PERSON)
        .map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      {inactiveAssistants.length > 0 && (
        <optgroup label="퇴직 조교 (과거 기록)">
          {inactiveAssistants.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );

  const adminSched = () => {
    const sel = adminLessons.filter((l) => l.date === selDay);
    return (
      <>
        <div className="hs-toolbar">
          <div className="hs-seg tight" role="group" aria-label="보기 방식">
            <button type="button" className={schedView === "cal" ? "on" : ""} onClick={() => setSchedView("cal")}>
              캘린더
            </button>
            <button type="button" className={schedView === "list" ? "on" : ""} onClick={() => setSchedView("list")}>
              목록
            </button>
          </div>
          {filterSelect()}
        </div>
        {monthLessons.length === 0 && (
          <div className="hs-panel hs-empty">
            {month}월 수업이 아직 없어요.
            <button type="button" className="hs-btn primary" onClick={loadMonth}>
              기본 일정으로 {month}월 생성
            </button>
          </div>
        )}
        {schedView === "list" ? (
          <>
            {eventChips(monthEvents)}
            {byDateList(adminLessons, adminCard)}
          </>
        ) : (
          <>
            {smallCalendar()}
            <div className="hs-sec">
              {prettyDate(selDay)} 수업 {sel.length}개
            </div>
            {eventChips(eventsOn(selDay))}
            {sel.length ? <div className="hs-cards">{sel.map(adminCard)}</div> : <div className="hs-panel hs-empty">이날은 수업이 없어요.</div>}
          </>
        )}
      </>
    );
  };

  // ── 학원 화면 (보기 전용) ──
  const viewCard = (l) => (
    <div key={l.id} className={`hs-card ${lessonTone(l)}`}>
      <div className="hs-card-t">
        <b>
          {l.title}
          {kindTag(l)}
        </b>
        <span className="hs-time">
          {l.start}–{l.end}
        </span>
      </div>
      <div className="hs-ppl">
        {l.assistants.map((n, i) => {
          if (n === NO_PERSON)
            return (
              <span key={i} className="hs-chip none">
                미정
              </span>
            );
          const h = (l.swapHistory || []).find((x) => x.to === n);
          return (
            <span key={i} className={`hs-chip ${h ? "swap" : ""}`} title={h ? `${h.from} 대신` : undefined}>
              {n}
              {h ? " (대타)" : ""}
            </span>
          );
        })}
      </div>
    </div>
  );

  const academyView = () => {
    const todays = lessons.filter((l) => l.date === todayKey).sort(byTime);
    const todayNames = [...new Set(todays.flatMap((l) => l.assistants.filter((n) => n !== NO_PERSON)))];
    const sel = monthLessons.filter((l) => l.date === selDay);
    return (
      <>
        <div className="hs-next">
          <small>오늘 {prettyDate(todayKey)}</small>
          <div className="big">{todays.length ? `수업 ${todays.length}개 · 조교 ${todayNames.length}명` : "오늘은 수업이 없어요"}</div>
          {todays.length > 0 && (
            <div className="hs-today">
              {todays.map((l) => (
                <div key={l.id}>
                  <span className="t">
                    {l.start}–{l.end}
                  </span>
                  <span className="c">
                    {l.title}
                    {kindOf(l) ? ` ${kindOf(l)}` : ""}
                  </span>
                  <span className="n">{l.assistants.filter((n) => n !== NO_PERSON).join(", ") || "미정"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="hs-toolbar">
          <div className="hs-seg tight" role="group" aria-label="보기 방식">
            <button type="button" className={schedView === "cal" ? "on" : ""} onClick={() => setSchedView("cal")}>
              캘린더
            </button>
            <button type="button" className={schedView === "list" ? "on" : ""} onClick={() => setSchedView("list")}>
              목록
            </button>
          </div>
        </div>
        {schedView === "list" && eventChips(monthEvents)}
        {schedView === "list" ? (
          monthLessons.length ? (
            byDateList(monthLessons, viewCard)
          ) : (
            <div className="hs-panel hs-empty">{month}월 일정이 아직 없어요.</div>
          )
        ) : (
          <>
            {smallCalendar(monthLessons)}
            <div className="hs-sec">
              {prettyDate(selDay)} 수업 {sel.length}개
            </div>
            {eventChips(eventsOn(selDay))}
            {sel.length ? <div className="hs-cards">{sel.map(viewCard)}</div> : <div className="hs-panel hs-empty">이날은 수업이 없어요.</div>}
          </>
        )}
      </>
    );
  };

  const adminReq = () => {
    if (!pendingSwaps.length)
      return (
        <div className="hs-panel hs-empty">
          처리할 대타 요청이 없어요.
          <br />
          조교가 요청을 보내면 여기에 모여요.
        </div>
      );
    return (
      <>
        <div className="hs-sec first">처리 대기 {pendingSwaps.length}건</div>
        <div className="hs-stack">
          {pendingSwaps.map(({ lesson, requester }) => {
            const key = `${lesson.id}-${requester}`;
            const options = activeAssistants.filter((n) => n === NO_PERSON || !lesson.assistants.includes(n));
            return (
              <div key={key} className="hs-panel">
                <div className="hs-row-between">
                  <b className="hs-name">{requester}</b>
                  <span className="hs-tag rq">요청</span>
                </div>
                <div className="hs-meta">
                  {prettyDate(lesson.date)} {lesson.start}–{lesson.end} · {lesson.title}
                  {kindOf(lesson) ? ` ${kindOf(lesson)}` : ""}
                  <br />
                  현재 {lesson.assistants.filter((n) => n !== NO_PERSON).join(", ") || "-"}
                </div>
                <select value={swapApprovals[key] || NO_PERSON} onChange={(e) => setSwapApprovals({ ...swapApprovals, [key]: e.target.value })}>
                  {options.map((n) => (
                    <option key={n} value={n}>
                      {n === NO_PERSON ? "대타 선택 (미정)" : n}
                    </option>
                  ))}
                </select>
                <div className="hs-acts">
                  <button type="button" className="hs-btn" onClick={() => rejectSwap(lesson.id, requester)}>
                    거절
                  </button>
                  <button type="button" className="hs-btn primary" onClick={() => approveSwap(lesson.id, requester)}>
                    승인
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const adminStat = () => {
    const names = assistants.filter((n) => n !== NO_PERSON && (!inactiveAssistants.includes(n) || (assistantMonthlyStats[n]?.total || 0) > 0));
    const max = Math.max(1, ...names.map((n) => assistantMonthlyStats[n]?.total || 0));
    return (
      <>
        <div className="hs-tiles">
          <div className="hs-panel">
            <small>{month}월 수업</small>
            <b>{monthLessons.length}개</b>
          </div>
          <div className="hs-panel">
            <small>대기 중 대타</small>
            <b className={pendingSwaps.length ? "red" : ""}>{pendingSwaps.length}건</b>
          </div>
        </div>
        <div className="hs-panel">
          <h3>조교별 출근 횟수</h3>
          {names.map((n) => {
            const s = assistantMonthlyStats[n] || { total: 0, reg: 0, ext: 0, present: 0, byClass: {} };
            return (
              <div key={n} className="hs-statrow">
                <span>
                  {n}
                  {inactiveAssistants.includes(n) && <small> (퇴직)</small>}
                </span>
                <div className="hs-track">
                  <i style={{ width: `${(s.reg / max) * 100}%`, background: "var(--accent)" }} />
                  <i style={{ width: `${(s.ext / max) * 100}%`, background: "var(--etc)" }} />
                </div>
                <span className="n">{s.total}</span>
                <span className="hs-sub">
                  정규 {s.reg} · 추가·직보 {s.ext} · 출근 체크 {s.present}
                </span>
              </div>
            );
          })}
          <div className="hs-legend">
            <span style={{ "--k": "var(--accent)" }}>정규</span>
            <span style={{ "--k": "var(--etc)" }}>추가·직보</span>
          </div>
        </div>
        <div className="hs-panel">
          <h3>수업별 출근 횟수</h3>
          {Object.keys(classStats)
            .sort((a, b) => {
              const ai = classNames.indexOf(a);
              const bi = classNames.indexOf(b);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
            })
            .map((c) => (
              <div key={c} className="hs-classrow">
                <b>{c}</b>
                <div className="hs-ppl">
                  {Object.entries(classStats[c])
                    .sort((a, b) => b[1] - a[1])
                    .map(([n, cnt]) => (
                      <span key={n} className="hs-chip">
                        {n} {cnt}회
                      </span>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </>
    );
  };

  const addEventForm = () => {
    const upcoming = events.filter((e) => e.end >= todayKey).sort((x, y) => x.start.localeCompare(y.start));
    const pastCount = events.length - upcoming.length;
    return (
      <div className="hs-form">
        <TextInput value={evForm.title} onCommit={(v) => setEvForm({ ...evForm, title: v })} placeholder="일정 이름" />
        <div className="hs-grid2">
          <label>
            시작
            <input
              type="date"
              value={evForm.start}
              onChange={(e) => {
                const v = e.target.value;
                setEvForm({ ...evForm, start: v, end: evForm.end < v ? v : evForm.end });
              }}
            />
          </label>
          <label>
            종료
            <input type="date" value={evForm.end} min={evForm.start} onChange={(e) => setEvForm({ ...evForm, end: e.target.value })} />
          </label>
        </div>
        <div className="hs-swatches" role="group" aria-label="색">
          {EVENT_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`ev-${c.key} ${evForm.color === c.key ? "on" : ""}`}
              onClick={() => setEvForm({ ...evForm, color: c.key })}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>
        <button type="button" className="hs-btn primary" onClick={addEvent}>
          일정 추가
        </button>
        {upcoming.length > 0 && (
          <div className="hs-evlist">
            {upcoming.map((e) => (
              <div key={e.id} className={`hs-evrow ev-${e.color}`}>
                <i />
                <b>{e.title}</b>
                <span>{eventRange(e)}</span>
                <button type="button" onClick={() => deleteEvent(e.id)} aria-label="삭제">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {pastCount > 0 && <p className="hs-meta">지난 일정 {pastCount}개는 캘린더에서 볼 수 있어요</p>}
      </div>
    );
  };

  // 선택한 날 / 이번 달 일정 띠
  const eventChips = (list) =>
    list.length > 0 && (
      <div className="hs-evchips">
        {list.map((e) => (
          <span key={e.id} className={`hs-evchip ev-${e.color}`}>
            <b>{e.title}</b>
            <span>{eventRange(e)}</span>
          </span>
        ))}
      </div>
    );

  const section = (key, title, body) => (
    <div className={`hs-acc ${openSection === key ? "open" : ""}`}>
      <button type="button" className="hs-acc-h" onClick={() => setOpenSection(openSection === key ? "" : key)}>
        <span>{title}</span>
        <span className="chev">{openSection === key ? "−" : "+"}</span>
      </button>
      {openSection === key && <div className="hs-acc-b">{body}</div>}
    </div>
  );

  const addLessonForm = () => {
    const cat = extra.type === "regular" ? "정규" : extra.kind;
    const setCat = (c) => setExtra({ ...extra, type: c === "정규" ? "regular" : "extra", kind: c === "정규" ? extra.kind : c });
    const dow = days[dowOf(extra.date)];
    return (
    <div className="hs-form">
      <div className="hs-seg" role="group" aria-label="수업 종류">
        {["정규", "추가", "직보"].map((c) => (
          <button key={c} type="button" className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <TextInput value={extra.title} onCommit={(v) => setExtra({ ...extra, title: v })} placeholder="수업명" />
      <div className="hs-when">
        <input type="date" value={extra.date} onChange={(e) => setExtra({ ...extra, date: e.target.value })} aria-label="날짜" />
        <div className="hs-when-t">
          <input
            type="time"
            value={extra.start}
            aria-label="시작"
            onChange={(e) => {
              const v = e.target.value;
              setExtra({ ...extra, start: v, end: addHoursToTime(v, 3) || extra.end });
            }}
          />
          <span>–</span>
          <input type="time" value={extra.end} aria-label="종료" onChange={(e) => setExtra({ ...extra, end: e.target.value })} />
        </div>
      </div>
      <select
        className="hs-repeat"
        value={extra.repeat}
        aria-label="반복"
        onChange={(e) => {
          const r = e.target.value;
          const until = extra.until && extra.until >= extra.date ? extra.until : lastDayOfMonthKey(extra.date);
          const weekdays = r === "custom" && !extra.weekdays.length ? [dowOf(extra.date)] : extra.weekdays;
          setExtra({ ...extra, repeat: r, until, weekdays });
        }}
      >
        <option value="none">반복 안 함</option>
        <option value="weekly">매주 {dow}요일</option>
        <option value="daily">매일</option>
        <option value="custom">요일 선택</option>
      </select>
      {extra.repeat === "custom" && (
        <div className="hs-wdpick">
          {sortWeekdays([0, 1, 2, 3, 4, 5, 6]).map((d) => {
            const on = extra.weekdays.includes(d);
            return (
              <button
                key={d}
                type="button"
                className={on ? "on" : ""}
                onClick={() => setExtra({ ...extra, weekdays: on ? extra.weekdays.filter((x) => x !== d) : [...extra.weekdays, d] })}
              >
                {days[d]}
              </button>
            );
          })}
        </div>
      )}
      {extra.repeat !== "none" && (
        <label className="hs-field">
          반복 종료일
          <input type="date" value={extra.until} min={extra.date} onChange={(e) => setExtra({ ...extra, until: e.target.value })} />
        </label>
      )}
      <div className="hs-edit">
        {extra.assistants.map((name, index) => (
          <AssistantSlot
            key={index}
            value={name}
            assistants={activeAssistants}
            onChange={(v) => {
              const next = [...extra.assistants];
              next[index] = v;
              setExtra({ ...extra, assistants: next });
            }}
            onRemove={() => {
              const next = extra.assistants.filter((_, i) => i !== index);
              setExtra({ ...extra, assistants: next.length ? next : [NO_PERSON] });
            }}
          />
        ))}
      </div>
      <button type="button" className="hs-btn" onClick={() => setExtra({ ...extra, assistants: [...extra.assistants, NO_PERSON] })}>
        + 조교 칸 추가
      </button>
      <button type="button" className="hs-btn primary" onClick={addExtraLesson}>
        {extra.type === "regular" ? "정규 수업 등록" : `${extra.kind} 수업 등록`}
        {extra.repeat !== "none" ? " (반복)" : ""}
      </button>
    </div>
    );
  };

  const availableToAdd = [1, 2, 3, 4, 5].filter((d) => !enabledWeekdays.includes(d));
  const baseEditor = () => (
    <div className="hs-form">
      {availableToAdd.length > 0 && (
        <div className="hs-inline">
          <select value={addWeekday} onChange={(e) => setAddWeekday(e.target.value)}>
            {availableToAdd.map((d) => (
              <option key={d} value={d}>
                {days[d]}요일
              </option>
            ))}
          </select>
          <button
            type="button"
            className="hs-btn"
            onClick={() => {
              const target = availableToAdd.includes(Number(addWeekday)) ? Number(addWeekday) : availableToAdd[0];
              enableWeekday(target);
              const next = availableToAdd.filter((d) => d !== target);
              if (next.length) setAddWeekday(String(next[0]));
            }}
          >
            요일 추가
          </button>
        </div>
      )}
      {enabledWeekdays.map((dayNum) => (
        <div key={dayNum} className={`hs-base ${dayTone(dayNum)}`}>
          <div className="hs-row-between">
            <b>{days[dayNum]}요일 기본</b>
            <div className="hs-mini-actions">
              <button type="button" onClick={() => addBaseLesson(dayNum)}>
                + 수업
              </button>
              {dayNum !== 0 && dayNum !== 6 && (
                <button type="button" className="danger" onClick={() => disableWeekday(dayNum)}>
                  요일 제거
                </button>
              )}
            </div>
          </div>
          {(baseSchedule[dayNum] || []).length === 0 && <p className="hs-meta">등록된 수업이 없어요.</p>}
          {(baseSchedule[dayNum] || []).map((l) => (
            <div key={l.id} className="hs-base-item">
              <TextInput value={l.title} onCommit={(v) => updateBaseLesson(dayNum, l.id, "title", v)} />
              <div className="hs-grid2">
                <input type="time" value={l.start} onChange={(e) => updateBaseLesson(dayNum, l.id, "start", e.target.value)} />
                <input type="time" value={l.end} onChange={(e) => updateBaseLesson(dayNum, l.id, "end", e.target.value)} />
              </div>
              <div className="hs-edit">
                {l.assistants.map((name, index) => (
                  <AssistantSlot
                    key={`${l.id}-b-${index}`}
                    value={name}
                    assistants={activeAssistants}
                    onChange={(v) => updateBaseAssistant(dayNum, l.id, index, v)}
                    onRemove={() => removeBaseAssistantSlot(dayNum, l.id, index)}
                  />
                ))}
              </div>
              <div className="hs-mini-actions">
                <button type="button" onClick={() => addBaseAssistantSlot(dayNum, l.id)}>
                  + 조교 칸
                </button>
                <button type="button" className="danger" onClick={() => deleteBaseLesson(dayNum, l.id)}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
      <button type="button" className="hs-btn primary" onClick={saveNow}>
        기본 일정 저장
      </button>
      <button
        type="button"
        className="hs-btn"
        onClick={() => {
          if (window.confirm("이번 달 정규 수업 배정을 기본 일정으로 저장할까요? 기존 기본 일정이 덮어쓰기 됩니다.")) saveCurrentMonthAsBase();
        }}
      >
        이번 달 정규 배정 → 기본 일정으로 저장
      </button>
    </div>
  );

  const assistantManager = () => (
    <div className="hs-form">
      <div className="hs-inline">
        <TextInput value={newAssistant} onCommit={setNewAssistant} placeholder="조교 이름" />
        <TextInput value={newAssistantPassword} onCommit={setNewAssistantPassword} placeholder="비밀번호" />
        <button type="button" className="hs-btn primary" onClick={addAssistant}>
          추가
        </button>
      </div>
      {activeAssistants
        .filter((n) => n !== NO_PERSON)
        .map((n) => (
          <div key={n} className="hs-personcard">
            <div className="hs-person">
              <b>{n}</b>
              <TextInput value={assistantPasswords[n] || ""} onCommit={(v) => setAssistantPassword(n, v)} placeholder="비밀번호" />
              <button type="button" className="danger" onClick={() => retireAssistant(n)}>
                퇴직
              </button>
            </div>
            <div className="hs-personrates">
              <label>
                수업 시급
                <MoneyInput value={rates[n]?.cls || ""} onCommit={(v) => setRateFor(n, "cls", v)} placeholder="시급" />
              </label>
              <label>
                기타 시급
                <MoneyInput value={rates[n]?.etc || ""} onCommit={(v) => setRateFor(n, "etc", v)} placeholder="시급" />
              </label>
            </div>
          </div>
        ))}
      {inactiveAssistants.length > 0 && (
        <>
          <div className="hs-sec">퇴직한 조교</div>
          {inactiveAssistants.map((n) => (
            <div key={n} className="hs-person retired">
              <b>{n}</b>
              <span />
              <button type="button" onClick={() => restoreAssistant(n)}>
                복귀
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const settlementViewer = () => (
    <div className="hs-form">
      {activeAssistants
        .filter((n) => n !== NO_PERSON)
        .map((n) => {
          const items = (allowances[n] || []).filter((a) => a.month === monthKey);
          const s = assistantMonthlyStats[n] || { total: 0, present: 0 };
          return (
            <div key={n} className="hs-base etc">
              <div className="hs-row-between">
                <b>{n}</b>
                <span className="hs-meta">
                  배정 {s.total} · 출근 체크 {s.present} · 기타 {items.length}건
                </span>
              </div>
              {items.map((it) => (
                <div key={it.id} className="hs-etcitem">
                  <div>
                    {it.desc}
                    <div className="v">{it.amount != null ? `${won(it.amount)}원` : `${it.hours}H`}</div>
                  </div>
                  <button type="button" onClick={() => removeAllowance(n, it.id)}>
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="hs-btn"
                onClick={async () => {
                  const ok = await copyText(buildSettlement(n).text);
                  showToast(ok ? `${n} 정산 내역을 복사했어요` : "복사에 실패했어요");
                }}
              >
                {n} 정산 내역 복사
              </button>
            </div>
          );
        })}
    </div>
  );

  const adminSet = () => (
    <>
      <div className="hs-panel hs-quick">
        <button type="button" className="hs-btn primary" onClick={loadMonth}>
          기본 일정으로 {month}월 생성
        </button>
        <button type="button" className="hs-btn" onClick={undoLast} disabled={undoStack.length === 0}>
          되돌리기{undoStack.length ? ` (${undoStack.length})` : ""}
        </button>
        <p className="hs-meta">저장 상태: {saveStatus}</p>
      </div>
      {section("add", "수업 추가", addLessonForm())}
      {section("event", "일정 추가", addEventForm())}
      {section("base", "기본 일정 (요일별)", baseEditor())}
      {section("people", "조교 관리 · 비밀번호 · 시급", assistantManager())}
      {section(
        "adminpw",
        "관리자 비밀번호",
        <div className="hs-form">
          <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="새 비밀번호" autoComplete="new-password" />
          <input
            type="password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") changeAdminPassword();
            }}
            placeholder="새 비밀번호 확인"
            autoComplete="new-password"
          />
          <button type="button" className="hs-btn primary" onClick={changeAdminPassword}>
            비밀번호 변경
          </button>
        </div>
      )}
      {section(
        "bulk",
        "출근 일괄 처리",
        <div className="hs-form">
          <label className="hs-field">
            이 날짜까지의 수업
            <input type="date" value={bulkUntil} onChange={(e) => setBulkUntil(e.target.value)} />
          </label>
          <p className="hs-meta">체크 안 된 {countBulkTargets(bulkUntil)}건 · 결근 체크는 그대로 둬요</p>
          <button type="button" className="hs-btn primary" onClick={bulkMarkPresent}>
            모두 출근 처리
          </button>
        </div>
      )}
      {section("pay", "조교별 정산 · 기타수당", settlementViewer())}
      {section(
        "export",
        "내보내기 (CSV · 이미지)",
        <div className="hs-form">
          <button type="button" className="hs-btn" onClick={exportScheduleCsv}>
            CSV: 월간 출근표
          </button>
          <button type="button" className="hs-btn" onClick={exportAssistantSummaryCsv}>
            CSV: 조교별 출근 요약
          </button>
          <button type="button" className="hs-btn primary" onClick={exportImage} disabled={exporting}>
            {exporting ? "이미지 만드는 중..." : "PNG: 전체 캘린더"}
          </button>
          <button type="button" className="hs-btn" onClick={exportPerAssistantImages} disabled={exporting}>
            {exporting ? "이미지 만드는 중..." : "PNG: 조교별 각각"}
          </button>
        </div>
      )}
    </>
  );

  // ── 큰 캘린더 (웹 오른쪽 + 이미지 저장용) ──
  const bigCalendar = (mode, who) => {
    // mode: "ta" (who의 일정만) | "admin" (filter 적용, 클릭 가능) | "capture"
    const src =
      mode === "ta"
        ? myLessons
        : mode === "capture"
          ? who === "전체"
            ? monthLessons
            : monthLessons.filter((l) => l.assistants.includes(who))
          : mode === "academy"
            ? monthLessons
            : adminLessons;
    const highlight = mode === "ta" ? currentAssistant : mode === "capture" && who !== "전체" ? who : "";
    const marks = mode === "ta" || mode === "admin"; // 출근 체크 표시는 조교·관리자 화면에서만
    const first = new Date(year, month - 1, 1).getDay();
    const count = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(<div key={`b${i}`} className="hs-bc blank" />);
    for (let d = 1; d <= count; d++) {
      const ds = `${monthPrefix}${pad(d)}`;
      const w = (first + d - 1) % 7;
      const ls = src.filter((l) => l.date === ds);
      const clickable = mode === "admin" || mode === "academy";
      cells.push(
        <div
          key={ds}
          className={`hs-bc w${w} ${mode !== "capture" && ds === todayKey ? "today" : ""} ${clickable && ds === selDay ? "sel" : ""} ${
            mode !== "capture" && ds < todayKey ? "past" : ""
          } ${clickable ? "click" : ""}`}
          onClick={
            clickable
              ? () => {
                  setSelDay(ds);
                  if (mode === "admin") setAdminTab("sched");
                  setSchedView("cal");
                }
              : undefined
          }
        >
          <div className="bn">{d}</div>
          {eventsOn(ds).map((e) => (
            <div key={e.id} className={`hs-bev ev-${e.color}`}>
              {e.title}
            </div>
          ))}
          {ls.map((l) => (
            <div key={l.id} className={`hs-bl ${lessonTone(l)}`}>
              <div className="bt">
                <b>{l.title}</b>
                {kindOf(l) && <span className="k">{kindOf(l)}</span>}
                {mode === "admin" && (l.swapRequests || []).length > 0 && <em className="hs-dot" title="대타 요청" />}
              </div>
              <div className="btm">
                {l.start}–{l.end}
              </div>
              <div className="bp">
                {l.assistants.map((n, i) => {
                  const h = (l.swapHistory || []).find((x) => x.to === n);
                  const att = l.attendance?.[n];
                  const mark = marks && att === "present" ? "✓" : marks && att === "absent" ? "✗" : "";
                  if (n === NO_PERSON)
                    return (
                      <span key={i} className="none">
                        미정
                      </span>
                    );
                  return (
                    <span key={i} className={h ? "sw" : highlight && n === highlight ? "me" : ""}>
                      {h ? `${h.from}→${n}` : n}
                      {mark}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }
    const label =
      mode === "academy"
        ? "전체 출근 일정"
        : mode === "ta"
        ? `${currentAssistant} 출근 일정`
        : mode === "capture"
          ? who === "전체"
            ? "전체 출근표"
            : `${who} 출근 일정`
          : filterName === "전체"
            ? "전체 수업"
            : `${filterName} 일정`;
    return (
      <div className="hs-bigwrap">
        <div className="hs-bighead">
          <h2>
            {year}년 {month}월
          </h2>
          <span className="hs-meta">
            {mode === "capture" ? "혜성 코멧 학원 · " : ""}
            {label} · {src.length}개
          </span>
        </div>
        <div className="hs-bgrid">
          <div className="hs-bwk">
            {days.map((x, i) => (
              <span key={x} className={`w${i}`}>
                {x}
              </span>
            ))}
          </div>
          <div className="hs-bcells">{cells}</div>
        </div>
      </div>
    );
  };

  // ── 조립 ──
  const taTabs = [
    ["mine", "내 일정", Icon.cal],
    ["swap", "대타", Icon.swap],
    ["pay", "정산", Icon.won],
  ];
  const adminTabs = [
    ["sched", "일정", Icon.cal],
    ["req", "대타 요청", Icon.swap],
    ["stat", "통계", Icon.stat],
    ["set", "관리", Icon.gear],
  ];
  const tabs = isAdminRole ? adminTabs : taTabs;
  const curTab = isAdminRole ? adminTab : taTab;
  const setTab = isAdminRole ? setAdminTab : setTaTab;
  const titles = { academy: "출근 일정", mine: "내 일정", swap: "대타", pay: "정산", sched: "전체 일정", req: "대타 요청", stat: "통계", set: "관리" };

  const mainContent = () => {
    if (!storageReady) return <div className="hs-panel hs-empty">불러오는 중...</div>;
    if (isAcademy) return academyView();
    if (!authed) return loginView();
    if (isAdminRole) {
      if (adminTab === "req") return adminReq();
      if (adminTab === "stat") return adminStat();
      if (adminTab === "set") return adminSet();
      return adminSched();
    }
    if (taTab === "swap") return taSwap();
    if (taTab === "pay") return taPay();
    return taMine();
  };

  return (
    <div className="hs-root">
      <style>{CSS}</style>
      <div className="hs-shell">
        <div className="hs-app">
          <header className="hs-head">
            <div className="hs-top">
              <div className="hs-titlebox">
                <img className="hs-logo" src={LOGO_SRC} alt="혜성 코멧 학원 로고" width={40} height={40} />
                <div>
                <div className="hs-brand">혜성 코멧 학원{isAdminRole ? " · 관리자" : ""}</div>
                <h1>{isAcademy ? titles.academy : authed ? titles[curTab] : "로그인"}</h1>
                </div>
              </div>
              <div className="hs-role" role="group" aria-label="화면 전환">
                <button
                  type="button"
                  className={isAcademy ? "on" : ""}
                  onClick={() => {
                    setRole("academy");
                    setLoginErr("");
                    setLoginPw("");
                  }}
                >
                  학원
                </button>
                <button
                  type="button"
                  className={role === "assistant" ? "on" : ""}
                  onClick={() => {
                    setRole("assistant");
                    setLoginErr("");
                    setLoginPw("");
                    if (adminUnlocked && !assistantUnlocked) openAssistantAsAdmin(loginOptions[0]);
                  }}
                >
                  조교
                </button>
                <button
                  type="button"
                  className={isAdminRole ? "on" : ""}
                  onClick={() => {
                    setRole("admin");
                    setLoginErr("");
                    setLoginPw("");
                  }}
                >
                  관리자
                </button>
              </div>
            </div>
            <div className="hs-bar">
              <div className="hs-month">
                <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">
                  ‹
                </button>
                <b>
                  {year}년 {month}월
                </b>
                <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">
                  ›
                </button>
              </div>
              {authed && !isAcademy && (
                <div className="hs-who">
                  {!isAdminRole &&
                    (adminUnlocked ? (
                      <select
                        className="hs-viewas"
                        value={currentAssistant}
                        onChange={(e) => openAssistantAsAdmin(e.target.value)}
                        aria-label="볼 조교 선택"
                      >
                        {loginOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                        {inactiveAssistants.length > 0 && (
                          <optgroup label="퇴직 조교">
                            {inactiveAssistants.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {currentAssistant && !assistants.includes(currentAssistant) && <option value={currentAssistant}>{currentAssistant}</option>}
                      </select>
                    ) : (
                      <b>{currentAssistant}</b>
                    ))}
                  {isAdminRole && (
                    <button
                      type="button"
                      className="hs-undo"
                      onClick={undoLast}
                      disabled={undoStack.length === 0}
                      title={undoStack.length ? `되돌리기: ${undoStack[undoStack.length - 1].label}` : "되돌릴 작업이 없어요"}
                    >
                      ↶ 되돌리기{undoStack.length ? ` ${undoStack.length}` : ""}
                    </button>
                  )}
                  <button type="button" onClick={logout}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="hs-main">{mainContent()}</main>

          {authed && !isAcademy && (
            <nav className="hs-nav">
              {tabs.map(([k, label, icon]) => (
                <button key={k} type="button" className={curTab === k ? "on" : ""} onClick={() => setTab(k)}>
                  {icon}
                  {label}
                  {k === "req" && pendingSwaps.length > 0 && <span className="hs-badge">{pendingSwaps.length}</span>}
                </button>
              ))}
            </nav>
          )}
        </div>

        <aside className="hs-big" aria-label="월간 캘린더">
          {storageReady && authed && bigCalendar(isAcademy ? "academy" : isAdminRole ? "admin" : "ta")}
        </aside>
      </div>

      {captureFor && (
        <div className="hs-capture-stage" aria-hidden="true">
          <div id="schedule-capture" className="hs-capture">
            {bigCalendar("capture", captureFor)}
          </div>
        </div>
      )}

      {toast && <div className="hs-toast">{toast}</div>}
    </div>
  );
}

// ════════════════════════ 스타일 ════════════════════════
// 휴대폰: 한 열 + 하단 탭바 / 넓은 화면(1000px 이상): 왼쪽 앱 + 오른쪽 큰 캘린더
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap");
.hs-root{
  --bg:#f3f5f9; --surface:#ffffff; --line:#e3e7ef; --ink:#141922; --sub:#5f6878; --faint:#98a0ae;
  --accent:#2448d8; --accent-ink:#ffffff; --accent-soft:#e9eeff;
  --sat:#3b82f6; --sat-bg:#edf4ff; --sun:#e11d48; --sun-bg:#fff0f3;
  --mon:#d97706; --mon-bg:#fff7e3; --tue:#059669; --tue-bg:#eafaf2; --etc:#b026c4; --etc-bg:#fbefff;
  --swap:#ea580c; --swap-bg:#fff2e8; --swap-line:#fed3b4;
  --mine:#fde68a; --mine-ink:#6b4400; --ok:#059669; --ok-bg:#e7f8ef; --danger:#e5484d; --danger-bg:#fdecec;
  --chip:#ffffffd9;
  --font:"IBM Plex Sans KR",-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
  background:var(--bg); color:var(--ink); font-family:var(--font); font-size:14px; min-height:100vh; min-height:100dvh;
  -webkit-font-smoothing:antialiased;
}
@media (prefers-color-scheme: dark){ .hs-root{
  --bg:#0f131a; --surface:#171c25; --line:#262d3a; --ink:#e9edf4; --sub:#9aa3b2; --faint:#687182;
  --accent:#6f8dff; --accent-ink:#0b1020; --accent-soft:#1d2645;
  --sat:#7fb0ff; --sat-bg:#172338; --sun:#fb7185; --sun-bg:#2a1820;
  --mon:#fbbf24; --mon-bg:#2a2214; --tue:#34d399; --tue-bg:#13281f; --etc:#e879f9; --etc-bg:#2a1830;
  --swap:#fb923c; --swap-bg:#2c1c10; --swap-line:#5a3518; --mine:#fcd34d; --mine-ink:#3a2600;
  --ok:#34d399; --ok-bg:#13281f; --danger:#ff6b6f; --danger-bg:#2c1416; --chip:#ffffff14; color-scheme:dark }}
.hs-root *{box-sizing:border-box}
.hs-root button,.hs-root select,.hs-root input{font-family:inherit;color:inherit;font-size:inherit}
.hs-root button{cursor:pointer;background:none;border:0}
.hs-root button:disabled{opacity:.5;cursor:default}
.hs-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.hs-root select,.hs-root input[type=text],.hs-root input[type=password],.hs-root input[type=date],.hs-root input[type=time],.hs-root input:not([type]){
  width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:15px;background:var(--surface);color:var(--ink);min-width:0}
.hs-app{max-width:480px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;border-inline:1px solid var(--line)}
.hs-head{position:sticky;top:0;z-index:5;background:var(--surface);border-bottom:1px solid var(--line);padding:14px 16px 12px}
.hs-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.hs-titlebox{display:flex;align-items:center;gap:10px;min-width:0}
.hs-logo{width:40px;height:40px;border-radius:10px;border:1px solid var(--line);background:#fff;flex-shrink:0;display:block}
.hs-brand{font-size:12px;color:var(--sub);font-weight:600;letter-spacing:.02em}
.hs-head h1{font-size:19px;font-weight:700;margin:2px 0 0}
.hs-role{display:flex;background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:3px;flex-shrink:0}
.hs-role button{font-size:12px;font-weight:600;padding:5px 9px;white-space:nowrap;border-radius:999px;color:var(--sub)}
.hs-role button.on{background:var(--accent);color:var(--accent-ink)}
.hs-bar{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:8px}
.hs-month{display:flex;align-items:center;gap:10px}
.hs-month b{font-size:15px;font-variant-numeric:tabular-nums}
.hs-month button{border:1px solid var(--line);background:var(--surface);width:28px;height:28px;border-radius:8px;color:var(--sub);font-size:14px}
.hs-who{display:flex;align-items:center;gap:6px}
.hs-who b{background:var(--accent-soft);color:var(--accent);font-size:13px;border-radius:999px;padding:5px 10px}
.hs-who .hs-undo{color:var(--accent);border-color:var(--accent)!important;font-weight:700}
.hs-who .hs-undo:disabled{color:var(--faint);border-color:var(--line)!important}
.hs-root .hs-viewas{width:auto;padding:5px 26px 5px 10px;border-radius:999px;font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-soft);border-color:transparent}
.hs-who button{border:1px solid var(--line);background:var(--surface);font-size:12px;color:var(--sub);border-radius:999px;padding:5px 9px}
.hs-main{padding:14px 14px 104px;display:flex;flex-direction:column;gap:10px}
.hs-next{background:var(--accent);color:var(--accent-ink);border-radius:16px;padding:14px 16px}
.hs-next small{font-size:12px;opacity:.85}
.hs-next .big{font-size:18px;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums}
.hs-next .row{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;font-size:12px;opacity:.92}
.hs-today{display:flex;flex-direction:column;gap:6px;margin-top:10px;font-size:13px}
.hs-today>div{display:grid;grid-template-columns:auto auto 1fr;gap:8px;align-items:baseline;background:#ffffff1f;border-radius:8px;padding:6px 8px}
.hs-today .t{font-family:var(--mono);font-size:12px;opacity:.85;white-space:nowrap}
.hs-today .c{font-weight:700;white-space:nowrap}
.hs-today .n{text-align:right;overflow-wrap:anywhere}
.hs-sec{font-size:12px;font-weight:600;color:var(--sub);margin:8px 4px 0;letter-spacing:.02em}
.hs-sec.first{margin-top:0}
.hs-day{display:flex;gap:10px}
.hs-date{width:40px;flex-shrink:0;text-align:center;padding-top:8px}
.hs-date .d{font-size:18px;font-weight:700;font-family:var(--mono);font-variant-numeric:tabular-nums}
.hs-date .w{font-size:11px;font-weight:700}
.hs-date.past{opacity:.55}
.hs-cards{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.hs-card{background:var(--cb);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:10px 12px}
.hs-card.done{opacity:.7}
.hs-card-t{display:flex;justify-content:space-between;align-items:center;gap:8px}
.hs-card-t b{font-size:14px}
.hs-time{font-size:12px;color:var(--sub);font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.hs-ppl{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.hs-chip{font-size:12px;padding:3px 8px;border-radius:999px;background:var(--chip);border:1px solid var(--line)}
.hs-chip.mine{background:var(--mine);color:var(--mine-ink);font-weight:700;border-color:transparent}
.hs-chip.swap{background:var(--swap-bg);color:var(--swap);font-weight:600;border-color:var(--swap-line)}
.hs-chip.none{color:var(--faint)}
.hs-chip.absent{text-decoration:line-through;opacity:.7}
.hs-tag{font-size:11px;padding:2px 7px;border-radius:6px;font-weight:700;margin-left:6px;vertical-align:1px;white-space:nowrap}
.hs-tag.extra{background:var(--etc-bg);color:var(--etc);border:1px solid var(--etc)}
.hs-tag.rq{background:var(--swap-bg);color:var(--swap)}
.hs-att{display:flex;gap:6px;margin-top:8px}
.hs-att button{flex:1;border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:8px;font-size:13px;font-weight:700;color:var(--sub)}
.hs-att button.on.present{background:var(--ok-bg);color:var(--ok);border-color:var(--ok)}
.hs-att button.on.absent{background:var(--danger-bg);color:var(--danger);border-color:var(--danger)}
.hs-act{margin-top:6px;width:100%;border:1px solid var(--line)!important;background:var(--surface)!important;border-radius:10px;padding:8px;font-size:13px;font-weight:600;color:var(--sub)}
.hs-act.pending{color:var(--swap);border-color:var(--swap-line)!important;background:var(--swap-bg)!important}
.sat{--c:var(--sat);--cb:var(--sat-bg)} .sun{--c:var(--sun);--cb:var(--sun-bg)}
.mon{--c:var(--mon);--cb:var(--mon-bg)} .tue{--c:var(--tue);--cb:var(--tue-bg)} .etc{--c:var(--etc);--cb:var(--etc-bg)}
.hs-date.sat .w,.hs-date.sat .d{color:var(--sat)} .hs-date.sun .w,.hs-date.sun .d{color:var(--sun)}
.hs-date.mon .w{color:var(--mon)} .hs-date.tue .w{color:var(--tue)} .hs-date.etc .w{color:var(--etc)}
.hs-panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px}
.hs-panel h3{font-size:14px;margin:0}
.hs-stack{display:flex;flex-direction:column;gap:10px}
.hs-row-between{display:flex;justify-content:space-between;align-items:center;gap:8px}
.hs-name{font-size:15px}
.hs-meta{font-size:12px;color:var(--sub);line-height:1.5;margin:0}
.hs-meta.center{text-align:center;padding:6px 0}
.hs-empty{text-align:center;color:var(--faint);font-size:13px;line-height:1.6;padding:28px 12px;align-items:center}
.hs-btn{border:1px solid var(--line)!important;background:var(--surface)!important;border-radius:10px;padding:10px 12px;font-size:14px;font-weight:700;color:var(--sub);width:100%}
.hs-btn.primary{background:var(--accent)!important;border-color:var(--accent)!important;color:var(--accent-ink)}
.hs-acts{display:flex;gap:6px}
.hs-acts .hs-btn{flex:1}
.hs-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hs-tiles.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.hs-tiles .hs-panel{padding:12px;gap:2px}
.hs-tiles small{font-size:12px;color:var(--sub)}
.hs-tiles b{font-size:20px;font-family:var(--mono);font-variant-numeric:tabular-nums}
.hs-tiles b.red{color:var(--danger)}
.hs-tiles b .of{font-size:.6em;color:var(--sub);font-weight:600}
.hs-tile-sub{font-size:12px;color:var(--sub);margin-top:2px}
.hs-warn{text-align:left;background:var(--swap-bg)!important;color:var(--swap);border:1px solid var(--swap-line)!important;border-radius:12px;padding:10px 12px;font-size:13px;font-weight:600}
.hs-rates{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--mon-bg);border:1px solid var(--mon);border-radius:12px;padding:12px}
.hs-rates label{font-size:12px;font-weight:600;color:var(--sub);display:flex;flex-direction:column;gap:6px}
.hs-rates .hs-meta{grid-column:1/-1}
.hs-rates.readonly{background:var(--surface);border-color:var(--line)}
.hs-rates.readonly>div{display:flex;flex-direction:column;gap:2px}
.hs-rates.readonly small{font-size:12px;color:var(--sub);font-weight:600}
.hs-rates.readonly b{font-size:17px;font-family:var(--mono);font-variant-numeric:tabular-nums}
.hs-seg{display:flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface)}
.hs-seg button{flex:1;padding:10px 0;font-size:13px;font-weight:600;color:var(--sub)}
.hs-seg button.on{background:var(--accent-soft);color:var(--accent)}
.hs-seg.tight{flex:0 0 auto}
.hs-seg.tight button{padding:8px 14px;white-space:nowrap}
.hs-inline{display:flex;gap:6px;align-items:stretch}
.hs-inline .hs-btn{width:auto;flex-shrink:0}
.hs-etclist{display:flex;flex-direction:column}
.hs-etcitem{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px;line-height:1.5}
.hs-etcitem:last-child{border-bottom:0}
.hs-etcitem>div{min-width:0}
.hs-etcitem .v{font-size:12px;color:var(--sub);font-family:var(--mono)}
.hs-etcitem button{border:1px solid var(--line);color:var(--danger);font-size:12px;border-radius:8px;padding:4px 8px;flex-shrink:0}
.hs-settle{white-space:pre-wrap;font-family:var(--font);font-size:13px;line-height:1.7;margin:0;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;overflow-wrap:anywhere;user-select:text}
.hs-login{max-width:360px;width:100%;margin:20px auto 0}
.hs-login h2{font-size:18px;margin:0}
.hs-check{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--sub)}
.hs-check input{width:16px;height:16px;margin:0;accent-color:var(--accent)}
.hs-err{color:var(--danger);font-size:12px;min-height:16px}
.hs-toolbar{display:flex;gap:8px;align-items:center}
.hs-filter{flex:1}
.hs-edit{display:flex;flex-direction:column;gap:4px;margin-top:8px}
.hs-slot{display:flex;gap:4px}
.hs-slot select{padding:7px 8px;font-size:13px}
.hs-slot button{border:1px solid var(--line);background:var(--surface);border-radius:8px;width:34px;color:var(--faint);flex-shrink:0}
.hs-swapbox{margin-top:8px;background:var(--swap-bg);border:1px solid var(--swap-line);border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px;font-size:12px}
.hs-swapbox-h{display:flex;justify-content:space-between;font-weight:700;color:var(--swap)}
.hs-swapbox-h button{font-size:11px;color:var(--swap);text-decoration:underline}
.hs-swaprow{display:flex;align-items:center;gap:6px}
.hs-swaprow span{white-space:nowrap;font-weight:600}
.hs-swaprow select{padding:6px 8px;font-size:13px}
.hs-card-actions,.hs-mini-actions{display:flex;gap:6px;margin-top:8px}
.hs-card-actions button,.hs-mini-actions button{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;color:var(--sub)}
.hs-card-actions .danger,.hs-mini-actions .danger,.hs-person .danger{color:var(--danger)}
.hs-mini-actions{margin-top:0}
.hs-smallcal .hs-calp{padding:10px 8px}
.hs-cal-h{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px}
.hs-cal-h .w0{color:var(--sun)} .hs-cal-h .w6{color:var(--sat)}
.hs-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.hs-cc{position:relative;min-height:72px;border:1px solid var(--line)!important;background:var(--surface)!important;border-radius:8px;padding:4px 2px;display:flex;flex-direction:column;align-items:center;gap:2px}
.hs-cc.blank{border:0!important;background:none!important}
.hs-cc .n{font-size:12px;font-weight:700;font-family:var(--mono);line-height:16px}
.hs-cc.w0 .n{color:var(--sun)} .hs-cc.w6 .n{color:var(--sat)}
.hs-cc.today .n{background:var(--accent);color:var(--accent-ink);border-radius:999px;padding:0 5px}
.hs-cc.sel{border-color:var(--accent)!important;box-shadow:inset 0 0 0 1px var(--accent)}
.hs-cc .mini{font-style:normal;font-size:10px;font-weight:700;width:100%;max-width:40px;border-radius:4px;background:var(--cb);color:var(--c);border:1px solid var(--c);line-height:14px;text-align:center;white-space:nowrap;overflow:hidden}
.hs-cc .more{font-style:normal;font-size:10px;color:var(--faint)}
.hs-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--swap);flex-shrink:0}
.hs-cc .hs-dot{position:absolute;top:4px;right:4px}
.ev-slate{--ec:#64748b;--eb:#eef1f5} .ev-teal{--ec:#0f9488;--eb:#e2f6f3} .ev-orange{--ec:#ea6a0c;--eb:#fff0e3}
.ev-pink{--ec:#db2777;--eb:#fde9f2} .ev-brown{--ec:#8a5a2b;--eb:#f5ece2}
@media (prefers-color-scheme: dark){ .ev-slate{--ec:#a3b1c4;--eb:#232a35} .ev-teal{--ec:#2dd4bf;--eb:#12302c}
 .ev-orange{--ec:#fb923c;--eb:#33210f} .ev-pink{--ec:#f472b6;--eb:#33172a} .ev-brown{--ec:#d2a679;--eb:#2e2318} }
.hs-cc .evbar{font-style:normal;font-size:9.5px;font-weight:700;line-height:13px;align-self:stretch;margin:0 -3px;padding:0 3px;background:var(--ec);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:clip}
.hs-cc .evbar.s{margin-left:0;border-top-left-radius:4px;border-bottom-left-radius:4px}
.hs-cc .evbar.e{margin-right:0;border-top-right-radius:4px;border-bottom-right-radius:4px}
.hs-bev{background:var(--ec);color:#fff;font-size:11.5px;font-weight:700;border-radius:5px;padding:2px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hs-evchips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.hs-evchip{display:inline-flex;align-items:center;gap:6px;background:var(--eb);color:var(--ec);border:1px solid var(--ec);border-radius:999px;padding:3px 10px;font-size:12.5px}
.hs-evchip span{font-family:var(--mono);font-size:11.5px;opacity:.85}
.hs-when{display:flex;flex-direction:column;gap:8px}
.hs-when-t{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:6px}
.hs-when-t span{color:var(--sub)}
.hs-swatches{display:flex;gap:10px}
.hs-swatches button{width:30px;height:30px;border-radius:50%;background:var(--ec);border:3px solid var(--surface);box-shadow:0 0 0 1px var(--line);padding:0}
.hs-swatches button.on{box-shadow:0 0 0 2px var(--ink)}
.hs-evlist{display:flex;flex-direction:column;gap:6px;margin-top:4px}
.hs-evrow{display:flex;align-items:center;gap:8px;background:var(--eb);border-radius:10px;padding:8px 10px;font-size:13px}
.hs-evrow i{width:8px;height:8px;border-radius:50%;background:var(--ec);flex-shrink:0}
.hs-evrow b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hs-evrow span{font-family:var(--mono);font-size:12px;color:var(--sub)}
.hs-evrow button{border:0;background:none;color:var(--sub);font-size:18px;line-height:1;padding:0 4px;cursor:pointer}
.hs-calnote{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--sub);margin-top:8px;padding-left:4px}
.hs-calnote .hs-dot{margin-right:4px;vertical-align:1px}
.hs-statrow{display:grid;grid-template-columns:64px 1fr 32px;align-items:center;gap:4px 8px;padding:8px 0;border-bottom:1px solid var(--line)}
.hs-statrow:last-of-type{border-bottom:0}
.hs-statrow small{color:var(--faint)}
.hs-track{height:10px;background:var(--bg);border-radius:999px;overflow:hidden;display:flex}
.hs-track i{display:block;height:100%}
.hs-statrow .n{text-align:right;font-family:var(--mono);font-weight:600}
.hs-sub{grid-column:2/-1;font-size:11px;color:var(--sub)}
.hs-legend{display:flex;gap:12px;font-size:11px;color:var(--sub)}
.hs-legend span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;background:var(--k)}
.hs-classrow{padding:8px 0;border-bottom:1px solid var(--line)}
.hs-classrow:last-child{border-bottom:0}
.hs-quick{gap:8px}
.hs-acc{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.hs-acc-h{display:flex;justify-content:space-between;width:100%;padding:14px;font-size:14px;font-weight:700;text-align:left}
.hs-acc-h .chev{color:var(--faint);font-size:18px;line-height:1}
.hs-acc-b{padding:0 14px 14px;border-top:1px solid var(--line)}
.hs-form{display:flex;flex-direction:column;gap:8px;padding-top:12px}
.hs-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hs-field{font-size:12px;color:var(--sub);display:flex;flex-direction:column;gap:4px}
.hs-grid2 label{font-size:12px;color:var(--sub);display:flex;flex-direction:column;gap:4px}
.hs-wdpick{display:flex;flex-wrap:wrap;gap:4px}
.hs-wdpick button{width:38px;height:36px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font-weight:700;color:var(--sub)}
.hs-wdpick button.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.hs-base{background:var(--cb);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
.hs-base-item{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px}
.hs-base-item .hs-edit{margin-top:0}
.hs-personcard{border:1px solid var(--line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
.hs-personrates{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hs-personrates label{font-size:12px;color:var(--sub);display:flex;flex-direction:column;gap:4px}
.hs-personrates input{padding:7px 8px;font-size:13px}
.hs-person{display:grid;grid-template-columns:64px 1fr auto;gap:8px;align-items:center}
.hs-person input{padding:7px 8px;font-size:13px}
.hs-person button{border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;color:var(--sub)}
.hs-person.retired b{color:var(--faint)}
.hs-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:var(--surface);border-top:1px solid var(--line);
  display:flex;z-index:6;padding:7px 6px calc(10px + env(safe-area-inset-bottom,0px))}
.hs-nav button{flex:1;font-size:11px;color:var(--faint);font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;padding:2px 0}
.hs-nav svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.hs-nav button.on{color:var(--accent)}
.hs-badge{position:absolute;top:-3px;left:calc(50% + 6px);background:var(--danger);color:#fff;font-size:10px;font-weight:700;border-radius:999px;padding:1px 5px;font-family:var(--mono)}
.hs-toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);font-size:13px;font-weight:600;padding:9px 14px;border-radius:999px;z-index:50;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis}

/* 큰 캘린더 */
.hs-big{display:none}
.hs-bighead{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin-bottom:14px}
.hs-bighead h2{font-size:22px;margin:0}
.hs-bgrid{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.hs-bwk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-bottom:1px solid var(--line);font-size:12px;font-weight:700;color:var(--sub);text-align:center;padding:8px 0}
.hs-bwk .w0{color:var(--sun)} .hs-bwk .w6{color:var(--sat)}
.hs-bcells{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.hs-bc{min-height:128px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:6px;display:flex;flex-direction:column;gap:4px;min-width:0}
.hs-bc:nth-child(7n){border-right:0}
.hs-bc.click{cursor:pointer}
.hs-bc.click:hover{background:var(--bg)}
.hs-bc.sel{box-shadow:inset 0 0 0 2px var(--accent)}
.hs-bc.past .hs-bl{opacity:.6}
.hs-bc .bn{font-size:13px;font-weight:700;font-family:var(--mono)}
.hs-bc.w0 .bn{color:var(--sun)} .hs-bc.w6 .bn{color:var(--sat)}
.hs-bc.today .bn{align-self:flex-start;background:var(--accent);color:var(--accent-ink);border-radius:999px;padding:0 7px}
.hs-bl{background:var(--cb);border-left:3px solid var(--c);border-radius:6px;padding:4px 6px;font-size:11.5px;line-height:1.35;min-width:0}
.hs-bl .bt{display:flex;align-items:center;flex-wrap:wrap;gap:0 4px}
.hs-bl .bt b{font-size:12px;flex:1 1 auto;min-width:0;overflow-wrap:anywhere;word-break:keep-all}
.hs-bl .k{color:var(--etc);font-weight:700;font-size:10.5px;flex-shrink:0}
.hs-bl .btm{color:var(--sub);font-family:var(--mono);font-size:10.5px}
.hs-bl .bp{display:flex;flex-wrap:wrap;gap:0 5px;overflow-wrap:anywhere}
.hs-bl .bp .me{background:var(--mine);color:var(--mine-ink);font-weight:700;border-radius:4px;padding:0 3px}
.hs-bl .bp .sw{color:var(--swap);font-weight:700}
.hs-bl .bp .none{color:var(--faint)}

/* 이미지 저장용 (화면 밖에서 그림) */
.hs-capture-stage{position:fixed;left:-20000px;top:0;width:1400px;pointer-events:none}
.hs-capture{width:1400px;padding:24px;background:#ffffff;color:#141922;
  --bg:#f3f5f9; --surface:#ffffff; --line:#e3e7ef; --ink:#141922; --sub:#5f6878; --faint:#98a0ae;
  --sat:#3b82f6; --sat-bg:#edf4ff; --sun:#e11d48; --sun-bg:#fff0f3; --mon:#d97706; --mon-bg:#fff7e3;
  --tue:#059669; --tue-bg:#eafaf2; --etc:#b026c4; --etc-bg:#fbefff; --swap:#ea580c; --mine:#fde68a; --mine-ink:#6b4400}

@media (min-width:1000px){
  .hs-shell{display:grid;grid-template-columns:440px minmax(0,1fr);height:100vh;height:100dvh;max-width:1680px;margin:0 auto}
  .hs-app{max-width:none;margin:0;height:100%;min-height:0;overflow-y:auto;display:flex;flex-direction:column}
  .hs-main{flex:1;padding-bottom:24px}
  .hs-nav{position:sticky;left:auto;transform:none;bottom:0;max-width:none;margin-top:auto;padding-bottom:10px}
  .hs-big{display:block;height:100%;overflow-y:auto;padding:24px 28px}
  .hs-smallcal{display:none}
  .hs-toast{left:220px}
}
/* 웹(넓은 화면)에서는 글씨를 한 단계 크게 */
@media (min-width:1000px){
  .hs-root{font-size:15.5px}
  .hs-shell{grid-template-columns:500px minmax(0,1fr)}
  .hs-brand{font-size:13.5px}
  .hs-head h1{font-size:23px}
  .hs-logo{width:46px;height:46px}
  .hs-role button{font-size:14px;padding:6px 12px}
  .hs-month b{font-size:17px}
  .hs-month button{width:32px;height:32px;font-size:16px}
  .hs-who b,.hs-who button,.hs-root .hs-viewas{font-size:14px}
  .hs-next small,.hs-next .row{font-size:14px}
  .hs-next .big{font-size:22px}
  .hs-today{font-size:15px}
  .hs-today .t{font-size:13.5px}
  .hs-sec{font-size:14px}
  .hs-date{width:46px}
  .hs-date .d{font-size:22px}
  .hs-date .w{font-size:13px}
  .hs-card{padding:12px 14px}
  .hs-card-t b{font-size:16.5px}
  .hs-time{font-size:14px}
  .hs-chip{font-size:14px;padding:4px 10px}
  .hs-tag{font-size:12.5px}
  .hs-att button,.hs-act{font-size:15px;padding:10px}
  .hs-panel h3{font-size:16.5px}
  .hs-meta{font-size:14px}
  .hs-empty{font-size:15px}
  .hs-btn{font-size:15.5px;padding:11px 14px}
  .hs-seg button{font-size:15px}
  .hs-root select,.hs-root input[type=text],.hs-root input[type=password],.hs-root input[type=date],.hs-root input[type=time],.hs-root input:not([type]){font-size:16px}
  .hs-slot select,.hs-swaprow select,.hs-person input,.hs-personrates input{font-size:15px}
  .hs-rates label,.hs-personrates label,.hs-grid2 label,.hs-field{font-size:13.5px}
  .hs-tiles small{font-size:14px}
  .hs-tile-sub{font-size:13.5px}
  .hs-tiles b{font-size:24px}
  .hs-settle{font-size:15px}
  .hs-etcitem{font-size:15px}
  .hs-etcitem .v{font-size:13.5px}
  .hs-acc-h{font-size:16.5px;padding:16px}
  .hs-statrow{grid-template-columns:76px 1fr 36px;font-size:15px}
  .hs-sub{font-size:13px}
  .hs-legend,.hs-calnote{font-size:13px}
  .hs-card-actions button,.hs-mini-actions button,.hs-person button{font-size:13.5px}
  .hs-swapbox{font-size:14px}
  .hs-nav button{font-size:13px}
  .hs-nav svg{width:25px;height:25px}
  .hs-toast{font-size:15px;left:250px}
  .hs-bighead h2{font-size:30px}
  .hs-bighead .hs-meta{font-size:15px}
  .hs-bwk{font-size:15px;padding:10px 0}
  .hs-bc{min-height:150px;padding:8px;gap:5px}
  .hs-bc .bn{font-size:16px}
  .hs-bev{font-size:13.5px;padding:3px 8px}
  .hs-evchip{font-size:14px}
  .hs-evrow{font-size:15px}
  .hs-bl{font-size:13.5px;padding:5px 8px}
  .hs-bl .bt b{font-size:14.5px}
  .hs-bl .k{font-size:12px}
  .hs-bl .btm{font-size:12.5px}
}
@media (prefers-reduced-motion:no-preference){.hs-att button,.hs-seg button{transition:background .12s,color .12s}}
`;
