import React from 'react';
import Home from './Home';

export default function NotesPage({ categories = [], onVoiceInput }) {
  return (
    <Home
      categories={categories}
      onVoiceInput={onVoiceInput}
      mode="notes"
    />
  );
}
