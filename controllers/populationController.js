import pool from '../config/database.js';



export const managePopulation = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          ROW_NUMBER() OVER (ORDER BY p.populationID) AS 'ID',
          p.populationID AS 'Population ID',
          CONCAT_WS(' ', pi.lastName, pi.firstName, pi.middleName, pi.suffix) AS 'Name',
          pi.birthdate AS 'Birthdate',
          pi.age AS 'Age',
          pi.civilStatus AS 'Civil Status',
          pi.relationToFamilyHead AS 'Relationship to Family Head',
          prof.educationalAttainment AS 'Educational Attainment',
          prof.occupation AS 'Occupation',
          prof.skills AS 'Skills',
          prof.employmentType AS 'Employment Type',
          gi.philhealthNumber AS 'Philhealth Number',
          prof.monthlyIncome AS 'Monthly Income',
          p.healthStatus AS 'Health Status',
          p.remarks AS 'Remarks',
          pi.pwdIDNumber AS 'PWD ID',
          pi.soloParentIDNumber AS 'Solo Parent ID',
          pi.seniorCitizenIDNumber AS 'Senior Citizen ID'
      FROM Population p
      LEFT JOIN PersonalInformation pi ON p.populationID = pi.populationID
      LEFT JOIN ProfessionalInformation prof ON p.populationID = prof.populationID
      LEFT JOIN GovernmentIDs gi ON p.populationID = gi.populationID
      ORDER BY p.populationID ASC;
  `);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching population:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching population', 
      error: error.message 
    });
  }
}