
import React, { useState } from 'react';
import { useApp } from '../services/store';
import { Trophy, Filter } from 'lucide-react';
import { SCHOOLS, SUBJECTS } from '../constants';

export const Leaderboard = () => {
    const { allUsers, setViewedProfileId } = useApp();
    const [filterSchool, setFilterSchool] = useState<string>('All');
    const [filterSubject, setFilterSubject] = useState<string>('Genel');

    // Filter and Sort Users from Real Store Data
    const filteredUsers = allUsers
        .filter(u => u.role === 'STUDENT') // Only show students
        .filter(u => filterSchool === 'All' || u.school === filterSchool)
        .sort((a, b) => b.points - a.points);

    const top3 = filteredUsers.slice(0, 3);
    const rest = filteredUsers.slice(3, 20); // Show top 20 for performance

    const handleUserClick = (userId: string) => {
        setViewedProfileId(userId);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-display font-bold text-gray-800">Liderlik Tablosu</h2>
                <p className="text-gray-500 text-sm font-medium">Bu haftanın en çalışkanları</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center text-primary font-bold text-sm">
                    <Filter size={18} className="mr-2"/> Filtrele
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        value={filterSchool}
                        onChange={(e) => setFilterSchool(e.target.value)}
                        className="bg-white border border-gray-200 text-sm rounded-xl px-3 py-2 outline-none w-full md:w-40 text-gray-900 font-bold"
                    >
                        <option value="All">Tüm Okullar</option>
                        {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="bg-white border border-gray-200 text-sm rounded-xl px-3 py-2 outline-none w-full md:w-40 text-gray-900 font-bold"
                    >
                        <option value="Genel">Genel Puan</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Podium */}
            {top3.length > 0 && (
                <div className="flex justify-center items-end gap-4 mb-8 h-48">
                    {/* 2nd Place */}
                    {top3[1] && (
                    <div onClick={() => handleUserClick(top3[1].id)} className="flex flex-col items-center animate-fade-in-up delay-100 cursor-pointer hover:scale-105 transition-transform">
                        <img src={top3[1].avatar} className="w-12 h-12 rounded-full border-2 border-gray-300 bg-gray-100 mb-2 object-cover" />
                        <div className="w-20 h-24 bg-gray-300 rounded-t-2xl flex flex-col items-center justify-center shadow-lg relative">
                            <span className="text-2xl font-bold text-white">2</span>
                            <div className="absolute -bottom-6 text-xs font-bold text-gray-600 w-24 text-center truncate px-1">{top3[1].name}</div>
                            <div className="text-[10px] text-white/80 font-medium">{top3[1].points}p</div>
                        </div>
                    </div>
                    )}
                    
                    {/* 1st Place */}
                    <div onClick={() => handleUserClick(top3[0].id)} className="flex flex-col items-center z-10 animate-fade-in-up cursor-pointer hover:scale-105 transition-transform">
                        <div className="text-yellow-500 mb-1 drop-shadow-sm"><Trophy size={28} className="fill-current"/></div>
                        <img src={top3[0].avatar} className="w-16 h-16 rounded-full border-4 border-yellow-400 bg-yellow-50 mb-2 shadow-md object-cover" />
                        <div className="w-24 h-32 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-2xl flex flex-col items-center justify-center shadow-xl relative">
                            <span className="text-4xl font-bold text-white drop-shadow-sm">1</span>
                            <div className="absolute -bottom-6 text-xs font-bold text-gray-800 w-28 text-center truncate px-1">{top3[0].name}</div>
                            <div className="text-xs text-white/90 font-bold bg-white/20 px-2 py-0.5 rounded-full mt-1">{top3[0].points}p</div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    {top3[2] && (
                    <div onClick={() => handleUserClick(top3[2].id)} className="flex flex-col items-center animate-fade-in-up delay-200 cursor-pointer hover:scale-105 transition-transform">
                        <img src={top3[2].avatar} className="w-12 h-12 rounded-full border-2 border-orange-300 bg-orange-100 mb-2 object-cover" />
                        <div className="w-20 h-20 bg-orange-300 rounded-t-2xl flex flex-col items-center justify-center shadow-lg relative">
                            <span className="text-2xl font-bold text-white">3</span>
                            <div className="absolute -bottom-6 text-xs font-bold text-gray-600 w-24 text-center truncate px-1">{top3[2].name}</div>
                            <div className="text-[10px] text-white/80 font-medium">{top3[2].points}p</div>
                        </div>
                    </div>
                    )}
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {rest.map((u, i) => (
                    <div onClick={() => handleUserClick(u.id)} key={u.id} className="flex items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                        <span className="text-gray-400 font-bold w-8 text-center font-mono">{i + 4}</span>
                        <img src={u.avatar} className="w-10 h-10 rounded-full bg-gray-100 mx-3 border border-gray-100 object-cover" />
                        <div className="flex-1">
                            <div className="font-bold text-sm text-gray-800 flex items-center">
                                {u.name}
                                {u.isPremium && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold shadow-sm">PRO</span>}
                            </div>
                            <div className="text-xs text-gray-400">{u.school}</div>
                        </div>
                        <div className="font-bold text-primary">{u.points} p</div>
                    </div>
                ))}
                {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Bu filtrede öğrenci bulunamadı.</div>}
            </div>
        </div>
    );
};
