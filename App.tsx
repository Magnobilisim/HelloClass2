
import React, { useEffect } from 'react';
import { AppProvider, useApp } from './services/store';
import { Layout } from './components/Layout';
import { AuthScreen } from './pages/Auth';
import { SocialFeed } from './pages/Social';
import { ExamFlow } from './pages/Exam';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/Admin';
import { ProfileScreen } from './pages/Profile';
import { NotificationScreen } from './pages/Notifications';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ShopScreen } from './pages/Shop';
import { UserRole } from './types';

const MainContent = () => {
  const { user, currentPage, setPage, viewedProfileId } = useApp();

  useEffect(() => {
    if (viewedProfileId) {
        setPage('profile');
    }
  }, [viewedProfileId, setPage]);

  if (!user) {
    return <AuthScreen />;
  }

  let content;
  
  if (user.role === UserRole.ADMIN) {
      switch (currentPage) {
          case 'admin-dash': content = <AdminDashboard />; break;
          case 'social': content = <SocialFeed />; break; 
          default: content = <AdminDashboard />;
      }
  } else if (user.role === UserRole.TEACHER) {
      switch (currentPage) {
          case 'teacher-dash': content = <TeacherDashboard />; break;
          case 'social': content = <SocialFeed />; break;
          case 'exam-setup': content = <ExamFlow />; break; 
          case 'profile': content = <ProfileScreen />; break;
          case 'notifications': content = <NotificationScreen />; break;
          default: content = <TeacherDashboard />;
      }
  } else {
      // Student
      switch (currentPage) {
        case 'social': content = <SocialFeed />; break;
        case 'exam-setup': content = <ExamFlow />; break;
        case 'leaderboard': content = <Leaderboard />; break;
        case 'shop': content = <ShopScreen />; break;
        case 'profile': content = <ProfileScreen />; break;
        case 'notifications': content = <NotificationScreen />; break;
        default: content = <SocialFeed />;
      }
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
