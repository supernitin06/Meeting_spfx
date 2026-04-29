import React from 'react';

interface UserPopupProps {
  users: string[];
  onClose: () => void;
  position: { top: number; left: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function UserPopup({ users, onClose, position, onMouseEnter, onMouseLeave }: UserPopupProps) {
  return (
    <div 
      className="position-fixed bg-white border rounded z shadow-lg p-2" 
      style={{ top: position.top + 20, left: position.left, zIndex: 1200, minWidth: '150px' }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {users.map((user, idx) => (
        <div key={idx} className="d-flex align-items-center gap-2 py-1">
          <div className="rounded-circle bg-secondary" style={{ width: '20px', height: '20px' }}>
            <img src={`https://picsum.photos/seed/${user}/20/20`} alt="avatar" className="rounded-circle" />
          </div>
          <span style={{ fontSize: '13px' }}>{user}</span>
        </div>
      ))}
    </div>
  );
}
