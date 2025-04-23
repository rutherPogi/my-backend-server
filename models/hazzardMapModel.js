// GET /hazardMap/hazardAreas - Get all hazard areas
app.get('/hazardMap/hazardAreas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hazard_areas');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching hazard areas:', error);
    res.status(500).json({ error: 'Failed to fetch hazard areas' });
  }
});

// POST /hazardMap/hazardAreas - Create a new hazard area
app.post('/hazardMap/hazardAreas', async (req, res) => {
  try {
    const { latitude, longitude, radius, hazardType, description } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO hazard_areas (latitude, longitude, radius, hazardType, description) VALUES (?, ?, ?, ?, ?)',
      [latitude, longitude, radius, hazardType, description]
    );
    
    res.status(201).json({ 
      message: 'Hazard area created successfully',
      hazardAreaID: result.insertId 
    });
  } catch (error) {
    console.error('Error creating hazard area:', error);
    res.status(500).json({ error: 'Failed to create hazard area' });
  }
});

// PUT /hazardMap/hazardAreas/:id - Update an existing hazard area
app.put('/hazardMap/hazardAreas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, radius, hazardType, description } = req.body;
    
    await pool.query(
      'UPDATE hazard_areas SET latitude = ?, longitude = ?, radius = ?, hazardType = ?, description = ? WHERE hazardAreaID = ?',
      [latitude, longitude, radius, hazardType, description, id]
    );
    
    res.json({ message: 'Hazard area updated successfully' });
  } catch (error) {
    console.error('Error updating hazard area:', error);
    res.status(500).json({ error: 'Failed to update hazard area' });
  }
});

// DELETE /hazardMap/hazardAreas/:id - Delete a hazard area
app.delete('/hazardMap/hazardAreas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM hazard_areas WHERE hazardAreaID = ?', [id]);
    
    res.json({ message: 'Hazard area deleted successfully' });
  } catch (error) {
    console.error('Error deleting hazard area:', error);
    res.status(500).json({ error: 'Failed to delete hazard area' });
  }
});