import React, { useState, useEffect } from 'react';
import './App.css';

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

  // Check if we should use LocalStorage (always true on GitHub Pages)
  const isLocalStorage = window.location.hostname !== 'localhost';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/customers';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    if (isLocalStorage) {
      const stored = localStorage.getItem('customers');
      if (stored) {
        setCustomers(JSON.parse(stored));
      } else {
        // Initial sample data if empty
        const initial = [
          { id: 1, name: 'Momen Barakat', number: 123456789, info: 'Developer of this app' },
          { id: 2, name: 'Gemini CLI', number: 987654321, info: 'AI Assistant' }
        ];
        setCustomers(initial);
        localStorage.setItem('customers', JSON.stringify(initial));
      }
      return;
    }

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
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

    if (isLocalStorage) {
      let updatedCustomers;
      if (editingId) {
        updatedCustomers = customers.map(c => 
          c.id === editingId ? { ...c, ...customerData } : c
        );
      } else {
        const newCustomer = {
          ...customerData,
          id: Date.now(), // Simple unique ID
        };
        // Check duplicate
        if (customers.some(c => c.name.toLowerCase() === customerData.name.toLowerCase())) {
          setError('Name already exists!');
          return;
        }
        updatedCustomers = [...customers, newCustomer];
      }
      
      setCustomers(updatedCustomers);
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setFormData({ name: '', number: '', info: '' });
      setEditingId(null);
      setSelectedCustomer(null);
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        setFormData({ name: '', number: '', info: '' });
        setEditingId(null);
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Something went wrong');
      }
    } catch (error) {
      setError('Connection failed. Is the server running?');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      number: customer.number.toString(),
      info: customer.info,
    });
    setSelectedCustomer(null); // Close modal when editing
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    if (isLocalStorage) {
      const updatedCustomers = customers.filter(c => c.id !== id);
      setCustomers(updatedCustomers);
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setSelectedCustomer(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCustomers();
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <header>
        <h1>Member Database</h1>
        <p>Manage, track, and update member records in real-time</p>
      </header>

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
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (error) setError(null);
                }}
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
                placeholder="Additional details about the member..."
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Save Changes' : 'Add to Database'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', number: '', info: '' });
                  }}
                >
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
                placeholder="Search database..."
                className="search-bar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="table-container">
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
                          <button 
                            className="btn-icon edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(customer.id);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="no-data">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Detail Modal */}
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
                  <label>Background Information</label>
                  <p>{selectedCustomer.info || 'No additional details recorded for this member.'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-primary"
                  onClick={() => handleEdit(selectedCustomer)}
                >
                  Edit Record
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDelete(selectedCustomer.id)}
                >
                  Delete Permanentely
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
