import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('expenses');

  if (req.method === 'GET') {
    const expenses = await collection.find({}).sort({ id: 1 }).toArray();
    res.status(200).json(expenses);
  } else if (req.method === 'POST') {
    const { id, desc, amount, payer } = req.body;
    if (!desc || !amount || !payer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    await collection.insertOne({ id, desc, amount, payer });
    res.status(201).json({ id, desc, amount, payer });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
