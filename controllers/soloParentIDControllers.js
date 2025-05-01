import pool from '../config/database.js';
import * as soloParentIDModel from '../models/soloParentIDModel.js';
import * as updateSoloParentIDModel from '../models/updateSoloParentIDModel.js';


export const getNewSoloParentId = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {
    const soloParentID = await soloParentIDModel.generateSoloParentId(connection);
    
    res.status(200).json({ 
      success: true, 
      soloParentID: soloParentID 
    });
    
  } catch (error) {
    console.error('Error generating Solo Parent ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating Solo Parent ID', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const submitSoloParentID = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { spApplicationID } = await soloParentIDModel.generateSoloParentId(connection);
    
    const applicationData = JSON.parse(req.body.applicationData);
    const populationID = applicationData.personalInfo.populationID;

    console.log('Application ID:', spApplicationID);
    console.log('Population ID:', populationID);

    const photoID = req.files.photoID[0].buffer;
    const base64Data = applicationData.spMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');

    console.log("Creating Solo Parent Application...");
    const { applicantID } = await soloParentIDModel.createSoloParentApplicant(
      spApplicationID, 
      photoID,
      signature,
      connection
    );

    if(populationID) {
      console.log("Updating Population...");
      await soloParentIDModel.updatePopulation(applicantID, populationID, applicationData.personalInfo, connection);
    } else {
      console.log("Inserting Personal Info...");
      await soloParentIDModel.addPersonalInfo(applicantID, spApplicationID, applicationData.personalInfo, connection);
    }
    
    console.log("Inserting Other Info...");
    await soloParentIDModel.addOtherInfo(spApplicationID, applicationData.personalInfo, connection);

    console.log("Inserting Household Composition...");
    await soloParentIDModel.addHouseholdComposition(spApplicationID, applicationData.householdComposition, connection);

    console.log("Inserting Problem/Needs...");
    await soloParentIDModel.addProblemNeeds(spApplicationID, applicationData.problemNeeds, connection);

    console.log("Inserting Emergency Contact...");
    await soloParentIDModel.addEmergencyContact(spApplicationID, applicationData.emergencyContact, connection);

    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      spApplicationID 
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

export const updateSoloParentID = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const applicationData = JSON.parse(req.body.applicationData);
    const spApplicationID = applicationData.personalInfo.soloParentIDNumber;
    console.log('Application ID', spApplicationID);

    let photoID = null;
    let signature = null;

    // Get photoID from files
    if (req.files && req.files.photoID && req.files.photoID.length > 0) {
      photoID = req.files.photoID[0].buffer;
    }

    // Get signature if it exists
    if (applicationData?.spMedia?.signature) {
      const base64Data = applicationData.spMedia.signature.split(';base64,').pop();
      signature = Buffer.from(base64Data, 'base64');
    }

    console.log("Updating Solo Parent Application...");
    await updateSoloParentIDModel.updateSoloParentApplicant(
      spApplicationID, 
      photoID,
      signature,
      connection
    );

    console.log("Updating Personal Info...");
    await updateSoloParentIDModel.updatePersonalInfo(applicationData.personalInfo, connection);

    console.log("Updating Other Info...");
    await updateSoloParentIDModel.updateOtherInfo(spApplicationID, applicationData.personalInfo, connection);

    console.log("Updating Household Composition");
    await updateSoloParentIDModel.updateHouseholdComposition(spApplicationID, applicationData.householdComposition, connection);

    console.log("Updating Problem/Needs");
    await updateSoloParentIDModel.updateProblemNeeds(spApplicationID, applicationData.problemNeeds, connection);

    console.log("Updating Emergency Contact");
    await updateSoloParentIDModel.updateEmergencyContact(spApplicationID, applicationData.emergencyContact, connection);

    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application updated successfully', 
      spApplicationID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating application:', {
      message: error.message,
      stack: error.stack,
      /*requestBody: JSON.stringify(req.body, null, 2)*/
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error updating application', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};

export const manageSoloParentId = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          sp.spApplicationID,
          sp.applicantID,
          sp.dateApplied,
          pi.populationID,
          pi.firstName,
          pi.middleName,
          pi.lastName,
          pi.suffix
        FROM SoloParentApplication sp
        LEFT JOIN PersonalInformation pi ON sp.applicantID = pi.applicantID
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
    console.log('Finding Person (Solo Parent) ...');
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
        pi.soloParentIDNumber,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.suffix,
        pi.birthdate,
        pi.sex,
        pi.isSoloParent,
        CASE WHEN p.populationID IS NOT NULL THEN TRUE ELSE FALSE END AS existsInPopulation
      FROM PersonalInformation pi
      LEFT JOIN Population p ON pi.populationID = p.populationID
      WHERE pi.firstName LIKE ?
        AND (pi.middleName LIKE ? OR ? = '' OR pi.middleName IS NULL)
        AND pi.lastName LIKE ?
        AND (pi.suffix LIKE ? OR ? = '' OR pi.suffix IS NULL)
        ${birthdate ? 'AND pi.birthdate = ?' : ''}
        AND pi.sex = ?
        AND pi.isSoloParent = TRUE
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
      pwdIDNumber: person.pwdIDNumber,
      firstName: person.firstName,
      middleName: person.middleName || 'N/A',
      lastName: person.lastName,
      suffix: person.suffix || 'N/A',
      birthdate: person.birthdate,
      sex: person.sex,
      isSoloParent: person.isSoloParent
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
  const spApplicationID = req.params.spApplicationID;
  
  console.log(req.params);

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT applicantID FROM SoloParentApplication WHERE spApplicationID = ?',
      [spApplicationID]
    );

    if (rows.length === 0) {
      throw new Error('No application found with the given ID.');
    }
    
    const applicantID = rows[0].applicantID;

    await connection.query('DELETE FROM EmergencyContact WHERE spApplicationID = ?', [spApplicationID]);
    await connection.query('DELETE FROM ProblemNeeds WHERE spApplicationID = ?', [spApplicationID]);
    await connection.query('DELETE FROM HouseholdComposition WHERE spApplicationID = ?', [spApplicationID]);
    await connection.query('DELETE FROM OtherInformation WHERE spApplicationID = ?', [spApplicationID]);

    await connection.query('DELETE FROM GovernmentIDs WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM PersonalInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM ProfessionalInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM ContactInformation WHERE applicantID = ?', [applicantID]);

    await connection.query('DELETE FROM SoloParentApplication WHERE spApplicationID = ?', [spApplicationID]);
    
    
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
  const spApplicationID = req.params.spApplicationID || req.query.spApplicationID;

  console.log('SP APPLICATION ID:', spApplicationID);

  try {

    const [applicantRows] = await connection.query(`
      SELECT applicantID FROM SoloParentApplication WHERE spApplicationID = ?
    `, [spApplicationID]);
    
    const applicantID = applicantRows[0]?.applicantID;
    
    if (!applicantID) {
      console.log('[ERROR] No applicantID found for:', spApplicationID);
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    console.log('Retrieving Personal Information');
    const [personalInfo] = await connection.query(`
      SELECT 
        sp.*,
        gov.*,
        pi.*,
        proi.*,
        ci.*,
        oi.*
      FROM SoloParentApplication sp
      LEFT JOIN GovernmentIDs gov 
        ON sp.applicantID = gov.applicantID
      LEFT JOIN PersonalInformation pi 
        ON sp.applicantID = pi.applicantID
      LEFT JOIN ProfessionalInformation proi 
        ON sp.applicantID = proi.applicantID
      LEFT JOIN ContactInformation ci 
        ON sp.applicantID = ci.applicantID
      LEFT JOIN OtherInformation oi
        ON sp.spApplicationID = oi.spApplicationID
      WHERE sp.applicantID = ?
    `, [applicantID]);
    console.log('[SUCCESS] Personal Information');

    console.log('Retrieving Household Composition');
    const [householdComposition] = await connection.query(`
      SELECT * FROM HouseholdComposition
      WHERE spApplicationID = ?
    `, [spApplicationID]);
    console.log('[SUCCESS] Household Composition');

    console.log('Retrieving Problem/Needs');
    const [problemNeeds] = await connection.query(`
      SELECT * FROM ProblemNeeds
      WHERE spApplicationID = ?
    `, [spApplicationID]);
    console.log('[SUCCESS] Problem/Needs');

    console.log('Retrieving Emergency Contact');
    const [emergencyContact] = await connection.query(`
      SELECT * FROM EmergencyContact
      WHERE spApplicationID = ?
    `, [spApplicationID]);
    console.log('[SUCCESS] Emergency Contact');

    console.log('Retrieving Photo ID and Signature');
    const [rows] = await connection.query(`
      SELECT photoID, signature FROM SoloParentApplication
      WHERE spApplicationID = ?
    `, [spApplicationID]);

    const spMedia = rows.map(row => {
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
      householdComposition,
      problemNeeds,
      emergencyContact,
      spMedia
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