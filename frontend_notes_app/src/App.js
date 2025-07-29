import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Environment variable for API base URL (even if it may be empty)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// A simple note structure: {id, title, content, createdAt, updatedAt}
const initialNotes = [];

// PUBLIC_INTERFACE
function App() {
  // State for notes and search/filter
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editNote, setEditNote] = useState(null);

  // Load notes from localStorage or API on mount
  useEffect(() => {
    // Replace with fetch from API if needed. (Here, localStorage for demo)
    const stored = localStorage.getItem("notes");
    if (stored) {
      setNotes(JSON.parse(stored));
    }
  }, []);

  // Save notes to localStorage (simulating API persistence)
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // PUBLIC_INTERFACE
  function handleSave(noteData) {
    if (editNote) {
      // Edit existing note
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editNote.id
            ? { ...n, ...noteData, updatedAt: new Date().toISOString() }
            : n
        )
      );
    } else {
      // Create new note
      setNotes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...noteData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
    setShowEditor(false);
    setEditNote(null);
  }

  // PUBLIC_INTERFACE
  function handleDelete(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editNote && editNote.id === id) {
      setEditNote(null);
      setShowEditor(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleEdit(note) {
    setEditNote(note);
    setShowEditor(true);
  }

  const handleStartNewNote = () => {
    setEditNote(null);
    setShowEditor(true);
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const filteredNotes =
    search.trim().length === 0
      ? notes
      : notes.filter(
          (note) =>
            note.title.toLowerCase().includes(search.toLowerCase()) ||
            note.content.toLowerCase().includes(search.toLowerCase())
        );

  return (
    <div className="notes-root light-theme">
      <Header />
      <main className="main-content">
        <div className="notes-toolbar">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
        {filteredNotes.length === 0 ? (
          <div className="empty-placeholder">
            <p>No notes found.</p>
            <button
              className="action-btn"
              style={{ background: "var(--accent)" }}
              onClick={handleStartNewNote}
            >
              Create your first note
            </button>
          </div>
        ) : (
          <NotesList
            notes={filteredNotes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        <FloatingActionButton onClick={handleStartNewNote} />
        {showEditor && (
          <NoteEditorModal
            onClose={() => {
              setShowEditor(false);
              setEditNote(null);
            }}
            onSave={handleSave}
            initial={editNote}
          />
        )}
      </main>
      <footer className="footer">&copy; {new Date().getFullYear()} Notes App</footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function Header() {
  return (
    <header className="header">
      <h1 className="app-title">Notes App</h1>
    </header>
  );
}

// PUBLIC_INTERFACE
function SearchBar({ value, onChange }) {
  return (
    <input
      className="search-bar"
      type="search"
      value={value}
      onChange={onChange}
      placeholder="Search notes..."
      aria-label="Search notes"
      autoFocus={false}
    />
  );
}

// PUBLIC_INTERFACE
function NotesList({ notes, onEdit, onDelete }) {
  return (
    <div className="notes-list">
      {notes
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map((note) => (
          <NoteCard key={note.id} note={note} onEdit={onEdit} onDelete={onDelete} />
        ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="note-card">
      <h2 className="note-title">{note.title || <i>(Untitled)</i>}</h2>
      <div className="note-content">
        {note.content.length > 160
          ? note.content.slice(0, 160) + "..."
          : note.content}
      </div>
      <div className="note-meta">
        <span>
          Updated: {new Date(note.updatedAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="note-actions">
        <button
          className="action-btn"
          style={{ background: "var(--primary)" }}
          onClick={() => onEdit(note)}
          title="Edit note"
        >
          ✎ Edit
        </button>
        <button
          className="action-btn"
          style={{ background: "var(--secondary)" }}
          onClick={() => onDelete(note.id)}
          title="Delete note"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function FloatingActionButton({ onClick }) {
  return (
    <button className="fab" onClick={onClick} title="Add note" aria-label="Add note">
      +
    </button>
  );
}

// PUBLIC_INTERFACE
function NoteEditorModal({ onClose, onSave, initial }) {
  const [title, setTitle] = useState(initial ? initial.title : "");
  const [content, setContent] = useState(initial ? initial.content : "");
  const [error, setError] = useState("");
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError("Note cannot be empty.");
      return;
    }
    setError("");
    onSave({ title: title.trim(), content: content.trim() });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} tabIndex={-1}>
      <div className="modal" onClick={(e) => e.stopPropagation()} tabIndex={0}>
        <form className="editor-form" onSubmit={handleSubmit}>
          <h2>{initial ? "Edit Note" : "New Note"}</h2>
          <input
            type="text"
            className="editor-title"
            value={title}
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          <textarea
            className="editor-content"
            value={content}
            placeholder="Write your note here..."
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            rows={6}
            ref={contentRef}
          />
          {error && <div className="editor-error">{error}</div>}
          <div className="modal-actions">
            <button
              className="action-btn"
              style={{ background: "var(--primary)" }}
              type="submit"
            >
              Save
            </button>
            <button
              className="action-btn"
              style={{ background: "var(--accent)" }}
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
