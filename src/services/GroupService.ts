import { getSP } from "../config/pnpconfig";
import { Group } from "../types";

const LIST_NAME = "Groups";

export class GroupService {
    public static async getGroups(): Promise<Group[]> {
        const sp = getSP();
        const items = await sp.web.lists.getByTitle(LIST_NAME).items
            .select("Id", "Title", "Department", "CreatedBy")();

        return items.map(item => ({
            id: item.Id.toString(),
            name: item.Title,
            department: item.Department,
            createdBy: item.CreatedBy
        }));
    }

    public static async addGroup(group: Omit<Group, "id">): Promise<Group> {
        const sp = getSP();
        console.log("GroupService: Sending add request to SharePoint", group);

        try {
            const iar = await sp.web.lists.getByTitle(LIST_NAME).items.add({
                Title: group.name,
                Department: group.department,
                CreatedBy: group.createdBy
            });

            console.log("GroupService: SharePoint response received", iar);

            // Handle both PnPjs v2 (iar.data) and potential variations
            const data = iar.data || iar;

            if (!data || (!data.Id && !data.ID)) {
                throw new Error("SharePoint response missing ID");
            }

            return {
                id: (data.Id || data.ID).toString(),
                name: data.Title || group.name,
                department: data.Department || group.department,
                createdBy: data.CreatedBy || group.createdBy
            };
        } catch (error) {
            console.error("GroupService: Error in addGroup", error);
            throw error;
        }
    }

    public static async updateGroup(group: Group): Promise<void> {
        const sp = getSP();
        await sp.web.lists.getByTitle(LIST_NAME).items.getById(parseInt(group.id)).update({
            Title: group.name,
            Department: group.department,
            CreatedBy: group.createdBy
        });
    }

    public static async deleteGroup(id: string): Promise<void> {
        const sp = getSP();
        await sp.web.lists.getByTitle(LIST_NAME).items.getById(parseInt(id)).delete();
    }

    public static async getGroupsAndUsers(): Promise<Group[]> {
        const sp = getSP();

        const GROUP_LIST = "Groups";
        const USER_LIST = "Users";

        // 1️⃣ Fetch groups
        const groupItems = await sp.web.lists
            .getByTitle(GROUP_LIST)
            .items
            .select("Id", "Title", "Department", "CreatedBy")();

        // 2️⃣ Fetch users with group lookup
        const userItems = await sp.web.lists
            .getByTitle(USER_LIST)
            .items
            .select("Id", "Title", "Email", "Group/Id")
            .expand("Group")();

        // 3️⃣ Combine (manual join)
        const result = groupItems.map(group => {
            const users = userItems
                .filter(user => user.Group?.Id === group.Id)
                .map(user => ({
                    id: user.Id.toString(),
                    name: user.Title,
                    email: user.Email
                }));

            return {
                id: group.Id.toString(),
                name: group.Title,
                department: group.Department,
                createdBy: group.CreatedBy,
                users
            };
        });

        return result;
    }


}