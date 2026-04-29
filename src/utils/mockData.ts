import { User, Meeting, ActionItem, Project, Notification, MeetingType, MeetingVisibility, MeetingStatus, ActionItemSource, MeetingRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const generateMockData = () => {
  const mockUsers: User[] = Array.from({ length: 10 }).map((_, i) => ({
    id: i === 0 ? 'mock-admin' : `user-${i}`,
    name: i === 0 ? 'Mock Administrator' : `Mock User ${i + 1}`,
    email: i === 0 ? 'admin@mock.com' : `mockuser${i + 1}@example.com`,
    avatar: i === 0 ? 'https://ui-avatars.com/api/?name=Mock+Admin&background=2F5596&color=fff' : `https://picsum.photos/seed/user${i}/100/100`,
    team: i === 0 ? 'Administration' : i % 3 === 0 ? 'Engineering' : i % 3 === 1 ? 'Design' : 'Product',
    role: i === 0 ? 'Admin' : 'Member',
    totalAttendedTimeMs: Math.floor(Math.random() * 10000000)
  }));

  const mockProjects: Project[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `project-${i}`,
    name: `Project ${String.fromCharCode(65 + i)}`
  }));

  const mockMeetings: Meeting[] = Array.from({ length: 10 }).map((_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - i);
    const end = new Date(start.getTime() + 3600000);
    
    const status: MeetingStatus = i === 0 ? 'Scheduled' : i < 5 ? 'Completed' : 'Scheduled';
    const type: MeetingType = i % 4 === 0 ? 'Internal' : i % 4 === 1 ? 'Client' : i % 4 === 2 ? 'ILF' : 'Review';
    const visibility: MeetingVisibility = 'Global';

    return {
      id: `meeting-${i}`,
      title: `Mock Meeting ${i + 1}`,
      description: `This is a mock description for meeting ${i + 1}`,
      type,
      visibility,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      location: 'Conference Room A',
      status,
      createdBy: mockUsers[0],
      project: mockProjects[i % 5],
      participants: mockUsers.slice(0, 5).map((u, idx) => ({ 
        user: u, 
        role: idx === 0 ? 'Organizer' : 'Participant' as MeetingRole 
      })),
      participantUids: mockUsers.slice(0, 5).map(u => u.id),
      aiProcessed: i < 5,
      agendaItems: [
        { id: uuidv4(), text: 'Introduction', subItems: ['Welcome', 'Roll call'], status: 'Completed' },
        { id: uuidv4(), text: 'Main Topic', subItems: ['Discussion', 'Q&A'], status: i < 5 ? 'Completed' : 'In Progress' },
        { id: uuidv4(), text: 'Conclusion', subItems: ['Next steps'], status: 'Pending' }
      ],
      files: [
        {
          id: uuidv4(),
          name: 'Agenda.pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: mockUsers[0].name
        }
      ]
    };
  });

  const mockActionItems: ActionItem[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `action-${i}`,
    description: `Mock Action Item ${i + 1}`,
    taskDescription: `Task to be completed for meeting ${Math.floor(i / 2) + 1}`,
    meetingId: `meeting-${Math.floor(i / 2)}`,
    assignedTo: mockUsers[i % 10],
    dueDate: new Date(Date.now() + 86400000 * (i + 1)).toISOString(),
    status: i % 4 === 0 ? 'Task Created' : i % 4 === 1 ? 'Approved' : i % 4 === 2 ? 'Pending Review' : 'Dismissed',
    linkedProject: mockProjects[i % 5],
    source: 'AI-Extracted' as ActionItemSource
  }));

  const mockNotifications: Notification[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `notification-${i}`,
    userId: mockUsers[0].id,
    title: `New Meeting Invitation`,
    message: `You have been invited to Mock Meeting ${i + 1}`,
    type: 'Meeting',
    read: i > 2,
    createdAt: new Date().toISOString(),
    link: `/meetings/meeting-${i}`
  }));

  return {
    users: mockUsers,
    meetings: mockMeetings,
    actionItems: mockActionItems,
    projects: mockProjects,
    notifications: mockNotifications
  };
};
