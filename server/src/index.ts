import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import db from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Get all customers
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers').all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Helper to format name to Title Case (e.g. "  mOmEn    kAlDi  " -> "Momen Kaldi")
const formatName = (name: string) => {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/) // Split by any whitespace (handles multiple spaces)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Add a customer
app.post('/api/customers', (req, res) => {
  const { name, number, info } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const formattedName = formatName(name);

  try {
    console.log(`Checking duplicate for: "${formattedName}"`);
    // Check for existing name (case-insensitive check)
    const existing = db.prepare('SELECT id FROM customers WHERE LOWER(name) = LOWER(?)').get(formattedName);
    if (existing) {
      console.log('Duplicate found!');
      return res.status(400).json({ error: 'Name already exists!' });
    }

    const stmt = db.prepare('INSERT INTO customers (name, number, info) VALUES (?, ?, ?)');
    const result = stmt.run(formattedName, number, info);
    res.status(201).json({ id: result.lastInsertRowid, name: formattedName, number, info });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Name already exists!' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// Update a customer
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, number, info } = req.body;

  try {
    let formattedName = name ? formatName(name) : undefined;

    if (formattedName) {
      // Check if name is taken by someone else
      const existing = db.prepare('SELECT id FROM customers WHERE LOWER(name) = LOWER(?) AND id != ?').get(formattedName, id);
      if (existing) {
        return res.status(400).json({ error: 'Name already exists!' });
      }
    }

    const stmt = db.prepare('UPDATE customers SET name = COALESCE(?, name), number = COALESCE(?, number), info = COALESCE(?, info) WHERE id = ?');
    const result = stmt.run(formattedName, number, info, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer updated successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Name already exists!' });
    }
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete a customer
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
