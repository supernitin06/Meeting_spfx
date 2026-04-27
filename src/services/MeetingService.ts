import { getSP } from "../config/pnpconfig";

export interface MeetingPayload {
  Title: string;
  MeetingType?: string;
  Visibility?: string;
  LinkedProjectId?: number;
  StartDate?: string;
  StartTime?: string;
  EndDate?: string;
  EndTime?: string;
  TimeZone?: string;
  ParticipantsId?: number[]; // Assuming multi-lookup or single-lookup
  Description?: string;
  AgendaId?: number | number[]; // Lookup to Agenda (single or multi)
  Format?: string;
  Platform?: string;
  MeetingLink?: string;
}

export class MeetingService {
  private static LIST_NAME = "Meetings";

  private static coerceDateOnly(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string") {
      // If it's ISO datetime, return YYYY-MM-DD
      const isoDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoDateMatch) return isoDateMatch[1];
      // If already date-only-ish
      const dateOnlyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dateOnlyMatch) {
        const [, mm, dd, yyyy] = dateOnlyMatch;
        return `${yyyy}-${mm}-${dd}`;
      }
      return value; // fall back (might be a text field)
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return null;
  }

  private static coerceTime(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string") {
      // If ISO datetime, return HH:mm
      const isoTimeMatch = value.match(/T(\d{2}:\d{2})/);
      if (isoTimeMatch) return isoTimeMatch[1];
      // If already HH:mm[:ss]
      const hmMatch = value.match(/^(\d{2}:\d{2})/);
      if (hmMatch) return hmMatch[1];
      return value; // fall back (might be a text field)
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(11, 16);
    }
    return null;
  }

  public static async getMeetings(): Promise<
    Array<{
      id: string;
      title: string;
      meetingType?: string;
      visibility?: string;
      startDate?: string | null;
      startTime?: string | null;
      endDate?: string | null;
      endTime?: string | null;
      timeZone?: string;
      description?: string;
      format?: string;
      platform?: string;
      meetingLink?: string;
      location?: string;
      agenda?: any;
      linkedProject?: any;
      participants?: any[];
    }>
  > {
    const sp = getSP();
    const items = await sp.web.lists.getByTitle(MeetingService.LIST_NAME).items
      .select(
        "Id",
        "Title",
        "MeetingType",
        "Visibility",
        "StartDate",
        "StartTime",
        "EndDate",
        "EndTime",
        "TimeZone",
        "Description",
        "Format",
        "Platform",
        "MeetingLink",
        "Agenda/Id",
        "Agenda/Title",
        "LinkedProject/Id",
        "LinkedProject/Title",
        "Participants/Id",
        "Participants/Title"
      )
      .expand("Agenda", "LinkedProject", "Participants")();
      
    return items.map(item => ({
      id: item.Id.toString(),
      title: item.Title,
      meetingType: item.MeetingType,
      visibility: item.Visibility,
      startDate: MeetingService.coerceDateOnly(item.StartDate),
      startTime: MeetingService.coerceTime(item.StartTime),
      endDate: MeetingService.coerceDateOnly(item.EndDate),
      endTime: MeetingService.coerceTime(item.EndTime),
      timeZone: item.TimeZone,
      description: item.Description,
      format: item.Format,
      platform: item.Platform,
      meetingLink: item.MeetingLink,
      agenda: item.Agenda,
      linkedProject: item.LinkedProject,
      participants: item.Participants ? (Array.isArray(item.Participants) ? item.Participants : [item.Participants]) : []
    }));
  }

  public static async addMeeting(meeting: MeetingPayload): Promise<any> {
    const sp = getSP();
    console.log("MeetingService: Adding meeting", meeting);
    
    const payload: any = { ...meeting };
    // Pass MeetingLink directly as a string, assuming the field is a text column.

    const iar = await sp.web.lists.getByTitle(MeetingService.LIST_NAME).items.add(payload);
    const data = iar.data || iar;
    return { id: (data.Id || data.ID).toString(), ...data };
  }

  public static async updateMeeting(id: number | string, updates: Partial<MeetingPayload>): Promise<void> {
    const sp = getSP();
    console.log(`MeetingService: Updating meeting ${id}`, updates);
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    await sp.web.lists.getByTitle(MeetingService.LIST_NAME).items.getById(numericId).update(updates);
  }

  public static async deleteMeeting(id: number | string): Promise<void> {
    const sp = getSP();
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    await sp.web.lists.getByTitle(MeetingService.LIST_NAME).items.getById(numericId).delete();
  }
}
