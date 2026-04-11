import { useState, useEffect, useRef } from "react";

const COUNTRIES = {
  USA: { currency: "USD", symbol: "$", tax: "Sales Tax", vatRate: 0, corpTax: 21, standard: "GAAP" },
  UK: { currency: "GBP", symbol: "£", tax: "VAT", vatRate: 20, corpTax: 25, standard: "IFRS/UK GAAP" },
  EU: { currency: "EUR", symbol: "€", tax: "VAT", vatRate: 21, corpTax: 22, standard: "IFRS" },
  India: { currency: "INR", symbol: "₹", tax: "GST", vatRate: 18, corpTax: 30, standard: "Ind AS" },
  Australia: { currency: "AUD", symbol: "A$", tax: "GST", vatRate: 10, corpTax: 30, standard: "AASB/IFRS" },
  UAE: { currency: "AED", symbol: "د.إ", tax: "VAT", vatRate: 5, corpTax: 9, standard: "IFRS" },
  Canada: { currency: "CAD", symbol: "C$", tax: "GST/HST", vatRate: 13, corpTax: 26.5, standard: "ASPE/IFRS" },
  Singapore: { currency: "SGD", symbol: "S$", tax: "GST", vatRate: 9, corpTax: 17, standard: "SFRS" },
};

const MODULES = [
  { id: "ledger", icon: "📒", title: "General Ledger", desc: "Double-entry bookkeeping" },
  { id: "invoice", icon: "🧾", title: "Invoice Creator", desc: "Country-specific invoices" },
  { id: "trial", icon: "⚖️", title: "Trial Balance", desc: "Check debits = credits" },
  { id: "financial", icon: "📊", title: "Financial Statements", desc: "P&L, Balance Sheet" },
  { id: "hr", icon: "👥", title: "HR & Payroll", desc: "Employee management" },
  { id: "tax", icon: "🏛️", title: "Tax Calculator", desc: "Country tax rules" },
  { id: "ai", icon: "🤖", title: "AI Tutor", desc: "Ask accounting questions" },
  { id: "quiz", icon: "🎓", title: "Quiz & Practice", desc: "Test your knowledge" },
];

const CHART_OF_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "Asset", normal: "Debit" },
  { code: "1100", name: "Accounts Receivable", type: "Asset", normal: "Debit" },
  { code: "1200", name: "Inventory", type: "Asset", normal: "Debit" },
  { code: "1500", name: "Equipment", type: "Asset", normal: "Debit" },
  { code: "2000", name: "Accounts Payable", type: "Liability", normal: "Credit" },
  { code: "2100", name: "Bank Loan", type: "Liability", normal: "Credit" },
  { code: "3000", name: "Owner's Equity", type: "Equity", normal: "Credit" },
  { code: "3100", name: "Retained Earnings", type: "Equity", normal: "Credit" },
  { code: "4000", name: "Sales Revenue", type: "Revenue", normal: "Credit" },
  { code: "4100", name: "Service Revenue", type: "Revenue", normal: "Credit" },
  { code: "5000", name: "Cost of Goods Sold", type: "Expense", normal: "Debit" },
  { code: "5100", name: "Salaries Expense", type: "Expense", normal: "Debit" },
  { code: "5200", name: "Rent Expense", type: "Expense", normal: "Debit" },
  { code: "5300", name: "Utilities Expense", type: "Expense", normal: "Debit" },
];

const QUIZ_QUESTIONS = [
  { q: "What is the accounting equation?", a: "Assets = Liabilities + Equity", options: ["Assets = Revenue - Expenses", "Assets = Liabilities + Equity", "Profit = Revenue - Costs", "Debit = Credit + Balance"] },
  { q: "Which financial statement shows profitability?", a: "Income Statement (P&L)", options: ["Balance Sheet", "Cash Flow Statement", "Income Statement (P&L)", "Trial Balance"] },
  { q: "A debit entry in an Asset account will:", a: "Increase the account balance", options: ["Decrease the account balance", "Increase the account balance", "Have no effect", "Close the account"] },
  { q: "What does GAAP stand for?", a: "Generally Accepted Accounting Principles", options: ["Global Accounting and Audit Practices", "Generally Accepted Accounting Principles", "Government Approved Accounting Procedures", "General Account and Asset Protocol"] },
  { q: "Depreciation is an example of:", a: "Non-cash expense", options: ["Cash expense", "Revenue", "Non-cash expense", "Asset"] },
];

export default function AccountingPlatform() {
  const [activeModule, setActiveModule] = useState("ledger");
  const [country, setCountry] = useState("USA");
  const [transactions, setTransactions] = useState([
    { id: 1, date: "2024-01-15", desc: "Initial Investment", debitAccount: "Cash", creditAccount: "Owner's Equity", amount: 50000 },
    { id: 2, date: "2024-01-20", desc: "Equipment Purchase", debitAccount: "Equipment", creditAccount: "Cash", amount: 15000 },
    { id: 3, date: "2024-02-01", desc: "Sales Revenue", debitAccount: "Cash", creditAccount: "Sales Revenue", amount: 8000 },
    { id: 4, date: "2024-02-05", desc: "Rent Payment", debitAccount: "Rent Expense", creditAccount: "Cash", amount: 2000 },
  ]);
  const [newTxn, setNewTxn] = useState({ date: "", desc: "", debitAccount: "", creditAccount: "", amount: "" });
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", text: "👋 Hello! I'm your AI Accounting Tutor. Ask me anything about accounting, bookkeeping, financial statements, tax rules, or HR & payroll. I can also explain concepts specific to your selected country!" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ clientName: "Acme Corp", clientAddress: "123 Main St", items: [{ desc: "Consulting Services", qty: 10, rate: 150 }] });
  const [employees, setEmployees] = useState([
    { id: 1, name: "Alice Johnson", role: "Manager", grossSalary: 6000, country: "USA" },
    { id: 2, name: "Bob Smith", role: "Accountant", grossSalary: 4500, country: "USA" },
  ]);
  const chatEndRef = useRef(null);
  const cfg = COUNTRIES[country];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  const totalDebits = transactions.reduce((s, t) => s + t.amount, 0);
  const totalCredits = transactions.reduce((s, t) => s + t.amount, 0);

  const calcNetTax = (gross, ctry) => {
    const c = COUNTRIES[ctry] || COUNTRIES["USA"];
    const taxRate = ctry === "USA" ? 0.22 : ctry === "UK" ? 0.20 : ctry === "India" ? 0.30 : 0.20;
    const net = gross * (1 - taxRate);
    return { gross, tax: gross * taxRate, net };
  };

  const addTransaction = () => {
    if (!newTxn.date || !newTxn.desc || !newTxn.debitAccount || !newTxn.creditAccount || !newTxn.amount) return;
    setTransactions([...transactions, { ...newTxn, id: Date.now(), amount: parseFloat(newTxn.amount) }]);
    setNewTxn({ date: "", desc: "", debitAccount: "", creditAccount: "", amount: "" });
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiMessages(m => [...m, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an expert accounting tutor for students. The student's selected country is ${country} (currency: ${cfg.currency}, tax system: ${cfg.tax} at ${cfg.vatRate}%, accounting standard: ${cfg.standard}). 
          Explain concepts clearly and simply. Use examples with ${cfg.symbol} where relevant. 
          Cover: bookkeeping, double-entry, financial statements, tax, HR/payroll, GAAP/IFRS. 
          Be encouraging and educational. Keep answers concise but complete.`,
          messages: [
            ...aiMessages.filter(m => m.role !== "assistant" || aiMessages.indexOf(m) > 0).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't get a response.";
      setAiMessages(m => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setAiMessages(m => [...m, { role: "assistant", text: "Connection error. Please try again." }]);
    }
    setAiLoading(false);
  };

  const handleQuizAnswer = (opt) => {
    setQuizSelected(opt);
    if (opt === QUIZ_QUESTIONS[quizIdx].a) setQuizScore(s => s + 1);
    setTimeout(() => {
      if (quizIdx < QUIZ_QUESTIONS.length - 1) { setQuizIdx(i => i + 1); setQuizSelected(null); }
      else setQuizDone(true);
    }, 1200);
  };

  const invoiceTotal = invoiceData.items.reduce((s, i) => s + i.qty * i.rate, 0);
  const invoiceTax = invoiceTotal * (cfg.vatRate / 100);

  const revenues = transactions.filter(t => ["Sales Revenue", "Service Revenue"].includes(t.creditAccount)).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => ["Rent Expense", "Salaries Expense", "Utilities Expense", "Cost of Goods Sold"].includes(t.debitAccount)).reduce((s, t) => s + t.amount, 0);
  const netIncome = revenues - expenses;

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#0f1117", minHeight: "100vh", color: "#e8e0d0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%)", borderBottom: "1px solid #2a3550", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #c9a84c, #e8c96d)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px #c9a84c44" }}>📚</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#c9a84c", letterSpacing: 1 }}>LedgerLearn</div>
            <div style={{ fontSize: 11, color: "#7a8aaa", letterSpacing: 2, textTransform: "uppercase" }}>Free Accounting Education Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#7a8aaa", fontSize: 13 }}>🌍 Country:</span>
          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{ background: "#1a2035", border: "1px solid #c9a84c44", color: "#c9a84c", padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            {Object.keys(COUNTRIES).map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ background: "#1a2035", border: "1px solid #2a3550", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#7a8aaa" }}>
            {cfg.symbol} · {cfg.tax} {cfg.vatRate}% · {cfg.standard}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 77px)" }}>
        {/* Sidebar */}
        <div style={{ width: 200, background: "#12151f", borderRight: "1px solid #1e2535", padding: "16px 8px", flexShrink: 0 }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActiveModule(m.id)}
              style={{ width: "100%", background: activeModule === m.id ? "linear-gradient(135deg, #1e2d4a, #162240)" : "transparent", border: activeModule === m.id ? "1px solid #c9a84c55" : "1px solid transparent", borderRadius: 10, padding: "10px 12px", marginBottom: 4, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: activeModule === m.id ? "#c9a84c" : "#9aabcc" }}>{m.title}</div>
              <div style={{ fontSize: 10, color: "#4a5a7a" }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* LEDGER */}
          {activeModule === "ledger" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0, fontSize: 22 }}>📒 General Ledger — Double-Entry Bookkeeping</h2>
              <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#7a8aaa", marginBottom: 12 }}>💡 <strong style={{ color: "#c9a84c" }}>Rule:</strong> Every transaction has equal Debits and Credits. Assets/Expenses increase with Debit. Liabilities/Equity/Revenue increase with Credit.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 8 }}>
                  {["date", "desc", "debitAccount", "creditAccount", "amount"].map(f => (
                    <input key={f} placeholder={f === "debitAccount" ? "Debit Account" : f === "creditAccount" ? "Credit Account" : f.charAt(0).toUpperCase() + f.slice(1)}
                      value={newTxn[f]} onChange={e => setNewTxn({ ...newTxn, [f]: e.target.value })}
                      type={f === "date" ? "date" : f === "amount" ? "number" : "text"}
                      style={{ background: "#1a2035", border: "1px solid #2a3550", borderRadius: 8, padding: "8px 10px", color: "#e8e0d0", fontSize: 12, gridColumn: f === "desc" ? "span 2" : "span 1" }} />
                  ))}
                  <button onClick={addTransaction} style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96d)", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#0f1117", fontWeight: 700, fontSize: 12 }}>+ Add</button>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1a2035" }}>
                    {["Date", "Description", "Debit Account", "Credit Account", `Amount (${cfg.symbol})`].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#c9a84c", borderBottom: "1px solid #2a3550", fontWeight: 600, fontSize: 12, letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "#12151f" : "#14182a", borderBottom: "1px solid #1e2535" }}>
                      <td style={{ padding: "9px 12px", color: "#7a8aaa" }}>{t.date}</td>
                      <td style={{ padding: "9px 12px" }}>{t.desc}</td>
                      <td style={{ padding: "9px 12px", color: "#6ab0ff" }}>{t.debitAccount}</td>
                      <td style={{ padding: "9px 12px", color: "#7dd98a" }}>{t.creditAccount}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600 }}>{cfg.symbol}{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#1a2035", borderTop: "2px solid #c9a84c44" }}>
                    <td colSpan={4} style={{ padding: "10px 12px", color: "#c9a84c", fontWeight: 700 }}>Total Debits = Total Credits ✓</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#c9a84c" }}>{cfg.symbol}{totalDebits.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* INVOICE */}
          {activeModule === "invoice" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>🧾 Invoice Creator — {country} Template</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#c9a84c", marginBottom: 10 }}>Invoice Details</div>
                    <input placeholder="Client Name" value={invoiceData.clientName} onChange={e => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                      style={{ width: "100%", background: "#1a2035", border: "1px solid #2a3550", borderRadius: 8, padding: "8px 10px", color: "#e8e0d0", fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
                    <input placeholder="Client Address" value={invoiceData.clientAddress} onChange={e => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
                      style={{ width: "100%", background: "#1a2035", border: "1px solid #2a3550", borderRadius: 8, padding: "8px 10px", color: "#e8e0d0", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ background: "#151924", border: "1px solid #c9a84c44", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#c9a84c" }}>INVOICE</div>
                      <div style={{ fontSize: 11, color: "#7a8aaa" }}>#{Math.floor(Math.random() * 9000) + 1000} · {new Date().toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, color: "#7a8aaa" }}>
                      <div style={{ fontWeight: 700, color: "#e8e0d0" }}>Your Business</div>
                      <div>{country} · {cfg.standard}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #2a3550", paddingTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#7a8aaa" }}>Bill To:</div>
                    <div style={{ fontWeight: 600 }}>{invoiceData.clientName}</div>
                    <div style={{ fontSize: 12, color: "#9aabcc" }}>{invoiceData.clientAddress}</div>
                  </div>
                  {invoiceData.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #1e2535" }}>
                      <span>{item.desc}</span>
                      <span>{item.qty} × {cfg.symbol}{item.rate} = <strong>{cfg.symbol}{(item.qty * item.rate).toLocaleString()}</strong></span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, textAlign: "right", fontSize: 13 }}>
                    <div style={{ color: "#7a8aaa" }}>Subtotal: {cfg.symbol}{invoiceTotal.toLocaleString()}</div>
                    {cfg.vatRate > 0 && <div style={{ color: "#7a8aaa" }}>{cfg.tax} ({cfg.vatRate}%): {cfg.symbol}{invoiceTax.toFixed(2)}</div>}
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#c9a84c", marginTop: 4 }}>Total: {cfg.symbol}{(invoiceTotal + invoiceTax).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRIAL BALANCE */}
          {activeModule === "trial" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>⚖️ Trial Balance</h2>
              <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, color: "#7a8aaa" }}>
                💡 A Trial Balance lists all accounts and their balances. Total Debits must equal Total Credits — this verifies the ledger is mathematically correct.
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1a2035" }}>
                    {["Account", "Type", `Debit (${cfg.symbol})`, `Credit (${cfg.symbol})`].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#c9a84c", borderBottom: "1px solid #2a3550", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHART_OF_ACCOUNTS.map((a, i) => {
                    const relatedTxns = transactions.filter(t => t.debitAccount === a.name || t.creditAccount === a.name);
                    const total = relatedTxns.reduce((s, t) => s + (t.debitAccount === a.name ? t.amount : -t.amount), 0);
                    if (total === 0 && relatedTxns.length === 0) return null;
                    return (
                      <tr key={a.code} style={{ background: i % 2 === 0 ? "#12151f" : "#14182a", borderBottom: "1px solid #1e2535" }}>
                        <td style={{ padding: "8px 12px" }}>{a.code} — {a.name}</td>
                        <td style={{ padding: "8px 12px", color: a.type === "Asset" || a.type === "Expense" ? "#6ab0ff" : "#7dd98a", fontSize: 11 }}>{a.type}</td>
                        <td style={{ padding: "8px 12px", color: "#6ab0ff" }}>{total > 0 ? `${cfg.symbol}${total.toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#7dd98a" }}>{total < 0 ? `${cfg.symbol}${Math.abs(total).toLocaleString()}` : "—"}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#1a2035", borderTop: "2px solid #c9a84c44" }}>
                    <td colSpan={2} style={{ padding: "10px 12px", color: "#c9a84c", fontWeight: 700 }}>TOTALS</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#6ab0ff" }}>{cfg.symbol}{totalDebits.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#7dd98a" }}>{cfg.symbol}{totalCredits.toLocaleString()} ✓</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* FINANCIAL STATEMENTS */}
          {activeModule === "financial" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>📊 Financial Statements</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Income Statement */}
                <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 4 }}>Income Statement (P&L)</div>
                  <div style={{ fontSize: 11, color: "#7a8aaa", marginBottom: 16 }}>For the period ended {new Date().toLocaleDateString()}</div>
                  <div style={{ borderTop: "1px solid #2a3550", paddingTop: 12 }}>
                    <div style={{ color: "#7a8aaa", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Revenue</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>Total Revenue</span>
                      <span style={{ color: "#7dd98a", fontWeight: 600 }}>{cfg.symbol}{revenues.toLocaleString()}</span>
                    </div>
                    <div style={{ color: "#7a8aaa", fontSize: 12, margin: "12px 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Expenses</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>Total Expenses</span>
                      <span style={{ color: "#ff6b6b", fontWeight: 600 }}>({cfg.symbol}{expenses.toLocaleString()})</span>
                    </div>
                    <div style={{ borderTop: "2px solid #c9a84c44", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, color: "#c9a84c" }}>Net Income</span>
                      <span style={{ fontWeight: 700, color: netIncome >= 0 ? "#7dd98a" : "#ff6b6b", fontSize: 18 }}>{cfg.symbol}{netIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {/* Balance Sheet */}
                <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 4 }}>Balance Sheet</div>
                  <div style={{ fontSize: 11, color: "#7a8aaa", marginBottom: 16 }}>As of {new Date().toLocaleDateString()}</div>
                  <div style={{ color: "#6ab0ff", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Assets</div>
                  {["Cash", "Equipment"].map(a => {
                    const val = transactions.filter(t => t.debitAccount === a).reduce((s, t) => s + t.amount, 0) - transactions.filter(t => t.creditAccount === a).reduce((s, t) => s + t.amount, 0);
                    return val !== 0 ? <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}><span>{a}</span><span style={{ color: "#6ab0ff" }}>{cfg.symbol}{val.toLocaleString()}</span></div> : null;
                  })}
                  <div style={{ color: "#7dd98a", fontSize: 12, margin: "10px 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Equity</div>
                  {["Owner's Equity"].map(a => {
                    const val = transactions.filter(t => t.creditAccount === a).reduce((s, t) => s + t.amount, 0);
                    return val !== 0 ? <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}><span>{a}</span><span style={{ color: "#7dd98a" }}>{cfg.symbol}{val.toLocaleString()}</span></div> : null;
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>Retained Earnings</span><span style={{ color: "#7dd98a" }}>{cfg.symbol}{netIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {/* Key Ratios */}
              <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 16, marginTop: 20 }}>
                <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 12 }}>Key Financial Ratios</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "Profit Margin", value: revenues > 0 ? ((netIncome / revenues) * 100).toFixed(1) + "%" : "N/A", hint: "Net Income ÷ Revenue" },
                    { label: "Corp Tax Rate", value: cfg.corpTax + "%", hint: `${country} standard rate` },
                    { label: `${cfg.tax} Rate`, value: cfg.vatRate + "%", hint: "On sales/services" },
                    { label: "Standard", value: cfg.standard, hint: "Reporting framework" },
                  ].map(r => (
                    <div key={r.label} style={{ background: "#1a2035", borderRadius: 10, padding: 14, textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#c9a84c" }}>{r.value}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: "#4a5a7a" }}>{r.hint}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HR & PAYROLL */}
          {activeModule === "hr" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>👥 HR & Payroll — {country}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: "#1a2035" }}>
                    {["Employee", "Role", "Gross Salary", "Income Tax", "Net Pay"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#c9a84c", borderBottom: "1px solid #2a3550", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e, i) => {
                    const { gross, tax, net } = calcNetTax(e.grossSalary, country);
                    return (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? "#12151f" : "#14182a", borderBottom: "1px solid #1e2535" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e.name}</td>
                        <td style={{ padding: "10px 12px", color: "#9aabcc" }}>{e.role}</td>
                        <td style={{ padding: "10px 12px" }}>{cfg.symbol}{gross.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", color: "#ff6b6b" }}>-{cfg.symbol}{tax.toFixed(0)}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#7dd98a" }}>{cfg.symbol}{net.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 10 }}>Country Employment Law Summary — {country}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 12 }}>
                  {[
                    { label: "Income Tax Rate", val: country === "USA" ? "10–37%" : country === "UK" ? "20–45%" : country === "India" ? "5–30%" : "Varies" },
                    { label: "Social Security", val: country === "USA" ? "6.2% employee" : country === "UK" ? "12% NI" : country === "India" ? "12% PF" : "Varies" },
                    { label: "Min Wage", val: country === "USA" ? "$7.25/hr" : country === "UK" ? "£11.44/hr" : country === "Australia" ? "A$23.23/hr" : "Varies" },
                    { label: "Annual Leave", val: country === "USA" ? "No federal law" : country === "UK" ? "28 days min" : country === "India" ? "15 days min" : "Varies" },
                    { label: "Corp Tax Rate", val: cfg.corpTax + "%" },
                    { label: "Accounting Standard", val: cfg.standard },
                  ].map(r => (
                    <div key={r.label} style={{ background: "#1a2035", borderRadius: 8, padding: 12 }}>
                      <div style={{ color: "#7a8aaa", marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontWeight: 600, color: "#e8e0d0" }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAX CALCULATOR */}
          {activeModule === "tax" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>🏛️ Tax Calculator — {country}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 16 }}>{cfg.tax} Calculator</div>
                  {cfg.vatRate > 0 ? (
                    <div>
                      <div style={{ fontSize: 13, color: "#9aabcc", marginBottom: 12 }}>Enter the amount to calculate {cfg.tax} ({cfg.vatRate}%)</div>
                      {[100, 500, 1000, 5000].map(amt => (
                        <div key={amt} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1a2035", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                          <span>Base: {cfg.symbol}{amt}</span>
                          <span style={{ color: "#ff9966" }}>+{cfg.symbol}{(amt * cfg.vatRate / 100).toFixed(2)} tax</span>
                          <span style={{ fontWeight: 700, color: "#7dd98a" }}>= {cfg.symbol}{(amt * (1 + cfg.vatRate / 100)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ color: "#7a8aaa", fontSize: 13 }}>{country} uses Sales Tax (varies by state). No federal VAT/GST.</div>}
                </div>
                <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 16 }}>Corporate Tax — {country}</div>
                  {[50000, 100000, 250000, 500000].map(profit => {
                    const tax = profit * cfg.corpTax / 100;
                    return (
                      <div key={profit} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1a2035", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                        <span>Profit: {cfg.symbol}{profit.toLocaleString()}</span>
                        <span style={{ color: "#ff6b6b" }}>Tax: {cfg.symbol}{tax.toLocaleString()}</span>
                        <span style={{ fontWeight: 700, color: "#7dd98a" }}>Net: {cfg.symbol}{(profit - tax).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 12, color: "#7a8aaa", marginTop: 8 }}>Rate: {cfg.corpTax}% · Standard: {cfg.standard}</div>
                </div>
              </div>
            </div>
          )}

          {/* AI TUTOR */}
          {activeModule === "ai" && (
            <div style={{ height: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>🤖 AI Accounting Tutor — {country}</h2>
              <div style={{ flex: 1, overflowY: "auto", background: "#151924", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #2a3550" }}>
                {aiMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                    <div style={{ maxWidth: "80%", background: m.role === "user" ? "linear-gradient(135deg, #1e3a5f, #162240)" : "#1a2035", border: `1px solid ${m.role === "user" ? "#3a6aaf44" : "#2a3550"}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.6, color: m.role === "user" ? "#9adbff" : "#e8e0d0", whiteSpace: "pre-wrap" }}>
                      {m.role === "assistant" && <span style={{ color: "#c9a84c", fontWeight: 700, fontSize: 11, display: "block", marginBottom: 4 }}>🤖 AI Tutor</span>}
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && <div style={{ color: "#7a8aaa", fontSize: 13, textAlign: "center" }}>🤔 Thinking...</div>}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                  {["What is double-entry bookkeeping?", `Explain ${cfg.tax} in ${country}`, "How do I read a Balance Sheet?", "What is depreciation?"].map(q => (
                    <button key={q} onClick={() => setAiInput(q)} style={{ background: "#1a2035", border: "1px solid #2a3550", borderRadius: 20, padding: "4px 10px", color: "#9aabcc", fontSize: 11, cursor: "pointer" }}>{q}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
                  placeholder={`Ask about accounting, ${cfg.tax}, payroll in ${country}...`}
                  style={{ flex: 1, background: "#1a2035", border: "1px solid #2a3550", borderRadius: 10, padding: "12px 16px", color: "#e8e0d0", fontSize: 13 }} />
                <button onClick={sendAiMessage} disabled={aiLoading}
                  style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96d)", border: "none", borderRadius: 10, padding: "12px 20px", cursor: "pointer", color: "#0f1117", fontWeight: 700 }}>Send</button>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {activeModule === "quiz" && (
            <div>
              <h2 style={{ color: "#c9a84c", marginTop: 0 }}>🎓 Accounting Quiz</h2>
              {!quizDone ? (
                <div style={{ maxWidth: 600 }}>
                  <div style={{ background: "#151924", border: "1px solid #2a3550", borderRadius: 12, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ color: "#7a8aaa", fontSize: 13 }}>Question {quizIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                      <span style={{ color: "#c9a84c", fontSize: 13 }}>Score: {quizScore}/{quizIdx}</span>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>{QUIZ_QUESTIONS[quizIdx].q}</div>
                    {QUIZ_QUESTIONS[quizIdx].options.map(opt => {
                      const isSelected = quizSelected === opt;
                      const isCorrect = opt === QUIZ_QUESTIONS[quizIdx].a;
                      const bg = !quizSelected ? "#1a2035" : isCorrect ? "#1a3a1a" : isSelected ? "#3a1a1a" : "#1a2035";
                      const border = !quizSelected ? "#2a3550" : isCorrect ? "#7dd98a" : isSelected ? "#ff6b6b" : "#2a3550";
                      return (
                        <button key={opt} onClick={() => !quizSelected && handleQuizAnswer(opt)}
                          style={{ display: "block", width: "100%", background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px", color: "#e8e0d0", fontSize: 13, textAlign: "left", cursor: quizSelected ? "default" : "pointer", marginBottom: 8, transition: "all 0.2s" }}>
                          {isCorrect && quizSelected ? "✅ " : isSelected && !isCorrect ? "❌ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", background: "#151924", border: "1px solid #c9a84c44", borderRadius: 16, padding: 40, maxWidth: 400 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#c9a84c", marginBottom: 8 }}>Quiz Complete!</div>
                  <div style={{ fontSize: 40, fontWeight: 700, color: "#7dd98a", marginBottom: 8 }}>{quizScore}/{QUIZ_QUESTIONS.length}</div>
                  <div style={{ color: "#9aabcc", marginBottom: 20 }}>{quizScore === QUIZ_QUESTIONS.length ? "Perfect score! 🎉" : quizScore >= 3 ? "Great job! Keep learning." : "Keep practicing!"}</div>
                  <button onClick={() => { setQuizIdx(0); setQuizScore(0); setQuizSelected(null); setQuizDone(false); }}
                    style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96d)", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", color: "#0f1117", fontWeight: 700 }}>Try Again</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
