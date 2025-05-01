import pool from '../config/database.js';
import * as seniorCitizenIDModel from '../models/seniorCitizenIDModel.js';
import * as updateSeniorCitizenIDModel from '../models/updateSeniorCitizenIDModel.js';


export const getNewSeniorCitizenId = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const seniorCitizenID = await seniorCitizenIDModel.generateSeniorCitizenId(connection);
    
    res.status(200).json({ 
      success: true, 
      seniorCitizenID: seniorCitizenID 
    });
    
  } catch (error) {
    console.error('Error generating Senior Citizen ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating Senior Citizen ID', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const submitSeniorCitizenID = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { scApplicationID } = await seniorCitizenIDModel.generateSeniorCitizenId(connection);

    const applicationData = JSON.parse(req.body.applicationData);
    const populationID = applicationData.personalInfo.populationID;

    console.log('Application ID:', scApplicationID);
    console.log('Population ID:', populationID);

    const photoID = req.files.photoID[0].buffer;
    const base64Data = applicationData.scMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');
    
    console.log("Creating Senior Citizen Application...");
    const { applicantID } = await seniorCitizenIDModel.createSeniorCitizenApplicant(
      scApplicationID, 
      photoID,
      signature,
      connection
    );

    if (populationID) {
      console.log("Updating Personal Info...");
      await seniorCitizenIDModel.updatePopulation(applicantID, populationID, applicationData.personalInfo, connection);
    } else {
      console.log("Inserting New Personal Info...");
      await seniorCitizenIDModel.addPersonalInfo(applicantID, scApplicationID, applicationData.personalInfo, connection);
    }

    console.log("Inserting Family Composition...");
    await seniorCitizenIDModel.addFamilyComposition(scApplicationID, applicationData.familyComposition, connection);

    console.log("Inserting OSCA Info...");
    await seniorCitizenIDModel.addOscaInfo(scApplicationID, applicationData.personalInfo, connection);

    
    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      scApplicationID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting application:', {
      message: error.message,
      stack: error.stack,
      /*requestBody: JSON.stringify(req.body, null, 2)*/
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error submitting application', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};

export const updateSeniorCitizenID = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const applicationData = JSON.parse(req.body.applicationData);
    const scApplicationID = applicationData.personalInfo.seniorCitizenIDNumber;
    console.log('Application ID', scApplicationID);

    let photoID = null;
    let signature = null;

    // Get photoID from files
    if (req.files && req.files.photoID && req.files.photoID.length > 0) {
      photoID = req.files.photoID[0].buffer;
    }

    // Get signature if it exists
    if (applicationData?.scMedia?.signature) {
      const base64Data = applicationData.scMedia.signature.split(';base64,').pop();
      signature = Buffer.from(base64Data, 'base64');
    }
    
    console.log("Updating Senior Citizen Application...");
    await updateSeniorCitizenIDModel.updateSeniorCitizenApplication(
      scApplicationID, 
      photoID,
      signature,
      connection
    );

    console.log("Updating Personal Info...");
    await updateSeniorCitizenIDModel.updatePersonalInfo(applicationData.personalInfo, connection);

    console.log("Updating Family Composition...");
    await updateSeniorCitizenIDModel.updateFamilyComposition(scApplicationID, applicationData.familyComposition, connection);

    console.log("Updating OSCA Info...");
    await updateSeniorCitizenIDModel.updateOscaInfo(scApplicationID, applicationData.personalInfo, connection);
    

    
    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      scApplicationID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting application:', {
      message: error.message,
      stack: error.stack,
      /*requestBody: JSON.stringify(req.body, null, 2)*/
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error submitting application', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};

export const manageSeniorCitizenId = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          sc.scApplicationID,
          sc.applicantID,
          sc.dateApplied,
          pi.populationID,
          pi.firstName,
          pi.middleName,
          pi.lastName,
          pi.suffix
        FROM SeniorCitizenApplication sc
        LEFT JOIN PersonalInformation pi ON sc.applicantID = pi.applicantID
        ORDER BY dateApplied ASC;`);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching Application data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching Application data', 
      error: error.message 
    });
  }
}

export const findID = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    console.log('Finding Person ...');
    console.log('Search params:', req.body);
    
    // Get search parameters from request body
    const { firstName, middleName, lastName, suffix, birthdate, sex } = req.body;
    
    // Validate required parameters
    if (!firstName || !lastName || !sex) {
      return res.status(400).json({
        success: false,
        message: 'Missing required search parameters'
      });
    }

    const [results] = await connection.query(`
      SELECT 
        pi.personalInfoID,
        pi.populationID,
        pi.applicantID,
        pi.seniorCitizenIDNumber,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.suffix,
        pi.birthdate,
        pi.sex,
        pi.age,
        CASE WHEN p.populationID IS NOT NULL THEN TRUE ELSE FALSE END AS existsInPopulation
      FROM PersonalInformation pi
      LEFT JOIN Population p ON pi.populationID = p.populationID
      WHERE pi.firstName LIKE ?
        AND (pi.middleName LIKE ? OR ? = '' OR pi.middleName IS NULL)
        AND pi.lastName LIKE ?
        AND (pi.suffix LIKE ? OR ? = '' OR pi.suffix IS NULL)
        ${birthdate ? 'AND pi.birthdate = ?' : ''}
        AND pi.sex = ?
        AND pi.age >= 60
      ORDER BY 
        CASE WHEN pi.middleName = ? THEN 1 ELSE 2 END,
        CASE WHEN pi.birthdate = ? THEN 1 ELSE 2 END
    `, [
      firstName,
      middleName || '', middleName || '',
      lastName,
      suffix || '', suffix || '',
      ...(birthdate ? [birthdate] : []),
      sex,
      middleName || '',
      birthdate || null
    ]);

    console.log(`Found ${results.length} results`);

    // Format the results
    const population = results.map(person => ({
      personalInfoID: person.personalInfoID,
      populationID: person.populationID,
      applicantID: person.applicantID,
      seniorCitizenIDNumber: person.seniorCitizenIDNumber,
      firstName: person.firstName,
      middleName: person.middleName || 'N/A',
      lastName: person.lastName,
      suffix: person.suffix || 'N/A',
      birthdate: person.birthdate,
      sex: person.sex,
      age: person.age
    }));

    res.status(200).json({ 
      success: true,
      population 
    });

  } catch (error) {
    console.error('Error finding person:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error finding person', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const getPersonDetails = async (req, res) => {

  const connection = await pool.getConnection();
  const populationID = req.params.populationID || req.query.populationID;
  console.log('POPULATION ID:', populationID);

  try {

    console.log('Retrieving Population');
    const [population] = await connection.query(`
      SELECT 
        populationID,
        surveyID
      FROM Population
      WHERE populationID = ?
    `, [populationID]);

    console.log('Retrieving Personal Information');
    const [personalInfo] = await connection.query(`
      SELECT 
          pi.*,
          proi.*,
          ci.*,
          ga.*
      FROM PersonalInformation pi
      LEFT JOIN ProfessionalInformation proi 
          ON pi.populationID = proi.populationID
      LEFT JOIN ContactInformation ci 
          ON pi.populationID = ci.populationID
      LEFT JOIN GovernmentAffiliation ga 
          ON pi.populationID = ga.populationID
      WHERE pi.populationID = ?
    `, [populationID]);

    res.status(200).json({ 
      population,
      personalInfo
    });

  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching survey data', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const deleteApplication = async (req, res) => {

  const connection = await pool.getConnection();
  const scApplicationID = req.params.scApplicationID;
  
  console.log(req.params);

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT applicantID FROM SeniorCitizenApplication WHERE scApplicationID = ?',
      [scApplicationID]
    );
    
    if (rows.length === 0) {
      throw new Error('No application found with the given ID.');
    }
    
    const applicantID = rows[0].applicantID;

    await connection.query('DELETE FROM OscaInformation WHERE scApplicationID = ?', [scApplicationID]);
    await connection.query('DELETE FROM FamilyComposition WHERE scApplicationID = ?', [scApplicationID]);

    await connection.query('DELETE FROM GovernmentIDs WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM PersonalInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM ProfessionalInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM ContactInformation WHERE applicantID = ?', [applicantID]);

    await connection.query('DELETE FROM SeniorCitizenApplication WHERE scApplicationID = ?', [scApplicationID]);
    
    
    await connection.commit();
    
    res.status(200).json({ 
      success: true, 
      message: 'Application deleted successfully' 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting application', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const viewApplication = async (req, res) => {

  const connection = await pool.getConnection();
  const scApplicationID = req.params.scApplicationID || req.query.scApplicationID;

  console.log('SC APPLICATION ID:', scApplicationID);

  try {

    const [applicantRows] = await connection.query(`
      SELECT applicantID FROM SeniorCitizenApplication WHERE scApplicationID = ?
    `, [scApplicationID]);
    
    const applicantID = applicantRows[0]?.applicantID;
    
    if (!applicantID) {
      console.log('[ERROR] No applicantID found for:', scApplicationID);
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    console.log('Retrieving Personal Information');
    const [personalInfo] = await connection.query(`
      SELECT 
        sc.*,
        os.*,
        pi.*,
        proi.*,
        ci.*
      FROM SeniorCitizenApplication sc
      LEFT JOIN OscaInformation os 
          ON sc.scApplicationID = os.scApplicationID
      LEFT JOIN PersonalInformation pi 
          ON sc.applicantID = pi.applicantID
      LEFT JOIN ProfessionalInformation proi 
          ON sc.applicantID = proi.applicantID
      LEFT JOIN ContactInformation ci 
          ON sc.applicantID = ci.applicantID
      WHERE sc.applicantID = ?
    `, [applicantID]);
    console.log('[SUCCESS] Personal Information');

    console.log('Retrieving Family Composition');
    const [familyComposition] = await connection.query(`
      SELECT * FROM FamilyComposition
      WHERE scApplicationID = ?
    `, [scApplicationID]);
    console.log('[SUCCESS] Family Composition');


    console.log('Retrieving Photo ID and Signature');
    const [rows] = await connection.query(`
      SELECT photoID, signature FROM SeniorCitizenApplication
      WHERE scApplicationID = ?
    `, [scApplicationID]);

    const scMedia = rows.map(row => {
      let processedRow = {...row};

      if (row.photoID) {
        processedRow.photoID = `data:image/jpeg;base64,${Buffer.from(row.photoID).toString('base64')}`;
      }

      if (row.signature) {
        processedRow.signature = `data:image/jpeg;base64,${Buffer.from(row.signature).toString('base64')}`;
      }
      
      return processedRow;
    });
    console.log('[SUCCESS] Photo ID and Signature');

    console.log('PERSONAL INFO:', personalInfo);

    res.status(200).json({ 
      personalInfo,
      familyComposition,
      scMedia
    });

  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching survey data', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};