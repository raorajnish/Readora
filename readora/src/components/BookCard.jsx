import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toggleBookmark } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { useAssetCache } from '../hooks/useAssetCache';

const BookCard = ({ book, onClick, onBookmarkChange }) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(book.is_bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);
  const [coverUrl, setCoverUrl] = useState(book.cover_image_url);
  const { getCachedPdf, cachePdf } = useAssetCache();

  useEffect(() => {
    if (book.cover_image_url) {
      getCachedPdf(book.cover_image_url).then((cached) => {
        if (cached) {
          setCoverUrl(cached);
        } else {
          cachePdf(book.cover_image_url).then((newUrl) => {
            if (newUrl) setCoverUrl(newUrl);
          });
        }
      });
    }
  }, [book.cover_image_url, getCachedPdf, cachePdf]);

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) return;
    setBookmarking(true);
    try {
      await toggleBookmark(book.id);
      setBookmarked((b) => !b);
      onBookmarkChange?.();
    } catch (err) {
      console.error(err);
    } finally {
      setBookmarking(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Cover Image */}
      <div
        className="h-44 w-full overflow-hidden relative"
        style={{ background: 'var(--primary)' }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4">
            <span
              className="text-4xl font-bold opacity-30"
              style={{ fontFamily: 'var(--font-lora)', color: 'var(--background)' }}
            >
              {book.title?.charAt(0)?.toUpperCase()}
            </span>
            <span
              className="text-xs text-center opacity-20 line-clamp-2"
              style={{ color: 'var(--background)' }}
            >
              {book.title}
            </span>
          </div>
        )}

        {/* Bookmark button */}
        {user && (
          <button
            onClick={handleBookmark}
            disabled={bookmarking}
            className="absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            {bookmarked ? (
              <BookmarkCheck size={16} fill="currentColor" />
            ) : (
              <Bookmark size={16} />
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-semibold text-sm line-clamp-1 mb-0.5"
          style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}
        >
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {book.author}
          </p>
        )}
        {book.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {book.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookCard;
