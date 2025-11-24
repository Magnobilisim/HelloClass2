
import React, { useState } from 'react';
import { useApp } from '../services/store';
import { UserRole } from '../types';
import { SCHOOLS } from '../constants';
import { Sparkles, Mail, Lock, User, School as SchoolIcon, GraduationCap, Ticket, BookOpen, Languages } from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthScreen = () => {
  const { login, loginWithCredentials, register } = useApp();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(SCHOOLS[0]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  
  // New Fields for Student Registration
  const [grade, setGrade] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      const success = login(role);
      if (!success) setLoading(false);
    }, 800); 
  };

  const handleForgotPassword = () => {
      if (!email) {
          alert("Lütfen önce e-posta adresinizi girin.");
          return;
      }
      alert(`Şifre sıfırlama bağlantısı ${email} adresine gönderildi. (Simülasyon)`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'LOGIN') {
      if (!email || !password) {
        setError('Lütfen tüm alanları doldurun.');
        setLoading(false);
        return;
      }
      const success = await loginWithCredentials(email);
      if (!success) setLoading(false);
    } else {
      // Register Validation
      if (!name || !email || !password) {
        setError('Lütfen tüm alanları doldurun.');
        setLoading(false);
        return;
      }
      
      // Student specific validation
      if (!isTeacher && (!grade || !englishLevel)) {
          setError('Lütfen sınıf ve İngilizce seviyenizi seçin.');
          setLoading(false);
          return;
      }

      const success = await register(name, email, selectedSchool, isTeacher, inviteCode, grade, englishLevel);
      if (!success) setLoading(false);
    }
  };

  return (
    // Fix for Mobile Keyboard: Use h-screen and overflow-y-auto instead of min-h-screen flex-center
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 my-auto">
            
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light/20 rounded-full mb-4 text-primary-dark shadow-sm">
                <Sparkles size={32} />
            </div>
            <h1 className="font-display text-4xl font-bold text-gray-800 mb-2">HelloClass</h1>
            <p className="text-gray-500 font-medium">Eğitimin Sosyal Hali</p>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button 
                onClick={() => setMode('LOGIN')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'LOGIN' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Giriş Yap
            </button>
            <button 
                onClick={() => setMode('REGISTER')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'REGISTER' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Kayıt Ol
            </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
                <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">AD SOYAD</label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all text-gray-900"
                    placeholder="Örn: Ali Yılmaz"
                    />
                </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">E-POSTA</label>
                <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all text-gray-900"
                    placeholder="isim@okul.com"
                />
                </div>
            </div>

            {mode === 'REGISTER' && (
                <>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">OKUL / KURUM</label>
                    <div className="relative">
                    <SchoolIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <select 
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all appearance-none text-gray-900"
                    >
                        {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    </div>
                </div>

                {/* STUDENT ONLY FIELDS */}
                {!isTeacher && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">SINIF</label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <select 
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all appearance-none text-gray-900"
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
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">İNGİLİZCE</label>
                            <div className="relative">
                                <Languages className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <select 
                                    value={englishLevel}
                                    onChange={(e) => setEnglishLevel(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all appearance-none text-gray-900"
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="A1 (Başlangıç)">A1 (Başlangıç)</option>
                                    <option value="A2 (Temel)">A2 (Temel)</option>
                                    <option value="B1 (Orta)">B1 (Orta)</option>
                                    <option value="B2 (Üst Orta)">B2 (Üst Orta)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">DAVET KODU (OPSİYONEL)</label>
                    <div className="relative">
                    <Ticket className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all text-gray-900 uppercase"
                        placeholder="Varsa kod girin..."
                    />
                    </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer" onClick={() => setIsTeacher(!isTeacher)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isTeacher ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                        {isTeacher && <Sparkles size={12} className="text-white" />}
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-blue-900">Eğitmen olarak başvur</div>
                        <div className="text-xs text-blue-600">Kendi sınavlarınızı oluşturup satın.</div>
                    </div>
                    <GraduationCap size={20} className="text-blue-400" />
                </div>
                </>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ŞİFRE</label>
                <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all text-gray-900"
                    placeholder="••••••••"
                />
                </div>
            </div>

            {/* Forgot Password Link */}
            {mode === 'LOGIN' && (
                <div className="flex justify-end">
                    <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-primary hover:underline">
                        Şifremi unuttum?
                    </button>
                </div>
            )}

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-primary/30 flex items-center justify-center"
            >
                {loading ? 'İşleniyor...' : (mode === 'LOGIN' ? 'Giriş Yap' : (isTeacher ? 'Eğitmen Başvurusu Yap' : 'Ücretsiz Kayıt Ol'))}
            </button>
            </form>

            <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400 font-medium">Diğer Seçenekler</span>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => handleDemoLogin(UserRole.STUDENT)}
                className="flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900"
            >
                <span className="text-sm font-bold">Google</span>
            </button>
            <button 
                onClick={() => handleDemoLogin(UserRole.STUDENT)}
                className="flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900"
            >
                <span className="text-sm font-bold">Apple</span>
            </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <button 
                onClick={() => handleDemoLogin(UserRole.STUDENT)}
                className="flex items-center justify-center py-2 text-gray-500 hover:text-primary font-bold text-xs transition-colors border border-dashed rounded-lg"
            >
                Öğrenci Demosu
            </button>
            <button 
                onClick={() => handleDemoLogin(UserRole.TEACHER)}
                className="flex items-center justify-center py-2 text-gray-500 hover:text-primary font-bold text-xs transition-colors border border-dashed rounded-lg"
            >
                Öğretmen Demosu
            </button>
            <button 
                onClick={() => handleDemoLogin(UserRole.ADMIN)}
                className="col-span-2 flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 font-medium text-xs transition-colors"
            >
                Yönetici Girişi
            </button>
            </div>

        </div>
      </div>
    </div>
  );
};
