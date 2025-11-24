
import React, { useState, useEffect } from 'react';
import { useApp } from '../services/store';
import { UserRole, SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PLANS, SHOP_ITEMS } from '../constants';
import { MapPin, Award, MessageCircle, Settings, ChevronLeft, User as UserIcon, CreditCard, Lock, Mail, Check, LogOut, TrendingUp, UserPlus, BadgeCheck, Edit3, RefreshCw, Calendar, Star, Copy, Ticket, GraduationCap, Languages, Trash2, ShieldCheck, Smartphone } from 'lucide-react';

type SettingsView = 'NONE' | 'ACCOUNT' | 'SUBSCRIPTION' | 'CHECKOUT' | 'PRIVACY' | 'HISTORY' | 'FOLLOWERS' | 'REFERRAL';

export const ProfileScreen = () => {
  const { user, viewedProfileId, getUserById, setViewedProfileId, updateUser, purchasePremium, cancelPremium, logout, deleteMyAccount, setPage } = useApp();
  const [currentView, setCurrentView] = useState<SettingsView>('NONE');
  
  // Account Edit States
  const [editName, setEditName] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editEngLevel, setEditEngLevel] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Checkout States
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const isMyProfile = !viewedProfileId || viewedProfileId === user?.id;
  const profileUser = isMyProfile ? user : getUserById(viewedProfileId!);

  const MOCK_FOLLOWERS = Array.from({length: 8}).map((_, i) => ({
      id: i, 
      name: `Öğrenci ${i+1}`, 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i+100}`,
      school: i % 2 === 0 ? 'Cumhuriyet Koleji' : 'Atatürk İÖO'
  }));

  useEffect(() => {
      if(user) {
          setEditName(user.name);
          setEditSchool(user.school);
          setEditAvatar(user.avatar);
          setEditGrade(user.grade || '');
          setEditEngLevel(user.englishLevel || '');
      }
  }, [user]);

  const handleSaveAccount = () => {
      updateUser({ name: editName, school: editSchool, avatar: editAvatar, grade: editGrade, englishLevel: editEngLevel });
      setSuccessMsg('Bilgiler güncellendi!');
      setTimeout(() => setSuccessMsg(null), 2000);
  };

  const randomizeAvatar = () => {
      const randomSeed = Math.floor(Math.random() * 10000);
      setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  const getFrameStyle = (frameId?: string) => {
      if (!frameId) return 'border-4 border-white';
      const item = SHOP_ITEMS.find(i => i.id === frameId);
      return item ? item.imageUrl : 'border-4 border-white';
  };

  const startCheckout = (planId: string) => {
      setSelectedPlanId(planId);
      setCurrentView('CHECKOUT');
  };

  const handlePayment = () => {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
          alert("Lütfen tüm kart bilgilerini doldurun.");
          return;
      }
      
      setPaymentProcessing(true);
      
      // Simulate API Call
      setTimeout(() => {
          if (selectedPlanId) {
              purchasePremium(selectedPlanId as SubscriptionPlan);
              setPaymentProcessing(false);
              setShowConfetti(true);
              
              // Reset and Redirect after success
              setTimeout(() => {
                  setShowConfetti(false);
                  setCurrentView('NONE');
                  // Reset form
                  setCardName('');
                  setCardNumber('');
                  setCardExpiry('');
                  setCardCvc('');
              }, 3000);
          }
      }, 2000);
  };

  // Card Input Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').substring(0, 16);
      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
          val = val.substring(0, 2) + '/' + val.substring(2);
      }
      setCardExpiry(val);
  };

  if (!profileUser) return <div>Kullanıcı bulunamadı.</div>;

  const userFrameStyle = getFrameStyle(profileUser.equippedFrame);

  if (currentView === 'REFERRAL' && isMyProfile) {
      return (
          <div className="animate-fade-in space-y-6">
               <button onClick={() => setCurrentView('NONE')} className="flex items-center text-gray-600 font-bold hover:text-primary transition-colors">
                  <ChevronLeft size={20} className="mr-1"/> Profile Dön
                </button>
                
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg text-center">
                    <Ticket size={64} className="mx-auto mb-4 opacity-80" />
                    <h2 className="text-3xl font-display font-bold mb-2">Arkadaşını Davet Et</h2>
                    <p className="text-blue-100 mb-6">Arkadaşın senin kodunla üye olsun, hem sen 500 Puan kazan hem o 250 Puan kazansın!</p>
                    
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 flex items-center justify-between max-w-xs mx-auto">
                        <span className="font-mono text-2xl font-bold tracking-widest">{profileUser.inviteCode}</span>
                        <button onClick={() => navigator.clipboard.writeText(profileUser.inviteCode)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <Copy size={20} />
                        </button>
                    </div>
                    <p className="text-xs mt-2 opacity-60">Kodu kopyalamak için butona bas.</p>
                </div>
                
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Nasıl Çalışır?</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                            <p className="text-gray-600 text-sm">Kodu arkadaşınla paylaş.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">2</div>
                            <p className="text-gray-600 text-sm">Arkadaşın kayıt olurken bu kodu girsin.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">3</div>
                            <p className="text-gray-600 text-sm font-bold">İkiniz de anında puan kazanın!</p>
                        </div>
                    </div>
                </div>
          </div>
      )
  }

  if (currentView === 'HISTORY') {
      return (
        <div className="animate-fade-in space-y-6">
          <button onClick={() => setCurrentView('NONE')} className="flex items-center text-gray-600 font-bold hover:text-primary transition-colors">
            <ChevronLeft size={20} className="mr-1"/> Profile Dön
          </button>
          <h2 className="text-xl font-display font-bold text-gray-800">Sınav Geçmişi</h2>
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              {profileUser.examHistory && profileUser.examHistory.length > 0 ? (
                  profileUser.examHistory.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <div>
                            <div className="font-bold text-gray-800">{h.title}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold mr-2">{h.subject}</span>
                                <Calendar size={12} className="mr-1"/> {h.date}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`font-mono font-bold text-lg ${h.score >= 90 ? 'text-green-500' : h.score >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {h.score}p
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">{h.correctCount}/{h.totalQuestions} Doğru</div>
                        </div>
                    </div>
                  ))
              ) : (
                  <div className="p-8 text-center text-gray-400">
                      Henüz tamamlanmış bir sınavınız yok.
                  </div>
              )}
          </div>
        </div>
      );
  }

  if (currentView === 'FOLLOWERS') {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => setCurrentView('NONE')} className="flex items-center text-gray-600 font-bold hover:text-primary transition-colors">
          <ChevronLeft size={20} className="mr-1"/> Profile Dön
        </button>
        <h2 className="text-xl font-display font-bold text-gray-800">Takipçiler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_FOLLOWERS.map(f => (
                <div key={f.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <img src={f.avatar} className="w-12 h-12 rounded-full bg-gray-50"/>
                    <div>
                        <div className="font-bold text-gray-800 text-sm">{f.name}</div>
                        <div className="text-xs text-gray-500">{f.school}</div>
                    </div>
                    <button className="ml-auto text-xs font-bold text-gray-700 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors">Profili Gör</button>
                </div>
            ))}
        </div>
      </div>
    );
}

  if (currentView === 'ACCOUNT') {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => setCurrentView('NONE')} className="flex items-center text-gray-600 font-bold hover:text-primary transition-colors">
          <ChevronLeft size={20} className="mr-1"/> Geri Dön
        </button>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-display font-bold text-gray-800 mb-6 flex items-center">
            <UserIcon className="mr-3 text-primary"/> Hesap Bilgileri
          </h2>
          
          {/* Avatar Editor */}
          <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-2xl">
              <img src={editAvatar} className="w-20 h-20 rounded-full bg-white border-2 border-gray-200" />
              <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">PROFIL FOTOĞRAFI</p>
                  <button 
                    onClick={randomizeAvatar}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 flex items-center"
                  >
                      <RefreshCw size={14} className="mr-2"/> Rastgele Oluştur
                  </button>
              </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ad Soyad</label>
              <input 
                type="text" 
                maxLength={50}
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-posta</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input type="email" value={profileUser.email} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-500 cursor-not-allowed"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Okul</label>
              <input 
                type="text" 
                maxLength={60}
                value={editSchool} 
                onChange={(e) => setEditSchool(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            
            {profileUser.role === UserRole.STUDENT && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf/Seviye</label>
                        <select 
                            value={editGrade} 
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        >
                            <option value="">Seçiniz</option>
                            <option value="1. Sınıf">1. Sınıf</option>
                            <option value="2. Sınıf">2. Sınıf</option>
                            <option value="3. Sınıf">3. Sınıf</option>
                            <option value="4. Sınıf">4. Sınıf</option>
                            <option value="5. Sınıf">5. Sınıf</option>
                            <option value="6. Sınıf">6. Sınıf</option>
                            <option value="7. Sınıf">7. Sınıf</option>
                            <option value="8. Sınıf (LGS)">8. Sınıf (LGS)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">İngilizce Seviyesi</label>
                        <select 
                            value={editEngLevel} 
                            onChange={(e) => setEditEngLevel(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        >
                            <option value="">Seçiniz</option>
                            <option value="A1 (Başlangıç)">A1 (Başlangıç)</option>
                            <option value="A2 (Temel)">A2 (Temel)</option>
                            <option value="B1 (Orta)">B1 (Orta)</option>
                            <option value="B2 (Üst Orta)">B2 (Üst Orta)</option>
                        </select>
                    </div>
                </div>
            )}

          </div>
          <button 
            onClick={handleSaveAccount}
            className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors active:scale-95"
          >
            {successMsg ? <span className="flex justify-center items-center"><Check size={18} className="mr-2"/> {successMsg}</span> : 'Değişiklikleri Kaydet'}
          </button>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={deleteMyAccount}
                className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center"
              >
                  <Trash2 size={18} className="mr-2"/> Hesabımı Kalıcı Olarak Sil
              </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'CHECKOUT' && selectedPlanId) {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId);
      if (!plan) return null;

      return (
          <div className="animate-fade-in relative">
              {showConfetti && (
                <>
                    <div className="confetti" style={{left: '10%', animationDelay: '0s', backgroundColor: '#ef4444'}}></div>
                    <div className="confetti" style={{left: '30%', animationDelay: '0.5s', backgroundColor: '#3b82f6'}}></div>
                    <div className="confetti" style={{left: '50%', animationDelay: '0.2s', backgroundColor: '#22c55e'}}></div>
                    <div className="confetti" style={{left: '70%', animationDelay: '0.7s', backgroundColor: '#f59e0b'}}></div>
                    <div className="confetti" style={{left: '90%', animationDelay: '0.4s', backgroundColor: '#a855f7'}}></div>
                </>
              )}

              <button onClick={() => setCurrentView('SUBSCRIPTION')} className="flex items-center text-gray-600 font-bold hover:text-primary transition-colors mb-6">
                  <ChevronLeft size={20} className="mr-1"/> Planlara Dön
              </button>

              {showConfetti ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-green-100">
                      <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                          <Check size={48} strokeWidth={4}/>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">Ödeme Başarılı!</h2>
                      <p className="text-gray-500 text-lg">Artık Premium üyesiniz. Tüm özelliklerin keyfini çıkarın.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Order Summary */}
                      <div className="lg:col-span-1 space-y-6">
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                              <h3 className="font-bold text-gray-800 mb-4 text-lg">Sipariş Özeti</h3>
                              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                                  <div>
                                      <div className="font-bold text-gray-700">{plan.title}</div>
                                      <div className="text-xs text-gray-400">HelloClass Premium</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-gray-900">₺{plan.price}</div>
                                      {plan.discount && <div className="text-xs text-green-600 font-bold">{plan.discount}</div>}
                                  </div>
                              </div>
                              <div className="flex justify-between items-center text-xl font-black text-primary">
                                  <span>Toplam</span>
                                  <span>₺{plan.price}</span>
                              </div>
                          </div>
                          
                          <div className="bg-green-50 p-4 rounded-2xl flex items-start gap-3 border border-green-100">
                              <ShieldCheck className="text-green-600 flex-shrink-0" size={24}/>
                              <div>
                                  <h4 className="font-bold text-green-800 text-sm">Güvenli Ödeme</h4>
                                  <p className="text-xs text-green-700 mt-1">Bilgileriniz 256-bit SSL ile korunmaktadır. Ödeme altyapımız uluslararası standartlardadır.</p>
                              </div>
                          </div>
                      </div>

                      {/* Payment Form */}
                      <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                              <CreditCard className="mr-3 text-primary"/> Ödeme Bilgileri
                          </h2>

                          <div className="flex gap-4 mb-8 border-b border-gray-100 pb-1">
                              <button className="pb-3 border-b-2 border-primary font-bold text-primary text-sm flex items-center">
                                  <CreditCard size={16} className="mr-2"/> Kredi Kartı
                              </button>
                              <button className="pb-3 border-b-2 border-transparent text-gray-400 font-bold text-sm flex items-center hover:text-gray-600">
                                  <Smartphone size={16} className="mr-2"/> Apple Pay
                              </button>
                          </div>

                          <div className="space-y-6">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">KART SAHİBİ</label>
                                  <input 
                                      type="text" 
                                      value={cardName}
                                      onChange={(e) => setCardName(e.target.value)}
                                      placeholder="Ad Soyad"
                                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">KART NUMARASI</label>
                                  <div className="relative">
                                      <CreditCard className="absolute left-4 top-4 text-gray-400" size={20}/>
                                      <input 
                                          type="text" 
                                          value={cardNumber}
                                          onChange={handleCardNumberChange}
                                          placeholder="0000 0000 0000 0000"
                                          maxLength={19}
                                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">SON KULLANMA (AY/YIL)</label>
                                      <input 
                                          type="text" 
                                          value={cardExpiry}
                                          onChange={handleExpiryChange}
                                          placeholder="MM/YY"
                                          maxLength={5}
                                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-center"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">CVC / CVV</label>
                                      <div className="relative">
                                          <Lock className="absolute left-4 top-4 text-gray-400" size={18}/>
                                          <input 
                                              type="password" 
                                              value={cardCvc}
                                              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                                              placeholder="•••"
                                              maxLength={3}
                                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <button 
                              onClick={handlePayment}
                              disabled={paymentProcessing}
                              className="w-full mt-8 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center"
                          >
                              {paymentProcessing ? (
                                  <>
                                      <RefreshCw className="animate-spin mr-2" size={20}/> İşleniyor...
                                  </>
                              ) : (
                                  <>Ödemeyi Tamamla (₺{plan.price})</>
                              )}
                          </button>
                          
                          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                              <Lock size={12}/> 256-bit SSL Güvenli Ödeme
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (currentView === 'SUBSCRIPTION') {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => setCurrentView('NONE')} className="flex items-center text-gray-600 font-bold hover:text-primary transition-colors">
          <ChevronLeft size={20} className="mr-1"/> Geri Dön
        </button>
        
        <div className="text-center mb-4">
            <h2 className="text-2xl font-display font-bold text-gray-800">Premium'a Geçin 🚀</h2>
            <p className="text-gray-500">Sınırsız sınav, detaylı analizler ve reklamsız deneyim.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUBSCRIPTION_PLANS.map(plan => (
                <div key={plan.id} className={`bg-white p-6 rounded-3xl shadow-sm border transition-all ${profileUser.isPremium ? 'opacity-50' : 'hover:shadow-md hover:border-primary'} ${plan.id === 'YEARLY' ? 'border-primary/50 ring-4 ring-primary/5' : 'border-gray-100'}`}>
                    {plan.discount && <div className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md mb-2">{plan.discount}</div>}
                    <h3 className="font-bold text-lg text-gray-800">{plan.title}</h3>
                    <div className="text-2xl font-bold text-primary my-2">₺{plan.price}</div>
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                        <li className="flex items-center"><Check size={14} className="text-green-500 mr-2"/> Reklamsız Deneyim</li>
                        <li className="flex items-center"><Check size={14} className="text-green-500 mr-2"/> Sınırsız AI Soru Üretimi</li>
                        <li className="flex items-center"><Check size={14} className="text-green-500 mr-2"/> Tüm Ücretli Sınavlara %10 İndirim</li>
                    </ul>
                    <button 
                        disabled={profileUser.isPremium}
                        onClick={() => startCheckout(plan.id)} // CHANGED: Go to Checkout instead of direct buy
                        className={`w-full py-3 rounded-xl font-bold transition-colors ${profileUser.isPremium ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white hover:bg-primary-dark'}`}
                    >
                        {profileUser.isPremium ? 'Aktif Plan' : 'Seç ve Başla'}
                    </button>
                </div>
            ))}
        </div>
        
        {profileUser.isPremium && (
            <button onClick={cancelPremium} className="w-full text-red-500 font-bold text-sm py-4 hover:bg-red-50 rounded-xl transition-colors">
                Mevcut Aboneliği İptal Et
            </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary-light to-primary opacity-20"></div>
         
         <div className="relative pt-12 flex flex-col items-center text-center">
            <div className="relative group">
                <img 
                    src={profileUser.avatar} 
                    alt={profileUser.name}
                    className={`w-28 h-28 rounded-full shadow-lg bg-white object-cover ${userFrameStyle}`}
                />
                {isMyProfile && (
                    <button 
                        onClick={() => setCurrentView('ACCOUNT')}
                        className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                        <Edit3 size={24}/>
                    </button>
                )}
                {profileUser.role === UserRole.TEACHER && (
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white p-1.5 rounded-full shadow-md" title="Eğitmen">
                        <BadgeCheck size={16} />
                    </div>
                )}
                {profileUser.isPremium && (
                    <div className="absolute bottom-1 right-1 bg-yellow-400 text-white p-1.5 rounded-full shadow-md" title="Premium Üye">
                        <Award size={16} fill="white" />
                    </div>
                )}
            </div>

            <h2 className="mt-4 text-2xl font-display font-bold text-gray-800">{profileUser.name}</h2>
            <div className="flex items-center text-gray-500 text-sm mt-1 font-medium">
                <MapPin size={14} className="mr-1" />
                {profileUser.role === UserRole.TEACHER ? 'Onaylı Eğitmen' : profileUser.school}
            </div>
            
            {profileUser.role === UserRole.STUDENT && (
                <div className="flex justify-center gap-2 mt-3">
                    {profileUser.grade && (
                        <span className="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            <GraduationCap size={14} className="mr-1"/> {profileUser.grade}
                        </span>
                    )}
                    {profileUser.englishLevel && (
                        <span className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                            <Languages size={14} className="mr-1"/> {profileUser.englishLevel}
                        </span>
                    )}
                </div>
            )}

            {!isMyProfile && (
                <button className="mt-4 bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary/30 flex items-center hover:bg-primary-dark active:scale-95 transition-all">
                    <MessageCircle size={18} className="mr-2" />
                    Mesaj Gönder
                </button>
            )}
         </div>

         <div className="grid grid-cols-3 gap-4 mt-8 border-t border-gray-100 pt-6">
            <div className="text-center cursor-default">
                <div className="text-2xl font-bold text-primary-dark">{profileUser.points}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Puan</div>
            </div>
            <div 
                onClick={() => setCurrentView('HISTORY')}
                className="text-center cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2"
            >
                <div className="text-2xl font-bold text-gray-800">
                    {(profileUser.examHistory?.length || 0) + (profileUser.purchasedExamIds?.length || 0)}
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sınav</div>
            </div>
            <div 
                onClick={() => setCurrentView('FOLLOWERS')}
                className="text-center cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2"
            >
                <div className="text-2xl font-bold text-gray-800">145</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Takipçi</div>
            </div>
         </div>
      </div>
      
      {isMyProfile && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden" onClick={() => setCurrentView('REFERRAL')}>
              <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <h3 className="font-bold text-xl mb-1">Arkadaşını Davet Et</h3>
                      <p className="text-indigo-100 text-sm">Her davet için 500 Puan kazan!</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                      <UserPlus size={24} />
                  </div>
              </div>
              <div className="absolute -right-6 -bottom-10 opacity-20">
                  <Ticket size={120} />
              </div>
          </div>
      )}

      {isMyProfile && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <Settings className="mr-2 text-gray-400" size={20}/>
                Ayarlar
            </h3>
            <div className="space-y-3">
                <button 
                    onClick={() => setCurrentView('ACCOUNT')}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 flex justify-between items-center transition-colors"
                >
                    Hesap Bilgileri
                    <span className="text-gray-300">›</span>
                </button>
                <button 
                    onClick={() => setCurrentView('SUBSCRIPTION')}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 flex justify-between items-center transition-colors"
                >
                    Abonelik Yönetimi
                    <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-md">
                        {profileUser.isPremium ? 'Premium' : 'Ücretsiz'}
                    </span>
                </button>
                
                <div className="pt-2 mt-2 border-t border-gray-50">
                    <button 
                        onClick={logout}
                        className="w-full text-left p-3 rounded-xl hover:bg-red-50 text-sm font-bold text-red-500 flex items-center transition-colors"
                    >
                        <LogOut size={18} className="mr-2" />
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
