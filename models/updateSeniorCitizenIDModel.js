export const updateSeniorCitizenApplication = async (scApplicationID, photoID, signature, connection) => {
  
  await connection.beginTransaction();

  try {

    // Update the main application
    await connection.query(
      `UPDATE seniorCitizenApplication
       SET dateApplied = CURDATE() ,
           issuedAt = CURDATE() ,
           issuedOn = CURDATE() 
       WHERE scApplicationID = ?`,
      [ scApplicationID ]
    );


    if (photoID && signature) {
      await connection.query(
        `UPDATE seniorCitizenApplication
         SET photoID = ?, signature = ?
         WHERE scApplicationID = ?`,
        [photoID, signature, scApplicationID]
      );
    } else if (photoID) {
      await connection.query(
        `UPDATE seniorCitizenApplication
         SET photoID = ?
         WHERE scApplicationID = ?`,
        [photoID, scApplicationID]
      );
    } else if (signature) {
      await connection.query(
        `UPDATE seniorCitizenApplication
         SET signature = ?
         WHERE scApplicationID = ?`,
        [signature, scApplicationID]
      );
    }
    

    await connection.commit();
    
    return console.log('[ UPDATED - Senior Citizen Application ]');
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating Senior Citizen Application:', error);
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
           birthplace = ?,
           civilStatus = ?, 
           seniorCitizenIDNumber = ?
       WHERE personalInfoID = ? AND applicantID = ?`,
      [ personalInfo.firstName,  
        personalInfo.middleName,
        personalInfo.lastName,
        personalInfo.suffix,
        personalInfo.birthdate ? personalInfo.birthdate.split('T')[0] : null,
        personalInfo.age,
        personalInfo.sex,
        personalInfo.birthplace,
        personalInfo.civilStatus,
        personalInfo.seniorCitizenIDNumber,
        personalInfo.personalInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ContactInformation 
       SET street = ?, 
           barangay = ?, 
           municipality = ?, 
           province = ?, 
           mobileNumber = ?
       WHERE contactInfoID = ? AND applicantID = ?`,
      [ personalInfo.street,  
        personalInfo.barangay,
        personalInfo.municipality,
        personalInfo.province,
        personalInfo.mobileNumber, 
        personalInfo.contactInfoID,
        personalInfo.applicantID ]
    );

    await connection.query(
      `UPDATE ProfessionalInformation 
       SET educationalAttainment = ?, 
           skills = ?,
           annualIncome = ?,
           occupation = ?
       WHERE professionalInfoID = ? AND applicantID = ?`,
      [ personalInfo.educationalAttainment,  
        personalInfo.skills,
        parseFloat((personalInfo.annualIncome || '0').replace(/,/g, '').trim()) || 0,
        personalInfo.occupation,
        personalInfo.professionalInfoID,
        personalInfo.applicantID ]
    );

    await connection.commit();
    
    
    return console.log('[ UPDATED - Personal Information ] ');
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};

export const updateOscaInfo = async (scApplicationID, personalInfo, connection) => {

  await connection.beginTransaction();

  try {

    await connection.query(
      `UPDATE OscaInformation
       SET associationName = ?,
           asOfficer = ?,
           position = ?
       WHERE oscaInfoID = ? AND scApplicationID = ?`,
      [ personalInfo.associationName,  
        personalInfo.asOfficer ? personalInfo.asOfficer.split('T')[0] : null,
        personalInfo.position,
        personalInfo.oscaInfoID,
        scApplicationID ]
    );

    await connection.commit();
  
    return console.log('[ UPDATED - OSCA Information ]');
  } catch (error) {
    await connection.rollback();
    console.error('Error creating Population:', error);
    throw error;
  }
};

export const updateFamilyComposition = async (scApplicationID, familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE FamilyComposition
       SET firstName = ?,
           middleName = ?,
           lastName = ?,
           suffix = ?,
           birthdate = ?,
           age = ?,
           relationship = ?,
           civilStatus = ?,
           occupation = ?,
           annualIncome = ?
       WHERE familyCompositionID = ? AND scApplicationID = ?`,
      [
        member.firstName,
        member.middleName,
        member.lastName,
        member.suffix,
        member.birthdate ? member.birthdate.split('T')[0] : null,
        member.age,
        member.relationship,
        member.civilStatus,
        member.occupation,
        parseFloat((member.annualIncome || '0').replace(/,/g, '').trim()) || 0,
        member.familyCompositionID,
        scApplicationID
      ]
    );
    
    console.log('[ UPDATED - Family Composition ]')
    return result;
  });
  
  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};
