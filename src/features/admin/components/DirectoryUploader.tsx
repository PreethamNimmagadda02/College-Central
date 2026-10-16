import React from 'react';
import * as XLSX from 'xlsx';

import { AdminDirectoryEntry } from '../types';
import ExcelUploader, { pickColumn } from './ExcelUploader';

type Entry = Omit<AdminDirectoryEntry, 'id'>;

interface Props {
  onImport: (entries: Entry[]) => void;
  onClose: () => void;
}

const parseFaculty = (sheet: XLSX.WorkSheet): Entry[] => {
  const entries = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet).flatMap((row) => {
    const name = pickColumn(row, [
      'name',
      'facultyName',
      'faculty_name',
      'Name',
      'Faculty Name',
      'Full Name',
    ]);
    if (!name) return [];
    return [
      {
        name,
        department: pickColumn(row, ['department', 'dept', 'Department', 'Dept']) || 'UNKNOWN',
        designation: pickColumn(row, [
          'designation',
          'title',
          'position',
          'Designation',
          'Title',
          'Position',
        ]),
        email: pickColumn(row, [
          'email',
          'emailId',
          'email_id',
          'Email',
          'Email ID',
          'E-mail',
        ]).toLowerCase(),
        phone: pickColumn(row, ['phone', 'mobile', 'contact', 'Phone', 'Mobile', 'Contact']),
      },
    ];
  });

  if (entries.length === 0) {
    throw new Error(
      'No valid faculty entries found. Make sure your Excel has columns: Name, Department, Designation, Email, Phone'
    );
  }
  return entries;
};

const DirectoryUploader: React.FC<Props> = ({ onImport, onClose }) => (
  <ExcelUploader
    title="Upload Faculty Directory"
    subtitle="Import faculty from Excel file"
    dropHint="Drag & drop your Excel file"
    accent="indigo"
    format={{
      columns: ['Name', 'Department', 'Designation', 'Email', 'Phone'],
      example: [
        'Dr. John Doe',
        'Computer Science',
        'Professor',
        'john@example.edu',
        '+91-XXX-XXX-XXXX',
      ],
    }}
    parse={parseFaculty}
    noun="entries"
    summary={(entries) =>
      `${new Set(entries.map((e) => e.department)).size} departments • ${
        entries.filter((e) => e.email).length
      } with email`
    }
    columns={[
      { label: 'Name', className: 'text-gray-900 dark:text-white', render: (e) => e.name },
      {
        label: 'Department',
        className: 'text-gray-500 dark:text-gray-400 truncate max-w-[150px]',
        render: (e) => e.department,
      },
      { label: 'Designation', className: 'text-blue-500', render: (e) => e.designation },
      {
        label: 'Email',
        className: 'text-gray-500 dark:text-gray-400 truncate max-w-[180px]',
        render: (e) => e.email || '-',
      },
    ]}
    onImport={onImport}
    onClose={onClose}
  />
);

export default DirectoryUploader;
