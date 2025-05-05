import pool from '../config/database.js';

export const getTotal = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Surveys) AS totalSurveys,
        (SELECT COUNT(*) FROM Population) AS totalPopulation,
        COUNT(CASE WHEN sex = 'Male' AND populationID IS NOT NULL THEN 1 END) AS totalMale,
        COUNT(CASE WHEN sex = 'Female' AND populationID IS NOT NULL THEN 1 END) AS totalFemale,
        COUNT(CASE WHEN isPWD = TRUE AND populationID IS NOT NULL THEN 1 END) AS totalPWD,
        COUNT(CASE WHEN isSoloParent = TRUE AND populationID IS NOT NULL THEN 1 END) AS totalSoloParent,
        COUNT(CASE WHEN age BETWEEN 15 AND 30 AND populationID IS NOT NULL THEN 1 END) AS totalYouth
      FROM PersonalInformation;
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
        COUNT(DISTINCT s.surveyID) AS Surveys,
        COUNT(DISTINCT p.populationID) AS Population,
        COUNT(DISTINCT pi.personalInfoID) AS totalPersonalInfo,
        SUM(CASE WHEN pi.sex = 'Male' THEN 1 ELSE 0 END) AS Men,
        SUM(CASE WHEN pi.sex = 'Female' THEN 1 ELSE 0 END) AS Women,
        SUM(CASE WHEN pi.isPWD = TRUE THEN 1 ELSE 0 END) AS PWD,
        SUM(CASE WHEN pi.isSoloParent = TRUE THEN 1 ELSE 0 END) AS SoloParent,
        SUM(CASE WHEN pi.age BETWEEN 15 AND 30 THEN 1 ELSE 0 END) AS Youth
      FROM Surveys s
      LEFT JOIN Population p ON s.surveyID = p.surveyID
      LEFT JOIN PersonalInformation pi ON p.populationID = pi.populationID
      GROUP BY s.barangay
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching barangay stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
