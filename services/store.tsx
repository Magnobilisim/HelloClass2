
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Post, UserRole, ExamConfig, Question, ExamResult, Notification, NotificationType, Comment, MarketplaceExam, SubscriptionPlan, SystemConfig, ActivityLog, ShopItem, SubjectCategory, SubjectTopic, SubjectLevel, ExamHistoryItem } from '../types';
import { MOCK_POSTS, DAILY_LIMIT, MOCK_MARKET_EXAMS, DEFAULT_PREFS, MOCK_TEACHER, MOCK_ADMIN, MOCK_USER, DEFAULT_SYSTEM_CONFIG, MOCK_ACTIVITY_LOGS, INITIAL_SUBJECT_CONFIG, SHOP_ITEMS } from '../constants';
import { generateQuestions, moderateContent } from './geminiService';

interface AppContextType {
  user: User | null;
  language: 'TR' | 'EN';
  setLanguage: (lang: 'TR' | 'EN') => void;
  login: (role: UserRole) => boolean; 
  loginWithCredentials: (email: string) => Promise<boolean>;
  register: (name: string, email: string, school: string, isTeacher: boolean, inviteCode?: string, grade?: string, englishLevel?: string) => Promise<boolean>;
  logout: () => void;
  
  // Navigation
  currentPage: string;
  setPage: (page: string) => void;

  posts: Post[];
  addPost: (content: string, schoolTag: string) => Promise<{ success: boolean; message?: string }>;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  reportPost: (postId: string, reason: string) => void;
  dismissReport: (postId: string) => void;
  deletePost: (postId: string) => void; 
  
  // Exam Logic
  startExam: (config: ExamConfig) => Promise<Question[]>;
  startMarketplaceExam: (exam: MarketplaceExam) => Question[];
  submitExamResult: (result: ExamResult) => void;
  
  // Marketplace & Monetization
  marketplaceExams: MarketplaceExam[];
  buyExam: (exam: MarketplaceExam) => Promise<boolean>;
  createMarketplaceExam: (exam: Omit<MarketplaceExam, 'id' | 'creatorName' | 'sales' | 'rating' | 'creatorId'>) => void;
  updateMarketplaceExam: (id: string, updates: Partial<MarketplaceExam>) => void;
  deleteMarketplaceExam: (id: string) => void;
  showAd: () => Promise<boolean>;
  purchasePremium: (plan: SubscriptionPlan) => void;
  cancelPremium: () => void;

  // Admin & Teacher Logic
  pendingTeachers: User[];
  approveTeacher: (userId: string) => void;
  rejectTeacher: (userId: string) => void;
  
  // Ultimate Admin Logic
  systemConfig: SystemConfig;
  activityLogs: ActivityLog[];
  allUsers: User[]; 
  subjectConfig: SubjectCategory[]; 
  subjects: string[];
  addSubject: (name: string) => void;
  addSubjectCategory: (name: string) => void;
  deleteSubjectCategory: (id: string) => void;
  addSubItem: (subjectId: string, type: 'TOPIC' | 'LEVEL', name: string) => void;
  deleteSubItem: (subjectId: string, type: 'TOPIC' | 'LEVEL', itemId: string) => void;
  updateSystemConfig: (updates: Partial<SystemConfig>) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  deleteUser: (userId: string) => void; 
  deleteMyAccount: () => void; 
  giftPremium: (userId: string) => void;
  resetUserPassword: (userId: string) => void;
  sendPushNotification: (title: string, message: string, target: string) => void;
  adminAddUser: (user: Partial<User>) => void;
  adminUpdateUser: (userId: string, updates: Partial<User>) => void; 
  adminCreateExam: (exam: Partial<MarketplaceExam>) => void;
  factoryReset: () => void; 

  // Notifications & Profile
  notifications: Notification[];
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  updatePreferences: (key: keyof User['preferences'], value: any) => void;
  updateUser: (updates: Partial<User>) => void;
  viewedProfileId: string | null;
  setViewedProfileId: (id: string | null) => void;
  getUserById: (id: string) => User | undefined;

  // Growth & Shop
  buyShopItem: (item: ShopItem) => { success: boolean; error?: 'INSUFFICIENT_FUNDS' | 'ALREADY_OWNED' };
  equipShopItem: (item: ShopItem) => void;
  consumeItem: (itemId: string) => void;
  watchAdForPoints: () => Promise<number>;
  purchasePointsPack: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: NotificationType.LIKE, title: 'Beğeni', message: 'Ayşe gönderini beğendi.', read: false, timestamp: Date.now() - 1000 * 60 * 5 },
  { id: 'n2', type: NotificationType.EXAM, title: 'Yeni Sınav', message: 'Matematik LGS Denemesi yayında!', read: false, timestamp: Date.now() - 1000 * 60 * 60 },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const [user, setUser] = useState<User | null>(() => {
      try {
          const saved = localStorage.getItem('hc_user');
          return saved ? JSON.parse(saved) : null;
      } catch (e) { return null; }
  });

  // LANGUAGE STATE
  const [language, setLanguageState] = useState<'TR' | 'EN'>(() => {
      try {
          return (localStorage.getItem('hc_language') as 'TR' | 'EN') || 'TR';
      } catch { return 'TR'; }
  });

  const setLanguage = (lang: 'TR' | 'EN') => {
      setLanguageState(lang);
      localStorage.setItem('hc_language', lang);
  };

  // GLOBAL NAVIGATION STATE WITH PERSISTENCE
  const [currentPage, setCurrentPage] = useState<string>(() => {
      try {
          return localStorage.getItem('hc_current_page') || 'social';
      } catch { return 'social'; }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
      try {
          const saved = localStorage.getItem('hc_posts');
          return saved ? JSON.parse(saved) : MOCK_POSTS;
      } catch (e) { return MOCK_POSTS; }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
      try {
          const saved = localStorage.getItem('hc_notifications');
          return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
      } catch (e) { return MOCK_NOTIFICATIONS; }
  });

  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);
  
  const [marketplaceExams, setMarketplaceExams] = useState<MarketplaceExam[]>(() => {
      try {
          const saved = localStorage.getItem('hc_market_exams');
          return saved ? JSON.parse(saved) : MOCK_MARKET_EXAMS;
      } catch (e) { return MOCK_MARKET_EXAMS; }
  });

  const [pendingTeachers, setPendingTeachers] = useState<User[]>(() => {
      try {
          const saved = localStorage.getItem('hc_pending_teachers');
          return saved ? JSON.parse(saved) : [{...MOCK_USER, id: 'pending_1', name: 'Ahmet Aday', role: UserRole.TEACHER, isTeacherApproved: false, isBanned: false, email: 'ahmet@teacher.com' }];
      } catch { return [{...MOCK_USER, id: 'pending_1', name: 'Ahmet Aday', role: UserRole.TEACHER, isTeacherApproved: false, isBanned: false, email: 'ahmet@teacher.com' }]; }
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
      try {
          const saved = localStorage.getItem('hc_system_config');
          return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_CONFIG;
      } catch { return DEFAULT_SYSTEM_CONFIG; }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
      try {
          const saved = localStorage.getItem('hc_activity_logs');
          return saved ? JSON.parse(saved) : MOCK_ACTIVITY_LOGS;
      } catch { return MOCK_ACTIVITY_LOGS; }
  });
  
  const [subjectConfig, setSubjectConfig] = useState<SubjectCategory[]>(() => {
      try {
          const saved = localStorage.getItem('hc_subjects');
          return saved ? JSON.parse(saved) : INITIAL_SUBJECT_CONFIG;
      } catch (e) { return INITIAL_SUBJECT_CONFIG; }
  });
  
  const [allUsers, setAllUsers] = useState<User[]>(() => {
      try {
          const saved = localStorage.getItem('hc_all_users');
          return saved ? JSON.parse(saved) : [
              MOCK_USER, MOCK_TEACHER, MOCK_ADMIN,
              {...MOCK_USER, id: 'u2', name: 'Ayşe Demir', email: 'ayse@std.com', inviteCode: 'AYSE22', examHistory: []},
              {...MOCK_USER, id: 'u3', name: 'Mehmet Can', email: 'mehmet@std.com', inviteCode: 'MEMO99', examHistory: []},
              {...MOCK_USER, id: 'u4', name: 'Fatma Yılmaz', email: 'fatma@std.com', isBanned: true, examHistory: []}
          ];
      } catch { 
          return [
              MOCK_USER, MOCK_TEACHER, MOCK_ADMIN,
              {...MOCK_USER, id: 'u2', name: 'Ayşe Demir', email: 'ayse@std.com', inviteCode: 'AYSE22', examHistory: []},
              {...MOCK_USER, id: 'u3', name: 'Mehmet Can', email: 'mehmet@std.com', inviteCode: 'MEMO99', examHistory: []},
              {...MOCK_USER, id: 'u4', name: 'Fatma Yılmaz', email: 'fatma@std.com', isBanned: true, examHistory: []}
          ];
      }
  });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('hc_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('hc_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('hc_market_exams', JSON.stringify(marketplaceExams)); }, [marketplaceExams]);
  useEffect(() => { localStorage.setItem('hc_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('hc_subjects', JSON.stringify(subjectConfig)); }, [subjectConfig]);
  
  // NEW PERSISTENCE
  useEffect(() => { localStorage.setItem('hc_all_users', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('hc_activity_logs', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem('hc_pending_teachers', JSON.stringify(pendingTeachers)); }, [pendingTeachers]);
  useEffect(() => { localStorage.setItem('hc_system_config', JSON.stringify(systemConfig)); }, [systemConfig]);
  
  // Nav Persistence
  useEffect(() => { localStorage.setItem('hc_current_page', currentPage); }, [currentPage]);

  // Handle Profile View Side Effect
  useEffect(() => {
    if (viewedProfileId) {
        setCurrentPage('profile');
    }
  }, [viewedProfileId]);

  // --- SECURITY & REAL-TIME SYNC PATROL ---
  useEffect(() => {
      if (!user) return;

      const dbUser = allUsers.find(u => u.id === user.id);

      if (dbUser) {
          if (dbUser.role !== user.role) {
              console.warn(`SECURITY ALERT: Role mismatch detected. Logging out.`);
              logActivity(user.id, user.name, 'SECURITY_ALERT', 'Rol manipülasyonu girişimi.', 'ERROR');
              logout();
              return;
          }

          if (dbUser.isBanned) {
              alert("Hesabınız erişime kapatılmıştır. (Güvenlik Denetimi)");
              logout();
              return;
          }
          
          const hasPremiumChanged = dbUser.isPremium !== user.isPremium;
          const hasApprovalChanged = dbUser.isTeacherApproved !== user.isTeacherApproved;
          const hasBalanceChanged = dbUser.walletBalance !== user.walletBalance;
          const hasPointsChanged = dbUser.points !== user.points;
          const hasInventoryChanged = JSON.stringify(dbUser.inventory) !== JSON.stringify(user.inventory);
          const hasProfileChanged = dbUser.grade !== user.grade || dbUser.englishLevel !== user.englishLevel;
          const hasHistoryChanged = JSON.stringify(dbUser.examHistory) !== JSON.stringify(user.examHistory);
          const hasDailyLimitChanged = dbUser.dailyExamCount !== user.dailyExamCount;

          if (hasPremiumChanged || hasApprovalChanged || hasBalanceChanged || hasPointsChanged || hasInventoryChanged || hasProfileChanged || hasHistoryChanged || hasDailyLimitChanged) {
             setUser(prev => prev ? {
                 ...prev, 
                 isPremium: dbUser.isPremium,
                 isTeacherApproved: dbUser.isTeacherApproved,
                 walletBalance: dbUser.walletBalance,
                 points: dbUser.points,
                 inventory: dbUser.inventory,
                 grade: dbUser.grade,
                 englishLevel: dbUser.englishLevel,
                 name: dbUser.name,
                 school: dbUser.school,
                 avatar: dbUser.avatar,
                 examHistory: dbUser.examHistory,
                 dailyExamCount: dbUser.dailyExamCount
             } : null);
          }
      } else {
          console.warn('SECURITY ALERT: Ghost session detected (User deleted). Logging out.');
          logout();
          alert("Oturumunuz sonlandırıldı (Hesap silinmiş olabilir).");
      }
  }, [user, allUsers]);

  // Wrapper for setPage to handle side effects if needed
  const setPage = (page: string) => {
      setCurrentPage(page);
  };

  const calculateStreak = (lastLogin: number, currentStreak: number): number => {
      const now = new Date();
      const last = new Date(lastLogin);
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (now.getDate() === last.getDate() && now.getMonth() === last.getMonth() && now.getFullYear() === last.getFullYear()) {
          return currentStreak;
      }
      if (diffDays < 2) {
          return currentStreak + 1;
      }
      return 1;
  };

  const login = (role: UserRole): boolean => {
    let baseUser;
    if (role === UserRole.ADMIN) baseUser = MOCK_ADMIN;
    else if (role === UserRole.TEACHER) baseUser = MOCK_TEACHER;
    else baseUser = MOCK_USER;
    
    const dbUser = allUsers.find(u => u.id === baseUser.id) || baseUser;

    if (dbUser.isBanned) {
        return false;
    }

    const now = new Date();
    const lastLoginDate = new Date(dbUser.lastLogin || 0);
    const isNewDay = now.toDateString() !== lastLoginDate.toDateString();

    const updatedStreak = calculateStreak(dbUser.lastLogin || 0, dbUser.streak || 0);
    
    // Critical Fix: Reset daily limit if it's a new day
    const newDailyCount = isNewDay ? 0 : dbUser.dailyExamCount;

    const updatedUser = { 
        ...dbUser, 
        lastLogin: Date.now(), 
        streak: updatedStreak,
        dailyExamCount: newDailyCount
    };

    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    logActivity(updatedUser.id, updatedUser.name, 'LOGIN', `Kullanıcı giriş yaptı. Streak: ${updatedStreak}`, 'INFO');
    return true;
  };

  const loginWithCredentials = async (email: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (foundUser) {
            if (foundUser.isBanned) {
                alert("Hesabınız yasaklanmıştır.");
                resolve(false);
                return;
            }
            
            const now = new Date();
            const lastLoginDate = new Date(foundUser.lastLogin || 0);
            const isNewDay = now.toDateString() !== lastLoginDate.toDateString();

            const updatedStreak = calculateStreak(foundUser.lastLogin || 0, foundUser.streak || 0);
            
            // Critical Fix: Reset daily limit
            const newDailyCount = isNewDay ? 0 : foundUser.dailyExamCount;

            const userWithStreak = { 
                ...foundUser, 
                lastLogin: Date.now(), 
                streak: updatedStreak,
                dailyExamCount: newDailyCount
            };
            
            setUser(userWithStreak);
            setAllUsers(prev => prev.map(u => u.id === foundUser.id ? userWithStreak : u));

            logActivity(foundUser.id, foundUser.name, 'LOGIN', `E-posta ile giriş. Streak: ${updatedStreak}`, 'INFO');
            resolve(true);
        } else {
            const mockUser: User = {
                ...MOCK_USER,
                id: 'user_' + Date.now(),
                name: email.split('@')[0],
                email: email,
                role: email.includes('teacher') ? UserRole.TEACHER : UserRole.STUDENT,
                isTeacherApproved: email.includes('teacher'),
                streak: 1,
                dailyExamCount: 0, // New user starts with 0
                inviteCode: Math.random().toString(36).substring(7).toUpperCase(),
                inventory: [],
                examHistory: []
            };
            setUser(mockUser);
            setAllUsers(prev => [...prev, mockUser]);
            logActivity(mockUser.id, mockUser.name, 'LOGIN', 'E-posta ile giriş', 'INFO');
            resolve(true);
        }
      }, 800);
    });
  };

  const register = async (name: string, email: string, school: string, isTeacher: boolean, inviteCode?: string, grade?: string, englishLevel?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const exists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
          alert("Bu e-posta adresi zaten kayıtlı.");
          resolve(false);
          return;
      }

      setTimeout(() => {
        let initialPoints = 100;
        let invitedBy = undefined;
        
        if (inviteCode) {
            const referrer = allUsers.find(u => u.inviteCode === inviteCode);
            if (referrer) {
                initialPoints += 250;
                invitedBy = referrer.id;
                setAllUsers(prev => prev.map(u => u.id === referrer.id ? {...u, points: u.points + 500} : u));
                logActivity('system', 'System', 'REFERRAL_BONUS', `${referrer.name} kişisine davet bonusu verildi.`, 'SUCCESS');
            }
        }

        const newUser: User = {
          id: 'user_' + Date.now(),
          name: name,
          email: email,
          role: isTeacher ? UserRole.TEACHER : UserRole.STUDENT,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          isPremium: false,
          school: school,
          grade: grade,
          englishLevel: englishLevel,
          points: initialPoints,
          dailyExamCount: 0,
          preferences: DEFAULT_PREFS,
          walletBalance: 0,
          purchasedExamIds: [],
          isTeacherApproved: !isTeacher, 
          isBanned: false,
          lastLogin: Date.now(),
          deviceInfo: 'Web',
          streak: 1,
          inviteCode: name.substring(0,3).toUpperCase() + Math.floor(Math.random()*1000),
          invitedBy: invitedBy,
          inventory: [],
          examHistory: []
        };

        setAllUsers(prev => [...prev, newUser]);

        if (isTeacher) {
            setPendingTeachers(prev => [...prev, newUser]);
            setUser(newUser);
        } else {
            setUser(newUser);
        }
        logActivity(newUser.id, newUser.name, 'REGISTER', 'Yeni kayıt', 'SUCCESS');
        resolve(true);
      }, 1000);
    });
  };

  const logout = () => {
      if(user) logActivity(user.id, user.name, 'LOGOUT', 'Çıkış yapıldı', 'INFO');
      setUser(null);
      setNotifications([]); 
      localStorage.removeItem('hc_user');
      localStorage.removeItem('hc_current_page'); // Reset Nav
      setViewedProfileId(null);
      setCurrentPage('social');
  };

  const addPost = async (content: string, schoolTag: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Giriş yapmalısınız.' };

    const moderation = await moderateContent(content);
    if (!moderation.safe) {
      logActivity(user.id, user.name, 'POST_BLOCKED', `Uygunsuz içerik: ${moderation.reason}`, 'WARNING');
      return { success: false, message: `İçerik uygunsuz bulundu: ${moderation.reason}` };
    }

    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userFrame: user.equippedFrame,
      content,
      schoolTag,
      likedBy: [],
      comments: [],
      timestamp: Date.now(),
      isReported: false
    };

    setPosts(prev => [newPost, ...prev]);
    setUser(prev => prev ? { ...prev, points: prev.points + 10 } : null);
    return { success: true };
  };

  const toggleLike = (postId: string) => {
    if (!user) return;
    setPosts(prev => prev.map(p => {
        if (p.id === postId) {
            const isLiked = p.likedBy.includes(user.id);
            let newLikedBy;
            if (isLiked) {
                newLikedBy = p.likedBy.filter(id => id !== user.id);
            } else {
                newLikedBy = [...p.likedBy, user.id];
            }
            return { ...p, likedBy: newLikedBy };
        }
        return p;
    }));
  };

  const addComment = (postId: string, text: string) => {
    if (!user) return;
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: text,
      timestamp: Date.now(),
      userFrame: user.equippedFrame
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  };

  const deleteComment = (postId: string, commentId: string) => {
      setPosts(prev => prev.map(p => {
          if (p.id === postId) {
              return { ...p, comments: p.comments.filter(c => c.id !== commentId) };
          }
          return p;
      }));
  };

  const reportPost = (postId: string, reason: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReported: true, reportReason: reason } : p));
    if(user) logActivity(user.id, user.name, 'REPORT_POST', `Gönderi şikayet edildi: ${postId}. Sebep: ${reason}`, 'WARNING');
  };

  const dismissReport = (postId: string) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReported: false, reportReason: undefined } : p));
      logActivity('admin', 'Admin', 'DISMISS_REPORT', `Şikayet reddedildi: ${postId}`, 'INFO');
  };

  const deletePost = (postId: string) => {
    // CRITICAL: Prevent Point Farming
    if (user) {
        const post = posts.find(p => p.id === postId);
        if (post && post.userId === user.id) {
            // Deduct points if deleting own post
            setUser(prev => prev ? { ...prev, points: Math.max(0, prev.points - 10) } : null);
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, points: Math.max(0, u.points - 10) } : u));
        }
    }
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const startExam = async (config: ExamConfig): Promise<Question[]> => {
    if (!user) throw new Error("User not found");
    if (!user.isPremium && user.dailyExamCount >= systemConfig.dailyFreeLimit) {
       throw new Error("DAILY_LIMIT_REACHED");
    }
    
    const questions = await generateQuestions(config.subject, config.questionCount, 3, config.topic, config.level);
    
    setUser(prev => {
        if (!prev) return null;
        return {
            ...prev,
            dailyExamCount: prev.dailyExamCount + 1
        };
    });

    return questions;
  };

  const startMarketplaceExam = (exam: MarketplaceExam) => {
      return exam.questions;
  };

  const submitExamResult = (result: ExamResult) => {
    if (!user) return;
    const pointsEarned = result.correctCount * 10;
    
    const historyItem: ExamHistoryItem = {
        id: `h_${Date.now()}`,
        title: result.questions[0].subject + ' Sınavı',
        score: result.score,
        date: new Date().toLocaleDateString('tr-TR'),
        subject: result.questions[0].subject,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions
    };

    const newUserState = {
        ...user,
        points: user.points + pointsEarned,
        examHistory: [historyItem, ...(user.examHistory || [])]
    };

    setUser(newUserState);
    setAllUsers(prev => prev.map(u => u.id === user.id ? newUserState : u));
    
    logActivity(user.id, user.name, 'EXAM_COMPLETE', `Sınav tamamlandı. Puan: ${result.score}`, 'INFO');
  };

  const createMarketplaceExam = (examData: Omit<MarketplaceExam, 'id' | 'creatorName' | 'sales' | 'rating' | 'creatorId'>) => {
      if (!user || user.role !== UserRole.TEACHER) return;
      
      const newExam: MarketplaceExam = {
          ...examData,
          id: `market_${Date.now()}`,
          creatorId: user.id,
          creatorName: user.name,
          sales: 0,
          rating: 0
      };
      setMarketplaceExams(prev => [newExam, ...prev]);
      logActivity(user.id, user.name, 'CREATE_EXAM', `Yeni sınav oluşturuldu: ${examData.title}`, 'SUCCESS');
  };

  const updateMarketplaceExam = (id: string, updates: Partial<MarketplaceExam>) => {
      if (!user) return;
      setMarketplaceExams(prev => prev.map(e => {
          if (e.id === id) {
              if (e.creatorId === user.id || user.role === UserRole.ADMIN) {
                  return { ...e, ...updates };
              }
          }
          return e;
      }));
  };

  const deleteMarketplaceExam = (id: string) => {
      if (!user) return;
      const exam = marketplaceExams.find(e => e.id === id);
      if (!exam) return;

      if (exam.creatorId !== user.id && user.role !== UserRole.ADMIN) {
          alert("Bu sınavı silme yetkiniz yok.");
          return;
      }

      setMarketplaceExams(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true, status: 'ARCHIVED' } : e));
  };

  const buyExam = async (exam: MarketplaceExam): Promise<boolean> => {
      if(!user) return false;
      
      return new Promise(resolve => {
          setTimeout(() => {
              const updatedPurchases = [...(user.purchasedExamIds || []), exam.id];
              setUser(prev => prev ? {...prev, purchasedExamIds: updatedPurchases} : null);
              
              setMarketplaceExams(prev => prev.map(e => e.id === exam.id ? {...e, sales: e.sales + 1} : e));
              
              if (exam.price > 0) {
                  setAllUsers(prev => prev.map(u => {
                      if (u.id === exam.creatorId) {
                          const currentBalance = u.walletBalance || 0;
                          const newBalance = parseFloat((currentBalance + exam.price).toFixed(2));
                          return { ...u, walletBalance: newBalance };
                      }
                      return u;
                  }));
                  
                  if (user.id === exam.creatorId) {
                      const currentBalance = user.walletBalance || 0;
                      const newBalance = parseFloat((currentBalance + exam.price).toFixed(2));
                      setUser(prev => prev ? { ...prev, walletBalance: newBalance } : null);
                  }
              }
              
              logActivity(user.id, user.name, 'PURCHASE_EXAM', `Sınav satın alındı: ${exam.title}`, 'SUCCESS');
              resolve(true);
          }, 1500);
      });
  };

  const showAd = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 3000);
    });
  };

  const purchasePremium = (plan: SubscriptionPlan) => {
    if (user) {
        const updatedUser = { ...user, isPremium: true };
        setUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
        logActivity(user.id, user.name, 'PURCHASE_PREMIUM', `Premium plan: ${plan}`, 'SUCCESS');
    }
  };

  const cancelPremium = () => {
    if (user) {
        const updatedUser = { ...user, isPremium: false };
        setUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === user.id ? {...u, isPremium: false} : u));
    }
  }

  const buyShopItem = (item: ShopItem): { success: boolean; error?: 'INSUFFICIENT_FUNDS' | 'ALREADY_OWNED' } => {
      if(!user) return { success: false };
      
      if(item.type === 'FRAME' && user.inventory.includes(item.id)) {
          return { success: false, error: 'ALREADY_OWNED' };
      }

      if(user.points < item.price) {
          return { success: false, error: 'INSUFFICIENT_FUNDS' };
      }

      const newUserState = {
          ...user,
          points: user.points - item.price,
          inventory: [...user.inventory, item.id]
      };

      setUser(newUserState);
      setAllUsers(prev => prev.map(u => u.id === user.id ? newUserState : u));
      
      logActivity(user.id, user.name, 'SHOP_BUY', `${item.name} satın alındı.`, 'SUCCESS');
      return { success: true };
  };

  const equipShopItem = (item: ShopItem) => {
      if(!user) return;
      
      if (!user.inventory.includes(item.id)) {
          alert("Bu eşyaya sahip değilsiniz.");
          return;
      }

      if(item.type === 'FRAME') {
          const newUserState = { ...user, equippedFrame: item.id };
          setUser(newUserState);
          setAllUsers(prev => prev.map(u => u.id === user.id ? newUserState : u));
          
          // Retroactive Frame Sync: Update past posts/comments
          setPosts(prev => prev.map(p => {
              let newPost = { ...p };
              if (p.userId === user.id) {
                  newPost = { ...newPost, userFrame: item.id };
              }
              newPost.comments = p.comments.map(c => {
                  if (c.userId === user.id) {
                      return { ...c, userFrame: item.id };
                  }
                  return c;
              });
              return newPost;
          }));
      }
  };

  const consumeItem = (itemId: string) => {
      if(!user) return;
      const index = user.inventory.indexOf(itemId);
      if (index > -1) {
          const newInventory = [...user.inventory];
          newInventory.splice(index, 1);
          
          const newUserState = { ...user, inventory: newInventory };
          setUser(newUserState);
          setAllUsers(prev => prev.map(u => u.id === user.id ? newUserState : u));
          logActivity(user.id, user.name, 'CONSUME_ITEM', `${itemId} kullanıldı.`, 'INFO');
      }
  };

  const watchAdForPoints = async (): Promise<number> => {
      if (!user) return 0;
      return new Promise(resolve => {
          setTimeout(() => {
              const earned = 50;
              const newUserState = { ...user, points: user.points + earned };
              setUser(newUserState);
              setAllUsers(prev => prev.map(u => u.id === user.id ? newUserState : u));
              logActivity(user.id, user.name, 'AD_WATCH', 'Reklam izleyerek puan kazanıldı', 'SUCCESS');
              resolve(earned);
          }, 3000); 
      });
  };

  const purchasePointsPack = async (): Promise<boolean> => {
      if (!user) return false;
      return new Promise(resolve => {
          setTimeout(() => {
              const earned = 1000;
              const newUserState = { ...user, points: user.points + earned };
              setUser(newUserState);
              setAllUsers(prev => prev.map(u => u.id === user.id ? newUserState : u));
              logActivity(user.id, user.name, 'BUY_POINTS', 'Puan paketi satın alındı', 'SUCCESS');
              resolve(true);
          }, 1500);
      });
  };

  const logActivity = (userId: string, userName: string, action: string, details: string, type: ActivityLog['type']) => {
      const newLog: ActivityLog = {
          id: `log_${Date.now()}`,
          userId, userName, action, details, timestamp: Date.now(), type
      };
      setActivityLogs(prev => [newLog, ...prev]);
  };

  const approveTeacher = (userId: string) => {
      setPendingTeachers(prev => prev.filter(u => u.id !== userId));
      setAllUsers(prev => prev.map(u => u.id === userId ? {...u, isTeacherApproved: true} : u));
      
      const newNotif: Notification = {
          id: `sys_${Date.now()}`,
          type: NotificationType.SYSTEM,
          title: 'Başvurunuz Onaylandı!',
          message: 'Eğitmen başvurunuz kabul edildi. Artık kendi sınavlarınızı oluşturup satabilirsiniz.',
          read: false,
          timestamp: Date.now()
      };
      setNotifications(prev => [newNotif, ...prev]);
      
      logActivity('admin', 'Admin', 'APPROVE_TEACHER', `Öğretmen onaylandı: ${userId}`, 'SUCCESS');
  };

  const rejectTeacher = (userId: string) => {
      setPendingTeachers(prev => prev.filter(u => u.id !== userId));
      deleteUser(userId); // Fix Rejection Limbo: Fully delete user so they can try again
      logActivity('admin', 'Admin', 'REJECT_TEACHER', `Öğretmen reddedildi ve silindi: ${userId}`, 'WARNING');
  };

  const updateSystemConfig = (updates: Partial<SystemConfig>) => {
      setSystemConfig(prev => ({ ...prev, ...updates }));
      logActivity('admin', 'Admin', 'UPDATE_CONFIG', 'Sistem ayarları güncellendi', 'WARNING');
  };

  const addSubjectCategory = (name: string) => {
      if (!name.trim()) return;
      setSubjectConfig(prev => [...prev, { id: `sub_${Date.now()}`, name: name.trim(), topics: [], levels: [] }]);
      logActivity('admin', 'Admin', 'ADD_SUBJECT', `Yeni ders eklendi: ${name}`, 'SUCCESS');
  };

  const deleteSubjectCategory = (id: string) => {
      const subject = subjectConfig.find(s => s.id === id);
      
      // CRITICAL INTEGRITY CHECK
      if (subject) {
          const hasActiveExams = marketplaceExams.some(e => e.subject === subject.name && !e.isDeleted);
          if (hasActiveExams) {
              alert(`DİKKAT: "${subject.name}" dersine ait aktif sınavlar bulunmaktadır. Önce bu sınavları silmeli veya arşivlemelisiniz.`);
              return;
          }
      }

      setSubjectConfig(prev => prev.filter(s => s.id !== id));
      logActivity('admin', 'Admin', 'DELETE_SUBJECT', `Ders silindi: ${id}`, 'WARNING');
  };

  const addSubItem = (subjectId: string, type: 'TOPIC' | 'LEVEL', name: string) => {
      if (!name.trim()) return;
      setSubjectConfig(prev => prev.map(sub => {
          if (sub.id === subjectId) {
              if (type === 'TOPIC') {
                  return { ...sub, topics: [...sub.topics, { id: `t_${Date.now()}`, name: name.trim() }] };
              } else {
                  return { ...sub, levels: [...sub.levels, { id: `l_${Date.now()}`, name: name.trim() }] };
              }
          }
          return sub;
      }));
  };

  const deleteSubItem = (subjectId: string, type: 'TOPIC' | 'LEVEL', itemId: string) => {
      setSubjectConfig(prev => prev.map(sub => {
          if (sub.id === subjectId) {
              if (type === 'TOPIC') {
                  return { ...sub, topics: sub.topics.filter(t => t.id !== itemId) };
              } else {
                  return { ...sub, levels: sub.levels.filter(l => l.id !== itemId) };
              }
          }
          return sub;
      }));
  };

  const banUser = (userId: string) => {
      setAllUsers(prev => prev.map(u => u.id === userId ? {...u, isBanned: true} : u));
      logActivity('admin', 'Admin', 'BAN_USER', `Kullanıcı yasaklandı: ${userId}`, 'ERROR');
  };

  const unbanUser = (userId: string) => {
      setAllUsers(prev => prev.map(u => u.id === userId ? {...u, isBanned: false} : u));
      logActivity('admin', 'Admin', 'UNBAN_USER', `Kullanıcı yasağı kalktı: ${userId}`, 'INFO');
  };

  const deleteUser = (userId: string) => {
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setPendingTeachers(prev => prev.filter(u => u.id !== userId));
      logActivity('admin', 'Admin', 'DELETE_USER', `Kullanıcı silindi: ${userId}`, 'WARNING');
  };

  const deleteMyAccount = () => {
      if (user) {
          if (window.confirm("Hesabınızı kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. Emin misiniz?")) {
              deleteUser(user.id);
              logout();
          }
      }
  };

  const giftPremium = (userId: string) => {
      setAllUsers(prev => prev.map(u => u.id === userId ? {...u, isPremium: true} : u));
      logActivity('admin', 'Admin', 'GIFT_PREMIUM', `Premium hediye edildi: ${userId}`, 'SUCCESS');
  };

  const resetUserPassword = (userId: string) => {
      console.log(`Reset password email sent to ${userId}`);
      logActivity('admin', 'Admin', 'RESET_PASSWORD', `Şifre sıfırlama gönderildi: ${userId}`, 'INFO');
  };

  const sendPushNotification = (title: string, message: string, target: string) => {
      const newNotif: Notification = {
          id: `push_${Date.now()}`,
          type: NotificationType.SYSTEM,
          title: title,
          message: message,
          read: false,
          timestamp: Date.now()
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      logActivity('admin', 'Admin', 'PUSH_NOTIFICATION', `Bildirim gönderildi: ${title}`, 'INFO');
  };

  const adminAddUser = (newUser: Partial<User>) => {
      const userToAdd: User = {
          id: `u_${Date.now()}`,
          name: newUser.name || 'Yeni Kullanıcı',
          email: newUser.email || 'new@user.com',
          role: newUser.role || UserRole.STUDENT,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name || 'new'}`,
          isPremium: newUser.isPremium || false,
          school: newUser.school || 'Admin Kayıt',
          grade: newUser.grade,
          englishLevel: newUser.englishLevel,
          points: 0,
          dailyExamCount: 0,
          preferences: DEFAULT_PREFS,
          walletBalance: 0,
          isTeacherApproved: newUser.role === UserRole.TEACHER, 
          isBanned: false,
          lastLogin: Date.now(),
          streak: 0,
          inviteCode: 'NEW' + Math.floor(Math.random()*10000),
          inventory: [],
          examHistory: []
      };
      setAllUsers(prev => [...prev, userToAdd]);
      logActivity('admin', 'Admin', 'ADD_USER', `Kullanıcı oluşturuldu: ${userToAdd.name}`, 'SUCCESS');
  };

  const adminUpdateUser = (userId: string, updates: Partial<User>) => {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      
      // Deep Sync: Update posts AND comments
      // If name or avatar changes, reflect in historical posts
      if (updates.name || updates.avatar) {
          setPosts(prev => prev.map(p => {
              let newPost = { ...p };
              if (p.userId === userId) {
                  newPost = { 
                      ...newPost, 
                      userName: updates.name || p.userName, 
                      userAvatar: updates.avatar || p.userAvatar 
                  };
              }
              newPost.comments = p.comments.map(c => {
                  if (c.userId === userId) {
                      return { ...c, userName: updates.name || c.userName };
                  }
                  return c;
              });
              return newPost;
          }));
      }

      // If updating role to TEACHER, ensure isTeacherApproved matches logic or update it
      if (updates.role === UserRole.TEACHER) {
           // Can optionally set isTeacherApproved: true
      }

      // If admin updates themselves, update local user state
      if (user && user.id === userId) {
          setUser(prev => prev ? { ...prev, ...updates } : null);
      }
      logActivity('admin', 'Admin', 'UPDATE_USER', `Kullanıcı güncellendi: ${userId}`, 'WARNING');
  };

  const adminCreateExam = (exam: Partial<MarketplaceExam>) => {
      const newExam: MarketplaceExam = {
          id: `market_${Date.now()}`,
          title: exam.title || 'Yeni Sınav',
          description: exam.description || 'Admin tarafından oluşturuldu',
          subject: exam.subject || 'Genel',
          creatorId: MOCK_ADMIN.id,
          creatorName: 'Admin',
          price: 0,
          questionCount: 5,
          duration: 10,
          rating: 0,
          sales: 0,
          status: 'DRAFT',
          questions: [],
          ...exam
      };
      setMarketplaceExams(prev => [newExam, ...prev]);
      logActivity('admin', 'Admin', 'ADD_EXAM', `Sınav oluşturuldu: ${newExam.title}`, 'SUCCESS');
  };

  const factoryReset = () => {
      localStorage.clear();
      setAllUsers([MOCK_USER, MOCK_TEACHER, MOCK_ADMIN]);
      setPosts(MOCK_POSTS);
      setMarketplaceExams(MOCK_MARKET_EXAMS);
      setNotifications(MOCK_NOTIFICATIONS);
      setSystemConfig(DEFAULT_SYSTEM_CONFIG);
      setSubjectConfig(INITIAL_SUBJECT_CONFIG);
      setUser(null);
      alert("Sistem fabrika ayarlarına döndürüldü. Sayfa yenileniyor...");
      window.location.reload();
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updatePreferences = (key: keyof User['preferences'], value: any) => {
    if (user) {
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, [key]: value }
      };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    }
  };

  const updateUser = (updates: Partial<User>) => {
     if(user) {
       const updatedUser = {...user, ...updates};
       setUser(updatedUser);
       setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
       setPendingTeachers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
       
       // Deep Sync: Update posts AND comments
       setPosts(prev => prev.map(p => {
           let newPost = { ...p };
           if (p.userId === user.id) {
               newPost = { ...newPost, userName: updatedUser.name, userAvatar: updatedUser.avatar };
           }
           newPost.comments = p.comments.map(c => {
               if (c.userId === user.id) {
                   return { ...c, userName: updatedUser.name };
               }
               return c;
           });
           return newPost;
       }));
     }
  };

  const getUserById = (id: string): User | undefined => {
    if (user && user.id === id) return user;
    const foundUser = allUsers.find(u => u.id === id);
    if (foundUser) return foundUser;

    return {
        ...MOCK_USER,
        id: 'deleted_user',
        name: 'Silinmiş Kullanıcı',
        avatar: 'https://ui-avatars.com/api/?name=X&background=e5e7eb&color=6b7280',
        school: 'Bilinmiyor',
        role: UserRole.STUDENT
    };
  };

  return (
    <AppContext.Provider value={{ 
      user, language, setLanguage, login, loginWithCredentials, register, logout, 
      currentPage, setPage,
      posts, addPost, toggleLike, addComment, deleteComment, reportPost, dismissReport, deletePost,
      startExam, startMarketplaceExam, submitExamResult,
      marketplaceExams, buyExam, createMarketplaceExam, updateMarketplaceExam, deleteMarketplaceExam,
      showAd, purchasePremium, cancelPremium,
      pendingTeachers, approveTeacher, rejectTeacher,
      notifications, markAllNotificationsRead, markNotificationRead, updatePreferences, updateUser,
      viewedProfileId, setViewedProfileId, getUserById,
      buyShopItem, equipShopItem, consumeItem, watchAdForPoints, purchasePointsPack,
      systemConfig, activityLogs, allUsers, 
      subjects: subjectConfig.map(s => s.name),
      subjectConfig,
      addSubjectCategory, addSubItem, deleteSubItem, deleteSubjectCategory,
      addSubject: addSubjectCategory,
      updateSystemConfig, banUser, unbanUser, deleteUser, deleteMyAccount, giftPremium, resetUserPassword, sendPushNotification, adminAddUser, adminUpdateUser, adminCreateExam, factoryReset
    }}>
      {children}
    </AppContext.Provider>
  );
};
