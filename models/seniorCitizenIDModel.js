import pool from '../config/database.js';


export const generateSeniorCitizenId = async (connection) => {
  // Get current date components
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
  const datePrefix = `${year}${month}`;
  
  try {
    // Get the current sequence for today
    const [rows] = await connection.query(
      `SELECT MAX(scApplicationID) as maxId FROM seniorCitizenApplication 
       WHERE scApplicationID LIKE ?`,
      [`SC${datePrefix}%`]
    );
    
    let sequence = 1;
    if (rows[0].maxId) {
      // Extract the sequence number from the existing ID
      const currentSequence = parseInt(rows[0].maxId.toString().slice(9));
      sequence = currentSequence + 1;
    }
    
    // Format as YYMMDDXXXX where XXXX is the sequence number
    const sequenceStr = sequence.toString().padStart(4, '0');
    const seniorCitizenID = `SC${datePrefix}${sequenceStr}`;
    
    // Verify this ID doesn't already exist (double-check)
    const [existingCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM seniorCitizenApplication WHERE scApplicationID = ?`,
      [seniorCitizenID]
    );
    
    if (existingCheck[0].count > 0) {
      // In the unlikely event of a collision, recursively try again
      return generateSeniorCitizenId(connection);
    }

    return { scApplicationID: seniorCitizenID };
  } catch (error) {
    console.error('Error generating Senior Citizen ID:', error);
    throw error;
  }
};

export const createSeniorCitizenApplicant = async (scApplicationID, photoID, signature, connection) => {

  await connection.beginTransaction();

  try {

    const [applicantResult] = await connection.query(
      `INSERT INTO Applicants (applicationType) VALUES ('SeniorCitizen')`
    );
    const applicantID = applicantResult.insertId;
    
    await connection.query(
      `INSERT INTO seniorCitizenApplication (
        scApplicationID, 
        applicantID,
        dateApplied, 
        issuedAt, 
        issuedOn, 
        photoID, 
        signature )
       VALUES (?, ?, CURDATE(), CURDATE(), CURDATE(), ?, ?)`,
      [ scApplicationID, 
        applicantID,
        photoID,
        signature
      ]
    );

    console.log('[ INSERTED SUCCESSFULLY seniorCitizenApplication ]')
    return { applicantID };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating SC Application:', error);
    throw error;
  }
};

export const addPersonalInfo = async (applicantID, scApplicationID, personalInfo, connection) => {

  await connection.beginTransaction();

  try {

    await connection.query(
      `INSERT INTO PersonalInformation (
        applicantID, 
        firstName, 
        middleName, 
        lastName, 
        suffix, 
        birthdate, 
        age, 
        sex, 
        civilStatus, 
        birthplace,
        seniorCitizenIDNumber )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,
        personalInfo.age,
        personalInfo.sex,
        personalInfo.civilStatus,
        personalInfo.birthplace,
        scApplicationID ]
    );

    await connection.query(
      `INSERT INTO ContactInformation (
        applicantID, 
        street, 
        barangay, 
        municipality, 
        province, 
        mobileNumber )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province,
        personalInfo.mobileNumber ]
    );

    await connection.query(
      `INSERT INTO ProfessionalInformation (
        applicantID, 
        occupation, 
        educationalAttainment, 
        annualIncome, 
        skills )
       VALUES (?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.occupation,  
        personalInfo.educationalAttainment,
        parseFloat(personalInfo.annualIncome.replace(/,/g, '').trim()) || 0,
        personalInfo.otherSkills ]
    );

    console.log('[ INSERTED SUCCESFULLY Personal Info ]');
    return { success: true, applicantID };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }

  

  
};

export const addFamilyComposition = async (scApplicationID, familyComposition, connection) => {

  if (!familyComposition || familyComposition.length === 0) return null;

  const familyCompositionValues = familyComposition.map(member => [
    scApplicationID,
    member.firstName,
    member.middleName,
    member.lastName,
    member.suffix,
    member.birthdate ? member.birthdate.split('T')[0] : null,
    member.age,
    member.relationship,
    member.civilStatus,
    member.occupation,
    parseFloat((member.annualIncome || '0').replace(/,/g, '').trim()) || 0
  ]);

  await connection.query(
    `INSERT INTO FamilyComposition (
      scApplicationID, 
      firstName, 
      middleName, 
      lastName, 
      suffix,
      birthdate, 
      age, 
      relationship, 
      civilStatus, 
      occupation, 
      annualIncome )
     VALUES ?`,
    [ familyCompositionValues ]
  );

  return console.log('[ INSERTED SUCCESFULLY Family Composition ]');
};

export const addOscaInfo = async (scApplicationID, personalInfo, connection) => {

  console.log('INSERTING OSCA', scApplicationID);

  await connection.query(
    `INSERT INTO OscaInformation (
      scApplicationID, 
      associationName, 
      asOfficer, 
      position )
     VALUES (?, ?, ?, ?)`,
    [ scApplicationID, 
      personalInfo.associationName,  
      personalInfo.asOfficer ? personalInfo.asOfficer.split('T')[0] : null,
      personalInfo.position ]
  );

  return console.log('[ INSERTED SUCCESFULLY OSCA Info ]');
};

export const updatePopulation = async (applicantID, populationID, personalInfo, connection) => {

  await connection.beginTransaction();

  try {

    await connection.query(
      `UPDATE PersonalInformation
       SET applicantID = ?,
           firstName = ?,
           middleName = ?, 
           lastName = ?, 
           suffix = ?, 
           birthdate = ?, 
           age = ?, 
           sex = ?, 
           civilStatus = ?, 
           birthplace = ?,
           seniorCitizenIDNumber = ?
       WHERE personalInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,
        personalInfo.age,
        personalInfo.sex,
        personalInfo.civilStatus,
        personalInfo.birthplace,
        personalInfo.seniorCitizenIDNumber, 
        personalInfo.personalInfoID,
        populationID ]
    );

    await connection.query(
      `UPDATE ContactInformation 
       SET applicantID = ?, 
           street = ?, 
           barangay = ?, 
           municipality = ?, 
           province = ?,  
           mobileNumber = ?, 
       WHERE contactInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province,  
        personalInfo.mobileNumber, 
        personalInfo.contactID,
        populationID
      ]
    );

    await connection.query(
      `UPDATE ProfessionalInformation 
       SET applicantID = ?, 
           educationalAttainment = ?, 
           skills = ?,
           occupation = ?,
           annualIncome = ?
       WHERE professionalInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.educationalAttainment, 
        personalInfo.skills,  
        personalInfo.occupation,
        parseFloat(personalInfo.annualIncome.replace(/,/g, '').trim()) || 0,
        personalInfo.professionalInfoID,
        populationID
      ]
    );

    await connection.commit();
    
    console.log('Population successfully Update!');
    return { success: true, populationID };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};