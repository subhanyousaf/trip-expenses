import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db();
  const col = db.collection('expenses');

  if (req.method === 'GET') {
    const exps = await col.find({}).sort({ id: 1 }).toArray();
    res.status(200).json(exps);
  } else if (req.method === 'POST') {
    const { id, desc, payments } = req.body;
    if (!desc || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    for (const p of payments) {
      if (!p.payer || typeof p.amount !== 'number' || p.amount <= 0) {
        return res.status(400).json({ error: 'Invalid payment entry' });
      }
    }
    await col.insertOne({ id, desc, payments });
    res.status(201).json({ id, desc, payments });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
