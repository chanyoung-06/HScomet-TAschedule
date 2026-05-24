"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ClipboardList, List, Plus, Repeat2, Save, Search, Settings, Shield, Trash2, User, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "hscomet-ta-schedule-v2";
const ADMIN_PASSWORD = "hscomet101";
const SUPABASE_STATE_ID = "main";
const SUPABASE_URL_FALLBACK = "https://msdikmalqkhmkwqzbpkm.supabase.co";
const SUPABASE_ANON_KEY_FALLBACK = "sb_publishable_TmBNhYVTTgcsaeGavMkgeQ_QbIAmlTM";
const supabaseUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_FALLBACK : SUPABASE_URL_FALLBACK;
const supabaseAnonKey = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK : SUPABASE_ANON_KEY_FALLBACK;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const NO_PERSON = "인원 없음";

const days = ["일", "월", "화", "수", "목", "금", "토"];
const classNames = ["한성 33기", "한성 34기", "한성 35기", "세종 17기", "세종 19기"];

const defaultBaseSchedule = {
  saturday: [
    { id: "sat-1", title: "한성 34기", start: "09:30", end: "12:30", assistants: ["이찬영", "송은호"] },
    { id: "sat-2", title: "한성 35기", start: "13:00", end: "16:00", assistants: ["이찬영", "정율제"] },
    { id: "sat-3", title: "한성 33기", start: "16:00", end: "19:00", assistants: ["이찬영", "정율제"] },
    { id: "sat-4", title: "세종 19기", start: "19:30", end: "22:30", assistants: [NO_PERSON, "정율제"] },
  ],
  sunday: [
    { id: "sun-1", title: "세종 17기", start: "09:30", end: "12:30", assistants: ["강지후", NO_PERSON] },
    { id: "sun-2", title: "한성 34기", start: "13:00", end: "16:00", assistants: ["강지후", "송은호"] },
    { id: "sun-3", title: "한성 35기", start: "16:00", end: "19:00", assistants: ["강지후", "송은호"] },
  ],
};

const assistantSeed = ["강지후", "송은호", "정율제", "이찬영", NO_PERSON];

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

function makeLesson({ date, title, start, end, assistants, type, id }) {
  return {
    id: id || `${type}-${date}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date,
    title,
    start,
    end,
    assistants: cleanAssistants(assistants),
    type,
    swap: false,
    swapRequests: [],
    swapHistory: [],
    substituteAssistants: [],
  };
}

function generateMonthLessons(year, month, baseSchedule, vacationSchedules = []) {
  const dates = getMonthDates(year, month).filter((d) => d.getMonth() === month - 1);
  const lessons = [];

  dates.forEach((d) => {
    const key = dateKey(d);
    const day = d.getDay();
    const regular = day === 6 ? baseSchedule.saturday : day === 0 ? baseSchedule.sunday : [];

    regular.forEach((item, index) => {
      lessons.push(makeLesson({
        id: `${key}-regular-${index}`,
        date: key,
        title: item.title,
        start: item.start,
        end: item.end,
        assistants: item.assistants,
        type: "regular",
      }));
    });

    vacationSchedules.forEach((item, index) => {
      if (key < item.startDate || key > item.endDate) return;
      if (Number(item.weekday) !== day) return;
      lessons.push(makeLesson({
        id: `${key}-vacation-${index}`,
        date: key,
        title: item.title,
        start: item.start,
        end: item.end,
        assistants: item.assistants,
        type: "vacation",
      }));
    });
  });

  return lessons;
}

function AssistantSlot({ value, assistants, onChange, onRemove }) {
  return (
    <div className="flex gap-1">
      <select className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1" value={value || NO_PERSON} onChange={(e) => onChange(e.target.value)}>
        <option value={NO_PERSON}>{NO_PERSON}</option>
        {assistants.filter((name) => name !== NO_PERSON).map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <button onClick={onRemove} className="rounded-lg bg-white px-2 py-1 text-slate-500 hover:text-red-500">×</button>
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
  const [vacationSchedules, setVacationSchedules] = useState([]);
  const [lessons, setLessons] = useState(() => generateMonthLessons(today.getFullYear(), today.getMonth() + 1, defaultBaseSchedule, []));
  const [viewMode, setViewMode] = useState("calendar");
  const [rightTab, setRightTab] = useState("extra");
  const [newAssistant, setNewAssistant] = useState("");
  const [saveStatus, setSaveStatus] = useState(supabase ? "DB 연결 준비 중" : "브라우저 저장 모드");
  const [storageReady, setStorageReady] = useState(false);
  const remoteUpdateRef = useRef(false);
  const [swapApprovals, setSwapApprovals] = useState({});
  const [extra, setExtra] = useState({ date: dateKey(today), title: "추가 수업", start: "10:00", end: "13:00", assistants: [NO_PERSON, NO_PERSON] });
  const [vacationForm, setVacationForm] = useState({ startDate: dateKey(today), endDate: dateKey(today), weekday: "1", title: "방학 정규 수업", start: "10:00", end: "13:00", assistants: [NO_PERSON, NO_PERSON] });

  const applySavedState = (data) => {
    if (!data) return;
    if (data.year) setYear(data.year);
    if (data.month) setMonth(data.month);
    if (data.assistants) setAssistants(data.assistants);
    if (data.currentAssistant) setCurrentAssistant(data.currentAssistant);
    if (data.selectedAssistant) setSelectedAssistant(data.selectedAssistant);
    if (data.baseSchedule) setBaseSchedule(data.baseSchedule);
    if (data.vacationSchedules) setVacationSchedules(data.vacationSchedules);
    if (data.lessons) setLessons(data.lessons);
    if (data.viewMode) setViewMode(data.viewMode);
  };

  useEffect(() => {
    const loadSavedState = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from("app_state")
            .select("data")
            .eq("id", SUPABASE_STATE_ID)
            .maybeSingle();

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

    const data = { year, month, assistants, currentAssistant, selectedAssistant, baseSchedule, vacationSchedules, lessons, viewMode };
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
        alert(error.message);
      } else {
        setSaveStatus("DB에 저장됨");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [storageReady, year, month, assistants, currentAssistant, selectedAssistant, baseSchedule, vacationSchedules, lessons, viewMode]);

  const isAdmin = role === "admin" && adminUnlocked;
  const isAllView = role === "all";
  const monthDates = useMemo(() => getMonthDates(year, month), [year, month]);

  const visibleLessons = useMemo(() => {
    const target = isAdmin || isAllView ? selectedAssistant : currentAssistant;
    const filtered = target === "전체" ? lessons : lessons.filter((lesson) => lesson.assistants.includes(target));
    return [...filtered].sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }, [lessons, selectedAssistant, currentAssistant, isAdmin, isAllView]);

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
    lessons.forEach((lesson) => {
      result[lesson.title] ||= {};
      lesson.assistants.filter((name) => name && name !== NO_PERSON).forEach((name) => {
        result[lesson.title][name] = (result[lesson.title][name] || 0) + 1;
      });
    });
    return result;
  }, [lessons]);

  const assistantClassStats = useMemo(() => {
    const result = {};
    lessons.forEach((lesson) => {
      if (!lesson.assistants.includes(currentAssistant)) return;
      result[lesson.title] = (result[lesson.title] || 0) + 1;
    });
    return result;
  }, [lessons, currentAssistant]);

  const loadMonth = () => {
    setLessons(generateMonthLessons(year, month, baseSchedule, vacationSchedules));
    setSelectedAssistant("전체");
  };

  const addAssistant = () => {
    const name = newAssistant.trim();
    if (!name || name === NO_PERSON || assistants.includes(name)) return;
    setAssistants([...assistants.filter((x) => x !== NO_PERSON), name, NO_PERSON]);
    setNewAssistant("");
  };

  const updateLessonAssistant = (id, index, value) => {
    setLessons((prev) => prev.map((lesson) => {
      if (lesson.id !== id) return lesson;
      const next = [...lesson.assistants];
      next[index] = value || NO_PERSON;
      return { ...lesson, assistants: next };
    }));
  };

  const addLessonAssistantSlot = (id) => {
    setLessons((prev) => prev.map((lesson) => lesson.id === id ? { ...lesson, assistants: [...lesson.assistants, NO_PERSON] } : lesson));
  };

  const removeLessonAssistantSlot = (id, index) => {
    setLessons((prev) => prev.map((lesson) => {
      if (lesson.id !== id) return lesson;
      const next = lesson.assistants.filter((_, i) => i !== index);
      return { ...lesson, assistants: next.length ? next : [NO_PERSON] };
    }));
  };

  const addExtraLesson = () => {
    setLessons((prev) => [...prev, makeLesson({ ...extra, assistants: cleanAssistants(extra.assistants), type: "extra" })]);
    setExtra({ ...extra, title: "추가 수업", assistants: [NO_PERSON, NO_PERSON] });
  };

  const addVacationSchedule = () => {
    setVacationSchedules((prev) => [...prev, { ...vacationForm, id: `vacation-${Date.now()}`, assistants: cleanAssistants(vacationForm.assistants) }]);
  };

  const updateBaseLesson = (dayKey, id, field, value) => {
    setBaseSchedule((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((lesson) => lesson.id === id ? { ...lesson, [field]: value } : lesson),
    }));
  };

  const updateBaseAssistant = (dayKey, id, index, value) => {
    setBaseSchedule((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((lesson) => {
        if (lesson.id !== id) return lesson;
        const next = [...lesson.assistants];
        next[index] = value || NO_PERSON;
        return { ...lesson, assistants: next };
      }),
    }));
  };

  const addBaseLesson = (dayKey) => {
    setBaseSchedule((prev) => ({
      ...prev,
      [dayKey]: [...prev[dayKey], { id: `${dayKey}-${Date.now()}`, title: "새 정규 수업", start: "10:00", end: "13:00", assistants: [NO_PERSON, NO_PERSON] }],
    }));
  };

  const deleteBaseLesson = (dayKey, id) => {
    setBaseSchedule((prev) => ({ ...prev, [dayKey]: prev[dayKey].filter((lesson) => lesson.id !== id) }));
  };

  const requestSwap = (id) => {
    setLessons((prev) => prev.map((lesson) => {
      if (lesson.id !== id || lesson.swapRequests.includes(currentAssistant)) return lesson;
      return { ...lesson, swap: true, swapRequests: [...lesson.swapRequests, currentAssistant] };
    }));
  };

  const cancelSwapRequest = (id) => {
    setLessons((prev) => prev.map((lesson) => lesson.id === id ? { ...lesson, swapRequests: lesson.swapRequests.filter((name) => name !== currentAssistant) } : lesson));
  };

  const approveSwap = (id, requester) => {
    const replacement = swapApprovals[`${id}-${requester}`] || NO_PERSON;
    setLessons((prev) => prev.map((lesson) => {
      if (lesson.id !== id) return lesson;
      return {
        ...lesson,
        assistants: lesson.assistants.map((name) => name === requester ? replacement : name),
        swap: true,
        swapRequests: lesson.swapRequests.filter((name) => name !== requester),
        substituteAssistants: replacement !== NO_PERSON ? [...new Set([...(lesson.substituteAssistants || []), replacement])] : lesson.substituteAssistants || [],
        swapHistory: [...(lesson.swapHistory || []), { from: requester, to: replacement }],
      };
    }));
  };

  const deleteLesson = (id) => setLessons((prev) => prev.filter((lesson) => lesson.id !== id));

  const LessonCard = ({ lesson, compact = false }) => {
    const isSat = new Date(`${lesson.date}T00:00:00`).getDay() === 6;
    const bg = lesson.type === "extra" ? "bg-fuchsia-100" : lesson.type === "vacation" ? "bg-emerald-100" : isSat ? "bg-rose-100" : "bg-blue-100";
    const requested = lesson.swapRequests.includes(currentAssistant);

    return (
      <div className={`rounded-xl p-2 text-xs shadow-sm ${bg}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold">{lesson.title}</div>
            <div className="text-slate-600">{compact && `${prettyDate(lesson.date)} · `}{lesson.start}~{lesson.end}</div>
          </div>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-slate-500">{lesson.type === "extra" ? "추가" : lesson.type === "vacation" ? "방학 정규" : "정규"}</span>
        </div>

        {isAdmin ? (
          <>
            <div className="mt-2 space-y-1">
              {lesson.assistants.map((name, index) => <AssistantSlot key={`${lesson.id}-${index}`} value={name} assistants={assistants} onChange={(value) => updateLessonAssistant(lesson.id, index, value)} onRemove={() => removeLessonAssistantSlot(lesson.id, index)} />)}
            </div>
            <button onClick={() => addLessonAssistantSlot(lesson.id)} className="mt-1 rounded-lg bg-white/80 px-2 py-1 text-[11px]">+ 조교 칸 추가</button>
            {lesson.assistants.filter((name) => name !== NO_PERSON).length !== 2 && <div className="mt-1 text-[11px] text-amber-700">기본 배정은 2명입니다.</div>}
            {lesson.swapRequests.length > 0 && (
              <div className="mt-2 rounded-lg bg-white/70 p-2">
                <p className="font-bold text-amber-700">대타 요청</p>
                {lesson.swapRequests.map((name) => (
                  <div key={name} className="mt-1 rounded-lg bg-yellow-50 p-2">
                    <p className="mb-1 text-[11px] font-semibold">{name} → 대체 조교 선택</p>
                    <select className="mb-1 w-full rounded-lg border bg-white px-2 py-1" value={swapApprovals[`${lesson.id}-${name}`] || NO_PERSON} onChange={(e) => setSwapApprovals({ ...swapApprovals, [`${lesson.id}-${name}`]: e.target.value })}>
                      {assistants.map((assistant) => <option key={assistant} value={assistant}>{assistant}</option>)}
                    </select>
                    <button onClick={() => approveSwap(lesson.id, name)} className="rounded-lg bg-yellow-200 px-2 py-1 text-[11px]">대타 승인</button>
                  </div>
                ))}
              </div>
            )}
            {(lesson.swapHistory || []).length > 0 && <div className="mt-1 rounded-lg bg-orange-200 px-2 py-1 text-[11px] font-bold text-orange-900">{lesson.swapHistory.map((item, index) => <div key={index}>{item.from} → {item.to}</div>)}</div>}
            <div className="mt-2 flex gap-1">
              <button onClick={() => deleteLesson(lesson.id)} className="rounded-lg bg-white px-2 py-1 hover:bg-red-50"><Trash2 size={12} /></button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 rounded-lg bg-white/70 p-2">
              <p className="font-semibold">배정 조교</p>
              <div className="flex flex-wrap gap-1">
                {lesson.assistants.map((name, index) => <span key={`${name}-${index}`} className={`rounded-full px-2 py-1 ${name === NO_PERSON ? "bg-slate-300 text-slate-600" : lesson.substituteAssistants?.includes(name) ? "bg-orange-200 font-bold text-orange-900" : "bg-white"}`}>{name}</span>)}
              </div>
            </div>
            {(lesson.swapHistory || []).length > 0 && <div className="mt-1 rounded-lg bg-orange-200 px-2 py-1 text-[11px] font-bold text-orange-900">{lesson.swapHistory.map((item, index) => <div key={index}>{item.from} → {item.to}</div>)}</div>}
            {role === "assistant" && <Button onClick={() => requested ? cancelSwapRequest(lesson.id) : requestSwap(lesson.id)} variant={requested ? "secondary" : "default"} className="mt-2 h-8 w-full rounded-lg text-xs">{requested ? "대타 요청 취소" : "대타 요청"}</Button>}
          </>
        )}
      </div>
    );
  };

  const BaseScheduleEditor = ({ dayKey, label, tone }) => (
    <div className={`rounded-2xl p-3 ${tone}`}>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{label}</h3><button onClick={() => addBaseLesson(dayKey)} className="rounded-lg bg-white px-2 py-1 text-xs">+ 수업</button></div>
      <div className="space-y-3">
        {baseSchedule[dayKey].map((lesson) => (
          <div key={lesson.id} className="rounded-xl bg-white/80 p-3 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <TextInput className="rounded-lg border px-2 py-1" value={lesson.title} onCommit={(value) => updateBaseLesson(dayKey, lesson.id, "title", value)} />
              <input className="rounded-lg border px-2 py-1" type="time" value={lesson.start} onChange={(e) => updateBaseLesson(dayKey, lesson.id, "start", e.target.value)} />
              <input className="rounded-lg border px-2 py-1" type="time" value={lesson.end} onChange={(e) => updateBaseLesson(dayKey, lesson.id, "end", e.target.value)} />
            </div>
            <div className="mt-2 space-y-1">
              {lesson.assistants.map((name, index) => <AssistantSlot key={`${lesson.id}-base-${index}`} value={name} assistants={assistants} onChange={(value) => updateBaseAssistant(dayKey, lesson.id, index, value)} onRemove={() => updateBaseAssistant(dayKey, lesson.id, index, NO_PERSON)} />)}
            </div>
            <button onClick={() => deleteBaseLesson(dayKey, lesson.id)} className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600">삭제</button>
          </div>
        ))}
      </div>
    </div>
  );

  const ScheduleView = () => (
    <Card className="rounded-3xl border-none shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><ClipboardList size={20} /> {year}년 {month}월 {isAllView ? "전체 일정" : isAdmin ? "출근표" : `${currentAssistant} 일정`}</h2>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-slate-100 p-1">
              <button onClick={() => setViewMode("calendar")} className={`rounded-lg px-3 py-2 text-sm ${viewMode === "calendar" ? "bg-white shadow-sm" : ""}`}><CalendarDays size={15} className="mr-1 inline" />캘린더형</button>
              <button onClick={() => setViewMode("list")} className={`rounded-lg px-3 py-2 text-sm ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}><List size={15} className="mr-1 inline" />목록형</button>
            </div>
            {(isAdmin || isAllView) && <label className="flex items-center gap-2 text-sm"><Search size={16} /><select className="rounded-xl border px-3 py-2" value={selectedAssistant} onChange={(e) => setSelectedAssistant(e.target.value)}><option>전체</option>{assistants.filter((name) => name !== NO_PERSON).map((name) => <option key={name}>{name}</option>)}</select></label>}
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-7 overflow-hidden rounded-2xl border bg-white text-center text-sm font-semibold">
            {days.map((d) => <div key={d} className="border-b bg-slate-100 p-2">{d}</div>)}
            {monthDates.map((d) => {
              const key = dateKey(d);
              const inMonth = d.getMonth() === month - 1;
              const isSat = d.getDay() === 6;
              const isSun = d.getDay() === 0;
              const bg = !inMonth ? "bg-slate-50 text-slate-300" : isSat ? "bg-rose-50" : isSun ? "bg-blue-50" : "bg-white";
              return <div key={key} className={`min-h-[220px] border p-2 text-left ${bg}`}><div className="mb-2 flex justify-between"><span className="font-bold">{d.getDate()}</span>{inMonth && (isSat || isSun) && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">정규</span>}</div><div className="space-y-2">{(lessonsByDate[key] || []).map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}</div></div>;
            })}
          </div>
        ) : (
          <div className="space-y-3">{visibleLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} compact />)}</div>
        )}
      </CardContent>
    </Card>
  );

  const AdminPanel = () => (
    <aside className="space-y-6">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="rounded-xl bg-slate-100 p-1">
            <button onClick={() => setRightTab("extra")} className={`rounded-lg px-3 py-2 text-sm ${rightTab === "extra" ? "bg-white shadow-sm" : ""}`}><Plus size={15} className="mr-1 inline" />추가 수업</button>
            <button onClick={() => setRightTab("base")} className={`rounded-lg px-3 py-2 text-sm ${rightTab === "base" ? "bg-white shadow-sm" : ""}`}><Settings size={15} className="mr-1 inline" />기본 일정</button>
            <button onClick={() => setRightTab("vacation")} className={`rounded-lg px-3 py-2 text-sm ${rightTab === "vacation" ? "bg-white shadow-sm" : ""}`}><CalendarDays size={15} className="mr-1 inline" />방학 정규</button>
          </div>

          {rightTab === "extra" && <div className="space-y-4"><h2 className="flex items-center gap-2 text-xl font-semibold"><Plus size={20} /> 추가 수업 추가</h2><input className="w-full rounded-xl border p-2" type="date" value={extra.date} onChange={(e) => setExtra({ ...extra, date: e.target.value })} /><TextInput className="w-full rounded-xl border p-2" value={extra.title} onCommit={(value) => setExtra({ ...extra, title: value })} placeholder="수업명 예: 34기 추가 A" /><div className="grid grid-cols-2 gap-2"><input className="rounded-xl border p-2" type="time" value={extra.start} onChange={(e) => setExtra({ ...extra, start: e.target.value })} /><input className="rounded-xl border p-2" type="time" value={extra.end} onChange={(e) => setExtra({ ...extra, end: e.target.value })} /></div><div className="space-y-2">{extra.assistants.map((name, index) => <AssistantSlot key={index} value={name} assistants={assistants} onChange={(value) => { const next = [...extra.assistants]; next[index] = value; setExtra({ ...extra, assistants: next }); }} onRemove={() => { const next = extra.assistants.filter((_, i) => i !== index); setExtra({ ...extra, assistants: next.length ? next : [NO_PERSON] }); }} />)}<button onClick={() => setExtra({ ...extra, assistants: [...extra.assistants, NO_PERSON] })} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">+ 조교 칸 추가</button></div><Button onClick={addExtraLesson} className="w-full rounded-xl">추가 수업 등록</Button></div>}

          {rightTab === "base" && <div className="space-y-4"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Settings size={20} /> 기본 일정 설정</h2><p className="mt-1 text-sm text-slate-500">수정 후 ‘기본 일정으로 생성’을 누르면 선택한 달에 반영됩니다.</p></div><BaseScheduleEditor dayKey="saturday" label="토요일 기본" tone="bg-rose-50" /><BaseScheduleEditor dayKey="sunday" label="일요일 기본" tone="bg-blue-50" /></div>}

          {rightTab === "vacation" && <div className="space-y-4"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarDays size={20} /> 방학 정규 수업</h2><p className="mt-1 text-sm text-slate-500">개강일~종강일 사이의 지정 요일마다 반복 추가됩니다.</p></div><div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-sm">개강 날짜<input className="w-full rounded-xl border p-2" type="date" value={vacationForm.startDate} onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })} /></label><label className="space-y-1 text-sm">종강 날짜<input className="w-full rounded-xl border p-2" type="date" value={vacationForm.endDate} onChange={(e) => setVacationForm({ ...vacationForm, endDate: e.target.value })} /></label></div><label className="block space-y-1 text-sm">요일<select className="w-full rounded-xl border p-2" value={vacationForm.weekday} onChange={(e) => setVacationForm({ ...vacationForm, weekday: e.target.value })}>{days.map((day, index) => <option key={day} value={index}>{day}요일</option>)}</select></label><TextInput className="w-full rounded-xl border p-2" value={vacationForm.title} onCommit={(value) => setVacationForm({ ...vacationForm, title: value })} placeholder="수업명 예: 34기 방학특강" /><div className="grid grid-cols-2 gap-2"><input className="rounded-xl border p-2" type="time" value={vacationForm.start} onChange={(e) => setVacationForm({ ...vacationForm, start: e.target.value })} /><input className="rounded-xl border p-2" type="time" value={vacationForm.end} onChange={(e) => setVacationForm({ ...vacationForm, end: e.target.value })} /></div><div className="space-y-2">{vacationForm.assistants.map((name, index) => <AssistantSlot key={index} value={name} assistants={assistants} onChange={(value) => { const next = [...vacationForm.assistants]; next[index] = value; setVacationForm({ ...vacationForm, assistants: next }); }} onRemove={() => { const next = vacationForm.assistants.filter((_, i) => i !== index); setVacationForm({ ...vacationForm, assistants: next.length ? next : [NO_PERSON] }); }} />)}<button onClick={() => setVacationForm({ ...vacationForm, assistants: [...vacationForm.assistants, NO_PERSON] })} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">+ 조교 칸 추가</button></div><Button onClick={addVacationSchedule} className="w-full rounded-xl">방학 정규 등록</Button><div className="space-y-2">{vacationSchedules.map((schedule) => <div key={schedule.id} className="rounded-2xl bg-emerald-50 p-3 text-sm"><div className="font-bold">{schedule.title}</div><div>{schedule.startDate}~{schedule.endDate} · {days[Number(schedule.weekday)]}요일 · {schedule.start}~{schedule.end}</div><div className="text-slate-600">{schedule.assistants.join(" · ")}</div><button onClick={() => setVacationSchedules(vacationSchedules.filter((x) => x.id !== schedule.id))} className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600">삭제</button></div>)}</div></div>}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm"><CardContent className="space-y-4 p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Users size={20} /> 조교 관리</h2><div className="flex gap-2"><TextInput className="min-w-0 flex-1 rounded-xl border p-2" value={newAssistant} onCommit={setNewAssistant} placeholder="조교 이름" /><Button onClick={addAssistant} variant="secondary" className="rounded-xl"><UserPlus size={16} /></Button></div><div className="flex flex-wrap gap-2">{assistants.map((name) => <span key={name} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{name}</span>)}</div></CardContent></Card>

      <Card className="rounded-3xl border-none shadow-sm"><CardContent className="space-y-4 p-5"><h2 className="text-xl font-semibold">월간 수업별 출근 횟수</h2><div className="space-y-3">{Object.keys(stats).sort((a, b) => classNames.indexOf(a) - classNames.indexOf(b)).map((className) => <div key={className} className="rounded-2xl bg-slate-100 p-3"><p className="mb-2 font-bold">{className}</p><div className="space-y-1 text-sm">{Object.entries(stats[className]).sort((a, b) => b[1] - a[1]).map(([name, count]) => <div key={name} className="flex justify-between rounded-xl bg-white px-3 py-1"><span>{name}</span><b>{count}회</b></div>)}</div></div>)}</div></CardContent></Card>
    </aside>
  );

  const AssistantPanel = () => (
    <Card className="rounded-3xl border-none shadow-sm"><CardContent className="space-y-4 p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><User size={20} /> 조교 화면</h2><label className="block space-y-2 text-sm">내 이름<select className="w-full rounded-xl border px-3 py-2" value={currentAssistant} onChange={(e) => setCurrentAssistant(e.target.value)}>{assistants.filter((name) => name !== NO_PERSON).map((name) => <option key={name}>{name}</option>)}</select></label><div className="rounded-2xl bg-slate-100 p-4"><p className="text-sm text-slate-500">이번 달 출근</p><p className="text-3xl font-bold">{visibleLessons.length}회</p></div><div className="rounded-2xl bg-slate-100 p-4"><p className="mb-2 text-sm font-semibold">수업별 출근 횟수</p><div className="space-y-1 text-sm">{Object.keys(assistantClassStats).length ? Object.entries(assistantClassStats).sort((a, b) => classNames.indexOf(a[0]) - classNames.indexOf(b[0])).map(([className, count]) => <div key={className} className="flex justify-between rounded-xl bg-white px-3 py-1"><span>{className}</span><b>{count}회</b></div>) : <p className="text-slate-500">배정된 수업이 없습니다.</p>}</div></div></CardContent></Card>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"><CalendarDays size={16} /> 혜성 코멧 학원</p><h1 className="text-3xl font-bold tracking-tight md:text-4xl">조교 출근 일정 관리</h1><p className="mt-2 text-sm text-slate-500">{saveStatus}</p></div>
            <div className="flex flex-wrap gap-2"><div className="rounded-xl bg-slate-100 p-1"><button onClick={() => setRole("all")} className={`rounded-lg px-3 py-2 text-sm ${role === "all" ? "bg-white shadow-sm" : ""}`}><Users size={15} className="mr-1 inline" />전체 일정</button><button onClick={() => setRole("assistant")} className={`rounded-lg px-3 py-2 text-sm ${role === "assistant" ? "bg-white shadow-sm" : ""}`}><User size={15} className="mr-1 inline" />조교</button><button onClick={() => setRole("admin")} className={`rounded-lg px-3 py-2 text-sm ${role === "admin" ? "bg-white shadow-sm" : ""}`}><Shield size={15} className="mr-1 inline" />관리자</button></div>{role === "admin" && !adminUnlocked && <div className="flex gap-2"><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="관리자 비밀번호" className="rounded-xl border px-3 py-2" /><Button onClick={() => adminPassword === ADMIN_PASSWORD ? setAdminUnlocked(true) : alert("비밀번호가 올바르지 않습니다.")} className="rounded-xl">입장</Button></div>}<input className="w-24 rounded-xl border px-3 py-2" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /><select className="rounded-xl border px-3 py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}</select>{isAdmin && <Button onClick={loadMonth} className="rounded-xl"><Save size={16} className="mr-1" />기본 일정으로 생성</Button>}</div>
          </div>
        </motion.header>

        {isAdmin ? <section className="grid gap-6 lg:grid-cols-[1fr_390px]"><ScheduleView /><AdminPanel /></section> : isAllView ? <ScheduleView /> : <section className="grid gap-6 lg:grid-cols-[320px_1fr]"><AssistantPanel /><ScheduleView /></section>}
      </div>
    </main>
  );
}
