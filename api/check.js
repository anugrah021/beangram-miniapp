export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ ok: false, message: 'user_id kosong' });

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHANNEL = '@BeanGram_Official';

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL}&user_id=${user_id}`);
    const data = await tgRes.json();

    if (!data.ok) return res.json({ ok: false, joined: false, error: data.description });

    const status = data.result.status;
    const joined = ['creator', 'administrator', 'member'].includes(status);

    return res.json({ ok: true, joined, status });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}
