
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../services/store';
import { SHOP_ITEMS } from '../constants';
import { Question, ExamResult, MarketplaceExam, UserRole } from '../types';
import { explainAnswer } from '../services/geminiService';
import { Play, Clock, CheckCircle, XCircle, Loader2, Zap, RefreshCw, Sparkles, Search, Star, ShoppingCart, Award, Trophy, Share2, FastForward, ChevronRight, BrainCircuit, MinusCircle, RotateCcw, Filter, Eye, EyeOff } from 'lucide-react';

export const ExamFlow = () => {
  const { startExam, startMarketplaceExam, submitExamResult, showAd, user, marketplaceExams, buyExam, consumeItem, subjectConfig, setPage } = useApp();
  
  const [view, setView] = useState<'MARKETPLACE' | 'DETAILS' | 'SETUP' | 'ACTIVE' | 'RESULT'>('MARKETPLACE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('All');
  
  const [selectedExam, setSelectedExam] = useState<MarketplaceExam | null>(null);
  const [buyingLoading, setBuyingLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MarketplaceExam[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [config, setConfig] = useState({ subject: '', topic: '', level: '', questionCount: 10, durationMinutes: 20 });
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [joker50Used, setJoker50Used] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
      setSelectedTopicFilter('All');
      setSelectedLevelFilter('All');
  }, [selectedSubjectFilter]);

  useEffect(() => {
    if (searchTerm.trim()) {
        const results = marketplaceExams.filter(e => {
            const isOwned = user?.purchasedExamIds?.includes(e.id) || user?.id === e.creatorId;
            if (e.isDeleted && !isOwned) return false; 
            const isPublished = e.status === 'PUBLISHED';
            if (!isPublished && !isOwned) return false;

            return (
                e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
        setSearchResults(results);
        setShowSearchDropdown(true);
    } else {
        setShowSearchDropdown(false);
    }
  }, [searchTerm, marketplaceExams, user]);

  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (view === 'ACTIVE') {
              e.preventDefault();
              e.returnValue = '';
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [view]);

  useEffect(() => {
    if (view === 'ACTIVE') {
        if (!endTimeRef.current) {
             endTimeRef.current = Date.now() + (timeLeft * 1000);
        }

        timerRef.current = window.setInterval(() => {
            if (!endTimeRef.current) return;
            
            const now = Date.now();
            const diff = Math.ceil((endTimeRef.current - now) / 1000);
            
            if (diff <= 0) {
                setTimeLeft(0);
                handleFinishExam();
                if (timerRef.current) clearInterval(timerRef.current);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);
    } else {
        endTimeRef.current = null;
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  const handleStartAISetup = () => {
      const initialSubject = subjectConfig[0]?.name || '';
      
      // AUTO-FILL LOGIC
      let initialLevel = '';
      if (user?.grade) {
          const hasLevel = subjectConfig.find(s => s.name === initialSubject)?.levels.some(l => l.name === user.grade);
          if (hasLevel) initialLevel = user.grade;
      }
      
      if (initialSubject === 'İngilizce' && user?.englishLevel) {
           initialLevel = user.englishLevel;
      }

      setConfig({ 
          subject: initialSubject, 
          topic: '', 
          level: initialLevel, 
          questionCount: 10, 
          durationMinutes: 20 
      });
      setView('SETUP');
  };

  useEffect(() => {
      if (view === 'SETUP' && user) {
          const selectedCat = subjectConfig.find(s => s.name === config.subject);
          if (selectedCat) {
              let newLevel = '';
              if (config.subject !== 'İngilizce' && user.grade) {
                  if (selectedCat.levels.some(l => l.name === user.grade)) {
                      newLevel = user.grade;
                  }
              } else if (config.subject === 'İngilizce' && user.englishLevel) {
                  if (selectedCat.levels.some(l => l.name === user.englishLevel)) {
                      newLevel = user.englishLevel;
                  }
              }
              
              if (!config.level && newLevel) {
                  setConfig(prev => ({ ...prev, level: newLevel }));
              }
          }
      }
  }, [config.subject, view, user, subjectConfig]);

  const handleStartAIExam = async () => {
    setLoading(true);
    try {
      if (user && !user.isPremium) {
        await showAd();
      }
      
      const generatedQuestions = await startExam(config);
      
      if (!isMounted.current) return;

      if (generatedQuestions.length === 0) {
          alert("Soru üretilemedi. Lütfen tekrar deneyin.");
          setLoading(false);
          return;
      }
      
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(-1));
      const duration = Math.max(5, config.durationMinutes);
      setTimeLeft(duration * 60);
      endTimeRef.current = Date.now() + (duration * 60 * 1000);
      
      setCurrentQuestionIndex(0);
      setHiddenOptions([]);
      setJoker50Used(false);
      setView('ACTIVE');
    } catch (error: any) {
        if (!isMounted.current) return;
        if (error.message === 'DAILY_LIMIT_REACHED') {
            alert("Günlük ücretsiz sınav hakkınız doldu. Premium'a geçin veya yarını bekleyin!");
        } else {
            alert("Sınav oluşturulurken bir hata oluştu.");
        }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleExamClick = (exam: MarketplaceExam) => {
      setSelectedExam(exam);
      setSearchTerm('');
      setShowSearchDropdown(false);
      setView('DETAILS');
  };

  const handleBuyOrStart = async () => {
      if (!selectedExam || !user) return;
      
      if (selectedExam.questions.length === 0) {
          alert("Bu sınavda henüz soru bulunmuyor. Lütfen daha sonra tekrar deneyin.");
          return;
      }

      const isOwned = user.purchasedExamIds?.includes(selectedExam.id) || 
                      selectedExam.price === 0 || 
                      user.id === selectedExam.creatorId ||
                      user.role === UserRole.ADMIN;

      if (isOwned) {
          const isCreatorOrAdmin = user.id === selectedExam.creatorId || user.role === UserRole.ADMIN;
          
          if (!user.isPremium && selectedExam.price === 0 && !isCreatorOrAdmin) {
              await showAd();
          }

          if (!isMounted.current) return;

          const qs = startMarketplaceExam(selectedExam);
          setQuestions(qs);
          setAnswers(new Array(qs.length).fill(-1));
          const safeDuration = selectedExam.duration || 20; 
          setTimeLeft(safeDuration * 60);
          endTimeRef.current = Date.now() + (safeDuration * 60 * 1000);
          
          setCurrentQuestionIndex(0);
          setHiddenOptions([]);
          setJoker50Used(false);
          setView('ACTIVE');
      } else {
          setBuyingLoading(true);
          await buyExam(selectedExam);
          if (isMounted.current) setBuyingLoading(false);
      }
  };

  const handleRetryExam = () => {
      if (selectedExam) {
          handleBuyOrStart();
      } else {
          handleStartAIExam();
      }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleJoker5050 = () => {
      if (joker50Used) return;
      const ownedCount = user?.inventory.filter(id => id === 'joker_5050').length || 0;
      if (ownedCount === 0) {
          alert("Envanterinde %50 Jokeri yok!");
          return;
      }
      
      const currentQ = questions[currentQuestionIndex];
      const correct = currentQ.correctIndex;
      const wrongIndices = [0,1,2,3].filter(i => i !== correct);
      
      const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
      const toHide = shuffled.slice(0, 2);
      
      setHiddenOptions(toHide);
      setJoker50Used(true);
      consumeItem('joker_5050');

      if (answers[currentQuestionIndex] !== -1 && toHide.includes(answers[currentQuestionIndex])) {
          handleAnswer(-1);
      }
  };

  const handleJokerSkip = () => {
      const ownedCount = user?.inventory.filter(id => id === 'joker_skip').length || 0;
      if (ownedCount === 0) {
          alert("Envanterinde Pas Geçme Jokeri yok!");
          return;
      }
      handleAnswer(questions[currentQuestionIndex].correctIndex);
      consumeItem('joker_skip');
      
      if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => {
              setCurrentQuestionIndex(prev => prev + 1);
              setHiddenOptions([]);
              setJoker50Used(false);
          }, 500);
      }
  };

  const handleFinishExam = () => {
    if (questions.length === 0) {
        setView('MARKETPLACE');
        return;
    }

    let correctCount = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctCount++;
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const resultData = {
      score: isNaN(score) ? 0 : score,
      correctCount,
      totalQuestions: questions.length,
      questions,
      userAnswers: answers
    };

    setResult(resultData);
    submitExamResult(resultData);
    setView('RESULT');
    
    if (score > 70) {
        setShowConfetti(true);
        setTimeout(() => {
            if (isMounted.current) setShowConfetti(false);
        }, 5000);
    }
  };

  const handleExplain = async (q: Question, userAnswerIndex: number) => {
      setExplainingId(q.id);
      const userAns = userAnswerIndex !== -1 ? q.options[userAnswerIndex] : "Boş";
      const explanationText = await explainAnswer(q.text, q.options[q.correctIndex], userAns);
      if (isMounted.current) {
          setExplanation(explanationText);
          setExplainingId(null);
      }
  };
  
  const restartExam = () => {
      setResult(null);
      setExplanation(null);
      setQuestions([]);
      setView('MARKETPLACE');
  };

  const handleShare = async () => {
      if (result && navigator.share) {
          try {
              await navigator.share({
                  title: 'HelloClass Sonucum',
                  text: `HelloClass'ta ${result.score} puan aldım! Beni geçebilir misin? 🏆`,
                  url: window.location.href
              });
          } catch (err) {
              console.log('Share cancelled');
          }
      } else {
          alert("Tarayıcınız paylaşım özelliğini desteklemiyor.");
      }
  };

  const getFrameStyle = (frameId?: string) => {
      if (!frameId) return 'border-2 border-white';
      const item = SHOP_ITEMS.find(i => i.id === frameId);
      return item ? item.imageUrl : 'border-2 border-white';
  };

  const getMotivation = (score: number) => {
      if(score === 100) return "Efsanesin! 🏆";
      if(score >= 85) return "Harika İş Çıkardın! 🌟";
      if(score >= 70) return "Çok İyisin! 💪";
      if(score >= 50) return "Güzel Deneme, Pes Etme! 🚀";
      return "Daha Çok Çalışmalısın 📚";
  };

  const activeSubjectCategory = subjectConfig.find(s => s.name === selectedSubjectFilter);

  if (view === 'ACTIVE') {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;

    // Visual Timer Guard
    const safeTimeLeft = Math.max(0, timeLeft);

    return (
      <div className="h-full flex flex-col max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center mb-6 sticky top-0 z-10">
          <div className="flex items-center text-orange-500 font-bold font-mono text-xl">
             <Clock className="mr-2 animate-pulse" />
             {Math.floor(safeTimeLeft / 60)}:{(safeTimeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-gray-400 font-bold text-sm">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 flex-1 relative overflow-hidden">
           {currentQ.imageUrl && (
               <img src={currentQ.imageUrl} className="w-full h-48 object-cover rounded-2xl mb-6 bg-gray-50"/>
           )}

           <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 leading-relaxed">
             {currentQ.text}
           </h3>

           <div className="space-y-3 mb-8">
             {currentQ.options.map((opt, index) => {
               if (hiddenOptions.includes(index)) return <div key={index} className="h-14"></div>;

               return (
                <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full p-4 rounded-2xl text-left transition-all relative overflow-hidden group border-2
                    ${answers[currentQuestionIndex] === index 
                        ? 'bg-primary/10 border-primary text-primary-dark font-bold shadow-md transform scale-[1.02]' 
                        : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700 font-medium'}`}
                >
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                                ${answers[currentQuestionIndex] === index ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span>{opt}</span>
                        </div>
                        {currentQ.optionImages?.[index] && (
                            <img src={currentQ.optionImages[index]} className="w-10 h-10 rounded border object-cover bg-white"/>
                        )}
                    </div>
                </button>
               );
             })}
           </div>

           <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
               <div className="flex gap-2">
                   <button 
                        onClick={handleJoker5050}
                        disabled={joker50Used || answers[currentQuestionIndex] !== -1}
                        className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center transition-all active:scale-95
                            ${user?.inventory.includes('joker_5050') 
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'}`}
                   >
                       <Zap size={18} className="mb-1"/> %50
                   </button>
                   <button 
                        onClick={handleJokerSkip}
                        disabled={answers[currentQuestionIndex] !== -1}
                        className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center transition-all active:scale-95
                            ${user?.inventory.includes('joker_skip') 
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'}`}
                   >
                       <FastForward size={18} className="mb-1"/> Pas
                   </button>
               </div>

               <button
                onClick={() => {
                    if (currentQuestionIndex < questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setHiddenOptions([]);
                        setJoker50Used(false);
                    } else {
                        handleFinishExam();
                    }
                }}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center"
               >
                 {currentQuestionIndex < questions.length - 1 ? (
                     <>Sıradaki <ChevronRight size={20} className="ml-1"/></>
                 ) : (
                     <>Sınavı Bitir <CheckCircle size={20} className="ml-1"/></>
                 )}
               </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'RESULT' && result) {
    const emptyCount = result.userAnswers.filter(a => a === -1).length;
    const wrongCount = result.totalQuestions - result.correctCount - emptyCount;
    const userFrameStyle = getFrameStyle(user?.equippedFrame);

    return (
      <div className="max-w-3xl mx-auto animate-fade-in relative">
        {showConfetti && (
             <>
                <div className="confetti" style={{left: '10%', animationDelay: '0s', backgroundColor: '#ef4444'}}></div>
                <div className="confetti" style={{left: '30%', animationDelay: '0.5s', backgroundColor: '#3b82f6'}}></div>
                <div className="confetti" style={{left: '50%', animationDelay: '0.2s', backgroundColor: '#22c55e'}}></div>
                <div className="confetti" style={{left: '70%', animationDelay: '0.7s', backgroundColor: '#f59e0b'}}></div>
                <div className="confetti" style={{left: '90%', animationDelay: '0.4s', backgroundColor: '#a855f7'}}></div>
             </>
        )}

        <div className="bg-white rounded-4xl p-8 shadow-xl border border-gray-100 text-center mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
           
           <div className="mb-6">
               {result.score >= 90 ? <Trophy size={64} className="mx-auto text-yellow-500 animate-bounce"/> :
                result.score >= 70 ? <Award size={64} className="mx-auto text-blue-500 animate-pulse"/> :
                <Star size={64} className="mx-auto text-gray-400"/>}
           </div>

           <h2 className="text-4xl font-display font-bold text-gray-800 mb-2">
               {getMotivation(result.score)}
           </h2>
           <p className="text-gray-500 mb-8">Sınavı başarıyla tamamladın.</p>

           <div className="flex justify-center gap-4 mb-8">
               <div className="bg-green-50 p-4 rounded-2xl w-28 border border-green-100">
                   <div className="text-3xl font-black text-green-600">{result.correctCount}</div>
                   <div className="text-xs font-bold text-green-800 uppercase">Doğru</div>
               </div>
               <div className="bg-red-50 p-4 rounded-2xl w-28 border border-red-100">
                   <div className="text-3xl font-black text-red-500">{wrongCount}</div>
                   <div className="text-xs font-bold text-red-800 uppercase">Yanlış</div>
               </div>
               <div className="bg-gray-50 p-4 rounded-2xl w-28 border border-gray-200">
                   <div className="text-3xl font-black text-gray-500">{emptyCount}</div>
                   <div className="text-xs font-bold text-gray-600 uppercase">Boş</div>
               </div>
               <div className="bg-blue-50 p-4 rounded-2xl w-28 border border-blue-100">
                   <div className="text-3xl font-black text-blue-600">{result.score}</div>
                   <div className="text-xs font-bold text-blue-800 uppercase">Puan</div>
               </div>
           </div>
           
           <div 
                onClick={handleShare}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-left shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-500 mx-auto max-w-sm mb-8 relative overflow-hidden group cursor-pointer"
           >
                <div className="absolute top-0 right-0 p-3 opacity-20"><Share2 size={80}/></div>
                <div className="relative z-10 flex items-center gap-4 mb-4">
                    <img src={user?.avatar} className={`w-12 h-12 rounded-full bg-white ${userFrameStyle}`}/>
                    <div>
                        <div className="font-bold">{user?.name}</div>
                        <div className="text-xs text-indigo-200">{user?.school}</div>
                    </div>
                </div>
                <div className="relative z-10 mb-4">
                    <div className="text-4xl font-black">{result.score} Puan</div>
                    <div className="text-sm opacity-90">HelloClass Liderlik Tablosu 🏆</div>
                </div>
                <div className="relative z-10 bg-white/20 backdrop-blur-sm p-2 rounded-lg text-xs text-center font-bold flex items-center justify-center">
                    <Share2 size={14} className="mr-2"/> Sonucumu Paylaş
                </div>
           </div>

           <div className="flex flex-col md:flex-row justify-center gap-4">
               <button onClick={() => setPage('social')} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Ana Sayfaya Dön</button>
               <div className="flex gap-2">
                   <button onClick={handleRetryExam} className="px-6 py-3 rounded-xl font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center">
                       <RotateCcw size={20} className="mr-2"/> Tekrar Dene
                   </button>
                   <button onClick={restartExam} className="px-8 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors flex items-center">
                       <RefreshCw size={20} className="mr-2"/> Yeni Sınav
                   </button>
               </div>
           </div>
        </div>
        
        <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-gray-800 text-xl">Cevapları İncele</h3>
            <button 
                onClick={() => setShowOnlyWrong(!showOnlyWrong)}
                className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${showOnlyWrong ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
                {showOnlyWrong ? <><EyeOff size={14} className="mr-2"/> Tümünü Göster</> : <><Eye size={14} className="mr-2"/> Sadece Yanlışlar</>}
            </button>
        </div>

        <div className="space-y-4">
            {result.questions.map((q, i) => {
                const isCorrect = result.userAnswers[i] === q.correctIndex;
                const isSkipped = result.userAnswers[i] === -1;
                const userAnswer = result.userAnswers[i];
                
                if (showOnlyWrong && isCorrect) return null;

                return (
                    <div key={i} className={`bg-white p-6 rounded-3xl shadow-sm border ${isCorrect ? 'border-green-100' : isSkipped ? 'border-gray-200' : 'border-red-100'}`}>
                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isCorrect ? 'bg-green-100 text-green-600' : isSkipped ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-500'}`}>
                                {i+1}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-800 mb-3">{q.text}</p>
                                
                                <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => (
                                        <div key={optIdx} className={`p-3 rounded-xl text-sm flex justify-between items-center
                                            ${optIdx === q.correctIndex ? 'bg-green-50 text-green-800 font-bold border border-green-200' : 
                                              optIdx === userAnswer ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-50 text-gray-500'}
                                        `}>
                                            <span>{opt}</span>
                                            {optIdx === q.correctIndex && <CheckCircle size={16} />}
                                            {optIdx === userAnswer && optIdx !== q.correctIndex && <XCircle size={16} />}
                                            {isSkipped && optIdx === userAnswer && <MinusCircle size={16} />}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <div className="text-sm text-gray-600 mb-2">
                                        <span className="font-bold text-gray-400 text-xs uppercase mr-2">Çözüm:</span>
                                        {q.explanation}
                                        {q.explanationImageUrl && (
                                            <img src={q.explanationImageUrl} className="mt-2 w-32 rounded border" />
                                        )}
                                    </div>
                                    
                                    {!isCorrect && (
                                        <button 
                                            onClick={() => handleExplain(q, userAnswer)}
                                            className="text-xs font-bold text-primary flex items-center hover:underline mt-2"
                                            disabled={explainingId === q.id}
                                        >
                                            <Sparkles size={14} className="mr-1"/> 
                                            {explainingId === q.id ? 'AI Açıklıyor...' : 'AI ile Detaylı Açıkla'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            {showOnlyWrong && wrongCount === 0 && emptyCount === 0 && (
                <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    Harika! Hiç yanlışın yok. 🎉
                </div>
            )}
        </div>

        {explanation && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-8 max-w-lg shadow-2xl relative">
                    <button onClick={() => setExplanation(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Sparkles size={24}/>
                        <h3 className="font-bold text-xl">AI Öğretmen Diyor ki:</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        {explanation}
                    </p>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (view === 'MARKETPLACE' || view === 'DETAILS' || view === 'SETUP') {
      const isPurchased = selectedExam && (user?.purchasedExamIds?.includes(selectedExam.id) || selectedExam.price === 0 || user?.id === selectedExam.creatorId || user?.role === UserRole.ADMIN);
      
      return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-gray-800">Sınav Vitrini</h1>
                    <p className="text-gray-500">En iyi eğitmenlerin hazırladığı sınavları keşfet.</p>
                </div>
                <button 
                    onClick={handleStartAISetup}
                    className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center hover:scale-105 transition-transform"
                >
                    <Sparkles size={20} className="mr-2"/> Özel AI Sınavı Oluştur
                </button>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 relative z-20">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Sınav veya ders ara..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-primary rounded-xl outline-none text-gray-900 font-medium transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XCircle size={20} />
                        </button>
                    )}
                    
                    {showSearchDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                            {searchResults.map(result => (
                                <div 
                                    key={result.id}
                                    onClick={() => handleExamClick(result)}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-50"
                                >
                                    <div className="font-bold text-gray-800 text-sm">{result.title}</div>
                                    <div className="text-xs text-gray-500">{result.subject} • {result.creatorName}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                    <select 
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        className="bg-gray-50 border-transparent focus:bg-white border focus:border-primary rounded-xl px-4 py-3 font-bold text-gray-700 outline-none cursor-pointer min-w-[140px]"
                    >
                        <option value="All">Tüm Dersler</option>
                        {subjectConfig.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>

                    <select 
                        value={selectedTopicFilter}
                        onChange={(e) => setSelectedTopicFilter(e.target.value)}
                        disabled={selectedSubjectFilter === 'All'}
                        className="bg-gray-50 border-transparent focus:bg-white border focus:border-primary rounded-xl px-4 py-3 font-bold text-gray-700 outline-none cursor-pointer min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="All">Tüm Konular</option>
                        {activeSubjectCategory?.topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>

                    <select 
                        value={selectedLevelFilter}
                        onChange={(e) => setSelectedLevelFilter(e.target.value)}
                        disabled={selectedSubjectFilter === 'All'}
                        className="bg-gray-50 border-transparent focus:bg-white border focus:border-primary rounded-xl px-4 py-3 font-bold text-gray-700 outline-none cursor-pointer min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="All">Tüm Seviyeler</option>
                        {activeSubjectCategory?.levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center"><Star className="text-yellow-400 mr-2" fill="currentColor"/> Öne Çıkanlar</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {marketplaceExams.filter(e => e.status === 'PUBLISHED' && e.rating >= 4.5 && !e.isDeleted).map(exam => (
                        <div key={exam.id} onClick={() => handleExamClick(exam)} className="min-w-[280px] bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-primary/10 text-primary-dark text-xs font-bold px-2 py-1 rounded-md">{exam.subject}</span>
                                <div className="flex items-center text-xs font-bold text-gray-500"><Star size={12} className="text-yellow-400 mr-1" fill="currentColor"/> {exam.rating}</div>
                            </div>
                            <h4 className="font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">{exam.title}</h4>
                            <p className="text-xs text-gray-400 mb-4">{exam.creatorName}</p>
                            <div className="flex items-center justify-between">
                                <div className="text-green-600 font-bold">{exam.price === 0 ? 'ÜCRETSİZ' : `₺${exam.price}`}</div>
                                <button className="bg-gray-900 text-white p-2 rounded-xl group-hover:bg-primary transition-colors"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceExams
                    .filter(e => {
                        const isOwned = user?.purchasedExamIds?.includes(e.id) || user?.id === e.creatorId || user?.role === UserRole.ADMIN;
                        if (e.isDeleted && !isOwned) return false;
                        const isPublished = e.status === 'PUBLISHED';
                        if (!isPublished && !isOwned) return false;
                        
                        const matchSubject = selectedSubjectFilter === 'All' || e.subject === selectedSubjectFilter;
                        const matchTopic = selectedTopicFilter === 'All' || e.topic === selectedTopicFilter;
                        const matchLevel = selectedLevelFilter === 'All' || e.level === selectedLevelFilter;

                        const matchesSearch = !searchTerm.trim() || 
                            e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.creatorName.toLowerCase().includes(searchTerm.toLowerCase());

                        return matchSubject && matchTopic && matchLevel && matchesSearch;
                    })
                    .map(exam => (
                    <div key={exam.id} onClick={() => handleExamClick(exam)} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-primary/30 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden">
                        {exam.isDeleted && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">ARŞİV (SATIN ALINDI)</div>}
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-gray-50 p-3 rounded-2xl">
                               <Award className="text-gray-400" size={24}/>
                            </div>
                            {user?.purchasedExamIds?.includes(exam.id) ? (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center"><CheckCircle size={10} className="mr-1"/> SAHİPSİN</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">{exam.duration} Dk</span>
                            )}
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{exam.title}</h3>
                        {(exam.topic || exam.level) && (
                            <div className="flex gap-1 mb-2">
                                {exam.topic && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{exam.topic}</span>}
                                {exam.level && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold">{exam.level}</span>}
                            </div>
                        )}
                        <div className="text-sm text-gray-500 mb-6 flex-1">{exam.description.substring(0, 60)}...</div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                            <div className="flex items-center">
                                <div className="text-xs font-bold text-gray-400 mr-2">Eğitmen:</div>
                                <div className="text-xs font-bold text-gray-800">{exam.creatorName}</div>
                            </div>
                            <div className="text-lg font-bold text-green-600">{exam.price === 0 ? 'Free' : `₺${exam.price}`}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  return null;
};
