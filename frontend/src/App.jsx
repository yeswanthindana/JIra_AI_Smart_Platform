import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I am your Jira RAG Service. I can analyze historical defects, predict regression risks, and help you with QA insights. How can I help you today?",
      sources: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    model: "Loading...",
    vector_db: "Loading...",
    source: "Loading...",
    status: "Offline",
    metrics: { cpu: "0%", ram: "0%", gpu: "N/A" }
  });
  const [currentInsight, setCurrentInsight] = useState(null);
  const [question, setQuestion] = useState("");
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetchSystemInfo();
    fetchKnowledge();
    const sysInterval = setInterval(fetchSystemInfo, 5000);
    const knowInterval = setInterval(fetchKnowledge, 15000);
    return () => {
      clearInterval(sysInterval);
      clearInterval(knowInterval);
    };
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch("http://localhost:8000/system-info");
      const data = await res.json();
      setSystemInfo(data);
    } catch (err) {
      console.error(err);
      setSystemInfo(prev => ({ ...prev, status: "Error" }));
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch("http://localhost:8000/ai-knowledge");
      const data = await res.json();
      if (data.status === "success") setCurrentInsight(data.data);
      else setCurrentInsight(null);
    } catch (err) {
      console.error(err);
      setCurrentInsight(null);
    }
  };

  const askAI = async () => {
    if (!question.trim() || loading) return;
    const userMsg = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    const q = question;
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", content: data.answer, sources: data.sources || [] }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "Error connecting to backend.", sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Jira RAG Service</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Enterprise AI Engine</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarNavItem icon="💬" label="AI Assistant" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
          <SidebarNavItem icon="🧪" label="Test Case Generator" active={activeTab === "testcase"} onClick={() => setActiveTab("testcase")} />
          <SidebarNavItem icon="🔎" label="Search Similar Issues" active={activeTab === "search"} onClick={() => setActiveTab("search")} />
          <SidebarNavItem icon="⚠️" label="Risk Analysis" active={activeTab === "risk"} onClick={() => setActiveTab("risk")} />
        </nav>

        {currentInsight && (
          <div className="stat-card" style={{ marginBottom: "1rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
            <span className="stat-label">LLM INSIGHT HUB</span>
            <div key={currentInsight.topic} style={{ animation: "fadeIn 0.5s ease-in-out" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-secondary)", fontSize: "0.9rem", marginBottom: "4px" }}>{currentInsight.topic}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, lineHeight: "1.4" }}>{currentInsight.description}</div>
              <div style={{ fontSize: "0.7rem", marginTop: "8px", fontStyle: "italic", color: "var(--text-muted)" }}>🤖 {currentInsight.practical}</div>
            </div>
          </div>
        )}

        <div className="stat-card" style={{ marginTop: "auto", background: "rgba(59, 130, 246, 0.05)", border: "1px solid var(--glass-border)" }}>
          <span className="stat-label">HARDWARE USAGE</span>
          <div style={{ fontSize: "0.75rem", marginTop: "5px" }}>
            <div>CPU: {systemInfo.metrics?.cpu || "0%"}</div>
            <div>RAM: {systemInfo.metrics?.ram || "0%"}</div>
            <div>GPU: {systemInfo.metrics?.gpu || "N/A"}</div>
          </div>
          <span className="stat-value" style={{ color: systemInfo.status === "Healthy" ? "#4ade80" : "#fb7185", marginTop: "10px", display: "block" }}>
            ● {systemInfo.status}
          </span>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{activeTab.toUpperCase().replace("_", " ")}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Jira Knowledge RAG Service</p>
          </div>
          <div className="system-stats">
            <TopStat label="MODEL" value={systemInfo.model} />
            <TopStat label="VECTOR DB" value={systemInfo.vector_db} />
          </div>
        </header>

        <div className="content-view">
          {activeTab === "chat" && <ChatView messages={messages} loading={loading} question={question} setQuestion={setQuestion} askAI={askAI} chatEndRef={chatEndRef} />}
          {activeTab === "testcase" && <ToolView title="Test Case Generator" apiPath="/generate-testcases/" resultKey="testcases" placeholder="Enter Issue Key (e.g., EVR-123)" />}
          {activeTab === "search" && <ToolView title="Search Similar Issues" apiPath="/jira/" resultKey="summary" placeholder="Enter Issue Key to find similar" isSearch />}
          {activeTab === "risk" && <ToolView title="Risk Analysis" apiPath="/risk-analysis/" resultKey="analysis" placeholder="Enter Issue Key for Risk Analysis" />}
        </div>
      </main>
    </div>
  );
}

function SidebarNavItem({ icon, label, active, onClick }) {
  return (
    <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span>{icon}</span> {label}
    </div>
  );
}

function TopStat({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function ChatView({ messages, loading, question, setQuestion, askAI, chatEndRef }) {
  return (
    <>
      <div className="chat-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="avatar">{msg.role === "ai" ? "🤖" : "👤"}</div>
            <div className="message-content">
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              {msg.role === "ai" && msg.sources?.length > 0 && (
                <div className="sources-container">
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>SOURCES:</div>
                  {msg.sources.map((src, j) => (
                    <div key={j} className="source-card">
                      <div className="source-header"><span>{src.issue_key}</span> <span style={{fontSize:'0.7rem'}}>{src.chunk_type}</span></div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{src.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="message ai"><div className="avatar">🤖</div><div className="message-content"><div className="typing"><span></span><span></span><span></span></div></div></div>}
        <div ref={chatEndRef} />
      </div>
      <div className="input-container">
        <div className="input-box">
          <textarea placeholder="Ask anything about the project..." rows="1" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())} />
          <button className="send-btn" onClick={askAI} disabled={loading || !question.trim()}>{loading ? "..." : "↑"}</button>
        </div>
      </div>
    </>
  );
}

function ToolView({ title, apiPath, resultKey, placeholder, isSearch = false }) {
  const [id, setId] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const runTool = async () => {
    if (!id.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000${apiPath}${id}`);
      const data = await res.json();
      if (isSearch) {
          setResult(`Summary: ${data.summary}\n\nDescription: ${data.description}`);
      } else {
          setResult(data[resultKey]);
      }
    } catch (err) {
      setResult("Error fetching data from AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
      <h2 style={{ fontSize: "2rem" }}>{title}</h2>
      <div className="input-box" style={{ maxWidth: "600px", background: "rgba(255,255,255,0.05)" }}>
        <input 
          style={{ flex: 1, background: "transparent", border: "none", color: "white", padding: "10px", outline: "none" }} 
          placeholder={placeholder} 
          value={id} 
          onChange={(e) => setId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runTool()}
        />
        <button className="send-btn" onClick={runTool} disabled={loading}>{loading ? "..." : "Run"}</button>
      </div>
      <div style={{ flex: 1, background: "rgba(15,23,42,0.5)", borderRadius: "20px", border: "1px solid var(--glass-border)", padding: "30px", overflowY: "auto", whiteSpace: "pre-wrap", lineHeight: "1.8" }}>
        {loading ? "AI is processing your request..." : (result || "Result will appear here...")}
      </div>
    </div>
  );
}

export default App;