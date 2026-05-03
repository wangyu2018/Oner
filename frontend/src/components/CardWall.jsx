import React from 'react';
import NoteCard from './NoteCard';

export default function CardWall({ notes, onNoteClick, onDelete, onTagClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
