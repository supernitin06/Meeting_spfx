import { getSP } from "../config/pnpconfig";

export interface Project {
    id: string;
    title: string;
}

export class ProjectService {
    public static async getProjects(): Promise<Project[]> {
        const sp = getSP();
        const items = await sp.web.lists.getByTitle("Projects").items.select("Id", "Title")();
        return items.map((item: any) => ({
            id: item.Id.toString(),
            title: item.Title
        }));
    }
}   
