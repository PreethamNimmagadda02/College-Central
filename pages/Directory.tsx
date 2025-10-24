import React, { useState, useEffect, useMemo } from 'react';
import { DirectoryEntry, StudentDirectoryEntry } from '../types';
import { fetchDirectory, fetchStudentDirectory } from '../services/api';
import { Search, Mail, Phone, Users, GraduationCap, Building2, Download, X, ChevronDown, ChevronUp } from 'lucide-react';

const isValidIndianPhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string' || !/\d/.test(phone)) {
    // Return false if phone is null, not a string, or contains no digits
    return false;
  }

  // Keep only digits from the string
  const digitsOnly = phone.replace(/\D/g, '');

  // Check for invalid patterns like all same digits
  if (/^(\d)\1{9,}$/.test(digitsOnly)) {
    return false;
  }

  // The number, after stripping non-digits, should be 10 or more digits.
  // This will correctly filter out short extension numbers like '326', '5662'
  // and placeholders like '-'.
  if (digitsOnly.length >= 10) {
    // A 10 digit number is a valid mobile or landline with STD.
    if (digitsOnly.length === 10) return true;
    // An 11 digit number is valid if it starts with 0.
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) return true;
    // A 12 digit number is valid if it starts with 91.
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return true;
  }
  
  return false;
};


const Directory = () => {
  const [facultyDirectory, setFacultyDirectory] =  useState<DirectoryEntry[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<StudentDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('faculty');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showExportMenu, setShowExportMenu] = useState(false);

 useEffect(() => {
        const loadDirectories = async () => {
            try {
                const [facultyData, studentData] = await Promise.all([
                    fetchDirectory(),
                    fetchStudentDirectory()
                ]);
                setFacultyDirectory(facultyData);
                setStudentDirectory(studentData);
            } catch (error) {
                console.error("Failed to load directories", error);
            } finally {
                setLoading(false);
            }
        };
        loadDirectories();
    }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);


  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Group faculty by name first, then filter
  const groupedFaculty = useMemo(() => {
    // First group all faculty by name
    const grouped = new Map<string, DirectoryEntry[]>();
    facultyDirectory.forEach(entry => {
      const existing = grouped.get(entry.name);
      if (existing) {
        if (!existing.some(e => e.id === entry.id)) {
            existing.push(entry);
        }
      } else {
        grouped.set(entry.name, [entry]);
      }
    });

    // Convert to array of groups
    let groupedArray = Array.from(grouped.values());

    // Filter groups based on search term only
    groupedArray = groupedArray.filter(group => {
      // Check if any entry in the group matches the search term
      return group.some(entry =>
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort groups if needed
    if (sortConfig.key) {
      groupedArray.sort((a, b) => {
        const key = sortConfig.key as keyof DirectoryEntry;
        const aValue = a[0][key];
        const bValue = b[0][key];
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return groupedArray;
  }, [facultyDirectory, searchTerm, sortConfig]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let filtered = studentDirectory.filter(entry =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.admNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.branch.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const key = sortConfig.key as keyof StudentDirectoryEntry;
        if (a[key]! < b[key]!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[key]! > b[key]!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [studentDirectory, searchTerm, sortConfig]);

  // Group students by name (for consistency)
  const groupedStudents = useMemo(() => {
    const map = new Map<string, StudentDirectoryEntry[]>();
    filteredStudents.forEach(entry => {
        if (map.has(entry.name)) {
            map.get(entry.name)!.push(entry);
        } else {
            map.set(entry.name, [entry]);
        }
    });
    return Array.from(map.values());
  }, [filteredStudents]);

  // Export to CSV
  const exportToCSV = () => {
    let csv = '';

    if (activeTab === 'faculty') {
      csv = 'Name,Department,Designation,Email,Phone\n';
      groupedFaculty.forEach(group => {
        group.forEach(entry => {
          csv += `"${entry.name}","${entry.department}","${entry.designation}","${entry.email}","${entry.phone}"\n`;
        });
      });
    } else {
      csv = 'Admission No,Name,Branch,Email\n';
      filteredStudents.forEach(entry => {
        csv += `"${entry.admNo}","${entry.name}","${entry.branch}","${entry.admNo.toLowerCase()}@iitism.ac.in"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-directory.csv`;
    a.click();
    setShowExportMenu(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${activeTab === 'faculty' ? 'Faculty & Staff' : 'Student'} Directory - IIT(ISM) Dhanbad</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1e40af; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1e40af; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .header { text-align: center; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${activeTab === 'faculty' ? 'Faculty & Staff' : 'Student'} Directory</h1>
          <p>IIT(ISM) Dhanbad</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
    `;

    if (activeTab === 'faculty') {
      htmlContent += `
        <thead>
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
      `;
      groupedFaculty.forEach(group => {
        group.forEach(entry => {
          htmlContent += `
            <tr>
              <td>${entry.name}</td>
              <td>${entry.department}</td>
              <td>${entry.designation}</td>
              <td>${entry.email}</td>
              <td>${entry.phone}</td>
            </tr>
          `;
        });
      });
    } else {
      htmlContent += `
        <thead>
          <tr>
            <th>Admission No</th>
            <th>Name</th>
            <th>Branch</th>
            <th>Year</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
      `;
      filteredStudents.forEach(entry => {
        htmlContent += `
          <tr>
            <td>${entry.admNo}</td>
            <td>${entry.name}</td>
            <td>${entry.branch}</td>
            <td>${entry.year || '-'}</td>
            <td>${entry.admNo.toLowerCase()}@iitism.ac.in</td>
          </tr>
        `;
      });
    }

    htmlContent += `
        </tbody>
      </table>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} IIT(ISM) Dhanbad. All rights reserved.</p>
      </div>
      </body>
      </html>
    `;

    // Open print dialog which allows saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    setShowExportMenu(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
  };

  const SortIcon: React.FC<{ column: string }> = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading Directories...</p>
        </div>
      </div>
    );
  }

  const searchPlaceholder = activeTab === 'faculty' 
    ? "Search by name, department, designation, or email..." 
    : "Search by name, admission number, or branch...";

  const activeCount = activeTab === 'faculty' ? groupedFaculty.length : groupedStudents.length;
  const totalCount = activeTab === 'faculty' ?
    Array.from(new Map(facultyDirectory.map(e => [e.name, e])).values()).length :
    studentDirectory.length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark dark:from-dark-card dark:to-dark-background rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Campus Directory</h1>
                <p className="text-white/80 mt-1">Find faculty, staff, and students</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90 bg-white/20 px-3 py-1.5 rounded-full">
                {activeCount} of {totalCount} entries
              </span>
            </div>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-xl overflow-hidden">
            <nav className="flex" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('faculty');
                  clearFilters();
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'faculty'
                    ? 'border-primary text-primary dark:text-secondary bg-white dark:bg-dark-card'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Faculty & Staff
                <span className="bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary px-2 py-0.5 rounded-full text-xs font-semibold">
                  {Array.from(new Map(facultyDirectory.map(e => [e.name, e])).values()).length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('student');
                  clearFilters();
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'student'
                    ? 'border-primary text-primary dark:text-secondary bg-white dark:bg-dark-card'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Directory
                <span className="bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary px-2 py-0.5 rounded-full text-xs font-semibold">
                  {studentDirectory.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Search and Filter Controls */}
          <div className="p-6 space-y-4 overflow-visible">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2.5 transition-all duration-300 ${
                      viewMode === 'table'
                        ? 'bg-primary text-white dark:bg-secondary'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    title="Table View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2.5 transition-all duration-300 ${
                      viewMode === 'card'
                        ? 'bg-primary text-white dark:bg-secondary'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    title="Card View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>

                {/* Export Dropdown */}
                <div className="relative export-menu-container">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                    <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Export Menu Dropdown */}
                  {showExportMenu && (
                    <>
                      {/* Backdrop overlay */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div
                        className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                      >
                      <div className="py-1">
                        <button
                          onClick={exportToCSV}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-secondary/10 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-700"
                        >
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <div className="font-medium">CSV</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Spreadsheet format</div>
                          </div>
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-secondary/10 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <div className="font-medium">PDF</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Printable document</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Table/Cards */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          {activeCount === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No results found</h3>
              <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'card' ? (
            /* Card View */
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTab === 'faculty' ? (
                  groupedFaculty.map(group => {
                    const person = group[0];
                    return (
                      <div
                        key={person.id}
                        className="group relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 dark:hover:border-secondary/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                {person.name}
                              </h3>
                            </div>
                            <Building2 className="w-5 h-5 text-slate-400 group-hover:text-primary dark:group-hover:text-secondary transition-colors" />
                          </div>
                          <div className="space-y-3">
                            {group.map((role, index) => (
                              <div key={role.id}>
                                {index > 0 && <hr className="my-3 border-slate-200 dark:border-slate-700" />}
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase w-16 flex-shrink-0">Role:</span>
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{role.designation}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase w-16 flex-shrink-0">Dept:</span>
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{role.department}</span>
                                  </div>
                                  <a href={`mailto:${role.email}`} className="flex items-center gap-2 text-primary hover:text-primary-dark dark:text-secondary dark:hover:text-secondary/80 text-sm group/link">
                                      <Mail className="w-4 h-4 flex-shrink-0" />
                                      <span className="group-hover/link:underline truncate">{role.email}</span>
                                  </a>
                                  {isValidIndianPhoneNumber(role.phone) && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                                      <Phone className="w-4 h-4 flex-shrink-0" />
                                      <span>{role.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  groupedStudents.map(group => {
                    const student = group[0]; // Student data is not expected to have multiple roles.
                    return (
                    <div
                      key={student.id}
                      className="group relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 dark:hover:border-secondary/50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                              {student.name}
                            </h3>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">{student.admNo}</p>
                          </div>
                          <GraduationCap className="w-5 h-5 text-slate-400 group-hover:text-primary dark:group-hover:text-secondary transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Branch:</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{student.branch}</span>
                          </div>
                          {student.year && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Year:</span>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{student.year}</span>
                            </div>
                          )}
                          <a
                            href={`mailto:${student.admNo.toLowerCase()}@iitism.ac.in`}
                            className="flex items-center gap-2 text-primary hover:text-primary-dark dark:text-secondary dark:hover:text-secondary/80 text-sm group/link"
                          >
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="group-hover/link:underline truncate">{student.admNo.toLowerCase()}@iitism.ac.in</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              {activeTab === 'faculty' ? (
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <SortIcon column="name" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('department')}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Department
                          <SortIcon column="department" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('designation')}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Designation
                          <SortIcon column="designation" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {groupedFaculty.map(group => {
                        const person = group[0];
                        const allDepartments = [...new Set(group.map(p => p.department))];
                        const allDesignations = [...new Set(group.map(p => p.designation))];
                        const allEmails = [...new Set(group.map(p => p.email))];
                        const allPhones = [...new Set(group.map(p => p.phone).filter(p => isValidIndianPhoneNumber(p)))];

                        return (
                          <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900 dark:text-white">{person.name}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 space-y-1">
                                {allDepartments.map((d, i) => <div key={i}>{d}</div>)}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 space-y-1">
                                {allDesignations.map((d, i) => <div key={i}>{d}</div>)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {allEmails.map(email => (
                                    <a
                                    key={email}
                                    href={`mailto:${email}`}
                                    className="flex items-center gap-2 text-primary hover:text-primary-dark dark:text-secondary dark:hover:text-secondary/80 text-sm group"
                                  >
                                    <Mail className="w-4 h-4" />
                                    <span className="group-hover:underline">{email}</span>
                                  </a>
                                ))}
                                {allPhones.map(phone => (
                                    <div key={phone} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                                        <Phone className="w-4 h-4" />
                                        <span>{phone}</span>
                                    </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th
                        onClick={() => handleSort('admNo')}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Adm. No.
                          <SortIcon column="admNo" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <SortIcon column="name" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('branch')}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Branch
                          <SortIcon column="branch" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {groupedStudents.map(group => {
                      const student = group[0]; // Students are not expected to have multiple roles
                      return(
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm font-medium text-slate-900 dark:text-white">{student.admNo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">{student.name}</div>
                          {student.year && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{student.year}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.branch}</td>
                        <td className="px-6 py-4">
                          <a
                            href={`mailto:${student.admNo.toLowerCase()}@iitism.ac.in`}
                            className="flex items-center gap-2 text-primary hover:text-primary-dark dark:text-secondary dark:hover:text-secondary/80 text-sm group"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="group-hover:underline">
                              {student.admNo.toLowerCase()}@iitism.ac.in
                            </span>
                          </a>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Directory;