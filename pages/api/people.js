import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('people');

  if (req.method === 'GET') {
    const people = await collection.find({}).sort({ name: 1 }).toArray();
    res.status(200).json(people.map(p => p.name));
  } else if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    await collection.insertOne({ name });
    res.status(201).json({ name });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
