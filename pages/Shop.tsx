
import React, { useState } from 'react';
import { useApp } from '../services/store';
import { SHOP_ITEMS } from '../constants';
import { ShoppingBag, Gem, CheckCircle, Lock, Play, CreditCard, X, Loader2, AlertTriangle, Plus, LayoutGrid, ShoppingCart } from 'lucide-react';
import { ShopItem } from '../types';

export const ShopScreen = () => {
    const { user, buyShopItem, equipShopItem, watchAdForPoints, purchasePointsPack } = useApp();
    
    // Modal States
    const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
    const [adLoading, setAdLoading] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [selectedItemForContext, setSelectedItemForContext] = useState<ShopItem | null>(null);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'FRAMES' | 'JOKERS'>('ALL');

    if (!user) return null;

    const filteredItems = SHOP_ITEMS.filter(item => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'FRAMES') return item.type === 'FRAME';
        if (activeTab === 'JOKERS') return item.type === 'JOKER';
        return true;
    });

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    };

    const handleBuy = (item: ShopItem) => {
        const result = buyShopItem(item);
        if (!result.success) {
            if (result.error === 'INSUFFICIENT_FUNDS') {
                setSelectedItemForContext(item);
                setShowLowBalanceModal(true);
            } else if (result.error === 'ALREADY_OWNED') {
                showToast("Bu ürüne zaten sahipsiniz.", "error");
            }
        } else {
            showToast(`${item.name} satın alındı!`, "success");
        }
    };

    const handleWatchAd = async () => {
        setAdLoading(true);
        const earned = await watchAdForPoints();
        setAdLoading(false);
    };

    const handleBuyPoints = async () => {
        setPurchaseLoading(true);
        await purchasePointsPack();
        setPurchaseLoading(false);
    };

    // Derived state for the modal logic
    const canAffordNow = selectedItemForContext && user.points >= selectedItemForContext.price;

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-white animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Low Balance Modal */}
            {showLowBalanceModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative">
                        <button onClick={() => setShowLowBalanceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        
                        {/* DYNAMIC CONTENT: If user now has enough points */}
                        {canAffordNow ? (
                            <div className="text-center">
                                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pop">
                                    <CheckCircle size={40} className="text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Yeterli Puanın Var!</h3>
                                <p className="text-gray-500 mt-2 mb-6">
                                    Artık <b>{selectedItemForContext?.name}</b> ürününü alabilirsin.
                                </p>
                                <button 
                                    onClick={() => {
                                        handleBuy(selectedItemForContext!);
                                        setShowLowBalanceModal(false);
                                    }}
                                    className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-600 transition-colors active:scale-95 animate-bounce"
                                >
                                    Hemen Satın Al ({selectedItemForContext?.price} Puan)
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pop">
                                        <AlertTriangle size={40} className="text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">Yetersiz Puan!</h3>
                                    <p className="text-gray-500 mt-2">
                                        <b>{selectedItemForContext?.name}</b> ürününü almak için 
                                        <span className="text-red-500 font-bold ml-1">{selectedItemForContext && (selectedItemForContext.price - user.points)} puan</span> daha gerekli.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button 
                                        onClick={handleWatchAd}
                                        disabled={adLoading}
                                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between hover:opacity-90 transition-opacity shadow-lg shadow-purple-200 active:scale-95"
                                    >
                                        <div className="flex items-center">
                                            <div className="bg-white/20 p-2 rounded-full mr-3">
                                                {adLoading ? <Loader2 size={24} className="animate-spin"/> : <Play size={24} fill="white"/>}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-lg">Reklam İzle</div>
                                                <div className="text-xs text-purple-100">Ücretsiz +50 Puan Kazan</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-xl">+50</div>
                                    </button>

                                    <button 
                                        onClick={handleBuyPoints}
                                        disabled={purchaseLoading}
                                        className="w-full bg-white border-2 border-green-500 text-green-600 p-4 rounded-2xl flex items-center justify-between hover:bg-green-50 transition-colors active:scale-95"
                                    >
                                        <div className="flex items-center">
                                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                                {purchaseLoading ? <Loader2 size={24} className="animate-spin"/> : <CreditCard size={24} />}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-lg">Puan Satın Al</div>
                                                <div className="text-xs text-green-600">Süper Paket (19.99₺)</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-xl">+1000</div>
                                    </button>
                                </div>
                                
                                <p className="text-center text-xs text-gray-400 mt-6">İşlem güvenli ödeme altyapısı ile gerçekleşir.</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-display font-bold mb-2">Puan Mağazası</h2>
                            <p className="text-purple-100">Puanlarını harca, tarzını konuştur!</p>
                        </div>
                        <div className="text-center bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                            <div className="text-3xl font-black">{user.points}</div>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-80">Mevcut Puan</div>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <Gem size={200} />
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 w-fit">
                <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Tümü</button>
                <button onClick={() => setActiveTab('FRAMES')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'FRAMES' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Çerçeveler</button>
                <button onClick={() => setActiveTab('JOKERS')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'JOKERS' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Jokerler</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredItems.map(item => {
                    const isFrame = item.type === 'FRAME';
                    const isOwned = user.inventory.includes(item.id);
                    const isEquipped = isFrame && user.equippedFrame === item.id;
                    
                    // For consumables, count how many owned
                    const ownedCount = isFrame ? (isOwned ? 1 : 0) : user.inventory.filter(id => id === item.id).length;

                    return (
                        <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all relative">
                            <div className="relative mb-4">
                                {isFrame ? (
                                    <img src={user.avatar} className={`w-20 h-20 rounded-full bg-gray-100 ${item.imageUrl}`} />
                                ) : (
                                    <div className="text-5xl">{item.imageUrl}</div>
                                )}
                                
                                {isEquipped && <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"><CheckCircle size={16}/></div>}
                                
                                {(!isFrame && ownedCount > 0) && (
                                    <span className="absolute -top-2 -right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                        x{ownedCount}
                                    </span>
                                )}
                            </div>
                            
                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                            <p className="text-xs text-gray-500 mb-4 h-8">{item.description}</p>
                            
                            {isFrame && isOwned ? (
                                <button 
                                    onClick={() => equipShopItem(item)}
                                    disabled={isEquipped}
                                    className={`w-full py-2 rounded-xl font-bold text-sm ${isEquipped ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-black'}`}
                                >
                                    {isEquipped ? 'Takılı' : 'Kullan'}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleBuy(item)}
                                    className="w-full py-2 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-dark flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95"
                                >
                                    <span className="mr-1">{isFrame ? <Gem size={14}/> : <ShoppingCart size={14}/>}</span>
                                    {item.type === 'JOKER' ? 'Satın Al' : `${item.price} Puan`}
                                    {item.type === 'JOKER' && <span className="ml-1 opacity-70">({item.price})</span>}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
