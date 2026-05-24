"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const defaultBaseSchedule = {
  saturday: [
    {
      id: "sat-1",
      title: "한성 34기",
      start: "09:30",
      end: "12:30",
      assistants: ["이찬영", "송은호"],
    },
    {
      id: "sat-2",
      title: "한성 35기",
      start: "13:00",
      end: "16:00",
      assistants: ["이찬영", "정율제"],
    },
  ],

  sunday: [
    {
      id: "sun-1",
      title: "세종 17기",
      start: "09:30",
      end: "12:30",
      assistants: ["강지후", "인원 없음"],
    },
  ],
};

const assistantSeed = [
  "강지후",
  "송은호",
  "정율제",
  "이찬영",
  "인원 없음",
];

const days = ["일", "월", "화", "수", "목", "금", "토"];

const STORAGE_KEY = "hscomet-schedule-v1";
const ADMIN_PASSWORD = "hscomet101";

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
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

function generateMonthLessons(year, month, baseSchedule) {
  const dates = getMonthDates(year, month).filter(
    (d) => d.getMonth() === month - 1
  );

  const lessons = [];

  dates.forEach((d) => {
    const key = dateKey(d);

    const day = d.getDay();

    const regular =
      day === 6
        ? baseSchedule.saturday
        : day === 0
        ? baseSchedule.sunday
        : [];

    regular.forEach((item, index) => {
      lessons.push({
        id: `${key}-${index}`,
        date: key,
        title: item.title,
        start: item.start,
        end: item.end,
        assistants: item.assistants,
        type: "regular",
        swap: false,
        swapRequests: [],
      });
    });
  });

  return lessons;
}

function AssistantSlot({
  value,
  assistants,
  onChange,
  onRemove,
}) {
  return (
    <div className="flex gap-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border px-2 py-1"
      >
        {assistants.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>

      <button
        onClick={onRemove}
        className="rounded-lg bg-white px-2 py-1 text-red-500"
      >
        ×
      </button>
    </div>
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

  const [currentAssistant, setCurrentAssistant] =
    useState("강지후");

  const [selectedAssistant, setSelectedAssistant] =
    useState("전체");

  const [baseSchedule, setBaseSchedule] = useState(
    defaultBaseSchedule
  );

  const [lessons, setLessons] = useState(() =>
    generateMonthLessons(
      today.getFullYear(),
      today.getMonth() + 1,
      defaultBaseSchedule
    )
  );

  const [newAssistant, setNewAssistant] = useState("");

  const [viewMode, setViewMode] = useState("calendar");

  const [extra, setExtra] = useState({
    date: dateKey(today),
    title: "",
    start: "10:00",
    end: "13:00",
    assistants: ["인원 없음", "인원 없음"],
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    const parsed = JSON.parse(saved);

    setLessons(parsed.lessons || []);
    setAssistants(parsed.assistants || assistantSeed);
    setBaseSchedule(
      parsed.baseSchedule || defaultBaseSchedule
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lessons,
        assistants,
        baseSchedule,
      })
    );
  }, [lessons, assistants, baseSchedule]);

  const isAdmin = role === "admin" && adminUnlocked;

  const visibleLessons = useMemo(() => {
    if (role === "all") return lessons;

    if (isAdmin) {
      if (selectedAssistant === "전체") return lessons;

      return lessons.filter((lesson) =>
        lesson.assistants.includes(selectedAssistant)
      );
    }

    return lessons.filter((lesson) =>
      lesson.assistants.includes(currentAssistant)
    );
  }, [
    lessons,
    role,
    currentAssistant,
    selectedAssistant,
    isAdmin,
  ]);

  const lessonsByDate = useMemo(() => {
    const map = {};

    visibleLessons.forEach((lesson) => {
      map[lesson.date] ||= [];
      map[lesson.date].push(lesson);
    });

    return map;
  }, [visibleLessons]);

  function loadMonth() {
    setLessons(
      generateMonthLessons(year, month, baseSchedule)
    );
  }

  function addAssistant() {
    const name = newAssistant.trim();

    if (!name) return;

    if (assistants.includes(name)) return;

    setAssistants([
      ...assistants.filter((x) => x !== "인원 없음"),
      name,
      "인원 없음",
    ]);

    setNewAssistant("");
  }

  function addExtraLesson() {
    setLessons((prev) => [
      ...prev,
      {
        id: `extra-${Date.now()}`,
        date: extra.date,
        title: extra.title || "추가 수업",
        start: extra.start,
        end: extra.end,
        assistants: extra.assistants,
        type: "extra",
        swap: false,
        swapRequests: [],
      },
    ]);
  }

  function updateLessonAssistant(id, index, value) {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;

        const next = [...lesson.assistants];

        next[index] = value;

        return {
          ...lesson,
          assistants: next,
        };
      })
    );
  }

  function deleteLesson(id) {
    setLessons((prev) =>
      prev.filter((lesson) => lesson.id !== id)
    );
  }

  function requestSwap(id) {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;

        if (
          lesson.swapRequests.includes(currentAssistant)
        ) {
          return lesson;
        }

        return {
          ...lesson,
          swap: true,
          swapRequests: [
            ...lesson.swapRequests,
            currentAssistant,
          ],
        };
      })
    );
  }

  function approveSwap(id, requester) {
    setLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.id !== id) return lesson;

        const nextAssistants =
          lesson.assistants.map((a) =>
            a === requester ? "인원 없음" : a
          );

        return {
          ...lesson,
          assistants: nextAssistants,
          swapRequests:
            lesson.swapRequests.filter(
              (x) => x !== requester
            ),
        };
      })
    );
  }

  function LessonCard({ lesson }) {
    return (
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="flex justify-between">
          <div>
            <div className="font-bold">
              {lesson.title}
            </div>

            <div className="text-sm text-slate-500">
              {prettyDate(lesson.date)} ·{" "}
              {lesson.start}~{lesson.end}
            </div>
          </div>

          <div className="text-xs">
            {lesson.type === "extra"
              ? "추가"
              : "정규"}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {lesson.assistants.map((name, index) => (
            <span
              key={index}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs"
            >
              {name}
            </span>
          ))}
        </div>

        {isAdmin ? (
          <>
            <div className="mt-3 space-y-1">
              {lesson.assistants.map(
                (assistant, index) => (
                  <AssistantSlot
                    key={index}
                    value={assistant}
                    assistants={assistants}
                    onChange={(value) =>
                      updateLessonAssistant(
                        lesson.id,
                        index,
                        value
                      )
                    }
                    onRemove={() => {}}
                  />
                )
              )}
            </div>

            {lesson.swapRequests.length > 0 && (
              <div className="mt-3 rounded-lg bg-yellow-100 p-2">
                <div className="font-bold">
                  대타 요청
                </div>

                {lesson.swapRequests.map((name) => (
                  <button
                    key={name}
                    onClick={() =>
                      approveSwap(lesson.id, name)
                    }
                    className="mt-2 rounded-lg bg-yellow-300 px-2 py-1 text-xs"
                  >
                    {name} 승인
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() =>
                deleteLesson(lesson.id)
              }
              className="mt-3 rounded-lg bg-red-100 px-2 py-1 text-xs"
            >
              삭제
            </button>
          </>
        ) : (
          role === "assistant" && (
            <Button
              onClick={() =>
                requestSwap(lesson.id)
              }
              className="mt-3 w-full"
            >
              대타 요청
            </Button>
          )
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRole("all")}
              className={`rounded-xl px-3 py-2 ${
                role === "all"
                  ? "bg-black text-white"
                  : "bg-slate-100"
              }`}
            >
              전체 일정
            </button>

            <button
              onClick={() => setRole("assistant")}
              className={`rounded-xl px-3 py-2 ${
                role === "assistant"
                  ? "bg-black text-white"
                  : "bg-slate-100"
              }`}
            >
              조교
            </button>

            <button
              onClick={() => setRole("admin")}
              className={`rounded-xl px-3 py-2 ${
                role === "admin"
                  ? "bg-black text-white"
                  : "bg-slate-100"
              }`}
            >
              관리자
            </button>
          </div>

          {role === "admin" && !adminUnlocked && (
            <div className="mt-4 flex gap-2">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) =>
                  setAdminPassword(e.target.value)
                }
                placeholder="관리자 비밀번호"
                className="rounded-xl border px-3 py-2"
              />

              <Button
                onClick={() => {
                  if (
                    adminPassword ===
                    ADMIN_PASSWORD
                  ) {
                    setAdminUnlocked(true);
                  } else {
                    alert("비밀번호 오류");
                  }
                }}
              >
                입장
              </Button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(Number(e.target.value))
              }
              className="w-24 rounded-xl border px-3 py-2"
            />

            <select
              value={month}
              onChange={(e) =>
                setMonth(Number(e.target.value))
              }
              className="rounded-xl border px-3 py-2"
            >
              {Array.from(
                { length: 12 },
                (_, i) => (
                  <option
                    key={i + 1}
                    value={i + 1}
                  >
                    {i + 1}월
                  </option>
                )
              )}
            </select>

            {isAdmin && (
              <Button onClick={loadMonth}>
                기본 일정 생성
              </Button>
            )}
          </div>
        </motion.div>

        {isAdmin && (
          <Card className="rounded-3xl border-none shadow-sm">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-xl font-bold">
                추가 수업
              </h2>

              <input
                type="date"
                value={extra.date}
                onChange={(e) =>
                  setExtra({
                    ...extra,
                    date: e.target.value,
                  })
                }
                className="w-full rounded-xl border p-2"
              />

              <input
                value={extra.title}
                onChange={(e) =>
                  setExtra({
                    ...extra,
                    title: e.target.value,
                  })
                }
                placeholder="수업명"
                className="w-full rounded-xl border p-2"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={extra.start}
                  onChange={(e) =>
                    setExtra({
                      ...extra,
                      start: e.target.value,
                    })
                  }
                  className="rounded-xl border p-2"
                />

                <input
                  type="time"
                  value={extra.end}
                  onChange={(e) =>
                    setExtra({
                      ...extra,
                      end: e.target.value,
                    })
                  }
                  className="rounded-xl border p-2"
                />
              </div>

              <Button onClick={addExtraLesson}>
                추가 수업 등록
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-5">
            {viewMode === "calendar" ? (
              <div className="grid grid-cols-7 overflow-hidden rounded-2xl border">
                {days.map((d) => (
                  <div
                    key={d}
                    className="border-b bg-slate-100 p-2 text-center font-bold"
                  >
                    {d}
                  </div>
                ))}

                {getMonthDates(year, month).map(
                  (d) => {
                    const key = dateKey(d);

                    return (
                      <div
                        key={key}
                        className="min-h-[200px] border p-2"
                      >
                        <div className="mb-2 font-bold">
                          {d.getDate()}
                        </div>

                        <div className="space-y-2">
                          {(lessonsByDate[
                            key
                          ] || []).map(
                            (lesson) => (
                              <LessonCard
                                key={lesson.id}
                                lesson={lesson}
                              />
                            )
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="rounded-3xl border-none shadow-sm">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-xl font-bold">
                조교 관리
              </h2>

              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border p-2"
                  value={newAssistant}
                  onChange={(e) =>
                    setNewAssistant(
                      e.target.value
                    )
                  }
                  placeholder="조교 이름"
                />

                <Button onClick={addAssistant}>
                  <UserPlus size={16} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {assistants.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}