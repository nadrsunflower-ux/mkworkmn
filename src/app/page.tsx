"use client";

import { useEffect, useState } from "react";
import { getTasks, getKPIs, Task, KPI } from "@/lib/firestore";
import Link from "next/link";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [t, k] = await Promise.all([getTasks(), getKPIs()]);
        setTasks(t);
        setKPIs(k);
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const jyTasks = tasks.filter((t) => t.assignee === "김정연" && t.status !== "done");
  const shTasks = tasks.filter((t) => t.assignee === "유선화" && t.status !== "done");
  const thisWeekTasks = tasks.filter(
    (t) => t.dueDate >= todayStr && t.dueDate <= weekEndStr && t.status !== "done"
  );

  const currentQuarter = `Q${Math.ceil((today.getMonth() + 1) / 3)}` as KPI["quarter"];
  const currentYear = today.getFullYear();
  const currentKPIs = kpis.filter(
    (k) => k.quarter === currentQuarter && k.year === currentYear
  );
  const avgKPIProgress =
    currentKPIs.length > 0
      ? Math.round(
          currentKPIs.reduce(
            (sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0),
            0
          ) / currentKPIs.length
        )
      : 0;

  const getDDay = (dateStr: string) => {
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return { text: "D-Day", color: "text-red-600 font-bold" };
    if (diff < 0) return { text: `D+${Math.abs(diff)}`, color: "text-red-600 font-bold" };
    if (diff <= 3) return { text: `D-${diff}`, color: "text-orange-600 font-bold" };
    return { text: `D-${diff}`, color: "text-gray-500" };
  };

  const TaskList = ({ taskList, emptyMsg }: { taskList: Task[]; emptyMsg: string }) => (
    taskList.length === 0 ? (
      <p className="text-gray-400 text-sm py-4">{emptyMsg}</p>
    ) : (
      <div className="space-y-2">
        {taskList.map((task) => {
          const dd = getDDay(task.dueDate);
          return (
            <div key={task.id} className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm truncate">{task.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-gray-400">{task.dueDate}</span>
                <span className={`text-xs ${dd.color}`}>{dd.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>

      {/* 1. KPI 달성률 (compact) */}
      <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-bold text-gray-800">
              KPI 달성률 ({currentYear} {currentQuarter})
            </h3>
            {currentKPIs.length === 0 ? (
              <span className="text-gray-400 text-sm">등록된 KPI가 없습니다</span>
            ) : (
              <>
                <span className={`text-2xl font-bold ${
                  avgKPIProgress >= 100 ? "text-green-600" : avgKPIProgress >= 70 ? "text-blue-600" : "text-orange-600"
                }`}>{avgKPIProgress}%</span>
                <div className="w-40 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(avgKPIProgress, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">{currentKPIs.length}개 KPI</span>
              </>
            )}
          </div>
          <Link href="/kpi" className="text-sm text-blue-500 hover:text-blue-700">
            상세 보기 →
          </Link>
        </div>
      </div>

      {/* 2 & 3. to 김정연 / to 유선화 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">to 김정연</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{jyTasks.length}건</span>
              <Link href="/tasks" className="text-sm text-blue-500 hover:text-blue-700">
                관리 →
              </Link>
            </div>
          </div>
          <TaskList taskList={jyTasks} emptyMsg="진행 중인 업무가 없습니다" />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">to 유선화</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{shTasks.length}건</span>
              <Link href="/tasks" className="text-sm text-blue-500 hover:text-blue-700">
                관리 →
              </Link>
            </div>
          </div>
          <TaskList taskList={shTasks} emptyMsg="진행 중인 업무가 없습니다" />
        </div>
      </div>

      {/* 4. 이번 주 마감 업무 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">이번 주 마감 업무</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{todayStr} ~ {weekEndStr}</span>
            <Link href="/calendar" className="text-sm text-blue-500 hover:text-blue-700">
              캘린더 →
            </Link>
          </div>
        </div>
        <TaskList taskList={thisWeekTasks} emptyMsg="이번 주 마감 업무가 없습니다" />
      </div>
    </div>
  );
}
