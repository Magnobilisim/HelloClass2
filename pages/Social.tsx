import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../services/store';
import { SCHOOLS, SHOP_ITEMS } from '../constants';
import { UserRole } from '../types';
import { Send, Heart, AlertTriangle, MoreHorizontal, School, MessageSquare, Trash2, Flag, X } from 'lucide-react';

export const SocialFeed = () => {
  const { user, posts, addPost, toggleLike, addComment, deleteComment, reportPost, deletePost, setViewedProfileId } = useApp();
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(SCHOOLS[0]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Comment state: postId -> comment text
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Menu state: postId -> boolean
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const REPORT_REASONS = [
      "Spam veya Yanıltıcı",
      "Zorbalık veya Taciz",
      "Nefret Söylemi",
      "Şiddet veya Tehlikeli",
      "Kişisel Bilgi Paylaşımı",
      "Diğer"
  ];
  
  // Close menu when clicking outside
  useEffect(() => {
      const handleClickOutside = () => setOpenMenuId(null);
      if(openMenuId) document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Handle navigating to another user's profile (or own)
  const handleUserClick = (userId: string) => {
     setViewedProfileId(userId);
  };

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    setError(null);
    
    const result = await addPost(newPostContent, selectedSchool);
    
    if (result.success) {
      setNewPostContent('');
    } else {
      setError(result.message || 'Hata oluştu');
    }
    setIsPosting(false);
  };

  const toggleCommentBox = (postId: string) => {
      if (activeCommentBox === postId) {
          setActiveCommentBox(null);
          setCommentText('');
      } else {
          setActiveCommentBox(postId);
          setCommentText('');
      }
  };

  const submitComment = (postId: string) => {
      if(!commentText.trim()) return;
      // Allow Shift+Enter for new line
      addComment(postId, commentText);
      setCommentText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, postId: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitComment(postId);
      }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
      if (window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
          deleteComment(postId, commentId);
      }
  };

  const handleReportClick = (postId: string) => {
      setReportingPostId(postId);
      setReportReason('');
      setCustomReason('');
      setShowReportModal(true);
      setOpenMenuId(null);
  };

  const submitReport = () => {
      if (!reportingPostId) return;
      const finalReason = reportReason === 'Diğer' ? customReason : reportReason;
      if (!finalReason.trim()) {
          alert("Lütfen bir sebep belirtin.");
          return;
      }
      
      reportPost(reportingPostId, finalReason);
      setShowReportModal(false);
      setReportingPostId(null);
  };

  // Helper to get frame style class
  const getFrameStyle = (frameId?: string) => {
      if (!frameId) return 'border border-gray-100';
      const item = SHOP_ITEMS.find(i => i.id === frameId);
      return item ? item.imageUrl : 'border border-gray-100';
  };

  const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return isToday 
          ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          : date.toLocaleString([], {day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'});
  };

  // Current User Frame
  const currentUserFrameStyle = getFrameStyle(user?.equippedFrame);

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6 pb-8 relative">
      {/* REPORT MODAL */}
      {showReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 flex items-center"><Flag size={18} className="mr-2 text-red-500"/> Gönderiyi Şikayet Et</h3>
                      <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                      {REPORT_REASONS.map(reason => (
                          <button 
                            key={reason} 
                            onClick={() => setReportReason(reason)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${reportReason === reason ? 'bg-red-50 text-red-700 border border-red-100 font-bold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                          >
                              {reason}
                          </button>
                      ))}
                  </div>

                  {reportReason === 'Diğer' && (
                      <textarea 
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        placeholder="Şikayet sebebini kısaca açıklayın..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-200 mb-4"
                        rows={3}
                      />
                  )}

                  <button 
                    onClick={submitReport}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-colors"
                  >
                      Bildir
                  </button>
              </div>
          </div>
      )}

      {/* Post Creator */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex gap-3">
          <img src={user?.avatar} alt="me" className={`w-10 h-10 rounded-full bg-gray-200 ${currentUserFrameStyle}`} />
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Bugün okulda neler oldu?"
              disabled={isPosting}
              className="w-full bg-gray-50 rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={2}
            />
            {error && <p className="text-red-500 text-xs mt-2 flex items-center"><AlertTriangle size={12} className="mr-1"/> {error}</p>}
            
            <div className="flex justify-between items-center mt-3">
              <select 
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                disabled={isPosting}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1.5 text-gray-900 outline-none font-bold disabled:opacity-50"
              >
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <button 
                onClick={handlePost}
                disabled={isPosting || !newPostContent.trim()}
                className="bg-primary hover:bg-primary-dark text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center disabled:opacity-50 shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                {isPosting ? 'AI Kontrol...' : <><Send size={16} className="mr-2" /> Paylaş</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post) => {
            const postFrameStyle = getFrameStyle(post.userFrame);
            // Allow deletion if Admin OR if the user owns the post
            const canDelete = isAdmin || (user && post.userId === user.id);
            const isLiked = user && post.likedBy.includes(user.id);
            
            return (
            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md relative">
                <div className="flex justify-between items-start mb-3">
                    <div 
                        className="flex items-center gap-3 cursor-pointer group" 
                        onClick={() => handleUserClick(post.userId)}
                    >
                        <img src={post.userAvatar} alt={post.userName} className={`w-10 h-10 rounded-full bg-gray-100 group-hover:opacity-90 transition-opacity ${postFrameStyle}`} />
                        <div>
                        <h4 className="font-bold text-sm text-gray-800 group-hover:text-primary transition-colors">{post.userName}</h4>
                        <div className="flex items-center text-xs text-gray-400 font-medium">
                            <School size={12} className="mr-1" />
                            {post.schoolTag}
                        </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-300 font-medium mr-2">{formatDate(post.timestamp)}</span>
                        
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === post.id ? null : post.id); }} 
                                className="text-gray-300 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {/* DROPDOWN MENU */}
                            {openMenuId === post.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-pop">
                                    {canDelete && (
                                        <button 
                                            onClick={() => { if(window.confirm('Silmek istediğinize emin misiniz?')) deletePost(post.id); }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center"
                                        >
                                            <Trash2 size={14} className="mr-2"/> Gönderiyi Sil
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleReportClick(post.id)}
                                        className="w-full text-left px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center"
                                    >
                                        <Flag size={14} className="mr-2"/> Şikayet Et
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 leading-relaxed font-medium break-words">
                {post.content}
                </p>

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex gap-4">
                    <button 
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 text-sm font-bold transition-colors active:scale-90 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                    >
                        <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                        <span>{post.likedBy.length || 'Beğen'}</span>
                    </button>
                    
                    <button 
                        onClick={() => toggleCommentBox(post.id)}
                        className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${activeCommentBox === post.id ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                    >
                        <MessageSquare size={18} />
                        <span>Yorum ({post.comments.length})</span>
                    </button>
                </div>
                
                {post.isReported && (
                    <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-1 rounded-md font-bold border border-orange-100 flex items-center">
                        <AlertTriangle size={10} className="mr-1"/> İnceleniyor
                    </span>
                )}
                </div>

                {/* Comment Section */}
                {activeCommentBox === post.id && (
                    <div className="mt-4 pt-3 border-t border-gray-50 animate-fade-in">
                        <div className="space-y-3 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                            {post.comments.length === 0 && <p className="text-xs text-gray-400 italic">Henüz yorum yok. İlk yorumu sen yaz!</p>}
                            {post.comments.map(comment => {
                                const canDeleteComment = isAdmin || (user && comment.userId === user.id) || (user && post.userId === user.id);
                                return (
                                    <div key={comment.id} className="flex items-start justify-between group/comment hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-xs text-gray-800">{comment.userName}</span>
                                                <span className="text-[10px] text-gray-400">{formatDate(comment.timestamp)}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 break-words">{comment.text}</p>
                                        </div>
                                        {canDeleteComment && (
                                            <button 
                                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                                className="text-gray-300 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, post.id)}
                                placeholder="Bir yorum yaz..."
                                className="flex-1 bg-gray-50 text-xs text-gray-900 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary border border-gray-200"
                            />
                            <button 
                                onClick={() => submitComment(post.id)}
                                disabled={!commentText.trim()}
                                className="text-primary font-bold text-xs disabled:opacity-50 px-2 hover:bg-primary/5 rounded-lg transition-colors"
                            >
                                Gönder
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 ml-1">Shift+Enter: Alt satır</p>
                    </div>
                )}
            </div>
            );
        })}
      </div>
    </div>
  );
};