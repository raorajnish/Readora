import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  Lock,
  Tag,
  FileText,
  Image,
} from "lucide-react";
import { createBook, getBook, updateBook } from "../api/books";

const InputField = ({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
  error,
}) => (
  <div>
    <label
      className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
      style={{ color: "var(--text-muted)" }}
    >
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="absolute left-3 top-3.5"
          style={{ color: "var(--text-muted)" }}
        />
      )}
      {textarea ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={3}
          autoComplete="off"
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
          style={{
            background: "var(--surface-alt)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            color: "var(--text-primary)",
          }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: "var(--surface-alt)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            color: "var(--text-primary)",
          }}
        />
      )}
    </div>
    {error && (
      <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
        {error}
      </p>
    )}
  </div>
);

const FileDropzone = ({ label, icon: Icon, accept, file, onChange, hint }) => (
  <div>
    <label
      className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
      style={{ color: "var(--text-muted)" }}
    >
      {label}
    </label>
    <label
      className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl cursor-pointer transition-all hover:opacity-75"
      style={{
        background: "var(--surface-alt)",
        border: `2px dashed ${file ? "var(--success)" : "var(--border)"}`,
      }}
    >
      <Icon
        size={20}
        style={{ color: file ? "var(--success)" : "var(--text-muted)" }}
      />
      <span
        className="text-sm font-medium max-w-full"
        style={{
          color: file ? "var(--success)" : "var(--text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
          width: "100%",
          padding: "0 8px",
        }}
        title={file?.name || `Upload ${label}`}
      >
        {file ? file.name : `Upload ${label}`}
      </span>
      {hint && !file && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </span>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files[0])}
      />
    </label>
  </div>
);

const CreateBookPage = () => {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const isEditMode = Boolean(bookId);

  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    book_username: "",
    password: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(isEditMode);
  const [globalError, setGlobalError] = useState("");
  const [showFileFields, setShowFileFields] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    setBookLoading(true);
    getBook(bookId)
      .then((res) => {
        const data = res.data || {};
        setForm({
          title: data.title || "",
          author: data.author || "",
          description: data.description || "",
          book_username: data.book_username || "",
          password: "",
        });
        // we keep file inputs empty, user can replace if desired
      })
      .catch((err) => {
        console.error("Failed to load book for edit", err);
        setGlobalError("Failed to load book details. Please try again.");
      })
      .finally(() => setBookLoading(false));
  }, [isEditMode, bookId]);

  const handleFieldChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title required";
    if (!form.book_username.trim())
      errs.book_username = "Book username required";
    else if (!/^[a-z0-9_-]+$/.test(form.book_username))
      errs.book_username = "Only lowercase letters, numbers, _ and - allowed";
    if (!form.password.trim() && !isEditMode)
      errs.password = "Access code required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setGlobalError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "password") {
          if (v.trim()) fd.append(k, v);
        } else {
          fd.append(k, v);
        }
      });
      if (pdfFile) fd.append("pdf_file", pdfFile);
      if (coverFile) fd.append("cover_file", coverFile);

      const res = isEditMode
        ? await updateBook(bookId, fd)
        : await createBook(fd);

      navigate(`/book/${res.data.id}`);
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrs = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(fieldErrs);
      } else {
        setGlobalError(
          isEditMode
            ? "Failed to update book. Try again."
            : "Failed to create book. Try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const FileDropzone = ({
    label,
    icon: Icon,
    accept,
    file,
    onChange,
    hint,
  }) => (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <label
        className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl cursor-pointer transition-all hover:opacity-75"
        style={{
          background: "var(--surface-alt)",
          border: `2px dashed ${file ? "var(--success)" : "var(--border)"}`,
        }}
      >
        <Icon
          size={20}
          style={{ color: file ? "var(--success)" : "var(--text-muted)" }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: file ? "var(--success)" : "var(--text-muted)" }}
        >
          {file ? file.name : `Upload ${label}`}
        </span>
        {hint && !file && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {hint}
          </span>
        )}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files[0])}
        />
      </label>
    </div>
  );

  if (isEditMode && bookLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "var(--background)",
          color: "var(--text-primary)",
        }}
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

  return (
    <div
      className="min-h-screen md:pt-16 pb-24 md:pb-10"
      style={{ background: "var(--background)", color: "var(--text-primary)" }}
    >
      {/* Mobile header */}
      <div
        className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:opacity-60"
          style={{ color: "var(--text-primary)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <span
          className="font-semibold text-sm"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          {isEditMode ? "Edit Book" : "New Book"}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Desktop title */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:opacity-60"
            style={{ color: "var(--text-primary)" }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-lora)" }}
          >
            {isEditMode ? "Update Book" : "Add New Book"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            icon={BookOpen}
            label="Title *"
            value={form.title}
            onChange={handleFieldChange("title")}
            placeholder="e.g. The Secret Garden"
            error={errors.title}
          />
          <InputField
            icon={Tag}
            label="Book Username *"
            value={form.book_username}
            onChange={handleFieldChange("book_username")}
            placeholder="e.g. secret-garden-001"
            error={errors.book_username}
          />
          <InputField
            icon={Tag}
            label="Author"
            value={form.author}
            onChange={handleFieldChange("author")}
            placeholder="e.g. Frances Hodgson Burnett"
            error={errors.author}
          />
          <InputField
            icon={FileText}
            label="Description"
            value={form.description}
            onChange={handleFieldChange("description")}
            placeholder="Brief synopsis or notes..."
            textarea
            error={errors.description}
          />
          <InputField
            icon={Lock}
            label={
              isEditMode
                ? "Access Code (Promo Password) — leave blank to keep existing"
                : "Access Code (Promo Password) *"
            }
            value={form.password}
            onChange={handleFieldChange("password")}
            type="password"
            placeholder="Secret code for chat access"
            error={errors.password}
          />

          {/* File uploads */}
          {isEditMode && !showFileFields ? (
            <button
              type="button"
              onClick={() => setShowFileFields(true)}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all hover:bg-(--surface-alt)"
              style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
            >
              Change PDF or Cover Image?
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <FileDropzone
                label="PDF File"
                icon={FileText}
                accept=".pdf"
                file={pdfFile}
                onChange={setPdfFile}
                hint="Supported: .pdf"
              />
              <FileDropzone
                label="Cover Image"
                icon={Image}
                accept="image/*"
                file={coverFile}
                onChange={setCoverFile}
                hint="Supported: .jpg, .png, .webp"
              />
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setShowFileFields(false);
                    setPdfFile(null);
                    setCoverFile(null);
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cancel File Update
                </button>
              )}
            </div>
          )}

          {globalError && (
            <div
              className="p-3 rounded-xl text-xs"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {globalError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:opacity-85 active:scale-95 disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--background)" }}
          >
            <Upload size={16} />
            {loading ? "Publishing..." : "Publish Book"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBookPage;
