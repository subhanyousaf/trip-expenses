import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';

export default function Home() {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');

  const formatter = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  });

  // Load initial data
  useEffect(() => {
    fetch('/api/people')
      .then(res => res.json())
      .then(setPeople);
    fetch('/api/expenses')
      .then(res => res.json())
      .then(setExpenses);
  }, []);

  const addPerson = async () => {
    if (newPerson.trim() && !people.includes(newPerson.trim())) {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPerson.trim() })
      });
      if (res.ok) {
        setPeople(prev => [...prev, newPerson.trim()]);
        setNewPerson('');
      }
    }
  };

  const addExpense = async () => {
    if (desc.trim() && amount > 0 && payer) {
      const expense = { id: Date.now(), desc: desc.trim(), amount: parseFloat(amount), payer };
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (res.ok) {
        setExpenses(prev => [...prev, expense]);
        setDesc('');
        setAmount('');
        setPayer('');
      }
    }
  };

  const computeBalances = () => {
    const balances = {};
    people.forEach(p => {
      balances[p] = {};
      people.forEach(q => {
        balances[p][q] = 0;
      });
    });
    expenses.forEach(exp => {
      const share = exp.amount / people.length;
      people.forEach(p => {
        if (p !== exp.payer) {
          balances[p][exp.payer] += share;
        }
      });
    });
    return balances;
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balances = computeBalances();

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-purple-50 p-8 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-indigo-800">Trip Expense Calculator</h1>
        <p className="text-indigo-600 mt-2">Track your trip expenses and settle balances easily</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add People</h2>
          <div className="flex gap-3">
            <Input
              placeholder="Person name"
              value={newPerson}
              onChange={e => setNewPerson(e.target.value)}
            />
            <Button onClick={addPerson}>Add</Button>
          </div>
          <ul className="mt-4 list-disc list-inside text-gray-700">
            {people.map(p => <li key={p}>{p}</li>)}
          </ul>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add Expense</h2>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Expense description"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Payer</Label>
              <select
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-indigo-500"
                value={payer}
                onChange={e => setPayer(e.target.value)}
              >
                <option value="">Select payer</option>
                {people.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <Button onClick={addExpense}>Add Expense</Button>
          </div>
        </Card>
      </div>

      <Card className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Total Expense</h2>
        <p className="text-xl font-bold text-indigo-700">{formatter.format(totalExpense)}</p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Expenses</h2>
        {expenses.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700">
            {expenses.map(exp => (
              <li key={exp.id}>
                <span className="font-medium">{exp.desc}</span>: {formatter.format(exp.amount)} <span className="text-gray-600">paid by {exp.payer}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No expenses added yet.</p>
        )}
      </Card>

      <Card className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Balances</h2>
        {people.length > 0 ? (
          Object.entries(balances).map(([debtor, owes]) =>
            Object.entries(owes).map(([creditor, amt]) =>
              debtor !== creditor && amt > 0 ? (
                <details key={`${debtor}-${creditor}`} className="mb-4">
                  <summary className="cursor-pointer font-medium text-indigo-700">
                    {debtor} owes {creditor}: {formatter.format(amt)}
                  </summary>
                  <ul className="ml-6 list-disc list-inside text-gray-700 mt-2">
                    {expenses
                      .filter(exp => exp.payer === creditor && debtor !== exp.payer)
                      .map(exp => {
                        const share = exp.amount / people.length;
                        return (
                          <li key={exp.id}>
                            {exp.desc}: {formatter.format(share)}
                          </li>
                        );
                      })}
                  </ul>
                </details>
              ) : null
            )
          )
        ) : (
          <p className="text-gray-600">No balances to show.</p>
        )}
      </Card>
    </div>
  );
}