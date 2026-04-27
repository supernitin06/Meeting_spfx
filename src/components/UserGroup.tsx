import React, { useState } from 'react';
import { GroupedData } from '../utils/groupUsers';
import { UserItem } from './UserItem';
import { Search, Plus } from 'lucide-react';

interface UserGroupProps {
  group: GroupedData;
}

export function UserGroup({ group }: UserGroupProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = group.users.filter(user => 
    user.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[var(--White)] border border-[var(--BorderGrey)] rounded-md p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="h2-title text-[var(--SiteBlue)]">{group.Title}</h2>
        <span className="meta-text bg-[var(--BgLightGrey)] px-2 py-1 rounded-full text-[var(--TextBlack)]">
          {group.users.length} Members
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="section-title mr-2">Selected Participants</span>
          {group.users.slice(0, 3).map((user, i) => (
            <img 
              key={user.ID}
              src={user["Item Image"] || `https://picsum.photos/seed/${user.ID}/28/28`} 
              alt={user.Title} 
              className="avatar-img -ml-2 first:ml-0 border-2 border-[var(--White)]"
              style={{ zIndex: 10 - i }}
              referrerPolicy="no-referrer"
            />
          ))}
          {group.users.length > 3 && (
            <div className="avatar-img -ml-2 bg-[var(--BgLightGrey)] flex items-center justify-center text-[10px] font-bold border-2 border-[var(--White)] z-0">
              +{group.users.length - 3}
            </div>
          )}
        </div>
        
        <div className="relative flex items-center">
          <div className="absolute left-3 text-[var(--DisabledGrey)]">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            className="input-text pl-9 pr-10" 
            placeholder="Search participants..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="absolute right-1 bg-[var(--SiteBlue)] text-[var(--White)] rounded-full p-1 hover:opacity-90 transition-opacity">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-60 overflow-y-auto pr-2">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <UserItem key={user.ID} user={user} />
          ))
        ) : (
          <div className="py-4 text-center meta-text text-[var(--DisabledGrey)]">
            No participants found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
