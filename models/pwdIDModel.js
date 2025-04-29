import pool from '../config/database.js';

export const generatePwdId = async (connection, barangayCode) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)

  try {
    // Look for the max existing ID for the same year-month-barangay
    const [rows] = await connection.query(
      `SELECT MAX(pwdApplicationID) as maxId FROM pwdApplication 
       WHERE pwdApplicationID LIKE ?`,
      [`RR-${year}${month}-${barangayCode}-%`]
    );

    let sequence = 1;
    if (rows[0].maxId) {
      // Extract the 7-digit sequence number
      const currentSequence = parseInt(rows[0].maxId.toString().split('-')[3]);
      sequence = currentSequence + 1;
    }

    // Format the sequence with 7 digits
    const sequenceStr = sequence.toString().padStart(7, '0');
    const pwdID = `RR-${year}${month}-${barangayCode}-${sequenceStr}`;

    // Double-check if this ID exists
    const [existingCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM pwdApplication WHERE pwdApplicationID = ?`,
      [pwdID]
    );

    if (existingCheck[0].count > 0) {
      return generatePwdId(connection, barangayCode); // Recursive call if collision
    }

    return { pwdApplicationID: pwdID };
  } catch (error) {
    console.error('Error generating pwd ID:', error);
    throw error;
  }
};


export const createPWDApplicant = async (pwdApplicationID, applicationData, photoID, signature, connection) => {

  await connection.beginTransaction();

  const otherInfo = applicationData.otherInfo;
  const familyBackground = applicationData.familyBackground;
  
  try {

    const [applicantResult] = await connection.query(
      `INSERT INTO Applicants (applicationType) VALUES ('PWD')`
    );
    const applicantID = applicantResult.insertId;

    const [physicianResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role, licenseNumber)
      VALUES (?, ?, ?, ?, ?, 'physician', ?)`,
      [
        pwdApplicationID,
        otherInfo.cpFirstName,
        otherInfo.cpMiddleName,
        otherInfo.cpLastName,
        otherInfo.cpSuffix,
        otherInfo.licenseNumber
      ]
    );
    const physicianID = physicianResult.insertId;

    const [processorResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, 'processor')`,
      [
        pwdApplicationID,
        otherInfo.poFirstName,
        otherInfo.poMiddleName,
        otherInfo.poLastName,
        otherInfo.poSuffix
      ]
    );
    const processorID = processorResult.insertId;

    const [approverResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, 'approver')`,
      [
        pwdApplicationID,
        otherInfo.aoFirstName,
        otherInfo.aoMiddleName,
        otherInfo.aoLastName,
        otherInfo.aoSuffix
      ]
    );
    const approverID = approverResult.insertId;

    const [encoderResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, 'encoder')`,
      [
        pwdApplicationID,
        otherInfo.eFirstName,
        otherInfo.eMiddleName,
        otherInfo.eLastName,
        otherInfo.eSuffix
      ]
    );
    const encoderID = encoderResult.insertId;

    const [accomplishedByResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pwdApplicationID,
        otherInfo.abFirstName,
        otherInfo.abMiddleName,
        otherInfo.abLastName,
        otherInfo.abSuffix,
        otherInfo.abRole,
      ]
    );
    const accomplishedByID = accomplishedByResult.insertId;

    const [motherResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, 'mother')`,
      [
        pwdApplicationID,
        familyBackground.motherFirstName,
        familyBackground.motherMiddleName,
        familyBackground.motherLastName,
        familyBackground.motherSuffix,
      ]
    );
    const motherID = motherResult.insertId;

    const [fatherResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, 'father')`,
      [
        pwdApplicationID,
        familyBackground.fatherFirstName,
        familyBackground.fatherMiddleName,
        familyBackground.fatherLastName,
        familyBackground.fatherSuffix
      ]
    );
    const fatherID = fatherResult.insertId;

    const [guardianResult] = await connection.query(
      `INSERT INTO Officers 
      (pwdApplicationID, firstName, middleName, lastName, suffix, role)
      VALUES (?, ?, ?, ?, ?, 'guardian')`,
      [
        pwdApplicationID,
        familyBackground.guardianFirstName,
        familyBackground.guardianMiddleName,
        familyBackground.guardianLastName,
        familyBackground.guardianSuffix
      ]
    );
    const guardianID = guardianResult.insertId;
    
    await connection.query(
      `INSERT INTO pwdApplication (
        pwdApplicationID, 
        applicantID,
        dateApplied, 
        photoID,
        signature,
        reportingUnit, 
        controlNumber, 
        physicianID,
        processorID,
        approverID,
        encoderID,
        accomplishedByID,
        motherID,
        fatherID,
        guardianID
      ) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pwdApplicationID,
        applicantID,
        photoID,
        signature,
        otherInfo.reportingUnit,
        otherInfo.controlNumber,
        physicianID,
        processorID,
        approverID,
        encoderID,
        accomplishedByID,
        motherID,
        fatherID,
        guardianID
      ]
    );
    
    // Commit the transaction
    await connection.commit();
    
    console.log('PWD Application successfully created with all officers!');
    console.log('Applicant ID:', applicantID);
    return {applicantID};
    
  } catch (error) {
    // If anything fails, roll back the transaction
    await connection.rollback();
    console.error('Error creating PWD Application:', error);
    throw error;
  }
};

export const addPersonalInfo = async (applicantID, pwdApplicationID, personalInfo, connection) => {

  await connection.beginTransaction();

  try {

    await connection.query(
      `INSERT INTO PersonalInformation
      (applicantID, firstName, middleName, lastName, suffix, birthdate, age, sex, civilStatus, bloodType, pwdIDNumber, isPWD)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,
        personalInfo.age,
        personalInfo.sex,
        personalInfo.civilStatus,
        personalInfo.bloodType,
        pwdApplicationID,
        1 ]
    );

    await connection.query(
      `INSERT INTO ContactInformation 
      (applicantID, street, barangay, municipality, province, region,
       landlineNumber, mobileNumber, emailAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province, 
        personalInfo.region, 
        personalInfo.landlineNumber, 
        personalInfo.mobileNumber, 
        personalInfo.emailAddress
      ]
    );

    await connection.query(
      `INSERT INTO ProfessionalInformation 
      (applicantID, educationalAttainment, employmentStatus, employmentCategory, employmentType, occupation)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.educationalAttainment,  
        personalInfo.employmentStatus,
        personalInfo.employmentCategory,
        personalInfo.employmentType, 
        personalInfo.occupation
      ]
    );

    await connection.query(
      `INSERT INTO GovernmentAffiliation 
      (applicantID, organizationAffiliated, contactPerson, officeAddress, telephoneNumber)
       VALUES (?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.organizationAffiliated,  
        personalInfo.contactPerson,
        personalInfo.officeAddress,
        personalInfo.telephoneNumber 
      ]
    );

    await connection.query(
      `INSERT INTO GovernmentIDs
      (applicantID, sssNumber, gsisNumber, pagibigNumber, psnNumber, philhealthNumber)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ applicantID, 
        personalInfo.sssNumber,  
        personalInfo.gsisNumber,
        personalInfo.pagibigNumber,
        personalInfo.psnNumber, 
        personalInfo.philhealthNumber
      ]
    );

    await connection.commit();
    
    console.log('Population successfully created!');
    return { success: true, applicantID };
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};

export const addDisabilityInfo = async (pwdApplicationID, personalInfo, connection) => {

  const [result] = await connection.query(
    `INSERT INTO DisabilityInformation 
    (pwdApplicationID, disabilityType, disabilityCause, disabilitySpecific)
     VALUES (?, ?, ?, ?)`,
    [ pwdApplicationID, 
      personalInfo.disabilityType,  
      personalInfo.disabilityCause,
      personalInfo.disabilitySpecific ]
  );

  console.log('[SUCCESSFULLY ADDED] Disability Information')
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
           civilStatus = ?, 
           bloodType = ?, 
           pwdIDNumber = ?
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
        personalInfo.bloodType,
        personalInfo.pwdIDNumber, 
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
           region = ?,
           landlineNumber = ?, 
           mobileNumber = ?, 
           emailAddress = ?
       WHERE contactInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province, 
        personalInfo.region, 
        personalInfo.landlineNumber, 
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
           employmentCategory = ?, 
           employmentType = ?, 
           occupation = ?
       WHERE professionalInfoID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.educationalAttainment,  
        personalInfo.employmentStatus,
        personalInfo.employmentCategory,
        personalInfo.employmentType, 
        personalInfo.occupation,
        personalInfo.professionalInfoID,
        populationID
      ]
    );

    await connection.query(
      `UPDATE GovernmentAffiliation 
       SET applicantID = ?, 
           organizationAffiliated = ?, 
           contactPerson = ?, 
           officeAddress = ?, 
           telephoneNumber = ?
       WHERE governmentAffiliationID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.organizationAffiliated,  
        personalInfo.contactPerson,
        personalInfo.officeAddress,
        personalInfo.telephoneNumber,
        personalInfo.governmentAffiliationID,
        populationID
      ]
    );

    await connection.query(
      `UPDATE GovernmentIDs
       SET applicantID = ?, 
           sssNumber = ?, 
           gsisNumber = ?, 
           pagibigNumber = ?, 
           psnNumber = ?, 
           philhealthNumber = ?
       WHERE govID = ? AND populationID = ?`,
      [ applicantID, 
        personalInfo.sssNumber,  
        personalInfo.gsisNumber,
        personalInfo.pagibigNumber,
        personalInfo.psnNumber, 
        personalInfo.philhealthNumber,
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