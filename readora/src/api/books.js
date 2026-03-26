import api from "./axios";

export const getBooks = (search = "") =>
  api.get(`/books/${search ? `?search=${search}` : ""}`);

export const getBook = (id) => api.get(`/books/${id}/`);
export const getUserBooks = () => api.get("/books/user/");

export const createBook = (data) =>
  api.post("/books/create/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateBook = (bookId, data) =>
  api.put(`/books/${bookId}/update/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteBook = (bookId) => api.delete(`/books/${bookId}/delete/`);

export const verifyPassword = (bookId, password) =>
  api.post(`/books/${bookId}/verify/`, { password });

export const toggleBookmark = (bookId) =>
  api.post(`/books/${bookId}/bookmark/`);

export const getBookmarks = () => api.get("/auth/bookmarks/");
