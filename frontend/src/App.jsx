import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Welcome to your **Jira AI Assistant**. I'm connected to your workspace and ready to help you analyze tickets, generate test cases, and assess risks. \n\nHow can I help you today?",
      meta: { model: "Strategic-AI", type: "greeting" }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({ model: "GPT-Core", status: "Active", metrics: { cpu: "0%", ram: "0%", gpu: "0%" } });
  const [question, setQuestion] = useState("");
  const [chatContext, setChatContext] = useState({ type: 'global', issue_key: null, details: null });
  const [activeTool, setActiveTool] = useState('analyzer');
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
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
      // Reset height of textarea
      const textarea = document.querySelector('.input-container textarea');
      if (textarea) textarea.style.height = 'auto';
    }
    
    setLoading(true);
    // Add an empty AI message that we will populate via stream
    setMessages(prev => [...prev, { role: "ai", content: "", meta: { model: systemInfo.model, status: "Thinking" } }]);

    try {
      let endpoint = "http://localhost:8000/ask-ai/stream";
      let payload = { question: q };

      if (currentContext.type === 'ticket') {
        endpoint = "http://localhost:8000/chat/ticket/stream";
        payload = {
          issue_key: currentContext.issue_key,
          question: q,
          ticket_details: JSON.stringify(currentContext.details)
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let cumulativeContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        cumulativeContent += decoder.decode(value, { stream: true });
        
        // Update the last message in the list
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = cumulativeContent;
          newMessages[newMessages.length - 1].meta.status = "Analyzed";
          return newMessages;
        });
      }
    } catch (err) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "Connection error. Please check your backend.";
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const setChatToTicket = async (issue_key, details) => {
    const newContext = { type: 'ticket', issue_key, details };
    setChatContext(newContext);
    
    const detailsMarkdown = `
### 🎫 Ticket Inducted: ${issue_key}

| Field | Detail |
| :--- | :--- |
| **Summary** | ${details.summary} |
| **Status** | \`${details.status}\` |
| **Priority** | ${details.priority} |
| **Created** | ${new Date(details.created).toLocaleDateString()} |

**Description:**
${details.description || "_No description provided._"}

---
*I've loaded this ticket into my active context. Performing deep analysis now...*
    `;

    setMessages([
      {
        role: "ai",
        content: detailsMarkdown,
        meta: { model: systemInfo.model, status: "Syncing" }
      }
    ]);

    const initialPrompt = `Analyze ticket ${issue_key}. Provide a summary, top 3 risks, and 3 critical test cases based on the provided details and historical context.`;
    await askAI(initialPrompt, newContext);
  };

  const resetChat = () => {
    setChatContext({ type: 'global', issue_key: null, details: null });
    setMessages([
      {
        role: "ai",
        content: "Returned to global context. I'm ready to analyze your entire Jira project. What's next?",
        meta: { model: systemInfo.model, status: "Ready" }
      }
    ]);
  };

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [commentToSync, setCommentToSync] = useState("");
  const [targetIssueKey, setTargetIssueKey] = useState("");

  const addAsComment = (issueKey, text) => {
    // Wrap the entire content in a clean Jira panel for a production look
    const stamp = `⚡ *Jira AI Smart Insight* (via ${systemInfo.model})`;
    
    // Ensure the content is clean and formatted
    const finalComment = `{panel:title=AI ANALYSIS REPORT|titleBGColor=#ebf2ff|borderStyle=solid|borderColor=#3572b0}\n${text}\n\n---\n${stamp}\n{panel}`;
    
    setTargetIssueKey(issueKey);
    setCommentToSync(finalComment);
    setIsSyncModalOpen(true);
  };

  const confirmSync = async () => {
    try {
      await fetch(`http://localhost:8000/jira/tickets/${targetIssueKey}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentToSync })
      });
      alert("Comment successfully synced to Jira.");
      setIsSyncModalOpen(false);
    } catch (err) {
      alert("Sync failed.");
    }
  };

  return (
    <div className="chatgpt-inspired-shell">
      {/* SIDEBAR */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
           <div className="brand">
              <div className="logo-box">J</div>
              <div className="brand-text">
                 <h2>Jira AI Smart</h2>
                 <p className="premium-font" style={{fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800}}>ENTERPRISE RAG</p>
              </div>
           </div>
           <button className="new-chat-btn" onClick={resetChat}>
              <span style={{fontSize: '1.2rem'}}>+</span> New Session
           </button>
        </div>

        <div className="sidebar-scroll">
           <span className="section-label">Jira Utilities</span>
           <button className="nav-item" onClick={() => setIsBugModalOpen(true)}>
              <span>🐞</span> Log Bug
           </button>
           
           <div style={{marginTop: '2rem'}}>
              <span className="section-label">Active Context</span>
              <div className={`context-status ${chatContext.type === 'ticket' ? 'active' : ''}`}>
                 <div className="status-row">
                    <span className="indicator"></span>
                    {chatContext.type === 'ticket' ? chatContext.issue_key : 'Project Global'}
                 </div>
                 <p style={{fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: '1.4'}}>
                    {chatContext.type === 'ticket' ? chatContext.details.summary : 'Analyzing full project history.'}
                 </p>
              </div>
           </div>
        </div>

        <div className="sidebar-footer">
           <div className="status-row">
              <span className={`indicator ${systemInfo.status === 'Active' ? 'online' : 'offline'}`} style={{background: systemInfo.status === 'Active' ? '#10b981' : '#ef4444'}}></span>
              <span style={{fontSize: '0.8rem', fontWeight: 700}}>{systemInfo.model}</span>
           </div>
           <div style={{display: 'flex', gap: '10px', marginTop: '8px'}}>
              <div style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>CPU {systemInfo.metrics?.cpu}</div>
              <div style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>RAM {systemInfo.metrics?.ram}</div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="chat-main">
        <header className="top-bar">
           <div className="view-info">
              <h1>{chatContext.type === 'ticket' ? `Ticket Analysis: ${chatContext.issue_key}` : "Project Intelligence"}</h1>
              <p>{loading ? "AI is processing..." : "Ready for instructions"}</p>
           </div>
           {chatContext.type === 'ticket' && (
              <button className="exit-ticket-btn" onClick={resetChat}>Close Ticket</button>
           )}
        </header>

        <div className="chat-container">
           <div className="chat-inner">
              {messages.map((msg, i) => (
                 <div key={i} className={`chat-bubble ${msg.role}`}>
                    <div className="avatar-circle">{msg.role === 'ai' ? '🤖' : '👤'}</div>
                    <div className="bubble-content">
                          <div className="message-meta">
                             <span>{msg.meta.model} • {msg.meta.status}</span>
                             {msg.role === "ai" && chatContext.type === 'ticket' && !loading && (
                               <button 
                                 className="inline-sync-btn" 
                                 onClick={() => addAsComment(chatContext.issue_key, msg.content)}
                                 title="Sync this response to Jira"
                               >
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                 Sync
                               </button>
                             )}
                          </div>
                       <div className="message-text">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                       </div>
                       {msg.role === 'ai' && msg.meta?.type !== 'greeting' && (
                          <div className="bubble-actions">
                             {chatContext.type === 'ticket' && (
                                <button className="action-btn" onClick={() => addAsComment(chatContext.issue_key, msg.content)}>Sync to Jira</button>
                             )}
                             <button className="action-btn" onClick={() => navigator.clipboard.writeText(msg.content)}>Copy</button>
                          </div>
                       )}
                    </div>
                 </div>
              ))}
              {loading && (
                 <div className="chat-bubble ai">
                    <div className="avatar-circle">🤖</div>
                    <div className="bubble-content">
                       <div className="typing">
                          <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                       </div>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
           </div>
        </div>

        {/* FLOATING TOOLS */}
        <aside className="floating-tools">
           <div className="tool-header">
              <button className={`tool-tab ${activeTool === 'analyzer' ? 'active' : ''}`} onClick={() => setActiveTool('analyzer')}>Induct</button>
              <button className={`tool-tab ${activeTool === 'test' ? 'active' : ''}`} onClick={() => setActiveTool('test')}>Tests</button>
              <button className={`tool-tab ${activeTool === 'risk' ? 'active' : ''}`} onClick={() => setActiveTool('risk')}>Risks</button>
           </div>
           <div className="tool-body">
              {activeTool === 'analyzer' && <AnalyzerBox onFetch={setChatToTicket} />}
              {activeTool === 'test' && (
                <div className="tool-input-group">
                   <button className="premium-btn" onClick={() => askAI("Generate professional test cases for this ticket with steps and expected results.")} disabled={loading || chatContext.type !== 'ticket'}>
                      Generate Chat Test Cases
                   </button>
                   {chatContext.type !== 'ticket' && <p style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px'}}>Please induct a ticket first.</p>}
                </div>
              )}
              {activeTool === 'risk' && (
                <div className="tool-input-group">
                   <button className="premium-btn" onClick={() => askAI("Perform a deep risk analysis for this ticket considering historical patterns.")} disabled={loading || chatContext.type !== 'ticket'}>
                      Run Chat Risk Analysis
                   </button>
                   {chatContext.type !== 'ticket' && <p style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px'}}>Please induct a ticket first.</p>}
                </div>
              )}
           </div>
        </aside>

        <div className="input-wrapper">
           <div className="input-container">
              <textarea 
                 placeholder={chatContext.type === 'ticket' ? `Message about ${chatContext.issue_key}...` : "Analyze your project metadata..."}
                 value={question}
                 onChange={(e) => {
                    setQuestion(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                 }}
                 onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())}
                 rows={1}
                 style={{maxHeight: '200px'}}
              />
              <button className="circle-send" onClick={() => askAI()} disabled={loading || !question.trim()}>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              </button>
           </div>
           <p className="bottom-hint">Jira AI Smart Platform v2.0 • Powered by Local RAG</p>
        </div>
      </main>

      {/* BUG MODAL */}
      {isBugModalOpen && (
        <div className="chat-modal-overlay" onClick={() => setIsBugModalOpen(false)}>
           <div className="chat-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-top">
                 <h2 className="premium-font">Create Jira Ticket</h2>
                 <button style={{background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer'}} onClick={() => setIsBugModalOpen(false)}>&times;</button>
              </div>
              <div className="tool-input-group">
                 <input className="premium-input" placeholder="Project Key (e.g., EVR)" value={bugData.project} onChange={e => setBugData({...bugData, project: e.target.value})} />
                 <input className="premium-input" placeholder="Issue Summary..." value={bugData.summary} onChange={e => setBugData({...bugData, summary: e.target.value})} />
                 <textarea className="premium-input" rows="4" placeholder="Detailed logs or context..." value={bugData.raw} onChange={e => setBugData({...bugData, raw: e.target.value})} />
                 <button className="premium-btn" onClick={async () => {
                    setIsLoggingBug(true);
                    try {
                       await fetch("http://localhost:8000/jira/log-bug", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ project_key: bugData.project, summary: bugData.summary, raw_data: bugData.raw })
                       });
                       alert("Ticket Logged.");
                       setIsBugModalOpen(false);
                    } finally { setIsLoggingBug(false); }
                 }} disabled={isLoggingBug}>{isLoggingBug ? "Creating..." : "Confirm & Create"}</button>
              </div>
           </div>
        </div>
      )}
      {/* SYNC MODAL */}
      {isSyncModalOpen && (
        <div className="chat-modal-overlay">
          <div className="chat-modal premium-modal" style={{maxWidth: '700px'}}>
            <h3>📝 Final Review: Sync to Jira</h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '15px'}}>
              Refine your message below before it's posted to <strong>{chatContext.issue_key}</strong>.
            </p>
            <textarea 
              className="premium-input" 
              style={{height: '300px', width: '100%', marginBottom: '20px', fontFamily: 'monospace', fontSize: '0.9rem', padding: '15px'}}
              value={commentToSync}
              onChange={(e) => setCommentToSync(e.target.value)}
            />
            <div className="modal-actions">
              <button className="premium-btn secondary" onClick={() => setIsSyncModalOpen(false)}>Cancel</button>
              <button className="premium-btn" onClick={confirmSync}>Post to Jira</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyzerBox({ onFetch }) {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/jira/tickets/${id}`);
      const data = await res.json();
      onFetch(id, data);
    } catch (err) { alert("Not found."); }
    finally { setLoading(false); }
  };
  return (
    <div className="tool-input-group">
       <input className="premium-input" placeholder="Issue Key (e.g. EVR-12)" value={id} onChange={e => setId(e.target.value)} />
       <button className="premium-btn" onClick={run} disabled={loading}>{loading ? "Fetching..." : "Induct Ticket"}</button>
    </div>
  );
}

function QuickAction({ apiPath, resultKey, addAsComment, label }) {
  const [id, setId] = useState("");
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const run = async () => {
    if (!id) return;
    setLoading(true);
    setRes(""); // Clear previous
    try {
      // Use the new /stream version of the endpoint
      const response = await fetch(`http://localhost:8000${apiPath}stream/${id}`);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let cumulative = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        cumulative += decoder.decode(value, { stream: true });
        setRes(cumulative);
      }
    } catch (err) { alert("Error."); }
    finally { setLoading(false); }
  };
  
  return (
    <div className="tool-input-group">
       <input className="premium-input" placeholder="Issue Key..." value={id} onChange={e => setId(e.target.value)} />
       <button className="premium-btn" onClick={run} disabled={loading}>{loading ? "Processing..." : label}</button>
       {res && (
          <div style={{marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)'}}>
             <div style={{maxHeight: '300px', overflowY: 'auto', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '15px', lineHeight: '1.6'}}>
                <ReactMarkdown>{res}</ReactMarkdown>
             </div>
             <button className="premium-btn" style={{width: '100%', padding: '10px'}} onClick={() => addAsComment(id, res)}>Sync Result to Jira</button>
          </div>
       )}
    </div>
  );
}

export default App;