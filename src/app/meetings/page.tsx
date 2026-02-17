"use client";

import { useEffect, useState } from "react";
import { useMember } from "@/context/MemberContext";
import {
  getMeetingMinutes,
  addMeetingMinutes,
  updateMeetingMinutes,
  deleteMeetingMinutes,
  getMeetingAgendas,
  addMeetingAgenda,
  updateMeetingAgenda,
  deleteMeetingAgenda,
  MeetingMinutes,
  MeetingAgenda,
  AgendaItem,
} from "@/lib/firestore";

export default function MeetingsPage() {
  const { currentMember } = useMember();
  const [activeTab, setActiveTab] = useState<"minutes" | "agenda">("minutes");
  const [minutes, setMinutes] = useState<MeetingMinutes[]>([]);
  const [agendas, setAgendas] = useState<MeetingAgenda[]>([]);
  const [loading, setLoading] = useState(true);

  // 회의록 폼
  const [showMinutesForm, setShowMinutesForm] = useState(false);
  const [editMinutes, setEditMinutes] = useState<MeetingMinutes | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState("");
  const [mContent, setMContent] = useState("");
  const [mAttendees, setMAttendees] = useState<string[]>(["김정연", "유선화"]);

  // 안건 폼
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [editAgenda, setEditAgenda] = useState<MeetingAgenda | null>(null);
  const [aWeekDate, setAWeekDate] = useState("");
  const [aItems, setAItems] = useState<AgendaItem[]>([{ title: "", detail: "" }]);

  const fetchData = async () => {
    try {
      const [m, a] = await Promise.all([getMeetingMinutes(), getMeetingAgendas()]);
      setMinutes(m);
      setAgendas(a);
    } catch (error) {
      console.error("회의록 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 다음 수요일 날짜 구하기
  const getNextWednesday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (3 - day + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().split("T")[0];
  };

  // 이번 주 수요일 날짜
  const getThisWednesday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = 3 - day;
    const wed = new Date(today);
    wed.setDate(today.getDate() + diff);
    return wed.toISOString().split("T")[0];
  };

  // === 회의록 ===
  const resetMinutesForm = () => {
    setMTitle("");
    setMDate("");
    setMContent("");
    setMAttendees(["김정연", "유선화"]);
    setEditMinutes(null);
    setShowMinutesForm(false);
  };

  const openEditMinutes = (m: MeetingMinutes) => {
    setEditMinutes(m);
    setMTitle(m.title);
    setMDate(m.meetingDate);
    setMContent(m.content);
    setMAttendees(m.attendees);
    setShowMinutesForm(true);
  };

  const handleSaveMinutes = async () => {
    if (!mTitle.trim() || !mDate || !mContent.trim()) return;
    try {
      if (editMinutes) {
        await updateMeetingMinutes(editMinutes.id, {
          title: mTitle,
          meetingDate: mDate,
          content: mContent,
          attendees: mAttendees,
        });
      } else {
        await addMeetingMinutes({
          title: mTitle,
          meetingDate: mDate,
          content: mContent,
          attendees: mAttendees,
          author: currentMember || "김정연",
        });
      }
      resetMinutesForm();
      fetchData();
    } catch (error) {
      console.error("회의록 저장 실패:", error);
    }
  };

  const handleDeleteMinutes = async (id: string) => {
    if (!confirm("이 회의록을 삭제하시겠습니까?")) return;
    try {
      await deleteMeetingMinutes(id);
      fetchData();
    } catch (error) {
      console.error("회의록 삭제 실패:", error);
    }
  };

  // === 안건 ===
  const resetAgendaForm = () => {
    setAWeekDate("");
    setAItems([{ title: "", detail: "" }]);
    setEditAgenda(null);
    setShowAgendaForm(false);
  };

  const openEditAgenda = (a: MeetingAgenda) => {
    setEditAgenda(a);
    setAWeekDate(a.weekDate);
    setAItems(a.items.length > 0 ? a.items.map((i) => ({ ...i })) : [{ title: "", detail: "" }]);
    setShowAgendaForm(true);
  };

  const handleSaveAgenda = async () => {
    const filteredItems = aItems.filter((item) => item.title.trim() !== "");
    if (!aWeekDate || filteredItems.length === 0) return;
    try {
      if (editAgenda) {
        await updateMeetingAgenda(editAgenda.id, {
          weekDate: aWeekDate,
          items: filteredItems,
        });
      } else {
        await addMeetingAgenda({
          weekDate: aWeekDate,
          items: filteredItems,
          author: currentMember || "김정연",
        });
      }
      resetAgendaForm();
      fetchData();
    } catch (error) {
      console.error("안건 저장 실패:", error);
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!confirm("이 안건을 삭제하시겠습니까?")) return;
    try {
      await deleteMeetingAgenda(id);
      fetchData();
    } catch (error) {
      console.error("안건 삭제 실패:", error);
    }
  };

  const addAgendaItem = () => setAItems([...aItems, { title: "", detail: "" }]);
  const removeAgendaItem = (idx: number) => {
    if (aItems.length <= 1) return;
    setAItems(aItems.filter((_, i) => i !== idx));
  };
  const updateAgendaItemField = (idx: number, field: keyof AgendaItem, value: string) => {
    const updated = [...aItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setAItems(updated);
  };

  // 이번 주 수요일 안건 찾기
  const thisWed = getThisWednesday();
  const thisWeekAgenda = agendas.find((a) => a.weekDate === thisWed);

  // D-day 계산
  const getDDay = () => {
    const today = new Date();
    const wed = new Date(thisWed);
    const diff = Math.ceil((wed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: "오늘", color: "text-red-600 font-bold" };
    if (diff < 0) return { text: "지남", color: "text-gray-400" };
    if (diff === 1) return { text: "내일", color: "text-orange-600 font-bold" };
    return { text: `D-${diff}`, color: "text-blue-600" };
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
        <h2 className="text-2xl font-bold text-gray-800">회의록</h2>
        {activeTab === "minutes" ? (
          <button
            onClick={() => {
              resetMinutesForm();
              setShowMinutesForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + 회의록 작성
          </button>
        ) : (
          <button
            onClick={() => {
              resetAgendaForm();
              setAWeekDate(getNextWednesday());
              setShowAgendaForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + 안건 등록
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("minutes")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "minutes"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          회의록
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            activeTab === "minutes" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            {minutes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("agenda")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "agenda"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          금주 회의 안건
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            activeTab === "agenda" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            {agendas.length}
          </span>
        </button>
      </div>

      {/* === 회의록 탭 === */}
      {activeTab === "minutes" && (
        <div className="space-y-4">
          {minutes.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-400 mb-4">작성된 회의록이 없습니다</p>
              <button
                onClick={() => {
                  resetMinutesForm();
                  setShowMinutesForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                첫 회의록 작성하기
              </button>
            </div>
          ) : (
            minutes.map((m) => (
              <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{m.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-400">{m.meetingDate} (수)</span>
                        <span className="text-xs text-gray-400">작성자: {m.author}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditMinutes(m)}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteMinutes(m.id)}
                        className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {m.attendees.map((a) => (
                      <span key={a} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                    {m.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* === 금주 안건 탭 === */}
      {activeTab === "agenda" && (
        <div className="space-y-6">
          {/* 이번 주 수요일 안건 하이라이트 */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800">이번 주 전체 회의</h3>
                <span className="text-sm text-gray-500">{thisWed} (수)</span>
                <span className={`text-sm ${getDDay().color}`}>{getDDay().text}</span>
              </div>
            </div>
            {thisWeekAgenda ? (
              <div className="space-y-2">
                {thisWeekAgenda.items.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{item.title}</span>
                        {item.detail && (
                          <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">등록자: {thisWeekAgenda.author}</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">등록된 안건이 없습니다</p>
            )}
          </div>

          {/* 전체 안건 목록 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">전체 안건 목록</h3>
              {agendas.length === 0 ? (
                <p className="text-gray-400 text-sm">등록된 안건이 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {agendas.map((a) => (
                    <div key={a.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-800">{a.weekDate} (수)</span>
                          <span className="text-xs text-gray-400">by {a.author}</span>
                          {a.weekDate === thisWed && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">이번 주</span>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditAgenda(a)}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteAgenda(a.id)}
                            className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {a.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-sm text-gray-400 shrink-0">{idx + 1}.</span>
                            <div>
                              <span className="text-sm font-medium text-gray-700">{item.title}</span>
                              {item.detail && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 회의록 작성/수정 모달 */}
      {showMinutesForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editMinutes ? "회의록 수정" : "회의록 작성"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회의 일자 *</label>
                <input
                  type="date"
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회의 제목 *</label>
                <input
                  type="text"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="예: 2월 3주차 주간 회의"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">참석자</label>
                <div className="flex gap-3">
                  {["김정연", "유선화"].map((name) => (
                    <label key={name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={mAttendees.includes(name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMAttendees([...mAttendees, name]);
                          } else {
                            setMAttendees(mAttendees.filter((a) => a !== name));
                          }
                        }}
                        className="rounded"
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회의 내용 *</label>
                <textarea
                  value={mContent}
                  onChange={(e) => setMContent(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={"1. 지난 주 업무 공유\n- 김정연: ...\n- 유선화: ...\n\n2. 이번 주 계획\n- ...\n\n3. 기타 논의사항\n- ..."}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetMinutesForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSaveMinutes}
                disabled={!mTitle.trim() || !mDate || !mContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editMinutes ? "수정" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 안건 등록/수정 모달 */}
      {showAgendaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editAgenda ? "안건 수정" : "회의 안건 등록"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회의 날짜 (수요일) *</label>
                <input
                  type="date"
                  value={aWeekDate}
                  onChange={(e) => setAWeekDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">안건 목록 *</label>
                <div className="space-y-3">
                  {aItems.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">안건 {idx + 1}</span>
                        {aItems.length > 1 && (
                          <button
                            onClick={() => removeAgendaItem(idx)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateAgendaItemField(idx, "title", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                        placeholder="안건 제목"
                      />
                      <textarea
                        value={item.detail}
                        onChange={(e) => updateAgendaItemField(idx, "detail", e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="상세 내용 (선택)"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addAgendaItem}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  + 안건 추가
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetAgendaForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSaveAgenda}
                disabled={!aWeekDate || aItems.every((i) => !i.title.trim())}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editAgenda ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
