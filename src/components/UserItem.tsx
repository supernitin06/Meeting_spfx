import React from 'react';
import { UserData } from '../utils/groupUsers';

interface UserItemProps {
  user: UserData;
}

export function UserItem({ user }: UserItemProps) {
  return (
    <div className="flex items-center py-2 border-b border-[var(--BorderGrey)] last:border-0">
      <img 
        src={user["Item Image"] || "https://picsum.photos/seed/user/28/28"} 
        alt={user.Title} 
        className="avatar-img"
        referrerPolicy="no-referrer"
      />
      <div className="flex flex-col">
        <span className="body-text">{user.Title}</span>
        <span className="meta-text text-[var(--DisabledGrey)]">{user.Email}</span>
      </div>
    </div>
  );
}
