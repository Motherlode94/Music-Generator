import { useState, useRef } from "react";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Jazz", "R&B", "Électro", "Folk", "Metal", "Reggae", "Chanson française"];
const MOODS = ["Mélancolique", "Euphorique", "Romantique", "Énergique", "Nostalgique", "Rebelle", "Mystérieux", "Doux"];
const LANGUAGES = ["Français", "English", "Español", "Italiano"];

const NOTE_CHARS = ["♩", "♪", "♫", "♬", "𝄞", "𝄢"];

function FloatingNotes() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {NOTE_CHARS.map((n, i) => (
        <span key={i} style={{
          position: "absolute",
          left: `${10 + i * 15}%`,
          top: "110%",
          fontSize: `${1.2 + (i % 3) * 0.6}rem`,
          color: `hsl(${280 + i * 20}, 80%, 70%)`,
          opacity: 0.15,
          animation: `float ${8 + i * 2}s ease-in-out infinite`,
          animationDelay: `${i * 1.3}s`,
        }}>{n}</span>
      ))}
    </div>
  );
}

function Waveform({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{
          width: 3,
          borderRadius: 2,
          background: "linear-gradient(to top, #a855f7, #ec4899)",
          height: active ? `${10 + Math.sin(i * 0.8) * 10 + 12}px` : "6px",
          transition: "height 0.3s ease",
          animation: active ? `wave ${0.6 + (i % 5) * 0.15}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
    </div>
  );
}

export default function SongGenerator() {
  const [genre, setGenre] = useState("Pop");
  const [mood, setMood] = useState("Mélancolique");
  const [language, setLanguage] = useState("Français");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [song, setSong] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateSong = async () => {
    if (loading) return;
    setLoading(true);
    setSong(null);
    setError(null);

    const prompt = `Tu es un parolier professionnel. Génère une chanson complète en ${language} dans le style ${genre}, avec une ambiance ${mood}${theme ? ` sur le thème : "${theme}"` : ""}.

La chanson doit comporter :
- Un titre accrocheur
- Un couplet 1
- Un refrain (qui se répète)
- Un couplet 2
- Le refrain
- Un pont (bridge)
- Le refrain final

Formate ta réponse EXACTEMENT ainsi :
TITRE: [titre de la chanson]

[COUPLET 1]
[paroles...]

[REFRAIN]
[paroles...]

[COUPLET 2]
[paroles...]

[REFRAIN]
[paroles...]

[PONT]
[paroles...]

[REFRAIN FINAL]
[paroles...]`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      parseSong(text);
    } catch (e) {
      setError("Erreur de connexion à l'API. Réessaie.");
    }
    setLoading(false);
  };

  const parseSong = (text) => {
    const titleMatch = text.match(/TITRE\s*:\s*(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : "Ma Chanson";
    const body = text.replace(/TITRE\s*:.+/i, "").trim();

    const sections = [];
    const sectionRegex = /\[(.*?)\]\n([\s\S]*?)(?=\[|$)/g;
    let m;
    while ((m = sectionRegex.exec(body)) !== null) {
      const label = m[1].trim();
      const lyrics = m[2].trim();
      if (lyrics) sections.push({ label, lyrics });
    }

    setSong({ title, sections, raw: text });
  };

  const copyLyrics = () => {
    if (!song) return;
    navigator.clipboard.writeText(song.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sectionColors = {
    "COUPLET": "#818cf8",
    "REFRAIN": "#ec4899",
    "PONT": "#34d399",
    "BRIDGE": "#34d399",
  };

  const getSectionColor = (label) => {
    for (const key of Object.keys(sectionColors)) {
      if (label.toUpperCase().includes(key)) return sectionColors[key];
    }
    return "#a855f7";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a12; }
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }
        @keyframes wave {
          from { height: 6px; }
          to { height: 28px; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
          70% { box-shadow: 0 0 0 16px rgba(168, 85, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .chip { 
          cursor: pointer; padding: 6px 14px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.1);
          font-family: 'DM Sans', sans-serif; font-size: 0.78rem; letter-spacing: 0.03em;
          transition: all 0.2s ease; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
          white-space: nowrap;
        }
        .chip:hover { border-color: rgba(168,85,247,0.5); color: #d8b4fe; background: rgba(168,85,247,0.08); }
        .chip.selected { background: rgba(168,85,247,0.2); border-color: #a855f7; color: #e9d5ff; }
        .gen-btn {
          cursor: pointer; border: none; outline: none; width: 100%;
          padding: 16px; border-radius: 14px; font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 700; letter-spacing: 0.05em;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          color: #fff; transition: all 0.25s ease; position: relative; overflow: hidden;
        }
        .gen-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124,58,237,0.4); }
        .gen-btn:disabled { opacity: 0.7; cursor: not-allowed; animation: pulse-ring 1.5s infinite; }
        .gen-btn.loading {
          background: linear-gradient(270deg, #7c3aed, #db2777, #7c3aed);
          background-size: 200% 100%;
          animation: shimmer 1.5s linear infinite;
        }
        .section-card {
          animation: fadeSlide 0.4s ease both;
          border-radius: 12px; padding: 18px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.2s;
        }
        .section-card:hover { border-color: rgba(168,85,247,0.2); }
        .theme-input {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 10px 14px; color: #e2e8f0; font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; outline: none; transition: border-color 0.2s;
        }
        .theme-input:focus { border-color: #a855f7; }
        .theme-input::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #4c1d95; border-radius: 4px; }
      `}</style>

      <FloatingNotes />

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 0%, #1a0533 0%, #0a0a12 50%), radial-gradient(ellipse at 80% 100%, #0f1a2e 0%, transparent 60%)",
        fontFamily: "'Syne', sans-serif",
        color: "#e2e8f0",
        position: "relative",
        zIndex: 1,
        padding: "40px 16px",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 100, padding: "6px 16px", marginBottom: 20,
            }}>
              <Waveform active={loading} />
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.15em", color: "#c084fc", textTransform: "uppercase" }}>
                AI Song Generator
              </span>
              <Waveform active={loading} />
            </div>
            <h1 style={{
              fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 800,
              background: "linear-gradient(135deg, #e9d5ff 0%, #ec4899 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1.1, marginBottom: 12,
            }}>
              Compose ta<br />chanson avec l'IA
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", fontWeight: 300, fontFamily: "'DM Sans', sans-serif" }}>
              Choisis un style, une humeur, un thème — et laisse l'IA écrire pour toi.
            </p>
          </div>

          {/* Controls */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, padding: "28px 24px", marginBottom: 24,
            backdropFilter: "blur(20px)",
          }}>

            {/* Genre */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: "0.72rem", letterSpacing: "0.12em", color: "#a78bfa", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Genre musical
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {GENRES.map(g => (
                  <button key={g} className={`chip ${genre === g ? "selected" : ""}`} onClick={() => setGenre(g)}>{g}</button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: "0.72rem", letterSpacing: "0.12em", color: "#a78bfa", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Ambiance / Humeur
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MOODS.map(m => (
                  <button key={m} className={`chip ${mood === m ? "selected" : ""}`} onClick={() => setMood(m)}>{m}</button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: "0.72rem", letterSpacing: "0.12em", color: "#a78bfa", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Langue
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {LANGUAGES.map(l => (
                  <button key={l} className={`chip ${language === l ? "selected" : ""}`} onClick={() => setLanguage(l)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: "0.72rem", letterSpacing: "0.12em", color: "#a78bfa", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Thème (optionnel)
              </label>
              <input
                className="theme-input"
                placeholder="Ex : une lettre jamais envoyée, la ville la nuit, un amour de jeunesse..."
                value={theme}
                onChange={e => setTheme(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generateSong()}
              />
            </div>

            <button
              className={`gen-btn ${loading ? "loading" : ""}`}
              onClick={generateSong}
              disabled={loading}
            >
              {loading ? "✦ Composition en cours..." : "✦ Générer la chanson"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12, padding: "14px 18px", color: "#fca5a5",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", marginBottom: 24,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Song Result */}
          {song && (
            <div style={{ animation: "fadeSlide 0.5s ease both" }}>
              {/* Title bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "#a78bfa", textTransform: "uppercase", marginBottom: 4 }}>
                    ♪ {genre} · {mood} · {language}
                  </div>
                  <h2 style={{
                    fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 800,
                    background: "linear-gradient(90deg, #e9d5ff, #ec4899)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {song.title}
                  </h2>
                </div>
                <button onClick={copyLyrics} style={{
                  cursor: "pointer", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
                  borderRadius: 10, padding: "8px 14px", color: "#c084fc",
                  fontFamily: "'Syne', sans-serif", fontSize: "0.8rem", fontWeight: 600,
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}>
                  {copied ? "✓ Copié !" : "⎘ Copier"}
                </button>
              </div>

              {/* Sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {song.sections.map((sec, i) => {
                  const color = getSectionColor(sec.label);
                  return (
                    <div key={i} className="section-card" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div style={{
                        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.15em",
                        textTransform: "uppercase", color, marginBottom: 10,
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{
                          display: "inline-block", width: 20, height: 2,
                          background: color, borderRadius: 2, opacity: 0.7,
                        }} />
                        {sec.label}
                      </div>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
                        fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.75)",
                        whiteSpace: "pre-line",
                      }}>
                        {sec.lyrics}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Regenerate */}
              <button
                onClick={generateSong}
                style={{
                  cursor: "pointer", marginTop: 20, width: "100%",
                  background: "transparent", border: "1px solid rgba(168,85,247,0.3)",
                  borderRadius: 12, padding: "13px", color: "#c084fc",
                  fontFamily: "'Syne', sans-serif", fontSize: "0.9rem", fontWeight: 600,
                  transition: "all 0.2s", letterSpacing: "0.05em",
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(168,85,247,0.1)"; e.target.style.borderColor = "#a855f7"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(168,85,247,0.3)"; }}
              >
                ↺ Regénérer une nouvelle version
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
