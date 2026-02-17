"use client";

import { useEffect, useState } from "react";
import {
  getTasks, getKPIs, Task, KPI,
  getInstagramReels, addInstagramReels, updateInstagramReels, deleteInstagramReels, InstagramReels,
} from "@/lib/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

type TabType = "weekly" | "monthly" | "instagram";

export default function ReportsPage() {
  const members = ["김정연", "유선화"];
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [reels, setReels] = useState<InstagramReels[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("weekly");

  // 릴스 폼
  const [showReelsForm, setShowReelsForm] = useState(false);
  const [editReel, setEditReel] = useState<InstagramReels | null>(null);
  const [reelTitle, setReelTitle] = useState("");
  const [reelDate, setReelDate] = useState("");
  const [reelViews, setReelViews] = useState(0);
  const [reelShares, setReelShares] = useState(0);
  const [reelComments, setReelComments] = useState(0);
  const [reelUrl, setReelUrl] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [t, k] = await Promise.all([getTasks(), getKPIs()]);
        setTasks(t);
        setKPIs(k);
      } catch (error) {
        console.error("업무/KPI 로딩 실패:", error);
      }
      try {
        const r = await getInstagramReels();
        setReels(r);
      } catch (error) {
        console.error("릴스 로딩 실패:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const getReportPeriod = () => {
    const start = new Date(today);
    if (activeTab === "weekly") start.setDate(today.getDate() - 7);
    else start.setMonth(today.getMonth() - 1);
    return { startStr: start.toISOString().split("T")[0], endStr: todayStr };
  };

  const { startStr, endStr } = getReportPeriod();

  const completedTasks = tasks.filter((t) => t.status === "done");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const overdueTasks = tasks.filter((t) => t.dueDate < todayStr && t.status !== "done");

  const memberStats = members.map((m) => {
    const mt = tasks.filter((t) => t.assignee === m);
    return {
      name: m,
      total: mt.length,
      done: mt.filter((t) => t.status === "done").length,
      inProgress: mt.filter((t) => t.status === "in_progress").length,
      todo: mt.filter((t) => t.status === "todo").length,
      overdue: mt.filter((t) => t.dueDate < todayStr && t.status !== "done").length,
    };
  });

  const currentQuarter = `Q${Math.ceil((today.getMonth() + 1) / 3)}` as KPI["quarter"];
  const currentYear = today.getFullYear();
  const currentKPIs = kpis.filter((k) => k.quarter === currentQuarter && k.year === currentYear);

  // === 릴스 관련 ===
  const resetReelForm = () => {
    setReelTitle("");
    setReelDate("");
    setReelViews(0);
    setReelShares(0);
    setReelComments(0);
    setReelUrl("");
    setEditReel(null);
    setShowReelsForm(false);
  };

  const openEditReel = (reel: InstagramReels) => {
    setEditReel(reel);
    setReelTitle(reel.title);
    setReelDate(reel.postDate);
    setReelViews(reel.views);
    setReelShares(reel.shares);
    setReelComments(reel.comments);
    setReelUrl(reel.url || "");
    setShowReelsForm(true);
  };

  const handleSaveReel = async () => {
    if (!reelTitle.trim() || !reelDate) return;
    try {
      if (editReel) {
        await updateInstagramReels(editReel.id, {
          title: reelTitle, postDate: reelDate,
          views: reelViews, shares: reelShares, comments: reelComments,
          url: reelUrl || undefined,
        });
      } else {
        await addInstagramReels({
          title: reelTitle, postDate: reelDate,
          views: reelViews, shares: reelShares, comments: reelComments,
          url: reelUrl || undefined,
        });
      }
      resetReelForm();
      const updated = await getInstagramReels();
      setReels(updated);
    } catch (error) {
      console.error("릴스 저장 실패:", error);
    }
  };

  const handleDeleteReel = async (id: string) => {
    if (!confirm("이 릴스 데이터를 삭제하시겠습니까?")) return;
    try {
      await deleteInstagramReels(id);
      setReels((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const totalViews = reels.reduce((s, r) => s + r.views, 0);
  const totalShares = reels.reduce((s, r) => s + r.shares, 0);
  const totalComments = reels.reduce((s, r) => s + r.comments, 0);
  const avgViews = reels.length > 0 ? Math.round(totalViews / reels.length) : 0;
  const avgShares = reels.length > 0 ? Math.round(totalShares / reels.length) : 0;
  const avgComments = reels.length > 0 ? Math.round(totalComments / reels.length) : 0;

  const sortedReels = [...reels].sort((a, b) => a.postDate.localeCompare(b.postDate));

  const reelsChartData = {
    labels: sortedReels.map((r) => r.title.length > 8 ? r.title.slice(0, 8) + "..." : r.title),
    datasets: [
      {
        label: "조회수",
        data: sortedReels.map((r) => r.views),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        yAxisID: "y",
      },
      {
        label: "공유",
        data: sortedReels.map((r) => r.shares),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        yAxisID: "y1",
      },
      {
        label: "댓글",
        data: sortedReels.map((r) => r.comments),
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.5)",
        yAxisID: "y1",
      },
    ],
  };

  const reelsBarData = {
    labels: sortedReels.map((r) => r.title.length > 8 ? r.title.slice(0, 8) + "..." : r.title),
    datasets: [
      {
        label: "조회수",
        data: sortedReels.map((r) => r.views),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
    ],
  };

  const copyToClipboard = () => {
    const period = activeTab === "weekly" ? "주간" : "월간";
    let text = `=== 마케팅 팀 ${period} 리포트 ===\n기간: ${startStr} ~ ${endStr}\n\n`;
    text += `[업무 현황] 전체 ${tasks.length} / 완료 ${completedTasks.length} / 진행 ${inProgressTasks.length} / 할일 ${todoTasks.length} / 초과 ${overdueTasks.length}\n\n`;
    memberStats.forEach((m) => {
      text += `${m.name}: 전체 ${m.total} / 완료 ${m.done} / 진행 ${m.inProgress} / 초과 ${m.overdue}\n`;
    });
    navigator.clipboard.writeText(text).then(() => alert("복사되었습니다!"));
  };

  const priorityColor: Record<string, string> = {
    긴급: "text-red-600", 높음: "text-orange-600", 보통: "text-blue-600", 낮음: "text-gray-500",
  };

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
        <h2 className="text-2xl font-bold text-gray-800">리포트</h2>
        {activeTab !== "instagram" && (
          <div className="flex gap-2">
            <button onClick={copyToClipboard} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">텍스트 복사</button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">인쇄 / PDF</button>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        {([
          { key: "weekly" as const, label: "주간 리포트" },
          { key: "monthly" as const, label: "월간 리포트" },
          { key: "instagram" as const, label: "인스타그램 릴스" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.key
                ? tab.key === "instagram" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 주간/월간 리포트 ===== */}
      {(activeTab === "weekly" || activeTab === "monthly") && (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">
              마케팅 팀 {activeTab === "weekly" ? "주간" : "월간"} 리포트
            </h3>
            <p className="text-sm text-gray-500 mt-1">기간: {startStr} ~ {endStr}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "전체", value: tasks.length, color: "text-gray-800" },
              { label: "완료", value: completedTasks.length, color: "text-green-600" },
              { label: "진행 중", value: inProgressTasks.length, color: "text-blue-600" },
              { label: "할 일", value: todoTasks.length, color: "text-yellow-600" },
              { label: "마감 초과", value: overdueTasks.length, color: "text-red-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">팀원별 업무 현황</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">팀원</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">전체</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">완료</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">진행 중</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">할 일</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">마감 초과</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">완료율</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map((m) => (
                  <tr key={m.name} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="text-center py-3 px-4">{m.total}</td>
                    <td className="text-center py-3 px-4 text-green-600">{m.done}</td>
                    <td className="text-center py-3 px-4 text-blue-600">{m.inProgress}</td>
                    <td className="text-center py-3 px-4 text-yellow-600">{m.todo}</td>
                    <td className="text-center py-3 px-4 text-red-600">{m.overdue}</td>
                    <td className="text-center py-3 px-4 font-bold">
                      {m.total > 0 ? Math.round((m.done / m.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentKPIs.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">KPI 현황 ({currentYear} {currentQuarter})</h3>
              <div className="space-y-3">
                {currentKPIs.map((kpi) => {
                  const p = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
                  return (
                    <div key={kpi.id} className="flex items-center gap-4">
                      <div className="w-40 text-sm font-medium text-gray-700 truncate">{kpi.title}</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className={`h-4 rounded-full ${p >= 100 ? "bg-green-500" : p >= 70 ? "bg-blue-500" : "bg-orange-500"}`} style={{ width: `${Math.min(p, 100)}%` }}></div>
                        </div>
                      </div>
                      <div className="w-32 text-sm text-right">{kpi.currentValue}/{kpi.targetValue} {kpi.unit}</div>
                      <div className="w-16 text-sm font-bold text-right">{p}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {overdueTasks.length > 0 && (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-lg font-bold text-red-700 mb-3">마감 초과 업무</h3>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-bold ${priorityColor[task.priority]}`}>[{task.priority}]</span>
                      <span className="text-sm ml-1">{task.title}</span>
                      <span className="text-xs text-gray-400 ml-2">{task.assignee}</span>
                    </div>
                    <span className="text-xs text-red-600">마감: {task.dueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== 인스타그램 릴스 탭 ===== */}
      {activeTab === "instagram" && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Instagram Reels 통계</h3>
            <button
              onClick={() => { resetReelForm(); setShowReelsForm(true); }}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              + 릴스 데이터 추가
            </button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "전체 릴스", value: reels.length.toLocaleString(), sub: "개", color: "text-purple-600" },
              { label: "총 조회수", value: totalViews.toLocaleString(), sub: "회", color: "text-blue-600" },
              { label: "총 공유", value: totalShares.toLocaleString(), sub: "회", color: "text-green-600" },
              { label: "총 댓글", value: totalComments.toLocaleString(), sub: "개", color: "text-orange-600" },
              { label: "평균 조회수", value: avgViews.toLocaleString(), sub: "회/릴스", color: "text-blue-500" },
              { label: "평균 공유", value: avgShares.toLocaleString(), sub: "회/릴스", color: "text-green-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                <p className="text-[10px] text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* 차트 */}
          {reels.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">릴스별 조회수</h3>
                <Bar data={reelsBarData} options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }} />
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">조회수 / 공유 / 댓글 추이</h3>
                <Line data={reelsChartData} options={{
                  responsive: true,
                  interaction: { mode: "index", intersect: false },
                  plugins: { legend: { position: "top" } },
                  scales: {
                    y: { type: "linear", display: true, position: "left", title: { display: true, text: "조회수" } },
                    y1: { type: "linear", display: true, position: "right", title: { display: true, text: "공유/댓글" }, grid: { drawOnChartArea: false } },
                  },
                }} />
              </div>
            </div>
          )}

          {/* 릴스 목록 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">릴스 목록</h3>
              {reels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm mb-4">등록된 릴스 데이터가 없습니다</p>
                  <button
                    onClick={() => { resetReelForm(); setShowReelsForm(true); }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    + 첫 릴스 데이터 추가하기
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">릴스 제목</th>
                        <th className="text-center py-3 px-4 text-gray-500 font-medium">게시일</th>
                        <th className="text-center py-3 px-4 text-gray-500 font-medium">조회수</th>
                        <th className="text-center py-3 px-4 text-gray-500 font-medium">공유</th>
                        <th className="text-center py-3 px-4 text-gray-500 font-medium">댓글</th>
                        <th className="text-center py-3 px-4 text-gray-500 font-medium">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reels.map((reel) => (
                        <tr key={reel.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {reel.url ? (
                              <a href={reel.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-medium">
                                {reel.title}
                              </a>
                            ) : (
                              <span className="font-medium">{reel.title}</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4 text-gray-500">{reel.postDate}</td>
                          <td className="text-center py-3 px-4 font-bold text-blue-600">{reel.views.toLocaleString()}</td>
                          <td className="text-center py-3 px-4 font-bold text-green-600">{reel.shares.toLocaleString()}</td>
                          <td className="text-center py-3 px-4 font-bold text-orange-600">{reel.comments.toLocaleString()}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => openEditReel(reel)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">수정</button>
                              <button onClick={() => handleDeleteReel(reel.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">삭제</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 릴스 추가/수정 모달 */}
          {showReelsForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4">{editReel ? "릴스 데이터 수정" : "릴스 데이터 추가"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">업로드 일자 *</label>
                    <input type="date" value={reelDate} onChange={(e) => setReelDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">릴스 제목 *</label>
                    <input type="text" value={reelTitle} onChange={(e) => setReelTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="릴스 콘텐츠 제목" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">조회수</label>
                      <input type="number" value={reelViews} onChange={(e) => setReelViews(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" min={0} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">공유</label>
                      <input type="number" value={reelShares} onChange={(e) => setReelShares(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" min={0} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">댓글</label>
                      <input type="number" value={reelComments} onChange={(e) => setReelComments(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2" min={0} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL (선택)</label>
                    <input type="text" value={reelUrl} onChange={(e) => setReelUrl(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="https://www.instagram.com/reel/..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={resetReelForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">취소</button>
                  <button onClick={handleSaveReel} disabled={!reelTitle.trim() || !reelDate}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm hover:from-purple-700 hover:to-pink-600 disabled:opacity-50">
                    {editReel ? "수정" : "추가"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
