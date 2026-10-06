import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LibraryView } from '../features/library/LibraryView';
import { TimelineView } from '../features/timeline/TimelineView';
import { PeopleView } from '../features/people/PeopleView';
import { FavoritesView } from '../features/favorites/FavoritesView';
import { SettingsView } from '../features/settings/SettingsView';

export function AppRoutes({ searchQuery, setSearchQuery, onOpenNote, onOpenTag, onOpenDelete }) {
  return (
    <Routes>
      <Route
        path="/"
        element={<AppShell searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      >
        <Route
          index
          element={
            <LibraryView
              searchQuery={searchQuery}
              onOpenNote={onOpenNote}
              onOpenTag={onOpenTag}
              onOpenDelete={onOpenDelete}
            />
          }
        />
        <Route
          path="timeline"
          element={
            <TimelineView
              onOpenNote={onOpenNote}
              onOpenTag={onOpenTag}
              onOpenDelete={onOpenDelete}
            />
          }
        />
        <Route
          path="people"
          element={
            <PeopleView
              onOpenNote={onOpenNote}
              onOpenTag={onOpenTag}
              onOpenDelete={onOpenDelete}
            />
          }
        />
        <Route
          path="favorites"
          element={
            <FavoritesView
              onOpenNote={onOpenNote}
              onOpenTag={onOpenTag}
              onOpenDelete={onOpenDelete}
            />
          }
        />
        <Route path="settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
