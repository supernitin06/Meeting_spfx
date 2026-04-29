import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MeetingType, MeetingVisibility, User, Project, AgendaItem, MeetingCategory, MeetingPlatform } from '../types';
import { Calendar, Clock, MapPin, Users, Briefcase, FileText, Globe, Link as LinkIcon, ChevronDown, Check, X as CloseIcon, Plus, Loader2, Eye, Sparkles } from 'lucide-react';
import { MeetingService } from '../services/MeetingService';
import { AgendaService } from '../services/AgendaService';
import { PeoplePicker } from '../Global Common/PeoplePicker';
import { v4 as uuidv4 } from 'uuid';
import { SearchInput } from '../SelectProject/SearchInput';
import projectMockData from '../SelectProject/projectMockData.json';
const PageLoader = ({ active, isGeneratingLink }: { active: boolean, isGeneratingLink?: boolean }) => active ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
    <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-[var(--SiteBlue)] animate-spin" />
      <p className="text-sm font-medium text-[var(--TextBlack)]">
        {isGeneratingLink ? 'Generating meeting link...' : 'Saving meeting data...'}
      </p>
    </div>
  </div>
) : null;

export default function MeetingModal() {
  const navigate = useNavigate();
  const {
    isMeetingModalOpen,
    closeMeetingModal,
    editingMeetingId,
    meetings,
    addMeeting,
    updateMeeting,
    addNotification,
    currentUser,
    users,
    teams,
    projects
  } = useStore();

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const laterTime = oneHourLater.toTimeString().slice(0, 5);

  const startDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = (ref: any) => {
    if (ref.current) {
      if ('showPicker' in ref.current) {
        try {
          ref.current.showPicker();
        } catch (e) {
          ref.current.focus();
          ref.current.click();
        }
      } else {
        ref.current.focus();
        ref.current.click();
      }
    }
  };

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType>('Internal');
  const [visibility, setVisibility] = useState<MeetingVisibility>('Personal');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState(currentTime);
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState(laterTime);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>(currentUser ? [currentUser] : []);
  const [project, setProject] = useState<Project | null>(null);
  const [description, setDescription] = useState('');
  const [agendaList, setAgendaList] = useState<AgendaItem[]>([{ id: `temp-${Date.now()}`, text: '', subItems: [] }]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<MeetingCategory>('Online');
  const [platform, setPlatform] = useState<MeetingPlatform>('Microsoft Teams');
  const [meetingLink, setMeetingLink] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');
  const [currentMeetingId, setCurrentMeetingId] = useState<string>('');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showTitleAlert, setShowTitleAlert] = useState(false);


  useEffect(() => {
    if (isMeetingModalOpen) {
      if (editingMeetingId) {
        setCurrentMeetingId(editingMeetingId);
        const meeting = meetings.find(m => m.id === editingMeetingId);
        if (meeting) {
          setTitle(meeting.title);
          setType(meeting.type);
          setVisibility(meeting.visibility || 'Personal');

          const start = new Date(meeting.startDateTime);
          setStartDate(start.toISOString().split('T')[0]);
          setStartTime(start.toTimeString().slice(0, 5));

          const end = new Date(meeting.endDateTime);
          setEndDate(end.toISOString().split('T')[0]);
          setEndTime(end.toTimeString().slice(0, 5));

          setSelectedParticipants(meeting.participants.map(p => p.user));
          setProject(meeting.project);

          if (meeting.description) {
            setDescription(meeting.description);
          } else {
            setDescription('');
          }

          if (meeting.agendaItems && meeting.agendaItems.length > 0) {
            setAgendaList(meeting.agendaItems);
          } else {
            setAgendaList([{ id: `temp-${Date.now()}`, text: '', subItems: [] }]);
          }

          setLocation(meeting.location || '');
          setCategory(meeting.category || 'Online');
          setPlatform(meeting.platform || 'Microsoft Teams');
          setMeetingLink(meeting.meetingLink || '');
          setTimeZone(meeting.timeZone || 'UTC');
        }
      } else {
        // Add Dummy Data for new meeting
        const newId = uuidv4();
        setCurrentMeetingId(newId);
        setTitle('Quarterly Sync: Project Alpha');
        setType('Internal');
        setVisibility('Personal');
        setStartDate(today);
        setStartTime('10:00');
        setEndDate(today);
        setEndTime('11:00');
        setSelectedParticipants(currentUser ? [currentUser] : []);
        setProject({ id: '1', name: 'Project Alpha' });
          setDescription('Discuss the progress on Project Alpha features and roadblocks. Please review the attached documents prior to the meeting.');
        setAgendaList([{ 
          id: `temp-${Date.now()}`, 
          text: 'Review Timeline', 
          subItems: [],
          priority: 'High',
          status: 'Pending',
          tasks: 'https://jira.company.com/ALPHA-101',
          documentUrl: 'https://sharepoint.company.com/docs/alpha-timeline.pdf'
        }]);
        setLocation('Room 4B');
        setCategory('Hybrid');
        setPlatform('Microsoft Teams');
        setMeetingLink('https://teams.microsoft.com/l/meetup-join/dummy');
        setTimeZone('UTC');
      }
      setIsSubmitting(false);
    }
  }, [isMeetingModalOpen, editingMeetingId]);

  if (!isMeetingModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!title.trim()) {
    setShowTitleAlert(true);
    return;
  }

  if (!currentUser) return;

  setIsSubmitting(true);

  try {
    let finalMeetingLink = meetingLink;

    // ✅ Generate meeting link if needed
    if ((category === 'Online' || category === 'Hybrid') && !finalMeetingLink.trim()) {
      setIsGeneratingLink(true);

      const randomId = Math.random().toString(36).substring(2, 11);
      const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();

      if (platform === 'Microsoft Teams') {
        finalMeetingLink = `https://teams.microsoft.com/l/meetup-join/${uuidv4()}`;
      } else if (platform === 'Zoom') {
        finalMeetingLink = `https://zoom.us/j/${randomDigits}`;
      } else if (platform === 'Google Meet') {
        finalMeetingLink = `https://meet.google.com/${randomId.slice(0,3)}-${randomId.slice(3,6)}-${randomId.slice(6,9)}`;
      } else {
        finalMeetingLink = `https://link.meeting.com/${randomId}`;
      }

      setMeetingLink(finalMeetingLink);
      setIsGeneratingLink(false);
    }

    // ✅ Proper DateTime conversion
    const startDateTimeObj = new Date(`${startDate}T${startTime}:00`);
    const endDateTimeObj = new Date(`${endDate}T${endTime}:00`);

    const startISO = startDateTimeObj.toISOString();
    const endISO = endDateTimeObj.toISOString();

    // ✅ Participants (Person/Lookup field safe)
    const participantIds = selectedParticipants
      .map(u => Number(u.id))
      .filter(id => Number.isInteger(id));

    // ✅ Agenda handling (supports single or multi-lookup column)
    const agendaIds: number[] = [];
    const agendaToSave = agendaList.filter((a) => a.text?.trim());

    if (agendaToSave.length > 0) {
      try {
        for (const agenda of agendaToSave) {
          const existing = await AgendaService.getAgendaByTitle(agenda.text);
          if (existing) {
            agendaIds.push(Number(existing));
          } else {
            const created = await AgendaService.addAgenda({
              Title: agenda.text,
              Owner: agenda.ownerId || '',
              DocumentUrl: agenda.documentUrl || '',
              TaskLink: agenda.tasks || '',
              Priority: agenda.priority || '',
              Status: agenda.status || ''
            });
            agendaIds.push(Number(created));
          }
        }
      } catch (err: any) {
        console.error("❌ Agenda error:", err);
        alert("Agenda save failed: " + err.message);
        setIsSubmitting(false);
        return;
      }
    }

    // ✅ FINAL PAYLOAD (CLEAN)
    const payload: any = {
      Title: title,
      MeetingType: type,
      Visibility: visibility,

      // ⚠️ Use correct field names as per SP list
      // SharePoint columns are DateTime (Edm.DateTime), so send ISO strings
      StartDate: startISO,
      StartTime: startISO,
      EndDate: endISO,
      EndTime: endISO,

      TimeZone: timeZone,
      Description: description || '',
      Format: category,

      Platform:
        category === 'Online' || category === 'Hybrid'
          ? platform
          : null,

      MeetingLink:
        category === 'Online' || category === 'Hybrid'
          ? finalMeetingLink
          : null,

      Location:
        category === 'Offline' || category === 'Hybrid'
          ? location
          : null,

      // With PnP items.add, multi-lookup values should be plain number arrays
      AgendaId: agendaIds.length > 0 ? agendaIds : null,
      ParticipantsId: participantIds
    };

    // ✅ Linked project safe
    if (project && project.id !== 'custom' && !isNaN(Number(project.id))) {
      payload.LinkedProjectId = Number(project.id);
    }

    console.log("🚀 FINAL PAYLOAD:", payload);

    // ========================
    // 🔁 CREATE OR UPDATE
    // ========================
    let meetingId = editingMeetingId;

    if (editingMeetingId) {
      await MeetingService.updateMeeting(editingMeetingId, payload);
    } else {
      const res = await MeetingService.addMeeting(payload);
      meetingId = res?.id;
    }

    // ========================
    // ✅ LOCAL STORE UPDATE
    // ========================
    const updatedParticipants = selectedParticipants.map(user => ({
      user,
      role: user.id === currentUser.id ? 'Organizer' : 'Participant'
    }));

    const cleanAgenda = agendaList
      .filter(a => a.text?.trim())
      .map((item, index) => ({
        ...item,
        id: item.id.startsWith('temp-')
          ? Date.now().toString() + index
          : item.id
      }));

    const meetingForStore = {
      id: meetingId,
      title,
      startDateTime: startISO,
      endDateTime: endISO,
      description,
      status: 'Scheduled' as const,
      type,
      visibility,
      participants: updatedParticipants,
      participantUids: participantIds,
      project: project || { id: '', name: 'No Project' },
      createdBy: currentUser,
      aiProcessed: false,
      category,
      platform,
      meetingLink: finalMeetingLink,
      location,
      timeZone,
      agendaItems: cleanAgenda
    };

    // Avoid duplicates: update when editing, add when creating
    if (editingMeetingId) {
      await updateMeeting(meetingId as string, meetingForStore as any);
    } else {
      useStore.getState().addMeetingToStore(meetingForStore as any);
    }

    alert(editingMeetingId ? "Meeting updated!" : "Meeting created!");

    closeMeetingModal();

    if (!editingMeetingId && meetingId) {
      navigate(`/meetings/${meetingId}`);
    }

  } catch (err: any) {
    console.error("❌ Meeting error:", err);
    alert("Meeting save failed: " + (err.message || JSON.stringify(err)));
  } finally {
    setIsSubmitting(false);
  }
};



  const handleAddAgendaItem = (index: number) => {
    const newList = [...agendaList];
    newList.splice(index + 1, 0, { id: `temp-${Date.now()}`, text: '', subItems: [] });
    setAgendaList(newList);
  };

  const handleAgendaChange = (index: number, field: keyof AgendaItem, value: any) => {
    const newList = [...agendaList];
    newList[index] = { ...newList[index], [field]: value };
    setAgendaList(newList);
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!currentMeetingId) return;
    setUploadingIndex(index);
    try {
      const fileId = uuidv4();
      const storagePath = `local/${currentMeetingId}/agenda/${fileId}_${file.name}`;
      const downloadURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Unable to read file'));
        reader.readAsDataURL(file);
      });

      const newList = [...agendaList];
      newList[index] = {
        ...newList[index],
        documentUrl: downloadURL,
        documentStoragePath: storagePath
      };
      setAgendaList(newList);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const toggleParticipant = (user: User) => {
    if (selectedParticipants.find(p => p.id === user.id)) {
      setSelectedParticipants(selectedParticipants.filter(p => p.id !== user.id));
    } else {
      setSelectedParticipants([...selectedParticipants, user]);
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          closeMeetingModal();
        }
      }}
    >
      <div
        className="modal-container meeting-modal rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <PageLoader active={isSubmitting} isGeneratingLink={isGeneratingLink} />
        <header className="modal-header">
          <div>
            <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">
              {editingMeetingId ? 'Edit Meeting' : 'Schedule New Meeting'}
            </h2>
            <p className="text-[var(--DisabledGrey)] text-sm mt-1">
              {editingMeetingId ? 'Update meeting details and agenda.' : 'Create a structured meeting profile and automate calendar invites.'}
            </p>
          </div>
          <button
            onClick={closeMeetingModal}
            className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] transition-colors"
          >
            <CloseIcon size={24} />
          </button>
        </header>

        <div className="modal-body !p-0 bg-[var(--LightBgGrey)] overflow-y-auto overflow-x-hidden">
          <div className="bg-white rounded-lg shadow-sm border border-[var(--BorderGrey)] m-6">
            <div className="p-6 space-y-8">

              {/* Basic Info */}
              <div className="space-y-4">

                {/* Heading */}
                <h3 className="text-[var(--title)] font-semibold text-[var(--TextBlack)] border-b border-[var(--BorderGrey)] pb-2">
                  Basic Information
                </h3>

                <div className="meeting-grid meeting-grid-basic">

                  {/* Meeting Title */}
                  <div className="space-y-2 meeting-field meeting-field-title">
                    <label className="block text-sm font-medium text-gray-700">
                      Meeting Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Q3 Planning Session"
                    />
                  </div>

                  {/* Meeting Type */}
                  <div className="space-y-2 meeting-field">
                    <label className="block text-sm font-medium text-gray-700">
                      Meeting Type
                    </label>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={e => setType(e.target.value as MeetingType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      >
                        <option value="Internal">Internal</option>
                        <option value="Client">Client</option>
                        <option value="ILF">ILF</option>
                        <option value="Review">Review</option>
                        <option value="Other">Other</option>
                      </select>

                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-2 meeting-field">
                    <label className="block text-sm font-medium text-gray-700">
                      Visibility
                    </label>
                    <div className="relative">
                      <select
                        value={visibility}
                        onChange={e => setVisibility(e.target.value as MeetingVisibility)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      >
                        <option value="Global">Global (Visible to everyone)</option>
                        <option value="Personal">Personal (Assigned users only)</option>
                      </select>

                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </div>

                  {/* Linked Project */}
                  <div className="space-y-2 meeting-field meeting-field-project">
                    <SearchInput
                      label="Linked Project"
                      value={project?.name || ''}
                      onChange={(e) => {
                        const selectedTitle = e.target.value;
                        const found = projectMockData.find(p => p.title === selectedTitle);

                        if (found) {
                          setProject({ id: found.id, name: found.title });
                        } else {
                          setProject({ id: 'custom', name: selectedTitle });
                        }
                      }}
                    />
                  </div>

                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <h3 className="text-[var(--title)] font-semibold text-[var(--TextBlack)] border-b border-[var(--BorderGrey)] pb-2">Date & Time</h3>

                <div className="meeting-grid meeting-grid-datetime">
                  <div className="space-y-2 meeting-field">
                    <label className="block text-sm font-medium text-[var(--TextBlack)]">Start Date & Time</label>
                    <div className="meeting-datetime-group">
                      <div className="relative flex-1 meeting-input-shell" onClick={() => handleOpenPicker(startDateRef)}>
                        <input
                          ref={startDateRef}
                          type="date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className={`w-full pr-10 cursor-pointer meeting-datetime-input ${!startDate ? 'text-[var(--DisabledGrey)]' : 'text-[var(--TextBlack)]'}`}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                      </div>
                      <div className="relative meeting-input-shell meeting-time-shell" onClick={() => handleOpenPicker(startTimeRef)}>
                        <input
                          ref={startTimeRef}
                          type="time"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          className={`w-full pr-10 cursor-pointer meeting-datetime-input ${!startTime ? 'text-[var(--DisabledGrey)]' : 'text-[var(--TextBlack)]'}`}
                        />
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 meeting-field">
                    <label className="block text-sm font-medium text-[var(--TextBlack)]">End Date & Time</label>
                    <div className="meeting-datetime-group">
                      <div className="relative flex-1 meeting-input-shell" onClick={() => handleOpenPicker(endDateRef)}>
                        <input
                          ref={endDateRef}
                          type="date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className={`w-full pr-10 cursor-pointer meeting-datetime-input ${!endDate ? 'text-[var(--DisabledGrey)]' : 'text-[var(--TextBlack)]'}`}
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                      </div>
                      <div className="relative meeting-input-shell meeting-time-shell" onClick={() => handleOpenPicker(endTimeRef)}>
                        <input
                          ref={endTimeRef}
                          type="time"
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          className={`w-full pr-10 cursor-pointer meeting-datetime-input ${!endTime ? 'text-[var(--DisabledGrey)]' : 'text-[var(--TextBlack)]'}`}
                        />
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 meeting-field">
                    <label className="block text-sm font-medium text-[var(--TextBlack)]">Time Zone</label>
                    <div className="relative meeting-input-shell">
                      <select
                        value={timeZone}
                        onChange={e => setTimeZone(e.target.value)}
                        className="w-full pr-10 appearance-none meeting-select-input"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (US & Canada)</option>
                        <option value="America/Chicago">Central Time (US & Canada)</option>
                        <option value="America/Denver">Mountain Time (US & Canada)</option>
                        <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Asia/Dubai">Dubai</option>
                        <option value="Asia/Kolkata">Mumbai / New Delhi</option>
                        <option value="Australia/Sydney">Sydney</option>
                      </select>
                      <Globe className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-4">
                <h3 className="text-[var(--title)] font-semibold text-[var(--TextBlack)] border-b border-[var(--BorderGrey)] pb-2">
                  Participants
                </h3>
                <PeoplePicker
                  multiple={true}
                  onSelectionChange={(users) => setSelectedParticipants(users)}
                  placeholder="Search participants..."
                  label="Selected Participants"
                  users={users}
                  teams={teams}
                  value={selectedParticipants}
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h3 className="text-[var(--title)] font-semibold text-[var(--TextBlack)] border-b border-[var(--BorderGrey)] pb-2">Meeting Details</h3>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--TextBlack)]">Description</label>
                    <div className="border border-[var(--BorderGrey)] rounded-sm overflow-hidden bg-white">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Implement a functionality..."
                        className="w-full h-32 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--TextBlack)]">
                      Agenda
                    </label>

                    <div className="space-y-4">
                      {agendaList.map((item, index) => (
                        <div
                          key={item.id}
                          className="border border-[var(--BorderGrey)] rounded-lg p-4 bg-[var(--LightBgGrey)] space-y-4"
                        >
                          {/* ROW 1 */}
                          <div className="agenda-row agenda-row-top">

                            {/* Agenda Title */}
                            <div className="min-w-0 w-full agenda-col agenda-col-title">
                              <label className="block text-sm font-medium mb-1">
                                Agenda Title
                              </label>
                              <input
                                type="text"
                                value={item.text}
                                onChange={(e) =>
                                  handleAgendaChange(index, "text", e.target.value)
                                }
                                placeholder="Enter agenda item title..."
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)] text-sm"
                              />
                            </div>

                            {/* Related Documents */}
                            <div className="min-w-0 w-full agenda-col agenda-col-docs">
                              <label className="block text-sm font-medium mb-1">
                                Related Documents
                              </label>

                              <div className="flex gap-2 w-full">
                                <div className="relative flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={item.documentUrl || ""}
                                    onChange={(e) =>
                                      handleAgendaChange(index, "documentUrl", e.target.value)
                                    }
                                    placeholder="Paste URL or upload..."
                                    className="w-full px-3 py-2 border rounded-md pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                                  />

                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    {item.documentUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const fileName =
                                            item.documentStoragePath
                                              ?.split("/")
                                              .pop()
                                              ?.split("_")
                                              .slice(1)
                                              .join("_") ||
                                            item.text ||
                                            "Document";

                                          useStore.getState().setActivePreviewFile({
                                            id: item.id,
                                            name: fileName,
                                            url: item.documentUrl!,
                                            storagePath: item.documentStoragePath,
                                            type: "application/octet-stream",
                                            meetingId: editingMeetingId || undefined,
                                            agendaItemId: item.id,
                                          });
                                        }}
                                        className="text-[var(--SiteBlue)] hover:text-[#1e3e6d]"
                                      >
                                        <Eye size={14} />
                                      </button>
                                    )}
                                    <LinkIcon size={14} className="text-gray-400" />
                                  </div>
                                </div>

                                {/* Upload */}
                                <label className="flex items-center justify-center px-3 border rounded cursor-pointer bg-white">
                                  {uploadingIndex === index ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <FileText size={16} />
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    disabled={uploadingIndex !== null}
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleFileUpload(index, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Task Link */}
                            <div className="min-w-0 w-full agenda-col agenda-col-task">
                              <label className="block text-sm font-medium mb-1">
                                Task Link
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.tasks || ""}
                                  onChange={(e) =>
                                    handleAgendaChange(index, "tasks", e.target.value)
                                  }
                                  placeholder="https://..."
                                  className="w-full px-3 py-2 border rounded-md pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                                />
                                <LinkIcon
                                  size={14}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <div className="agenda-remove-wrap agenda-col agenda-col-remove">
                              <button
                                type="button"
                                onClick={() => {
                                  const newList = [...agendaList];
                                  newList.splice(index, 1);
                                  if (newList.length === 0) {
                                    newList.push({
                                      id: `temp-${Date.now()}`,
                                      text: "",
                                      subItems: [],
                                    });
                                  }
                                  setAgendaList(newList);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500"
                              >
                                <CloseIcon size={18} />
                              </button>
                            </div>
                          </div>

                          {/* ROW 2 */}
                          <div className="agenda-row agenda-row-bottom">

                            {/* Priority */}
                            <div className="min-w-0 w-full agenda-col agenda-col-priority">
                              <label className="block text-sm font-medium mb-1">
                                Priority
                              </label>
                              <select
                                value={item.priority || ""}
                                onChange={(e) =>
                                  handleAgendaChange(index, "priority", e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                              >
                                <option value="">Select...</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            </div>

                            {/* Status */}
                            <div className="min-w-0 w-full agenda-col agenda-col-status">
                              <label className="block text-sm font-medium mb-1">
                                Status
                              </label>
                              <select
                                value={item.status || ""}
                                onChange={(e) =>
                                  handleAgendaChange(index, "status", e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                              >
                                <option value="">Select...</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>

                            {/* Owner */}
                            <div className="min-w-0 w-full agenda-col agenda-col-owner">
                              <PeoplePicker
                                multiple={false}
                                onSelectionChange={(users) =>
                                  handleAgendaChange(index, "ownerId", users[0]?.id || "")
                                }
                                placeholder="Select owner..."
                                label="Owner"
                                users={selectedParticipants}
                                value={selectedParticipants.filter(
                                  (p) => p.id === item.ownerId
                                )}
                              />
                            </div>

                            <div className="agenda-row-spacer" />
                          </div>

                          {/* ACTIONS */}
                          <div className="flex justify-end gap-4 pt-2">
                            {agendaList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newList = [...agendaList];
                                  newList.splice(index, 1);
                                  setAgendaList(newList);
                                }}
                                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                              >
                                <CloseIcon size={16} /> Remove Item
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAddAgendaItem(index)}
                              className="text-sm text-[var(--SiteBlue)] hover:text-[#1e3e6d] flex items-center gap-1"
                            >
                              <Plus size={16} /> Add Another Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="meeting-grid meeting-grid-format">
                    <div className="space-y-2 meeting-field">
                      <label className="block text-sm font-medium text-[var(--TextBlack)]">Meeting Type</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as MeetingCategory)}
                        className="w-full meeting-select-input"
                      >
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    {(category === 'Online' || category === 'Hybrid') && (
                      <div className="space-y-2 meeting-field">
                        <label className="block text-sm font-medium text-[var(--TextBlack)]">Platform</label>
                        <select
                          value={platform}
                          onChange={e => setPlatform(e.target.value as MeetingPlatform)}
                          className="w-full meeting-select-input"
                        >
                          <option value="Microsoft Teams">Microsoft Teams</option>
                          <option value="Zoom">Zoom</option>
                          <option value="Google Meet">Google Meet</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    {(category === 'Online' || category === 'Hybrid') && (
                      <div className="space-y-2 meeting-field">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-[var(--TextBlack)]">Meeting Link</label>
                          <button
                            type="button"
                            onClick={async () => {
                              setIsGeneratingLink(true);
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              const randomId = Math.random().toString(36).substring(2, 11);
                              const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
                              let link = '';
                              if (platform === 'Microsoft Teams') link = `https://teams.microsoft.com/l/meetup-join/${uuidv4()}`;
                              else if (platform === 'Zoom') link = `https://zoom.us/j/${randomDigits}`;
                              else if (platform === 'Google Meet') link = `https://meet.google.com/${randomId.substring(0, 3)}-${randomId.substring(3, 6)}-${randomId.substring(6, 9)}`;
                              else link = `https://link.meeting.com/${randomId}`;
                              setMeetingLink(link);
                              setIsGeneratingLink(false);
                            }}
                            className="text-[10px] font-semibold text-[var(--SiteBlue)] hover:underline uppercase tracking-wider flex items-center gap-1"
                            disabled={isGeneratingLink}
                          >
                            {isGeneratingLink ? (
                              <><Loader2 size={10} className="animate-spin" /> Generating...</>
                            ) : (
                              <><Sparkles size={10} /> Auto-Generate Link</>
                            )}
                          </button>
                        </div>
                        <div className="relative meeting-input-shell">
                          <input
                            type="text"
                            value={meetingLink}
                            onChange={e => setMeetingLink(e.target.value)}
                            className="w-full meeting-text-input pr-10"
                            placeholder={
                              platform === 'Microsoft Teams' ? 'https://teams.microsoft.com/...' :
                                platform === 'Zoom' ? 'https://zoom.us/j/...' :
                                  platform === 'Google Meet' ? 'https://meet.google.com/...' :
                                    'Enter meeting link'
                            }
                          />
                          <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                        </div>
                      </div>
                    )}

                    {(category === 'Offline' || category === 'Hybrid') && (
                      <div className="space-y-2 meeting-field">
                        <label className="block text-sm font-medium text-[var(--TextBlack)]">Location</label>
                        <div className="relative meeting-input-shell">
                          <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full meeting-text-input pr-10"
                            placeholder="e.g., Meeting Room 4B, Office Address"
                          />
                          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={(e) => handleSubmit(e as any)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {editingMeetingId ? 'Saving...' : 'Scheduling...'}
              </>
            ) : (
              editingMeetingId ? 'Save Changes' : 'Schedule Meeting'
            )}
          </button>
          <button
            type="button"
            onClick={closeMeetingModal}
            className="btn-default"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </footer>

        {/* Title Alert Modal */}
        {showTitleAlert && (
          <div className="modal-overlay z-[60] flex items-center justify-center" onClick={() => setShowTitleAlert(false)}>
            <div
              className="bg-white rounded-lg shadow-lg w-[280px] p-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-red-600">
                  Required Field
                </h3>
                <button
                  onClick={() => setShowTitleAlert(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              {/* Body */}
              <p className="text-sm text-gray-700 mb-4">
                Meeting Title is required.
              </p>

              {/* Footer */}
              <button
                onClick={() => setShowTitleAlert(false)}
                className="bg-blue-600 text-white text-sm py-1.5 rounded w-full hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
