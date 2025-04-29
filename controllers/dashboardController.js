import pool from '../config/database.js';

export const getTotal = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Surveys) AS TotalSurvey,
        (SELECT COUNT(*) FROM Population) AS TotalPopulation,
        (SELECT COUNT(*) FROM HouseInformation) AS HouseRegistered,
        (SELECT COUNT(*) FROM pwdApplication) AS TotalPWDApplication,
        (SELECT COUNT(*) FROM soloParentApplication) AS TotalSPApplication,
        (SELECT COUNT(*) FROM seniorCitizenApplication) AS TotalSCApplication
      `);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBarangayStats = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.barangay,
        COUNT(*) AS totalSurveys,
        COUNT(p.populationID) AS totalPopulation
      FROM Surveys s
      LEFT JOIN Population p ON s.surveyID = p.surveyID
      GROUP BY s.barangay
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching barangay stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};