import React from 'react';
import * as XLSX from 'xlsx';

import { AdminStudentEntry } from '../types';
import { admissionYear } from '../utils';
import ExcelUploader, { pickColumn } from './ExcelUploader';

type Student = Omit<AdminStudentEntry, 'id'>;

interface Props {
  onImport: (students: Student[]) => void;
  onClose: () => void;
}

const parseStudents = (sheet: XLSX.WorkSheet): Student[] => {
  const students = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet).flatMap((row) => {
    const admNo = pickColumn(row, [
      'admNo',
      'adm_no',
      'admission_no',
      'rollNo',
      'roll_no',
      'Adm No',
      'Admission No',
      'Roll No',
      'ID',
    ]).toUpperCase();
    const name = pickColumn(row, [
      'name',
      'studentName',
      'student_name',
      'Name',
      'Student Name',
    ]).toUpperCase();
    if (!admNo || !name) return [];
    const branch = pickColumn(row, ['branch', 'department', 'Branch', 'Department', 'Program']);
    return [{ admNo, name, branch: branch.toUpperCase() || 'UNKNOWN' }];
  });

  if (students.length === 0) {
    throw new Error(
      'No valid students found. Make sure your Excel has columns: Adm No, Name, Branch'
    );
  }
  return students;
};

const StudentUploader: React.FC<Props> = ({ onImport, onClose }) => (
  <ExcelUploader
    title="Upload Student Directory"
    subtitle="Import students from Excel file"
    dropHint="Drag & drop your Excel file"
    accent="emerald"
    format={{
      columns: ['Adm No', 'Name', 'Branch'],
      example: ['23JE0653', 'NIMMAGADDA PREETHAM', 'ELECTRONICS AND COMMUNICATION ENGINEERING'],
    }}
    parse={parseStudents}
    noun="students"
    summary={(students) =>
      `${new Set(students.map((s) => s.branch)).size} branches • ${
        new Set(students.map((s) => admissionYear(s.admNo)).filter(Boolean)).size
      } batch years`
    }
    columns={[
      {
        label: 'Adm No',
        className: 'font-mono text-gray-900 dark:text-white',
        render: (s) => s.admNo,
      },
      { label: 'Name', className: 'text-gray-700 dark:text-gray-300', render: (s) => s.name },
      {
        label: 'Branch',
        className: 'text-gray-500 dark:text-gray-400 truncate max-w-[200px]',
        render: (s) => s.branch,
      },
    ]}
    onImport={onImport}
    onClose={onClose}
  />
);

export default StudentUploader;
