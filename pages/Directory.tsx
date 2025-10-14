import React, { useState, useEffect, useMemo } from 'react';
import { DirectoryEntry, StudentDirectoryEntry } from '../types';
import { fetchDirectory, fetchStudentDirectory } from '../services/api';
import { Search, Mail, Phone, Users, GraduationCap, Building2, Download, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';


const Directory = () => {
  const [facultyDirectory, setFacultyDirectory] =  useState<DirectoryEntry[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<StudentDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('faculty');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

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

  // Get unique departments and branches
  const departments = useMemo(() => {
    const depts = [...new Set(facultyDirectory.map(f => f.department))];
    return ['all', ...depts.sort()];
  }, [facultyDirectory]);

  const branches = useMemo(() => {
    const brs = [...new Set(studentDirectory.map(s => s.branch))];
    return ['all', ...brs.sort()];
  }, [studentDirectory]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort faculty
  const filteredFaculty = useMemo(() => {
    let filtered = facultyDirectory.filter(entry =>
      (entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedDepartment === 'all' || entry.department === selectedDepartment)
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [facultyDirectory, searchTerm, selectedDepartment, sortConfig]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let filtered = studentDirectory.filter(entry =>
      (entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.admNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.branch.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedBranch === 'all' || entry.branch === selectedBranch)
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [studentDirectory, searchTerm, selectedBranch, sortConfig]);

  // Export to CSV
  const exportToCSV = () => {
    const data = activeTab === 'faculty' ? filteredFaculty : filteredStudents;
    let csv = '';
    
    if (activeTab === 'faculty') {
      csv = 'Name,Department,Designation,Email,Phone\n';
      data.forEach(entry => {
        csv += `"${entry.name}","${entry.department}","${entry.designation}","${entry.email}","${entry.phone}"\n`;
      });
    } else {
      csv = 'Admission No,Name,Branch,Email\n';
      data.forEach(entry => {
        csv += `"${entry.admNo}","${entry.name}","${entry.branch}","${entry.admNo.toLowerCase()}@iitism.ac.in"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-directory.csv`;
    a.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedBranch('all');
    setSortConfig({ key: null, direction: 'asc' });
  };

  const SortIcon = ({ column }) => {
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

  const activeCount = activeTab === 'faculty' ? filteredFaculty.length : filteredStudents.length;
  const totalCount = activeTab === 'faculty' ? facultyDirectory.length : studentDirectory.length;

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
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
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
                  {facultyDirectory.length}
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
          <div className="p-6 space-y-4">
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                    showFilters
                      ? 'bg-primary text-white border-primary dark:bg-secondary dark:border-secondary'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900 dark:text-white">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-primary-dark dark:text-secondary dark:hover:text-secondary/80 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'faculty' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary"
                      >
                        {departments.map(dept => (
                          <option key={dept} value={dept}>
                            {dept === 'all' ? 'All Departments' : dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary"
                      >
                        {branches.map(branch => (
                          <option key={branch} value={branch}>
                            {branch === 'all' ? 'All Branches' : branch}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Directory Table/Cards */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          {activeCount === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No results found</h3>
              <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or filters</p>
            </div>
          ) : (
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
                    {filteredFaculty.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">{entry.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{entry.department}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{entry.designation}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <a
                              href={`mailto:${entry.email}`}
                              className="flex items-center gap-2 text-primary hover:text-primary-dark dark:text-secondary dark:hover:text-secondary/80 text-sm group"
                            >
                              <Mail className="w-4 h-4" />
                              <span className="group-hover:underline">{entry.email}</span>
                            </a>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                              <Phone className="w-4 h-4" />
                              <span>{entry.phone}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                    {filteredStudents.map(student => (
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
                    ))}
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