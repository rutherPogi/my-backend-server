import pool from '../config/database.js';


// Get all house pins
export const getCoordinates = async (req, res) => {
  try {
    const [houseInfo] = await pool.query(`SELECT * FROM HouseInformation`);

    res.status(200).json(houseInfo);
  } catch (error) {
    console.error('Error getting House Information:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getImages = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM HouseImage`);

    const houseImages = rows.map(row => {
      let processedRow = {...row};

      if (row.houseImage) {
        processedRow.houseImage = `data:image/jpeg;base64,${Buffer.from(row.houseImage).toString('base64')}`;
      }
      
      return processedRow;
    });

    res.status(200).json(houseImages);
  } catch (error) {
    console.error('Error getting House Image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHousehold = async (req, res) => {
  try {
    const [household] = await pool.query(`
      SELECT 
        pi.populationID, 
        pi.firstName, 
        pi.middleName, 
        pi.lastName, 
        pi.suffix,
        pi.relationToFamilyHead,
        pop.surveyID
      FROM PersonalInformation pi
      JOIN Population pop 
        ON pi.populationID = pop.populationID`);

    res.status(200).json(household);
  } catch (error) {
    console.error('Error getting Household:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHazardAreas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hazard_areas');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching hazard areas:', error);
    res.status(500).json({ error: 'Failed to fetch hazard areas' });
  }

};


export const postHazardAreas = async (req, res) => {
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
};

export const putHazardAreas = async (req, res) => {
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
};

export const deleteHazardAreas = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM hazard_areas WHERE hazardAreaID = ?', [id]);
    
    res.json({ message: 'Hazard area deleted successfully' });
  } catch (error) {
    console.error('Error deleting hazard area:', error);
    res.status(500).json({ error: 'Failed to delete hazard area' });
  }
};




