const pool = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');

const generateSKU = () => 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase();

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
      countQuery += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND category_id = $${params.length}`;
      countQuery += ` AND category_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
      countQuery += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const [result, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);

    return success(res, {
      products: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, 'Error fetching products', 500, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) return error(res, 'Product not found', 404);
    
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Error fetching product', 500, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category_id, price, cost_price, stock_quantity, images, status, sku } = req.body;
    const finalSku = sku || generateSKU();
    
    const result = await pool.query(
      `INSERT INTO products (name, sku, category_id, price, cost_price, stock_quantity, images, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, finalSku, category_id || null, price, cost_price, stock_quantity || 0, JSON.stringify(images || []), status || 'draft']
    );
    return success(res, result.rows[0], 'Product created', 201);
  } catch (err) {
    if (err.code === '23505') return error(res, 'Product with this SKU already exists', 400);
    return error(res, 'Error creating product', 500, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, price, cost_price, stock_quantity, images, status } = req.body;
    
    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           price = COALESCE($3, price), 
           cost_price = COALESCE($4, cost_price), 
           stock_quantity = COALESCE($5, stock_quantity), 
           images = COALESCE($6, images), 
           status = COALESCE($7, status) 
       WHERE id = $8 RETURNING *`,
      [name, category_id, price, cost_price, stock_quantity, images ? JSON.stringify(images) : null, status, id]
    );
    
    if (result.rows.length === 0) return error(res, 'Product not found', 404);
    
    return success(res, result.rows[0], 'Product updated');
  } catch (err) {
    return error(res, 'Error updating product', 500, err.message);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE products SET status = 'archived' WHERE id = $1 RETURNING id",
      [id]
    );
    
    if (result.rows.length === 0) return error(res, 'Product not found', 404);
    
    return success(res, { id }, 'Product archived');
  } catch (err) {
    return error(res, 'Error deleting product', 500, err.message);
  }
};

exports.importExternal = async (req, res) => {
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    const fakeProducts = await response.json();
    
    let imported = 0;
    for (const fp of fakeProducts) {
      const sku = 'FS-' + fp.id;
      // Skip if SKU exists
      const exists = await pool.query('SELECT id FROM products WHERE sku = $1', [sku]);
      if (exists.rows.length > 0) continue;
      
      await pool.query(
        `INSERT INTO products (name, sku, price, cost_price, stock_quantity, images, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [fp.title, sku, fp.price, fp.price * 0.7, 50, JSON.stringify([fp.image]), 'active']
      );
      imported++;
    }
    
    return success(res, { imported }, `Successfully imported ${imported} products`);
  } catch (err) {
    return error(res, 'Error importing products', 500, err.message);
  }
};

exports.updateStock = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { change_type, delta, note } = req.body;
    
    if (!['restock', 'sale', 'adjustment'].includes(change_type)) {
      throw new Error('Invalid change_type');
    }

    const prodRes = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) throw new Error('Product not found');
    
    const newStock = prodRes.rows[0].stock_quantity + parseInt(delta);
    if (newStock < 0) throw new Error('Stock cannot be negative');

    const result = await client.query(
      'UPDATE products SET stock_quantity = $1 WHERE id = $2 RETURNING *',
      [newStock, id]
    );

    await client.query(
      'INSERT INTO inventory_logs (product_id, change_type, delta, note) VALUES ($1, $2, $3, $4)',
      [id, change_type, delta, note || '']
    );

    await client.query('COMMIT');
    return success(res, result.rows[0], 'Stock updated');
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message, 400);
  } finally {
    client.release();
  }
};
