const pool = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Error fetching categories', 500, err.message);
  }
};

exports.getTree = async (req, res) => {
  try {
    // Basic recursive CTE to get category tree could be used, or just fetching all and assembling in JS.
    // For simplicity and speed for a reasonably sized category tree, we assemble in memory.
    const result = await pool.query('SELECT * FROM categories');
    const categories = result.rows;
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(c => c.parent_id === parentId)
        .map(c => ({ ...c, children: buildTree(c.id) }));
    };

    const tree = buildTree(null);
    return success(res, tree);
  } catch (err) {
    return error(res, 'Error building category tree', 500, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING *',
      [name, parent_id || null]
    );
    return success(res, result.rows[0], 'Category created', 201);
  } catch (err) {
    return error(res, 'Error creating category', 500, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;
    
    if (id === parent_id) return error(res, 'A category cannot be its own parent', 400);

    const result = await pool.query(
      'UPDATE categories SET name = $1, parent_id = $2 WHERE id = $3 RETURNING *',
      [name, parent_id || null, id]
    );
    
    if (result.rows.length === 0) return error(res, 'Category not found', 404);
    
    return success(res, result.rows[0], 'Category updated');
  } catch (err) {
    return error(res, 'Error updating category', 500, err.message);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) return error(res, 'Category not found', 404);
    
    return success(res, { id }, 'Category deleted');
  } catch (err) {
    if (err.code === '23503') { // foreign_key_violation
      return error(res, 'Cannot delete category because it contains products or sub-categories', 400);
    }
    return error(res, 'Error deleting category', 500, err.message);
  }
};
