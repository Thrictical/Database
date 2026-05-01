import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// --- DATABASE CONFIGURATION ---
// Replace these with your own Supabase project details to share data across devices!
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

interface Customer {
  id: number;
  name: string;
  number: number;
  info: string;
}

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({ name: '', number: '', info: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    if (!supabase) {
      // Fallback to LocalStorage if Supabase isn't configured yet
      const stored = localStorage.getItem('customers');
      setCustomers(stored ? JSON.parse(stored) : []);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching:', err.message);
      setError('Failed to sync with Cloud. Using local data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setError(null);

    const customerData = {
      name: formData.name,
      number: parseInt(formData.number as string) || 0,
      info: formData.info,
    };

    if (!supabase) {
      // LocalStorage Logic
      let updated;
      if (editingId) {
        updated = customers.map(c => c.id === editingId ? { ...c, ...customerData } : c);
      } else {
        if (customers.some(c => c.name.toLowerCase() === customerData.name.toLowerCase())) {
          setError('Name already exists!');
          return;
        }
        updated = [...customers, { ...customerData, id: Date.now() }];
      }
      setCustomers(updated);
      localStorage.setItem('customers', JSON.stringify(updated));
      resetForm();
      return;
    }

    // Supabase Cloud Logic
    try {
      if (editingId) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([customerData]);
        if (error) throw error;
      }
      fetchCustomers();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this record permanently?')) return;

    if (!supabase) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      localStorage.setItem('customers', JSON.stringify(updated));
      setSelectedCustomer(null);
      return;
    }

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      fetchCustomers();
      setSelectedCustomer(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', number: '', info: '' });
    setEditingId(null);
    setSelectedCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      number: customer.number.toString(),
      info: customer.info,
    });
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <header>
        <h1>Member Database</h1>
        <p>{supabase ? '☁️ Cloud Sync Active' : '📱 Local Mode (Setup Cloud below)'}</p>
      </header>

      {!supabase && (
        <div className="setup-notice glass-panel" style={{marginBottom: '2rem', border: '1px solid #6366f1'}}>
          <h3>⚠️ Cloud Sync Not Setup</h3>
          <p>To view members on any device, create a free project at <strong>supabase.com</strong> and add your keys to the project settings.</p>
        </div>
      )}

      <div className="main-content">
        <section className="form-section glass-panel">
          <h2>{editingId ? '📝 Edit Member' : '➕ Add New Member'}</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="number"
                placeholder="e.g. 0790000000"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Member Info / Bio</label>
              <textarea
                placeholder="Additional details..."
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {editingId ? 'Save Changes' : 'Add to Database'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="list-section glass-panel">
          <div className="list-header">
            <div className="stats">
              <h2>Database Registry</h2>
              <span className="count-badge">{filteredCustomers.length} Members</span>
            </div>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                className="search-bar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="table-container">
            {loading ? (
              <div className="no-data">Loading database...</div>
            ) : (
              <table className="member-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Info</th>
                    <th className="actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} onClick={() => setSelectedCustomer(customer)}>
                        <td><strong>{customer.name}</strong></td>
                        <td>{customer.number}</td>
                        <td className="info-cell">{customer.info || '-'}</td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button className="btn-icon edit" onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}>✏️</button>
                            <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="no-data">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedCustomer(null)}>✕</button>
            <div className="modal-details">
              <div className="detail-header">
                <label>Member Record</label>
                <h2>{selectedCustomer.name}</h2>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Phone Number</label>
                  <p>{selectedCustomer.number}</p>
                </div>
                <div className="detail-item full-width">
                  <label>Information</label>
                  <p>{selectedCustomer.info || 'No details recorded.'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => handleEdit(selectedCustomer)}>Edit Record</button>
                <button className="btn-danger" onClick={() => handleDelete(selectedCustomer.id)}>Delete Permanentely</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
