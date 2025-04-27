import pool from '../config/database.js';

export const generateSoloParentId = async (connection) => {
  // Get current date components
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
  const datePrefix = `${year}${month}`;
  
  try {
    // Get the current sequence for today
    const [rows] = await connection.query(
      `SELECT MAX(spApplicationID) as maxId FROM soloParentApplication 
       WHERE spApplicationID LIKE ?`,
      [`SP${datePrefix}%`]
    );
    
    let sequence = 1;
    if (rows[0].maxId) {
      // Extract the sequence number from the existing ID
      const currentSequence = parseInt(rows[0].maxId.toString().slice(9));
      sequence = currentSequence + 1;
    }
    
    // Format as YYMMDDXXXX where XXXX is the sequence number
    const sequenceStr = sequence.toString().padStart(4, '0');
    const soloParentID = `SP${datePrefix}${sequenceStr}`;
    
    // Verify this ID doesn't already exist (double-check)
    const [existingCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM soloParentApplication WHERE spApplicationID = ?`,
      [soloParentID]
    );
    
    if (existingCheck[0].count > 0) {
      // In the unlikely event of a collision, recursively try again
      return generateSoloParentId(connection);
    }

    return { spApplicationID: soloParentID };
  } catch (error) {
    console.error('Error generating Solo Parent ID:', error);
    throw error;
  }
};

export const createSoloParentApplicant = async (spApplicationID, photoID, signature, connection) => {

  await connection.beginTransaction();

  try {

    const [applicantResult] = await connection.query(
      `INSERT INTO Applicants (applicationType) VALUES ('SeniorCitizen')`
    );
    const applicantID = applicantResult.insertId;
    
    await connection.query(
      `INSERT INTO soloParentApplication (
        spApplicationID,
        applicantID, 
        caseNumber,
        dateApplied,    
        photoID,
        signature )
       VALUES (?, ?, ?, CURDATE(), ?, ?)`,
      [ spApplicationID, 
        applicantID,
        'PSGC-YYMM-000001',
        photoID,
        signature
      ]
    );
  
    console.log('[ INSERTED SUCCESSFULLY Solo Parent Application ]')
    return { applicantID };

  } catch (error) {
    await connection.rollback();
    console.error('Error creating Solo Parent Application:', error);
    throw error;
  }

  
};

export const addPersonalInfo = async (applicantID, spApplicationID, personalInfo, connection) => {

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
        religion,
        soloParentIDNumber )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,,
        parseInt(personalInfo.age),
        personalInfo.sex,
        personalInfo.civilStatus,
        personalInfo.birthplace,
        personalInfo.religion,
        spApplicationID ]
    );

    await connection.query(
      `INSERT INTO ContactInformation (
        applicantID, 
        street, 
        barangay, 
        municipality, 
        province,
        mobileNumber, 
        emailAddress )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province,
        personalInfo.mobileNumber,
        personalInfo.emailAddress ]
    );

    await connection.query(
      `INSERT INTO ProfessionalInformation (
        applicantID, 
        occupation, 
        company, 
        educationalAttainment, 
        monthlyIncome, 
        employmentStatus )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.occupation,  
        personalInfo.company,  
        personalInfo.educationalAttainment,
        parseFloat(personalInfo.monthlyIncome.replace(/,/g, '').trim()) || 0,
        personalInfo.employmentStatus ]
    );

    await connection.query(
      `INSERT INTO GovernmentIDs ( applicantID, phylsisNumber) VALUES (?, ?)`,
      [ applicantID, 
        personalInfo.phylsisNumber ]
    );

    console.log('[ INSERTED SUCCESFULLY Personal Info ]');
    return { success: true, applicantID };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Personal Info:', error);
    throw error;
  }

  

};

export const addOtherInfo = async (spApplicationID, personalInfo, connection) => {

  await connection.query(
    `INSERT INTO OtherInformation (
      spApplicationID, 
      isBeneficiary, 
      householdID,
      beneficiaryCode,
      isIndigenous, 
      indigenousAffiliation,
      isLGBTQ, 
      isPWD, 
      soloParentCategory )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ spApplicationID, 
      personalInfo.isBeneficiary,  
      personalInfo.householdID,  
      personalInfo.beneficiaryCode,
      personalInfo.isIndigenous,
      personalInfo.indigenousAffiliation,
      personalInfo.isLGBTQ,
      personalInfo.isPWD,
      personalInfo.soloParentCategory ]
  );

  return console.log('[ SUCCESS Other Info ]');
};

export const addHouseholdComposition = async (spApplicationID, householdComposition, connection) => {

  if (!householdComposition || householdComposition.length === 0) return null;

  const householdCompositionValues = householdComposition.map(member => [
    spApplicationID,
    member.firstName,
    member.middleName,
    member.lastName,
    member.suffix,
    member.sex,
    member.relationship,
    member.birthdate ? member.birthdate.split('T')[0] : null,
    member.age,
    member.civilStatus,
    member.educationalAttainment,
    member.occupation,
    parseFloat(member.monthlyIncome.replace(/,/g, '').trim()) || 0,
  ]);

  const [result] = await connection.query(
    `INSERT INTO HouseholdComposition (
      spApplicationID, 
      firstName, 
      middleName, 
      lastName, 
      suffix, 
      sex, 
      relationship, 
      birthdate, 
      age, 
      civilStatus, 
      educationalAttainment, 
      occupation, 
      monthlyIncome )
     VALUES ?`,
    [ householdCompositionValues ]
  );

  return console.log('[ SUCCESS Household ]');
};

export const addProblemNeeds = async (spApplicationID, problemNeeds, connection) => {

  const [result] = await connection.query(
    `INSERT INTO ProblemNeeds (
      spApplicationID, 
      causeSoloParent, 
      needsSoloParent )
     VALUES (?, ?, ?)`,
    [ spApplicationID, 
      problemNeeds.causeSoloParent,
      problemNeeds.needsSoloParent ]
  );

  return result;
};

export const addEmergencyContact = async (spApplicationID, emergencyContact, connection) => {

  const [result] = await connection.query(
    `INSERT INTO EmergencyContact (
      spApplicationID, 
      contactName, 
      relationship, 
      street, 
      barangay, 
      municipality, 
      province, 
      mobileNumber )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [ spApplicationID, 
      emergencyContact.contactName,
      emergencyContact.relationship,
      emergencyContact.street,  
      emergencyContact.barangay,
      emergencyContact.municipality,
      emergencyContact.province,
      emergencyContact.mobileNumber ]
  );

  return result;
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
           birthplace = ?,
           civilStatus = ?,
           religion = ?, 
           soloParentIDNumber = ?
       WHERE personalInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,
        personalInfo.age,
        personalInfo.sex,
        personalInfo.birthplace,
        personalInfo.civilStatus,
        personalInfo.religion,
        personalInfo.soloParentIDNumber, 
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
           emailAddress = ?
       WHERE contactInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province, 
        personalInfo.mobileNumber, 
        personalInfo.emailAddress,
        personalInfo.contactID,
        populationID
      ]
    );

    await connection.query(
      `UPDATE ProfessionalInformation 
       SET applicantID = ?, 
           educationalAttainment = ?, 
           employmentStatus = ?, 
           occupation = ?,
           company = ?,
           monthlyIncome = ?
       WHERE professionalInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.educationalAttainment,  
        personalInfo.employmentStatus, 
        personalInfo.occupation,
        personalInfo.company,
        parseFloat(personalInfo.monthlyIncome.replace(/,/g, '').trim()) || 0,
        personalInfo.professionalInfoID,
        populationID
      ]
    );

    await connection.query(
      `UPDATE GovernmentIDs
       SET applicantID = ?, 
           phylsisNumber = ?
       WHERE govID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.phylsisNumber,  
        personalInfo.govID,
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
