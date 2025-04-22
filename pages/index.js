import { useState, useEffect } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Label from "../components/ui/Label";

export default function Home() {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [desc, setDesc] = useState("");
  const [payments, setPayments] = useState([{ payer: "", amount: "" }]);

  const formatter = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
  });

  useEffect(() => {
    fetch("/api/people")
      .then((res) => res.json())
      .then((data) => setPeople(data));
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) => setExpenses(data));
  }, []);

  const addPerson = async () => {
    if (!newPerson.trim()) return;
    const person = newPerson.trim();
    await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: person }),
    });
    setPeople((prev) => [...prev, person]);
    setNewPerson("");
  };

  const addExpense = async () => {
    if (!desc.trim()) return;
    const cleaned = payments
      .filter((p) => p.payer && p.amount > 0)
      .map((p) => ({ payer: p.payer, amount: parseFloat(p.amount) }));
    if (cleaned.length === 0) return;

    const expense = {
      id: Date.now(),
      desc: desc.trim(),
      payments: cleaned,
    };

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });

    if (res.ok) {
      setExpenses((prev) => [...prev, expense]);
      setDesc("");
      setPayments([{ payer: "", amount: "" }]);
    }
  };

  const computeBalances = () => {
    const balances = {};
    people.forEach((a) => {
      balances[a] = {};
      people.forEach((b) => {
        balances[a][b] = 0;
      });
    });

    expenses.forEach((exp) => {
      const total = exp.payments.reduce((s, p) => s + p.amount, 0);
      const share = total / people.length;
      const net = {};
      people.forEach((p) => {
        const paidEntry = exp.payments.find((x) => x.payer === p);
        net[p] = (paidEntry ? paidEntry.amount : 0) - share;
      });

      const debtors = people.filter((p) => net[p] < 0);
      const creditors = people.filter((p) => net[p] > 0);

      creditors.forEach((cr) => {
        debtors.forEach((dr) => {
          if (net[cr] <= 0 || net[dr] >= 0) return;
          const amt = Math.min(net[cr], -net[dr]);
          balances[dr][cr] += amt;
          net[cr] -= amt;
          net[dr] += amt;
        });
      });
    });

    return balances;
  };

  const balances = computeBalances();
  const totalExpense = expenses.reduce(
    (sum, exp) => sum + exp.payments.reduce((s, p) => s + p.amount, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-purple-50 p-8 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-indigo-800">
          Trip Expense Calculator
        </h1>
        <p className="text-indigo-600 mt-2">
          Track your trip expenses and settle balances easily
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <Card className="h-full">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Add People
          </h2>
          <div className="flex gap-3">
            <Input
              placeholder="Person name"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
            />
            <Button onClick={addPerson}>Add</Button>
          </div>
          <ul className="mt-4 list-disc list-inside text-gray-700">
            {people.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Card>

        <Card className="h-full flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Add Expense
          </h2>

          <div className="space-y-4 flex-1">
            <div>
              <Label>Description</Label>
              <Input
                type="text"
                placeholder="What was it for?"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            {payments.map((p, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Payer</Label>
                  <select
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-indigo-500"
                    value={p.payer}
                    onChange={(e) => {
                      const next = [...payments];
                      next[i].payer = e.target.value;
                      setPayments(next);
                    }}
                  >
                    <option value="">Select payer</option>
                    {people.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => {
                      const next = [...payments];
                      next[i].amount = e.target.value;
                      setPayments(next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPayments([...payments, { payer: "", amount: "" }])
              }
            >
              + Add another payer
            </Button>
            <Button onClick={addExpense}>Add Expense</Button>
          </div>
        </Card>
      </div>

      <Card className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Total Expense
        </h2>
        <p className="text-xl font-bold text-indigo-700">
          {formatter.format(totalExpense)}
        </p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Expenses</h2>

        {expenses.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700">
            {expenses.map((exp) => {
              const total = exp.payments.reduce((sum, p) => sum + p.amount, 0);

              return (
                <li key={exp.id}>
                  <span className="font-medium">{exp.desc}</span>:{" "}
                  {formatter.format(total)}{" "}
                  <span className="text-gray-600">
                    (
                    {exp.payments
                      .map((p) => `${formatter.format(p.amount)} by ${p.payer}`)
                      .join(", ")}
                    )
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600">No expenses added yet.</p>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Balances</h2>
        {people.length > 0 && totalExpense > 0 ? (
          Object.entries(balances).map(([debtor, owes]) =>
            Object.entries(owes).map(([creditor, amt]) =>
              debtor !== creditor && amt > 0 ? (
                <details key={`${debtor}-${creditor}`} className="mb-4">
                  <summary className="cursor-pointer font-medium text-indigo-700">
                    {debtor} owes {creditor}: {formatter.format(amt)}
                  </summary>
                  <ul className="ml-6 list-disc list-inside text-gray-700 mt-2">
                    {expenses
                      .filter(
                        (exp) =>
                          exp.payments.some((x) => x.payer === creditor) &&
                          exp.payments.every((x) => x.payer !== debtor)
                      )
                      .map((exp) => {
                        const total = exp.payments.reduce(
                          (s, x) => s + x.amount,
                          0
                        );
                        const share = total / people.length;
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
