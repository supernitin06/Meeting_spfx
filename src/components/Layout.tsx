import React from 'react';
import { Outlet } from 'react-router-dom';
 import MeetingModal from './MeetingModal';
 import DocumentPreview from './DocumentPreview';
 
 export default function Layout() {
   return (
     <div className="min-h-[calc(100vh-64px)] flex flex-col bg-[#F8FAFC] text-[#1E293B] font-sans">
       <main className="flex-1 flex flex-col min-w-0 relative">
         <div className="flex-1 p-6 md:p-8">
           <div className="max-w-7xl mx-auto">
             <Outlet />
           </div>
         </div>
       </main>
       
       <MeetingModal />
       <DocumentPreview />
     </div>
   );
 }

