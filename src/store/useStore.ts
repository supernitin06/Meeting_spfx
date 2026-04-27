import { create } from 'zustand';
import { Meeting, ActionItem, User, Project, Notification, MeetingVisibility, PortfolioItem } from '../types';
import { MeetingService } from '../services/MeetingService';
import { AgendaService } from '../services/AgendaService';

interface StoreState {
  users: User[];
  teams: string[];
  groupedUsers: Record<string, User[]>;
  currentUser: User | null;
  meetings: Meeting[];
  actionItems: ActionItem[];
  notifications: Notification[];
  projects: Project[];
  portfolioItems: PortfolioItem[];
  setUsers: (users: User[]) => void;
  setTeams: (teams: string[]) => void;
  setGroupedUsers: (groupedUsers: Record<string, User[]>) => void;
  setCurrentUser: (user: User | null) => void;
  setMeetings: (meetings: Meeting[]) => void;
  setActionItems: (items: ActionItem[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setProjects: (projects: Project[]) => void;
  setPortfolioItems: (items: PortfolioItem[]) => void;
  addMeetingToStore: (meeting: Meeting) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'participantUids'> & { visibility?: MeetingVisibility }, id?: string) => Promise<string>;
  updateMeeting: (id: string, meeting: Partial<Meeting>) => Promise<void>;
  fetchMeetings: () => Promise<void>;
  addActionItem: (item: Omit<ActionItem, 'id'>) => Promise<void>;
  updateActionItem: (id: string, item: Partial<ActionItem>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id'>) => Promise<void>;
  isMeetingModalOpen: boolean;
  editingMeetingId: string | null;
  openMeetingModal: (meetingId?: string) => void;
  closeMeetingModal: () => void;
  joinMeeting: (meetingId: string, userId: string) => Promise<void>;
  leaveMeeting: (meetingId: string, userId: string) => Promise<void>;
  addFileToMeeting: (meetingId: string, file: { id: string; name: string; url: string; type: string; uploadedAt: string; uploadedBy: string; storagePath?: string }) => Promise<void>;
  removeFileFromMeeting: (meetingId: string, fileId: string) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  activePreviewFile: { id: string; name: string; url: string; type: string; storagePath?: string; meetingId?: string; agendaItemId?: string } | null;
  setActivePreviewFile: (file: { id: string; name: string; url: string; type: string; storagePath?: string; meetingId?: string; agendaItemId?: string } | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  users: [],
  teams: [],
  groupedUsers: {},
  currentUser: null,
  meetings: [],
  actionItems: [],
  notifications: [],
  projects: [],
  portfolioItems: [],
  setUsers: (users) => set({ users }),
  setTeams: (teams) => set({ teams }),
  setGroupedUsers: (groupedUsers) => set({ groupedUsers }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setMeetings: (meetings) => set({ meetings }),
  setActionItems: (actionItems) => set({ actionItems }),
  setNotifications: (notifications) => set({ notifications }),
  setProjects: (projects) => set({ projects }),
  setPortfolioItems: (portfolioItems) => set({ portfolioItems }),

  fetchMeetings: async () => {
    try {
      const spMeetings = await MeetingService.getMeetings();
      const mappedMeetings: Meeting[] = spMeetings.map(spm => {
        // Build local datetime strings (no trailing "Z") so Today/Upcoming/Past
        // comparisons match the viewer's local timezone.
        const startDateTime =
          spm.startDate && spm.startTime
            ? `${spm.startDate}T${spm.startTime}:00`
            : new Date().toISOString();
        const endDateTime =
          spm.endDate && spm.endTime
            ? `${spm.endDate}T${spm.endTime}:00`
            : new Date().toISOString();

        const agendaItemsFromLookup = (() => {
          if (!spm.agenda) return [];
          // Support single lookup object OR multi-lookup array
          if (Array.isArray(spm.agenda)) {
            return spm.agenda
              .filter(Boolean)
              .map((a: any) => ({
                id: String(a.Id ?? a.id ?? ''),
                text: a.Title ?? a.title ?? 'Agenda',
                subItems: []
              }))
              .filter((a: any) => a.id);
          }
          return [
            {
              id: String(spm.agenda.Id ?? spm.agenda.id ?? ''),
              text: spm.agenda.Title ?? spm.agenda.title ?? 'Agenda',
              subItems: []
            }
          ].filter((a) => a.id);
        })();

        const storeUsers = get().users;
        const participants = (spm.participants || []).map((p: any) => {
          const id = p.Id?.toString();
          const existing = storeUsers.find((u) => u.id === id);
          return {
            user: {
              id,
              name: existing?.name || p.Title || 'Unknown',
              email: existing?.email || ''
            },
            role: 'Participant' as const
          };
        });

        return {
          id: spm.id,
          title: spm.title,
          type: (spm.meetingType as any) || 'Internal',
          visibility: (spm.visibility as any) || 'Personal',
          startDateTime,
          endDateTime,
          participants,
          participantUids: participants.map((pp) => pp.user.id),
          project: spm.linkedProject ? { id: spm.linkedProject.Id?.toString(), name: spm.linkedProject.Title } : { id: '', name: 'No Project' },
          description: spm.description || '',
          agendaItems: agendaItemsFromLookup,
          status: 'Scheduled', // or map if we have it
          category: spm.format as any,
          platform: spm.platform as any,
          meetingLink: spm.meetingLink,
          timeZone: spm.timeZone,
          createdBy: { id: '0', name: 'System', email: '' },
          aiProcessed: false,
          location: ''
        };
      });
      set({ meetings: mappedMeetings });
    } catch (err) {
      console.error("Error fetching meetings:", err);
    }
  },

  addMeetingToStore: (meeting: Meeting) => {
    set(state => ({ meetings: [meeting, ...state.meetings] }));
  },

  addMeeting: async (meetingData: Omit<Meeting, 'id' | 'participantUids'> & { visibility?: MeetingVisibility }, id?: string) => {
    const participantUids = meetingData.participants.map(p => p.user.id);
    const meeting = {
      ...meetingData,
      participantUids,
      visibility: meetingData.visibility || 'Personal'
    };

    const finalId = id || `mock-${Date.now()}`;
    const newMeeting = { ...meeting, id: finalId } as Meeting;
    set(state => ({ meetings: [newMeeting, ...state.meetings] }));
    return finalId;
  },

  updateMeeting: async (id: string, meetingUpdate: Partial<Meeting>) => {
    const meeting = get().meetings.find(m => m.id === id);
    if (!meeting) return;

    try {
      let payload: any = {};
      if (meetingUpdate.title) payload.Title = meetingUpdate.title;
      if (meetingUpdate.type) payload.MeetingType = meetingUpdate.type;
      if (meetingUpdate.visibility) payload.Visibility = meetingUpdate.visibility;
      if (meetingUpdate.description !== undefined) payload.Description = meetingUpdate.description;
      if (meetingUpdate.category) payload.Format = meetingUpdate.category;
      if (meetingUpdate.platform !== undefined) payload.Platform = meetingUpdate.platform;
      if (meetingUpdate.meetingLink !== undefined) payload.MeetingLink = meetingUpdate.meetingLink;
      if (meetingUpdate.timeZone) payload.TimeZone = meetingUpdate.timeZone;
      if (meetingUpdate.project?.id && meetingUpdate.project.id !== 'custom') {
        payload.LinkedProjectId = parseInt(meetingUpdate.project.id, 10);
      }

      if (meetingUpdate.startDateTime) {
        const startIso = new Date(meetingUpdate.startDateTime).toISOString();
        payload.StartDate = startIso;
        payload.StartTime = startIso;
      }
      if (meetingUpdate.endDateTime) {
        const endIso = new Date(meetingUpdate.endDateTime).toISOString();
        payload.EndDate = endIso;
        payload.EndTime = endIso;
      }
      if (meetingUpdate.participants) {
        payload.ParticipantsId = meetingUpdate.participants.map(p => parseInt(p.user.id, 10)).filter(uid => !isNaN(uid));
      }

      if (meetingUpdate.agendaItems) {
        const agendaIds: number[] = [];
        for (const agenda of meetingUpdate.agendaItems) {
          if (!agenda.text?.trim()) continue;
          const existing = await AgendaService.getAgendaByTitle(agenda.text);
          const agendaData = {
            Title: agenda.text,
            Owner: agenda.ownerId || '',
            DocumentUrl: agenda.documentUrl || '',
            TaskLink: agenda.tasks || '',
            Priority: agenda.priority || '',
            Status: agenda.status || ''
          };
          if (existing) {
            await AgendaService.updateAgenda(existing, agendaData);
            agendaIds.push(Number(existing));
          } else {
            const createdId = await AgendaService.addAgenda(agendaData);
            agendaIds.push(Number(createdId));
          }
        }

        if (agendaIds.length > 0) payload.AgendaId = { results: agendaIds };
      }

      if (Object.keys(payload).length > 0) {
        await MeetingService.updateMeeting(id, payload);
      }
    } catch (e) {
      console.error("Failed to update meeting in SP:", e);
    }

    const now = new Date().toISOString();
    const userTimeUpdates: Record<string, number> = {};

    let updatedAttendance = meeting.attendance;
    if (meetingUpdate.status === 'Completed' && meeting.status !== 'Completed' && meeting.attendance) {
      updatedAttendance = { ...meeting.attendance };
      Object.keys(updatedAttendance).forEach(userId => {
        const userAtt = updatedAttendance![userId];
        const sessions = [...userAtt.sessions];
        const lastSession = sessions[sessions.length - 1];
        if (lastSession && !lastSession.leaveTime) {
          lastSession.leaveTime = now;
          userTimeUpdates[userId] = (userTimeUpdates[userId] || 0) + (new Date(now).getTime() - new Date(lastSession.joinTime).getTime());
        }
        updatedAttendance![userId] = { ...userAtt, sessions };
      });
    }

    const finalUpdate: any = { ...meetingUpdate };
    if (meetingUpdate.participants) {
      finalUpdate.participantUids = meetingUpdate.participants.map(p => p.user.id);
    }

    set(state => ({
      meetings: state.meetings.map(m => m.id === id ? { ...m, ...finalUpdate, attendance: updatedAttendance || null } : m),
      users: state.users.map(u => {
        const additionalTime = userTimeUpdates[u.id] || 0;
        return additionalTime > 0
          ? { ...u, totalAttendedTimeMs: (u.totalAttendedTimeMs || 0) + additionalTime }
          : u;
      })
    }));
  },

  deleteMeeting: async (id) => {
    try {
      await MeetingService.deleteMeeting(id);
    } catch (e) {
      console.error("Failed to delete meeting in SP:", e);
      throw e;
    } finally {
      set(state => ({ meetings: state.meetings.filter(m => m.id !== id) }));
    }
  },

  addActionItem: async (item) => {
    const newItem = { ...item, id: `mock-${Date.now()}` } as ActionItem;
    set(state => ({ actionItems: [...state.actionItems, newItem] }));
  },

  updateActionItem: async (id, itemUpdate) => {
    set(state => ({
      actionItems: state.actionItems.map(i => i.id === id ? { ...i, ...itemUpdate } : i)
    }));
  },

  markNotificationRead: async (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  addNotification: async (notification) => {
    const newNotif = { ...notification, id: `mock-${Date.now()}` } as Notification;
    set(state => ({ notifications: [newNotif, ...state.notifications] }));
  },

  isMeetingModalOpen: false,
  editingMeetingId: null,
  openMeetingModal: (meetingId) => set({ isMeetingModalOpen: true, editingMeetingId: meetingId || null }),
  closeMeetingModal: () => set({ isMeetingModalOpen: false, editingMeetingId: null }),

  joinMeeting: async (meetingId, userId) => {
    const meeting = get().meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const now = new Date().toISOString();
    const attendance = meeting.attendance ? { ...meeting.attendance } : {};
    const userAttendance = attendance[userId] || { userId, sessions: [] };

    const lastSession = userAttendance.sessions[userAttendance.sessions.length - 1];
    if (lastSession && !lastSession.leaveTime) return;

    const updatedAttendance = {
      ...attendance,
      [userId]: {
        ...userAttendance,
        sessions: [...userAttendance.sessions, { joinTime: now, leaveTime: null }]
      }
    };

    set(state => ({
      meetings: state.meetings.map(m => m.id === meetingId ? { ...m, attendance: updatedAttendance } : m)
    }));
  },

  leaveMeeting: async (meetingId, userId) => {
    const meeting = get().meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const now = new Date().toISOString();
    let timeSpentMs = 0;

    const attendance = meeting.attendance ? { ...meeting.attendance } : {};
    const userAttendance = attendance[userId];
    if (!userAttendance) return;

    const sessions = [...userAttendance.sessions];
    const lastSession = sessions[sessions.length - 1];
    if (lastSession && !lastSession.leaveTime) {
      lastSession.leaveTime = now;
      timeSpentMs = new Date(now).getTime() - new Date(lastSession.joinTime).getTime();
    }

    const updatedAttendance = {
      ...attendance,
      [userId]: {
        ...userAttendance,
        sessions
      }
    };

    set(state => ({
      meetings: state.meetings.map(m => m.id === meetingId ? { ...m, attendance: updatedAttendance } : m),
      users: state.users.map(u => u.id === userId && timeSpentMs > 0 ? { ...u, totalAttendedTimeMs: (u.totalAttendedTimeMs || 0) + timeSpentMs } : u)
    }));
  },

  addFileToMeeting: async (meetingId, file) => {
    const meeting = get().meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const files = meeting.files ? [...meeting.files, file] : [file];
    set(state => ({
      meetings: state.meetings.map(m => m.id === meetingId ? { ...m, files } : m)
    }));
  },

  removeFileFromMeeting: async (meetingId, fileId) => {
    const meeting = get().meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const files = meeting.files ? meeting.files.filter(f => f.id !== fileId) : [];
    set(state => ({
      meetings: state.meetings.map(m => m.id === meetingId ? { ...m, files } : m)
    }));
  },
  activePreviewFile: null,
  setActivePreviewFile: (file) => set({ activePreviewFile: file }),
}));

