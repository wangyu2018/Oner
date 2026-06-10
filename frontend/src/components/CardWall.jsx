import React from 'react';
import NoteCard from './NoteCard';

export default function CardWall({ notes, onNoteClick, onDelete, onTagClick }) {
  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={onNoteClick}
          onDelete={onDelete}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
