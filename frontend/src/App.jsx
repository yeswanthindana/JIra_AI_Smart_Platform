import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I'm synchronized with your Jira project data. Whether you need a deep dive into a specific ticket or a high-level risk assessment across the board, I'm here to help. \n\nHow can I assist you today?",
      meta: { model: "Strategic-AI", type: "greeting" }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({ model: "GPT-Core", status: "Active", metrics: { cpu: "0%", ram: "0%", gpu: "0%" } });
  const [question, setQuestion] = useState("");
  const [chatContext, setChatContext] = useState({ type: 'global', issue_key: null, details: null });
  const [activeTool, setActiveTool] = useState('analyzer');
  const [isBugSidebarOpen, setIsBugSidebarOpen] = useState(false);
  const [bugData, setBugData] = useState({ project: "EVR", summary: "", raw: "" });
  const [isLoggingBug, setIsLoggingBug] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch("http://localhost:8000/system-info");
      const data = await res.json();
      setSystemInfo(data);
    } catch (err) {
      setSystemInfo(prev => ({ ...prev, status: "Offline" }));
    }
  };

  const askAI = async (manualQuestion = null, overrideContext = null) => {
    const q = manualQuestion || question;
    const currentContext = overrideContext || chatContext;
    if (!q.trim() || loading) return;

    if (!manualQuestion) {
      setMessages(prev => [...prev, { role: "user", content: q }]);
      setQuestion("");
    }
    
    setLoading(true);
    try {
      let endpoint = "http://localhost:8000/ask-ai";
      let payload = { question: q };

      if (currentContext.type === 'ticket') {
        endpoint = "http://localhost:8000/chat/ticket";
        payload = {
          issue_key: currentContext.issue_key,
          question: q,
          ticket_details: JSON.stringify(currentContext.details)
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: data.answer, 
        sources: data.sources || [],
        meta: { model: systemInfo.model, status: "Analyzed" }
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "I encountered a connection error. Please ensure the backend services are operational." }]);
    } finally {
      setLoading(false);
    }
  };

  const setChatToTicket = async (issue_key, details) => {
    const newContext = { type: 'ticket', issue_key, details };
    setChatContext(newContext);
    
    setMessages([
      {
        role: "ai",
        content: `I've loaded the details for **${issue_key}**: *${details.summary}*. \n\nI'm performing an initial assessment now. One moment...`,
        meta: { model: systemInfo.model, status: "Syncing" }
      }
    ]);

    const initialPrompt = `Provide a comprehensive breakdown of ${issue_key}. I need a clear summary, a list of identified risks, and a structured set of testing scenarios for QA. Format your response clearly.`;
    await askAI(initialPrompt, newContext);
  };

  const resetChat = () => {
    setChatContext({ type: 'global', issue_key: null, details: null });
    setMessages([
      {
        role: "ai",
        content: "I've reset to the global project context. I'm ready to analyze patterns across your entire workspace. What's on your mind?",
        meta: { model: systemInfo.model, status: "Ready" }
      }
    ]);
  };

  const addAsComment = async (issueKey, text) => {
    if (!window.confirm(`Would you like to sync this part of our conversation to ${issueKey}?`)) return;
    try {
      await fetch(`http://localhost:8000/jira/tickets/${issueKey}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      alert("Successfully added as a comment to Jira.");
    } catch (err) {
      alert("There was an error syncing with Jira.");
    }
  };

  return (
    <div className="chatgpt-inspired-shell">
      {/* SIDEBAR */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
           <div className="sidebar-logo">J</div>
           <button className="new-chat-btn" onClick={resetChat}>+ New Session</button>
        </div>

        <div className="sidebar-section">
           <label>Project Utilities</label>
           <button className="sidebar-link" onClick={() => setIsBugSidebarOpen(true)}>
              <span className="icon">🐞</span> Log Bug in Jira
           </button>
        </div>

        <div className="sidebar-history">
           <label>Current Context</label>
           <div className={`context-card ${chatContext.type === 'ticket' ? 'active' : ''}`}>
              <div className="card-top">{chatContext.type === 'ticket' ? chatContext.issue_key : 'Global Project'}</div>
              <div className="card-desc">{chatContext.type === 'ticket' ? chatContext.details.summary : 'Multi-ticket analysis enabled.'}</div>
           </div>
        </div>

        <div className="sidebar-footer">
           <div className="system-pill">
              <span className={`status-orb ${systemInfo.status === 'Active' ? 'online' : 'offline'}`}></span>
              {systemInfo.model}
           </div>
           <div className="metrics-compact">
              <span>CPU {systemInfo.metrics?.cpu}</span>
              <span>RAM {systemInfo.metrics?.ram}</span>
           </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="chat-main">
        <header className="chat-header">
           <div className="header-info">
              <h1>{chatContext.type === 'ticket' ? `Analyzing ${chatContext.issue_key}` : "Project Assistant"}</h1>
              <div className="status-label">{loading ? "Thinking..." : "Ready to assist"}</div>
           </div>
           {chatContext.type === 'ticket' && (
             <button className="btn-exit" onClick={resetChat}>Exit Ticket View</button>
           )}
        </header>

        <div className="chat-flow-container">
           <div className="chat-content-limit">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-row ${msg.role}`}>
                   <div className="chat-avatar">{msg.role === 'ai' ? '🤖' : '👤'}</div>
                   <div className="chat-message-container">
                      <div className="chat-message-bubble">
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.role === 'ai' && msg.meta?.type !== 'greeting' && (
                        <div className="chat-message-actions">
                           {chatContext.type === 'ticket' && (
                             <button onClick={() => addAsComment(chatContext.issue_key, msg.content)}>Sync to Jira</button>
                           )}
                           <button onClick={() => navigator.clipboard.writeText(msg.content)}>Copy</button>
                        </div>
                      )}
                   </div>
                </div>
              ))}
              {loading && (
                <div className="chat-row ai thinking">
                   <div className="chat-avatar">🤖</div>
                   <div className="thinking-bubble">
                      <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
           </div>
        </div>

        {/* TOOL PANEL (INTEGRATED) */}
        <aside className="integrated-tool-panel">
           <div className="tool-tabs">
              <button className={activeTool === 'analyzer' ? 'active' : ''} onClick={() => setActiveTool('analyzer')}>Analyze</button>
              <button className={activeTool === 'test' ? 'active' : ''} onClick={() => setActiveTool('test')}>Tests</button>
              <button className={activeTool === 'risk' ? 'active' : ''} onClick={() => setActiveTool('risk')}>Risks</button>
           </div>
           <div className="tool-view">
              {activeTool === 'analyzer' && <AnalyzerForm onFetch={setChatToTicket} />}
              {activeTool === 'test' && <SimpleTool apiPath="/generate-testcases/" resultKey="testcases" addAsComment={addAsComment} />}
              {activeTool === 'risk' && <SimpleTool apiPath="/risk-analysis/" resultKey="analysis" addAsComment={addAsComment} />}
           </div>
        </aside>

        <div className="chat-input-bar">
           <div className="input-container">
              <textarea 
                placeholder={chatContext.type === 'ticket' ? `Discuss ${chatContext.issue_key}...` : "How can I help you analyze your project?"}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())}
              />
              <button className="send-btn" onClick={() => askAI()} disabled={loading || !question.trim()}>
                 <span className="arrow">↑</span>
              </button>
           </div>
           <p className="input-hint">Jira AI can refine analysis based on your feedback. Just ask.</p>
        </div>
      </main>

      {/* BUG MODAL */}
      {isBugSidebarOpen && (
        <div className="chat-modal-overlay" onClick={() => setIsBugSidebarOpen(false)}>
           <div className="chat-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-top">
                 <h3>Log Ticket</h3>
                 <button onClick={() => setIsBugSidebarOpen(false)}>&times;</button>
              </div>
              <div className="modal-fields">
                 <div className="field">
                    <label>Project</label>
                    <input value={bugData.project} onChange={e => setBugData({...bugData, project: e.target.value})} />
                 </div>
                 <div className="field">
                    <label>Summary</label>
                    <input placeholder="Short description..." value={bugData.summary} onChange={e => setBugData({...bugData, summary: e.target.value})} />
                 </div>
                 <div className="field">
                    <label>Context / Logs</label>
                    <textarea rows="5" placeholder="Details..." value={bugData.raw} onChange={e => setBugData({...bugData, raw: e.target.value})} />
                 </div>
                 <button className="modal-submit" onClick={async () => {
                    setIsLoggingBug(true);
                    try {
                       await fetch("http://localhost:8000/jira/log-bug", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ project_key: bugData.project, summary: bugData.summary, raw_data: bugData.raw })
                       });
                       alert("Ticket logged.");
                       setIsBugSidebarOpen(false);
                    } finally { setIsLoggingBug(false); }
                 }} disabled={isLoggingBug}>{isLoggingBug ? "Processing..." : "Create Ticket"}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// SHARED COMPONENTS
function AnalyzerForm({ onFetch }) {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const runFetch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/jira/tickets/${id}`);
      const data = await res.json();
      onFetch(id, data);
    } catch (err) { alert("Ticket not found."); }
    finally { setLoading(false); }
  };
  return (
    <div className="inline-tool-form">
       <input placeholder="EVR-123" value={id} onChange={e => setId(e.target.value)} />
       <button onClick={runFetch} disabled={loading}>{loading ? "..." : "Induct"}</button>
    </div>
  );
}

function SimpleTool({ apiPath, resultKey, addAsComment }) {
  const [id, setId] = useState("");
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await (await fetch(`http://localhost:8000${apiPath}${id}`)).json();
      setRes(data[resultKey]);
    } catch (err) { alert("Error."); }
    finally { setLoading(false); }
  };
  return (
    <div className="inline-tool-form">
       <input placeholder="Issue Key..." value={id} onChange={e => setId(e.target.value)} />
       <button onClick={run} disabled={loading}>{loading ? "..." : "Run"}</button>
       {res && (
         <div className="tool-res-pop">
            <div className="pop-scroll">{res}</div>
            <button onClick={() => addAsComment(id, res)}>Sync to Jira</button>
         </div>
       )}
    </div>
  );
}

export default App;