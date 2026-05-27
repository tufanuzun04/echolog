// api/summarize.js
export default async function handler(req, res) {
  // CORS ayarları (Dışarıdan istek atılabilmesi için)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri desteklenir.' });
  }

  // Vercel panelinden tanımlayacağınız gizli çevre değişkeni (Environment Variable)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Sunucuda GEMINI_API_KEY tanımlanmamış!' });
  }

  try {
    const { title, desc, maxTokens } = req.body;

    const prompt = `Aşağıdaki İngilizce teknoloji haberi başlığını ve açıklamasını Türkçeye çevir ve kısa, anlaşılır bir özet yaz. 
    
Haber başlığı: ${title}
Açıklama: ${desc}

Kurallar:
- 2-3 cümle yaz
- Türkçe yaz, akıcı ve doğal bir dil kullan
- Teknik terimleri koru (AI, GPU, API gibi)
- Haber tonunda yaz, yorum ekleme
- "Bu haber..." veya "Makale..." gibi girişler kullanma, doğrudan bilgiyi ver`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens || 300,
          temperature: 0.3
        }
      })
    });

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({ error: 'Gemini API hatası oluştu.' });
    }

    const data = await geminiResponse.json();
    const textSummary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    return res.status(200).json({ summary: textSummary });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}