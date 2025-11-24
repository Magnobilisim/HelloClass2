
import React, { useState, useEffect } from 'react';
import { useApp } from '../services/store';
import { MarketplaceExam, Question } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, DollarSign, Users, FileText, Eye, CheckCircle, Clock, Edit, Trash2, Archive, Image as ImageIcon, Upload, FileSpreadsheet, AlertTriangle, X, Save, Download, LayoutGrid } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user, marketplaceExams, createMarketplaceExam, updateMarketplaceExam, deleteMarketplaceExam, subjects, subjectConfig } = useApp();
  
  const [view, setView] = useState<'OVERVIEW' | 'LIST' | 'EDITOR'>('OVERVIEW');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  
  const [editingExam, setEditingExam] = useState<Partial<MarketplaceExam>>({});
  const [editorStep, setEditorStep] = useState<'META' | 'QUESTIONS'>('META');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
      text: '', 
      options: ['', '', '', ''], 
      optionImages: ['', '', '', ''],
      correctIndex: 0, 
      difficulty: 3, 
      explanation: '',
      explanationImageUrl: ''
  });
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  if (!user || !user.isTeacherApproved) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
              <div className="p-6 bg-orange-50 rounded-full mb-4 animate-pulse">
                <Clock size={64} className="text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Onay Bekleniyor</h2>
              <p className="text-gray-500 mt-2 max-w-md">Eğitmen başvurunuz şu anda yöneticiler tarafından inceleniyor. Onaylandığında paneliniz aktif olacaktır.</p>
          </div>
      )
  }

  const myExams = marketplaceExams.filter(e => e.creatorId === user.id && !e.isDeleted);
  const totalSales = myExams.reduce((acc, e) => acc + e.sales, 0);
  const totalRevenue = user.walletBalance || 0;
  
  const filteredExams = myExams.filter(e => filterStatus === 'ALL' || e.status === filterStatus);

  // Dynamic Chart Data: Top Selling Exams
  const chartData = myExams
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map(e => ({
          name: e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title,
          sales: e.sales
      }));

  const handleEditExam = (exam: MarketplaceExam) => {
      setEditingExam({ ...exam });
      setEditorStep('META');
      setView('EDITOR');
  };

  const handleNewExam = () => {
      setEditingExam({
          title: '',
          subject: subjects[0],
          topic: '',
          level: '',
          description: '',
          price: 0,
          questionCount: 10,
          duration: 20,
          status: 'DRAFT',
          questions: []
      });
      setEditorStep('META');
      setView('EDITOR');
  };

  const handleSaveMeta = () => {
      if (!editingExam.title?.trim()) {
          showToast('Lütfen sınav başlığını girin.', 'error');
          return;
      }
      if (!editingExam.description?.trim()) {
          showToast('Lütfen sınav açıklamasını girin.', 'error');
          return;
      }
      if ((editingExam.price ?? 0) < 0) {
          showToast('Fiyat negatif olamaz.', 'error');
          return;
      }
      if (!editingExam.duration || editingExam.duration <= 0) {
          showToast('Lütfen geçerli bir sınav süresi girin.', 'error');
          return;
      }
      
      if (editingExam.id) {
          // Safety Check: Prevent published status if empty
          const status = editingExam.status === 'PUBLISHED' && (!editingExam.questions || editingExam.questions.length === 0) ? 'DRAFT' : editingExam.status;
          if (status !== editingExam.status) {
              showToast('Soru olmadığı için Taslak olarak kaydedildi.', 'success');
          } else {
              showToast('Sınav bilgileri güncellendi.', 'success');
          }
          updateMarketplaceExam(editingExam.id, { ...editingExam, status });
      } else {
          setEditorStep('QUESTIONS');
      }
  };

  const handleFinishExam = () => {
      if (!editingExam.title?.trim() || !editingExam.description?.trim()) {
          showToast('Başlık ve açıklama alanları zorunludur.', 'error');
          return;
      }

      // CRITICAL: Prevent publishing if no questions
      let finalStatus = editingExam.status;
      if (finalStatus === 'PUBLISHED' && (!editingExam.questions || editingExam.questions.length === 0)) {
          finalStatus = 'DRAFT';
          showToast('Uyarı: Soru eklenmediği için Taslak olarak kaydedildi.', 'error');
      }

      const finalExam = { ...editingExam, status: finalStatus };

      if (editingExam.id) {
           updateMarketplaceExam(editingExam.id, finalExam);
           if (finalStatus === editingExam.status) showToast('Sınav kaydedildi.', 'success');
      } else {
           createMarketplaceExam(finalExam as Omit<MarketplaceExam, 'id' | 'creatorName' | 'sales' | 'rating' | 'creatorId'>);
           showToast('Yeni sınav oluşturuldu.', 'success');
      }
      setView('LIST');
  };

  const handleDeleteExam = (id: string) => {
      if (window.confirm('Bu sınavı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
          deleteMarketplaceExam(id);
          showToast('Sınav silindi.', 'success');
      }
  };

  const handleArchiveExam = (id: string) => {
      updateMarketplaceExam(id, { status: 'ARCHIVED' });
      showToast('Sınav arşivlendi.', 'success');
  };

  const handleSaveQuestion = () => {
      if (!currentQuestion.text || !currentQuestion.options || currentQuestion.options.some(o => !o)) {
          showToast('Lütfen soru metnini ve tüm şıkları doldurun.', 'error');
          return;
      }

      const newQ: Question = {
          id: currentQuestion.id || `q_${Date.now()}`,
          subject: editingExam.subject || 'Genel',
          text: currentQuestion.text!,
          options: currentQuestion.options!,
          correctIndex: currentQuestion.correctIndex || 0,
          explanation: currentQuestion.explanation || '',
          difficulty: currentQuestion.difficulty || 3,
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

      setCurrentQuestion({ 
          text: '', 
          options: ['', '', '', ''], 
          optionImages: ['', '', '', ''],
          correctIndex: 0, 
          difficulty: 3, 
          explanation: '', 
          imageUrl: '',
          explanationImageUrl: ''
        });
      showToast(currentQuestion.id ? 'Soru güncellendi.' : 'Soru eklendi.', 'success');
  };

  const handleEditQuestion = (q: Question) => {
      setCurrentQuestion({ ...q });
  };

  const handleCancelEditQuestion = () => {
      setCurrentQuestion({ 
          text: '', 
          options: ['', '', '', ''], 
          optionImages: ['', '', '', ''],
          correctIndex: 0, 
          difficulty: 3, 
          explanation: '', 
          imageUrl: '',
          explanationImageUrl: ''
        });
  };

  const removeQuestion = (qId: string) => {
      setEditingExam(prev => ({
          ...prev,
          questions: prev.questions?.filter(q => q.id !== qId),
          questionCount: (prev.questions?.length || 1) - 1
      }));
      // RESET EDITOR IF DELETED QUESTION WAS BEING EDITED
      if (currentQuestion.id === qId) {
          handleCancelEditQuestion();
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

  const selectedSubjectCat = subjectConfig.find(s => s.name === editingExam.subject);

  return (
    <div className="space-y-8 relative animate-fade-in">
        {toast && (
            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-white animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {toast.msg}
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-display font-bold text-gray-800">Eğitmen Paneli</h2>
            {view !== 'EDITOR' && (
                <div className="flex bg-white p-1 rounded-lg shadow-sm">
                    <button onClick={() => setView('OVERVIEW')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'OVERVIEW' ? 'bg-primary text-white' : 'text-gray-500'}`}>Genel Bakış</button>
                    <button onClick={() => setView('LIST')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'LIST' ? 'bg-primary text-white' : 'text-gray-500'}`}>Sınavlarım</button>
                    <button onClick={handleNewExam} className="px-4 py-2 rounded-md text-sm font-bold text-primary hover:bg-primary/10 flex items-center transition-colors"><Plus size={16} className="mr-1"/> Yeni Sınav</button>
                </div>
            )}
        </div>

        {view === 'OVERVIEW' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24}/></div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">₺{totalRevenue.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">Toplam Kazanç</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{totalSales}</div>
                                <div className="text-xs text-gray-500">Toplam Öğrenci</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FileText size={24}/></div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{myExams.length}</div>
                                <div className="text-xs text-gray-500">Aktif Sınav</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[300px]">
                    <h3 className="font-bold text-gray-700 mb-4">En Çok Satan Sınavlar</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="sales" fill="#10B981" radius={[4,4,0,0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {view === 'LIST' && (
            <div className="space-y-4 animate-fade-in">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${filterStatus === status ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                        >
                            {status === 'ALL' ? 'Tümü' : 
                             status === 'PUBLISHED' ? 'Yayında' : 
                             status === 'DRAFT' ? 'Taslak' : 'Arşiv'}
                        </button>
                    ))}
                </div>

                {filteredExams.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LayoutGrid size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-gray-600 font-bold">Sınav Bulunamadı</h3>
                        <p className="text-gray-400 text-sm mt-2 mb-4">Bu filtrede sınavınız yok.</p>
                        <button onClick={handleNewExam} className="text-primary font-bold text-sm hover:underline">Yeni Bir Tane Oluştur</button>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-800 font-bold border-b">
                                    <tr>
                                        <th className="p-4">Sınav Adı</th>
                                        <th className="p-4">Ders</th>
                                        <th className="p-4">Fiyat</th>
                                        <th className="p-4">Satış</th>
                                        <th className="p-4">Durum</th>
                                        <th className="p-4 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredExams.map(exam => (
                                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-bold text-gray-800">{exam.title}</td>
                                            <td className="p-4">
                                                {exam.subject}
                                                {exam.level && <span className="ml-2 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">{exam.level}</span>}
                                            </td>
                                            <td className="p-4 font-bold text-green-600">{exam.price === 0 ? 'ÜCRETSİZ' : `₺${exam.price}`}</td>
                                            <td className="p-4">{exam.sales}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold 
                                                    ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
                                                    exam.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                                    {exam.status === 'PUBLISHED' ? 'YAYINDA' : 
                                                    exam.status === 'DRAFT' ? 'TASLAK' : 'ARŞİV'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditExam(exam)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Düzenle"><Edit size={18}/></button>
                                                    <button onClick={() => handleArchiveExam(exam.id)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Arşivle"><Archive size={18}/></button>
                                                    <button onClick={() => handleDeleteExam(exam.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Sil"><Trash2 size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-4">
                            {filteredExams.map(exam => (
                                <div key={exam.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold 
                                                    ${exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
                                                    exam.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                                {exam.status === 'PUBLISHED' ? 'YAYINDA' : exam.status === 'DRAFT' ? 'TASLAK' : 'ARŞİV'}
                                            </span>
                                        </div>
                                        <div className="font-bold text-green-600 text-sm">{exam.price === 0 ? 'ÜCRETSİZ' : `₺${exam.price}`}</div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{exam.title}</h3>
                                    <div className="text-xs text-gray-500 mb-4">{exam.subject} {exam.level && `• ${exam.level}`} • {exam.sales} Satış</div>
                                    
                                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
                                        <button onClick={() => handleEditExam(exam)} className="px-3 py-2 text-blue-600 bg-blue-50 rounded-lg text-xs font-bold flex items-center"><Edit size={14} className="mr-1"/> Düzenle</button>
                                        <button onClick={() => handleArchiveExam(exam.id)} className="px-3 py-2 text-yellow-600 bg-yellow-50 rounded-lg text-xs font-bold"><Archive size={14}/></button>
                                        <button onClick={() => handleDeleteExam(exam.id)} className="px-3 py-2 text-red-600 bg-red-50 rounded-lg text-xs font-bold"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        )}

        {view === 'EDITOR' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button onClick={() => setEditorStep('META')} className={`text-sm font-bold ${editorStep === 'META' ? 'text-primary' : 'text-gray-400'}`}>1. Temel Bilgiler</button>
                        <button onClick={() => setEditorStep('QUESTIONS')} className={`text-sm font-bold ${editorStep === 'QUESTIONS' ? 'text-primary' : 'text-gray-400'}`}>2. Sorular ({editingExam.questions?.length || 0})</button>
                    </div>
                    <button onClick={() => setView('LIST')} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
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
