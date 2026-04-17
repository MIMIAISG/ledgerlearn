import React, { useState, useEffect } from "react";

const COUNTRIES = {
  Singapore: { symbol: "S$", taxName: "GST", taxRate: 0.09 },
  USA: { symbol: "$", taxName: "Sales Tax", taxRate: 0.07 },
  UK: { symbol: "£", taxName: "VAT", taxRate: 0.2 }
};

export default function AccountingPlatform() {
  const [country, setCountry] = useState("Singapore");
  const [currency, setCurrency] = useState("S$");
  const [taxRate, setTaxRate] = useState(0.09);

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    date: "",
    desc: "",
    debit: "",
    credit: "",
    amount: ""
  });

  useEffect(() => {
    const cfg = COUNTRIES[country];
    setCurrency(cfg.symbol);
    setTaxRate(cfg.taxRate);
  }, [country]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTransaction = () => {
    if (!form.date || !form.desc || !form.amount) {
      alert("Fill all fields");
      return;
    }

    const newTx = {
      ...form,
      amount: parseFloat(form.amount)
    };

    setTransactions([...transactions, newTx]);

    setForm({
      date: "",
      desc: "",
      debit: "",
      credit: "",
      amount: ""
    });
  };

  const totalRevenue = transactions
    .filter((t) => t.credit === "Revenue")
    .reduce((sum, t) => sum + t.amount, 0);

  const tax = totalRevenue * taxRate;

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Accounting ERP System</h2>

      <div>
        <label>Select Country: </label>
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          {Object.keys(COUNTRIES).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <p>
        Currency: {currency} | Tax: {taxRate * 100}%
      </p>

      <h3>Add Transaction</h3>

      <input type="date" name="date" value={form.date} onChange={handleChange} />
      <input placeholder="Description" name="desc" value={form.desc} onChange={handleChange} />
      <input placeholder="Debit Account" name="debit" value={form.debit} onChange={handleChange} />
      <input placeholder="Credit Account" name="credit" value={form.credit} onChange={handleChange} />
      <input type="number" placeholder="Amount" name="amount" value={form.amount} onChange={handleChange} />

      <button onClick={addTransaction}>Add</button>

      <h3>Transactions</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i}>
              <td>{t.date}</td>
              <td>{t.desc}</td>
              <td>{t.debit}</td>
              <td>{t.credit}</td>
              <td>
                {currency} {t.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Summary</h3>
      <p>Total Revenue: {currency} {totalRevenue.toFixed(2)}</p>
      <p>Tax Payable: {currency} {tax.toFixed(2)}</p>
    </div>
  );
}
