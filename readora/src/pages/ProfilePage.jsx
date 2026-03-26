import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Bookmark,
  LogOut,
  BookOpen,
  ChevronRight,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getBookmarks, getUserBooks, deleteBook } from "../api/books";
import ThemeToggle from "../components/ThemeToggle";
import Toast from "../components/Toast";
import { X, AlertTriangle } from "lucide-react";

const ProfilePage = ({ theme, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBooksLoading, setUserBooksLoading] = useState(true);
  const [deletingBookId, setDeletingBookId] = useState(null);
  const [activeMenuBookId, setActiveMenuBookId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { id, title }

  useEffect(() => {
    const fetchBookmarks = getBookmarks()
      .then((res) => {
        setBookmarks(res.data || []);
      })
      .catch(() => {
        setBookmarks([]);
      })
      .finally(() => setLoading(false));

    const fetchUserBooks = getUserBooks()
      .then((res) => {
        const found = res.data || [];
        if (user && user.id) {
          const filtered = found.filter((book) => book.created_by === user.id);
          if (filtered.length !== found.length) {
            console.warn(
              "My Books has out-of-scope results; filtering by created_by:",
              found,
            );
          }
          setUserBooks(filtered);
        } else {
          setUserBooks(found);
        }
      })
      .catch(() => {
        setUserBooks([]);
      })
      .finally(() => setUserBooksLoading(false));

    // Run side effects in parallel
    Promise.all([fetchBookmarks, fetchUserBooks]);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditBook = (bookId) => {
    setActiveMenuBookId(null);
    navigate(`/create/${bookId}`);
  };

  const handleDeleteBook = (bookId, bookTitle) => {
    setActiveMenuBookId(null);
    setConfirmModal({ id: bookId, title: bookTitle });
  };

  const executeDelete = async () => {
    const bookId = confirmModal.id;
    setConfirmModal(null);
    
    try {
      setDeletingBookId(bookId);
      await deleteBook(bookId);
      setUserBooks((prev) => prev.filter((book) => book.id !== bookId));
      setToast({ message: "Book deleted successfully", type: "success" });
    } catch (err) {
      console.error("deleteBook failed", err);
      setToast({ message: "Failed to delete the book", type: "error" });
    } finally {
      setDeletingBookId(null);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) =>
    value ? (
      <div
        className="flex items-center gap-3 py-3"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        <Icon size={16} style={{ color: "var(--text-muted)" }} />
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </p>
        </div>
      </div>
    ) : null;

  return (
    <div
      className="min-h-screen md:pt-16 pb-24 md:pb-10"
      style={{ background: "var(--background)", color: "var(--text-primary)" }}
    >
      {/* Mobile header */}
      <div
        className="md:hidden px-4 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <h1
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--font-lora)",
              color: "var(--text-primary)",
            }}
          >
            Profile
          </h1>
          <ThemeToggle theme={theme} onToggle={onToggle} />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-70"
          style={{
            color: "var(--danger)",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">
        {/* Avatar + Name */}
        <div
          className="flex flex-col items-center gap-3 p-6 rounded-3xl mb-5 text-center text-primary"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{
              background: "var(--primary)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-lora)",
            }}
          >
            {user?.username?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2
              className="text-xl font-bold"
              style={{
                fontFamily: "var(--font-lora)",
                color: "var(--text-primary)",
              }}
            >
              {user?.username}
            </h2>
            {user?.email && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* Info */}
        <div
          className="p-4 rounded-2xl mb-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Account Info
          </h3>
          <InfoRow icon={User} label="Username" value={user?.username} />
          <InfoRow icon={Mail} label="Email" value={user?.email} />
          <InfoRow icon={Phone} label="Phone" value={user?.phone_number} />
        </div>


        {/* Bookmarks */}
        <div
          className="p-4 rounded-2xl mb-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            <Bookmark size={12} className="inline mr-1" />
            Bookmarks
          </h3>
          {loading ? (
            <p className="text-sm py-2" style={{ color: "var(--text-muted)" }}>
              Loading...
            </p>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <BookOpen
                size={24}
                style={{ color: "var(--text-muted)", opacity: 0.4 }}
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No bookmarks yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => navigate(`/book/${bm.book}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:opacity-75 text-left"
                  style={{
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} style={{ color: "var(--secondary)" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {bm.book_title || `Book #${bm.book}`}
                    </span>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My Books */}
        <div
          className="p-4 rounded-2xl mb-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            My Books
          </h3>
          {userBooksLoading ? (
            <p className="text-sm py-2" style={{ color: "var(--text-muted)" }}>
              Loading...
            </p>
          ) : userBooks.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <BookOpen
                size={24}
                style={{ color: "var(--text-muted)", opacity: 0.4 }}
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                You have not added any books yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userBooks.map((book) => (
                <div
                  key={book.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:opacity-75"
                  style={{
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <button
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="flex-1 text-left"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <p className="text-sm font-medium">{book.title}</p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {book.author || "Unknown author"}
                    </p>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuBookId((current) =>
                          current === book.id ? null : book.id,
                        )
                      }
                      className="p-2 rounded-full hover:bg-gray-100"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="More options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuBookId === book.id && (
                      <div
                        className="absolute right-0 mt-1.5 w-32 rounded-xl shadow-lg"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <button
                          onClick={() => handleEditBook(book.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          disabled={deletingBookId === book.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100"
                          style={{ color: "var(--danger)" }}
                        >
                          <Trash2 size={14} />
                          {deletingBookId === book.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Book Button */}
        <button
          onClick={() => navigate("/create")}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl mb-8 transition-all hover:opacity-90 color-text-primary shadow-sm"
          style={{
            background: "var(--surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--secondary)",
            fontFamily: "var(--font-lora)",
            fontWeight: "600",
          }}
        >
          <Plus size={18} />
          Add New Book
        </button>
      </div>

      {/* Deletion Confirmation Modal */}
      {confirmModal && (
        <div 
          className="fixed inset-0 z-110 flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div 
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="aspect-2/3 rounded-xl overflow-hidden shadow-2xl border border-(--border)">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete Book?</h3>
                <p className="text-sm mt-1 px-2" style={{ color: "var(--text-secondary)" }}>
                  Are you sure you want to delete <span className="font-semibold">"{confirmModal.title}"</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-75"
                  style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all hover:opacity-90"
                  style={{ background: "#ef4444", color: "white" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default ProfilePage;
