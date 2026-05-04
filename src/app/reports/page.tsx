"use client";

import { useEffect, useMemo, useState } from "react";
import { getTasks, Task } from "@/lib/firestore";

const REPORT_START = "2026-05"; // 리포트 집계 시작 월

const categoryColor: Record<string, string> = {
  SNS: "bg-pink-100 text-pink-700 border-pink-200",
  오프라인스토어: "bg-emerald-100 text-emerald-700 border-emerald-200",
  온라인스토어: "bg-purple-100 text-purple-700 border-purple-200",
  B2B: "bg-indigo-100 text-indigo-700 border-indigo-200",
  기타: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusLabel: Record<Task["status"], string> = {
  todo: "미완료",
  in_progress: "미완료",
  done: "완료",
  on_hold: "보류",
};

const statusBadge: Record<Task["status"], string> = {
  todo: "bg-orange-100 text-orange-700",
  in_progress: "bg-orange-100 text-orange-700",
  done: "bg-green-100 text-green-700",
  on_hold: "bg-amber-100 text-amber-700",
};

type StatusFilter = "all" | "done" | "incomplete" | "on_hold";
type ChannelFilter = "all" | "SNS" | "오프라인스토어" | "온라인스토어" | "B2B" | "기타";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "done", label: "완료" },
  { key: "incomplete", label: "미완료" },
  { key: "on_hold", label: "보류" },
];

const CHANNEL_TABS: { key: ChannelFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "SNS", label: "SNS" },
  { key: "오프라인스토어", label: "오프라인스토어" },
  { key: "온라인스토어", label: "온라인스토어" },
  { key: "B2B", label: "B2B" },
  { key: "기타", label: "기타" },
];

const matchStatus = (t: Task, f: StatusFilter) => {
  if (f === "all") return true;
  if (f === "done") return t.status === "done";
  if (f === "on_hold") return t.status === "on_hold";
  return t.status !== "done" && t.status !== "on_hold";
};

const matchChannel = (t: Task, f: ChannelFilter) => f === "all" || t.category === f;

export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");

  useEffect(() => {
    (async () => {
      try {
        const t = await getTasks();
        setTasks(t);
      } catch (error) {
        console.error("리포트 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const baseTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.dueDate && t.dueDate.length >= 7 && t.dueDate.slice(0, 7) >= REPORT_START
      ),
    [tasks]
  );

  const filteredTasks = useMemo(
    () =>
      baseTasks.filter((t) => matchStatus(t, statusFilter) && matchChannel(t, channelFilter)),
    [baseTasks, statusFilter, channelFilter]
  );

  const statusCounts = useMemo(() => {
    const scoped = baseTasks.filter((t) => matchChannel(t, channelFilter));
    return {
      all: scoped.length,
      done: scoped.filter((t) => t.status === "done").length,
      incomplete: scoped.filter((t) => t.status !== "done" && t.status !== "on_hold").length,
      on_hold: scoped.filter((t) => t.status === "on_hold").length,
    };
  }, [baseTasks, channelFilter]);

  const channelCounts = useMemo(() => {
    const scoped = baseTasks.filter((t) => matchStatus(t, statusFilter));
    const result: Record<ChannelFilter, number> = {
      all: scoped.length,
      SNS: 0,
      오프라인스토어: 0,
      온라인스토어: 0,
      B2B: 0,
      기타: 0,
    };
    for (const t of scoped) {
      if (t.category && t.category in result) {
        result[t.category as ChannelFilter]++;
      }
    }
    return result;
  }, [baseTasks, statusFilter]);

  const monthly = useMemo(() => {
    const byMonth = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const ym = t.dueDate.slice(0, 7);
      if (!byMonth.has(ym)) byMonth.set(ym, []);
      byMonth.get(ym)!.push(t);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([ym, list]) => {
        const sorted = [...list].sort((x, y) => (x.dueDate < y.dueDate ? -1 : 1));
        const done = sorted.filter((t) => t.status === "done").length;
        const onHold = sorted.filter((t) => t.status === "on_hold").length;
        const incomplete = sorted.length - done - onHold;
        return { ym, list: sorted, total: sorted.length, done, onHold, incomplete };
      });
  }, [filteredTasks]);

  const toggle = (ym: string) =>
    setOpenMonths((s) => ({ ...s, [ym]: !(s[ym] ?? true) }));

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-");
    return `${y}년 ${parseInt(m, 10)}월`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">리포트</h2>
        <span className="text-xs text-gray-500">
          집계 기간: {formatMonth(REPORT_START)} ~
        </span>
      </div>

      {/* 상태 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 mr-1">상태</span>
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {statusCounts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 채널 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 mr-1">채널</span>
        {CHANNEL_TABS.map((tab) => {
          const active = channelFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setChannelFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {channelCounts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {monthly.length === 0 ? (
        <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 text-sm">
            선택한 조건에 해당하는 업무가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {monthly.map(({ ym, list, total, done, onHold, incomplete }) => {
            const isOpen = openMonths[ym] ?? true;
            const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={ym}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggle(ym)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">{isOpen ? "▼" : "▶"}</span>
                    <h3 className="text-lg font-bold text-gray-800">
                      {formatMonth(ym)}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      총 {total}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      완료 {done}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                      미완료 {incomplete}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                      보류 {onHold}
                    </span>
                    <span className="ml-2 px-2 py-1 rounded-full bg-blue-600 text-white font-bold">
                      달성률 {completionRate}%
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-xs">
                            <th className="text-left px-6 py-3 font-medium w-28">마감일</th>
                            <th className="text-left px-3 py-3 font-medium w-24">상태</th>
                            <th className="text-left px-3 py-3 font-medium w-28">채널</th>
                            <th className="text-left px-3 py-3 font-medium">제목</th>
                            <th className="text-left px-3 py-3 font-medium w-24">담당</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((t) => (
                            <tr
                              key={t.id}
                              className="border-t border-gray-100 hover:bg-gray-50/50"
                            >
                              <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                                {t.dueDate}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadge[t.status]}`}
                                >
                                  {statusLabel[t.status]}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                {t.category && (
                                  <span
                                    className={`text-[11px] px-1.5 py-0.5 rounded border ${
                                      categoryColor[t.category] ||
                                      "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                                  >
                                    {t.category}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div
                                  className={`font-medium ${
                                    t.status === "done"
                                      ? "line-through text-gray-400"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {t.title}
                                </div>
                                {t.description && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {t.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                {t.assignee}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
