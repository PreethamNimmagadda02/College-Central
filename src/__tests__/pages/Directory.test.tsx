
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Directory from '../../pages/Directory';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock contexts and hooks
vi.mock('../../contexts/AppConfigContext', () => ({
  useAppConfig: vi.fn(),
}));

// Mock firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

// Mock AppConfigContext module
vi.mock('@contexts/AppConfigContext', () => ({
  useAppConfig: vi.fn(),
}));

// Mock types if needed (usually checking imports)

describe('Directory Page', () => {
  const mockFaculty = [
    { id: '1', name: 'John Doe', department: 'CS', designation: 'Prof', email: 'john@example.com', phone: '1234567890' },
    { id: '2', name: 'Jane Smith', department: 'EE', designation: 'Assoc Prof', email: 'jane@example.com', phone: '0987654321' },
    { id: '3', name: 'John Doe', department: 'Math', designation: 'Lecturer', email: 'john.math@example.com', phone: '1122334455' }, // Same name, should be grouped
  ];

  const mockStudents = [
    { id: 's1', admNo: '20JE001', name: 'Student One', branch: 'CS' },
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock return
    // @ts-ignore
    useAppConfig.mockReturnValue({
      config: {
        directory: mockFaculty,
        students: mockStudents,
      },
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders faculty directory by default', () => {
    render(
      <BrowserRouter>
        <Directory />
      </BrowserRouter>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('CS')).toBeInTheDocument();
  });

  it('groups faculty by name', () => {
    render(
      <BrowserRouter>
        <Directory />
      </BrowserRouter>
    );
    // "John Doe" appears twice in data but should appear once in the list (grouped)
    // We can verify this by checking the number of rows or cards, but simply checking if roles are present is a good proxy.
    expect(screen.getByText('Prof')).toBeInTheDocument();
    expect(screen.getByText('Lecturer')).toBeInTheDocument();

    // Check that we don't have duplicate names if we look closely,
    // but React Testing Library getByText might return multiple elements if displayed multiple times.
    // In table view (default), name is displayed once per group row.
    const johnDoes = screen.getAllByText('John Doe');
    expect(johnDoes.length).toBe(1);
  });

  it('filters faculty by search term', () => {
    render(
      <BrowserRouter>
        <Directory />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters faculty by search term (grouped)', () => {
     render(
      <BrowserRouter>
        <Directory />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Math' } }); // Searches department

    // Should show John Doe because one of his roles is in Math
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
