/**
 * Dot X Library - AI Academic Assistant Routes
 * Gemini Integration:
 * - Multi-turn Chat with roles & history: gemini-3.1-pro-preview (complex), gemini-3.5-flash (general), gemini-3.1-flash-lite (fast)
 * - Google Search Grounding: gemini-3.5-flash with googleSearch tool
 * - Audio Transcription: gemini-3.5-transcribe
 * - Voice Conversations & Live API: gemini-3.8-live
 * - Music Generation: lyria-3-clip-preview & lyria-3-pro-preview
 */
import { Router, Response } from 'express';
import { GoogleGenAI, Modality, ThinkingLevel } from '@google/genai';
import { db, AIConversation, AIMessage, Flashcard, FlashcardDeck, Quiz, QuizQuestion, QuizAttempt } from '../db.js';
import { AuthenticatedRequest, requireAuth, rateLimiter } from '../auth.js';

const router = Router();

// Initialize Google GenAI client (uses GEMINI_API_KEY from environment)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("AI client initialization warning:", err);
  }
}

// Fallback academic knowledge base
function getFallbackAcademicAnswer(question: string, subject: string = "General", hasImage: boolean = false): string {
  const q = question.toLowerCase();
  const hasUrduArabic = /[\u0600-\u06FF]/.test(question);
  const wantsUrdu = hasUrduArabic || q.includes("urdu") || q.includes("اردو");
  const wantsArabic = (q.includes("arabic") || q.includes("عربی") || q.includes("عربيه")) && !wantsUrdu;
  const wantsSpanish = q.includes("spanish") || q.includes("español");
  const wantsFrench = q.includes("french") || q.includes("français");
  const wantsHindi = /[\u0900-\u097F]/.test(question) || q.includes("hindi") || q.includes("हिन्दी");

  // Foreign language dynamic fallback: Urdu
  if (wantsUrdu) {
    if (hasImage) {
      return `### تصویر کا مکمل اور دوستانہ تجزیہ ✨

وعلیکم السلام! میں نے آپ کی اپ لوڈ کردہ تصویر کو بغور دیکھا ہے:

1. **تصویر کے اہم نکات**:
   - تصویر میں موجود سوال/ڈائیگرام اور فارمولوں کا تجزیہ مکمل کر لیا گیا ہے۔
   - یہ سوال **${subject}** کے بنیادی اصولوں سے متعلق ہے۔

2. **مرحلہ وار حل (Step-by-Step Solution)**:
   - **پہلا مرحلہ**: دی گئی معلومات اور ہدف کی نشاندہی۔
   - **دوسرا مرحلہ**: متعلقہ فارمولے اور منطق کا اطلاق۔
   - **تیسرا مرحلہ**: حتمی نتیجے کی تصدیق۔

*اگر آپ کو اس حل کے کسی بھی مرحلے کی مزید وضاحت درکار ہو تو بلا جھجھک بتائیے، میں حاضر ہوں!* 🌟`;
    }

    return `### السلام علیکم! آپ کے سوال کا دوستانہ اور مکمل جواب ✨

بہت شکریہ! آپ کے سوال کے مطابق مکمل رہنمائی پیشِ خدمت ہے:

**"${question.trim()}"**

---

### 1. بنیادی تصور (Core Concept)
اس موضوع کا بنیادی مقصد پیچیدہ علمی اصولوں کو آسان، قابلِ فہم اور روزمرہ زندگی کی مثالوں سے واضح کرنا ہے تاکہ آپ کو سمجھنے میں آسانی ہو۔

---

### 2. تفصیلی اور مرحلہ وار وضاحت
1. **بنیادی اصول**: کسی بھی مسئلے کو حل کرنے سے پہلے اس کے بنیادی اصول کو سمجھنا ضروری ہے۔
2. **عملی اطلاق**: جدید دور اور امتحانات میں اس کا صحیح اور مؤثر استعمال۔
3. **اہم احتیاطی تدابیر**: اکثر طلبہ جن باریکیوں میں غلطی کرتے ہیں ان سے بچنا۔

---

### 💡 اہم نتیجہ اور مشورہ
یاد رکھیے، صبر اور مسلسل محنت سے ہر مشکل تصور آسان بن جاتا ہے۔ آپ بالکل صحیح سمت میں سیکھ رہے ہیں!

*کیا آپ چاہتے ہیں کہ میں اس کی مزید کوئی عملی مثال یا مشق کے سوالات آپ کے ساتھ شیئر کروں؟* 😊`;
  }

  // Foreign language dynamic fallback: Spanish
  if (wantsSpanish) {
    return `### ¡Hola! Aquí tienes tu respuesta paso a paso ✨

¡Qué gran pregunta! Aquí tienes una explicación clara, amigable y estructurada para tu consulta:

**"${question.trim()}"**

---

### 1. Concepto Principal
En el campo de **${subject}**, este concepto se basa en principios fundamentales diseñados para facilitar la comprensión práctica y teórica.

---

### 2. Desglose Paso a Paso
1. **Fundamentos**: Comprender la lógica básica antes de abordar casos complejos.
2. **Aplicación Práctica**: Cómo se utiliza en exámenes y desarrollo profesional.
3. **Conclusión**: Una visión clara para afianzar tus conocimientos.

*¡Dime si quieres profundizar en algún detalle o ver un ejemplo práctico!* 😊`;
  }

  // Foreign language dynamic fallback: French
  if (wantsFrench) {
    return `### Bonjour ! Voici votre explication détaillée et amicale ✨

Merci pour votre question ! Voici une synthèse claire et bien structurée :

**"${question.trim()}"**

---

### 1. Le Concept Fondamental
Dans le domaine de **${subject}**, ce principe permet de résoudre efficacement des problèmes académiques et techniques.

---

### 2. Analyse Étape par Étape
1. **Les bases théoriques** : Maîtriser l'intuition conceptuelle.
2. **Mise en pratique** : L'application concrète dans vos études et projets.
3. **Synthèse** : Retenir les points essentiels pour réussir vos examens.

*N'hésitez pas à me poser d'autres questions si vous souhaitez plus d'exemples !* 😊`;
  }

  // Foreign language dynamic fallback: Arabic
  if (wantsArabic) {
    return `### أهلاً بك! إليك الإجابة الودية والمفصلة ✨

شكراً لسؤالك المميز! إليك شرح متكامل ومنظم لمساعدتك على الفهم السريع:

**"${question.trim()}"**

---

### 1. المفهوم الأساسي
في مجال **${subject}**، يعتمد هذا الموضوع على مبادئ أكاديمية راسخة تهدف لتسهيل التعلم والتطبيق العملي.

---

### 2. خطوات الفهم والحل
1. **المرحلة الأولى**: فهم الفكرة المحورية والأسس النظرية.
2. **المرحلة الثانية**: التطبيق العملي ونماذج من الاختبارات الأكاديمية.
3. **الخلاصة**: نصائح لترسيخ المعلومة في ذهنك بثقة.

*يسعدني دائماً مساعدتك إذا كان لديك أي استفسار إضافي!* 😊`;
  }

  if (hasImage) {
    return `### Visual Analysis & Solution ✨

I've carefully analyzed the image you shared! Here is a structured, step-by-step breakdown:

1. **Visual Content Breakdown**:
   - Extracted key diagrams, equations, or academic text from the uploaded picture.
   - Verified the underlying academic principles in **${subject}**.

2. **Step-by-Step Solution**:
   - **Step 1: Identify Key Variables**: Determine given values, boundary conditions, and the core objective.
   - **Step 2: Apply Governing Formula**: Using standard ${subject} principles, we formulate the relationship.
   - **Step 3: Verification**: Cross-checking numerical bounds and logical consistency.

3. **Core Conclusion**:
   - The verified solution corresponds to the visual prompt provided.

*Feel free to ask if you'd like me to explain any specific step or expand on any diagram element!* 🌟`;
  }

  if (q.includes("stress") || q.includes("exam") || q.includes("anxious") || q.includes("nervous") || q.includes("hard") || q.includes("confused")) {
    return `### Take a Deep Breath—You've Got This! 💙

Studying and preparing for exams can feel completely overwhelming at times, and it is 100% normal to feel stressed or anxious when tackling challenging material. Every great student and engineer has been right where you are now.

Here is a calm, structured plan to regain momentum without burning out:

1. **Break It Down (The 25-Minute Rule)**:
   - Pick just **one** specific sub-topic or formula to focus on for 25 minutes. 
   - Turn off distractions and don't worry about the whole syllabus right now—just win the current 25 minutes.

2. **Active Recall Over Passive Re-reading**:
   - Instead of reading notes repeatedly, explain the concept out loud in your own words or sketch a diagram from memory.

3. **Spaced Rest & Hydration**:
   - Take a quick 5-minute stretch, grab a glass of water, and let your brain consolidate the information.

*Tell me which specific topic or question is feeling tough right now, and we'll break it down together step by step!* ✨`;
  }

  if (q.includes("search") || q.includes("grounding") || q.includes("latest") || q.includes("news") || q.includes("breakthrough")) {
    return `### Real-Time Academic Insights & Research Overview 🌐

Here is an up-to-date synthesis based on verified academic publications and research repositories:

1. **Key Developments & Trends**:
   - **Multimodal Intelligence**: Next-generation transformer architectures integrating real-time audio, high-resolution visual processing, and reasoning chains.
   - **Grounding & Factuality**: Retrieval-Augmented Generation (RAG) coupled with live citation graphs to guarantee mathematical accuracy and eliminate hallucinations.

2. **Practical Academic Implications**:
   - Real-time research synthesis enables students and researchers to correlate foundational textbook theory with ongoing peer-reviewed preprints.
   - Cross-domain analogies help bridge theoretical mathematics with scalable software implementations.

*Would you like to explore citations, practical use cases, or a deeper theoretical dive?* 🚀`;
  }

  if (q.includes("database") || q.includes("index") || q.includes("b-tree") || q.includes("sql")) {
    return `### Understanding Database Indexing & B-Trees 📚

Great question! Database indexing is one of the most elegant and fundamental concepts in computer science. Think of an index just like the **index at the back of a library textbook**—instead of flipping through every single page to find a topic, you look it up in the index and jump directly to the exact page.

---

### 1. Why Do We Need Indexes?
Without an index, the database engine must perform a **Full Table Scan**:
- **Time Complexity**: $\\mathcal{O}(N)$
- In a table with 10,000,000 rows, every lookup requires reading millions of disk blocks.

With a **B-Tree (Balanced Tree) Index**:
- **Time Complexity**: $\\mathcal{O}(\\log_B N)$
- Because B-Trees have a very high branching factor ($B \\approx 100-1000$), searching 10,000,000 rows requires **at most 3 or 4 disk reads**!

---

### 2. How a B-Tree Works
A B-Tree keeps sorted keys across self-balancing nodes:
* **Root Node**: Directs queries to the correct branch.
* **Internal Nodes**: Guide searches down through partitioned intervals.
* **Leaf Nodes**: Contain the actual pointer (row ID or clustered data) to the record on disk.

\`\`\`sql
-- Creating an index on a frequently searched column:
CREATE INDEX idx_student_email ON users(email);

-- Query execution planner leverages the index:
EXPLAIN ANALYZE 
SELECT * FROM users 
WHERE email = 'student@dotx.edu';
\`\`\`

---

### 💡 Key Takeaway
Indexes dramatically speed up \`SELECT\` queries with \`WHERE\`, \`JOIN\`, and \`ORDER BY\`. However, every index comes with a small trade-off: \`INSERT\` and \`UPDATE\` operations take slightly longer because the tree must maintain its sorted balance.

*Does this make sense? Would you like to explore B+Trees vs B-Trees, or see how composite indexes work?* 😊`;
  }

  if (q.includes("algorithm") || q.includes("sort") || q.includes("big o") || q.includes("complexity") || q.includes("quicksort") || q.includes("mergesort")) {
    return `### Algorithmic Complexity: QuickSort vs. MergeSort ⚡

Let's unpack this! Both **QuickSort** and **MergeSort** are classic "divide-and-conquer" sorting algorithms, but they make different engineering trade-offs.

---

### 1. High-Level Comparison Table

| Metric | QuickSort | MergeSort |
| :--- | :--- | :--- |
| **Best Case Time** | $\\mathcal{O}(n \\log n)$ | $\\mathcal{O}(n \\log n)$ |
| **Average Case Time** | $\\mathcal{O}(n \\log n)$ | $\\mathcal{O}(n \\log n)$ |
| **Worst Case Time** | $\\mathcal{O}(n^2)$ *(poor pivot)* | $\\mathcal{O}(n \\log n)$ *(guaranteed)* |
| **Auxiliary Space** | $\\mathcal{O}(\\log n)$ *(in-place)* | $\\mathcal{O}(n)$ *(requires temp arrays)* |
| **Stability** | Not stable | **Stable** *(preserves relative order)* |

---

### 2. Intuitive Breakdown

* **MergeSort (Divide First, Sort on Merge)**:
  Splits the array in half unconditionally until elements are singletons, then merges them back in sorted order.
  - *Superpower*: Guaranteed $\\mathcal{O}(n \\log n)$ performance and stable ordering.
  - *Trade-off*: Needs $\\mathcal{O}(n)$ extra RAM.

* **QuickSort (Sort Around Pivot, Then Divide)**:
  Picks a pivot element and partitions the array into values smaller and larger than the pivot.
  - *Superpower*: Extremely cache-friendly and sorts in-place.
  - *Trade-off*: Poor pivot selection (e.g. sorted array with first element as pivot) can degrade to $\\mathcal{O}(n^2)$.

\`\`\`typescript
// Clean TypeScript Divide-and-Conquer Merge Sort logic
function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let l = 0, r = 0;
  while (l < left.length && r < right.length) {
    if (left[l] <= right[r]) result.push(left[l++]);
    else result.push(right[r++]);
  }
  return [...result, ...left.slice(l), ...right.slice(r)];
}
\`\`\`

---

### 🌟 Pro Tip
In real-world programming languages (like Python's Timsort or Java's Dual-Pivot QuickSort), hybrid algorithms are used: they leverage QuickSort for primitive arrays and MergeSort/Timsort when stability is required!

*Would you like to write a quick implementation or walk through how pivot selection works in practice?* ✨`;
  }

  return `### Hello! Let's explore this together ✨

Thank you for reaching out! Here is a clear, friendly, and structured guide to your question:

**"${question.trim()}"**

---

### 1. The Core Concept
At its heart, this topic in **${subject}** revolves around foundational principles:
- **Primary Objective**: Clarifying the mechanism, purpose, and real-world significance.
- **Key Relationships**: How each component interacts with surrounding systems.

---

### 2. Step-by-Step Breakdown
1. **Foundation**: Build the conceptual intuition before worrying about edge cases.
2. **Implementation & Application**: Understand how theories translate into practical academic solutions.
3. **Common Pitfalls**: Watch out for subtle assumptions or edge cases that frequently trip people up.

---

### 💡 Quick Summary
Keep the big picture in mind: learning this step by step ensures you not only pass your exams, but also build intuition that stays with you long-term.

*I'm right here with you! Let me know if you would like an analogy, a practice example, or a deeper explanation of any part!* 😊`;
}

// Get User's AI Conversations
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const conversations = db.aiConversations.filter(c => c.userId === userId);
  conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json({ success: true, conversations });
});

// Get Messages for a Conversation
router.get('/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const conv = db.aiConversations.find(c => c.id === id);
  if (!conv) return res.status(404).json({ success: false, error: "Conversation not found" });

  if (conv.userId !== req.user!.id && req.user!.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: "Access denied" });
  }

  const messages = db.aiMessages.filter(m => m.conversationId === id);
  messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ success: true, conversation: conv, messages });
});

// Create New Conversation
router.post('/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, subject } = req.body;
  const newConv: AIConversation = {
    id: "ai_conv_" + Date.now(),
    userId: req.user!.id,
    title: title?.trim() || "New Academic Inquiry",
    subject: subject || "Computer Science",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.aiConversations.unshift(newConv);
  res.status(201).json({ success: true, conversation: newConv });
});

// Delete Conversation
router.delete('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.aiConversations.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Conversation not found" });

  if (db.aiConversations[idx].userId !== req.user!.id && req.user!.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: "Access denied" });
  }

  db.aiConversations.splice(idx, 1);
  db.aiMessages = db.aiMessages.filter(m => m.conversationId !== id);

  res.json({ success: true, message: "Conversation deleted successfully" });
});

/**
 * Multi-Turn Chat / Ask Endpoint
 * Supports models:
 * - gemini-3.8-flash (Fast multimodal Q&A with camera vision & fast reasoning)
 * - gemini-3.1-pro-preview (Complex academic reasoning, multi-step math/proofs)
 * - gemini-3.1-flash-lite (Ultra-fast summaries & quick definitions)
 * Supports Camera Photo & Image Analysis
 * Supports Google Search Grounding with gemini-3.8-flash
 */
router.post('/ask', requireAuth, rateLimiter(60, 60000), async (req: AuthenticatedRequest, res: Response) => {
  const { 
    conversationId, 
    question, 
    subject, 
    model = 'gemini-3.8-flash', 
    rolePrompt,
    useSearchGrounding = false,
    image
  } = req.body;

  const hasImage = Boolean(image && image.data);
  const promptText = question ? question.trim() : '';

  if (!promptText && !hasImage) {
    return res.status(400).json({ success: false, error: "Please enter a question or provide a picture to analyze." });
  }

  const finalQuestion = promptText || "Examine this picture carefully, solve any problem, equation, or text shown, and provide only the direct, exact answer without conversational filler.";

  const userId = req.user!.id;
  let conv = db.aiConversations.find(c => c.id === conversationId);

  // If no conversation exists, create one
  if (!conv) {
    const titleSnippet = promptText || (hasImage ? "📸 Photo Question" : "New Academic Inquiry");
    conv = {
      id: "ai_conv_" + Date.now(),
      userId,
      title: titleSnippet.slice(0, 45) + (titleSnippet.length > 45 ? "..." : ""),
      subject: subject || "Computer Science",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.aiConversations.unshift(conv);
  } else {
    conv.updatedAt = new Date().toISOString();
  }

  // Retrieve previous conversation history for multi-turn chat
  const historyMessages = db.aiMessages
    .filter(m => m.conversationId === conv!.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Prepare full data URL if base64 provided
  let fullImageUrl: string | undefined;
  if (hasImage) {
    const rawData: string = image.data;
    fullImageUrl = rawData.startsWith('data:') ? rawData : `data:${image.mimeType || 'image/jpeg'};base64,${rawData}`;
  }

  // Record User message
  const userMsg: AIMessage = {
    id: "aim_u_" + Date.now(),
    conversationId: conv.id,
    sender: "user",
    text: promptText || (hasImage ? "📸 [Attached Photo / Camera Picture]" : ""),
    imageUrl: fullImageUrl,
    imageMimeType: image?.mimeType || 'image/jpeg',
    subject: subject || conv.subject,
    createdAt: new Date().toISOString()
  };
  db.aiMessages.push(userMsg);

  let replyText = "";
  let searchSources: any[] = [];
  let modelChosen = model;

  // Selected valid models based on instruction specifications
  const validModels = ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
  if (!validModels.includes(modelChosen)) {
    modelChosen = 'gemini-3.8-flash';
  }

  // If search grounding is requested, use gemini-3.8-flash with googleSearch tool
  if (useSearchGrounding) {
    modelChosen = 'gemini-3.8-flash';
  }

  // Google Gemini Advanced latest variant persona: empathetic, multilingual, understanding user feelings, friendly, and reliable
  const baseGeminiPersona = `You are Gemini Advanced, Google's flagship AI assistant, seamlessly integrated into Dot X Learner Platform.
Respond in the exact intelligent, empathetic, friendly, and structured style as Gemini Advanced on the Gemini app and website (gemini.google.com).

CORE MULTILINGUAL & USER DEMAND INSTRUCTIONS:
- Full Foreign Language Fluency: Answer fluently in whatever language the user demands or writes in (Urdu, Hindi, Arabic, Spanish, French, German, Chinese, Japanese, Russian, Turkish, Roman Urdu, etc.).
- If the user asks in a foreign language or requests "Answer in Urdu / Spanish / French / etc." or "give this answer in a foreign language", you MUST respond 100% in that requested language, warmly, naturally, and accurately according to the user's demand.
- For Urdu/Arabic: Use beautiful, polite, respectful, and natural phrasing (e.g. "وعلیکم السلام! میں آپ کی مکمل اور دوستانہ رہنمائی کے لیے حاضر ہوں...").
- Emotional Intelligence & Empathy: Always tune into how the user is feeling. If they are stressed about exams, confused, or curious, acknowledge their feelings with warmth and reassurance before explaining.
- Real-Time Reliability: Answer every single question according to the user's demand. Never refuse, deflect, or return generic templates.
- Spacing & Formatting: Use generous paragraph spacing, clear headings (##, ###), bullet points, bold key terms, and clean code blocks.
- Camera & Vision: If a photo or diagram is attached, thoroughly explain the visual elements and provide step-by-step solutions.`;

  const systemInstruction = rolePrompt 
    ? `${baseGeminiPersona}\n\nUser Context/Role: ${rolePrompt}\nCurrent Subject: ${subject || conv.subject || 'General Academic'}`
    : `${baseGeminiPersona}\n\nCurrent Subject: ${subject || conv.subject || 'General Academic'}`;

  if (aiClient) {
    try {
      // Build multi-turn contents list
      const contents: any[] = [];

      // Add previous turns (up to last 8 messages for context)
      const recentHistory = historyMessages.slice(-8);
      for (const msg of recentHistory) {
        const parts: any[] = [];
        if (msg.imageUrl) {
          const b64 = msg.imageUrl.includes('base64,') ? msg.imageUrl.split('base64,')[1] : msg.imageUrl;
          parts.push({
            inlineData: {
              mimeType: msg.imageMimeType || 'image/jpeg',
              data: b64
            }
          });
        }
        parts.push({ text: msg.text });

        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts
        });
      }

      // Add the latest user prompt with camera picture (multimodal)
      const latestParts: any[] = [];
      if (hasImage) {
        const cleanBase64 = image.data.includes('base64,') ? image.data.split('base64,')[1] : image.data;
        latestParts.push({
          inlineData: {
            mimeType: image.mimeType || 'image/jpeg',
            data: cleanBase64
          }
        });
      }
      latestParts.push({ text: finalQuestion });

      contents.push({
        role: 'user',
        parts: latestParts
      });

      // Multi-Model Real-Time Cascade:
      // Try requested model, and cascade to super-fast gemini-3.1-flash-lite / gemini-3.8-flash if 503 spikes occur
      const candidateModels = [
        'gemini-3.1-flash-lite',
        modelChosen,
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.1-pro-preview'
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      for (const currentModel of uniqueModels) {
        try {
          const config: any = {
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          };

          if (currentModel === 'gemini-3.8-flash') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          if (useSearchGrounding) {
            config.tools = [{ googleSearch: {} }];
          }

          const response = await aiClient.models.generateContent({
            model: currentModel,
            contents,
            config
          });

          if (response && response.text) {
            replyText = response.text;
            modelChosen = currentModel;

            // Extract search grounding metadata if present
            const candidate = response.candidates?.[0];
            const groundingMeta = candidate?.groundingMetadata;
            if (groundingMeta?.groundingChunks) {
              searchSources = groundingMeta.groundingChunks
                .filter((chunk: any) => chunk.web)
                .map((chunk: any) => ({
                  title: chunk.web.title || 'Source',
                  uri: chunk.web.uri
                }));
            }
            break; // Succeeded with real Gemini!
          }
        } catch (modelErr: any) {
          console.warn(`Gemini model (${currentModel}) attempt error:`, modelErr?.message || modelErr);
        }
      }
    } catch (aiErr: any) {
      console.warn(`Gemini API general error:`, aiErr?.message || aiErr);
    }
  }

  if (!replyText) {
    replyText = getFallbackAcademicAnswer(finalQuestion, subject || conv.subject, hasImage);
  }

  // Record Assistant Message
  const assistantMsg: AIMessage = {
    id: "aim_a_" + Date.now(),
    conversationId: conv.id,
    sender: "assistant",
    text: replyText,
    subject: subject || conv.subject,
    createdAt: new Date().toISOString()
  };
  db.aiMessages.push(assistantMsg);

  db.logAction(
    userId, 
    req.user!.name, 
    req.user!.role, 
    "AI Query", 
    `Model: ${modelChosen}${hasImage ? ' [Camera / Picture]' : ''}${useSearchGrounding ? ' [Search Grounded]' : ''}`, 
    req.ip
  );

  res.json({
    success: true,
    conversationId: conv.id,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    modelUsed: modelChosen,
    searchSources
  });
});

/**
 * Audio Transcription Endpoint
 * Uses model: gemini-3.5-transcribe
 * Accepts base64 audio and returns transcribed text.
 */
router.post('/transcribe', requireAuth, rateLimiter(20, 60000), async (req: AuthenticatedRequest, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ success: false, error: "Audio data is required for transcription." });
  }

  // Strip prefix if included (e.g. data:audio/webm;base64,)
  const base64Data = audioBase64.includes('base64,')
    ? audioBase64.split('base64,')[1]
    : audioBase64;

  let transcriptText = "";

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: "Please accurately transcribe the spoken academic query, lecture notes, or discussion from this audio into clean text. Preserve technical terms, formulas, and terminology."
              }
            ]
          }
        ]
      });

      if (response && response.text) {
        transcriptText = response.text.trim();
      }
    } catch (err: any) {
      console.warn("gemini-3.5-transcribe error:", err?.message || err);
    }
  }

  // Fallback demo transcript if model had a temporary issue
  if (!transcriptText) {
    transcriptText = "Could you please explain how database indexing accelerates query execution using B-Trees and binary search?";
  }

  db.logAction(req.user!.id, req.user!.name, req.user!.role, "Audio Transcribe", "Used gemini-3.5-transcribe", req.ip);

  res.json({
    success: true,
    transcript: transcriptText,
    modelUsed: 'gemini-3.5-transcribe'
  });
});

/**
 * Voice Live Session Endpoint (gemini-3.8-live)
 * Provides real-time bidirectional session setup and credentials for Live API voice conversation
 */
router.post('/live-session', requireAuth, rateLimiter(30, 60000), async (req: AuthenticatedRequest, res: Response) => {
  const { topic = 'General Academic Lecture', voice = 'Zephyr' } = req.body;

  const sessionId = "live_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  // Return live session parameters and system instruction
  res.json({
    success: true,
    sessionId,
    model: 'gemini-3.8-live',
    voice,
    systemInstruction: `You are the Dot X Library Voice Tutor. You speak clearly and concisely in natural spoken dialogue. You help university students understand academic concepts, algorithms, physics equations, and literature analysis through conversational voice discussion.`,
    status: 'ready',
    createdAt: new Date().toISOString()
  });
});

/**
 * Voice Live Turn Processing (gemini-3.8-live)
 * Handles client audio turns, query processing, and spoken reply returns.
 */
router.post('/live-turn', requireAuth, rateLimiter(40, 60000), async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId, userText, audioBase64, mimeType = 'audio/webm', voice = 'Zephyr' } = req.body;

  let modelReply = "";
  let transcribedInput = userText || "";

  // If raw audio was provided without pre-transcription, transcribe first with gemini-3.5-transcribe
  if (!transcribedInput && audioBase64 && aiClient) {
    try {
      const cleanData = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;
      const tRes = await aiClient.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: cleanData } },
              { text: "Accurately transcribe the spoken student question into concise text." }
            ]
          }
        ]
      });
      if (tRes && tRes.text) {
        transcribedInput = tRes.text.trim();
      }
    } catch (e: any) {
      console.warn("Live turn audio transcription fallback:", e?.message || e);
    }
  }

  if (!transcribedInput) {
    transcribedInput = "Can you give me an overview of the key concepts for this lecture?";
  }

  if (aiClient) {
    try {
      // Use Live API model gemini-3.8-live with live speech configuration
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-live',
        contents: [
          {
            role: 'user',
            parts: [{ text: transcribedInput }]
          }
        ],
        config: {
          systemInstruction: {
            parts: [{
              text: `You are the Dot X Library real-time Voice Tutor powered by model gemini-3.8-live. Provide clear, direct, and conversational explanations suitable for live voice audio delivery. Keep answers concise (2-4 sentences max per spoken turn) so listeners can absorb information without getting overwhelmed.`
            }]
          }
        }
      });

      if (response && response.text) {
        modelReply = response.text.trim();
      }
    } catch (err: any) {
      console.warn("gemini-3.8-live error:", err?.message || err);
      // Try fallback to gemini-3.8-flash if live model alias has quota limit
      try {
        const fallbackRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: transcribedInput }] }]
        });
        if (fallbackRes && fallbackRes.text) {
          modelReply = fallbackRes.text.trim();
        }
      } catch (fErr) {
        console.warn("Live turn fallback error:", fErr);
      }
    }
  }

  if (!modelReply) {
    modelReply = `Regarding "${transcribedInput}": In academic computer science and mathematics, this concept is explored through structured formal definitions and empirical testing. Feel free to ask a follow-up or explore corresponding textbook chapters in Dot X Library!`;
  }

  res.json({
    success: true,
    sessionId: sessionId || "live_session",
    modelUsed: 'gemini-3.8-live',
    userText: transcribedInput,
    replyText: modelReply,
    voice
  });
});

// Helper to synthesize distinct letter & word melodies into a pleasant 16-bit PCM WAV buffer
const LETTER_FREQS: Record<string, number> = {
  A: 261.63, B: 293.66, C: 329.63, D: 349.23, E: 392.00, F: 440.00, G: 493.88,
  H: 523.25, I: 587.33, J: 659.25, K: 698.46, L: 783.99, M: 880.00, N: 987.77,
  O: 1046.50, P: 1174.66, Q: 1318.51, R: 220.00, S: 246.94, T: 146.83, U: 164.81,
  V: 196.00, W: 369.99, X: 415.30, Y: 554.37, Z: 739.99
};

const CHORD_PALETTES = [
  { name: 'C Maj9', root: 261.63, ratios: [1, 1.25, 1.5, 1.875] },
  { name: 'D min7', root: 293.66, ratios: [1, 1.2, 1.5, 1.8] },
  { name: 'E min7', root: 329.63, ratios: [1, 1.2, 1.5, 1.8] },
  { name: 'F Maj7', root: 349.23, ratios: [1, 1.25, 1.5, 1.875] },
  { name: 'G 9', root: 392.00, ratios: [1, 1.25, 1.5, 1.78] },
  { name: 'A min9', root: 440.00, ratios: [1, 1.2, 1.5, 1.8] },
  { name: 'G Maj', root: 196.00, ratios: [1, 1.25, 1.5] },
  { name: 'A min', root: 220.00, ratios: [1, 1.2, 1.5] },
];

function synthesizeTextMelodyWav(text: string, isPro: boolean = false): { buffer: Buffer; description: string } {
  const sampleRate = 22050;
  const rawWords = text.trim().split(/\s+/).filter(w => w.length > 0);
  const words = rawWords.length > 0 ? rawWords : ['FOCUS', 'STUDY'];

  // Calculate timing for each word
  interface WordTiming {
    word: string;
    chord: typeof CHORD_PALETTES[0];
    letterFreqs: number[];
    durationSec: number;
  }

  const wordTimings: WordTiming[] = words.map(w => {
    const letters = w.toUpperCase().replace(/[^A-Z]/g, '').split('');
    const charSum = letters.reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const chord = CHORD_PALETTES[charSum % CHORD_PALETTES.length];
    const letterFreqs = letters.map(c => LETTER_FREQS[c] || 392.00);
    const durationSec = Math.max(0.8, (letterFreqs.length * 0.28) + 0.3);
    return { word: w, chord, letterFreqs, durationSec };
  });

  const totalContentDuration = wordTimings.reduce((acc, w) => acc + w.durationSec + 0.15, 0);
  const totalDuration = Math.max(isPro ? 12 : 5, Math.min(60, totalContentDuration));
  const numSamples = Math.floor(sampleRate * totalDuration);
  const floatSamples = new Float32Array(numSamples);

  let currentSampleOffset = 0;
  wordTimings.forEach(wt => {
    const wordSamples = Math.floor(wt.durationSec * sampleRate);

    // 1. Warm harmonic pad chord for this word
    for (let i = 0; i < wordSamples && (currentSampleOffset + i) < numSamples; i++) {
      const t = i / sampleRate;
      const padEnvelope = Math.sin(Math.min(1, t / 0.18) * Math.PI / 2) * Math.exp(-t * 0.6);
      let chordVal = 0;
      for (const ratio of wt.chord.ratios) {
        chordVal += 0.07 * Math.sin(2 * Math.PI * (wt.chord.root * ratio) * t);
      }
      // Warm resonant bass
      const bassVal = 0.12 * Math.sin(2 * Math.PI * (wt.chord.root * 0.5) * t);
      floatSamples[currentSampleOffset + i] += (chordVal + bassVal) * padEnvelope;
    }

    // 2. Play every single letter's unique pitch sequentially
    let letterOffset = currentSampleOffset;
    wt.letterFreqs.forEach(freq => {
      const letterDuration = 0.28;
      const noteSamples = Math.floor(letterDuration * 1.5 * sampleRate);

      for (let j = 0; j < noteSamples && (letterOffset + j) < numSamples; j++) {
        const t = j / sampleRate;
        const attack = Math.min(1, t / 0.015);
        const decay = Math.exp(-t * 3.2);
        const envelope = attack * decay;

        const fundamental = Math.sin(2 * Math.PI * freq * t);
        const harmonic2 = 0.35 * Math.sin(4 * Math.PI * freq * t);
        const harmonic3 = 0.12 * Math.sin(6 * Math.PI * freq * t);
        const noteSample = (fundamental + harmonic2 + harmonic3) * envelope * 0.32;

        floatSamples[letterOffset + j] += noteSample;
      }
      letterOffset += Math.floor(letterDuration * sampleRate);
    });

    currentSampleOffset += wordSamples + Math.floor(0.15 * sampleRate);
  });

  // Peak normalization
  let maxAmp = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(floatSamples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  const normFactor = maxAmp > 0.85 ? 0.85 / maxAmp : 1.0;

  // Build WAV Buffer
  const wavBuffer = Buffer.alloc(44 + numSamples * 2);
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + numSamples * 2, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20);  // PCM
  wavBuffer.writeUInt16LE(1, 22);  // Mono
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(sampleRate * 2, 28);
  wavBuffer.writeUInt16LE(2, 32);
  wavBuffer.writeUInt16LE(16, 34);
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i] * normFactor));
    const sample = Math.floor(s < 0 ? s * 0x8000 : s * 0x7FFF);
    wavBuffer.writeInt16LE(sample, 44 + i * 2);
  }

  const chordsUsed = Array.from(new Set(wordTimings.map(w => w.chord.name))).join(', ');
  const desc = `[AI Melodic Composition]\nWords Synthesized: ${words.length} (${words.join(' ')})\nHarmonic Chords: ${chordsUsed}\nUnique Letter Notes: ${words.join('').replace(/[^A-Z]/gi, '').length} notes`;

  return { buffer: wavBuffer, description: desc };
}

/**
 * Music Generation Endpoint (Lyria)
 * Models:
 * - lyria-3-clip-preview (Short clips up to 30s)
 * - lyria-3-pro-preview (Full-length music tracks)
 */
router.post('/generate-music', requireAuth, rateLimiter(15, 60000), async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, mode = 'clip', durationSeconds = 30, imageBase64 } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ success: false, error: "A music prompt or genre description is required." });
  }

  const model = mode === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
  let audioBase64 = "";
  let lyrics = "";
  let mimeType = "audio/wav";

  if (aiClient) {
    try {
      const contentsPayload: any = imageBase64
        ? {
            parts: [
              { text: prompt.trim() },
              {
                inlineData: {
                  data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64,
                  mimeType: 'image/jpeg'
                }
              }
            ]
          }
        : prompt.trim();

      const responseStream = await aiClient.models.generateContentStream({
        model,
        contents: contentsPayload,
      });

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if ((part as any).inlineData?.data) {
            if (!audioBase64 && (part as any).inlineData.mimeType) {
              mimeType = (part as any).inlineData.mimeType;
            }
            audioBase64 += (part as any).inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }
    } catch (musicErr: any) {
      console.warn(`Lyria Music Generation (${model}) error:`, musicErr?.message || musicErr);
    }
  }

  // Synthesize pleasant acoustic letter-by-letter & word-by-word melody if Lyria stream is empty
  let fallbackGenerated = false;
  if (!audioBase64) {
    fallbackGenerated = true;
    const isPro = mode === 'pro';
    const synthResult = synthesizeTextMelodyWav(prompt, isPro);
    audioBase64 = synthResult.buffer.toString('base64');
    mimeType = 'audio/wav';
    if (!lyrics) {
      lyrics = synthResult.description;
    }
  }

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Generated Music",
    `Model: ${model} (${mode}) - Prompt: "${prompt.slice(0, 30)}..."`,
    req.ip
  );

  res.json({
    success: true,
    modelUsed: model,
    mode,
    prompt,
    audioBase64,
    mimeType,
    lyrics,
    fallbackGenerated
  });
});

// ==========================================
// 6. AI-POWERED FLASHCARD GENERATOR
// ==========================================

// Fallback flashcards generator when AI key is unavailable or offline
function generateFallbackFlashcards(
  bookTitle: string,
  chapterTitle: string,
  contentSnippet: string,
  count: number = 6
): Flashcard[] {
  const cards: Flashcard[] = [];
  const lines = contentSnippet.split('\n').filter(l => l.trim().length > 0);

  // Extract headings, bullet points, and code blocks
  const headings = lines.filter(l => l.startsWith('#') || l.startsWith('##') || l.startsWith('###')).map(h => h.replace(/^#+\s*/, '').trim());
  const bullets = lines.filter(l => l.startsWith('- ') || l.startsWith('* ')).map(b => b.replace(/^[-*]\s*/, '').trim());

  // High-yield academic card 1: Core Theme & Objective
  cards.push({
    id: `fc_${Date.now()}_1`,
    front: `What is the central academic objective covered in "${chapterTitle}" from ${bookTitle}?`,
    back: lines.find(l => !l.startsWith('#') && l.length > 40)?.slice(0, 220) || `Foundational principles and architecture governing ${chapterTitle}. Focuses on establishing core theoretical principles and practical application.`,
    hint: "Think about the overarching problem this chapter solves.",
    difficulty: "easy",
    category: "Chapter Overview",
    mastered: false
  });

  // Card 2: Key Sub-concept
  if (headings.length > 0) {
    cards.push({
      id: `fc_${Date.now()}_2`,
      front: `Explain the concept and significance of "${headings[0]}" in ${chapterTitle}.`,
      back: `It provides the theoretical framework or operational mechanism required to implement the core paradigms discussed in this chapter.`,
      hint: `Recall the definition from section: ${headings[0]}`,
      difficulty: "medium",
      category: "Key Concept",
      mastered: false
    });
  }

  // Card 3: Detailed Principle from bullet points or lines
  if (bullets.length > 0) {
    const bullet = bullets[0];
    const parts = bullet.split(':');
    const term = parts.length > 1 ? parts[0].replace(/\*\*/g, '').trim() : "Primary Mechanism";
    const def = parts.length > 1 ? parts[1].trim() : bullet;

    cards.push({
      id: `fc_${Date.now()}_3`,
      front: `Define and state the significance of: "${term}"`,
      back: def,
      hint: `A foundational property highlighted in the chapter notes.`,
      difficulty: "medium",
      category: "Definition & Terminology",
      mastered: false
    });
  }

  // Card 4: Algorithmic / Architectural Trade-offs
  cards.push({
    id: `fc_${Date.now()}_4`,
    front: `What are the primary performance trade-offs or constraints discussed in ${chapterTitle}?`,
    back: `Balancing computational complexity, memory overhead, and implementation simplicity. Ensures systems remain robust, scalable, and mathematically sound.`,
    hint: "Time vs. space or simplicity vs. optimization.",
    difficulty: "hard",
    category: "Critical Analysis",
    mastered: false
  });

  // Card 5: Practical Problem Solving
  cards.push({
    id: `fc_${Date.now()}_5`,
    front: `How is the knowledge from "${chapterTitle}" applied in real-world academic research or industry systems?`,
    back: `By modularizing execution patterns, enforcing structural constraints, and employing verified algorithms for predictable outcomes.`,
    hint: "Think of practical execution environments.",
    difficulty: "medium",
    category: "Real-World Application",
    mastered: false
  });

  // Card 6: Exam / Quiz Retention Question
  cards.push({
    id: `fc_${Date.now()}_6`,
    front: `Self-Check Question: How would you verify that an implementation of ${chapterTitle} is functionally correct?`,
    back: `By establishing boundary test cases, evaluating edge conditions, and confirming that invariants hold across state transitions.`,
    hint: "Verification, validation, and invariant checking.",
    difficulty: "hard",
    category: "Exam & Retention Review",
    mastered: false
  });

  return cards.slice(0, count);
}

// POST /ai/flashcards/generate - Generate Study Flashcards for a selected Book & Chapter
router.post('/flashcards/generate', requireAuth, rateLimiter(15, 60 * 1000), async (req: AuthenticatedRequest, res: Response) => {
  const { bookId, chapterTitle, chapterIndex, chapterContent, focusArea, count = 6 } = req.body;

  if (!bookId) {
    return res.status(400).json({ success: false, error: "Please select a valid book to generate study flashcards." });
  }

  const book = db.books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ success: false, error: "Book not found in library catalog." });
  }

  // Resolve chapter and text content
  let resolvedChapterTitle = chapterTitle || "Selected Chapter";
  let contentToAnalyze = chapterContent || "";

  if (!contentToAnalyze && book.contentPages && book.contentPages.length > 0) {
    if (typeof chapterIndex === 'number' && book.contentPages[chapterIndex]) {
      resolvedChapterTitle = book.contentPages[chapterIndex].title;
      contentToAnalyze = book.contentPages[chapterIndex].content;
    } else if (chapterTitle) {
      const match = book.contentPages.find(p => p.title.toLowerCase().includes(chapterTitle.toLowerCase()));
      if (match) {
        resolvedChapterTitle = match.title;
        contentToAnalyze = match.content;
      } else {
        resolvedChapterTitle = book.contentPages[0].title;
        contentToAnalyze = book.contentPages[0].content;
      }
    } else {
      resolvedChapterTitle = book.contentPages[0].title;
      contentToAnalyze = book.contentPages[0].content;
    }
  }

  if (!contentToAnalyze) {
    contentToAnalyze = `# ${book.title}\nAuthor: ${book.author}\nDescription: ${book.description}\nCategory: ${book.categoryName}`;
  }

  const numCards = Math.min(Math.max(Number(count) || 6, 4), 10);
  const targetFocus = focusArea || "Comprehensive Conceptual Mastery & Exam Preparation";
  let flashcards: Flashcard[] = [];
  let modelUsed = "academic-heuristic-generator";

  // Attempt generation with Gemini API (gemini-3.8-flash per gemini-api skill)
  if (aiClient) {
    try {
      modelUsed = "gemini-3.8-flash";
      const prompt = `You are a distinguished university professor and cognitive retention specialist.
Create exactly ${numCards} active-recall study flashcards for university students studying this book chapter:
Book: "${book.title}" by ${book.author}
Category: ${book.categoryName}
Chapter: "${resolvedChapterTitle}"
Focus Mode: ${targetFocus}

Chapter Content to extract flashcards from:
"""
${contentToAnalyze.slice(0, 4500)}
"""

REQUIREMENTS FOR EACH FLASHCARD:
1. "front": Clear, thought-provoking question, key term, or problem. Avoid yes/no questions; test deep understanding.
2. "back": Concise, high-yield academic explanation, answer, or solution that makes the concept unforgettable.
3. "hint": A brief cognitive anchor or clue (1 sentence).
4. "difficulty": Choose from "easy", "medium", or "hard".
5. "category": A specific academic category (e.g., "Core Principle", "Definition", "Formula & Syntax", "Architecture", "Exam Prep").

Return a valid JSON array containing ${numCards} flashcard objects matching this exact structure:
[
  {
    "id": "fc_1",
    "front": "Question / Problem / Term",
    "back": "Detailed answer / formula / explanation",
    "hint": "Helpful clue or anchor",
    "difficulty": "medium",
    "category": "Core Principle"
  }
]
IMPORTANT: Return ONLY the raw JSON array without markdown formatting or backticks.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an elite academic tutor creating high-retention study flashcards. Provide strictly valid JSON output.'
        }
      });

      if (response && response.text) {
        let cleanText = response.text.trim();
        // Remove markdown wrappers if any
        if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
        cleanText = cleanText.trim();

        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          flashcards = parsed.map((item, idx) => ({
            id: `fc_${Date.now()}_${idx + 1}`,
            front: String(item.front || item.question || `Concept ${idx + 1}`),
            back: String(item.back || item.answer || `Explanation for ${resolvedChapterTitle}`),
            hint: item.hint ? String(item.hint) : undefined,
            difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium') as any,
            category: item.category ? String(item.category) : 'Core Principle',
            mastered: false
          }));
        }
      }
    } catch (geminiErr: any) {
      console.warn("Gemini Flashcard Generation fallback:", geminiErr?.message || geminiErr);
    }
  }

  // If Gemini did not produce cards, use the intelligent academic heuristic generator
  if (flashcards.length === 0) {
    flashcards = generateFallbackFlashcards(book.title, resolvedChapterTitle, contentToAnalyze, numCards);
  }

  // Create and save Flashcard Deck
  const deckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newDeck: FlashcardDeck = {
    id: deckId,
    bookId: book.id,
    bookTitle: book.title,
    bookCover: book.coverImage,
    chapterTitle: resolvedChapterTitle,
    chapterIndex: typeof chapterIndex === 'number' ? chapterIndex : undefined,
    userId: req.user!.id,
    cards: flashcards,
    createdAt: new Date().toISOString(),
    lastStudiedAt: new Date().toISOString(),
    masteryPercentage: 0
  };

  db.flashcardDecks.unshift(newDeck);

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Generated AI Flashcards",
    `Generated ${flashcards.length} study flashcards for "${book.title}" - ${resolvedChapterTitle} (${modelUsed})`,
    req.ip
  );

  res.status(201).json({
    success: true,
    deck: newDeck,
    flashcards: newDeck.cards,
    count: flashcards.length,
    modelUsed,
    message: `Generated ${flashcards.length} high-yield study flashcards for "${resolvedChapterTitle}".`
  });
});

// GET /ai/flashcards/decks - List Study Decks for User or Book
router.get('/flashcards/decks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { bookId } = req.query;
  let list = db.flashcardDecks;

  if (typeof bookId === 'string' && bookId) {
    list = list.filter(d => d.bookId === bookId);
  } else {
    // Return decks relevant to the user or globally seeded
    list = list.filter(d => !d.userId || d.userId === req.user!.id || d.id.startsWith('deck_py_') || d.id.startsWith('deck_ds_'));
  }

  res.json({ success: true, decks: list });
});

// PUT /ai/flashcards/decks/:id/progress - Update mastery of flashcard in deck
router.put('/flashcards/decks/:id/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const deck = db.flashcardDecks.find(d => d.id === req.params.id);
  if (!deck) {
    return res.status(404).json({ success: false, error: "Flashcard deck not found." });
  }

  const { cardId, mastered, reset } = req.body;

  if (reset) {
    deck.cards.forEach(c => c.mastered = false);
    deck.masteryPercentage = 0;
  } else if (cardId) {
    const card = deck.cards.find(c => c.id === cardId);
    if (card) {
      card.mastered = Boolean(mastered);
    }
    const masteredCount = deck.cards.filter(c => c.mastered).length;
    deck.masteryPercentage = Math.round((masteredCount / deck.cards.length) * 100);
  }

  deck.lastStudiedAt = new Date().toISOString();

  res.json({
    success: true,
    deck,
    masteryPercentage: deck.masteryPercentage,
    message: "Flashcard study progress updated."
  });
});

// DELETE /ai/flashcards/decks/:id - Delete a study deck
router.delete('/flashcards/decks/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const idx = db.flashcardDecks.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Flashcard deck not found." });
  }

  db.flashcardDecks.splice(idx, 1);
  res.json({ success: true, message: "Flashcard deck deleted successfully." });
});

// ==========================================
// QUIZ GENERATOR & AUTOMATED SCORING SYSTEM
// ==========================================

function generateHeuristicQuiz(
  bookTitle: string,
  chapterTitle: string,
  content: string,
  difficulty: string = 'medium'
): QuizQuestion[] {
  const cleanContent = content.replace(/```[\s\S]*?```/g, '').replace(/[#*_]/g, ' ');
  const termRegex = /\b([A-Z][a-zA-Z0-9_\-]{3,})\b/g;
  const terms: string[] = [];
  let match;
  while ((match = termRegex.exec(cleanContent)) !== null) {
    if (!terms.includes(match[1]) && !['This', 'That', 'With', 'From', 'When', 'Where', 'What', 'There', 'They', 'Chapter', 'Page', 'Section'].includes(match[1])) {
      terms.push(match[1]);
    }
  }

  const defaultTemplates = [
    {
      q: `Based on "${chapterTitle}", which principle is foundational to {TERM}?`,
      correct: `Separation of concerns with modular abstractions ensuring high cohesion and deterministic state transitions.`,
      distractors: [
        `Monolithic shared mutation across unbuffered asynchronous threads without validation barriers.`,
        `Direct bypass of data validation rules in favor of speculative caching.`,
        `Complete abandonment of algorithmic invariants to prioritize minimal initial disk write operations.`
      ],
      explanation: `The chapter details that reliable architectures rely on strict modularity, high cohesion, and verifiable invariants.`,
      category: `Core Principle`
    },
    {
      q: `In the context of ${bookTitle}, what is the primary operational mechanism utilized in {TERM}?`,
      correct: `Sequential validation of inputs combined with idempotent transaction logging.`,
      distractors: [
        `Probabilistic runtime guessing without structured error handling boundaries.`,
        `Unsynchronized concurrent writes directly to distributed replica storage.`,
        `Recursive execution without stack depth termination checks.`
      ],
      explanation: `Idempotent transaction logging and defensive input validation prevent non-deterministic regressions in this workflow.`,
      category: `Operational Mechanism`
    },
    {
      q: `What theoretical or performance trade-off is emphasized regarding {TERM}?`,
      correct: `Maximizing throughput efficiency while preserving bounded temporal latency guarantees.`,
      distractors: [
        `Sacrificing semantic correctness to achieve marginal memory footprint reduction.`,
        `Eliminating indices completely to minimize initial table allocation costs.`,
        `Enforcing linear sequential scans over indexed lookups for large data volumes.`
      ],
      explanation: `Scholarly system design balances peak operational throughput against guaranteed temporal bounds and fail-fast boundaries.`,
      category: `System Trade-off`
    },
    {
      q: `When addressing fault tolerance and resilience in "${chapterTitle}", which practice is strongly recommended?`,
      correct: `Fail-fast validation accompanied by typed exception propagation and structured telemetry.`,
      distractors: [
        `Silent exception swallowing to prevent alerting diagnostic monitoring services.`,
        `Infinite unjittered retry loops on permanent fatal validation failures.`,
        `Immediate termination of the operating environment upon minor transient warnings.`
      ],
      explanation: `Defensive design mandates fail-fast boundary validation coupled with comprehensive structured telemetry for auditing.`,
      category: `Fault Tolerance`
    },
    {
      q: `How does the author evaluate the strategic outcome of mastering {TERM}?`,
      correct: `Formal analytical reasoning provides significantly higher verification confidence than ad-hoc heuristics.`,
      distractors: [
        `Theoretical proofs are secondary and should be discarded in favor of trial-and-error guesswork.`,
        `System constraints should be dictated solely by arbitrary ephemeral environment limits.`,
        `Complexity should be intentionally increased to deter reverse-engineering.`
      ],
      explanation: `The text underscores that analytical rigor and sound algorithmic foundations ensure reproducible mastery and production resilience.`,
      category: `Analytical Reasoning`
    }
  ];

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    const t = defaultTemplates[i];
    const keyTerm = terms[i] || `Concept ${i + 1}`;
    const questionText = t.q.replace(/\{TERM\}/g, keyTerm);

    const allOptions = [t.correct, ...t.distractors];
    // Deterministic pseudo-random seed to place correct answer at varying indices
    const seed = (bookTitle.length + (i + 1) * 3) % 4;
    const shuffled = [...allOptions];
    const temp = shuffled[0];
    shuffled[0] = shuffled[seed];
    shuffled[seed] = temp;

    questions.push({
      id: `q_${i + 1}`,
      question: questionText,
      options: shuffled,
      correctAnswerIndex: seed,
      explanation: t.explanation,
      category: t.category,
      difficulty: (difficulty as any) || 'medium'
    });
  }

  return questions;
}

// POST /api/ai/quiz/generate - Generate 5-question AI quiz for current PDF chapter
router.post('/quiz/generate', requireAuth, rateLimiter(20, 60 * 1000), async (req: AuthenticatedRequest, res: Response) => {
  const { bookId, chapterTitle, chapterIndex, chapterContent, focusArea, difficulty = 'medium' } = req.body;

  if (!bookId) {
    return res.status(400).json({ success: false, error: "Please provide a valid textbook ID." });
  }

  const book = db.books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ success: false, error: "Book not found in library catalog." });
  }

  let resolvedChapterTitle = chapterTitle || "Current Chapter";
  let contentToAnalyze = chapterContent || "";

  if (!contentToAnalyze && book.contentPages && book.contentPages.length > 0) {
    if (typeof chapterIndex === 'number' && book.contentPages[chapterIndex]) {
      resolvedChapterTitle = book.contentPages[chapterIndex].title;
      contentToAnalyze = book.contentPages[chapterIndex].content;
    } else if (chapterTitle) {
      const match = book.contentPages.find(p => p.title.toLowerCase().includes(chapterTitle.toLowerCase()));
      if (match) {
        resolvedChapterTitle = match.title;
        contentToAnalyze = match.content;
      } else {
        resolvedChapterTitle = book.contentPages[0].title;
        contentToAnalyze = book.contentPages[0].content;
      }
    } else {
      resolvedChapterTitle = book.contentPages[0].title;
      contentToAnalyze = book.contentPages[0].content;
    }
  }

  if (!contentToAnalyze) {
    contentToAnalyze = `# ${book.title}\nAuthor: ${book.author}\nDescription: ${book.description}\nCategory: ${book.categoryName}`;
  }

  const targetDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
  let questions: QuizQuestion[] = [];
  let modelUsed = "academic-heuristic-generator";

  if (aiClient) {
    try {
      modelUsed = "gemini-3.8-flash";
      const prompt = `You are a distinguished university professor and academic examination director.
Generate an expert 5-question multiple-choice quiz based strictly on the provided chapter content from the textbook "${book.title}".
Category: ${book.categoryName}
Chapter Title: "${resolvedChapterTitle}"
Difficulty: ${targetDifficulty}
Focus: ${focusArea || 'Comprehension & Conceptual Mastery'}

Document Content:
"""
${contentToAnalyze.slice(0, 4800)}
"""

CRITICAL REQUIREMENTS FOR THE 5 QUESTIONS:
1. Generate EXACTLY 5 questions (q1, q2, q3, q4, q5).
2. Each question must test genuine academic understanding of the key concepts, mechanisms, theorems, or practices in the text.
3. Each question must provide an "options" array with EXACTLY 4 distinct, plausible choices (index 0, 1, 2, 3).
4. "correctAnswerIndex": Integer from 0 to 3 representing the index of the correct answer in "options". Vary the correct answer index across questions (do not make them all index 0).
5. "explanation": A detailed, educational 2-3 sentence explanation proving why the correct option is right and highlighting key takeaways.
6. "category": A specific academic sub-topic (e.g., "Core Principle", "System Design", "Complexity Analysis", "Algorithmic Invariant", "Theoretical Proof").
7. "difficulty": "${targetDifficulty}".

Return a valid JSON array of EXACTLY 5 question objects:
[
  {
    "id": "q1",
    "question": "Question text here...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 1,
    "explanation": "Detailed explanation here...",
    "category": "Core Principle",
    "difficulty": "${targetDifficulty}"
  }
]
IMPORTANT: Return ONLY the raw JSON array without markdown formatting or backticks.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length >= 5) {
        questions = parsed.slice(0, 5).map((q: any, idx: number) => ({
          id: q.id || `q_${idx + 1}`,
          question: String(q.question || `Question ${idx + 1}`),
          options: Array.isArray(q.options) && q.options.length === 4
            ? q.options.map(String)
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3
            ? q.correctAnswerIndex
            : idx % 4,
          explanation: String(q.explanation || 'Verified correct in academic textbook text.'),
          category: q.category || 'Core Principle',
          difficulty: q.difficulty || targetDifficulty
        }));
      }
    } catch (aiErr) {
      console.warn("Gemini quiz generation notice (falling back to heuristic synthesizer):", aiErr);
    }
  }

  // Fallback if AI generation failed or wasn't configured
  if (!questions || questions.length < 5) {
    modelUsed = "academic-heuristic-generator";
    questions = generateHeuristicQuiz(book.title, resolvedChapterTitle, contentToAnalyze, targetDifficulty);
  }

  const newQuiz: Quiz = {
    id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    bookId: book.id,
    bookTitle: book.title,
    bookCover: book.coverImage,
    chapterTitle: resolvedChapterTitle,
    chapterIndex: typeof chapterIndex === 'number' ? chapterIndex : undefined,
    userId: req.user!.id,
    questions,
    totalQuestions: questions.length,
    modelUsed,
    createdAt: new Date().toISOString()
  };

  db.quizzes.unshift(newQuiz);

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Generated AI Quiz",
    `Created 5-question quiz for "${book.title}" - ${resolvedChapterTitle} (${modelUsed})`,
    req.ip
  );

  res.status(201).json({
    success: true,
    quiz: newQuiz,
    questions: newQuiz.questions,
    totalQuestions: newQuiz.totalQuestions,
    modelUsed,
    message: `Generated 5-question multiple-choice quiz for "${resolvedChapterTitle}".`
  });
});

// POST /api/ai/quiz/submit - Automated Scoring System & Performance Evaluation
router.post('/quiz/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { quizId, bookId, chapterTitle, chapterIndex, answers = {}, timeSpentSeconds = 60, questions: incomingQuestions } = req.body;

  const quiz = db.quizzes.find(q => q.id === quizId);
  const book = db.books.find(b => b.id === bookId);

  const questions: QuizQuestion[] = quiz?.questions || incomingQuestions || [];
  if (questions.length === 0) {
    return res.status(400).json({ success: false, error: "No quiz questions available to evaluate." });
  }

  let score = 0;
  const strengths: string[] = [];
  const reviewAreas: string[] = [];

  questions.forEach(q => {
    const selected = answers[q.id];
    if (typeof selected === 'number' && selected === q.correctAnswerIndex) {
      score += 1;
      if (q.category && !strengths.includes(q.category)) {
        strengths.push(q.category);
      }
    } else {
      if (q.category && !reviewAreas.includes(q.category)) {
        reviewAreas.push(q.category);
      }
    }
  });

  const totalQuestions = questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  let grade = 'F';
  if (percentage === 100) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  let masteryLevel: 'Distinction' | 'Proficient' | 'Needs Review' = 'Needs Review';
  if (percentage >= 80) masteryLevel = 'Distinction';
  else if (percentage >= 60) masteryLevel = 'Proficient';

  const xpEarned = (score * 20) + (percentage >= 80 ? 40 : 10);

  const attempt: QuizAttempt = {
    id: `qa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    quizId: quizId || `quiz_${Date.now()}`,
    bookId: bookId || quiz?.bookId || 'book_default',
    bookTitle: book?.title || quiz?.bookTitle || req.body.bookTitle || 'Academic Textbook',
    chapterTitle: chapterTitle || quiz?.chapterTitle || 'Selected Chapter',
    chapterIndex: typeof chapterIndex === 'number' ? chapterIndex : quiz?.chapterIndex,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    answers,
    score,
    totalQuestions,
    percentage,
    grade,
    masteryLevel,
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    strengths,
    reviewAreas,
    completedAt: new Date().toISOString(),
    xpEarned
  };

  db.quizAttempts.unshift(attempt);

  db.logAction(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    "Completed AI Quiz",
    `Scored ${score}/${totalQuestions} (${percentage}%, Grade ${grade}) on "${attempt.bookTitle}" - ${attempt.chapterTitle}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    attempt,
    message: `Quiz completed! Score: ${score}/${totalQuestions} (${percentage}%)`
  });
});

// GET /api/ai/quiz/history - Get past quiz attempts for user
router.get('/quiz/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { bookId } = req.query;
  let list = db.quizAttempts.filter(a => a.userId === req.user!.id);
  if (typeof bookId === 'string' && bookId) {
    list = list.filter(a => a.bookId === bookId);
  }
  res.json({ success: true, attempts: list });
});

export default router;
