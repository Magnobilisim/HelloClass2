/**
 * HelloClass Backend - Firebase Cloud Functions
 * 
 * Bu dosya sunucu tarafında çalışır.
 * Güvenli işlemler (Ödeme, AI, Veritabanı yazma) burada yapılır.
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";
import * as cors from "cors";

// Firebase Admin Başlatma
admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true }); // Production'da domain kısıtlaması yapılmalı

// Gemini AI Ayarları (Environment Variable'dan alınır)
// firebase functions:config:set gemini.key="API_KEY"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

// --- YARDIMCI FONKSİYONLAR ---

// Kullanıcı oturumunu doğrulama (Middleware)
const verifyAuth = async (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
};

// --- API ENDPOINTS ---

/**
 * 1. AI ile Soru Üretme (Secure Proxy)
 * Frontend API Key'i görmeden soru ister.
 */
export const generateQuestions = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // 1. Güvenlik Kontrolü (İsteğe bağlı: Sadece giriş yapmış kullanıcılar)
      // await verifyAuth(req);

      const { subject, topic, level, count = 10 } = req.body;

      // 2. Prompt Hazırlama
      const prompt = `
        Sen uzman bir öğretmensin. Aşağıdaki kriterlere göre çoktan seçmeli test soruları hazırla.
        
        Ders: ${subject}
        Konu: ${topic || 'Genel'}
        Seviye: ${level || 'Ortaokul'}
        Soru Sayısı: ${count}
        Dil: Türkçe
        
        Çıktı Formatı: Saf JSON Array. Her obje şu yapıda olmalı:
        {
          "text": "Soru metni",
          "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
          "correctIndex": 0 (0-3 arası sayı),
          "explanation": "Doğru cevabın kısa açıklaması",
          "difficulty": 3 (1-5 arası zorluk)
        }
      `;

      // 3. AI İsteği
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Şema tanımlaması (Type Safety)
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.INTEGER }
                }
            }
          }
        }
      });

      // 4. Cevabı Döndür
      const questions = JSON.parse(response.text || "[]");
      res.json({ success: true, data: questions });

    } catch (error: any) {
      logger.error("AI Error", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

/**
 * 2. Sınav Satın Alma (Transactional)
 * Para transferini ve sahiplik devrini atomik (bölünemez) yapar.
 */
export const buyExam = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
        // await verifyAuth(req); // Auth kontrolü
        
        const { userId, examId, creatorId, price } = req.body;

        if (!userId || !examId || !creatorId) {
            throw new Error("Eksik parametre");
        }

        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(userId);
            const teacherRef = db.collection('users').doc(creatorId);
            const examRef = db.collection('exams').doc(examId);
            const systemRef = db.collection('system').doc('config');

            const userDoc = await t.get(userRef);
            const examDoc = await t.get(examRef);
            const systemDoc = await t.get(systemRef);

            if (!userDoc.exists) throw new Error("Kullanıcı bulunamadı");
            if (!examDoc.exists) throw new Error("Sınav bulunamadı");

            // Komisyon Hesabı
            const commissionRate = systemDoc.exists ? systemDoc.data()?.commissionRate || 0.20 : 0.20;
            const earnings = price * (1 - commissionRate);

            // 1. Öğrenciye Sınavı Ekle
            t.update(userRef, {
                purchasedExamIds: admin.firestore.FieldValue.arrayUnion(examId)
            });

            // 2. Öğretmene Para Ekle
            if (price > 0) {
                t.update(teacherRef, {
                    walletBalance: admin.firestore.FieldValue.increment(earnings)
                });
            }

            // 3. Sınav Satış Sayacını Artır
            t.update(examRef, {
                sales: admin.firestore.FieldValue.increment(1)
            });

            // 4. Log Tut
            const logRef = db.collection('transactions').doc();
            t.set(logRef, {
                buyerId: userId,
                sellerId: creatorId,
                examId: examId,
                amount: price,
                commission: price * commissionRate,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: "Satın alma başarılı" });

    } catch (error: any) {
        logger.error("Purchase Error", error);
        res.status(500).json({ success: false, error: error.message });
    }
  });
});

/**
 * 3. İçerik Moderasyonu (AI Guard)
 * Gönderiler paylaşılmadan önce buraya gelir.
 */
export const moderateText = onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { text } = req.body;
            
            const prompt = `
                Aşağıdaki metni bir okul ortamı uygulaması için analiz et.
                Zorbalık, küfür, nefret söylemi veya cinsel içerik var mı?
                
                Metin: "${text}"
                
                JSON Cevap Ver: { "safe": boolean, "reason": "Eğer güvenli değilse nedeni" }
            `;

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const result = JSON.parse(response.text || '{"safe": true}');
            res.json(result);

        } catch (error) {
            // Hata durumunda kullanıcıyı engellememek için (Fail Open) veya engellemek için (Fail Closed) strateji seçilir.
            // Burada güvenli kabul ediyoruz.
            res.json({ safe: true });
        }
    });
});

/**
 * 4. Kullanıcı Silme Tetikleyicisi (Trigger)
 * Bir kullanıcı silindiğinde ona ait verileri temizler.
 */
export const onUserDeleted = require("firebase-functions/v2/firestore").onDocumentDeleted("users/{userId}", async (event: any) => {
    const userId = event.params.userId;
    
    // Kullanıcının gönderilerini sil
    const postsQuery = await db.collection('posts').where('userId', '==', userId).get();
    const batch = db.batch();
    
    postsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Varsa oluşturduğu sınavları arşivle (Silme! Satın alanlar olabilir)
    const examsQuery = await db.collection('exams').where('creatorId', '==', userId).get();
    examsQuery.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'ARCHIVED', isDeleted: true });
    });

    await batch.commit();
    logger.info(`Kullanıcı ${userId} silindi ve verileri temizlendi.`);
});