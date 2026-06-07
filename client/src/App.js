import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { apiFetch } from "./api";

// ── Colors ────────────────────────────────────────────────────────────────────
const gold = "#c8a96e";
const darkGold = "#a07840";
const dark = "#1a1a2e";
const bg = "#f9f7f4";
const card = "#ffffff";

// ── SignatureCanvas ───────────────────────────────────────────────────────────
function SignatureCanvas({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };
  const endDraw = (e) => { e.preventDefault(); drawing.current = false; };
  const clear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <p style={{ margin: 0, color: "#555", fontSize: 14, textAlign: "center" }}>Aşağıya imzanızı atın</p>
      <div style={{ border: `2px dashed ${gold}`, borderRadius: 12, overflow: "hidden", width: "100%", maxWidth: 480, background: "#fff", touchAction: "none" }}>
        <canvas
          ref={canvasRef} width={480} height={200}
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 480 }}>
        <button onClick={clear} style={{ flex: 1, padding: "10px 0", border: "1.5px solid #ddd", borderRadius: 8, background: "#f5f5f5", color: "#555", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Temizle</button>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", border: "1.5px solid #e57373", borderRadius: 8, background: "#fff", color: "#e57373", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>İptal</button>
        <button onClick={() => onSave(canvasRef.current.toDataURL())} style={{ flex: 2, padding: "10px 0", border: "none", borderRadius: 8, background: `linear-gradient(135deg, ${gold}, ${darkGold})`, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Kaydet ✓</button>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError("");
    try {
      await apiFetch("/api/login", { method: "POST", body: JSON.stringify({ password: pw }) });
      localStorage.setItem("app_token", pw);
      onLogin();
    } catch (e) {
      setError("Şifre hatalı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: dark, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: card, borderRadius: 20, padding: 40, width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 11, letterSpacing: 3, color: gold, textTransform: "uppercase", marginBottom: 4 }}>Dernek Yönetimi</div>
        <div style={{ fontSize: 24, fontWeight: "bold", color: dark, marginBottom: 28, fontFamily: "Georgia, serif" }}>Yoklama Sistemi</div>
        <input
          type="password" placeholder="Şifre" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ width: "100%", padding: "13px 16px", border: error ? "1.5px solid #e57373" : "1.5px solid #ddd", borderRadius: 10, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
        />
        {error && <div style={{ color: "#e57373", fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px 0", border: "none", borderRadius: 10, background: `linear-gradient(135deg, ${gold}, ${darkGold})`, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginTop: 4 }}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("app_token"));
  const [view, setView] = useState("yoklama");
  const today = new Date().toISOString().split("T")[0];
  const [activeDate, setActiveDate] = useState(today);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [allDates, setAllDates] = useState([]);
  const [search, setSearch] = useState("");
  const [signingMember, setSigningMember] = useState(null);
  const [newMember, setNewMember] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const loadMembers = useCallback(async () => {
    try { setMembers(await apiFetch("/api/members")); } catch (e) { showToast("Üyeler yüklenemedi"); }
  }, []);

  const loadAttendance = useCallback(async (date) => {
    try { setAttendance(await apiFetch(`/api/attendance/${date}`)); } catch (e) { showToast("Yoklama yüklenemedi"); }
  }, []);

  const loadAllDates = useCallback(async () => {
    try { setAllDates(await apiFetch("/api/attendance")); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadMembers();
    loadAllDates();
  }, [authed, loadMembers, loadAllDates]);

  useEffect(() => {
    if (!authed) return;
    loadAttendance(activeDate);
  }, [authed, activeDate, loadAttendance]);

  const saveSignature = async (dataUrl) => {
    try {
      await apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({ member_name: signingMember, date: activeDate, signature: dataUrl }),
      });
      await loadAttendance(activeDate);
      await loadAllDates();
      showToast(`${signingMember} — imza kaydedildi ✓`);
      setSigningMember(null);
      setSearch("");
    } catch (e) { showToast("Kayıt hatası: " + e.message); }
  };

  const removeAttendance = async (member) => {
    try {
      await apiFetch(`/api/attendance/${activeDate}/${encodeURIComponent(member)}`, { method: "DELETE" });
      await loadAttendance(activeDate);
      setDeleteConfirm(null);
    } catch (e) { showToast("Silme hatası"); }
  };

  const addMember = async () => {
    const name = newMember.trim();
    if (!name) return;
    try {
      await apiFetch("/api/members", { method: "POST", body: JSON.stringify({ name }) });
      await loadMembers();
      setNewMember("");
      showToast(`${name} eklendi`);
    } catch (e) { showToast("Hata: " + e.message); }
  };

  const removeMember = async (name) => {
    try {
      await apiFetch(`/api/members/${encodeURIComponent(name)}`, { method: "DELETE" });
      await loadMembers();
      setDeleteConfirm(null);
    } catch (e) { showToast("Silme hatası"); }
  };

  const importMembers = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const names = rows.map(r => String(r[0] || "").trim()).filter(n => n && n.length > 1 && isNaN(Number(n)));
        if (!names.length) { showToast("İsim bulunamadı"); return; }
        setLoading(true);
        await apiFetch("/api/members/bulk", { method: "POST", body: JSON.stringify({ names }) });
        await loadMembers();
        showToast(`${names.length} üye içe aktarıldı ✓`);
      } catch (err) { showToast("Hata: " + err.message); }
      finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const exportToCSV = (filterDate = null) => {
    const dates = filterDate ? [filterDate] : [...allDates].sort();
    if (!dates.length) { showToast("Kayıt yok"); return; }
    const labels = dates.map(d => new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }));
    const rows = [["Üye Adı", ...labels, "Toplam", "Katılım Oranı"]];
    members.forEach(m => {
      const cells = dates.map(d => attendance[m] || "-"); // placeholder — rapor sayfasında farklı yükleniyor
      rows.push([m, ...cells]);
    });
    const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const win = window.open("", "_blank");
    if (win) {
      const fname = filterDate ? `Yoklama_${filterDate}.csv` : `Yoklama_Tum.csv`;
      win.document.write(`<html><head><title>${fname}</title></head><body style="font-family:sans-serif;padding:32px;background:#f5f5f5;"><div style="background:#fff;border-radius:12px;padding:28px;max-width:480px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,.1)"><div style="font-size:20px;font-weight:bold;margin-bottom:16px;">📊 ${fname}</div><a href="data:text/csv;charset=utf-8,${encodeURIComponent(csv)}" download="${fname}" style="display:inline-block;padding:12px 28px;background:#217346;color:#fff;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">⬇️ İndir</a></div></body></html>`);
      win.document.close();
    } else { showToast("Popup engelleyicisini kapat ve tekrar dene"); }
  };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const filtered = members.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const presentCount = Object.keys(attendance).length;

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "Georgia, 'Times New Roman', serif", color: dark }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: dark, color: "#fff", padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: dark, color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: gold, textTransform: "uppercase", marginBottom: 2 }}>Dernek Yönetimi</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>Yoklama</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["yoklama", "İmza"], ["rapor", "Rapor"], ["ayarlar", "Üyeler"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "7px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit", background: view === v ? gold : "rgba(255,255,255,.12)", color: view === v ? dark : "#ccc", fontWeight: view === v ? 700 : 400 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px" }}>

        {/* ── YOKLAMA ── */}
        {view === "yoklama" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#888" }}>Tarih</label>
              <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 15, fontFamily: "inherit", outline: "none", background: card }} />
              <div style={{ background: dark, color: gold, padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                {presentCount}/{members.length}
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#aaa" }}>🔍</span>
              <input placeholder="İsim arayın..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "12px 12px 12px 38px", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 16, fontFamily: "inherit", outline: "none", background: card, boxSizing: "border-box", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, color: "#aaa", cursor: "pointer" }}>×</button>}
            </div>

            {/* Signature modal */}
            {signingMember && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{ background: card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 540, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: gold, textTransform: "uppercase" }}>İmza</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 4 }}>{signingMember}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{new Date(activeDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                  <SignatureCanvas onSave={saveSignature} onCancel={() => setSigningMember(null)} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Üye bulunamadı</div>}
              {filtered.map(member => {
                const att = attendance[member];
                return (
                  <div key={member} style={{ background: card, borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: att ? `1.5px solid ${gold}` : "1.5px solid transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: att ? gold : "#e8e4de", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: att ? "#fff" : "#aaa", fontWeight: 700, flexShrink: 0 }}>
                        {att ? "✓" : member.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: att ? 600 : 400 }}>{member}</div>
                        {att && <div style={{ fontSize: 11, color: gold }}>{att.time}</div>}
                      </div>
                    </div>
                    {att ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {att.sig && <img src={att.sig} alt="imza" style={{ height: 30, border: "1px solid #eee", borderRadius: 4 }} />}
                        <button onClick={() => setDeleteConfirm(member)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18 }}>×</button>
                      </div>
                    ) : (
                      <button onClick={() => setSigningMember(member)} style={{ padding: "7px 16px", border: `1.5px solid ${gold}`, borderRadius: 20, background: "#fff", color: darkGold, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        İmzala
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── RAPOR ── */}
        {view === "rapor" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: "bold" }}>Yoklama Raporu</div>
              {allDates.length > 0 && (
                <button onClick={() => exportToCSV(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "none", borderRadius: 20, background: "linear-gradient(135deg,#217346,#185c38)", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  📊 Tümünü İndir
                </button>
              )}
            </div>
            {allDates.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 60 }}>Henüz kayıt yok</div>}
            {allDates.map(date => (
              <DateCard key={date} date={date} members={members} onExport={() => exportToCSV(date)} />
            ))}
          </>
        )}

        {/* ── ÜYELER ── */}
        {view === "ayarlar" && (
          <>
            <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>Üye Listesi</div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 18 }}>{members.length} üye kayıtlı</div>

            {/* Excel import */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "13px 16px", borderRadius: 10, cursor: "pointer", border: `2px dashed ${gold}`, background: "#fffdf8" }}>
              <span style={{ fontSize: 20 }}>📂</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Excel / CSV'den Yükle</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>.xlsx, .xls veya .csv — ilk sütunda isimler</div>
              </div>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={importMembers} style={{ display: "none" }} />
            </label>

            {/* Manuel ekle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <input placeholder="Yeni üye adı..." value={newMember} onChange={e => setNewMember(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()}
                style={{ flex: 1, padding: "10px 13px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 15, fontFamily: "inherit", outline: "none", background: card }} />
              <button onClick={addMember} style={{ padding: "10px 18px", border: "none", borderRadius: 8, background: gold, color: dark, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Ekle</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {members.map((m, i) => (
                <div key={m} style={{ background: card, borderRadius: 8, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#ccc", fontSize: 12, minWidth: 20 }}>{i + 1}</span>
                    <span style={{ fontSize: 15 }}>{m}</span>
                  </div>
                  <button onClick={() => setDeleteConfirm("member:" + m)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 18 }}>×</button>
                </div>
              ))}
            </div>

            <button onClick={() => { localStorage.removeItem("app_token"); setAuthed(false); }}
              style={{ marginTop: 32, width: "100%", padding: "11px 0", border: "1.5px solid #e57373", borderRadius: 8, background: "#fff", color: "#e57373", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
              Çıkış Yap
            </button>
          </>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Silinsin mi?</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              {deleteConfirm.startsWith("member:") ? `${deleteConfirm.replace("member:", "")} üye listesinden silinecek.` : `${deleteConfirm} için yoklama kaydı silinecek.`}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px 0", border: "1.5px solid #ddd", borderRadius: 8, background: "#fff", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>İptal</button>
              <button onClick={() => deleteConfirm.startsWith("member:") ? removeMember(deleteConfirm.replace("member:", "")) : removeAttendance(deleteConfirm)}
                style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#e57373", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DateCard (rapor için her tarih ayrı API çağrısı) ──────────────────────────
function DateCard({ date, members, onExport }) {
  const [att, setAtt] = useState(null);

  useEffect(() => {
    apiFetch(`/api/attendance/${date}`).then(setAtt).catch(() => setAtt({}));
  }, [date]);

  const dateLabel = new Date(date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const count = att ? Object.keys(att).length : "...";
  const absent = att ? members.filter(m => !att[m]) : [];

  return (
    <div style={{ background: "#fff", borderRadius: 12, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.07)", overflow: "hidden" }}>
      <div style={{ background: "#1a1a2e", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{dateLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#c8a96e", color: "#1a1a2e", borderRadius: 16, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
            {count} / {members.length}
          </div>
          <button onClick={onExport} style={{ padding: "4px 10px", border: "1px solid rgba(255,255,255,.25)", borderRadius: 14, background: "transparent", color: "#fff", fontSize: 11, fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}>⬇ İndir</button>
        </div>
      </div>
      {att && (
        <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(att).map(([name, info]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0ede8", borderRadius: 20, padding: "4px 11px", fontSize: 13 }}>
              <span style={{ color: "#c8a96e" }}>✓</span><span>{name}</span>
              <span style={{ color: "#aaa", fontSize: 11 }}>{info.time}</span>
            </div>
          ))}
          {absent.map(name => (
            <div key={name} style={{ background: "#fdf0f0", borderRadius: 20, padding: "4px 11px", fontSize: 12, color: "#c0756a" }}>{name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
