"use client";

import { useEffect, useState } from "react";
import { getTasks, Task } from "@/lib/firestore";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "김정연" | "유선화">("all");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTasks = activeTab === "all"
    ? tasks
    : tasks.filter((t) => t.assignee === activeTab);

  const getTasksForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filteredTasks.filter((t) => t.dueDate === dateStr);
  };

  const selectedDateTasks = selectedDate
    ? filteredTasks.filter((t) => t.dueDate === selectedDate)
    : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 담당자별 색상
  const assigneeColor: Record<string, string> = {
    김정연: "bg-blue-500",
    유선화: "bg-pink-500",
  };

  const assigneeBadge: Record<string, string> = {
    김정연: "bg-blue-100 text-blue-700",
    유선화: "bg-pink-100 text-pink-700",
  };

  const statusLabel: Record<string, string> = {
    todo: "할 일",
    in_progress: "진행 중",
    done: "완료",
  };

  const statusColor: Record<string, string> = {
    todo: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
  };

  const getDDay = (dateStr: string) => {
    const today = new Date();
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return { text: "D-Day", color: "text-red-600" };
    if (diff < 0) return { text: `D+${Math.abs(diff)}`, color: "text-red-600" };
    if (diff <= 3) return { text: `D-${diff}`, color: "text-orange-600" };
    return { text: `D-${diff}`, color: "text-gray-500" };
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">캘린더</h2>

      {/* 담당자 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {(["김정연", "유선화"] as const).map((name) => {
          const count = tasks.filter(
            (t) => t.assignee === name && t.status !== "done"
          ).length;
          const tabBg = name === "김정연" ? "bg-blue-600" : "bg-pink-600";
          const countBg = name === "김정연" ? "bg-blue-500" : "bg-pink-500";
          return (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === name
                  ? `${tabBg} text-white`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {name}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === name ? `${countBg} text-white` : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 색상 범례 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-500">김정연</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span className="text-xs text-gray-500">유선화</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              ◀
            </button>
            <h3 className="text-lg font-bold">
              {year}년 {month + 1}월
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
            {days.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="p-2 min-h-[80px]"></div>;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayTasks = getTasksForDate(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 min-h-[80px] rounded-lg cursor-pointer transition-colors border ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : isToday
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`text-sm mb-1 ${
                      isToday ? "font-bold text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className={`w-full h-1.5 rounded-full ${assigneeColor[t.assignee] || "bg-gray-400"}`}
                        title={`${t.assignee}: ${t.title}`}
                      ></div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{dayTasks.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜의 업무 목록 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {selectedDate
              ? `${selectedDate} 업무`
              : "날짜를 선택하세요"}
          </h3>

          {/* D-day 알림 */}
          {selectedDate && (
            <div className="mb-4">
              {(() => {
                const dd = getDDay(selectedDate);
                return (
                  <span className={`text-sm font-bold ${dd.color}`}>{dd.text}</span>
                );
              })()}
            </div>
          )}

          {selectedDateTasks.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {selectedDate ? "해당 날짜에 마감인 업무가 없습니다" : "캘린더에서 날짜를 클릭하세요"}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg p-4 border-l-4 ${
                    task.assignee === "김정연"
                      ? "border-l-blue-500 bg-blue-50/50"
                      : "border-l-pink-500 bg-pink-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${assigneeBadge[task.assignee] || "bg-gray-100 text-gray-600"}`}>
                      {task.assignee}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 다가오는 마감 알림 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-3">마감 임박 알림</h4>
            {filteredTasks
              .filter((t) => {
                const dd = getDDay(t.dueDate);
                return (
                  t.status !== "done" &&
                  (dd.text === "D-Day" || (dd.text.startsWith("D-") && parseInt(dd.text.slice(2)) <= 3))
                );
              })
              .slice(0, 5)
              .map((task) => {
                const dd = getDDay(task.dueDate);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 cursor-pointer hover:bg-gray-50 rounded px-2"
                    onClick={() => setSelectedDate(task.dueDate)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${assigneeColor[task.assignee] || "bg-gray-400"}`}></div>
                      <span className="text-sm">{task.title}</span>
                    </div>
                    <span className={`text-xs font-bold ${dd.color}`}>{dd.text}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
