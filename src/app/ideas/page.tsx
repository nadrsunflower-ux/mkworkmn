"use client";

import { useEffect, useState, useRef } from "react";
import { useMember } from "@/context/MemberContext";
import {
  getIdeas,
  addIdea,
  updateIdea,
  deleteIdea,
  getIdeaComments,
  addIdeaComment,
  deleteIdeaComment,
  uploadIdeaImage,
  Idea,
  IdeaComment,
} from "@/lib/firestore";

export default function IdeasPage() {
  const { currentMember } = useMember();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  // 폼
  const [showForm, setShowForm] = useState(false);
  const [editIdea, setEditIdea] = useState<Idea | null>(null);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 코멘트
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, IdeaComment[]>>({});
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
      const data = await getIdeas();
      setIdeas(data);
    } catch (error) {
      console.error("아이디어 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchComments = async (ideaId: string) => {
    setLoadingComments(ideaId);
    try {
      const data = await getIdeaComments(ideaId);
      setComments((prev) => ({ ...prev, [ideaId]: data }));
    } catch (error) {
      console.error("코멘트 로딩 실패:", error);
    } finally {
      setLoadingComments(null);
    }
  };

  const toggleComments = (ideaId: string) => {
    if (openCommentId === ideaId) {
      setOpenCommentId(null);
    } else {
      setOpenCommentId(ideaId);
      if (!comments[ideaId]) {
        fetchComments(ideaId);
      }
    }
    setCommentText("");
  };

  const resetForm = () => {
    setTopic("");
    setDescription("");
    setLinkUrl("");
    setImageFile(null);
    setImagePreview(null);
    setEditIdea(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openEdit = (idea: Idea) => {
    setEditIdea(idea);
    setTopic(idea.topic);
    setDescription(idea.description);
    setLinkUrl(idea.linkUrl || "");
    setImagePreview(idea.imageUrl || null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!topic.trim()) return;
    setSaving(true);
    try {
      let imageUrl = editIdea?.imageUrl || "";

      if (imageFile) {
        imageUrl = await uploadIdeaImage(imageFile);
      }

      const today = new Date().toISOString().split("T")[0];

      // Firestore는 undefined를 허용하지 않으므로 빈 문자열 사용
      const data = {
        topic,
        description: description || "",
        linkUrl: linkUrl || "",
        imageUrl: imageUrl || "",
      };

      if (editIdea) {
        await updateIdea(editIdea.id, data);
      } else {
        await addIdea({
          ...data,
          date: today,
          author: currentMember || "김정연",
        });
      }
      resetForm();
      fetchIdeas();
    } catch (error) {
      console.error("아이디어 저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 아이디어를 삭제하시겠습니까?")) return;
    try {
      await deleteIdea(id);
      fetchIdeas();
    } catch (error) {
      console.error("아이디어 삭제 실패:", error);
    }
  };

  const handleAddComment = async (ideaId: string) => {
    if (!commentText.trim() || !currentMember) return;
    try {
      await addIdeaComment(ideaId, currentMember, commentText);
      setCommentText("");
      fetchComments(ideaId);
    } catch (error) {
      console.error("코멘트 작성 실패:", error);
    }
  };

  const handleDeleteComment = async (commentId: string, ideaId: string) => {
    try {
      await deleteIdeaComment(commentId);
      fetchComments(ideaId);
    } catch (error) {
      console.error("코멘트 삭제 실패:", error);
    }
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
        <h2 className="text-2xl font-bold text-gray-800">아이디어</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 아이디어 등록
        </button>
      </div>

      {/* 아이디어 목록 */}
      {ideas.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 mb-4">등록된 아이디어가 없습니다</p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            첫 아이디어 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => {
            const ideaComments = comments[idea.id] || [];
            const isOpen = openCommentId === idea.id;
            return (
              <div key={idea.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{idea.topic}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-400">{idea.date}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {idea.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(idea)}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {idea.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{idea.description}</p>
                  )}

                  {/* 이미지 */}
                  {idea.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={idea.imageUrl}
                        alt={idea.topic}
                        className="max-w-full max-h-80 rounded-lg object-contain border border-gray-200"
                      />
                    </div>
                  )}

                  {/* URL 링크 */}
                  {idea.linkUrl && (
                    <a
                      href={idea.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-4"
                    >
                      {idea.linkUrl.length > 60 ? idea.linkUrl.slice(0, 60) + "..." : idea.linkUrl}
                      <span className="text-xs">&#8599;</span>
                    </a>
                  )}

                  {/* 코멘트 토글 버튼 */}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <button
                      onClick={() => toggleComments(idea.id)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <span>{isOpen ? "코멘트 접기" : "코멘트 보기"}</span>
                      {comments[idea.id] && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {comments[idea.id].length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 코멘트 영역 */}
                {isOpen && (
                  <div className="bg-gray-50 border-t border-gray-100 p-6">
                    {loadingComments === idea.id ? (
                      <p className="text-gray-400 text-sm">코멘트 로딩 중...</p>
                    ) : (
                      <>
                        {ideaComments.length === 0 ? (
                          <p className="text-gray-400 text-sm mb-4">아직 코멘트가 없습니다</p>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {ideaComments.map((c) => (
                              <div key={c.id} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-blue-600">
                                    {c.author.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">{c.author}</span>
                                    <span className="text-xs text-gray-400">
                                      {c.createdAt?.toDate?.()
                                        ? c.createdAt.toDate().toLocaleDateString("ko-KR", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : ""}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                                </div>
                                {c.author === currentMember && (
                                  <button
                                    onClick={() => handleDeleteComment(c.id, idea.id)}
                                    className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 코멘트 입력 */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-green-600">
                              {currentMember?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(idea.id);
                                }
                              }}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              placeholder={`${currentMember || "사용자"}(으)로 코멘트 작성...`}
                            />
                            <button
                              onClick={() => handleAddComment(idea.id)}
                              disabled={!commentText.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 shrink-0"
                            >
                              등록
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 아이디어 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editIdea ? "아이디어 수정" : "아이디어 등록"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">용도 *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="아이디어의 용도를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용 <span className="text-gray-400 font-normal">(선택)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="아이디어에 대한 상세 내용을 작성하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사진 첨부 <span className="text-gray-400 font-normal">(선택)</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="max-h-40 rounded-lg object-contain border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      X
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL 링크 <span className="text-gray-400 font-normal">(선택)</span></label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://..."
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
                disabled={saving || !topic.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? "저장 중..." : editIdea ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
