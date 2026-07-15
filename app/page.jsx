"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  List,
  Plus,
  Repeat2,
  Save,
  Search,
  Settings,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "hscomet-ta-schedule-v2";
const ADMIN_PASSWORD = "hscomet102";
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

// 월화수목금토일 순 정렬용 (월=0 → 일=6)
const weekdaySortKey = (d) => (d === 0 ? 6 : d - 1);
const sortWeekdays = (arr) => [...arr].sort((a, b) => weekdaySortKey(a) - weekdaySortKey(b));

// 요일별 편집 카드 배경색
const weekdayTone = (dayNum) => {
  switch (dayNum) {
    case 6: return "bg-rose-50"; // 토 빨강
    case 0: return "bg-blue-50"; // 일 파랑
    case 1: return "bg-amber-50"; // 월 노랑
    case 2: return "bg-emerald-50"; // 화 초록
    default: return "bg-fuchsia-50"; // 수·목·금 보라 (추가 수업 계열)
  }
};

// 요일별 수업 카드 배경색 (조금 더 진한 -100 톤)
const weekdayCardTone = (dayNum) => {
  switch (dayNum) {
    case 6: return "bg-rose-100";
    case 0: return "bg-blue-100";
    case 1: return "bg-amber-100";
    case 2: return "bg-emerald-100";
    default: return "bg-fuchsia-100";
  }
};

const assistantPasswordSeed = {
  강지후: "hscomet102",
  송은호: "hscomet102",
  정율제: "hscomet102",
  이찬영: "hscomet102",
};

const DEFAULT_ASSISTANT_PASSWORD = "hscomet102";

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function prettyDate(key) {
  const d = new Date(`${key}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
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

function sortAssistantsForDisplay(list) {
  return [...cleanAssistants(list)].sort((a, b) => {
    if (a === NO_PERSON && b !== NO_PERSON) return 1;
    if (b === NO_PERSON && a !== NO_PERSON) return -1;
    return 0;
  });
}

function makeLesson({ date, title, start, end, assistants, type, id, manuallyAdded }) {
  return {
    id: id || `${type}-${date}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date,
    title,
    start,
    end,
    assistants: cleanAssistants(assistants),
    type,
    manuallyAdded: !!manuallyAdded,
    swap: false,
    swapRequests: [],
    swapHistory: [],
    substituteAssistants: [],
  };
}

function generateMonthLessons(year, month, baseSchedule) {
  const dates = getMonthDates(year, month).filter((d) => d.getMonth() === month - 1);
  const lessons = [];

  dates.forEach((d) => {
    const key = dateKey(d);
    const day = d.getDay();
    const regular = (baseSchedule && baseSchedule[day]) || [];

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

function AssistantSlot({ value, assistants, onChange, onRemove }) {
  return (
    <div className="flex gap-1">
      <select
        className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1"
        value={value || NO_PERSON}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={NO_PERSON}>{NO_PERSON}</option>
        {assistants
          .filter((name) => name !== NO_PERSON)
          .map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
      </select>
      <button onClick={onRemove} className="rounded-lg bg-white px-2 py-1 text-slate-500 hover:text-red-500">
        ×
      </button>
    </div>
  );
}

function TextInput({ value, onCommit, placeholder, className = "" }) {
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  return (
    <input
      className={className || "rounded-xl border p-2"}
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

export default function Page() {
  const today = new Date();
  const [role, setRole] = useState("all");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [assistants, setAssistants] = useState(assistantSeed);
  const [currentAssistant, setCurrentAssistant] = useState("강지후");
  const [selectedAssistant, setSelectedAssistant] = useState("전체");
  const [baseSchedule, setBaseSchedule] = useState(defaultBaseSchedule);
  // 기본 일정 편집기에서 토·일 외에 어떤 요일을 편집창으로 열어둘지
  const [enabledWeekdays, setEnabledWeekdays] = useState(() => {
    const s = new Set([0, 6]);
    for (let d = 1; d <= 5; d++) if ((defaultBaseSchedule[d] || []).length > 0) s.add(d);
    return sortWeekdays([...s]);
  });
  const [lessons, setLessons] = useState(() =>
    generateMonthLessons(today.getFullYear(), today.getMonth() + 1, defaultBaseSchedule)
  );
  const [viewMode, setViewMode] = useState("calendar");
  const [deviceMode, setDeviceMode] = useState("web");
  const [rightTab, setRightTab] = useState("extra");
  const [newAssistant, setNewAssistant] = useState("");
  const [newAssistantPassword, setNewAssistantPassword] = useState("");
  const [assistantPasswords, setAssistantPasswords] = useState(assistantPasswordSeed);
  const [assistantUnlocked, setAssistantUnlocked] = useState(false);
  const [assistantLoginName, setAssistantLoginName] = useState("강지후");
  const [assistantLoginPassword, setAssistantLoginPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState(supabase ? "DB 연결 준비 중" : "브라우저 저장 모드");
  const [storageReady, setStorageReady] = useState(false);
  const [swapApprovals, setSwapApprovals] = useState({});
  const [addWeekday, setAddWeekday] = useState("1");
  const [justCopiedSettlement, setJustCopiedSettlement] = useState(false);
  const [justCopiedDaily, setJustCopiedDaily] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [extra, setExtra] = useState({
    date: dateKey(today),
    startDate: dateKey(today),
    endDate: dateKey(today),
    weekdays: [today.getDay()],
    dateMode: "single",
    title: "추가 수업",
    start: "10:00",
    end: "13:00",
    assistants: [NO_PERSON, NO_PERSON],
    type: "extra",
  });
  const [undoStack, setUndoStack] = useState([]);
  const remoteUpdateRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDeviceMode("mobile");
    }
  }, []);

  const applySavedState = (data) => {
    if (!data) return;
    if (data.year) setYear(data.year);
    if (data.month) setMonth(data.month);
    if (data.assistants) setAssistants(data.assistants);
    if (data.assistantPasswords) setAssistantPasswords(data.assistantPasswords);
    if (data.currentAssistant) setCurrentAssistant(data.currentAssistant);
    if (data.selectedAssistant) setSelectedAssistant(data.selectedAssistant);
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
    if (data.viewMode) setViewMode(data.viewMode);
    if (data.deviceMode) setDeviceMode(data.deviceMode);
  };

  const makeSnapshot = () => ({
    year,
    month,
    assistants,
    assistantPasswords,
    currentAssistant,
    selectedAssistant,
    baseSchedule,
    enabledWeekdays,
    lessons,
    viewMode,
    deviceMode,
  });

  const pushUndo = (label) => {
    setUndoStack((prev) => [...prev.slice(-19), { label, state: makeSnapshot() }]);
  };

  const undoLast = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    remoteUpdateRef.current = false;
    applySavedState(last.state);
    setUndoStack((prev) => prev.slice(0, -1));
    setSaveStatus(`되돌림: ${last.label}`);
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

    const data = {
      year,
      month,
      assistants,
      assistantPasswords,
      currentAssistant,
      selectedAssistant,
      baseSchedule,
      enabledWeekdays,
      lessons,
      viewMode,
      deviceMode,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

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
  }, [
    storageReady,
    year,
    month,
    assistants,
    assistantPasswords,
    currentAssistant,
    selectedAssistant,
    baseSchedule,
    enabledWeekdays,
    lessons,
    viewMode,
    deviceMode,
  ]);

  const isAdmin = role === "admin" && adminUnlocked;
  const isAllView = role === "all";
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month]);

  const visibleLessons = useMemo(() => {
    const monthPrefix = `${year}-${pad(month)}-`;
    const target = isAdmin || isAllView ? selectedAssistant : currentAssistant;
    const monthlyLessons = lessons.filter((lesson) => lesson.date.startsWith(monthPrefix));
    const filtered = target === "전체" ? monthlyLessons : monthlyLessons.filter((lesson) => lesson.assistants.includes(target));
    return [...filtered].sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }, [lessons, selectedAssistant, currentAssistant, isAdmin, isAllView, year, month]);

  const lessonsByDate = useMemo(() => {
    const map = {};
    visibleLessons.forEach((lesson) => {
      map[lesson.date] ||= [];
      map[lesson.date].push(lesson);
    });
    return map;
  }, [visibleLessons]);

  const stats = useMemo(() => {
    const result = {};
    const monthPrefix = `${year}-${pad(month)}-`;
    lessons
      .filter((lesson) => lesson.date.startsWith(monthPrefix))
      .forEach((lesson) => {
        result[lesson.title] ||= {};
        lesson.assistants
          .filter((name) => name && name !== NO_PERSON)
          .forEach((name) => {
            result[lesson.title][name] = (result[lesson.title][name] || 0) + 1;
          });
      });
    return result;
  }, [lessons, year, month]);

  const assistantClassStats = useMemo(() => {
    const result = {};
    const monthPrefix = `${year}-${pad(month)}-`;
    lessons
      .filter((lesson) => lesson.date.startsWith(monthPrefix))
      .forEach((lesson) => {
        if (!lesson.assistants.includes(currentAssistant)) return;
        result[lesson.title] = (result[lesson.title] || 0) + 1;
      });
    return result;
  }, [lessons, currentAssistant, year, month]);

  // 조교별로 이번 달 총 출근 횟수 + 수업별 세부 횟수
  const assistantMonthlyStats = useMemo(() => {
    const result = {};
    const monthPrefix = `${year}-${pad(month)}-`;
    assistants
      .filter((n) => n !== NO_PERSON)
      .forEach((n) => {
        result[n] = { total: 0, byClass: {} };
      });
    lessons
      .filter((lesson) => lesson.date.startsWith(monthPrefix))
      .forEach((lesson) => {
        lesson.assistants
          .filter((n) => n && n !== NO_PERSON)
          .forEach((name) => {
            if (!result[name]) result[name] = { total: 0, byClass: {} };
            result[name].total += 1;
            result[name].byClass[lesson.title] = (result[name].byClass[lesson.title] || 0) + 1;
          });
      });
    return result;
  }, [lessons, assistants, year, month]);

  // 조교 화면용 정산 내역 텍스트 (정규 / 추가·직보 분리)
  const settlementText = useMemo(() => {
    const monthPrefix = `${year}-${pad(month)}-`;
    const shorten = (title) => title.replace(/^(한성|세종)\s+/, "");
    const orderMap = new Map(classNames.map((c, i) => [shorten(c), i]));
    const regular = {};
    const extra = {};
    lessons
      .filter((l) => l.date.startsWith(monthPrefix) && l.assistants.includes(currentAssistant))
      .forEach((l) => {
        const bucket = l.type === "extra" ? extra : regular;
        const key = shorten(l.title);
        bucket[key] = (bucket[key] || 0) + 1;
      });

    const lines = [];
    const regEntries = Object.entries(regular);
    if (regEntries.length) {
      lines.push("*정규수업");
      let total = 0;
      regEntries
        .sort((a, b) => {
          const ai = orderMap.has(a[0]) ? orderMap.get(a[0]) : 999;
          const bi = orderMap.has(b[0]) ? orderMap.get(b[0]) : 999;
          if (ai !== bi) return ai - bi;
          return a[0].localeCompare(b[0]);
        })
        .forEach(([name, count]) => {
          lines.push(`${name}- ${count}회`);
          total += count;
        });
      lines.push(`총 ${total}회`);
    }
    const extEntries = Object.entries(extra);
    if (extEntries.length) {
      if (lines.length) lines.push("");
      lines.push("*추가&직보수업");
      let total = 0;
      extEntries
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, count]) => {
          lines.push(`${name}- ${count}회`);
          total += count;
        });
      lines.push(`총 ${total}회`);
    }
    return lines.join("\n");
  }, [lessons, currentAssistant, year, month]);

  const copySettlement = async () => {
    if (!settlementText) return;
    const markCopied = () => {
      setJustCopiedSettlement(true);
      window.setTimeout(() => setJustCopiedSettlement(false), 1500);
    };
    try {
      await navigator.clipboard.writeText(settlementText);
      setSaveStatus("정산 내역 복사됨 ✓");
      markCopied();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = settlementText;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setSaveStatus("정산 내역 복사됨 ✓");
        markCopied();
      } catch {
        window.alert("복사에 실패했습니다. 텍스트를 직접 선택해서 복사해 주세요.");
      }
      document.body.removeChild(ta);
    }
  };

  // 날짜별 출근 내역 (정규 + 추가/직보 각각 섹션)
  const dailyText = useMemo(() => {
    const monthPrefix = `${year}-${pad(month)}-`;
    const shortNum = (title) => title.replace(/^(한성|세종)\s+/, "").replace(/기$/, "").trim();
    const shortExtra = (title) => title.replace(/^(한성|세종)\s+/, "").trim();
    const regByDate = {};
    const extByDate = {};
    lessons
      .filter((l) => l.date.startsWith(monthPrefix) && l.assistants.includes(currentAssistant))
      .forEach((l) => {
        if (l.type === "regular") {
          (regByDate[l.date] ||= new Set()).add(shortNum(l.title));
        } else if (l.type === "extra") {
          (extByDate[l.date] ||= new Set()).add(shortExtra(l.title));
        }
      });

    const lines = [];

    const regDates = Object.keys(regByDate).sort();
    if (regDates.length) {
      lines.push("<정규수업>");
      regDates.forEach((date) => {
        const d = new Date(`${date}T00:00:00`);
        const md = `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
        const sorted = [...regByDate[date]].sort((a, b) => {
          const na = parseInt(a, 10);
          const nb = parseInt(b, 10);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return a.localeCompare(b);
        });
        lines.push(`${md} ${sorted.join(",")}`);
      });
    }

    const extDates = Object.keys(extByDate).sort();
    if (extDates.length) {
      if (lines.length) lines.push("");
      lines.push("<추가&직보수업>");
      extDates.forEach((date) => {
        const d = new Date(`${date}T00:00:00`);
        const md = `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
        const names = [...extByDate[date]].sort((a, b) => a.localeCompare(b));
        lines.push(`${md} ${names.join(", ")}`);
      });
    }

    return lines.join("\n");
  }, [lessons, currentAssistant, year, month]);

  const copyDaily = async () => {
    if (!dailyText) return;
    const markCopied = () => {
      setJustCopiedDaily(true);
      window.setTimeout(() => setJustCopiedDaily(false), 1500);
    };
    try {
      await navigator.clipboard.writeText(dailyText);
      setSaveStatus("날짜별 출근 복사됨 ✓");
      markCopied();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = dailyText;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setSaveStatus("날짜별 출근 복사됨 ✓");
        markCopied();
      } catch {
        window.alert("복사에 실패했습니다. 텍스트를 직접 선택해서 복사해 주세요.");
      }
      document.body.removeChild(ta);
    }
  };

  const loadMonth = () => {
    const monthPrefix = `${year}-${pad(month)}-`;
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
        (lesson) =>
          lesson.date.startsWith(monthPrefix) && (lesson.type === "extra" || lesson.manuallyAdded === true)
      );
      return [...otherMonths, ...newMonthLessons, ...preserved].sort((a, b) =>
        `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)
      );
    });

    setSelectedAssistant("전체");
  };

  // 자동저장 외에, 버튼으로 즉시 저장
  const saveNow = async () => {
    const data = {
      year,
      month,
      assistants,
      assistantPasswords,
      currentAssistant,
      selectedAssistant,
      baseSchedule,
      enabledWeekdays,
      lessons,
      viewMode,
      deviceMode,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
      setSaveStatus("기본 일정 저장 완료 ✓");
    }
  };

  const addAssistant = () => {
    const name = newAssistant.trim();
    if (!name || name === NO_PERSON || assistants.includes(name)) return;
    pushUndo("조교 추가");
    setAssistants([...assistants.filter((x) => x !== NO_PERSON), name, NO_PERSON]);
    setAssistantPasswords((prev) => ({ ...prev, [name]: newAssistantPassword.trim() || DEFAULT_ASSISTANT_PASSWORD }));
    setNewAssistant("");
    setNewAssistantPassword("");
  };

  const setAssistantPassword = (name, pw) => {
    pushUndo("조교 비밀번호 변경");
    setAssistantPasswords((prev) => ({ ...prev, [name]: pw }));
  };

  const assistantLogin = () => {
    const expected = assistantPasswords[assistantLoginName];
    if (expected === undefined) {
      window.alert("비밀번호가 설정되지 않은 조교입니다. 관리자에게 문의하세요.");
      return;
    }
    if (assistantLoginPassword === expected) {
      setCurrentAssistant(assistantLoginName);
      setAssistantUnlocked(true);
      setAssistantLoginPassword("");
    } else {
      window.alert("비밀번호가 올바르지 않습니다.");
    }
  };

  const assistantLogout = () => {
    setAssistantUnlocked(false);
    setAssistantLoginPassword("");
  };

  const updateLessonAssistant = (id, index, value) => {
    pushUndo("수업 조교 변경");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        const next = [...lesson.assistants];
        next[index] = value || NO_PERSON;
        const cleanedSubs = (lesson.substituteAssistants || []).filter((n) => next.includes(n));
        return { ...lesson, assistants: next, substituteAssistants: cleanedSubs };
      })
    );
  };

  const addLessonAssistantSlot = (id) => {
    pushUndo("조교 칸 추가");
    setLessons((prev) => prev.map((lesson) => (lesson.id === id ? { ...lesson, assistants: [...lesson.assistants, NO_PERSON] } : lesson)));
  };

  const removeLessonAssistantSlot = (id, index) => {
    pushUndo("조교 칸 삭제");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        const next = lesson.assistants.filter((_, i) => i !== index);
        const finalNext = next.length ? next : [NO_PERSON];
        const cleanedSubs = (lesson.substituteAssistants || []).filter((n) => finalNext.includes(n));
        return { ...lesson, assistants: finalNext, substituteAssistants: cleanedSubs };
      })
    );
  };

  const clearLessonSwap = (id) => {
    pushUndo("대타 기록 초기화");
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === id
          ? { ...lesson, swap: false, swapRequests: [], swapHistory: [], substituteAssistants: [] }
          : lesson
      )
    );
  };

  const removeSwapHistoryEntry = (id, idx) => {
    pushUndo("대타 기록 삭제");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;
        const history = lesson.swapHistory || [];
        const removed = history[idx];
        const nextHistory = history.filter((_, i) => i !== idx);
        const stillUsed = nextHistory.some((h) => h.to === removed?.to);
        const nextSubs = stillUsed
          ? lesson.substituteAssistants || []
          : (lesson.substituteAssistants || []).filter((n) => n !== removed?.to);
        return {
          ...lesson,
          swapHistory: nextHistory,
          substituteAssistants: nextSubs,
          swap: nextHistory.length > 0 || (lesson.swapRequests || []).length > 0,
        };
      })
    );
  };

  // 대타 내역의 대체자(to)를 다른 조교로 변경. 조교 배정과 substituteAssistants도 함께 업데이트.
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

        // 조교 배정에서 oldTo 하나만 nextTo로 교체 (여러 개 있으면 첫 번째만)
        let replaced = false;
        const newAssistants = lesson.assistants.map((name) => {
          if (!replaced && name === oldTo) {
            replaced = true;
            return nextTo;
          }
          return name;
        });

        // 대타 내역 업데이트
        const newHistory = history.map((h, i) => (i === historyIndex ? { ...h, to: nextTo } : h));

        // substituteAssistants 재계산: oldTo가 다른 곳에서 쓰이지 않으면 제거, nextTo가 새로 들어오면 추가
        const oldToStillUsed = newHistory.some((h) => h.to === oldTo);
        let subs = (lesson.substituteAssistants || []).filter((n) => (n === oldTo ? oldToStillUsed : true));
        if (nextTo !== NO_PERSON && !subs.includes(nextTo)) subs = [...subs, nextTo];

        return { ...lesson, assistants: newAssistants, swapHistory: newHistory, substituteAssistants: subs };
      })
    );
  };

  const addExtraLesson = () => {
    const isReg = extra.type === "regular";
    const targetDates = [];

    if (extra.dateMode === "range") {
      const start = new Date(`${extra.startDate}T00:00:00`);
      const end = new Date(`${extra.endDate}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        window.alert("날짜가 올바르지 않습니다.");
        return;
      }
      if (start.getTime() > end.getTime()) {
        window.alert("종료 날짜가 시작 날짜보다 빠릅니다.");
        return;
      }
      const wds = extra.weekdays.length ? extra.weekdays : [start.getDay()];
      const cursor = new Date(start);
      let safety = 0;
      while (cursor.getTime() <= end.getTime() && safety < 500) {
        if (wds.includes(cursor.getDay())) targetDates.push(dateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
        safety += 1;
      }
      if (!targetDates.length) {
        window.alert("선택한 요일에 해당하는 날짜가 없습니다.");
        return;
      }
    } else {
      targetDates.push(extra.date);
    }

    pushUndo(
      isReg
        ? `정규 수업 추가 (${targetDates.length}건)`
        : `추가 수업 등록 (${targetDates.length}건)`
    );
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
          manuallyAdded: isReg,
        })
      ),
    ]);
    setExtra({
      ...extra,
      title: isReg ? "정규 수업" : "추가 수업",
      assistants: [NO_PERSON, NO_PERSON],
    });
    setSaveStatus(`${targetDates.length}개 수업 등록됨`);
  };

  // 기본 일정(요일별) 편집
  const updateBaseLesson = (dayNum, id, field, value) => {
    pushUndo("기본 일정 수정");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((lesson) => (lesson.id === id ? { ...lesson, [field]: value } : lesson)),
    }));
  };

  const updateBaseAssistant = (dayNum, id, index, value) => {
    pushUndo("기본 조교 변경");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((lesson) => {
        if (lesson.id !== id) return lesson;
        const next = [...lesson.assistants];
        next[index] = value || NO_PERSON;
        return { ...lesson, assistants: next };
      }),
    }));
  };

  const addBaseAssistantSlot = (dayNum, id) => {
    pushUndo("기본 조교 칸 추가");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((lesson) =>
        lesson.id === id ? { ...lesson, assistants: [...lesson.assistants, NO_PERSON] } : lesson
      ),
    }));
  };

  const removeBaseAssistantSlot = (dayNum, id, index) => {
    pushUndo("기본 조교 칸 삭제");
    setBaseSchedule((prev) => ({
      ...prev,
      [dayNum]: (prev[dayNum] || []).map((lesson) => {
        if (lesson.id !== id) return lesson;
        const next = lesson.assistants.filter((_, i) => i !== index);
        return { ...lesson, assistants: next.length ? next : [NO_PERSON] };
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
    setBaseSchedule((prev) => ({ ...prev, [dayNum]: (prev[dayNum] || []).filter((lesson) => lesson.id !== id) }));
  };

  const enableWeekday = (dayNum) => {
    const n = Number(dayNum);
    if (Number.isNaN(n) || n < 0 || n > 6) return;
    if (enabledWeekdays.includes(n)) return;
    pushUndo(`${days[n]}요일 편집칸 추가`);
    setEnabledWeekdays(sortWeekdays([...enabledWeekdays, n]));
  };

  const disableWeekday = (dayNum) => {
    const n = Number(dayNum);
    if (n === 0 || n === 6) return; // 토·일은 항상 유지
    const lessonsOnDay = (baseSchedule[n] || []).length;
    if (lessonsOnDay > 0) {
      if (!window.confirm(`${days[n]}요일에 등록된 수업 ${lessonsOnDay}개도 함께 지웁니다. 계속할까요?`)) return;
    }
    pushUndo(`${days[n]}요일 편집칸 제거`);
    setBaseSchedule((prev) => ({ ...prev, [n]: [] }));
    setEnabledWeekdays(enabledWeekdays.filter((d) => d !== n));
  };

  // 현재 달의 정규 수업 배정을 요일별 기본 일정으로 저장 (각 요일 첫 등장 주 기준)
  const saveCurrentMonthAsBase = () => {
    const monthPrefix = `${year}-${pad(month)}-`;
    const monthly = lessons.filter((l) => l.date.startsWith(monthPrefix) && l.type === "regular");

    const nextBase = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    let touched = false;

    for (let dayNum = 0; dayNum <= 6; dayNum++) {
      const byDate = {};
      monthly.forEach((l) => {
        const d = new Date(`${l.date}T00:00:00`).getDay();
        if (d !== dayNum) return;
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
        .map((l, i) => ({
          id: `d${dayNum}-${i + 1}`,
          title: l.title,
          start: l.start,
          end: l.end,
          assistants: cleanAssistants(l.assistants),
        }));
    }

    if (!touched) {
      window.alert("이번 달에 저장할 정규 수업이 없습니다. 먼저 ‘기본 일정으로 생성’을 눌러 주세요.");
      return;
    }

    pushUndo("현재 달을 기본 일정으로 저장");
    setBaseSchedule(nextBase);
    const s = new Set(enabledWeekdays);
    for (let d = 0; d <= 6; d++) if ((nextBase[d] || []).length > 0) s.add(d);
    setEnabledWeekdays(sortWeekdays([...s]));
    setSaveStatus("현재 달 정규 수업을 기본 일정으로 저장함");
  };

  const requestSwap = (id) => {
    pushUndo("대타 요청");
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id || lesson.swapRequests.includes(currentAssistant)) return lesson;
        return { ...lesson, swap: true, swapRequests: [...lesson.swapRequests, currentAssistant] };
      })
    );
  };

  const cancelSwapRequest = (id) => {
    pushUndo("대타 요청 취소");
    setLessons((prev) =>
      prev.map((lesson) => (lesson.id === id ? { ...lesson, swapRequests: lesson.swapRequests.filter((name) => name !== currentAssistant) } : lesson))
    );
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
            replacement !== NO_PERSON ? [...new Set([...(lesson.substituteAssistants || []), replacement])] : lesson.substituteAssistants || [],
          swapHistory: [...(lesson.swapHistory || []), { from: requester, to: replacement }],
        };
      })
    );
  };

  const deleteLesson = (id) => {
    pushUndo("수업 삭제");
    setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
  };

  // ── 내보내기 유틸리티 ────────────────────────────────────────────────
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
    // BOM을 붙여야 엑셀 한글이 안 깨짐
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
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
    const monthPrefix = `${year}-${pad(month)}-`;
    const rows = [["날짜", "요일", "시작", "종료", "수업명", "조교", "구분", "대타내역"]];
    lessons
      .filter((l) => l.date.startsWith(monthPrefix))
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
      .forEach((l) => {
        const dow = days[new Date(`${l.date}T00:00:00`).getDay()];
        const names = l.assistants.filter((n) => n !== NO_PERSON).join(" · ") || "-";
        const swap = (l.swapHistory || []).map((h) => `${h.from}→${h.to}`).join(" / ");
        rows.push([l.date, dow, l.start, l.end, l.title, names, l.type === "extra" ? "추가" : "정규", swap]);
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
    const rows = [["조교", "총합", ...classList]];
    assistants
      .filter((n) => n !== NO_PERSON)
      .forEach((name) => {
        const s = assistantMonthlyStats[name] || { total: 0, byClass: {} };
        rows.push([name, s.total, ...classList.map((c) => s.byClass[c] || 0)]);
      });
    downloadCsv(`혜성코멧_${year}년${month}월_조교별출근.csv`, rows);
  };

  const exportImage = async () => {
    if (typeof window === "undefined") return;
    setExporting(true);
    // 캡처를 위해 잠깐 전체 일정 + 캘린더 + 데스크탑 모드로 전환
    const prevMode = viewMode;
    const prevRole = role;
    const prevSelected = selectedAssistant;
    const prevDevice = deviceMode;
    if (viewMode !== "calendar") setViewMode("calendar");
    if (role !== "all") setRole("all");
    if (selectedAssistant !== "전체") setSelectedAssistant("전체");
    if (deviceMode !== "web") setDeviceMode("web");
    // 렌더링 반영 대기
    await new Promise((r) => window.setTimeout(r, 250));
    try {
      const target = document.getElementById("schedule-capture");
      if (!target) throw new Error("캡처 대상 요소를 찾지 못했습니다.");
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `혜성코멧_${year}년${month}월_출근표.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSaveStatus("이미지 저장됨 ✓");
    } catch (e) {
      console.error("이미지 저장 실패", e);
      window.alert(
        "이미지 저장에 실패했습니다.\n터미널에서 다음을 실행해 라이브러리를 설치했는지 확인해 주세요:\n\nnpm install html-to-image\n\n(에러: " +
          (e?.message || e) +
          ")"
      );
    } finally {
      if (prevMode !== "calendar") setViewMode(prevMode);
      if (prevRole !== "all") setRole(prevRole);
      if (prevSelected !== "전체") setSelectedAssistant(prevSelected);
      if (prevDevice !== "web") setDeviceMode(prevDevice);
      setExporting(false);
    }
  };

  // 조교별로 각각 이미지 저장 (인원 수만큼 파일 생성)
  const exportPerAssistantImages = async () => {
    if (typeof window === "undefined") return;
    const targets = assistants.filter((n) => n !== NO_PERSON);
    if (!targets.length) {
      window.alert("조교가 없습니다.");
      return;
    }
    if (!window.confirm(`${targets.length}명의 개인 일정 이미지를 각각 다운로드합니다.\n브라우저에서 여러 파일 다운로드 허용 팝업이 뜨면 ‘허용’을 눌러 주세요.\n\n계속하시겠습니까?`)) return;

    setExporting(true);
    const prevMode = viewMode;
    const prevRole = role;
    const prevSelected = selectedAssistant;
    const prevDevice = deviceMode;
    if (viewMode !== "calendar") setViewMode("calendar");
    if (role !== "all") setRole("all");
    if (deviceMode !== "web") setDeviceMode("web");

    try {
      const { toPng } = await import("html-to-image");
      let success = 0;
      for (let i = 0; i < targets.length; i++) {
        const name = targets[i];
        setSelectedAssistant(name);
        setSaveStatus(`${name} 이미지 생성 중... (${i + 1}/${targets.length})`);
        await new Promise((r) => window.setTimeout(r, 350));
        const target = document.getElementById("schedule-capture");
        if (!target) continue;
        const dataUrl = await toPng(target, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `혜성코멧_${year}년${month}월_${name}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        success += 1;
        // 브라우저가 연속 다운로드를 놓치지 않도록 살짝 텀
        await new Promise((r) => window.setTimeout(r, 600));
      }
      setSaveStatus(`조교별 이미지 저장 완료 ✓ (${success}/${targets.length})`);
    } catch (e) {
      console.error("조교별 이미지 저장 실패", e);
      window.alert(
        "이미지 저장에 실패했습니다.\n(에러: " + (e?.message || e) + ")\n\nhtml-to-image가 설치되어 있는지, 브라우저에서 다중 다운로드가 차단되지 않았는지 확인해 주세요."
      );
    } finally {
      if (prevMode !== "calendar") setViewMode(prevMode);
      if (prevRole !== "all") setRole(prevRole);
      setSelectedAssistant(prevSelected);
      if (prevDevice !== "web") setDeviceMode(prevDevice);
      setExporting(false);
    }
  };

  const LessonCard = ({ lesson, compact = false, calendarView = false }) => {
    const dow = new Date(`${lesson.date}T00:00:00`).getDay();
    const isSat = dow === 6;
    const bg = lesson.type === "extra" ? "bg-fuchsia-100" : weekdayCardTone(dow);
    const requested = lesson.swapRequests.includes(currentAssistant);
    const mobile = deviceMode === "mobile";

    // 캘린더 셀 안: 관리자 아닌 화면(전체/조교)에서는 압축 렌더로 세로 길이 최소화하되 가독성 유지
    if (calendarView && !isAdmin) {
      return (
        <div className={`cal-lesson rounded-lg ${bg} p-2 text-xs leading-snug`}>
          <div className="flex items-baseline justify-between gap-1">
            <span className="truncate font-bold">{lesson.title}</span>
            {lesson.type === "extra" && (
              <span className="cal-lesson-pill shrink-0 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">추가</span>
            )}
          </div>
          <div className="cal-lesson-time text-[11px] text-slate-500">
            {lesson.start}~{lesson.end}
          </div>
          <div className="cal-lesson-pills mt-1 flex flex-wrap gap-1">
            {sortAssistantsForDisplay(lesson.assistants)
              .filter((n) => n !== NO_PERSON)
              .map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className={`cal-lesson-pill rounded-md px-1.5 py-0.5 text-[11px] ${
                    lesson.substituteAssistants?.includes(name)
                      ? "bg-orange-200 font-bold text-orange-900"
                      : "bg-white/90 text-slate-700"
                  }`}
                >
                  {name}
                </span>
              ))}
          </div>
          {(lesson.swapHistory || []).length > 0 && (
            <div className="cal-lesson-history mt-1 space-y-0.5 text-[11px] font-semibold text-orange-800">
              {lesson.swapHistory.map((h, i) => (
                <div key={i}>
                  {h.from} → {h.to}
                </div>
              ))}
            </div>
          )}
          {role === "assistant" && (
            <button
              onClick={() => (requested ? cancelSwapRequest(lesson.id) : requestSwap(lesson.id))}
              className={`cal-lesson-swap-btn mt-1.5 h-7 w-full rounded-md text-[11px] font-semibold ${
                requested ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {requested ? "대타 요청 취소" : "대타 요청"}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={`rounded-xl shadow-sm ${bg} ${mobile ? "min-h-[92px] p-2 text-[11px] leading-snug" : "p-2 text-xs"}`}>
        <div className={`flex ${mobile ? "flex-col gap-1" : "items-start justify-between gap-2"}`}>
          <div className="min-w-0">
            <div className="truncate font-bold">{lesson.title}</div>
            <div className="truncate text-slate-600">
              {compact && `${prettyDate(lesson.date)} · `}
              {lesson.start}~{lesson.end}
            </div>
          </div>
          <span className="w-fit rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-slate-500">
            {lesson.type === "extra" ? "추가" : "정규"}
          </span>
        </div>

        {isAdmin ? (
          <>
            <div className="mt-2 space-y-1">
              {lesson.assistants.map((name, index) => (
                <AssistantSlot
                  key={`${lesson.id}-${index}`}
                  value={name}
                  assistants={assistants}
                  onChange={(value) => updateLessonAssistant(lesson.id, index, value)}
                  onRemove={() => removeLessonAssistantSlot(lesson.id, index)}
                />
              ))}
            </div>
            <button onClick={() => addLessonAssistantSlot(lesson.id)} className="mt-1 rounded-lg bg-white/80 px-2 py-1 text-[11px]">
              + 조교 칸 추가
            </button>
            {lesson.assistants.filter((name) => name !== NO_PERSON).length !== 2 && (
              <div className="mt-1 text-[11px] text-amber-700">기본 배정은 2명입니다.</div>
            )}
            {lesson.swapRequests.length > 0 && (
              <div className={`rounded-lg bg-white/70 ${mobile ? "mt-1 p-1" : "mt-2 p-2"}`}>
                <p className="font-bold text-amber-700">대타 요청</p>
                {lesson.swapRequests.map((name) => (
                  <div key={name} className="mt-1 rounded-lg bg-yellow-50 p-2">
                    <p className="mb-1 text-[11px] font-semibold">{name} → 대체 조교 선택</p>
                    <select
                      className="mb-1 w-full rounded-lg border bg-white px-2 py-1"
                      value={swapApprovals[`${lesson.id}-${name}`] || NO_PERSON}
                      onChange={(e) => setSwapApprovals({ ...swapApprovals, [`${lesson.id}-${name}`]: e.target.value })}
                    >
                      {assistants.map((assistant) => (
                        <option key={assistant} value={assistant}>
                          {assistant}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => approveSwap(lesson.id, name)} className="rounded-lg bg-yellow-200 px-2 py-1 text-[11px]">
                      대타 승인
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(lesson.swapHistory || []).length > 0 && (
              <div className="mt-1 space-y-1 rounded-lg bg-orange-100 p-2 text-[11px] text-orange-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold">대타 내역</span>
                  <button onClick={() => clearLessonSwap(lesson.id)} className="rounded bg-white px-2 py-0.5 font-semibold text-orange-700 hover:bg-orange-50">
                    전체 초기화
                  </button>
                </div>
                {lesson.swapHistory.map((item, index) => (
                  <div key={index} className="rounded bg-white p-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                        {item.from} →
                      </span>
                      <button
                        onClick={() => removeSwapHistoryEntry(lesson.id, index)}
                        className="shrink-0 rounded px-1 text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                    <select
                      value={item.to || NO_PERSON}
                      onChange={(e) => updateSwapReplacement(lesson.id, index, e.target.value)}
                      className="mt-1 w-full rounded border bg-orange-50 px-1.5 py-1 text-[11px] font-semibold text-orange-900"
                    >
                      <option value={NO_PERSON}>{NO_PERSON}</option>
                      {assistants
                        .filter((n) => n !== NO_PERSON)
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
                <p className="text-[10px] text-orange-700">대체자를 드롭다운에서 바꾸면 배정도 함께 수정됩니다. 표시만 지우려면 ×, 전부 지우려면 ‘전체 초기화’.</p>
              </div>
            )}
            <div className="mt-2 flex gap-1">
              <button onClick={() => deleteLesson(lesson.id)} className="rounded-lg bg-white px-2 py-1 hover:bg-red-50">
                <Trash2 size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`rounded-lg bg-white/70 ${mobile ? "mt-1 p-1.5" : "mt-2 p-2"}`}>
              <p className="font-semibold">배정 조교</p>
              <div className={`flex flex-wrap ${mobile ? "gap-0.5" : "gap-1"}`}>
                {sortAssistantsForDisplay(lesson.assistants).map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    className={`rounded-full ${mobile ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1"} ${
                      name === NO_PERSON
                        ? "bg-slate-300 text-slate-600"
                        : lesson.substituteAssistants?.includes(name)
                          ? "bg-orange-200 font-bold text-orange-900"
                          : "bg-white"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            {(lesson.swapHistory || []).length > 0 && (
              <div className="mt-1 rounded-lg bg-orange-200 px-2 py-1 text-[11px] font-bold text-orange-900">
                {lesson.swapHistory.map((item, index) => (
                  <div key={index}>{item.from} → {item.to}</div>
                ))}
              </div>
            )}
            {role === "assistant" && (
              <Button
                onClick={() => (requested ? cancelSwapRequest(lesson.id) : requestSwap(lesson.id))}
                variant={requested ? "secondary" : "default"}
                className={`${mobile ? "mt-1 h-6 text-[10px]" : "mt-2 h-8 text-xs"} w-full rounded-lg`}
              >
                {requested ? "대타 요청 취소" : "대타 요청"}
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  const BaseScheduleEditor = ({ dayNum }) => {
    const label = `${days[dayNum]}요일 기본`;
    const tone = weekdayTone(dayNum);
    const removable = dayNum !== 0 && dayNum !== 6;
    return (
      <div className={`rounded-2xl p-3 ${tone}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">{label}</h3>
          <div className="flex gap-1">
            <button onClick={() => addBaseLesson(dayNum)} className="rounded-lg bg-white px-2 py-1 text-xs">
              + 수업
            </button>
            {removable && (
              <button onClick={() => disableWeekday(dayNum)} className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600">
                요일 제거
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {(baseSchedule[dayNum] || []).length === 0 && (
            <p className="rounded-xl bg-white/60 p-3 text-xs text-slate-500">등록된 수업이 없습니다. ‘+ 수업’으로 추가해 주세요.</p>
          )}
          {(baseSchedule[dayNum] || []).map((lesson) => (
            <div key={lesson.id} className="rounded-xl bg-white/80 p-3 text-sm">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <TextInput className="rounded-lg border px-2 py-1" value={lesson.title} onCommit={(value) => updateBaseLesson(dayNum, lesson.id, "title", value)} />
                <input className="rounded-lg border px-2 py-1" type="time" value={lesson.start} onChange={(e) => updateBaseLesson(dayNum, lesson.id, "start", e.target.value)} />
                <input className="rounded-lg border px-2 py-1" type="time" value={lesson.end} onChange={(e) => updateBaseLesson(dayNum, lesson.id, "end", e.target.value)} />
              </div>
              <div className="mt-2 space-y-1">
                {lesson.assistants.map((name, index) => (
                  <AssistantSlot
                    key={`${lesson.id}-base-${index}`}
                    value={name}
                    assistants={assistants}
                    onChange={(value) => updateBaseAssistant(dayNum, lesson.id, index, value)}
                    onRemove={() => removeBaseAssistantSlot(dayNum, lesson.id, index)}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => addBaseAssistantSlot(dayNum, lesson.id)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">
                  + 조교 칸 추가
                </button>
                <button onClick={() => deleteBaseLesson(dayNum, lesson.id)} className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ScheduleView = () => {
    const mobile = deviceMode === "mobile";

    return (
      <Card id="schedule-capture" className="rounded-3xl border-none shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <ClipboardList size={20} /> {year}년 {month}월 {isAllView ? "전체 일정" : isAdmin ? "출근표" : `${currentAssistant} 일정`}
            </h2>
            <div className="flex flex-wrap gap-2 print:hidden">
              <div className="rounded-xl bg-slate-100 p-1">
                <button onClick={() => setViewMode("calendar")} className={`rounded-lg px-3 py-2 text-sm ${viewMode === "calendar" ? "bg-white shadow-sm" : ""}`}>
                  <CalendarDays size={15} className="mr-1 inline" />캘린더형
                </button>
                <button onClick={() => setViewMode("list")} className={`rounded-lg px-3 py-2 text-sm ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}>
                  <List size={15} className="mr-1 inline" />목록형
                </button>
              </div>
              {(isAdmin || isAllView) && (
                <label className="flex items-center gap-2 text-sm">
                  <Search size={16} />
                  <select className="rounded-xl border px-3 py-2" value={selectedAssistant} onChange={(e) => setSelectedAssistant(e.target.value)}>
                    <option>전체</option>
                    {assistants
                      .filter((name) => name !== NO_PERSON)
                      .map((name) => (
                        <option key={name}>{name}</option>
                      ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          {viewMode === "calendar" ? (
            <div className={mobile ? "overflow-x-auto pb-2" : ""}>
              <div className={`grid grid-cols-7 overflow-hidden rounded-2xl border bg-white text-center font-semibold ${mobile ? "min-w-[760px] text-[11px]" : "text-sm"}`}>
                {days.map((d) => (
                  <div key={d} className="border-b bg-slate-100 p-2">
                    {d}
                  </div>
                ))}
                {monthDates.map((d) => {
                  const key = dateKey(d);
                  const inMonth = d.getMonth() === month - 1;
                  const isSat = d.getDay() === 6;
                  const isSun = d.getDay() === 0;
                  const bg = !inMonth ? "bg-slate-50 text-slate-300" : isSat ? "bg-rose-50" : isSun ? "bg-blue-50" : "bg-white";
                  return (
                    <div key={key} className={`cal-cell border text-left ${bg} ${mobile ? "min-h-[120px] p-2" : isAdmin ? "min-h-[180px] p-2" : "min-h-[130px] p-2"}`}>
                      <div className="cal-date mb-1.5 flex justify-between">
                        <span className="font-bold">{d.getDate()}</span>
                        {inMonth && (isSat || isSun) && <span className="cal-badge rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">정규</span>}
                      </div>
                      <div className="cal-lesson-stack space-y-1.5">
                        {(lessonsByDate[key] || []).map((lesson) => (
                          <LessonCard key={lesson.id} lesson={lesson} calendarView />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const availableToAdd = [1, 2, 3, 4, 5].filter((d) => !enabledWeekdays.includes(d));

  const AdminPanel = () => (
    <aside className="space-y-6 print:hidden">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="rounded-xl bg-slate-100 p-1">
            <button onClick={() => setRightTab("extra")} className={`rounded-lg px-3 py-2 text-sm ${rightTab === "extra" ? "bg-white shadow-sm" : ""}`}>
              <Plus size={15} className="mr-1 inline" />수업 추가
            </button>
            <button onClick={() => setRightTab("base")} className={`rounded-lg px-3 py-2 text-sm ${rightTab === "base" ? "bg-white shadow-sm" : ""}`}>
              <Settings size={15} className="mr-1 inline" />기본 일정
            </button>
          </div>

          {rightTab === "extra" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Plus size={20} /> 단일 수업 추가
              </h2>
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setExtra({
                      ...extra,
                      type: "extra",
                      title: extra.title === "정규 수업" ? "추가 수업" : extra.title,
                    })
                  }
                  className={`flex-1 rounded-lg px-3 py-2 text-sm ${extra.type === "extra" ? "bg-white shadow-sm font-semibold" : "text-slate-600"}`}
                >
                  추가 / 직보
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExtra({
                      ...extra,
                      type: "regular",
                      title: extra.title === "추가 수업" ? "정규 수업" : extra.title,
                    })
                  }
                  className={`flex-1 rounded-lg px-3 py-2 text-sm ${extra.type === "regular" ? "bg-white shadow-sm font-semibold" : "text-slate-600"}`}
                >
                  정규 (단일)
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {extra.type === "regular"
                  ? "특정 날짜에 정규 수업 하나만 넣습니다. 기본 일정 템플릿에는 영향 없어요."
                  : "특강·보강·직보 등 정규 외 수업을 추가합니다."}
              </p>

              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setExtra({ ...extra, dateMode: "single" })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm ${extra.dateMode === "single" ? "bg-white shadow-sm font-semibold" : "text-slate-600"}`}
                >
                  단일 날짜
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date(`${extra.date}T00:00:00`);
                    setExtra({
                      ...extra,
                      dateMode: "range",
                      startDate: extra.startDate || extra.date,
                      endDate: extra.endDate || extra.date,
                      weekdays: extra.weekdays && extra.weekdays.length ? extra.weekdays : [base.getDay()],
                    });
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm ${extra.dateMode === "range" ? "bg-white shadow-sm font-semibold" : "text-slate-600"}`}
                >
                  기간 반복
                </button>
              </div>

              {extra.dateMode === "single" ? (
                <input className="w-full rounded-xl border p-2" type="date" value={extra.date} onChange={(e) => setExtra({ ...extra, date: e.target.value })} />
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 text-xs text-slate-600">
                      시작 날짜
                      <input className="w-full rounded-xl border p-2 text-sm" type="date" value={extra.startDate} onChange={(e) => setExtra({ ...extra, startDate: e.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs text-slate-600">
                      종료 날짜
                      <input className="w-full rounded-xl border p-2 text-sm" type="date" value={extra.endDate} onChange={(e) => setExtra({ ...extra, endDate: e.target.value })} />
                    </label>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-600">반복 요일</p>
                    <div className="flex flex-wrap gap-1">
                      {sortWeekdays([0, 1, 2, 3, 4, 5, 6]).map((d) => {
                        const on = extra.weekdays.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const next = on ? extra.weekdays.filter((x) => x !== d) : [...extra.weekdays, d];
                              setExtra({ ...extra, weekdays: next });
                            }}
                            className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                              on ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {days[d]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">체크한 요일마다 기간 안에서 반복 등록됩니다.</p>
                  </div>
                </div>
              )}

              <TextInput
                className="w-full rounded-xl border p-2"
                value={extra.title}
                onCommit={(value) => setExtra({ ...extra, title: value })}
                placeholder={extra.type === "regular" ? "수업명 예: 한성 34기" : "수업명 예: 34기 추가, 35기 직보"}
              />
              <div className="grid grid-cols-2 gap-2">
                <input className="rounded-xl border p-2" type="time" value={extra.start} onChange={(e) => setExtra({ ...extra, start: e.target.value })} />
                <input className="rounded-xl border p-2" type="time" value={extra.end} onChange={(e) => setExtra({ ...extra, end: e.target.value })} />
              </div>
              <div className="space-y-2">
                {extra.assistants.map((name, index) => (
                  <AssistantSlot
                    key={index}
                    value={name}
                    assistants={assistants}
                    onChange={(value) => {
                      const next = [...extra.assistants];
                      next[index] = value;
                      setExtra({ ...extra, assistants: next });
                    }}
                    onRemove={() => {
                      const next = extra.assistants.filter((_, i) => i !== index);
                      setExtra({ ...extra, assistants: next.length ? next : [NO_PERSON] });
                    }}
                  />
                ))}
                <button onClick={() => setExtra({ ...extra, assistants: [...extra.assistants, NO_PERSON] })} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                  + 조교 칸 추가
                </button>
              </div>
              <Button onClick={addExtraLesson} className="w-full rounded-xl">
                {extra.dateMode === "range"
                  ? extra.type === "regular"
                    ? "정규 수업 등록 (기간)"
                    : "추가 수업 등록 (기간)"
                  : extra.type === "regular"
                    ? "정규 수업 등록 (단일)"
                    : "추가 수업 등록"}
              </Button>
            </div>
          )}

          {rightTab === "base" && (
            <div className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Settings size={20} /> 기본 일정 설정
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  요일별로 기본 수업을 등록해 두면 ‘기본 일정으로 생성’을 눌렀을 때 그 달의 해당 요일마다 자동 생성됩니다.
                </p>
                <p className="mt-1 text-xs text-emerald-700">현재 저장 상태: {saveStatus}</p>
              </div>

              {availableToAdd.length > 0 && (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
                  <span className="font-semibold">요일 추가</span>
                  <select className="rounded-lg border bg-white px-2 py-1" value={addWeekday} onChange={(e) => setAddWeekday(e.target.value)}>
                    {availableToAdd.map((d) => (
                      <option key={d} value={d}>
                        {days[d]}요일
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => {
                      const target = availableToAdd.includes(Number(addWeekday)) ? Number(addWeekday) : availableToAdd[0];
                      enableWeekday(target);
                      const next = availableToAdd.filter((d) => d !== target);
                      if (next.length) setAddWeekday(String(next[0]));
                    }}
                    variant="secondary"
                    className="rounded-lg"
                  >
                    추가
                  </Button>
                </div>
              )}

              {enabledWeekdays.map((dayNum) => (
                <BaseScheduleEditor key={dayNum} dayNum={dayNum} />
              ))}

              <Button onClick={saveNow} className="w-full rounded-xl">
                <Save size={16} className="mr-1" />기본 일정 저장
              </Button>
              <div className="rounded-2xl bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-800">이번 달 배정 → 기본 일정으로 저장</p>
                <p className="mt-1 text-xs text-amber-700">
                  캘린더에서 직접 바꾼 이번 달 정규 수업 배정을 요일별 기본 일정으로 덮어씁니다. (각 요일 첫 등장 주 기준)
                </p>
                <Button
                  onClick={() => {
                    if (window.confirm("이번 달 정규 수업 배정을 기본 일정으로 저장할까요? 기존 기본 일정이 덮어쓰기 됩니다.")) saveCurrentMonthAsBase();
                  }}
                  variant="secondary"
                  className="mt-2 w-full rounded-xl"
                >
                  이번 달 정규 → 기본 일정으로 저장
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Users size={20} /> 조교 관리
          </h2>
          <div className="space-y-2">
            <div className="flex gap-2">
              <TextInput className="min-w-0 flex-1 rounded-xl border p-2" value={newAssistant} onCommit={setNewAssistant} placeholder="조교 이름" />
              <TextInput className="w-24 rounded-xl border p-2" value={newAssistantPassword} onCommit={setNewAssistantPassword} placeholder="비밀번호" />
              <Button onClick={addAssistant} variant="secondary" className="rounded-xl">
                <UserPlus size={16} />
              </Button>
            </div>
            <p className="text-xs text-slate-500">비밀번호를 비우면 기본값 {DEFAULT_ASSISTANT_PASSWORD} 으로 설정됩니다.</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600">조교별 비밀번호</p>
            {assistants
              .filter((name) => name !== NO_PERSON)
              .map((name) => (
                <div key={name} className="flex items-center gap-2 rounded-xl bg-slate-100 p-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
                  <TextInput
                    className="w-28 rounded-lg border bg-white px-2 py-1 text-sm"
                    value={assistantPasswords[name] || ""}
                    onCommit={(value) => setAssistantPassword(name, value)}
                    placeholder="미설정"
                  />
                </div>
              ))}
            <p className="text-xs text-slate-500">조교는 본인 이름 + 이 비밀번호로 조교 화면에 입장합니다.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm print:hidden">
        <CardContent className="space-y-3 p-5">
          <h2 className="text-xl font-semibold">내보내기</h2>
          <p className="text-xs text-slate-500">이번 달({year}년 {month}월) 데이터를 다운로드합니다.</p>
          <div className="space-y-2">
            <Button onClick={exportScheduleCsv} variant="secondary" className="w-full rounded-xl">
              CSV: 월간 출근표 (엑셀 열기)
            </Button>
            <Button onClick={exportAssistantSummaryCsv} variant="secondary" className="w-full rounded-xl">
              CSV: 조교별 출근 요약
            </Button>
            <Button onClick={exportImage} disabled={exporting} className="w-full rounded-xl">
              {exporting ? "이미지 생성 중..." : "PNG 이미지 저장 (전체 캘린더)"}
            </Button>
            <Button onClick={exportPerAssistantImages} disabled={exporting} variant="secondary" className="w-full rounded-xl">
              {exporting ? "이미지 생성 중..." : "PNG 이미지 저장 (조교별 각각)"}
            </Button>
          </div>
          <p className="text-[11px] text-slate-500">
            PNG는 전체 일정 캘린더를 그대로 캡처합니다. 그대로 카카오톡·이메일에 붙여 넣을 수 있어요.<br />
            <span className="text-slate-400">조교별 저장 시 브라우저에서 ‘여러 파일 다운로드 허용’ 팝업이 뜨면 허용해 주세요.</span>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-xl font-semibold">조교별 출근 횟수</h2>
          <div className="space-y-3">
            {assistants
              .filter((n) => n !== NO_PERSON)
              .map((name) => {
                const s = assistantMonthlyStats[name] || { total: 0, byClass: {} };
                const entries = Object.entries(s.byClass).sort((a, b) => {
                  const ai = classNames.indexOf(a[0]);
                  const bi = classNames.indexOf(b[0]);
                  if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
                  if (ai === -1) return 1;
                  if (bi === -1) return -1;
                  return ai - bi;
                });
                return (
                  <div key={name} className="rounded-2xl bg-slate-100 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold">{name}</p>
                      <p className="text-sm text-slate-600">
                        이번 달 <b className="text-slate-900">{s.total}회</b>
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {entries.length ? (
                        entries.map(([className, count]) => (
                          <div key={className} className="flex justify-between rounded-xl bg-white px-3 py-1">
                            <span>{className}</span>
                            <b>{count}회</b>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">배정된 수업이 없습니다.</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-xl font-semibold">월간 수업별 출근 횟수</h2>
          <div className="space-y-3">
            {Object.keys(stats)
              .sort((a, b) => classNames.indexOf(a) - classNames.indexOf(b))
              .map((className) => (
                <div key={className} className="rounded-2xl bg-slate-100 p-3">
                  <p className="mb-2 font-bold">{className}</p>
                  <div className="space-y-1 text-sm">
                    {Object.entries(stats[className])
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => (
                        <div key={name} className="flex justify-between rounded-xl bg-white px-3 py-1">
                          <span>{name}</span>
                          <b>{count}회</b>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );

  const AssistantPanel = () => (
    <Card className="rounded-3xl border-none shadow-sm">
      <CardContent className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <User size={20} /> 조교 화면
        </h2>
        <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">로그인</p>
            <p className="truncate text-lg font-bold">{currentAssistant}</p>
          </div>
          <Button onClick={assistantLogout} variant="secondary" className="rounded-xl">
            로그아웃
          </Button>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-sm text-slate-500">이번 달 출근</p>
          <p className="text-3xl font-bold">{visibleLessons.length}회</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="mb-2 text-sm font-semibold">수업별 출근 횟수</p>
          <div className="space-y-1 text-sm">
            {Object.keys(assistantClassStats).length ? (
              Object.entries(assistantClassStats)
                .sort((a, b) => classNames.indexOf(a[0]) - classNames.indexOf(b[0]))
                .map(([className, count]) => (
                  <div key={className} className="flex justify-between rounded-xl bg-white px-3 py-1">
                    <span>{className}</span>
                    <b>{count}회</b>
                  </div>
                ))
            ) : (
              <p className="text-slate-500">배정된 수업이 없습니다.</p>
            )}
          </div>
        </div>
        {settlementText && (
          <div className="rounded-2xl bg-slate-100 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">정산 내역</p>
              <button
                onClick={copySettlement}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95 ${
                  justCopiedSettlement
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-200"
                }`}
              >
                {justCopiedSettlement ? "복사됨 ✓" : "복사"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-white p-3 font-mono text-xs leading-relaxed text-slate-800">
{settlementText}
            </pre>
          </div>
        )}
        {dailyText && (
          <div className="rounded-2xl bg-slate-100 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">날짜별 출근</p>
              <button
                onClick={copyDaily}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95 ${
                  justCopiedDaily
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-200"
                }`}
              >
                {justCopiedDaily ? "복사됨 ✓" : "복사"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-white p-3 font-mono text-xs leading-relaxed text-slate-800">
{dailyText}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 6mm; }
          html, body { background: white !important; }
          .print-hide { display: none !important; }
          main { padding: 0 !important; }
          h1, h2 { font-size: 12pt !important; }
          /* 캘린더 셀 컴팩트 */
          .cal-cell { min-height: 0 !important; padding: 3px !important; }
          .cal-date { font-size: 8pt !important; margin-bottom: 1px !important; }
          .cal-badge { display: none !important; }
          .cal-lesson-stack { gap: 2px !important; }
          .cal-lesson { padding: 2px 3px !important; font-size: 7pt !important; line-height: 1.2 !important; border-radius: 4px !important; }
          .cal-lesson-time { font-size: 6.5pt !important; }
          .cal-lesson-pills { gap: 2px !important; margin-top: 1px !important; }
          .cal-lesson-pill { padding: 0 3px !important; font-size: 6.5pt !important; border-radius: 3px !important; }
          .cal-lesson-swap-btn { display: none !important; }
          .cal-lesson-history { font-size: 6.5pt !important; margin-top: 1px !important; }
          .print-shadow-off { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-sm print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                <CalendarDays size={16} /> 혜성 코멧 학원
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">조교 출근 일정 관리</h1>
              <p className="mt-2 text-sm text-slate-500">{saveStatus}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDeviceMode(deviceMode === "mobile" ? "web" : "mobile")} className="rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm">
                {deviceMode === "mobile" ? "📱 모바일용" : "🖥️ 웹용"}
              </button>
              <div className="rounded-xl bg-slate-100 p-1">
                <button onClick={() => setRole("all")} className={`rounded-lg px-3 py-2 text-sm ${role === "all" ? "bg-white shadow-sm" : ""}`}>
                  <Users size={15} className="mr-1 inline" />전체 일정
                </button>
                <button onClick={() => setRole("assistant")} className={`rounded-lg px-3 py-2 text-sm ${role === "assistant" ? "bg-white shadow-sm" : ""}`}>
                  <User size={15} className="mr-1 inline" />조교
                </button>
                <button onClick={() => setRole("admin")} className={`rounded-lg px-3 py-2 text-sm ${role === "admin" ? "bg-white shadow-sm" : ""}`}>
                  <Shield size={15} className="mr-1 inline" />관리자
                </button>
              </div>
              {role === "admin" && !adminUnlocked && (
                <div className="flex gap-2">
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="관리자 비밀번호" className="rounded-xl border px-3 py-2" />
                  <Button onClick={() => (adminPassword === ADMIN_PASSWORD ? setAdminUnlocked(true) : alert("비밀번호가 올바르지 않습니다."))} className="rounded-xl">
                    입장
                  </Button>
                </div>
              )}
              <input className="w-24 rounded-xl border px-3 py-2" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              <Button onClick={undoLast} disabled={undoStack.length === 0} variant="secondary" className="rounded-xl">
                <Repeat2 size={16} className="mr-1" />되돌리기{undoStack.length > 0 ? ` (${undoStack.length})` : ""}
              </Button>
              <select className="rounded-xl border px-3 py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}월
                  </option>
                ))}
              </select>
              {isAdmin && (
                <Button onClick={loadMonth} className="rounded-xl">
                  <Save size={16} className="mr-1" />기본 일정으로 생성
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {isAdmin ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <ScheduleView />
            <AdminPanel />
          </section>
        ) : isAllView ? (
          <ScheduleView />
        ) : assistantUnlocked ? (
          <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <AssistantPanel />
            <ScheduleView />
          </section>
        ) : (
          <Card className="mx-auto w-full max-w-md rounded-3xl border-none shadow-sm">
            <CardContent className="space-y-4 p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <User size={20} /> 조교 로그인
              </h2>
              <p className="text-sm text-slate-500">본인 이름을 선택하고 비밀번호를 입력하면 출근 일정 확인과 대타 신청을 할 수 있어요.</p>
              <label className="block space-y-1 text-sm">
                이름
                <select
                  className="w-full rounded-xl border px-3 py-2"
                  value={assistantLoginName}
                  onChange={(e) => setAssistantLoginName(e.target.value)}
                >
                  {assistants
                    .filter((name) => name !== NO_PERSON)
                    .map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                비밀번호
                <input
                  type="password"
                  className="w-full rounded-xl border px-3 py-2"
                  value={assistantLoginPassword}
                  onChange={(e) => setAssistantLoginPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") assistantLogin();
                  }}
                  placeholder="비밀번호"
                />
              </label>
              <Button onClick={assistantLogin} className="w-full rounded-xl">
                입장
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
