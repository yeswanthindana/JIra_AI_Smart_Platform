import { useState } from "react";

function App() {

  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const askAI = async () => {

    if (!question) return;

    setLoading(true);

    setAnswer("");

    try {

      const res = await fetch(

        "http://localhost:8000/ask-ai",

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            question
          })
        }
      );

      const data = await res.json();

      setAnswer(data.answer || JSON.stringify(data));

    } catch (err) {

      console.error(err);

      setAnswer(
        "Failed to connect to AI backend."
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif"
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: "260px",
          background: "#111827",
          borderRight: "1px solid #1e293b",
          padding: "25px",
          display: "flex",
          flexDirection: "column"
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
              color: "#60a5fa"
            }}
          >
            Jira AI
          </h2>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "8px",
              lineHeight: "1.5"
            }}
          >
            Enterprise QA Intelligence Platform
          </p>

        </div>

        <div
          style={{
            marginTop: "40px"
          }}
        >

          <div style={menuItemStyle}>
            Dashboard
          </div>

          <div style={menuItemStyle}>
            AI Assistant
          </div>

          <div style={menuItemStyle}>
            Semantic Search
          </div>

          <div style={menuItemStyle}>
            Risk Analysis
          </div>

          <div style={menuItemStyle}>
            Jira Intelligence
          </div>

        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop: "1px solid #1e293b",
            color: "#94a3b8",
            fontSize: "14px"
          }}
        >
          Local AI + RAG + pgvector
        </div>

      </div>

      {/* MAIN CONTENT */}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >

        {/* HEADER */}

        <div
          style={{
            padding: "22px 30px",
            borderBottom: "1px solid #1e293b",
            background: "#111827",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >

          <div>

            <h1
              style={{
                margin: 0,
                fontSize: "28px"
              }}
            >
              AI QA Copilot
            </h1>

            <p
              style={{
                marginTop: "6px",
                color: "#94a3b8"
              }}
            >
              Historical Jira Intelligence + Semantic Search
            </p>

          </div>

          <div
            style={{
              background: "#1e293b",
              padding: "10px 18px",
              borderRadius: "12px",
              color: "#60a5fa",
              fontWeight: "bold"
            }}
          >
            QWEN 3:4B Local AI
          </div>

        </div>

        {/* CONTENT AREA */}

        <div
          style={{
            flex: 1,
            padding: "30px",
            overflowY: "auto"
          }}
        >

          {/* INPUT CARD */}

          <div
            style={{
              background: "#111827",
              borderRadius: "20px",
              padding: "25px",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
              border: "1px solid #1e293b"
            }}
          >

            <h2
              style={{
                marginTop: 0
              }}
            >
              Ask AI
            </h2>

            <textarea

              rows="6"

              value={question}

              onChange={(e) =>
                setQuestion(e.target.value)
              }

              placeholder="Ask about regressions, Vision Engine failures, OCR issues, playback problems, camera sync issues..."

              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "14px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "white",
                fontSize: "16px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box"
              }}
            />

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "14px"
                }}
              >
                Powered by Local AI + RAG + Jira Intelligence
              </div>

              <button

                onClick={askAI}

                disabled={loading}

                style={{
                  background: loading
                    ? "#334155"
                    : "linear-gradient(90deg,#2563eb,#7c3aed)",

                  color: "white",

                  border: "none",

                  padding: "14px 28px",

                  borderRadius: "12px",

                  fontSize: "16px",

                  fontWeight: "bold",

                  cursor: "pointer",

                  transition: "0.3s"
                }}
              >
                {
                  loading
                    ? "Analyzing Historical Jira Data..."
                    : "Ask AI"
                }
              </button>

            </div>

          </div>

          {/* RESPONSE CARD */}

          <div
            style={{
              marginTop: "30px",
              background: "#111827",
              borderRadius: "20px",
              padding: "25px",
              minHeight: "350px",
              border: "1px solid #1e293b",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.3)"
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >

              <h2
                style={{
                  margin: 0
                }}
              >
                AI Response
              </h2>

              <div
                style={{
                  background: "#0f172a",
                  color: "#22c55e",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontSize: "14px"
                }}
              >
                AI Active
              </div>

            </div>

            {
              loading ? (

                <div
                  style={{
                    color: "#60a5fa",
                    lineHeight: "2"
                  }}
                >
                  <div>
                    Searching historical Jira memory...
                  </div>

                  <div>
                    Performing semantic vector search...
                  </div>

                  <div>
                    Running AI risk analysis...
                  </div>
                </div>

              ) : (

                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.8",
                    color: "#e2e8f0"
                  }}
                >
                  {
                    answer ||
                    "AI responses will appear here..."
                  }
                </div>
              )
            }

          </div>

          {/* STATS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: "20px",
              marginTop: "30px"
            }}
          >

            <StatCard
              title="AI Engine"
              value="Phi3 Local"
            />

            <StatCard
              title="Database"
              value="pgvector"
            />

            <StatCard
              title="Search"
              value="Semantic RAG"
            />

            <StatCard
              title="Data Source"
              value="Jira Cloud"
            />

          </div>

        </div>

      </div>

    </div>
  );
}

function StatCard({ title, value }) {

  return (

    <div
      style={{
        background: "#111827",
        borderRadius: "18px",
        padding: "22px",
        border: "1px solid #1e293b"
      }}
    >

      <div
        style={{
          color: "#94a3b8",
          marginBottom: "10px"
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          color: "#60a5fa"
        }}
      >
        {value}
      </div>

    </div>
  );
}

const menuItemStyle = {

  padding: "14px 16px",

  borderRadius: "12px",

  marginBottom: "10px",

  cursor: "pointer",

  background: "#0f172a",

  border: "1px solid #1e293b",

  color: "#e2e8f0"
};

export default App;