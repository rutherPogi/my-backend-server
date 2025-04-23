export const updatePWDApplicant = async (pwdApplicationID, applicationData, photoID, signature, connection) => {
  
  await connection.beginTransaction();

  const otherInfo = applicationData.otherInfo;
  const familyBackground = applicationData.familyBackground;

  try {
    // Update physician
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?, 
           licenseNumber = ?
       WHERE officersID = ? AND role = 'physician'`,
      [
        otherInfo.cpFirstName,
        otherInfo.cpMiddleName,
        otherInfo.cpLastName,
        otherInfo.cpSuffix,
        otherInfo.licenseNumber,
        otherInfo.physicianID
      ]
    );

    // Update processor
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?
       WHERE officersID = ? AND role = 'processor'`,
      [
        otherInfo.poFirstName,
        otherInfo.poMiddleName,
        otherInfo.poLastName,
        otherInfo.poSuffix,
        otherInfo.processorID
      ]
    );

    // Update approver
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?
       WHERE officersID = ? AND role = 'approver'`,
      [
        otherInfo.aoFirstName,
        otherInfo.aoMiddleName,
        otherInfo.aoLastName,
        otherInfo.aoSuffix,
        otherInfo.approverID
      ]
    );

    // Update encoder
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?
       WHERE officersID = ? AND role = 'encoder'`,
      [
        otherInfo.eFirstName,
        otherInfo.eMiddleName,
        otherInfo.eLastName,
        otherInfo.eSuffix,
        otherInfo.encoderID
      ]
    );

    // Update Accomplished By
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?,
           role = ?
       WHERE officersID = ?`,
      [
        otherInfo.abFirstName,
        otherInfo.abMiddleName,
        otherInfo.abLastName,
        otherInfo.abSuffix,
        otherInfo.abRole,
        otherInfo.accomplishedByID
      ]
    );

    // Update Father's Name
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?
       WHERE officersID = ? AND role = 'father'`,
      [
        familyBackground.fatherFirstName,
        familyBackground.fatherMiddleName,
        familyBackground.fatherLastName,
        familyBackground.fatherSuffix,
        familyBackground.fatherID
      ]
    );

    // Update Mother's Name
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?
       WHERE officersID = ? AND role = 'mother'`,
      [
        familyBackground.motherFirstName,
        familyBackground.motherMiddleName,
        familyBackground.motherLastName,
        familyBackground.motherSuffix,
        familyBackground.motherID
      ]
    );

    // Update Guardian's Name
    await connection.query(
      `UPDATE Officers 
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?
       WHERE officersID = ? AND role = 'guardian'`,
      [
        familyBackground.guardianFirstName,
        familyBackground.guardianMiddleName,
        familyBackground.guardianLastName,
        familyBackground.guardianSuffix,
        familyBackground.guardianID
      ]
    );

    // Update the main application
    await connection.query(
      `UPDATE pwdApplication
       SET reportingUnit = ?, controlNumber = ?
       WHERE pwdApplicationID = ?`,
      [
        otherInfo.reportingUnit,
        otherInfo.controlNumber,
        pwdApplicationID
      ]
    );


    if (photoID && signature) {
      await connection.query(
        `UPDATE pwdApplication
         SET photoID = ?, signature = ?
         WHERE pwdApplicationID = ?`,
        [photoID, signature, pwdApplicationID]
      );
    } else if (photoID) {
      await connection.query(
        `UPDATE pwdApplication
         SET photoID = ?
         WHERE pwdApplicationID = ?`,
        [photoID, pwdApplicationID]
      );
    } else if (signature) {
      await connection.query(
        `UPDATE pwdApplication
         SET signature = ?
         WHERE pwdApplicationID = ?`,
        [signature, pwdApplicationID]
      );
    }
    

    await connection.commit();
    console.log('PWD Application successfully updated!');
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating PWD Application:', error);
    throw error;
  }
};

export const updatePersonalInfo = async (personalInfo, connection) => {

  await connection.beginTransaction();

  try {

    await connection.query(
      `UPDATE PersonalInformation
       SET firstName = ?, 
           middleName = ?, 
           lastName = ?, 
           suffix = ?, 
           birthdate = ?, 
           age = ?, 
           sex = ?, 
           civilStatus = ?, 
           bloodType = ?, 
           pwdIDNumber = ?
       WHERE personalInfoID = ? AND applicantID = ?`,
      [ personalInfo.firstName,  
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
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ContactInformation 
       SET street = ?, 
           barangay = ?, 
           municipality = ?, 
           province = ?, 
           region = ?,
           landlineNumber = ?, 
           mobileNumber = ?, 
           emailAddress = ?
       WHERE contactInfoID = ? AND applicantID = ?`,
      [ personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province, 
        personalInfo.region, 
        personalInfo.landlineNumber, 
        personalInfo.mobileNumber, 
        personalInfo.emailAddress,
        personalInfo.contactInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ProfessionalInformation 
       SET educationalAttainment = ?, 
           employmentStatus = ?, 
           employmentCategory = ?, 
           employmentType = ?, 
           occupation = ?
       WHERE professionalInfoID = ? AND applicantID = ?`,
      [ personalInfo.educationalAttainment,  
        personalInfo.employmentStatus,
        personalInfo.employmentCategory,
        personalInfo.employmentType, 
        personalInfo.occupation,
        personalInfo.professionalInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE GovernmentAffiliation 
       SET organizationAffiliated = ?, 
           contactPerson = ?, 
           officeAddress = ?, 
           telephoneNumber = ?
       WHERE governmentAffiliationID = ? AND applicantID = ?`,
      [ personalInfo.organizationAffiliated,  
        personalInfo.contactPerson,
        personalInfo.officeAddress,
        personalInfo.telephoneNumber,
        personalInfo.governmentAffiliationID,
        personalInfo.applicantID
      ]
    );

    await connection.query(
      `UPDATE GovernmentIDs
       SET sssNumber = ?, 
           gsisNumber = ?, 
           pagibigNumber = ?, 
           psnNumber = ?, 
           philhealthNumber = ?
       WHERE govID = ? AND applicantID = ?`,
      [ personalInfo.sssNumber,  
        personalInfo.gsisNumber,
        personalInfo.pagibigNumber,
        personalInfo.psnNumber, 
        personalInfo.philhealthNumber,
        personalInfo.govID,
        personalInfo.applicantID
      ]
    );

    await connection.commit();
    
    console.log('Population Updated!');
    return;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};
