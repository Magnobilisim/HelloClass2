
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
}

export interface NotificationPreferences {
  mentions: boolean;
  schoolNews: boolean;
  examReminders: boolean;
  subscribedTopics: string[];
}

export interface ExamHistoryItem {
  id: string;
  title: string;
  score: number;
  date: string;
  subject: string;
  correctCount: number;
  totalQuestions: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isPremium: boolean;
  school: string;
  grade?: string; // e.g., "5. Sınıf", "8. Sınıf"
  englishLevel?: string; // e.g., "A1", "B2"
  points: number;
  dailyExamCount: number; // For freemium limit
  preferences: NotificationPreferences;
  // Marketplace Fields
  walletBalance?: number;
  purchasedExamIds?: string[];
  isTeacherApproved?: boolean;
  // Admin CRM Fields
  isBanned?: boolean;
  lastLogin?: number;
  deviceInfo?: string; // 'iOS', 'Android', 'Web'
  // Growth & Gamification
  streak: number;
  lastStreakUpdate?: number;
  inviteCode: string;
  invitedBy?: string;
  inventory: string[]; // Array of Item IDs
  equippedFrame?: string; // Item ID of active frame
  examHistory: ExamHistoryItem[]; // Real exam history
}

export interface ShopItem {
  id: string;
  type: 'FRAME' | 'JOKER' | 'THEME';
  name: string;
  description: string;
  price: number;
  imageUrl: string; // CSS class or Image URL
}

export interface Question {
  id: string;
  subject: string;
  topic?: string; // Specific topic
  level?: string; // Specific level/grade
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number; // 1-5
  imageUrl?: string;
  optionImages?: string[]; // Array of image URLs corresponding to options
  explanationImageUrl?: string; // Image for the solution explanation
}

export interface ExamConfig {
  subject: string;
  topic?: string;
  level?: string;
  questionCount: number; // 5-50
  durationMinutes: number; // 1-120
}

export interface MarketplaceExam {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic?: string; // Added for hierarchy
  level?: string; // Added for hierarchy
  creatorId: string;
  creatorName: string;
  price: number; // 0 for free
  questionCount: number;
  duration: number;
  rating: number;
  sales: number;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'ARCHIVED';
  questions: Question[];
  isDeleted?: boolean;
}

export enum SubscriptionPlan {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIANNUAL = 'BIANNUAL',
  YEARLY = 'YEARLY'
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  userFrame?: string; // Frame ID at the time of comment
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userFrame?: string; // Frame ID at the time of posting
  content: string;
  schoolTag: string; // School name or topic
  likedBy: string[]; // Array of User IDs who liked the post
  comments: Comment[];
  timestamp: number;
  isReported: boolean;
  reportReason?: string; // Why it was reported
}

export enum NotificationType {
  LIKE = 'LIKE',
  SYSTEM = 'SYSTEM',
  MENTION = 'MENTION',
  EXAM = 'EXAM',
  SALE = 'SALE'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  actionUrl?: string; // Internal route id
}

export interface ExamResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  questions: Question[];
  userAnswers: number[]; // Index of selected answers
}

export interface SystemConfig {
  maintenanceMode: boolean;
  minVersion: string;
  dailyFreeLimit: number;
  welcomeMessage: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string; // "LOGIN", "PURCHASE", "EXAM_COMPLETE"
  details: string;
  timestamp: number;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

// --- Hierarchical Subject Management Types ---
export interface SubjectTopic {
  id: string;
  name: string;
}

export interface SubjectLevel {
  id: string;
  name: string;
}

export interface SubjectCategory {
  id: string;
  name: string;
  topics: SubjectTopic[];
  levels: SubjectLevel[];
}
