
import { User, UserRole, Post, MarketplaceExam, Question, SystemConfig, ActivityLog, ShopItem, SubjectCategory } from './types';

// Legacy string array for backward compatibility if needed, but prefer SubjectCategory
export const SCHOOLS = [
  "Atatürk İlköğretim",
  "Cumhuriyet Koleji",
  "Bilim Ortaokulu",
  "Gelecek Nesil Kampüsü"
];

export const INITIAL_SUBJECT_CONFIG: SubjectCategory[] = [
  {
    id: 'sub_math',
    name: 'Matematik',
    topics: [
      { id: 't_alg', name: 'Cebir' }, 
      { id: 't_geo', name: 'Geometri' }, 
      { id: 't_num', name: 'Sayılar' },
      { id: 't_prob', name: 'Olasılık' }
    ],
    levels: [
      { id: 'l_1', name: '1. Sınıf' }, { id: 'l_2', name: '2. Sınıf' },
      { id: 'l_3', name: '3. Sınıf' }, { id: 'l_4', name: '4. Sınıf' },
      { id: 'l_5', name: '5. Sınıf' }, { id: 'l_6', name: '6. Sınıf' },
      { id: 'l_7', name: '7. Sınıf' }, { id: 'l_8', name: '8. Sınıf (LGS)' }
    ]
  },
  {
    id: 'sub_sci',
    name: 'Fen Bilimleri',
    topics: [
      { id: 't_bio', name: 'Biyoloji' }, 
      { id: 't_phys', name: 'Fizik' }, 
      { id: 't_chem', name: 'Kimya' },
      { id: 't_space', name: 'Dünya ve Uzay' }
    ],
    levels: [
      { id: 'l_3', name: '3. Sınıf' }, { id: 'l_4', name: '4. Sınıf' },
      { id: 'l_5', name: '5. Sınıf' }, { id: 'l_6', name: '6. Sınıf' },
      { id: 'l_7', name: '7. Sınıf' }, { id: 'l_8', name: '8. Sınıf (LGS)' }
    ]
  },
  {
    id: 'sub_eng',
    name: 'İngilizce',
    topics: [
      { id: 't_gram', name: 'Grammar' }, 
      { id: 't_vocab', name: 'Vocabulary' }, 
      { id: 't_read', name: 'Reading' }
    ],
    levels: [
      { id: 'l_a1', name: 'A1 (Başlangıç)' }, 
      { id: 'l_a2', name: 'A2 (Temel)' },
      { id: 'l_b1', name: 'B1 (Orta)' },
      { id: 'l_b2', name: 'B2 (Üst Orta)' }
    ]
  },
  {
    id: 'sub_turk',
    name: 'Türkçe',
    topics: [
      { id: 't_par', name: 'Paragraf' }, 
      { id: 't_dil', name: 'Dil Bilgisi' }, 
      { id: 't_soz', name: 'Sözcükte Anlam' }
    ],
    levels: [
      { id: 'l_1', name: '1. Sınıf' }, { id: 'l_2', name: '2. Sınıf' },
      { id: 'l_3', name: '3. Sınıf' }, { id: 'l_4', name: '4. Sınıf' },
      { id: 'l_5', name: '5. Sınıf' }, { id: 'l_6', name: '6. Sınıf' },
      { id: 'l_7', name: '7. Sınıf' }, { id: 'l_8', name: '8. Sınıf (LGS)' }
    ]
  }
];

// Flattened subject names for backward compatibility
export const SUBJECTS = INITIAL_SUBJECT_CONFIG.map(s => s.name);

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'frame_gold', type: 'FRAME', name: 'Altın Çerçeve', description: 'Profilinde parıldayan bir altın çerçeve.', price: 500, imageUrl: 'border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' },
    { id: 'frame_neon', type: 'FRAME', name: 'Neon Cyber', description: 'Fütüristik neon ışıklar.', price: 750, imageUrl: 'border-2 border-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee] ring-2 ring-cyan-200' },
    { id: 'frame_fire', type: 'FRAME', name: 'Alev Ustası', description: 'Yanıyorsun!', price: 1000, imageUrl: 'border-4 border-orange-500 shadow-[0_0_15px_#f97316]' },
    { id: 'joker_5050', type: 'JOKER', name: '%50 Joker', description: 'Sınavda iki yanlış şıkkı eler.', price: 200, imageUrl: '🧩' },
    { id: 'joker_skip', type: 'JOKER', name: 'Pas Geç', description: 'Soruyu doğru cevaplayıp geçer.', price: 150, imageUrl: '⏭️' },
];

export const SUBSCRIPTION_PLANS = [
  { id: 'MONTHLY', title: 'Aylık Plan', price: 89.99, discount: null },
  { id: 'QUARTERLY', title: '3 Aylık Plan', price: 229.99, discount: '%15 İndirim' },
  { id: 'BIANNUAL', title: '6 Aylık Plan', price: 429.99, discount: '%20 İndirim' },
  { id: 'YEARLY', title: 'Yıllık Plan', price: 799.99, discount: 'En Popüler' },
];

export const DEFAULT_PREFS = {
    mentions: true,
    schoolNews: true,
    examReminders: true,
    subscribedTopics: ['LGS', 'Matematik']
};

export const MOCK_USER: User = {
  id: 'user_123',
  name: 'Ali Yılmaz',
  email: 'ali@student.com',
  role: UserRole.STUDENT,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali',
  isPremium: false,
  school: 'Cumhuriyet Koleji',
  grade: '8. Sınıf (LGS)',
  englishLevel: 'A2 (Temel)',
  points: 1250,
  dailyExamCount: 0,
  preferences: DEFAULT_PREFS,
  walletBalance: 0,
  purchasedExamIds: [],
  isTeacherApproved: false,
  isBanned: false,
  lastLogin: Date.now() - 1000 * 60 * 60 * 2,
  deviceInfo: 'iOS 16.5',
  streak: 5,
  inviteCode: 'ALI123',
  inventory: [],
  equippedFrame: undefined,
  examHistory: [
      { id: 'h1', title: 'LGS Matematik Deneme', score: 90, date: '23/05/2024', subject: 'Matematik', correctCount: 18, totalQuestions: 20 },
      { id: 'h2', title: 'Fen Bilimleri Tarama', score: 75, date: '20/05/2024', subject: 'Fen Bilimleri', correctCount: 15, totalQuestions: 20 }
  ]
};

export const MOCK_TEACHER: User = {
  id: 'teacher_001',
  name: 'Zeynep Hoca',
  email: 'zeynep@teacher.com',
  role: UserRole.TEACHER,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zeynep',
  isPremium: true,
  school: 'Bilim Ortaokulu',
  points: 5000,
  dailyExamCount: 0,
  preferences: DEFAULT_PREFS,
  walletBalance: 1250.50,
  purchasedExamIds: [],
  isTeacherApproved: true,
  isBanned: false,
  lastLogin: Date.now() - 1000 * 60 * 30,
  deviceInfo: 'Web Chrome',
  streak: 12,
  inviteCode: 'ZEYNEP_HOCA',
  inventory: [],
  equippedFrame: undefined,
  examHistory: []
};

export const MOCK_ADMIN: User = {
  id: 'admin_001',
  name: 'Müdür Bey',
  email: 'admin@helloclass.com',
  role: UserRole.ADMIN,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  isPremium: true,
  school: 'Yönetim',
  points: 0,
  dailyExamCount: 0,
  preferences: DEFAULT_PREFS,
  walletBalance: 0,
  purchasedExamIds: [],
  isTeacherApproved: true,
  isBanned: false,
  lastLogin: Date.now(),
  deviceInfo: 'Web Dashboard',
  streak: 0,
  inviteCode: 'ADMIN',
  inventory: [],
  equippedFrame: undefined,
  examHistory: []
};

// Helper to generate mock questions
const createMockQuestions = (count: number, subject: string): Question[] => {
    return Array.from({length: count}).map((_, i) => ({
        id: `q_${i}`,
        subject,
        text: `${subject} konulu örnek soru ${i+1}. Bu soru pazaryeri testi içindir.`,
        options: ['A Seçeneği', 'B Seçeneği', 'C Seçeneği', 'D Seçeneği'],
        correctIndex: 0,
        explanation: 'Çünkü doğru cevap A.',
        difficulty: 3
    }));
};

export const MOCK_MARKET_EXAMS: MarketplaceExam[] = [
  {
    id: 'exam_m1',
    title: 'LGS Matematik Full Tekrar',
    description: 'LGS öncesi mutlaka çözülmesi gereken 20 zorlu soru. Yeni nesil sorular içerir.',
    subject: 'Matematik',
    topic: 'Cebir',
    level: '8. Sınıf (LGS)',
    creatorId: 'teacher_001',
    creatorName: 'Zeynep Hoca',
    price: 29.99,
    questionCount: 20,
    duration: 40,
    rating: 4.8,
    sales: 124,
    status: 'PUBLISHED',
    questions: createMockQuestions(20, 'Matematik')
  },
  {
    id: 'exam_m2',
    title: 'İngilizce Kelime Quiz',
    description: 'Unit 1-5 arası kelime taraması.',
    subject: 'İngilizce',
    topic: 'Vocabulary',
    level: 'A1 (Başlangıç)',
    creatorId: 'teacher_002',
    creatorName: 'Mr. John',
    price: 0,
    questionCount: 10,
    duration: 15,
    rating: 4.5,
    sales: 542,
    status: 'PUBLISHED',
    questions: createMockQuestions(10, 'İngilizce')
  },
  {
    id: 'exam_m3',
    title: 'Fen Bilimleri DNA ve Genetik Kod',
    description: 'DNA ve Genetik kod ünitesi detaylı anlatımlı sorular.',
    subject: 'Fen Bilimleri',
    topic: 'Biyoloji',
    level: '8. Sınıf (LGS)',
    creatorId: 'teacher_001',
    creatorName: 'Zeynep Hoca',
    price: 14.99,
    questionCount: 15,
    duration: 30,
    rating: 4.9,
    sales: 89,
    status: 'PUBLISHED',
    questions: createMockQuestions(15, 'Fen Bilimleri')
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    userName: 'Ayşe Demir',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse',
    content: 'Bugünkü matematik sınavı çok zordu! LGS hazırlık bitirdi bizi 😅',
    schoolTag: 'Cumhuriyet Koleji',
    likedBy: ['u_temp_1', 'u_temp_2', 'u_temp_3'], // Updated to array
    comments: [],
    timestamp: Date.now() - 1000 * 60 * 60,
    isReported: false
  },
  {
    id: 'p2',
    userId: 'u3',
    userName: 'Mehmet Can',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet',
    content: 'Fen projesi için grup arkadaşı arıyorum. Konu: Uzay.',
    schoolTag: 'Bilim Ortaokulu',
    likedBy: ['u_temp_4'], // Updated to array
    comments: [],
    timestamp: Date.now() - 1000 * 60 * 120,
    isReported: false
  }
];

export const DAILY_LIMIT = 1;

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    maintenanceMode: false,
    minVersion: '1.0.2',
    dailyFreeLimit: 1,
    welcomeMessage: 'HelloClass\'a Hoşgeldiniz!'
};

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
    { id: 'l1', userId: 'user_123', userName: 'Ali Yılmaz', action: 'LOGIN', details: 'iOS Cihazdan giriş yapıldı', timestamp: Date.now() - 1000 * 60 * 5, type: 'INFO' },
    { id: 'l2', userId: 'u3', userName: 'Mehmet Can', action: 'REPORT_POST', details: 'Spam içerik bildirimi', timestamp: Date.now() - 1000 * 60 * 15, type: 'WARNING' },
    { id: 'l3', userId: 'teacher_001', userName: 'Zeynep Hoca', action: 'EXAM_PUBLISH', details: 'Yeni sınav yayına alındı', timestamp: Date.now() - 1000 * 60 * 30, type: 'SUCCESS' },
    { id: 'l4', userId: 'u2', userName: 'Ayşe Demir', action: 'PURCHASE', details: 'Premium (Yıllık) satın alındı', timestamp: Date.now() - 1000 * 60 * 45, type: 'SUCCESS' },
];

export const ADMIN_CHART_DATA = {
    revenue: [
        { name: 'Ocak', amount: 4000 },
        { name: 'Şubat', amount: 3000 },
        { name: 'Mart', amount: 5000 },
        { name: 'Nisan', amount: 4500 },
        { name: 'Mayıs', amount: 6000 },
        { name: 'Haziran', amount: 8000 },
    ],
    activity: [
        { name: '00:00', users: 120 },
        { name: '04:00', users: 50 },
        { name: '08:00', users: 450 },
        { name: '12:00', users: 1200 },
        { name: '16:00', users: 980 },
        { name: '20:00', users: 1500 },
    ],
    topics: [
        { name: 'Matematik', value: 400, color: '#F59E0B' },
        { name: 'Fen', value: 300, color: '#32CD32' },
        { name: 'İngilizce', value: 300, color: '#4682B4' },
        { name: 'Türkçe', value: 200, color: '#8A2BE2' },
    ]
};
