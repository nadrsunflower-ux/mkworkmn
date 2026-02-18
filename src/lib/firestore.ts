import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

// === Types ===
export interface Member {
  id: string;
  name: string;
  role: string;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  category: "인스타그램" | "오프라인매장" | "온라인스토어" | "유튜브";
  priority: "긴급" | "높음" | "보통" | "낮음";
  status: "todo" | "in_progress" | "done";
  dueDate: string;
  isRecurring: boolean;
  recurringType?: "weekly" | "monthly";
  recurringDay?: number;
  files: { name: string; url: string }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KPI {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  assignee: string;
  createdAt: Timestamp;
}

export interface InstagramReels {
  id: string;
  title: string;
  postDate: string;
  views: number;
  shares: number;
  comments: number;
  url?: string;
  createdAt: Timestamp;
}

export interface MeetingMinutes {
  id: string;
  meetingDate: string;
  title: string;
  content: string;
  attendees: string[];
  author: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgendaItem {
  title: string;
  detail: string;
}

export interface MeetingAgenda {
  id: string;
  weekDate: string;
  items: AgendaItem[];
  author: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Idea {
  id: string;
  date: string;
  topic: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  author: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface IdeaComment {
  id: string;
  ideaId: string;
  author: string;
  content: string;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: Timestamp;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  author: string;
  action: string;
  details: string;
  createdAt: Timestamp;
}

// === Helper ===
function docToData<T>(doc: DocumentData): T {
  return { id: doc.id, ...doc.data() } as T;
}

// === Members ===
export async function getMembers(): Promise<Member[]> {
  const q = query(collection(db, "members"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Member>(d));
}

export async function addMember(name: string, role: string): Promise<string> {
  const docRef = await addDoc(collection(db, "members"), {
    name,
    role,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// === Tasks ===
export async function getTasks(): Promise<Task[]> {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Task>(d));
}

export async function addTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "tasks"), {
    ...task,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, "tasks", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", id));
}

// === KPIs ===
export async function getKPIs(year?: number, quarter?: string): Promise<KPI[]> {
  let q;
  if (year && quarter) {
    q = query(collection(db, "kpis"), where("year", "==", year), where("quarter", "==", quarter));
  } else {
    q = query(collection(db, "kpis"), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<KPI>(d));
}

export async function addKPI(kpi: Omit<KPI, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "kpis"), {
    ...kpi,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateKPI(id: string, data: Partial<KPI>): Promise<void> {
  await updateDoc(doc(db, "kpis", id), data);
}

export async function deleteKPI(id: string): Promise<void> {
  await deleteDoc(doc(db, "kpis", id));
}

// === Instagram Reels ===
export async function getInstagramReels(): Promise<InstagramReels[]> {
  const q = query(collection(db, "instagramReels"), orderBy("postDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<InstagramReels>(d));
}

export async function addInstagramReels(reel: Omit<InstagramReels, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "instagramReels"), {
    ...reel,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateInstagramReels(id: string, data: Partial<InstagramReels>): Promise<void> {
  await updateDoc(doc(db, "instagramReels", id), data);
}

export async function deleteInstagramReels(id: string): Promise<void> {
  await deleteDoc(doc(db, "instagramReels", id));
}

// === Comments ===
export async function getComments(taskId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "comments"),
    where("taskId", "==", taskId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Comment>(d));
}

export async function addComment(taskId: string, author: string, content: string): Promise<string> {
  const docRef = await addDoc(collection(db, "comments"), {
    taskId,
    author,
    content,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// === Activity Logs ===
export async function getActivityLogs(taskId: string): Promise<ActivityLog[]> {
  const q = query(
    collection(db, "activityLogs"),
    where("taskId", "==", taskId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<ActivityLog>(d));
}

export async function addActivityLog(
  taskId: string,
  author: string,
  action: string,
  details: string
): Promise<void> {
  await addDoc(collection(db, "activityLogs"), {
    taskId,
    author,
    action,
    details,
    createdAt: Timestamp.now(),
  });
}

// === Meeting Minutes ===
export async function getMeetingMinutes(): Promise<MeetingMinutes[]> {
  const q = query(collection(db, "meetingMinutes"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<MeetingMinutes>(d));
}

export async function addMeetingMinutes(data: Omit<MeetingMinutes, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "meetingMinutes"), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateMeetingMinutes(id: string, data: Partial<MeetingMinutes>): Promise<void> {
  await updateDoc(doc(db, "meetingMinutes", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteMeetingMinutes(id: string): Promise<void> {
  await deleteDoc(doc(db, "meetingMinutes", id));
}

// === Meeting Agendas ===
export async function getMeetingAgendas(): Promise<MeetingAgenda[]> {
  const q = query(collection(db, "meetingAgendas"), orderBy("weekDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<MeetingAgenda>(d));
}

export async function addMeetingAgenda(data: Omit<MeetingAgenda, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "meetingAgendas"), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateMeetingAgenda(id: string, data: Partial<MeetingAgenda>): Promise<void> {
  await updateDoc(doc(db, "meetingAgendas", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteMeetingAgenda(id: string): Promise<void> {
  await deleteDoc(doc(db, "meetingAgendas", id));
}

// === Ideas ===
export async function getIdeas(): Promise<Idea[]> {
  const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Idea>(d));
}

export async function addIdea(data: Omit<Idea, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "ideas"), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateIdea(id: string, data: Partial<Idea>): Promise<void> {
  await updateDoc(doc(db, "ideas", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteIdea(id: string): Promise<void> {
  await deleteDoc(doc(db, "ideas", id));
}

// === Idea Comments ===
export async function getIdeaComments(ideaId: string): Promise<IdeaComment[]> {
  const q = query(
    collection(db, "ideaComments"),
    where("ideaId", "==", ideaId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<IdeaComment>(d));
}

export async function addIdeaComment(ideaId: string, author: string, content: string): Promise<string> {
  const docRef = await addDoc(collection(db, "ideaComments"), {
    ideaId,
    author,
    content,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function deleteIdeaComment(id: string): Promise<void> {
  await deleteDoc(doc(db, "ideaComments", id));
}

// === File Upload ===
export async function uploadFile(file: File, taskId: string): Promise<{ name: string; url: string }> {
  const fileRef = ref(storage, `tasks/${taskId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { name: file.name, url };
}

export async function uploadIdeaImage(file: File): Promise<string> {
  const fileRef = ref(storage, `ideas/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}
