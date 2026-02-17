"use client";

import { useEffect, useState } from "react";
import { getKPIs, addKPI, updateKPI, deleteKPI, KPI } from "@/lib/firestore";
import { useMember } from "@/context/MemberContext";

export default function KPIPage() {
  const { currentMember, members } = useMember();
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editKPI, setEditKPI] = useState<KPI | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<KPI["quarter"]>(
    `Q${Math.ceil((new Date().getMonth() + 1) / 3)}` as KPI["quarter"]
  );

  // Form
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState("");
  const [assignee, setAssignee] = useState("");

  const fetchData = async () => {
    try {
      const data = await getKPIs(selectedYear, selectedQuarter);
      setKPIs(data);
    } catch (error) {
      console.error("KPI 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [selectedYear, selectedQuarter]);

  const resetForm = () => {
    setTitle("");
    setTargetValue(0);
    setCurrentValue(0);
    setUnit("");
    setAssignee(currentMember || "");
    setEditKPI(null);
  };

  const openEditForm = (kpi: KPI) => {
    setEditKPI(kpi);
    setTitle(kpi.title);
    setTargetValue(kpi.targetValue);
    setCurrentValue(kpi.currentValue);
    setUnit(kpi.unit);
    setAssignee(kpi.assignee);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      if (editKPI) {
        await updateKPI(editKPI.id, { title, targetValue, currentValue, unit, assignee });
      } else {
        await addKPI({
          title,
          targetValue,
          currentValue,
          unit,
          quarter: selectedQuarter,
          year: selectedYear,
          assignee,
        });
      }
      resetForm();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("KPI 저장 실패:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 KPI를 삭제하시겠습니까?")) return;
    try {
      await deleteKPI(id);
      fetchData();
    } catch (error) {
      console.error("KPI 삭제 실패:", error);
    }
  };

  const avgProgress =
    kpis.length > 0
      ? Math.round(
          kpis.reduce(
            (sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0),
            0
          ) / kpis.length
        )
      : 0;

  const achievedCount = kpis.filter(
    (k) => k.targetValue > 0 && k.currentValue >= k.targetValue
  ).length;

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
        <h2 className="text-2xl font-bold text-gray-800">KPI 관리</h2>
        <button
          onClick={() => {
            resetForm();
            setAssignee(currentMember || "");
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 새 KPI
        </button>
      </div>

      {/* 분기 선택 */}
      <div className="flex gap-4 items-center">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {[2026, 2027].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedQuarter === q
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">전체 KPI</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{kpis.length}개</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">평균 달성률</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{avgProgress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min(avgProgress, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">달성 완료</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {achievedCount} / {kpis.length}
          </p>
        </div>
      </div>

      {/* KPI 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {selectedYear}년 {selectedQuarter} KPI 목록
          </h3>
          {kpis.length === 0 ? (
            <p className="text-gray-400 text-sm">등록된 KPI가 없습니다</p>
          ) : (
            <div className="space-y-4">
              {kpis.map((kpi) => {
                const progress =
                  kpi.targetValue > 0
                    ? Math.round((kpi.currentValue / kpi.targetValue) * 100)
                    : 0;
                return (
                  <div
                    key={kpi.id}
                    className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">{kpi.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(kpi)}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(kpi.id)}
                          className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>
                            {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
                          </span>
                          <span
                            className={`font-bold ${
                              progress >= 100
                                ? "text-green-600"
                                : progress >= 70
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              progress >= 100
                                ? "bg-green-500"
                                : progress >= 70
                                ? "bg-blue-500"
                                : "bg-orange-500"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* KPI 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editKPI ? "KPI 수정" : "새 KPI 등록"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI 제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="예: 월간 웹사이트 방문자 수"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">목표값</label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">현재값</label>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="예: 건, 명, 원, %"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editKPI ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
