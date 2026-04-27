import { getSP } from "../config/pnpconfig";

export interface AgendaPayload {
  Title: string;
  Owner?: string;
  DocumentUrl?: string;
  TaskLink?: string;
  Priority?: string;
  Status?: string;
}

export class AgendaService {
  private static LIST_NAME = "Agenda";

  public static async getAgendaByTitle(title: string): Promise<number | null> {
    const sp = getSP();
    const items = await sp.web.lists.getByTitle(this.LIST_NAME).items.filter(`Title eq '${title}'`).select("Id")();
    if (items.length > 0) {
      return items[0].Id;
    }
    return null;
  }

  public static async addAgenda(agenda: AgendaPayload): Promise<number> {
    const sp = getSP();
    console.log("AgendaService: Adding agenda", agenda);
    
    // Just pass the payload directly, assume fields are text or SP handles it
    const payload: any = { ...agenda };

    const iar = await sp.web.lists.getByTitle(this.LIST_NAME).items.add(payload);
    const data = iar.data || iar;
    return data.Id || data.ID;
  }

  public static async updateAgenda(id: number, agenda: Partial<AgendaPayload>): Promise<void> {
    const sp = getSP();
    console.log("AgendaService: Updating agenda", id, agenda);
    const payload: any = { ...agenda };
    await sp.web.lists.getByTitle(this.LIST_NAME).items.getById(id).update(payload);
  }
}
