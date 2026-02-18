"use client";

import { useEffect, useState } from "react";
import { getTasks, addTask, updateTask, deleteTask, Task } from "@/lib/firestore";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"김정연" | "유선화">("김정연");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 새 업무 폼
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Task["category"]>("인스타그램");
  const [dueDate, setDueDate] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
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
    fetchData();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("인스타그램");
    setDueDate("");
    setEditTask(null);
    setShowForm(false);
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
      fetchData();
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

  const openEdit = (task: Task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category || "인스타그램");
    setDueDate(task.dueDate);
    setShowForm(true);
  };

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  const tabTasks = tasks.filter(
    (t) => t.assignee === activeTab && t.dueDate.startsWith(monthStr)
  );
  const todoTasks = tabTasks.filter((t) => t.status === "todo");
  const inProgressTasks = tabTasks.filter((t) => t.status === "in_progress");
  const doneTasks = tabTasks.filter((t) => t.status === "done");

  const today = new Date();
  const getDDay = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: "D-Day", color: "text-red-600 font-bold" };
    if (diff < 0) return { text: `D+${Math.abs(diff)}`, color: "text-red-600 font-bold" };
    if (diff <= 3) return { text: `D-${diff}`, color: "text-orange-600 font-bold" };
    return { text: `D-${diff}`, color: "text-gray-500" };
  };

  const categoryColor: Record<string, string> = {
    인스타그램: "bg-pink-100 text-pink-700 border-pink-200",
    오프라인매장: "bg-emerald-100 text-emerald-700 border-emerald-200",
    온라인스토어: "bg-purple-100 text-purple-700 border-purple-200",
    유튜브: "bg-red-100 text-red-700 border-red-200",
    기타: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const TaskSection = ({ label, taskList, borderColor, bgColor }: {
    label: string; taskList: Task[]; borderColor: string; bgColor: string;
  }) => (
    <div className={`rounded-xl p-5 ${bgColor}`}>
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${borderColor}`}>
        <h3 className="font-bold text-gray-700">{label}</h3>
        <span className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
          {taskList.length}
        </span>
      </div>
      {taskList.length === 0 ? (
        <p className="text-gray-400 text-sm">업무가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {taskList.map((task) => {
            const dd = getDDay(task.dueDate);
            return (
              <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor[task.category] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {task.category}
                      </span>
                    )}
                    <h4 className="font-medium text-sm text-gray-800">{task.title}</h4>
                  </div>
                  <span className={`text-xs shrink-0 ${dd.color}`}>{dd.text}</span>
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 mb-3 ml-0.5">{task.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">마감: {task.dueDate}</div>
                  <div className="flex items-center gap-1">
                    {task.status !== "todo" && (
                      <button
                        onClick={() => handleStatusChange(task, "todo")}
                        className="text-[11px] px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        할 일
                      </button>
                    )}
                    {task.status !== "in_progress" && (
                      <button
                        onClick={() => handleStatusChange(task, "in_progress")}
                        className="text-[11px] px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        진행 중
                      </button>
                    )}
                    {task.status !== "done" && (
                      <button
                        onClick={() => handleStatusChange(task, "done")}
                        className="text-[11px] px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        완료
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(task)}
                      className="text-[11px] px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-[11px] px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">업무 관리</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 새 업무 추가
        </button>
      </div>

      {/* 월 선택 */}
      <div className="flex items-center gap-3">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {[2026, 2027].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMonth === m
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {m}월
            </button>
          ))}
        </div>
      </div>

      {/* 담당자 탭 */}
      <div className="flex gap-2">
        {(["김정연", "유선화"] as const).map((name) => {
          const count = tasks.filter(
            (t) => t.assignee === name && t.dueDate.startsWith(monthStr) && t.status !== "done"
          ).length;
          return (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === name
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              to {name}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === name ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 업무 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskSection label="할 일" taskList={todoTasks} borderColor="border-yellow-400" bgColor="bg-yellow-50" />
        <TaskSection label="진행 중" taskList={inProgressTasks} borderColor="border-blue-400" bgColor="bg-blue-50" />
        <TaskSection label="완료" taskList={doneTasks} borderColor="border-green-400" bgColor="bg-green-50" />
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
