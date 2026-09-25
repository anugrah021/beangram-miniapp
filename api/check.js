export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Buat debug buka di browser: /api/check?user_id=123
  const user_id = req.body?.user_id || req.query?.user_id;
  if (!user_id) return res.status(400).json({ ok: false, joined: false, message: 'user_id kosong' });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) return res.json({ ok: false, joined: false, message: 'TELEGRAM_BOT_TOKEN kosong di Vercel' });

  try {
    // Timeout 3.5 detik biar gak lama
    const controller = new AbortController();
    setTimeout(()=>controller.abort(), 3500);

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=@BeanGram_Official&user_id=${user_id}`;
    
    const tgRes = await fetch(url, { signal: controller.signal });
    const data = await tgRes.json();

    console.log('Telegram response:', data);

    if (!data.ok) {
      // Kalau channel private atau bot bukan admin, data.ok = false
      return res.json({ ok: true, joined: false, error: data.description, raw: data });
    }

    const status = data.result.status;
    const joined = ['creator', 'administrator', 'member'].includes(status);
    
    return res.json({ ok: true, joined, status });
  } catch (e) {
    console.log('Fetch error:', e.message);
    // Kalau timeout / error jaringan, anggap aja belum join tapi jangan bikin stuck
    return res.json({ ok: false, joined: false, message: 'Timeout / error: ' + e.message });
  }
}
