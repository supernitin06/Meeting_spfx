import { getSP } from "../config/pnpconfig";
import { User } from "../types";

const LIST_NAME = "Users";

type UserPayload = {
    Title: string;
    Email: string;
    Role?: string;
    GroupId?: number;
};

type UserListItem = {
    Id: number;
    Title: string;
    Email: string;
    Role?: string;
    Group?: {
        Id?: number;
        Title?: string;
    };
};

export class UserService {
    public static async getUsers(): Promise<User[]> {
        const sp = getSP();

        const items = await sp.web.lists
            .getByTitle(LIST_NAME)
            .items
            .select("Id", "Title", "Email", "Role", "Group/Id", "Group/Title" , "Group/CreatedBy", "Group/Department") 
            .expand("Group")();

        return items.map(item => ({
            id: item.Id.toString(),
            name: item.Title,
            email: item.Email,
            role: item.Role,
            createdby: item.Group?.CreatedBy,
            department: item.Group?.Department,
            avatar: undefined,
            groupId: item.Group?.Id?.toString(),
            groupName: item.Group?.Title || 'None'
        }));
    }

    public static async addUser(user: Omit<User, "id">): Promise<User> {
        const sp = getSP();
        const payload: UserPayload = {
            Title: user.name,
            Email: user.email,
            Role: user.role
        };

        if (user.groupId) {
            payload.GroupId = Number(user.groupId);
        }

        const addResult = await sp.web.lists.getByTitle(LIST_NAME).items.add(payload);

        // PnP add result shape can vary; prefer reading back the created item safely.
        let createdItem: UserListItem | undefined = undefined;
        if (addResult.item) {
            createdItem = await addResult.item
                .select("Id", "Title", "Email", "Role", "Group/Id", "Group/Title")
                .expand("Group")();
        } else if (addResult.data?.Id) {
            createdItem = await sp.web.lists.getByTitle(LIST_NAME).items
                .getById(addResult.data.Id)
                .select("Id", "Title", "Email", "Role", "Group/Id", "Group/Title")
                .expand("Group")();
        }

        return {
            id: createdItem?.Id?.toString() ?? `temp-${Date.now()}`,
            name: createdItem?.Title ?? user.name,
            email: createdItem?.Email ?? user.email,
            role: createdItem?.Role ?? user.role,
            avatar: user.avatar,
            groupId: createdItem?.Group?.Id?.toString() ?? user.groupId,
            groupName: createdItem?.Group?.Title ?? user.groupName
        };
    }

    public static async updateUser(user: User): Promise<void> {
        const sp = getSP();
        const payload: UserPayload = {
            Title: user.name,
            Email: user.email,
            Role: user.role,
        };

        if (user.groupId) {
            payload.GroupId = Number(user.groupId);
        }

        await sp.web.lists.getByTitle(LIST_NAME).items.getById(parseInt(user.id)).update(payload);
    }

    public static async deleteUser(id: string): Promise<void> {
        const sp = getSP();
        await sp.web.lists.getByTitle(LIST_NAME).items.getById(parseInt(id)).delete();
    }
}
