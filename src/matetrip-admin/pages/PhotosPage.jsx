import { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";
import { useLang } from "../contexts/LangContext";
import { fetchSubcollection } from "../services/firestore";
import { Card, CardHeader, Spinner } from "../components/ui";
import PageHeader from "../components/PageHeader";

export default function PhotosPage() {
  const { trips, users } = useData();
  const { tr, lang } = useLang();

  const [selectedTripId, setSelectedTripId] = useState("");
  const [photos, setPhotos]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [lightbox, setLightbox] = useState(null); // photo object
  const [search, setSearch]     = useState("");

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  useEffect(() => {
    if (!selectedTripId) { setPhotos([]); return; }
    setLoading(true);
    fetchSubcollection(selectedTripId, "photos").then(data => {
      const sorted = [...data].sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setPhotos(sorted);
      setLoading(false);
    });
  }, [selectedTripId]);

  const isVideo = url => url && /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);

  const filtered = photos.filter(p =>
    !search || (p.note || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some(t => t.includes(search.toLowerCase()))
  );

  const getUserName = uid => {
    const u = users.find(u => u.id === uid || u.uid === uid);
    return u?.displayName || u?.username || uid?.slice(0, 8) || "—";
  };

  const formatDate = ts => {
    if (!ts) return "—";
    const d = new Date((ts.seconds || 0) * 1000);
    return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-GB", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div>
      <PageHeader
        title={lang === "zh" ? "照片" : "Photos"}
        subtitle={lang === "zh" ? "按旅程浏览所有照片和视频" : "Browse photos and videos by trip"}
      />

      <div style={{ padding: 28 }}>
        {/* Trip Selector */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <select
            value={selectedTripId}
            onChange={e => { setSelectedTripId(e.target.value); setSearch(""); }}
            style={{
              padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
              minWidth: 260, cursor: "pointer",
            }}
          >
            <option value="">{lang === "zh" ? "选择旅程…" : "Select a trip…"}</option>
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.name || "Untitled"} {t.destination ? `· ${t.destination}` : ""} ({t.joinCode})</option>
            ))}
          </select>

          {photos.length > 0 && (
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "zh" ? "搜索备注或标签…" : "Search notes or tags…"}
              style={{
                padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text)", fontSize: 13, outline: "none", width: 220,
              }}
            />
          )}

          {photos.length > 0 && (
            <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
              {filtered.length} / {photos.length} {lang === "zh" ? "张" : "photos"}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!selectedTripId && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
            <div style={{ fontSize: 14 }}>{lang === "zh" ? "选择一个旅程查看照片" : "Select a trip to view photos"}</div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64, gap: 12, color: "var(--text3)" }}>
            <Spinner size={20} /> {lang === "zh" ? "加载中…" : "Loading…"}
          </div>
        )}

        {/* Trip header */}
        {!loading && selectedTrip && (
          <div style={{ marginBottom: 20, padding: "14px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 28 }}>🗺</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedTrip.name || "Untitled"}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                {selectedTrip.destination || "—"} · {selectedTrip.startDate || "?"} → {selectedTrip.endDate || "?"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{photos.length}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{lang === "zh" ? "张媒体" : "media"}</div>
            </div>
          </div>
        )}

        {/* No photos */}
        {!loading && selectedTripId && photos.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 13 }}>{lang === "zh" ? "这个旅程还没有照片" : "No photos in this trip yet"}</div>
          </div>
        )}

        {/* No results after search */}
        {!loading && photos.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
            {lang === "zh" ? "没有匹配的照片" : "No matching photos"}
          </div>
        )}

        {/* Photo grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}>
            {filtered.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isVideo={isVideo(photo.imageUrl)}
                onClick={() => setLightbox(photo)}
                getUserName={getUserName}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photo={lightbox}
          photos={filtered}
          isVideo={isVideo(lightbox.imageUrl)}
          onClose={() => setLightbox(null)}
          onNav={dir => {
            const idx = filtered.indexOf(lightbox);
            const next = filtered[idx + dir];
            if (next) setLightbox(next);
          }}
          getUserName={getUserName}
          formatDate={formatDate}
          lang={lang}
        />
      )}
    </div>
  );
}

// ── PhotoCard ─────────────────────────────────────────────────────────────────
function PhotoCard({ photo, isVideo, onClick, getUserName, formatDate }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface2)", borderRadius: 10, overflow: "hidden",
        border: "1px solid var(--border)", cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", paddingTop: "75%", background: "var(--surface3)" }}>
        {!error ? (
          <>
            {!loaded && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spinner size={20} />
              </div>
            )}
            {isVideo ? (
              <video
                src={photo.imageUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0 }}
                onLoadedData={() => setLoaded(true)}
                onError={() => setError(true)}
                muted
              />
            ) : (
              <img
                src={photo.imageUrl}
                alt={photo.note || ""}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.2s" }}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
              />
            )}
            {loaded && isVideo && (
              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 6px", fontSize: 11, color: "white" }}>▶ video</div>
            )}
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--text3)" }}>🖼️</div>
        )}
      </div>

      {/* Meta */}
      <div style={{ padding: "10px 12px" }}>
        {photo.note && (
          <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {photo.note}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>{formatDate(photo.createdAt)}</div>
          {photo.tags?.length > 0 && (
            <div style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-pale)", padding: "1px 6px", borderRadius: 10 }}>
              #{photo.tags[0]}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>by {getUserName(photo.uploadedBy)}</div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photo, photos, isVideo, onClose, onNav, getUserName, formatDate, lang }) {
  const idx    = photos.indexOf(photo);
  const hasPrev = idx > 0;
  const hasNext = idx < photos.length - 1;

  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNav]);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "admin-fadeIn 0.15s ease",
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)",
        border: "none", color: "white", fontSize: 20, width: 40, height: 40,
        borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}>✕</button>

      {/* Counter */}
      <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
        {idx + 1} / {photos.length}
      </div>

      {/* Prev */}
      {hasPrev && (
        <button onClick={() => onNav(-1)} style={{
          position: "absolute", left: 20, background: "rgba(255,255,255,0.1)", border: "none",
          color: "white", fontSize: 22, width: 48, height: 48, borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>‹</button>
      )}

      {/* Image / Video */}
      <div style={{ maxWidth: "80vw", maxHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {isVideo ? (
          <video src={photo.imageUrl} controls autoPlay style={{ maxWidth: "80vw", maxHeight: "65vh", borderRadius: 12 }} />
        ) : (
          <img src={photo.imageUrl} alt={photo.note || ""} style={{ maxWidth: "80vw", maxHeight: "65vh", objectFit: "contain", borderRadius: 12 }} />
        )}

        {/* Meta panel */}
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 20px",
          display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
          backdropFilter: "blur(10px)",
        }}>
          {photo.note && (
            <div style={{ color: "white", fontSize: 13 }}>💬 {photo.note}</div>
          )}
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>📅 {formatDate(photo.createdAt)}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>👤 {getUserName(photo.uploadedBy)}</div>
          {photo.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              {photo.tags.map(t => (
                <span key={t} style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-pale)", padding: "2px 8px", borderRadius: 10 }}>#{t}</span>
              ))}
            </div>
          )}
          {photo.googleMapLink && (
            <a href={photo.googleMapLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontSize: 12 }}>📍 {lang === "zh" ? "查看地图" : "View map"}</a>
          )}
        </div>
      </div>

      {/* Next */}
      {hasNext && (
        <button onClick={() => onNav(1)} style={{
          position: "absolute", right: 20, background: "rgba(255,255,255,0.1)", border: "none",
          color: "white", fontSize: 22, width: 48, height: 48, borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>›</button>
      )}
    </div>
  );
}
