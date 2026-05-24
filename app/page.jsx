"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  UserPlus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { createClient } from "@supabase/supabase-js";

const defaultBaseSchedule = {
  saturday: [
    {
      id: "sat-1",
      title: "한성 347기",
      start: "09:30",
      end: "12:30",
      assistants: ["이찬영", "송은호"],
    },
    {
      id: "sat-2",
      title: "한성 357기",
      start: "13:00",
      end: "16:00",
      assistants: ["이찬영", "정윤제"],
    },
    {
      id: "sat-3",
      title: "반성 337기",
      start: "16:00",
      end: "19:00",
      assistants: ["이찬영", "정윤제"],
    },
    {
      id: "sat-4",
      title: "세종 197기",
      start: "19:30",
      end: "22:30",
      assistants: ["인원 없음", "정윤제"],
    },
  ],

  sunday: [
    {
      id: "sun-1",
      title: "세종 177기",
      start: "09:30",
      end: "12:30",
      assistants: ["강지후", "인원 없음"],
    },
    {
      id: "sun-2",
      title: "한성 347기",
      start: "13:00",
      end: "16:00",
      assistants: ["강지후", "송은호"],
    },
    {
      id: "sun-3",
      title: "한성 357기",
      start: "16:00",
      end: "19:00",
      assistants: ["강지후", "송은호"],
    },
  ],
};

const assistantSeed = [
  "강지후",
  "송은호",
  "정윤제",
  "이찬영",
  "인원 없음",
];

const days = ["일", "월", "화", "수", "목", "금", "토"];

const ADMIN_PASSWORD = "hscomet101";

const SUPABASE_STATE_ID = "main";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
}

export default function Page() {
  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [mode, setMode] =
    useState("assistant");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [assistants, setAssistants] =
    useState(assistantSeed);

  const [newAssistant, setNewAssistant] =
    useState("");

  const [events, setEvents] = useState({});

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const { data, error } = await supabase
      .from("app_state")
      .select("*")
      .eq("id", SUPABASE_STATE_ID)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    if (data?.payload) {
      setEvents(data.payload.events || {});
      setAssistants(
        data.payload.assistants ||
          assistantSeed
      );
    }
  }

  async function saveState(
    nextEvents,
    nextAssistants = assistants
  ) {
    const payload = {
      id: SUPABASE_STATE_ID,
      payload: {
        events: nextEvents,
        assistants: nextAssistants,
      },
    };

    const { error } = await supabase
      .from("app_state")
      .upsert(payload);

    if (error) {
      console.log(error);
    }
  }

  function addAssistant() {
    if (!newAssistant.trim()) return;

    const nextAssistants = [
      ...assistants,
      newAssistant.trim(),
    ];

    setAssistants(nextAssistants);

    setNewAssistant("");

    saveState(events, nextAssistants);
  }

  const year = currentDate.getFullYear();

  const month = currentDate.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  );

  const lastDay = new Date(
    year,
    month + 1,
    0
  );

  const startDay = firstDay.getDay();

  const totalCells =
    Math.ceil(
      (startDay + lastDay.getDate()) / 7
    ) * 7;

  const calendar = [];

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(
      year,
      month,
      i - startDay + 1
    );

    calendar.push(d);
  }

  function getEvents(date) {
    return events[dateKey(date)] || [];
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={
                  mode === "all"
                    ? "default"
                    : "secondary"
                }
                onClick={() =>
                  setMode("all")
                }
              >
                전체 일정
              </Button>

              <Button
                variant={
                  mode === "assistant"
                    ? "default"
                    : "secondary"
                }
                onClick={() =>
                  setMode("assistant")
                }
              >
                조교
              </Button>

              <Button
                variant={
                  mode === "admin"
                    ? "default"
                    : "secondary"
                }
                onClick={() => {
                  const pw =
                    prompt(
                      "관리자 비밀번호"
                    );

                  if (
                    pw ===
                    ADMIN_PASSWORD
                  ) {
                    setMode("admin");
                    setIsAdmin(true);
                  }
                }}
              >
                관리자
              </Button>
            </div>

            <div className="flex gap-3">
              <select
                className="rounded-xl border p-3"
                value={year}
                onChange={(e) =>
                  setCurrentDate(
                    new Date(
                      Number(
                        e.target.value
                      ),
                      month,
                      1
                    )
                  )
                }
              >
                {[2025, 2026, 2027].map(
                  (y) => (
                    <option
                      key={y}
                    >
                      {y}
                    </option>
                  )
                )}
              </select>

              <select
                className="rounded-xl border p-3"
                value={month}
                onChange={(e) =>
                  setCurrentDate(
                    new Date(
                      year,
                      Number(
                        e.target.value
                      ),
                      1
                    )
                  )
                }
              >
                {Array.from({
                  length: 12,
                }).map((_, i) => (
                  <option
                    key={i}
                    value={i}
                  >
                    {i + 1}월
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 overflow-hidden rounded-2xl border bg-white">
              {days.map((d) => (
                <div
                  key={d}
                  className="border-b bg-slate-100 p-3 text-center font-bold"
                >
                  {d}
                </div>
              ))}

              {calendar.map(
                (date, idx) => {
                  const list =
                    getEvents(date);

                  return (
                    <div
                      key={idx}
                      className="min-h-[180px] border p-2"
                    >
                      <div className="mb-2 text-sm font-semibold">
                        {date.getDate()}
                      </div>

                      <div className="space-y-2">
                        {list.map(
                          (ev) => (
                            <motion.div
                              key={
                                ev.id
                              }
                              initial={{
                                opacity: 0,
                                y: 8,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              className="rounded-2xl border bg-white p-3 shadow-sm"
                            >
                              <div className="text-sm font-bold">
                                {
                                  ev.title
                                }
                              </div>

                              <div className="text-xs text-slate-500">
                                {
                                  ev.start
                                }
                                ~
                                {
                                  ev.end
                                }
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1">
                                {ev.assistants.map(
                                  (
                                    a
                                  ) => (
                                    <span
                                      key={
                                        a
                                      }
                                      className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                                    >
                                      {
                                        a
                                      }
                                    </span>
                                  )
                                )}
                              </div>

                              {mode ===
                                "assistant" && (
                                <Button className="mt-3 w-full">
                                  대타 요청
                                </Button>
                              )}
                            </motion.div>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
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
                  value={
                    newAssistant
                  }
                  onChange={(e) =>
                    setNewAssistant(
                      e.target.value
                    )
                  }
                  placeholder="조교 이름"
                />

                <Button
                  onClick={
                    addAssistant
                  }
                >
                  <UserPlus size={16} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {assistants.map(
                  (name) => (
                    <span
                      key={name}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                    >
                      {name}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}