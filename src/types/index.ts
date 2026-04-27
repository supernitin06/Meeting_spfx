export type MeetingType = 'Internal' | 'Client' | 'ILF' | 'Review' | 'Other';
export type MeetingCategory = 'Online' | 'Offline' | 'Hybrid';
export type MeetingPlatform = 'Microsoft Teams' | 'Zoom' | 'Google Meet' | 'Webex' | 'Other';
export type MeetingVisibility = 'Global' | 'Personal';
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type ActionItemStatus = 'Pending Review' | 'Approved' | 'Dismissed' | 'Task Created';
export type ActionItemSource = 'AI-Extracted' | 'Manual';
export type MeetingRole = 'Organizer' | 'Participant' | 'Observer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalAttendedTimeMs?: number;
  team?: string;
  role?: string;
  groupId?: string;
  groupName?: string;
}

export interface Group {
  id: string;
  name: string;
  department?: string;
  createdBy?: string;
  users?: User[];
}

export interface Project {
  id: string;
  name: string;
}

export interface AgendaItem {
  id: string;
  text: string;
  subItems: string[];
  tasks?: string;
  documentUrl?: string;
  documentStoragePath?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Pending' | 'In Progress' | 'Completed';
  ownerId?: string;
}

export interface AttendanceSession {
  joinTime: string;
  leaveTime: string | null;
}

export interface ParticipantAttendance {
  userId: string;
  sessions: AttendanceSession[];
}

export interface MeetingParticipant {
  user: User;
  role: MeetingRole;
}

export interface FileMetadata {
  id: string;
  name: string;
  url: string;
  storagePath?: string;
  type: string;
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  visibility: MeetingVisibility;
  startDateTime: string;
  endDateTime: string;
  participants: MeetingParticipant[];
  participantUids: string[];
  project: Project;
  description: string;
  agendaItems?: AgendaItem[];
  status: MeetingStatus;
  transcriptText?: string;
  transcriptFileUrl?: string;
  folderUrl?: string;
  createdBy: User;
  aiProcessed: boolean;
  aiSummary?: string;
  category?: MeetingCategory;
  platform?: MeetingPlatform;
  meetingLink?: string;
  location?: string;
  timeZone?: string;
  attendance?: Record<string, ParticipantAttendance>;
  files?: FileMetadata[];
}

export interface ActionItem {
  id: string;
  meetingId: string;
  description: string; // Used as title
  taskDescription?: string; // Used as detailed description
  assignedTo: User;
  dueDate?: string;
  linkedProject: Project;
  status: ActionItemStatus;
  omtTaskId?: string;
  source: ActionItemSource;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'Meeting' | 'Task' | 'Update';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface PortfolioItem {
  id: string;
  projectId: string;
  projectTitle: string;
  componentId: string;
  componentTitle: string;
}
