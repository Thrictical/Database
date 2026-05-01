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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/customers';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
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

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          number: parseInt(formData.number as string) || 0,
        }),
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
        <h1>Contact Directory</h1>
        <p>A simple and efficient way to manage your contact list</p>
      </header>

      <div className="main-content">
        <section className="form-section glass-panel">
          <h2>{editingId ? '✨ Edit Member' : '🚀 New Member'}</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
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
                placeholder="Enter phone number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Bio / Notes</label>
              <textarea
                placeholder="What defines this person?"
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Record' : 'Create Record'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                style={{marginTop: '0.5rem'}}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', number: '', info: '' });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="list-section">
          <div className="list-header">
            <h2>Registry ({filteredCustomers.length})</h2>
            <input
              type="text"
              placeholder="Search..."
              className="search-bar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="customer-grid">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="customer-card"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="card-info">
                    <h3>{customer.name}</h3>
                    <p className="phone">📱 {customer.number}</p>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn-edit-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer.id);
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No records match your search.</div>
            )}
          </div>
        </section>
      </div>

      {/* Customer Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedCustomer(null)}>✕</button>
            <div className="modal-details">
              <div className="detail-row">
                <label>Name</label>
                <h2>{selectedCustomer.name}</h2>
              </div>
              <div className="detail-row">
                <label>Phone</label>
                <p>+ {selectedCustomer.number}</p>
              </div>
              <div className="detail-row">
                <label>Information</label>
                <p>{selectedCustomer.info || 'No additional information provided.'}</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-edit-large"
                  onClick={() => handleEdit(selectedCustomer)}
                >
                  Edit Details
                </button>
                <button 
                  className="btn-delete-large"
                  onClick={() => handleDelete(selectedCustomer.id)}
                >
                  Delete
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
