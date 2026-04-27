import { getSP } from "../config/pnpconfig";
import { Meeting, MeetingRole } from "../types";

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

  private static toArray<T>(value: T | T[] | null | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private static toLocalIso(dateOnly?: string | null, timeOnly?: string | null): string {
    if (!dateOnly && !timeOnly) return new Date().toISOString();
    const safeDate = dateOnly || new Date().toISOString().slice(0, 10);
    const safeTime = (timeOnly || "00:00").slice(0, 5);
    return `${safeDate}T${safeTime}:00`;
  }

  public static async getMeetings(): Promise<Meeting[]> {
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

    return items.map((item): Meeting => {
      const startDate = MeetingService.coerceDateOnly(item.StartDate);
      const startTime = MeetingService.coerceTime(item.StartTime);
      const endDate = MeetingService.coerceDateOnly(item.EndDate);
      const endTime = MeetingService.coerceTime(item.EndTime);

      const participants = MeetingService.toArray<any>(item.Participants).map((participant) => ({
        user: {
          id: String(participant?.Id ?? ""),
          name: participant?.Title || "Unknown",
          email: ""
        },
        role: "Participant" as MeetingRole
      }));

      const agendaItems = MeetingService.toArray<any>(item.Agenda)
        .filter((agenda) => agenda?.Id != null)
        .map((agenda) => ({
          id: String(agenda.Id),
          text: agenda?.Title || "Agenda",
          subItems: []
        }));

      const linkedProject = item.LinkedProject;

      return {
        id: String(item.Id),
        title: item.Title || "Untitled Meeting",
        type: item.MeetingType || "Internal",
        visibility: item.Visibility || "Personal",
        startDateTime: MeetingService.toLocalIso(startDate, startTime),
        endDateTime: MeetingService.toLocalIso(endDate, endTime),
        participants,
        participantUids: participants.map((p) => p.user.id),
        project: linkedProject
          ? { id: String(linkedProject.Id), name: linkedProject.Title || "Untitled Project" }
          : { id: "", name: "No Project" },
        description: item.Description || "",
        agendaItems,
        status: "Scheduled",
        createdBy: { id: "0", name: "System", email: "" },
        aiProcessed: false,
        category: item.Format || "Online",
        platform: item.Platform || "Microsoft Teams",
        meetingLink: item.MeetingLink || "",
        location: item.Platform || "",
        timeZone: item.TimeZone || "UTC"
      };
    });
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
