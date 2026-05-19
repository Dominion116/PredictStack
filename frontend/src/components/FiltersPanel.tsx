'use client';
import React from 'react';

export function FiltersPanel({ filters, onChange }) {
  return (
    <div>
      <select onChange={e => onChange({ ...filters, status: e.target.value })}>
        <option value="">All</option>
        <option>active</option>
        <option>resolved</option>
      </select>
      {/* creator, date range inputs */}
    </div>
  );
}
