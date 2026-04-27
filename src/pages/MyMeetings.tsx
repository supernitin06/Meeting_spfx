import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { format, isToday, isAfter, isBefore, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, endOfWeek, isSameMonth, addMonths, subMonths, differenceInMinutes, subDays, startOfDay, endOfDay, eachHourOfInterval, isWithinInterval } from 'date-fns';
import { Link } from 'react-router-dom';
import { Search, FileText, Calendar, Clock, Edit3, LayoutGrid, List, CalendarDays, ChevronLeft, ChevronRight, MapPin, ListChecks, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Meeting } from '../types';
import { SmartTable } from '../GlobalCommonTable/Table/SmartTable';
import { ColumnSetting, TableSettings } from '../GlobalCommonTable/Table/TableTypes';
import { MeetingService } from '../services/MeetingService';

export default function MyMeetings() {
  const currentUser = useStore(state => state.currentUser);
  const openMeetingModal = useStore(state => state.openMeetingModal);
  
  // Fetch meetings directly from API
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetingsData = async () => {
      try {
        setLoading(true);
        const data = await MeetingService.getMeetings();
        setMeetings(data as Meeting[]);
        setError(null);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingsData();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Today' | 'Upcoming' | 'Past'>('Today');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'calendar'>('card');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDayForMore, setSelectedDayForMore] = useState<Date | null>(null);

  // SmartTable State
  const initialColumns: ColumnSetting[] = [
    { id: 'title', key: 'title', label: 'Meeting Title', visible: true, width: 250, order: 1 },
    { id: 'startDateTime', key: 'startDateTime', label: 'Date & Time', visible: true, width: 200, order: 2 },
    { id: 'project', key: 'project', label: 'Project', visible: true, width: 150, order: 3 },
    { id: 'status', key: 'status', label: 'Status', visible: true, width: 120, order: 4 },
    { id: 'participants', key: 'participants', label: 'Participants', visible: true, width: 150, order: 5 },
  ];

  const [tableSettings, setTableSettings] = useState<TableSettings>({
    showHeader: true,
    showColumnFilter: true,
    showAdvancedSearch: true,
    tableHeight: 'Flexible',
    columns: initialColumns,
    visibleIcons: ['excel', 'print', 'expand'],
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchType, setSearchType] = useState<'All Words' | 'Any Words' | 'Exact Phrase'>('All Words');
  const [searchFields, setSearchFields] = useState<string[]>(['title', 'project.name']);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const nextDate = () => {
    if (calendarViewType === 'month') setReferenceDate(addMonths(referenceDate, 1));
    else if (calendarViewType === 'week') setReferenceDate(addDays(referenceDate, 7));
    else setReferenceDate(addDays(referenceDate, 1));
  };

  const prevDate = () => {
    if (calendarViewType === 'month') setReferenceDate(subMonths(referenceDate, 1));
    else if (calendarViewType === 'week') setReferenceDate(subDays(referenceDate, 7));
    else setReferenceDate(subDays(referenceDate, 1));
  };

  const goToToday = () => setReferenceDate(new Date());

  const getMeetingParticipantUsers = (meeting: Meeting) => {
    const participants = Array.isArray(meeting.participants) ? meeting.participants : [];
    return participants
      .map((participant: any) => participant?.user ?? participant)
      .filter((user: any) => user && user.id !== undefined && user.id !== null);
  };

  const myMeetings = meetings.filter((m) => {
    if (!currentUser) return false;

    const currentUserId = String(currentUser.id);
    const creatorId = m.createdBy?.id != null ? String(m.createdBy.id) : null;
    const hasCurrentUserInParticipants = getMeetingParticipantUsers(m).some(
      (user: any) => String(user.id) === currentUserId
    );

    return (
      m.visibility === 'Global' ||
      hasCurrentUserInParticipants ||
      creatorId === currentUserId
    );
  });

  const filteredMeetings = useMemo(() => {
    let result = [...myMeetings];

    // Global Search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(m => {
        const valuesToSearch = searchFields.map(field => {
          if (field === 'title') return m.title;
          if (field === 'project.name') return m.project?.name || '';
          if (field === 'status') return m.status;
          return '';
        }).filter(Boolean);

        if (searchType === 'Exact Phrase') {
          return valuesToSearch.some(v => v.toLowerCase().includes(query));
        } else if (searchType === 'All Words') {
          const words = query.split(' ').filter(Boolean);
          return words.every(word => valuesToSearch.some(v => v.toLowerCase().includes(word)));
        } else { // Any Words
          const words = query.split(' ').filter(Boolean);
          return words.some(word => valuesToSearch.some(v => v.toLowerCase().includes(word)));
        }
      });
    }

    // Column Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const val = value.toLowerCase();
      result = result.filter(m => {
        if (key === 'title') return m.title.toLowerCase().includes(val);
        if (key === 'project') return (m.project?.name || '').toLowerCase().includes(val);
        if (key === 'status') return m.status.toLowerCase().includes(val);
        if (key === 'startDateTime') {
          const dateStr = format(new Date(m.startDateTime), 'MMM d, yyyy h:mm a').toLowerCase();
          return dateStr.includes(val);
        }
        return true;
      });
    });

    // Sorting
    if (sortKey && sortDirection) {
      result.sort((a, b) => {
        let aVal: any = '';
        let bVal: any = '';

        if (sortKey === 'title') { aVal = a.title; bVal = b.title; }
        else if (sortKey === 'startDateTime') { aVal = new Date(a.startDateTime).getTime(); bVal = new Date(b.startDateTime).getTime(); }
        else if (sortKey === 'project') { aVal = a.project?.name || ''; bVal = b.project?.name || ''; }
        else if (sortKey === 'status') { aVal = a.status; bVal = b.status; }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [myMeetings, searchTerm, searchType, searchFields, filters, sortKey, sortDirection]);

  const now = new Date();
  
  const todaysMeetings = filteredMeetings.filter(m => isToday(new Date(m.startDateTime)));
  const upcomingMeetings = filteredMeetings.filter(m => isAfter(new Date(m.startDateTime), now) && !isToday(new Date(m.startDateTime)));
  const pastMeetings = filteredMeetings.filter(m => isBefore(new Date(m.startDateTime), now) && !isToday(new Date(m.startDateTime)));

  const displayedMeetings = activeTab === 'Today' ? todaysMeetings : activeTab === 'Upcoming' ? upcomingMeetings : pastMeetings;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === displayedMeetings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedMeetings.map(m => m.id)));
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const renderCell = (meeting: Meeting, column: ColumnSetting) => {
    switch (column.key) {
      case 'title':
        return (
          <div className="flex items-center gap-2">
            <Link to={`/meetings/${meeting.id}`} className="font-semibold text-[var(--SiteBlue)] hover:underline cursor-pointer">
              {meeting.title}
            </Link>
            {meeting.aiProcessed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--SiteBlue)] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                <FileText size={12} /> AI
              </span>
            )}
          </div>
        );
      case 'startDateTime':
        return (
          <span className="text-sm text-[var(--TextBlack)] font-medium">
            {format(new Date(meeting.startDateTime), 'MMM d, yyyy')} • {format(new Date(meeting.startDateTime), 'h:mm a')}
          </span>
        );
      case 'project':
        return <span className="text-sm text-[var(--TextBlack)] font-medium">{meeting.project?.name || 'No Project'}</span>;
      case 'status':
        return <span className="text-sm text-[var(--TextBlack)] font-medium">{meeting.status}</span>;
      case 'participants':
        {
          const participantUsers = getMeetingParticipantUsers(meeting);
          const visibleParticipants = participantUsers.slice(0, 3);
          return (
          <div className="flex -space-x-2">
            {visibleParticipants.map((user: any, i) => (
              <img key={String(user.id)} src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2F5596&color=fff`} alt={user.name || 'User'} className="avatar-img border-2 border-white shadow-sm" style={{ zIndex: 3 - i }} />
            ))}
            {participantUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-[var(--SuccessGreen)] flex items-center justify-center text-[10px] font-bold text-white z-0 shadow-sm">
                +{participantUsers.length - 3}
              </div>
            )}
          </div>
        );
        }
      default:
        return null;
    }
  };

  const renderTableView = () => (
    <SmartTable
      data={displayedMeetings}
      columns={tableSettings.columns}
      tableSettings={tableSettings}
      onSettingsChange={setTableSettings}
      defaultSettings={{
        showHeader: true,
        showColumnFilter: true,
        showAdvancedSearch: true,
        tableHeight: 'Flexible',
        columns: initialColumns,
        visibleIcons: ['excel', 'print', 'expand'],
      }}
      selectedIds={selectedIds}
      onToggleSelect={handleToggleSelect}
      onToggleSelectAll={handleToggleSelectAll}
      isAllSelected={selectedIds.size === displayedMeetings.length && displayedMeetings.length > 0}
      searchQuery={searchTerm}
      onSearchChange={setSearchTerm}
      searchType={searchType}
      onSearchTypeChange={setSearchType}
      searchFields={searchFields}
      onSearchFieldsChange={setSearchFields}
      searchFieldOptions={['title', 'project.name', 'status']}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      filters={filters}
      onFilterChange={handleFilterChange}
      renderCell={renderCell}
      onIconClick={(id) => {
        if (id === 'sort') {
          setSortKey(null);
          setSortDirection(null);
        } else if (id === 'print') {
          window.print();
        } else if (id === 'expand') {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        } else {
          console.log('Icon clicked:', id);
        }
      }}
      onEditClick={(meeting) => openMeetingModal(meeting.id)}
      viewportHeight={600}
    />
  );

  const renderCalendarView = () => {
    const hours = eachHourOfInterval({
      start: startOfDay(referenceDate),
      end: endOfDay(referenceDate)
    });

    const renderMonthGrid = () => {
      const monthStart = startOfMonth(referenceDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

      const rows: JSX.Element[] = [];
      let days: JSX.Element[] = [];
      let day = startDate;

      while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
          const cloneDay = day;
          const dayMeetings = myMeetings.filter(m => isSameDay(new Date(m.startDateTime), cloneDay));
          
          days.push(
            <div
              className={clsx(
                "min-h-[120px] border-r border-b border-[var(--BorderGrey)] p-1 flex flex-col",
                !isSameMonth(day, monthStart) ? "bg-[#F0F0F0] text-[#918D8D]" : "bg-white",
                isSameDay(day, new Date()) ? "bg-blue-50/30" : ""
              )}
              key={day.toString()}
            >
              <div className="flex justify-end mb-1">
                <span className={clsx(
                  "text-sm p-1 min-w-[24px] text-center",
                  isSameDay(day, new Date()) ? 'font-bold text-white bg-[var(--SiteBlue)] rounded-full' : 'text-[#333333] font-medium'
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {dayMeetings.slice(0, 3).map(meeting => (
                  <Link 
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    className="block bg-[var(--SiteBlue)] text-white text-[11px] px-1.5 py-1 rounded-sm truncate hover:opacity-90 transition-colors"
                    title={meeting.title}
                  >
                    {meeting.title}
                  </Link>
                ))}
                {dayMeetings.length > 3 && (
                  <button 
                    onClick={() => setSelectedDayForMore(cloneDay)}
                    className="text-[11px] font-bold text-[var(--SiteBlue)] px-1 hover:underline w-full text-left"
                  >
                    +{dayMeetings.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
          day = addDays(day, 1);
        }
        rows.push(
          <div className="grid grid-cols-7" key={day.toString()}>
            {days}
          </div>
        );
        days = [];
      }

      return (
        <div className="flex flex-col border-l border-t border-[var(--BorderGrey)]">
          <div className="grid grid-cols-7 border-b border-[var(--BorderGrey)] bg-[var(--LightBgGrey)]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2 text-center text-sm font-bold text-[var(--TextBlack)] border-r border-[var(--BorderGrey)] last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          {rows}
        </div>
      );
    };

    const renderWeekGrid = () => {
      const startDate = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

      return (
        <div className="flex flex-col border-l border-t border-[var(--BorderGrey)]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[var(--BorderGrey)] bg-[var(--LightBgGrey)] sticky top-0 z-10">
            <div className="py-2 border-r border-[var(--BorderGrey)]"></div>
            {weekDays.map((day) => (
              <div key={day.toString()} className={clsx(
                "py-2 text-center border-r border-[var(--BorderGrey)] last:border-r-0",
                isToday(day) && "bg-blue-50"
              )}>
                <div className="text-xs font-bold text-[var(--DisabledGrey)] uppercase">{format(day, 'EEE')}</div>
                <div className={clsx(
                  "text-lg font-bold",
                  isToday(day) ? "text-[var(--SiteBlue)]" : "text-[var(--TextBlack)]"
                )}>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {hours.map((hour) => (
              <div key={hour.toString()} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[var(--BorderGrey)] min-h-[60px]">
                <div className="text-[10px] text-[var(--DisabledGrey)] font-medium p-2 text-right border-r border-[var(--BorderGrey)]">
                  {format(hour, 'HH:mm')}
                </div>
                {weekDays.map((day) => {
                  const dayHourStart = new Date(day.setHours(hour.getHours(), 0, 0, 0));
                  const dayHourEnd = new Date(day.setHours(hour.getHours() + 1, 0, 0, 0));
                  const hourMeetings = myMeetings.filter(m => {
                    const start = new Date(m.startDateTime);
                    return isSameDay(start, day) && start.getHours() === hour.getHours();
                  });

                  return (
                    <div key={day.toString() + hour.toString()} className={clsx(
                      "border-r border-[var(--BorderGrey)] last:border-r-0 p-1 relative",
                      isToday(day) && "bg-blue-50/20"
                    )}>
                      {hourMeetings.map(meeting => (
                        <Link
                          key={meeting.id}
                          to={`/meetings/${meeting.id}`}
                          className="block bg-[var(--SiteBlue)] text-white text-[10px] p-1 rounded-sm truncate mb-1"
                          title={meeting.title}
                        >
                          {meeting.title}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderDayGrid = () => {
      return (
        <div className="flex flex-col border-l border-t border-[var(--BorderGrey)]">
          <div className="grid grid-cols-[80px_1fr] border-b border-[var(--BorderGrey)] bg-[var(--LightBgGrey)] sticky top-0 z-10">
            <div className="py-2 border-r border-[var(--BorderGrey)]"></div>
            <div className="py-2 px-4 text-left">
              <div className="text-xs font-bold text-[var(--DisabledGrey)] uppercase">{format(referenceDate, 'EEEE')}</div>
              <div className="text-lg font-bold text-[var(--SiteBlue)]">{format(referenceDate, 'MMMM d, yyyy')}</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {hours.map((hour) => {
              const hourMeetings = myMeetings.filter(m => {
                const start = new Date(m.startDateTime);
                return isSameDay(start, referenceDate) && start.getHours() === hour.getHours();
              });

              return (
                <div key={hour.toString()} className="grid grid-cols-[80px_1fr] border-b border-[var(--BorderGrey)] min-h-[80px]">
                  <div className="text-[10px] text-[var(--DisabledGrey)] font-medium p-4 text-right border-r border-[var(--BorderGrey)]">
                    {format(hour, 'HH:mm')}
                  </div>
                  <div className="p-2 space-y-2">
                    {hourMeetings.map(meeting => (
                      <Link
                        key={meeting.id}
                        to={`/meetings/${meeting.id}`}
                        className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-3 rounded-lg hover:bg-blue-100 transition-colors group"
                      >
                        <div className="w-1 h-full bg-[var(--SiteBlue)] rounded-full" />
                        <div>
                          <div className="font-bold text-[var(--SiteBlue)] text-sm">{meeting.title}</div>
                          <div className="text-[10px] text-[var(--DisabledGrey)]">
                            {format(new Date(meeting.startDateTime), 'h:mm a')} - {format(new Date(meeting.endDateTime), 'h:mm a')}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--BorderGrey)]">
          <div className="flex items-center rounded-md border border-[var(--BorderGrey)] overflow-hidden">
            <button onClick={goToToday} className="px-4 py-1.5 text-sm font-medium text-[var(--TextBlack)] bg-white hover:bg-[var(--LightBgGrey)] border-r border-[var(--BorderGrey)]">
              Today
            </button>
            <button onClick={prevDate} className="px-4 py-1.5 text-sm font-medium text-[var(--TextBlack)] bg-white hover:bg-[var(--LightBgGrey)] border-r border-[var(--BorderGrey)]">
              Back
            </button>
            <button onClick={nextDate} className="px-4 py-1.5 text-sm font-medium text-[var(--TextBlack)] bg-white hover:bg-[var(--LightBgGrey)]">
              Next
            </button>
          </div>
          
          <h2 className="text-xl font-medium text-[var(--TextBlack)]">
            {calendarViewType === 'day' 
              ? format(referenceDate, 'MMMM d, yyyy')
              : calendarViewType === 'week'
                ? `Week of ${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                : format(referenceDate, 'MMMM yyyy')
            }
          </h2>
          
          <div className="flex items-center rounded-md border border-[var(--BorderGrey)] overflow-hidden">
            <button 
              onClick={() => setCalendarViewType('month')}
              className={clsx("px-4 py-1.5 text-sm font-medium border-r border-[var(--BorderGrey)]", calendarViewType === 'month' ? "bg-[var(--LightBgGrey)] text-[var(--TextBlack)]" : "bg-white text-[var(--DisabledGrey)] hover:bg-[var(--LightBgGrey)]")}
            >
              Month
            </button>
            <button 
              onClick={() => setCalendarViewType('week')}
              className={clsx("px-4 py-1.5 text-sm font-medium border-r border-[var(--BorderGrey)]", calendarViewType === 'week' ? "bg-[var(--LightBgGrey)] text-[var(--TextBlack)]" : "bg-white text-[var(--DisabledGrey)] hover:bg-[var(--LightBgGrey)]")}
            >
              Week
            </button>
            <button 
              onClick={() => setCalendarViewType('day')}
              className={clsx("px-4 py-1.5 text-sm font-medium", calendarViewType === 'day' ? "bg-[var(--LightBgGrey)] text-[var(--TextBlack)]" : "bg-white text-[var(--DisabledGrey)] hover:bg-[var(--LightBgGrey)]")}
            >
              Day
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px]">
            {calendarViewType === 'month' && renderMonthGrid()}
            {calendarViewType === 'week' && renderWeekGrid()}
            {calendarViewType === 'day' && renderDayGrid()}
          </div>
        </div>
      </div>
    );
  };

  const MeetingCard = ({ meeting, featured = false }: { meeting: Meeting, featured?: boolean }) => {
    const duration = differenceInMinutes(new Date(meeting.endDateTime), new Date(meeting.startDateTime));
    const participantUsers = getMeetingParticipantUsers(meeting);
    
    return (
      <Link 
        to={`/meetings/${meeting.id}`}
        className={clsx(
          "bg-white rounded-[4px] border border-[var(--BorderGrey)] transition-all duration-300 flex flex-col h-full group relative overflow-hidden !no-underline",
          featured ? "shadow-md ring-1 ring-[var(--SiteBlue)]/10" : "hover:border-[var(--SiteBlue)] hover:shadow-sm"
        )}
      >
        {/* Top Accent */}
        <div className={clsx("h-1 w-full", featured ? "bg-[var(--SiteBlue)]" : "bg-[var(--BorderGrey)] group-hover:bg-[var(--SiteBlue)] transition-colors")} />
        
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[var(--DisabledGrey)] uppercase tracking-widest">
                  {meeting.project?.name || 'No Project'}
                </span>
                {meeting.aiProcessed && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--SiteBlue)] animate-pulse" />
                    <span className="text-[8px] font-bold text-[var(--SiteBlue)] uppercase tracking-tighter">AI</span>
                  </div>
                )}
              </div>
              <h3 className={clsx("font-bold text-[var(--SiteBlue)] leading-tight truncate transition-colors", featured ? "text-lg" : "text-base")}>
                {meeting.title}
              </h3>
            </div>
            <img src={participantUsers[0]?.avatar || 'https://i.pravatar.cc/150'} alt="" className="avatar-img shrink-0 ml-3" />
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-[var(--DisabledGrey)] line-clamp-2 mb-4 leading-relaxed">
            {meeting.description.replace(/<[^>]*>/g, '') || 'No description available.'}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-[var(--DisabledGrey)]">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span className="text-[11px] font-medium">{format(new Date(meeting.startDateTime), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span className="text-[11px] font-medium">{format(new Date(meeting.startDateTime), 'h:mm a')} ({duration}m)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[var(--DisabledGrey)]">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                <span className="text-[11px] font-medium truncate max-w-[100px]">{meeting.location || meeting.type}</span>
              </div>
              {meeting.agendaItems && meeting.agendaItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ListChecks size={14} />
                  <span className="text-[11px] font-medium">{meeting.agendaItems.length} Items</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--BorderGrey)]">
            <div className="flex -space-x-1.5">
              {participantUsers.slice(0, 3).map((user: any, i) => (
                <img key={String(user.id)} src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2F5596&color=fff`} alt={user.name || 'User'} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ zIndex: 3 - i }} />
              ))}
              {participantUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-[var(--LightBgGrey)] flex items-center justify-center text-[8px] font-bold text-[var(--TextBlack)] z-0 shadow-sm">
                  +{participantUsers.length - 3}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={clsx(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border",
                meeting.status === 'Completed' ? "bg-[var(--LightBgGrey)] text-[var(--DisabledGrey)] border-[var(--BorderGrey)]" : "bg-blue-50 text-[var(--SiteBlue)] border-blue-100"
              )}>
                {meeting.status}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto space-y-10">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-[var(--mainTitle)] font-bold text-[var(--SiteBlue)]">My Meetings</h1>
              {loading && <span className="text-sm text-[var(--DisabledGrey)]">(Loading...)</span>}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search by keywords"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 bg-white border border-[var(--BorderGrey)] rounded-sm text-sm outline-none shadow-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--DisabledGrey)] pointer-events-none" size={16} />
              </div>
              <button
                onClick={() => openMeetingModal()}
                className="btn-primary text-sm"
              >
                Create meeting
              </button>
            </div>
          </header>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Meetings Section */}
          <section>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--SiteBlue)] mx-auto mb-4"></div>
                  <p className="text-[var(--DisabledGrey)]">Loading meetings...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-[var(--BorderGrey)] pb-3">
                  <div className={clsx("flex items-center gap-8", viewMode === 'calendar' && "invisible")}>
                    <button 
                      onClick={() => setActiveTab('Today')}
                      className={clsx("text-xl font-normal transition-colors relative p-0", activeTab === 'Today' ? "text-[var(--SiteBlue)]" : "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]")}
                    >
                      Today's meetings ({todaysMeetings.length})
                      {activeTab === 'Today' && <span className="absolute -bottom-[12px] left-0 right-0 h-1 bg-[var(--SiteBlue)] rounded-t-full" />}
                    </button>
                    <button 
                      onClick={() => setActiveTab('Upcoming')}
                      className={clsx("text-xl font-normal transition-colors relative p-0", activeTab === 'Upcoming' ? "text-[var(--SiteBlue)]" : "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]")}
                    >
                      Upcoming meetings
                      {activeTab === 'Upcoming' && <span className="absolute -bottom-[12px] left-0 right-0 h-1 bg-[var(--SiteBlue)] rounded-t-full" />}
                    </button>
                    <button 
                      onClick={() => setActiveTab('Past')}
                      className={clsx("text-xl font-normal transition-colors relative p-0", activeTab === 'Past' ? "text-[var(--SiteBlue)]" : "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]")}
                    >
                      Past meetings
                      {activeTab === 'Past' && <span className="absolute -bottom-[12px] left-0 right-0 h-1 bg-[var(--SiteBlue)] rounded-t-full" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-[var(--LightBgGrey)] p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('card')}
                      className={clsx(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'card' ? "bg-white text-[var(--SiteBlue)] shadow-sm" : "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]"
                      )}
                      title="Card View"
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={clsx(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'table' ? "bg-white text-[var(--SiteBlue)] shadow-sm" : "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]"
                      )}
                      title="Table View"
                    >
                      <List size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={clsx(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'calendar' ? "bg-white text-[var(--SiteBlue)] shadow-sm" : "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]"
                      )}
                      title="Calendar View"
                    >
                      <CalendarDays size={18} />
                    </button>
                  </div>
                </div>

                {displayedMeetings.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Calendar size={48} className="mx-auto mb-4 text-[var(--DisabledGrey)]" />
                      <p className="text-[var(--DisabledGrey)] text-lg">No meetings found</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewMode === 'card' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                        {displayedMeetings.map((meeting, idx) => {
                          const isFeatured = activeTab === 'Today' && idx === 1 && displayedMeetings.length > 1;
                          return (
                            <div key={meeting.id} className={clsx(isFeatured && "lg:col-span-1 lg:-mt-4 lg:mb-4 z-10")}>
                              <MeetingCard meeting={meeting} featured={isFeatured} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'table' && renderTableView()}
                    
                    {viewMode === 'calendar' && renderCalendarView()}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* More Meetings Modal */}
      {selectedDayForMore && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-md">
            <div className="modal-header">
              <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">
                Meetings for {format(selectedDayForMore, 'MMMM d, yyyy')}
              </h2>
              <button 
                onClick={() => setSelectedDayForMore(null)} 
                className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body p-6 space-y-3">
              {myMeetings
                .filter(m => isSameDay(new Date(m.startDateTime), selectedDayForMore))
                .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                .map(meeting => (
                  <Link 
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    className="block p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-[var(--SiteBlue)] group-hover:underline">{meeting.title}</div>
                      <div className="text-[10px] font-bold text-[var(--DisabledGrey)] uppercase tracking-wider">{meeting.project?.name || 'No Project'}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--DisabledGrey)]">
                      <Clock size={12} />
                      <span>{format(new Date(meeting.startDateTime), 'h:mm a')} - {format(new Date(meeting.endDateTime), 'h:mm a')}</span>
                    </div>
                  </Link>
                ))}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setSelectedDayForMore(null)} 
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

