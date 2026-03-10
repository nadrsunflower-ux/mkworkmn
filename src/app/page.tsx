"use client";

import { useEffect, useState } from "react";
import { getTasks, addTask, updateTask, deleteTask, Task } from "@/lib/firestore";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"김정연" | "유선화">("김정연");

  // 업무 폼
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Task["category"]>("인스타그램");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const t = await getTasks();
      setTasks(t);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks.filter((t) => t.assignee === activeTab);

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

  const categoryColor: Record<string, string> = {
    인스타그램: "bg-pink-100 text-pink-700 border-pink-200",
    오프라인매장: "bg-emerald-100 text-emerald-700 border-emerald-200",
    온라인스토어: "bg-purple-100 text-purple-700 border-purple-200",
    유튜브: "bg-red-100 text-red-700 border-red-200",
    기타: "bg-gray-100 text-gray-600 border-gray-200",
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

  // 폼 관련
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("인스타그램");
    setDueDate("");
    setEditTask(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setDueDate(selectedDate || todayStr);
    setShowForm(true);
  };

  const openEditForm = (task: Task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category || "인스타그램");
    setDueDate(task.dueDate);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, { title, description, category, dueDate });
      } else {
        await addTask({
          title,
          description,
          assignee: activeTab,
          category,
          priority: "보통",
          status: "todo",
          dueDate,
          isRecurring: false,
          files: [],
        });
      }
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error("저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: Task["status"]) => {
    try {
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch (error) {
      console.error("상태 변경 실패:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 업무를 삭제하시겠습니까?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("삭제 실패:", error);
    }
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
              to {name}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === name ? `${countBg} text-white` : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
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
                        title={`${t.title}`}
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {selectedDate
                  ? `${selectedDate}`
                  : "날짜를 선택하세요"}
              </h3>
              {selectedDate && (
                <span className={`text-sm font-bold ${getDDay(selectedDate).color}`}>
                  {getDDay(selectedDate).text}
                </span>
              )}
            </div>
            {selectedDate && (
              <button
                onClick={openAddForm}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                + 업무 추가
              </button>
            )}
          </div>

          {selectedDateTasks.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {selectedDate ? "해당 날짜에 마감인 업무가 없습니다" : "캘린더에서 날짜를 클릭하세요"}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg p-4 border-l-4 group ${
                    task.assignee === "김정연"
                      ? "border-l-blue-500 bg-blue-50/50"
                      : "border-l-pink-500 bg-pink-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {task.category && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${categoryColor[task.category] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {task.category}
                        </span>
                      )}
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${statusColor[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditForm(task)}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-1">
                    {task.status !== "todo" && (
                      <button
                        onClick={() => handleStatusChange(task, "todo")}
                        className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        할 일
                      </button>
                    )}
                    {task.status !== "in_progress" && (
                      <button
                        onClick={() => handleStatusChange(task, "in_progress")}
                        className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        진행 중
                      </button>
                    )}
                    {task.status !== "done" && (
                      <button
                        onClick={() => handleStatusChange(task, "done")}
                        className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        완료
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* 업무 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {editTask ? "업무 수정" : `to ${activeTab} 업무 추가`}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업무 제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="업무 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="업무 설명 (선택)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">채널 *</label>
                <div className="flex gap-2">
                  {(["인스타그램", "오프라인매장", "온라인스토어", "유튜브", "기타"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setCategory(ch)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        category === ch
                          ? categoryColor[ch].replace("border-", "border-") + " ring-2 ring-offset-1 ring-blue-400"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마감일 *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !dueDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? "저장 중..." : editTask ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
