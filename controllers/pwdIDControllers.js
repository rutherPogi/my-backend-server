import pool from '../config/database.js';
import * as pwdIDModel from '../models/pwdIDModel.js';
import * as updatepwdIDModel from '../models/updatepwdIDModel.js';

export const submitPwdId = async (req, res) => {
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { pwdApplicationID } = await pwdIDModel.generatePwdId(connection, 'ABC');
    
    const applicationData = JSON.parse(req.body.applicationData);
    const populationID = applicationData.personalInfo.populationID;

    console.log('Application ID:', pwdApplicationID);
    console.log('Population ID:', populationID);

    const photoID = req.files.photoID[0].buffer;
    const base64Data = applicationData.pwdMedia.signature.split(';base64,').pop();
    const signature = Buffer.from(base64Data, 'base64');

    console.log("Creating PWD Application...");
    const { applicantID } = await pwdIDModel.createPWDApplicant(
      pwdApplicationID,
      applicationData,
      photoID,
      signature,
      connection
    );

    if(populationID) {
      console.log("Updating Personal Info...");
      await pwdIDModel.updatePopulation(applicantID, populationID, applicationData.personalInfo, connection);
    } else {
      console.log("Inserting New Personal Info...");
      await pwdIDModel.addPersonalInfo(applicantID, pwdApplicationID, applicationData.personalInfo, connection);
    }

    console.log("Inserting Disability Info...");
    await pwdIDModel.addDisabilityInfo(pwdApplicationID, applicationData.personalInfo, connection);


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      pwdApplicationID 
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

export const updatePwdId = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const applicationData = JSON.parse(req.body.applicationData);
    const pwdApplicationID = applicationData.personalInfo.pwdApplicationID;
    console.log('Application ID', pwdApplicationID);

    let photoID = null;
    let signature = null;

    // Get photoID from files
    if (req.files && req.files.photoID && req.files.photoID.length > 0) {
      photoID = req.files.photoID[0].buffer;
    }

    // Get signature if it exists
    if (applicationData?.pwdMedia?.signature) {
      const base64Data = applicationData.pwdMedia.signature.split(';base64,').pop();
      signature = Buffer.from(base64Data, 'base64');
    }
    
    console.log("Updating PWD Application");
    await updatepwdIDModel.updatePWDApplicant(
      pwdApplicationID,
      applicationData,
      photoID,
      signature,
      connection
    );

    console.log("Updating Personal Info");
    await updatepwdIDModel.updatePersonalInfo(applicationData.personalInfo, connection);


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Application updated successfully', 
      pwdApplicationID 
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

export const managePwdId = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          pa.pwdApplicationID,
          pa.applicantID,
          pa.dateApplied,
          pi.populationID,
          pi.firstName,
          pi.middleName,
          pi.lastName,
          pi.suffix
        FROM pwdApplication pa
        LEFT JOIN PersonalInformation pi ON pa.applicantID = pi.applicantID
        ORDER BY dateApplied ASC;`
    );

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

export const findPwdID = async (req, res) => {
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

    // First query for PersonalInformation records
    // Use IFNULL or COALESCE to handle null values for optional fields
    const [results] = await connection.query(`
      SELECT 
        pi.personalInfoID,
        pi.populationID,
        pi.applicantID,
        pi.pwdIDNumber,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.suffix,
        pi.birthdate,
        pi.sex,
        CASE WHEN p.populationID IS NOT NULL THEN TRUE ELSE FALSE END AS existsInPopulation
      FROM PersonalInformation pi
      LEFT JOIN Population p ON pi.populationID = p.populationID
      WHERE pi.firstName LIKE ?
        AND (pi.middleName LIKE ? OR ? = '' OR pi.middleName IS NULL)
        AND pi.lastName LIKE ?
        AND (pi.suffix LIKE ? OR ? = '' OR pi.suffix IS NULL)
        ${birthdate ? 'AND pi.birthdate = ?' : ''}
        AND pi.sex = ?
        AND pi.isPWD = TRUE
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
      existsInPopulation: person.existsInPopulation
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
  console.log('POPULATION ID', populationID);
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
  const pwdApplicationID = req.params.pwdApplicationID;
  
  console.log(req.params);

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT applicantID FROM pwdApplication WHERE pwdApplicationID = ?',
      [pwdApplicationID]
    );
    
    if (rows.length === 0) {
      throw new Error('No application found with the given ID.');
    }
    
    const applicantID = rows[0].applicantID;

    await connection.query('DELETE FROM Officers WHERE pwdApplicationID = ?', [pwdApplicationID]);
    await connection.query('DELETE FROM DisabilityInformation WHERE pwdApplicationID = ?', [pwdApplicationID]);

    await connection.query('DELETE FROM GovernmentIDs WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM PersonalInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM ProfessionalInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM ContactInformation WHERE applicantID = ?', [applicantID]);
    await connection.query('DELETE FROM GovernmentAffiliation WHERE applicantID = ?', [applicantID]);

    await connection.query('DELETE FROM pwdApplication WHERE pwdApplicationID = ?', [pwdApplicationID]);
    
    
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
  const pwdApplicationID = req.params.pwdApplicationID || req.query.pwdApplicationID;

  console.log('PWD APPLICATION ID:', pwdApplicationID);

  try {

    const [applicantRows] = await connection.query(`
      SELECT applicantID FROM pwdApplication WHERE pwdApplicationID = ?
    `, [pwdApplicationID]);
    
    const applicantID = applicantRows[0]?.applicantID;
    
    if (!applicantID) {
      console.log('[ERROR] No applicantID found for:', pwdApplicationID);
      return res.status(404).json({ message: 'Applicant not found' });
    }
    

    console.log('Retrieving Personal Information', applicantID);
    const [personalInfo] = await connection.query(`
      SELECT 
        pa.*,
        di.*,
        gov.*,
        pi.*,
        proi.*,
        ci.*,
        ga.*
      FROM pwdApplication pa
      LEFT JOIN DisabilityInformation di 
          ON pa.pwdApplicationID = di.pwdApplicationID
      LEFT JOIN GovernmentIDs gov 
          ON pa.applicantID = gov.applicantID
      LEFT JOIN PersonalInformation pi 
          ON pa.applicantID = pi.applicantID
      LEFT JOIN ProfessionalInformation proi 
          ON pa.applicantID = proi.applicantID
      LEFT JOIN ContactInformation ci 
          ON pa.applicantID = ci.applicantID
      LEFT JOIN GovernmentAffiliation ga 
          ON pa.applicantID = ga.applicantID
      WHERE pa.applicantID = ?
    `, [applicantID]);
    console.log('[SUCCESS] Personal Information');

    console.log('Retrieving Family Background');
    const [familyBackground] = await connection.query(`
      SELECT 
        pa.*,

        -- Father
        father.firstName AS fatherFirstName,
        father.middleName AS fatherMiddleName,
        father.lastName AS fatherLastName,
        father.suffix AS fatherSuffix,

        -- Mother
        mother.firstName AS motherFirstName,
        mother.middleName AS motherMiddleName,
        mother.lastName AS motherLastName,
        mother.suffix AS motherSuffix,

        -- Guardian
        guardian.firstName AS guardianFirstName,
        guardian.middleName AS guardianMiddleName,
        guardian.lastName AS guardianLastName,
        guardian.suffix AS guardianSuffix

      FROM pwdApplication pa
      LEFT JOIN Officers father 
        ON pa.fatherID = father.officersID
      LEFT JOIN Officers mother 
        ON pa.motherID = mother.officersID
      LEFT JOIN Officers guardian 
        ON pa.guardianID = guardian.officersID

      WHERE pa.pwdApplicationID = ?;
    `, [pwdApplicationID]);
    console.log('[SUCCESS] Family Background');

    console.log('Retrieving Other Information');
    const [otherInfo] = await connection.query(`
      SELECT 
        pa.*,

        -- Physician
        physician.firstName AS cpFirstName,
        physician.middleName AS cpMiddleName,
        physician.lastName AS cpLastName,
        physician.suffix AS cpSuffix,
        physician.licenseNumber AS licenseNumber,

        -- Processor
        processor.firstName AS poFirstName,
        processor.middleName AS poMiddleName,
        processor.lastName AS poLastName,
        processor.suffix AS poSuffix,

        -- Approver
        approver.firstName AS aoFirstName,
        approver.middleName AS aoMiddleName,
        approver.lastName AS aoLastName,
        approver.suffix AS aoSuffix,

        -- Encoder
        encoder.firstName AS eFirstName,
        encoder.middleName AS eMiddleName,
        encoder.lastName AS eLastName,
        encoder.suffix AS eSuffix,

        -- Accomplished By
        ab.firstName AS abFirstName,
        ab.middleName AS abMiddleName,
        ab.lastName AS abLastName,
        ab.suffix AS abSuffix,
        ab.role AS abRole

      FROM pwdApplication pa
      LEFT JOIN Officers physician 
        ON pa.physicianID = physician.officersID
      LEFT JOIN Officers processor 
        ON pa.processorID = processor.officersID
      LEFT JOIN Officers approver 
        ON pa.approverID = approver.officersID
      LEFT JOIN Officers encoder 
        ON pa.encoderID = encoder.officersID
      LEFT JOIN Officers ab
        ON pa.accomplishedByID = ab.officersID

      WHERE pa.pwdApplicationID = ?;

    `, [pwdApplicationID]);
    console.log('[SUCCESS] Other Information');

    console.log('Retrieving Photo ID and Signature');
    const [rows] = await connection.query(`
      SELECT photoID, signature FROM pwdApplication
      WHERE pwdApplicationID = ?
    `, [pwdApplicationID]);

    const pwdMedia = rows.map(row => {
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

    res.status(200).json({ 
      personalInfo,
      familyBackground,
      otherInfo,
      pwdMedia
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

