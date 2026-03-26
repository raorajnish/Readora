import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, BookOpen, RefreshCw } from 'lucide-react';
import { getBooks } from '../api/books';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooks = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await getBooks(q);
      setBooks(res.data);
    } catch {
      setError('Failed to load books. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchBooks(search), 400);
    return () => clearTimeout(timer);
  }, [search, fetchBooks]);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--text-primary)' }}
    >
      {/* Header section */}
      <div
        className="sticky top-0 z-40 px-4 pt-4 pb-3 md:pt-20"
        style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Greeting */}
          <h1
            className="text-xl md:text-2xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}
          >
            Hello, {user?.username} 👋
          </h1>

          {/* Search + Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-85 active:scale-95 md:flex"
              style={{ background: 'var(--primary)', color: 'var(--background)' }}
            >
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Add Book</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-24 md:pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--secondary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading books...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
            <button
              onClick={() => fetchBooks(search)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:opacity-75"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <BookOpen size={30} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p
                className="font-semibold text-base mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {search ? 'No books found' : 'No books yet'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {search
                  ? `Try a different search term`
                  : 'Be the first to add a book!'}
              </p>
            </div>
            {!search && (
              <button
                onClick={() => navigate('/create')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                style={{ background: 'var(--primary)', color: 'var(--background)' }}
              >
                <PlusCircle size={15} />
                Add First Book
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {books.length} {books.length === 1 ? 'book' : 'books'}
              {search && ` for "${search}"`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => navigate(`/book/${book.id}`)}
                  onBookmarkChange={() => fetchBooks(search)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
