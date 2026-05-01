const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/techmart'
});

async function createAdmin() {
  const name = 'Admin';
  const email = 'admin@techmart.com';
  const password = 'password123';
  const role = 'admin';

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, role]
    );
    console.log('Admin user created with ID:', result.rows[0].id);
  } catch (err) {
    if (err.code === '23505') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating admin user:', err);
    }
  } finally {
    await pool.end();
  }
}

createAdmin();
