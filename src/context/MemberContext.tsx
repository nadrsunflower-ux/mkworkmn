"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface MemberContextType {
  currentMember: string;
  setCurrentMember: (name: string) => void;
  members: string[];
  setMembers: (members: string[]) => void;
}

const MemberContext = createContext<MemberContextType>({
  currentMember: "",
  setCurrentMember: () => {},
  members: [],
  setMembers: () => {},
});

export function MemberProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMember] = useState<string>("");
  const [members, setMembers] = useState<string[]>([
    "김정연",
    "유선화",
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("currentMember");
    if (saved) setCurrentMember(saved);
  }, []);

  useEffect(() => {
    if (currentMember) localStorage.setItem("currentMember", currentMember);
  }, [currentMember]);

  return (
    <MemberContext.Provider value={{ currentMember, setCurrentMember, members, setMembers }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
