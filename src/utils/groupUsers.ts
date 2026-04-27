export interface UserData {
  ID: string;
  Title: string;
  Modified: string;
  Approver: string;
  "Modified By": string;
  SmartTime: string;
  Group: string;
  Team: string;
  Company: string;
  UserGroup: string;
  Suffix: string;
  IsActive: string;
  technicalGroup: string;
  TeamLeader: string;
  AssingedToUser: string;
  Email: string;
  Role: string;
  ItemType: string;
  SortOrder: string;
  TimeCategory: string;
  "Item Image": string;
  "Created By": string;
  Created: string;
  IsShowReportPage: string;
  CategoriesItemsJson: string;
  DraftCategory: string;
  IsApprovalMail: string;
  ItemCover: string;
  isSmartTime: string;
  OMTStatus: string;
  OMTStatus_Test: string;
  FolderId: string;
}

export interface GroupedData extends UserData {
  users: UserData[];
}

export function groupUsersByParent(data: UserData[]): GroupedData[] {
  if (!Array.isArray(data)) return [];

  // 1. Find all parent groups
  const groups = data.filter(item => item.ItemType === "Group");
  
  // 2. Find all active users (ignoring inactive ones)
  const activeUsers = data.filter(item => 
    item.ItemType === "User" && item.IsActive === "True"
  );
  
  // 3. Map users to groups where UserGroup matches the group's Title
  const groupedData = groups.map(group => {
    return {
      ...group,
      users: activeUsers.filter(user => user.UserGroup === group.Title)
    };
  });
  
  return groupedData;
}
