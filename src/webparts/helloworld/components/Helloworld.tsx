import * as React from 'react';
import type { IHelloworldProps } from './IHelloworldProps';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Overview from '../../../pages/Overview';
import MyMeetings from '../../../pages/MyMeetings';
import ActionItems from '../../../pages/ActionItems';
import MeetingProfile from '../../../pages/MeetingProfile';
import Layout from '../../../components/Layout';
import { useStore } from '../../../store/useStore';
import { GroupService } from '../../../services/GroupService';
import '../../../../styles/custom.css';
import '../../../../styles/tailwind.generated.css';

function AppRoutes() {
  const setUsers = useStore((state) => state.setUsers);
  const setActionItems = useStore((state) => state.setActionItems);
  const setProjects = useStore((state) => state.setProjects);
  const setNotifications = useStore((state) => state.setNotifications);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setTeams = useStore((state) => state.setTeams);
  const setGroupedUsers = useStore((state) => state.setGroupedUsers);
  const fetchMeetings = useStore((state) => state.fetchMeetings);
  React.useEffect(() => {
    (async () => {
      try {
        // Load real users/groups from SharePoint (Users + Groups lists)
        const groups = await GroupService.getGroupsAndUsers();
        const flatUsers = groups.flatMap((g) =>
          (g.users || []).map((u) => ({
            ...u,
            team: g.name,
            groupId: g.id,
            groupName: g.name,
          }))
        );

        setUsers(flatUsers);
        setCurrentUser(flatUsers[0] || null);
        setTeams(groups.map((g) => g.name));
        setGroupedUsers(
          groups.reduce<Record<string, typeof flatUsers>>((acc, g) => {
            acc[g.name] = (g.users || []).map((u) => ({
              ...u,
              team: g.name,
              groupId: g.id,
              groupName: g.name,
            }));
            return acc;
          }, {})
        );

        // Keep these empty until you wire them to real lists
        setActionItems([]);
        setProjects([]);
        setNotifications([]);

        // Load real meetings from SharePoint
        await fetchMeetings();
      } catch (e) {
        console.error("Bootstrap load failed:", e);
      }
    })();
  }, [fetchMeetings, setActionItems, setCurrentUser, setGroupedUsers, setNotifications, setProjects, setTeams, setUsers]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="my-meetings" element={<MyMeetings />} />
        <Route path="action-items" element={<ActionItems />} />
        <Route path="meetings/:id" element={<MeetingProfile />} />
        <Route path="overview" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default class Helloworld extends React.Component<IHelloworldProps, {}> {
  public render(): React.ReactElement<IHelloworldProps> {
    return (
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    );
  }
}
