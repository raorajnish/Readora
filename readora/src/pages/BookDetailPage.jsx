import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  FileText,
  MessageSquare,
  User,
  Calendar,
  Maximize,
  PenLine,
  Database,
} from "lucide-react";
import { getBooks, getBook, toggleBookmark, verifyPassword } from "../api/books";
import { useAuth } from "../context/AuthContext";
import { useAssetCache } from "../hooks/useAssetCache";
import PromoCodeModal from "../components/PromoCodeModal";
import ChatSection from "../components/ChatSection";
import PlatformFooter from "../components/PlatformFooter";
import Toast from "../components/Toast";

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const [toast, setToast] = useState(null);
  const [moreBooks, setMoreBooks] = useState([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { getCachedPdf, cachePdf } = useAssetCache();
  const pdfContainerRef = useRef(null);

  const enterFullScreen = async () => {
    try {
      const el = pdfContainerRef.current;
      if (!el) return;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch (err) {
      console.error("Failed to toggle full screen", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    getBook(id)
      .then(async (res) => {
        const bookData = res.data;
        setBook(bookData);
        setBookmarked(bookData.is_bookmarked || false);
        
        // Try to load PDF from cache
        if (bookData.pdf_url) {
          const cachedUrl = await getCachedPdf(bookData.pdf_url);
          if (cachedUrl) {
            setPdfBlobUrl(cachedUrl);
            setIsFromCache(true);
          } else {
            // Load fresh and cache for future
            const newUrl = await cachePdf(bookData.pdf_url);
            if (newUrl) setPdfBlobUrl(newUrl);
          }
        }
      })
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));

    // Fetch other books for "More Like This"
    getBooks()
      .then((res) => {
        const others = (res.data || []).filter(b => b.id.toString() !== id.toString());
        setMoreBooks(others.slice(0, 4)); // Get up to 4 other books
      })
      .catch(err => console.error("Failed to fetch more books", err));
  }, [id, navigate, getCachedPdf, cachePdf]);

  const handleBookmark = async () => {
    try {
      await toggleBookmark(book.id);
      setBookmarked((b) => !b);
      setToast({ 
        message: bookmarked ? "Removed from bookmarks" : "Added to bookmarks", 
        type: "success" 
      });
    } catch (e) {
      console.error(e);
      setToast({ message: "Failed to update bookmark", type: "error" });
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--secondary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div
      className="min-h-screen md:pt-16"
      style={{ background: "var(--background)", color: "var(--text-primary)" }}
    >
      {/* Mobile top bar */}
      <div
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl transition-colors hover:opacity-60"
          style={{ color: "var(--text-primary)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <span
          className="font-semibold text-sm truncate max-w-[200px]"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          {book.title}
        </span>
        {user && (
          <button
            onClick={handleBookmark}
            className="p-2 rounded-xl transition-colors hover:opacity-60"
            style={{
              color: bookmarked ? "var(--secondary)" : "var(--text-muted)",
            }}
          >
            {bookmarked ? (
              <BookmarkCheck size={20} fill="currentColor" />
            ) : (
              <Bookmark size={20} />
            )}
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 pb-28 md:pb-10">
        {/* Cover + Info */}
        <div className="flex gap-4 mb-6">
          {/* Cover */}
          <div
            className="shrink-0 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: "var(--primary)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-5xl font-bold opacity-30"
                style={{
                  fontFamily: "var(--font-lora)",
                  color: "var(--background)",
                }}
              >
                {book.title?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
            <h1
              className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight"
              style={{
                fontFamily: "var(--font-lora)",
                color: "var(--text-primary)",
              }}
              title={book.title}
            >
              {book.title}
            </h1>

            <div className="flex flex-col gap-2 mb-4">
              {book.author && (
                <div
                  className="flex items-center gap-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="p-1 rounded-md" style={{ background: "var(--surface)" }}>
                    <User size={12} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {book.author}
                  </span>
                </div>
              )}

              {book.created_at && (
                <div
                  className="flex items-center gap-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="p-1 rounded-md" style={{ background: "var(--surface)" }}>
                    <Calendar size={12} />
                  </div>
                  <span className="text-xs">
                    {new Date(book.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop bookmark */}
            {user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBookmark}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: bookmarked ? "var(--secondary)" : "var(--text-muted)",
                  }}
                >
                  {bookmarked ? (
                    <>
                      <BookmarkCheck size={14} fill="currentColor" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark size={14} /> Bookmark
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div
            className="p-4 rounded-2xl mb-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              About
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {book.description}
            </p>
          </div>
        )}

        {/* PDF Viewer Placeholder */}
        {book.pdf_url ? (
          <div
            className="rounded-2xl overflow-hidden mb-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <FileText size={15} style={{ color: "var(--secondary)" }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Read Book
                </span>
                {isFromCache && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-md" style={{ background: "var(--secondary)", color: "var(--background)", opacity: 0.8 }}>
                    <Database size={10} />
                    Cached
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPromo(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  title="Annotate PDF"
                >
                  <PenLine size={14} />
                  <span className="hidden sm:inline">Annotate</span>
                </button>
                <button
                  onClick={enterFullScreen}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Maximize size={14} />
                  Full Screen
                </button>
              </div>
            </div>
            <div
              ref={pdfContainerRef}
              className="relative w-full"
              style={{
                paddingBottom: "141.4%",
                minHeight: "550px",
                width: "100%",
                maxWidth: "100%",
                backgroundColor: "var(--surface)",
                borderRadius: "0.75rem",
                overflow: "hidden",
              }}
            >
              <object
                data={pdfBlobUrl || book.pdf_url}
                type="application/pdf"
                width="100%"
                height="100%"
                className="rounded-xl bg-white"
                aria-label={`PDF for ${book.title}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "1px solid var(--border)",
                }}
                onError={() => setPdfLoadFailed(true)}
              >
                <p>
                  PDF preview not available.{" "}
                  <a
                    href={book.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open PDF in new tab
                  </a>
                  .
                </p>
              </object>
              {pdfLoadFailed && (
                <div
                  className="mt-3 p-3 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--danger)",
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--danger)" }}>
                    PDF preview failed to load (Cloudinary resource may require
                    signed delivery). Use the direct link below.
                  </p>
                  <a
                    href={book.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold"
                    style={{ color: "var(--secondary)" }}
                  >
                    Open PDF directly
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 mb-5 flex flex-col items-center gap-3 text-center"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderStyle: "dashed",
            }}
          >
            <BookOpen
              size={32}
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No PDF attached to this book
            </p>
          </div>
        )}

        {/* --- MORE LIKE THIS --- */}
        {moreBooks.length > 0 && (
          <div className="mt-8 mb-10">
            <h2 
              className="text-sm font-bold uppercase tracking-widest mb-4 px-1"
              style={{ color: "var(--text-muted)", opacity: 0.8 }}
            >
              More Like This
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {moreBooks.map(b => (
                <div 
                  key={b.id}
                  onClick={() => navigate(`/book/${b.id}`)}
                  className="flex flex-col gap-2 cursor-pointer group"
                >
                  <div 
                   className="aspect-2/3 rounded-xl overflow-hidden shadow-2xl border-[var(--border)] transition-transform group-hover:-translate-y-1"
                    style={{ background: "var(--surface)" }}
                  >
                    {b.cover_image_url ? (
                      <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold opacity-20" style={{ background: "var(--primary)", color: "var(--background)" }}>
                        {b.title[0]}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs font-bold line-clamp-1 group-hover:text-[var(--secondary)] transition-colors">
                    {b.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes modal (mobile + desktop unified) */}
        {chatUnlocked && (
          <ChatSection bookId={book.id} onClose={() => setChatUnlocked(false)} />
        )}

        {/* Platform Footer */}
        <PlatformFooter />
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Promo Modal */}
      {showPromo && (
        <PromoCodeModal
          book={book}
          title="Annotate your PDF"
          description="Enable advanced reading tools and annotations for this document."
          errorText="API Error: Failed to annotate"
          buttonText="Annotate"
          onClose={() => setShowPromo(false)}
          onSuccess={() => {
            setShowPromo(false);
            setChatUnlocked(true);
          }}
        />
      )}
    </div>
  );
};

export default BookDetailPage;
