const pool = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');

exports.getAll = async (req, res) => {
  try {
    const { search = '' } = req.query;
    let query = 'SELECT * FROM customers';
    let params = [];
    
    if (search) {
      query += ' WHERE name ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Error fetching customers', 500, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) return error(res, 'Customer not found', 404);
    
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Error fetching customer', 500, err.message);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [id]);
    
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Error fetching customer orders', 500, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, address_json } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, address_json) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, address_json || {}]
    );
    return success(res, result.rows[0], 'Customer created', 201);
  } catch (err) {
    if (err.code === '23505') return error(res, 'Customer with this email already exists', 400);
    return error(res, 'Error creating customer', 500, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address_json } = req.body;
    
    const result = await pool.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3, address_json = $4 WHERE id = $5 RETURNING *',
      [name, email, phone, address_json || {}, id]
    );
    
    if (result.rows.length === 0) return error(res, 'Customer not found', 404);
    
    return success(res, result.rows[0], 'Customer updated');
  } catch (err) {
    if (err.code === '23505') return error(res, 'Customer with this email already exists', 400);
    return error(res, 'Error updating customer', 500, err.message);
  }
};
