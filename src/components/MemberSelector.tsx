"use client";

import { useMember } from "@/context/MemberContext";

export default function MemberSelector() {
  const { currentMember, setCurrentMember, members } = useMember();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">사용자:</span>
      <select
        value={currentMember}
        onChange={(e) => setCurrentMember(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">팀원 선택</option>
        {members.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      {currentMember && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {currentMember[0]}
          </div>
          <span className="text-sm font-medium">{currentMember}</span>
        </div>
      )}
    </div>
  );
}
