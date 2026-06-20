import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Plus, Download, Filter, Search, UserPlus, Edit2, Trash2, PlayCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { EmployeeModal } from '../components/EmployeeModal';
import * as XLSX from 'xlsx';
import styles from './Payroll.module.css';

export function Payroll() {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [payrollStatus, setPayrollStatus] = useState({ lastRunDate: null, nextRunDate: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayrollStatus = async () => {
    try {
      const response = await fetch('/api/employees/payroll-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPayrollStatus(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch payroll status', err);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setEmployees(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmployees();
      fetchPayrollStatus();
    }
  }, [token]);

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee', err);
    }
  };

  const handleRunPayroll = async () => {
    const total = employees.filter(e => e.status === 'Active').reduce((sum, emp) => sum + (emp.salary / 12), 0);
    if (total === 0) {
      alert('No active employees to run payroll for.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to run payroll? This will deduct ${formatCurrency(total)} from your accounts as an expense.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/employees/run-payroll', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Payroll processed successfully! A debit transaction has been recorded.');
        fetchPayrollStatus();
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error('Failed to run payroll', err);
      alert('Failed to connect to the server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    { header: 'Employee', key: 'name', sortable: true },
    { header: 'Role', key: 'role', sortable: true },
    { header: 'Department', key: 'department', sortable: true },
    { 
      header: 'Annual Salary', 
      key: 'salary', 
      sortable: true,
      align: 'right',
      render: (val) => <span className="tabular-nums">{formatCurrency(val)}</span>
    },
    { 
      header: 'Status', 
      key: 'status', 
      sortable: true,
      render: (val) => <Badge variant={val === 'Active' ? 'success' : 'default'}>{val}</Badge>
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, employee) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleEdit(employee)} />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(employee.id)} style={{ color: 'var(--color-red)' }} />
        </div>
      )
    }
  ];

  const handleExportExcel = () => {
    const formattedData = employees.map(e => ({
      Name: e.name,
      Email: e.email,
      Role: e.role,
      Department: e.department,
      'Annual Salary': formatCurrency(e.salary),
      Status: e.status
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'Payroll.xlsx');
  };

  const totalMonthlyPayroll = employees.reduce((sum, emp) => sum + (emp.salary / 12), 0);

  const filteredData = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payroll Management</h1>
          <p className={styles.subtitle}>Manage employee compensation and process runs.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={Download} onClick={handleExportExcel} disabled={isLoading || employees.length === 0}>Export to Excel</Button>
          <Button icon={UserPlus} onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}>Add Employee</Button>
          <Button icon={PlayCircle} onClick={handleRunPayroll} disabled={isProcessing || employees.length === 0} style={{ backgroundColor: 'var(--color-indigo)', color: '#fff', borderColor: 'var(--color-indigo)' }}>
            {isProcessing ? 'Processing...' : 'Run Payroll'}
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <Card>
          <CardContent className={styles.kpiCard}>
            <p className={styles.kpiTitle}>Total Monthly Payroll</p>
            <h2 className={`tabular-nums ${styles.kpiValue}`}>{formatCurrency(totalMonthlyPayroll)}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.kpiCard}>
            <p className={styles.kpiTitle}>Active Employees</p>
            <h2 className={`tabular-nums ${styles.kpiValue}`}>{employees.filter(e => e.status === 'Active').length}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={styles.kpiCard}>
            <p className={styles.kpiTitle}>Next Run Date</p>
            <h2 className={`tabular-nums ${styles.kpiValue}`}>
              {payrollStatus.nextRunDate ? new Date(payrollStatus.nextRunDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
            </h2>
          </CardContent>
        </Card>
      </div>

      <div className={styles.filters} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Input 
          icon={Search} 
          placeholder="Search employees..." 
          containerClassName={styles.searchContainer} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="secondary" icon={Filter}>Department: All</Button>
      </div>

      {isLoading ? (
        <div>Loading payroll data...</div>
      ) : employees.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p>No employees found. Click "Add Employee" to get started.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredData} 
          itemsPerPage={10} 
        />
      )}

      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }} 
        onEmployeeAdded={fetchEmployees}
        initialData={editingEmployee}
      />
    </div>
  );
}

