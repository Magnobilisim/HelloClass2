
import React, { useState, useMemo } from 'react';
import { useApp } from '../services/store';
import { 
    Users, FileText, AlertTriangle, Trash2, Check, X, ShieldCheck, ShoppingBag, 
    Activity, Settings, Bell, Search, Lock, Unlock, Gift, RotateCcw, Smartphone,
    LayoutDashboard, MessageSquare, BarChart3, Server, Plus, BookOpen, Edit, Image as ImageIcon, CheckCircle, LayoutGrid, FileSpreadsheet, Download, FolderTree,
    History, List, ScrollText, Flame, Save
} from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { User, UserRole, MarketplaceExam, Question } from '../types';

const TAB_LABELS: Record<string, string> = {
    DASHBOARD: 'Genel Bakış',
    USERS: 'Kullanıcılar',
    MARKET: 'Market',
    MODERATION: 'Moderasyon',
    ENGAGEMENT: 'Etkileşim',
    SETTINGS: 'Ayarlar'
};

export const AdminDashboard = () => {
  const { 
      user, 
      posts, deletePost, pendingTeachers, approveTeacher, rejectTeacher, marketplaceExams, 
      allUsers, banUser, unbanUser, deleteUser, giftPremium, resetUserPassword,
      systemConfig, updateSystemConfig, sendPushNotification,
      subjects, subjectConfig, addSubjectCategory, deleteSubjectCategory, addSubItem, deleteSubItem, adminAddUser, adminUpdateUser, adminCreateExam, updateMarketplaceExam, deleteMarketplaceExam,
      factoryReset, activityLogs, dismissReport
  } = useApp();

  const [tab, setTab] = useState<'DASHBOARD' | 'USERS' | 'MARKET' | 'MODERATION' | 'ENGAGEMENT' | 'SETTINGS' | 'EXAM_EDITOR'>('DASHBOARD');
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', target: 'ALL' });
  const [userModalTab, setUserModalTab] = useState<'HISTORY' | 'LOGS'>('HISTORY');
  const [editUserRole, setEditUserRole] = useState<UserRole | null>(null);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'STUDENT', school: '' });
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  
  const [newTopicName, setNewTopicName] = useState('');
  const [newLevelName, setNewLevelName] = useState('');

  const [editingExam, setEditingExam] = useState<Partial<MarketplaceExam>>({});
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
      text: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 3, explanation: ''
  });
  const [editorStep, setEditorStep] = useState<'META' | 'QUESTIONS'>('META');
  
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const reportedPosts = posts.filter(p => p.isReported);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const dynamicChartData = useMemo(() => {
      const activityData = Array.from({ length: 24 }, (_, i) => ({
          name: `${i.toString().padStart(2, '0')}:00`,
          users: 0
      }));

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      activityLogs.forEach(log => {
          if (log.timestamp >= oneDayAgo) {
              const hour = new Date(log.timestamp).getHours();
              activityData[hour].users += 1;
          }
      });

      const salesData = marketplaceExams.reduce((acc, exam) => {
          const existing = acc.find(i => i.name === exam.subject);
          if (existing) {
              existing.sales += exam.sales;
          } else {
              acc.push({ name: exam.subject, sales: exam.sales });
          }
          return acc;
      }, [] as {name: string, sales: number}[]);

      return { activity: activityData, sales: salesData };
  }, [allUsers, marketplaceExams, activityLogs]);

  const handleAddUser = () => {
      if(newUser.name && newUser.email) {
          adminAddUser({
              name: newUser.name,
              email: newUser.email,
              role: newUser.role as UserRole,
              school: newUser.school || 'Admin Kayıt',
              isPremium: false
          });
          setShowUserModal(false);
          setNewUser({ name: '', email: '', role: 'STUDENT', school: '' });
      }
  };

  const handleUpdateUserRole = () => {
      if (selectedUser && editUserRole) {
          if (window.confirm(`Kullanıcı rolünü ${editUserRole} olarak değiştirmek istediğinize emin misiniz?`)) {
              adminUpdateUser(selectedUser.id, { role: editUserRole });
              setSelectedUser({ ...selectedUser, role: editUserRole }); 
              setEditUserRole(null);
              showToast('Kullanıcı rolü güncellendi.', 'success');
          }
      }
  };

  const handleAddSubject = () => {
      if(newSubjectName.trim()) {
          addSubjectCategory(newSubjectName.trim());
          setNewSubjectName('');
      }
  };

  const handleAddTopic = () => {
      if(activeSubjectId && newTopicName.trim()) {
          addSubItem(activeSubjectId, 'TOPIC', newTopicName.trim());
          setNewTopicName(''); // Fix
      }
  };

  const handleAddLevel = () => {
      if(activeSubjectId && newLevelName.trim()) {
          addSubItem(activeSubjectId, 'LEVEL', newLevelName.trim());
          setNewLevelName(''); // Fix
      }
  };

  const handleDeleteSubject = (id: string) => {
      if (window.confirm('Bu dersi ve tüm alt konularını silmek istediğinize emin misiniz?')) {
          deleteSubjectCategory(id);
          if (activeSubjectId === id) setActiveSubjectId(null);
      }
  };

  const handleCreateExam = () => {
      setEditingExam({
          title: '',
          description: '',
          subject: subjects[0],
          topic: '',
          level: '',
          price: 0,
          duration: 20, 
          status: 'DRAFT',
          questions: []
      });
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 3, explanation: '' });
      setEditorStep('META');
      setTab('EXAM_EDITOR');
  };

  const handleEditExam = (exam: MarketplaceExam) => {
      setEditingExam({ ...exam });
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 3, explanation: '' });
      setEditorStep('META');
      setTab('EXAM_EDITOR');
  };

  const handleSaveQuestion = () => {
      if(!currentQuestion.text || currentQuestion.options?.some(o => !o)) {
          showToast("Lütfen soru metnini ve tüm şıkları doldurun.", 'error');
          return;
      }
      
      const newQ: Question = {
          id: currentQuestion.id || `q_${Date.now()}`,
          subject: editingExam.subject || 'Genel',
          text: currentQuestion.text!,
          options: currentQuestion.options!,
          correctIndex: currentQuestion.correctIndex || 0,
          explanation: currentQuestion.explanation || '',
          difficulty: 3,
          imageUrl: currentQuestion.imageUrl,
          optionImages: currentQuestion.optionImages,
          explanationImageUrl: currentQuestion.explanationImageUrl
      };

      setEditingExam(prev => {
          const existingIndex = prev.questions?.findIndex(q => q.id === newQ.id);
          let updatedQuestions;
          if (existingIndex !== undefined && existingIndex !== -1) {
              updatedQuestions = [...(prev.questions || [])];
              updatedQuestions[existingIndex] = newQ;
          } else {
              updatedQuestions = [...(prev.questions || []), newQ];
          }
          
          return {
              ...prev,
              questions: updatedQuestions,
              questionCount: updatedQuestions.length
          };
      });
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 3, explanation: '', imageUrl: '', explanationImageUrl: '', optionImages: ['', '', '', ''] });
      showToast(currentQuestion.id ? 'Soru güncellendi.' : 'Soru eklendi.', 'success');
  };

  const handleEditQuestion = (q: Question) => {
      setCurrentQuestion({ ...q });
  };

  const handleCancelEditQuestion = () => {
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 3, explanation: '', imageUrl: '', explanationImageUrl: '', optionImages: ['', '', '', ''] });
  };

  const removeQuestion = (id: string) => {
      setEditingExam(prev => ({
          ...prev,
          questions: prev.questions?.filter(q => q.id !== id),
          questionCount: (prev.questions?.length || 1) - 1
      }));
      // RESET EDITOR IF DELETED QUESTION WAS BEING EDITED
      if (currentQuestion.id === id) {
          handleCancelEditQuestion();
      }
  };

  const handleSaveMeta = () => {
      if (!editingExam.title?.trim()) {
          showToast("Lütfen bir sınav başlığı girin.", 'error');
          return;
      }
      if (!editingExam.description?.trim()) {
          showToast("Lütfen sınav açıklamasını girin.", 'error');
          return;
      }
      if (!editingExam.duration || editingExam.duration <= 0) {
          showToast("Lütfen geçerli bir sınav süresi (dakika) girin.", 'error');
          return;
      }
      if ((editingExam.price ?? -1) < 0) {
          showToast("Fiyat 0'dan küçük olamaz.", 'error');
          return;
      }
      setEditorStep('QUESTIONS');
  };

  const handleFinishExam = () => {
      if (!editingExam.title?.trim()) {
          showToast("Lütfen bir sınav başlığı girin.", 'error');
          return;
      }
      if (!editingExam.description?.trim()) {
          showToast("Lütfen sınav açıklamasını girin.", 'error');
          return;
      }
      if (!editingExam.duration || editingExam.duration <= 0) {
          showToast("Lütfen geçerli bir sınav süresi (dakika) girin.", 'error');
          return;
      }
      if ((editingExam.price ?? -1) < 0) {
          showToast("Fiyat 0'dan küçük olamaz.", 'error');
          return;
      }

      let finalStatus = editingExam.status;
      if (finalStatus === 'PUBLISHED' && (!editingExam.questions || editingExam.questions.length === 0)) {
          finalStatus = 'DRAFT';
          showToast("Uyarı: Soru eklenmediği için sınav TASLAK olarak kaydedildi.", 'error');
      }

      const finalExam = { ...editingExam, status: finalStatus };

      if(editingExam.id) {
          updateMarketplaceExam(editingExam.id, finalExam);
          showToast("Sınav güncellendi.", 'success');
      } else {
          adminCreateExam(finalExam);
          showToast("Sınav oluşturuldu.", 'success');
      }
      setTab('MARKET');
  };

  const handleDeleteExam = (id: string) => {
      if(window.confirm("Sınavı silmek istediğinize emin misiniz?")) {
          deleteMarketplaceExam(id);
      }
  };

  const handleImageUpload = (target: 'QUESTION' | 'EXPLANATION' | number) => {
      const mockUrl = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=60";
      if (target === 'QUESTION') {
          setCurrentQuestion(prev => ({ ...prev, imageUrl: mockUrl }));
      } else if (target === 'EXPLANATION') {
          setCurrentQuestion(prev => ({ ...prev, explanationImageUrl: mockUrl }));
      } else if (typeof target === 'number') {
          const newOptionImages = [...(currentQuestion.optionImages || ['', '', '', ''])];
          newOptionImages[target] = mockUrl;
          setCurrentQuestion(prev => ({ ...prev, optionImages: newOptionImages }));
      }
      showToast('Görsel yüklendi (Simülasyon).', 'success');
  };

  const handleDownloadTemplate = () => {
      const headers = ["Soru Metni", "A Seçeneği", "B Seçeneği", "C Seçeneği", "D Seçeneği", "Doğru Cevap (1-4)", "Görsel URL (Opsiyonel)", "Açıklama"];
      const row1 = ["Türkiye'nin başkenti neresidir?", "İstanbul", "Ankara", "İzmir", "Bursa", "2", "", "Başkent Ankara'dır."];
      const row2 = ["Suyun formülü nedir?", "CO2", "H2O", "NaCl", "O2", "2", "", "İki Hidrojen bir Oksijen."];
      
      const escapeCsv = (text: string) => {
          if (text.includes(";") || text.includes('"') || text.includes("\n")) {
              return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
      };

      const csvContent = [
          headers.map(escapeCsv).join(";"),
          row1.map(escapeCsv).join(";"),
          row2.map(escapeCsv).join(";")
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "HelloClass_Soru_Sablonu.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportUsers = () => {
      const headers = ["ID", "Ad Soyad", "E-posta", "Rol", "Okul", "Puan", "Premium", "Yasaklı", "Kayıt Tarihi"];
      const rows = allUsers.map(u => [
          u.id,
          u.name,
          u.email,
          u.role,
          u.school,
          u.points.toString(),
          u.isPremium ? "EVET" : "HAYIR",
          u.isBanned ? "EVET" : "HAYIR",
          new Date(u.lastLogin || Date.now()).toLocaleDateString()
      ]);

      const escapeCsv = (text: string) => {
          if (text.includes(";") || text.includes('"') || text.includes("\n")) {
              return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
      };

      const csvContent = [
          headers.map(escapeCsv).join(";"),
          ...rows.map(row => row.map(escapeCsv).join(";"))
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `HelloClass_Kullanicilar_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleBulkImport = () => {
      if (!bulkText) return;

      const rows = bulkText.trim().split('\n');
      const newQuestions: Question[] = [];
      let skippedCount = 0;
      
      rows.forEach((row, idx) => {
          if (!row.trim()) return;

          let cols = row.split('\t');
          
          if (cols.length < 2 && row.includes(';')) {
             const matches = row.match(/(".*?"|[^;]+)(?=\s*;|\s*$)/g);
             if (matches) {
                 cols = matches.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
             }
          }

          if (cols.length < 6) {
              console.warn(`Skipping row ${idx + 1}: Insufficient columns.`);
              skippedCount++;
              return;
          }

          let rawIndex = cols[5].trim();
          let parsedCorrectIndex = parseInt(rawIndex);
          
          if (isNaN(parsedCorrectIndex)) {
               skippedCount++;
               return;
          }

          parsedCorrectIndex = parsedCorrectIndex - 1; 

          if (parsedCorrectIndex < 0 || parsedCorrectIndex > 3) {
              skippedCount++;
              return;
          }

          newQuestions.push({
              id: `bulk_${Date.now()}_${idx}`,
              subject: editingExam.subject || 'Genel',
              text: cols[0].trim(),
              options: [cols[1].trim(), cols[2].trim(), cols[3].trim(), cols[4].trim()],
              correctIndex: parsedCorrectIndex,
              imageUrl: cols[6]?.trim() || undefined,
              explanation: cols[7]?.trim() || '',
              difficulty: 3,
              optionImages: [], 
              explanationImageUrl: ''
          });
      });

      if (newQuestions.length > 0) {
          setEditingExam(prev => ({
              ...prev,
              questions: [...(prev.questions || []), ...newQuestions],
              questionCount: (prev.questions?.length || 0) + newQuestions.length
          }));
          if (skippedCount > 0) {
             showToast(`${newQuestions.length} soru eklendi. ${skippedCount} satır format hatası nedeniyle atlandı.`, 'success');
          } else {
             showToast(`${newQuestions.length} soru başarıyla içe aktarıldı.`, 'success');
          }
          setShowBulkModal(false);
          setBulkText('');
      } else {
          showToast('Geçerli veri bulunamadı. Lütfen formatı kontrol edin.', 'error');
      }
  };

  const filteredUsers = allUsers.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase());
      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      return matchesSearch && matchesRole;
  });

  const selectedSubjectCat = subjectConfig.find(s => s.name === editingExam.subject);
  const selectedUserLogs = selectedUser ? activityLogs.filter(log => log.userId === selectedUser.id) : [];
  const isSelf = selectedUser?.id === user?.id;

  const renderContent = () => {
      switch(tab) {
          case 'DASHBOARD':
              return (
                  <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Users size={20}/></div>
                                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
                              </div>
                              <div className="text-2xl font-bold text-gray-800">{allUsers.length}</div>
                              <div className="text-xs text-gray-500">Toplam Kullanıcı</div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                  <div className="p-2 bg-yellow-50 rounded-xl text-yellow-600"><Gift size={20}/></div>
                                  <span className="text-xs font-bold text-gray-400">Aktif</span>
                              </div>
                              <div className="text-2xl font-bold text-gray-800">{allUsers.filter(u => u.isPremium).length}</div>
                              <div className="text-xs text-gray-500">Premium Üye</div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                  <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><BookOpen size={20}/></div>
                              </div>
                              <div className="text-2xl font-bold text-gray-800">{marketplaceExams.length}</div>
                              <div className="text-xs text-gray-500">Toplam Sınav</div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                  <div className="p-2 bg-red-50 rounded-xl text-red-600"><AlertTriangle size={20}/></div>
                                  <span className="text-xs font-bold text-red-500">{reportedPosts.length > 0 ? `${reportedPosts.length} Yeni` : 'Temiz'}</span>
                              </div>
                              <div className="text-2xl font-bold text-gray-800">{reportedPosts.length}</div>
                              <div className="text-xs text-gray-500">Bekleyen Şikayet</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[300px]">
                              <h3 className="font-bold text-gray-700 mb-4 flex items-center"><Activity size={18} className="mr-2"/> Kullanıcı Aktivitesi (Son 24 Saat)</h3>
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={dynamicChartData.activity}>
                                      <defs>
                                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} minTickGap={30} />
                                      <Tooltip />
                                      <Area type="monotone" dataKey="users" stroke="#F59E0B" fillOpacity={1} fill="url(#colorUsers)" />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                          
                          {/* SALES / TOPICS CHART */}
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[300px]">
                              <h3 className="font-bold text-gray-700 mb-4 flex items-center"><BarChart3 size={18} className="mr-2"/> Ders Bazlı Satışlar</h3>
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={dynamicChartData.sales}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                      <Tooltip />
                                      <Bar dataKey="sales" fill="#3B82F6" radius={[4,4,0,0]} barSize={30} />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                      
                      {/* ACTIVITY LOGS */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[300px] flex flex-col">
                          <h3 className="font-bold text-gray-700 mb-4 flex items-center"><List size={18} className="mr-2"/> Sistem Kayıtları (Live)</h3>
                          <div className="overflow-y-auto flex-1 pr-2 space-y-3 no-scrollbar">
                              {activityLogs.map(log => (
                                  <div key={log.id} className="flex items-start gap-3 text-xs p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                          log.type === 'ERROR' ? 'bg-red-500' : 
                                          log.type === 'WARNING' ? 'bg-yellow-500' : 
                                          log.type === 'SUCCESS' ? 'bg-green-500' : 'bg-blue-500'
                                      }`}></div>
                                      <div className="flex-1">
                                          <div className="flex justify-between">
                                              <span className="font-bold text-gray-800">{log.userName}</span>
                                              <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                          </div>
                                          <div className="text-gray-600 mt-0.5 font-medium">{log.action}</div>
                                          <div className="text-gray-400">{log.details}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              );
          case 'USERS': return (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="İsim veya E-posta ara..." 
                                value={searchUser}
                                onChange={e => setSearchUser(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary text-gray-900"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {['ALL', 'STUDENT', 'TEACHER', 'ADMIN'].map(r => (
                                <button 
                                    key={r}
                                    onClick={() => setFilterRole(r)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${filterRole === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {r === 'ALL' ? 'Tümü' : r}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleExportUsers} className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-green-200"><Download size={18} className="mr-1"/> Excel (.csv)</button>
                            <button onClick={() => setShowUserModal(true)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-primary-dark"><Plus size={18} className="mr-1"/> Yeni</button>
                        </div>
                    </div>

                    <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="p-4">Kullanıcı</th>
                                    <th className="p-4">Rol</th>
                                    <th className="p-4">Puan</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={u.avatar} className="w-10 h-10 rounded-full bg-gray-100"/>
                                                <div>
                                                    <div className="font-bold text-gray-800">{u.name}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-900">{u.points}</td>
                                        <td className="p-4">
                                            {u.isBanned ? <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Yasaklı</span> : 
                                            u.isPremium ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">Premium</span> : 
                                            <span className="text-xs text-gray-400">Standart</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => setSelectedUser(u)} className="text-gray-400 hover:text-primary font-bold text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-white">Yönet</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-3">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <img src={u.avatar} className="w-12 h-12 rounded-full bg-gray-100"/>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-gray-800 text-sm truncate">{u.name}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                </div>
                                <button onClick={() => setSelectedUser(u)} className="p-2 text-gray-400 border rounded-lg hover:bg-gray-50"><Settings size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            );
          case 'MODERATION': return (
              <div className="space-y-4 animate-fade-in">
                   {reportedPosts.length === 0 ? (
                       <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border-dashed border border-gray-200">
                           <ShieldCheck size={48} className="mx-auto mb-4 text-green-300"/>
                           <p>Şu an incelenecek şikayet yok.</p>
                       </div>
                   ) : (
                       reportedPosts.map(post => (
                          <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col md:flex-row justify-between gap-4">
                               <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-2">
                                       <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Şikayet</span>
                                       {post.reportReason && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">Sebep: {post.reportReason}</span>}
                                       <span className="text-gray-400 text-xs">{new Date(post.timestamp).toLocaleString()}</span>
                                   </div>
                                   <p className="text-gray-800 bg-gray-50 p-3 rounded-lg text-sm italic">"{post.content}"</p>
                                   <div className="mt-2 text-xs text-gray-500">Yazar: <span className="font-bold">{post.userName}</span></div>
                               </div>
                               <div className="flex items-center gap-3">
                                   <button onClick={() => dismissReport(post.id)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Yoksay</button>
                                   <button onClick={() => deletePost(post.id)} className="px-4 py-2 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md shadow-red-200">İçeriği Sil</button>
                               </div>
                          </div>
                       ))
                   )}
              </div>
          );
          case 'MARKET': return (
              <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Pazaryeri Sınavları</h3>
                      <button onClick={handleCreateExam} className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center hover:bg-green-600">
                          <Plus size={16} className="mr-1"/> Yeni Sınav
                      </button>
                  </div>
                  
                  <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white text-gray-500 border-b">
                              <tr>
                                  <th className="p-4">Sınav</th>
                                  <th className="p-4">Eğitmen</th>
                                  <th className="p-4">Fiyat</th>
                                  <th className="p-4">Durum</th>
                                  <th className="p-4 text-right">İşlem</th>
                              </tr>
                          </thead>
                          <tbody>
                              {marketplaceExams.map(exam => (
                                  <tr key={exam.id} className="border-b last:border-0 hover:bg-gray-50">
                                      <td className="p-4 font-bold text-gray-800">{exam.title}</td>
                                      <td className="p-4 text-gray-500">{exam.creatorName}</td>
                                      <td className="p-4 text-green-600 font-bold">{exam.price > 0 ? `₺${exam.price}` : 'Ücretsiz'}</td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                              {exam.status === 'PUBLISHED' ? 'YAYINDA' : exam.status === 'DRAFT' ? 'TASLAK' : 'ARŞİV'}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right flex justify-end gap-2">
                                          <button onClick={() => handleEditExam(exam)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                                          <button onClick={() => handleDeleteExam(exam.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="md:hidden space-y-3">
                       {marketplaceExams.map(exam => (
                           <div key={exam.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
                               <div className="flex justify-between items-start mb-2">
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                       {exam.status}
                                   </span>
                                   <span className="font-bold text-green-600 text-sm">{exam.price > 0 ? `₺${exam.price}` : 'Free'}</span>
                               </div>
                               <h4 className="font-bold text-gray-900 mb-1">{exam.title}</h4>
                               <div className="text-xs text-gray-500 mb-4">{exam.creatorName}</div>
                               <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                                   <button onClick={() => handleEditExam(exam)} className="text-blue-600 text-xs font-bold px-3 py-1 bg-blue-50 rounded-lg">Düzenle</button>
                                   <button onClick={() => handleDeleteExam(exam.id)} className="text-red-600 text-xs font-bold px-3 py-1 bg-red-50 rounded-lg">Sil</button>
                                </div>
                           </div>
                       ))}
                  </div>
              </div>
          );
          case 'ENGAGEMENT': return (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Bell size={18} className="mr-2 text-purple-500"/> Anlık Bildirim Gönder</h3>
                      <div className="space-y-4 max-w-md">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">BAŞLIK</label>
                              <input 
                                  type="text" 
                                  value={notifForm.title} 
                                  onChange={e => setNotifForm({...notifForm, title: e.target.value})}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                  placeholder="Örn: Hafta sonu yarışması!"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">MESAJ</label>
                              <textarea 
                                  value={notifForm.message}
                                  onChange={e => setNotifForm({...notifForm, message: e.target.value})}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                  rows={3}
                                  placeholder="Kullanıcılara ne söylemek istersiniz?"
                              ></textarea>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">HEDEF KİTLE</label>
                              <select 
                                  value={notifForm.target}
                                  onChange={e => setNotifForm({...notifForm, target: e.target.value})}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                              >
                                  <option value="ALL">Herkese Gönder</option>
                                  <option value="STUDENT">Sadece Öğrencilere</option>
                                  <option value="TEACHER">Sadece Öğretmenlere</option>
                                  <option value="PREMIUM">Sadece Premium Üyelere</option>
                              </select>
                          </div>
                          <button 
                              onClick={() => {
                                  if(notifForm.title && notifForm.message) {
                                      sendPushNotification(notifForm.title, notifForm.message, notifForm.target);
                                      setNotifForm({ title: '', message: '', target: 'ALL' });
                                      showToast('Bildirim gönderildi.', 'success');
                                  }
                              }}
                              className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors"
                          >
                              Gönder
                          </button>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center"><CheckCircle size={18} className="mr-2 text-blue-500"/> Eğitmen Başvuruları</h3>
                      {pendingTeachers.length === 0 ? (
                          <p className="text-gray-400 text-sm italic">Bekleyen başvuru yok.</p>
                      ) : (
                          <div className="space-y-3">
                              {pendingTeachers.map(t => (
                                  <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                      <div className="flex items-center gap-3">
                                          <img src={t.avatar} className="w-10 h-10 rounded-full bg-white"/>
                                          <div>
                                              <div className="font-bold text-gray-800 text-sm">{t.name}</div>
                                              <div className="text-xs text-gray-500">{t.email} • {t.school}</div>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => approveTeacher(t.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16}/></button>
                                          <button onClick={() => rejectTeacher(t.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          );
          case 'SETTINGS': return (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Server size={18} className="mr-2"/> Sistem Yapılandırması</h3>
                      
                      <div className="space-y-4 max-w-md">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                              <div>
                                  <div className="font-bold text-gray-700 text-sm">Bakım Modu</div>
                                  <div className="text-xs text-gray-400">Kullanıcı erişimini kısıtlar</div>
                              </div>
                              <button 
                                  onClick={() => updateSystemConfig({ maintenanceMode: !systemConfig.maintenanceMode })}
                                  className={`w-12 h-6 rounded-full relative transition-colors ${systemConfig.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
                              >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemConfig.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                              </button>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">GÜNLÜK ÜCRETSİZ SINAV LİMİTİ</label>
                              <input 
                                  type="number" 
                                  onWheel={(e) => e.currentTarget.blur()}
                                  value={systemConfig.dailyFreeLimit}
                                  onChange={e => updateSystemConfig({ dailyFreeLimit: parseInt(e.target.value) })}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                              />
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">KARŞILAMA MESAJI</label>
                              <input 
                                  type="text" 
                                  value={systemConfig.welcomeMessage}
                                  onChange={e => updateSystemConfig({ welcomeMessage: e.target.value })}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center"><FolderTree size={18} className="mr-2 text-blue-500"/> Ders & Konu Yönetimi</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                          <div className="border-r border-gray-100 pr-4 overflow-y-auto">
                              <div className="flex gap-2 mb-4">
                                  <input 
                                      type="text" 
                                      placeholder="Yeni Ders Ekle..." 
                                      className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none text-gray-900"
                                      value={newSubjectName}
                                      onChange={e => setNewSubjectName(e.target.value)}
                                  />
                                  <button onClick={handleAddSubject} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"><Plus size={16}/></button>
                              </div>
                              <div className="space-y-2">
                                  {subjects.map((subName) => {
                                      const sub = subjectConfig.find(s => s.name === subName);
                                      return (
                                          <div 
                                              key={sub?.id || subName}
                                              onClick={() => setActiveSubjectId(sub?.id || null)}
                                              className={`p-3 rounded-xl text-sm font-bold cursor-pointer flex justify-between items-center group ${activeSubjectId === sub?.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                          >
                                              {subName}
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); if(sub) handleDeleteSubject(sub.id); }}
                                                  className="text-red-300 hover:text-red-500"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>

                          <div className="border-r border-gray-100 px-4 overflow-y-auto">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Konular</h4>
                              {activeSubjectId ? (
                                  <>
                                      <div className="flex gap-2 mb-4">
                                          <input 
                                              type="text" 
                                              placeholder="Konu Ekle..." 
                                              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none text-gray-900"
                                              value={newTopicName}
                                              onChange={e => setNewTopicName(e.target.value)}
                                          />
                                          <button onClick={handleAddTopic} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"><Plus size={16}/></button>
                                      </div>
                                      <div className="space-y-2">
                                          {subjectConfig.find(s => s.id === activeSubjectId)?.topics.map(t => (
                                              <div key={t.id} className="p-2 bg-gray-50 rounded-lg text-xs text-gray-700 flex justify-between items-center group">
                                                  {t.name}
                                                  <button onClick={() => deleteSubItem(activeSubjectId, 'TOPIC', t.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                              </div>
                                          ))}
                                      </div>
                                  </>
                              ) : (
                                  <div className="text-center text-gray-300 text-xs mt-10">Ders seçiniz</div>
                              )}
                          </div>

                          <div className="pl-4 overflow-y-auto">
                              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Seviyeler</h4>
                              {activeSubjectId ? (
                                  <>
                                      <div className="flex gap-2 mb-4">
                                          <input 
                                              type="text" 
                                              placeholder="Seviye Ekle..." 
                                              className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none text-gray-900"
                                              value={newLevelName}
                                              onChange={e => setNewLevelName(e.target.value)}
                                          />
                                          <button onClick={handleAddLevel} className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600"><Plus size={16}/></button>
                                      </div>
                                      <div className="space-y-2">
                                          {subjectConfig.find(s => s.id === activeSubjectId)?.levels.map(l => (
                                              <div key={l.id} className="p-2 bg-gray-50 rounded-lg text-xs text-gray-700 flex justify-between items-center group">
                                                  {l.name}
                                                  <button onClick={() => deleteSubItem(activeSubjectId, 'LEVEL', l.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                              </div>
                                          ))}
                                      </div>
                                  </>
                              ) : (
                                  <div className="text-center text-gray-300 text-xs mt-10">Ders seçiniz</div>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100">
                      <h3 className="font-bold text-red-800 mb-4 flex items-center"><AlertTriangle size={18} className="mr-2"/> Tehlikeli Bölge</h3>
                      <p className="text-red-600 text-sm mb-4">Bu işlem tüm veritabanını (Kullanıcılar, Gönderiler, Sınavlar) sıfırlar. Geri alınamaz.</p>
                      <button 
                          onClick={() => { if(window.confirm('TÜM SİSTEM VERİLERİNİ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?')) factoryReset(); }}
                          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                          <Trash2 size={18} className="mr-2"/> Fabrika Ayarlarına Dön (Reset)
                      </button>
                  </div>
              </div>
          );
          case 'EXAM_EDITOR':
              return (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                 <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                     <div className="flex gap-4">
                         <button onClick={() => setEditorStep('META')} className={`text-sm font-bold ${editorStep === 'META' ? 'text-primary' : 'text-gray-400'}`}>1. Temel Bilgiler</button>
                         <button onClick={() => setEditorStep('QUESTIONS')} className={`text-sm font-bold ${editorStep === 'QUESTIONS' ? 'text-primary' : 'text-gray-400'}`}>2. Sorular ({editingExam.questions?.length || 0})</button>
                     </div>
                     <button onClick={() => setTab('MARKET')} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                 </div>
 
                 {editorStep === 'META' && (
                     <div className="p-8 space-y-6 max-w-3xl mx-auto">
                          <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Sınav Başlığı</label>
                                 <input type="text" value={editingExam.title || ''} onChange={e => setEditingExam({...editingExam, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900" placeholder="Örn: LGS Matematik Kampı" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-1">Ders</label>
                                     <select value={editingExam.subject || subjects[0]} onChange={e => setEditingExam({...editingExam, subject: e.target.value, topic: '', level: ''})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900">
                                         {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-1">Fiyat (₺)</label>
                                     <input type="number" onWheel={(e) => e.currentTarget.blur()} min="0" value={editingExam.price || 0} onChange={e => setEditingExam({...editingExam, price: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900" />
                                 </div>
                             </div>
 
                             {selectedSubjectCat && (
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-sm font-bold text-gray-700 mb-1">Konu (Opsiyonel)</label>
                                         <select value={editingExam.topic || ''} onChange={e => setEditingExam({...editingExam, topic: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900">
                                             <option value="">Genel / Seçilmedi</option>
                                             {selectedSubjectCat.topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-sm font-bold text-gray-700 mb-1">Seviye (Opsiyonel)</label>
                                         <select value={editingExam.level || ''} onChange={e => setEditingExam({...editingExam, level: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900">
                                             <option value="">Genel / Seçilmedi</option>
                                             {selectedSubjectCat.levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                         </select>
                                     </div>
                                 </div>
                             )}
 
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-1">Süre (Dk)</label>
                                     <input type="number" onWheel={(e) => e.currentTarget.blur()} min="1" value={editingExam.duration || 20} onChange={e => setEditingExam({...editingExam, duration: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-1">Durum</label>
                                     <select value={editingExam.status || 'DRAFT'} onChange={e => setEditingExam({...editingExam, status: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900">
                                        <option value="DRAFT">Taslak</option>
                                        <option value="PUBLISHED">Yayında</option>
                                        <option value="ARCHIVED">Arşivlenmiş</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">AÇIKLAMA</label>
                                <textarea value={editingExam.description || ''} onChange={e => setEditingExam({...editingExam, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary text-gray-900" rows={4} />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={handleSaveMeta} className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Sonraki: Sorular</button>
                        </div>
                    </div>
                )}

                {editorStep === 'QUESTIONS' && (
                    <div className="flex flex-col md:flex-row h-[800px] md:h-[600px]">
                        <div className="w-full md:w-1/3 border-b md:border-r border-gray-100 overflow-y-auto p-4 bg-gray-50/50 h-1/3 md:h-auto">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="font-bold text-gray-700">Sorular</h3>
                                 <button onClick={() => setShowBulkModal(true)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center hover:bg-green-200"><FileSpreadsheet size={14} className="mr-1"/> Excel Yükle</button>
                             </div>
                             <div className="space-y-2">
                                 {editingExam.questions?.map((q, i) => (
                                     <div key={q.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm group relative hover:border-primary transition-colors">
                                         <div className="flex justify-between items-start">
                                            <div className="text-xs font-bold text-gray-400 mb-1">Soru {i+1}</div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditQuestion(q)} className="text-blue-400 hover:text-blue-600"><Edit size={14}/></button>
                                                <button onClick={() => removeQuestion(q.id)} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                                            </div>
                                         </div>
                                         <p className="text-sm text-gray-800 line-clamp-2">{q.text}</p>
                                     </div>
                                 ))}
                                 {(!editingExam.questions || editingExam.questions.length === 0) && <div className="text-center text-gray-400 text-sm py-4">Henüz soru yok.</div>}
                             </div>
                        </div>
                        
                        <div className="w-full md:w-2/3 p-6 overflow-y-auto h-2/3 md:h-auto">
                            <h3 className="font-bold text-gray-800 mb-4">{currentQuestion.id ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">SORU METNİ</label>
                                    <textarea value={currentQuestion.text} onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900" rows={3}></textarea>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">SORU GÖRSELİ (OPSİYONEL)</label>
                                    <div className="flex items-center gap-4">
                                        {currentQuestion.imageUrl && (
                                            <img src={currentQuestion.imageUrl} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                                        )}
                                        <div 
                                            onClick={() => handleImageUpload('QUESTION')}
                                            className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <ImageIcon className="mx-auto text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500 font-medium">Soru görseli yükle</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentQuestion.options?.map((opt, idx) => (
                                        <div key={idx} className={`space-y-2 p-3 border rounded-xl transition-all ${currentQuestion.correctIndex === idx ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-gray-500">SEÇENEK {String.fromCharCode(65+idx)}</span>
                                                <label className="flex items-center cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        name="correct" 
                                                        checked={currentQuestion.correctIndex === idx} 
                                                        onChange={() => setCurrentQuestion({...currentQuestion, correctIndex: idx})}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentQuestion.correctIndex === idx ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`}>
                                                        {currentQuestion.correctIndex === idx && <CheckCircle size={14} className="text-white" />}
                                                    </div>
                                                </label>
                                            </div>
                                            
                                            <input 
                                                type="text" 
                                                value={opt} 
                                                placeholder={`Seçenek ${String.fromCharCode(65+idx)} metni`}
                                                onChange={e => {
                                                    const newOpts = [...currentQuestion.options!];
                                                    newOpts[idx] = e.target.value;
                                                    setCurrentQuestion({...currentQuestion, options: newOpts});
                                                }}
                                                className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                 {currentQuestion.optionImages?.[idx] && (
                                                    <img src={currentQuestion.optionImages[idx]} className="w-8 h-8 rounded border object-cover" />
                                                )}
                                                <button 
                                                    onClick={() => handleImageUpload(idx)} 
                                                    className="text-xs text-gray-500 hover:text-primary flex items-center ml-auto"
                                                >
                                                    <ImageIcon size={12} className="mr-1"/> {currentQuestion.optionImages?.[idx] ? 'Değiştir' : 'Görsel Ekle'}
                                                </button>
                                            </div>
                                            
                                            {currentQuestion.correctIndex === idx && (
                                                <div className="text-[10px] text-green-700 font-bold text-center mt-1 bg-green-100 py-0.5 rounded">
                                                    DOĞRU CEVAP
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ÇÖZÜM AÇIKLAMASI</label>
                                    <input type="text" value={currentQuestion.explanation} onChange={e => setCurrentQuestion({...currentQuestion, explanation: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900" />
                                    <div className="flex items-center gap-2 mt-2">
                                        {currentQuestion.explanationImageUrl && (
                                            <img src={currentQuestion.explanationImageUrl} className="w-12 h-12 rounded border" />
                                        )}
                                        <button 
                                            onClick={() => handleImageUpload('EXPLANATION')} 
                                            className="text-xs text-gray-500 hover:text-primary flex items-center"
                                        >
                                            <ImageIcon size={12} className="mr-1"/> {currentQuestion.explanationImageUrl ? 'Görseli Değiştir' : 'Çözüm Görseli Ekle'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4 border-t border-gray-100">
                                     <button onClick={() => setEditorStep('META')} className="text-gray-500 font-bold text-sm">← Geri Dön</button>
                                     <div className="flex gap-2">
                                        <button onClick={handleCancelEditQuestion} className="text-gray-400 text-xs font-bold hover:text-gray-600 px-2 border border-transparent hover:border-gray-200 rounded">
                                            İptal / Temizle
                                        </button>
                                        
                                        <button onClick={handleSaveQuestion} className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center">
                                            {currentQuestion.id ? <Save size={16} className="mr-2"/> : <Plus size={16} className="mr-1"/>}
                                            {currentQuestion.id ? 'Güncelle' : 'Listeye Ekle'}
                                        </button>
                                        <button onClick={handleFinishExam} className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center"><Save size={16} className="mr-2"/> Sınavı Tamamla</button>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        {/* TAB NAVIGATION */}
        {tab !== 'EXAM_EDITOR' && (
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
                {Object.entries(TAB_LABELS).filter(([k]) => k !== 'EXAM_EDITOR').map(([key, label]) => (
                    <button 
                        key={key} 
                        onClick={() => setTab(key as any)}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${tab === key ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        )}

        {renderContent()}
        
        {/* ADD USER MODAL */}
        {showUserModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Yeni Kullanıcı Ekle</h3>
                        <button onClick={() => setShowUserModal(false)}><X className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <input type="text" placeholder="Ad Soyad" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 outline-none text-gray-900"/>
                        <input type="email" placeholder="E-posta" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 outline-none text-gray-900"/>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 outline-none text-gray-900">
                            <option value="STUDENT">Öğrenci</option>
                            <option value="TEACHER">Eğitmen</option>
                            <option value="ADMIN">Yönetici</option>
                        </select>
                        <button onClick={handleAddUser} className="w-full bg-primary text-white py-3 rounded-xl font-bold">Oluştur</button>
                    </div>
                </div>
            </div>
        )}

        {/* USER DETAILS MODAL */}
        {selectedUser && (
             <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl h-[600px] flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <img src={selectedUser.avatar} className="w-16 h-16 rounded-full bg-gray-100"/>
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">{selectedUser.name}</h3>
                                <div className="text-gray-500 text-sm">{selectedUser.email}</div>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">{selectedUser.role}</span>
                                    {selectedUser.isPremium && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Premium</span>}
                                    {selectedUser.isBanned && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">Yasaklı</span>}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)}><X className="text-gray-400 hover:text-gray-600"/></button>
                    </div>

                    <div className="flex gap-2 mb-4 border-b border-gray-100 pb-1">
                        <button onClick={() => setUserModalTab('HISTORY')} className={`pb-2 px-2 text-sm font-bold ${userModalTab === 'HISTORY' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>İşlemler</button>
                        <button onClick={() => setUserModalTab('LOGS')} className={`pb-2 px-2 text-sm font-bold ${userModalTab === 'LOGS' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>Log Kayıtları</button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {userModalTab === 'HISTORY' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-700 mb-3 text-sm">Hesap Yönetimi</h4>
                                    <div className="space-y-2">
                                        <button onClick={() => resetUserPassword(selectedUser.id)} className="w-full text-left text-xs font-bold text-gray-600 bg-white p-3 rounded-xl border hover:border-primary">Şifre Sıfırlama E-postası Gönder</button>
                                        
                                        {!selectedUser.isPremium && (
                                            <button onClick={() => giftPremium(selectedUser.id)} className="w-full text-left text-xs font-bold text-yellow-600 bg-white p-3 rounded-xl border hover:border-yellow-400 flex items-center">
                                                <Gift size={14} className="mr-2"/> Premium Hediye Et
                                            </button>
                                        )}
                                        
                                        {selectedUser.isBanned ? (
                                            <button onClick={() => unbanUser(selectedUser.id)} className="w-full text-left text-xs font-bold text-green-600 bg-white p-3 rounded-xl border hover:border-green-400 flex items-center">
                                                <CheckCircle size={14} className="mr-2"/> Yasağı Kaldır
                                            </button>
                                        ) : (
                                            <button onClick={() => banUser(selectedUser.id)} className="w-full text-left text-xs font-bold text-red-600 bg-white p-3 rounded-xl border hover:border-red-400 flex items-center">
                                                <Lock size={14} className="mr-2"/> Kullanıcıyı Yasakla
                                            </button>
                                        )}

                                        <button onClick={() => {if(window.confirm('Silmek istediğinize emin misiniz?')) { deleteUser(selectedUser.id); setSelectedUser(null); }}} className="w-full text-left text-xs font-bold text-red-600 bg-white p-3 rounded-xl border hover:border-red-400 flex items-center">
                                            <Trash2 size={14} className="mr-2"/> Hesabı Sil
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-700 mb-3 text-sm">Rol Değişimi</h4>
                                    <div className="space-y-2">
                                        <select 
                                            value={editUserRole || selectedUser.role} 
                                            onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm"
                                        >
                                            <option value={UserRole.STUDENT}>STUDENT</option>
                                            <option value={UserRole.TEACHER}>TEACHER</option>
                                            <option value={UserRole.ADMIN}>ADMIN</option>
                                        </select>
                                        <button 
                                            onClick={handleUpdateUserRole}
                                            disabled={!editUserRole || editUserRole === selectedUser.role}
                                            className="w-full bg-gray-800 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                                        >
                                            Rolü Güncelle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userModalTab === 'LOGS' && (
                            <div className="space-y-2">
                                {selectedUserLogs.length === 0 && <div className="text-gray-400 text-sm text-center py-4">Kayıt bulunamadı.</div>}
                                {selectedUserLogs.map(log => (
                                    <div key={log.id} className="p-3 bg-white border border-gray-100 rounded-xl text-xs">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-gray-700">{log.action}</span>
                                            <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="text-gray-500">{log.details}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
             </div>
        )}

        {showBulkModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center"><FileSpreadsheet className="mr-2 text-green-600"/> Toplu Soru Yükle</h3>
                        <button onClick={() => setShowBulkModal(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 border border-blue-100">
                        <p className="font-bold mb-2 flex items-center"><AlertTriangle size={16} className="mr-1"/> Nasıl Kullanılır?</p>
                        <p>1. "Şablon İndir" butonuna basarak CSV dosyasını indirin.</p>
                        <p>2. Dosyayı Excel ile açıp doldurun.</p>
                        <p>3. Hücreleri Excel'den kopyalayın (Ctrl+C) ve aşağıdaki alana yapıştırın (Ctrl+V).</p>
                        <p className="mt-2 font-mono text-xs bg-white p-2 rounded border border-blue-200">Soru Metni | A | B | C | D | Doğru Cevap (1-4) | Görsel URL (Opsiyonel) | Açıklama</p>
                    </div>

                    <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-900 mb-4 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Verilerinizi buraya yapıştırın..."
                    ></textarea>

                    <div className="flex justify-end gap-3">
                        <button onClick={handleDownloadTemplate} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-primary flex items-center"><Download size={16} className="mr-1"/> Şablon İndir (.csv)</button>
                        <button onClick={handleBulkImport} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors">İçe Aktar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
