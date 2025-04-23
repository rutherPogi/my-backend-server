

export const updateSurvey = async (surveyData, connection) => {
  const [result] = await connection.query(
    `UPDATE Surveys 
     SET respondent = ?, 
         interviewer = ?, 
         barangay = ?, 
         municipality = ?
     WHERE surveyID = ?`,
    [
      surveyData.respondent,
      surveyData.interviewer,
      surveyData.barangay,
      surveyData.municipality,
      surveyData.surveyID
    ]
  );

  console.log('[ UPDATED ] Survey Details')
  return result;
};

export const updateHousehold = async (surveyData, connection) => {

  const [result] = await connection.query(
    `UPDATE Households 
     SET familyClass = ?,
         monthlyIncome = ?,
         irregularIncome = ?,
         familyIncome = ?
      WHERE householdID = ? AND surveyID = ?`,
    [
      surveyData.familyClass,
      parseFloat(surveyData.monthlyIncome.replace(/,/g, '').trim()) || 0,
      parseFloat(surveyData.irregularIncome.replace(/,/g, '').trim()) || 0,
      parseFloat(surveyData.familyIncome.replace(/,/g, '').trim()) || 0,
      surveyData.householdID,
      surveyData.surveyID,
    ]
  );

  console.log('[ UPDATED ] Household')
  return result;
};


// POPULATION

export const updatePopulation = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE Population
       SET healthStatus = ?,
           remarks = ?,
           isOSY = ?,
           inSchool = ?,
           outOfTown = ?,
           isOFW = ?,
           isPWD = ?, 
           isSoloParent = ?
       WHERE populationID = ? AND surveyID = ?`,
      [
        member.healthStatus || 'N/A',
        member.remarks || 'N/A',
        member.isOSY,
        member.inSchool,
        member.outOfTown,
        member.isOFW,
        member.isPWD,
        member.isSoloParent,
        member.populationID,
        member.surveyID
      ]
    );
    
    console.log('[ UPDATED ] Population')
    return result;
  });
  
  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};

export const updatePersonalInfo = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE PersonalInformation
       SET firstName = ?,
           middleName = ?,
           lastName = ?,
           suffix = ?,
           birthdate = ?,
           age = ?,
           sex = ?,
           birthplace = ?, 
           religion = ?,
           civilStatus = ?,
           relationToFamilyHead = ?
       WHERE personalInfoID = ? AND populationID = ?`,
      [
        member.firstName || 'N/A',
        member.middleName || 'N/A',
        member.lastName || 'N/A',
        member.suffix || 'N/A',
        member.birthdate ? member.birthdate.split('T')[0] : null,
        member.age,
        member.sex,
        member.birthplace || 'N/A',
        member.religion || 'N/A',
        member.civilStatus,
        member.relationToFamilyHead,
        member.personalInfoID,
        member.populationID
      ]
    );
    
    console.log('[ UPDATED ] Personal Info')
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};

export const updateProfessionalInfo = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE ProfessionalInformation
       SET educationalAttainment = ?,
           skills = ?,
           occupation = ?,
           employmentType = ?,
           monthlyIncome = ?
       WHERE professionalInfoID = ? AND populationID = ?`,
      [
        member.educationalAttainment,
        member.skills || 'N/A',
        member.occupation || 'N/A',
        member.employmentType || 'N/A',
        parseFloat(member.monthlyIncome.replace(/,/g, '').trim())|| 0,
        member.professionalInfoID,
        member.populationID,
        //member.surveyID
      ]
    );
    
    console.log('[ UPDATED ] Professional Info')
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};

export const updateContactInfo = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE ContactInformation
       SET mobileNumber = ?
       WHERE contactInfoID = ? AND populationID = ?`,
      [
        member.contactNumber || 'N/A',
        member.contactInfoID,
        member.populationID
      ]
    );
    
    console.log('[ UPDATED ] Contact Info')
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};

export const updateGovernmentID = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE GovernmentIDs
       SET philhealthNumber = ?
       WHERE govID = ? AND populationID = ?`,
      [
        member.philhealthNumber || null
      ]
    );
    
    console.log('[ UPDATED ] Government ID')
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};

export const updateGovernmentAffiliation = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE GovernmentAffiliation
       SET isAffiliated = ?,
           asOfficer = ?,
           asMember = ?,
           organizationAffiliated = ?
       WHERE governmentAffiliationID = ? AND populationID = ?`,
      [
        member.isAffiliated,
        member.asOfficer || null,
        member.asMember || null,
        member.organizationAffiliated || 'N/A',
        member.governmentAffiliationID,
        member.populationID
      ]
    );
    
    console.log('[ UPDATED ] Government Affiliation')
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};

export const updateNonIvatan = async (familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;

  const updatePromises = familyMembers.map(async (member) => {

    const [result] = await connection.query(
      `UPDATE NonIvatan
       SET isIpula = ?,
           settlementDetails = ?,
           ethnicity = ?,
           placeOfOrigin = ?,
           isTransient = ?,
           houseOwner = ?,
           isRegistered = ?,
           dateRegistered = ?
       WHERE nonIvatanID = ? AND populationID = ?`,
      [
        member.isIpula,
        member.settlementDetails || 'N/A',
        member.ethnicity || 'N/A',
        member.placeOfOrigin || 'N/A',
        member.isTransient,
        member.houseOwner || 'N/A',
        member.transientRegistered,
        member.dateRegistered || null,
        member.nonIvatanID,
        member.populationID
      ]
    );
    
    console.log('[ UPDATED ] Ipula/Non-Ivatan')
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  return results;
};



export const updateFoodExpenses = async (surveyID, foodExpenses, connection) => {

  if (!surveyID || !foodExpenses.expenses) {
    return console.log('No Food Expenses');
  }

  const expenses = foodExpenses.expenses;
  
  const rice = parseFloat(expenses.Rice?.replace(/,/g, '').trim()) || 0;
  const viand = parseFloat(expenses.Viand?.replace(/,/g, '').trim()) || 0;
  const sugar = parseFloat(expenses.Sugar?.replace(/,/g, '').trim()) || 0;
  const milk = parseFloat(expenses.Milk?.replace(/,/g, '').trim()) || 0;
  const oil = parseFloat(expenses.Oil?.replace(/,/g, '').trim()) || 0;
  const snacks = parseFloat(expenses.Snacks?.replace(/,/g, '').trim()) || 0;
  const otherFood = parseFloat(expenses["Other Food"]?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE FoodExpenses
     SET rice = ?, viand = ?, sugar = ?, milk = ?, oil = ?, snacks = ?, otherFood = ?
     WHERE foodExpensesID = ? AND surveyID = ?`,
    [
      rice,
      viand,
      sugar,
      milk,
      oil,
      snacks,
      otherFood,
      foodExpenses.foodExpensesID,
      surveyID
    ]
  );
  
  console.log('[ UPDATED ] Food Expenses')
  return true;
};

export const updateEducationExpenses = async (surveyId, educationExpenses, connection) => {

  if (!surveyId || !educationExpenses.expenses) return null;

  const expenses = educationExpenses.expenses;

  const tuitionFees = parseFloat(expenses['Tuition Fees']?.replace(/,/g, '').trim()) || 0;
  const miscellaneousFees = parseFloat(expenses['Miscellaneous Fees']?.replace(/,/g, '').trim()) || 0;
  const schoolSupplies = parseFloat(expenses['School Supplies']?.replace(/,/g, '').trim()) || 0;
  const transportation = parseFloat(expenses.Transportation?.replace(/,/g, '').trim()) || 0;
  const rentDormitory = parseFloat(expenses['Rent/Dormitory']?.replace(/,/g, '').trim()) || 0;
  const otherEducation = parseFloat(expenses['Other Education']?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE EducationExpenses
     SET tuitionFees = ?, miscellaneousFees = ?, schoolSupplies = ?, 
         transportation = ?, rentDormitory = ?, otherEducation = ?
     WHERE educationExpensesID = ? AND surveyID = ?`,
    [
      tuitionFees,
      miscellaneousFees,
      schoolSupplies,
      transportation,
      rentDormitory,
      otherEducation,
      educationExpenses.educationExpensesID,
      surveyId
    ]
  );

  console.log('[ UPDATED ] Education Expenses')
  return true;
};

export const updateFamilyExpenses = async (surveyId, familyExpenses, connection) => {

  if (!surveyId || !familyExpenses.expenses) return null;

  const expenses = familyExpenses.expenses;

  const firewood = parseFloat(expenses.Firewood?.replace(/,/g, '').trim()) || 0;
  const gasTank = parseFloat(expenses['Gas Tank']?.replace(/,/g, '').trim()) || 0;
  const caregivers = parseFloat(expenses.Caregivers?.replace(/,/g, '').trim()) || 0;
  const laundry = parseFloat(expenses.Laundry?.replace(/,/g, '').trim()) || 0;
  const hygiene = parseFloat(expenses.Hygiene?.replace(/,/g, '').trim()) || 0;
  const clothings = parseFloat(expenses.Clothings?.replace(/,/g, '').trim()) || 0;
  const others = parseFloat(expenses.Others?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE FamilyExpenses
     SET firewood = ?, gasTank = ?, caregivers = ?, laundry = ?, 
         hygiene = ?, clothings = ?, others = ?
     WHERE familyExpensesID = ? AND surveyID = ?`,
    [
      firewood,
      gasTank,
      caregivers,
      laundry,
      hygiene,
      clothings,
      others,
      familyExpenses.familyExpensesID,
      surveyId
    ]
  );

  console.log('[ UPDATED ] Family Expenses')
  return true;
};

export const updateMonthlyExpenses = async (surveyId, monthlyExpenses, connection) => {

  if (!surveyId || !monthlyExpenses.expenses) return null;

  const expenses = monthlyExpenses.expenses;

  const electricBill = parseFloat(expenses['Electric Bill']?.replace(/,/g, '').trim()) || 0;
  const waterBill = parseFloat(expenses['Water Bill']?.replace(/,/g, '').trim()) || 0;
  const subscription = parseFloat(expenses.Subscription?.replace(/,/g, '').trim()) || 0;
  const mobileLoad = parseFloat(expenses['Mobile Load']?.replace(/,/g, '').trim()) || 0;
  const others = parseFloat(expenses.Others?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `UPDATE MonthlyExpenses
     SET electricBill = ?, waterBill = ?, subscription = ?, 
         mobileLoad = ?, others = ?
     WHERE monthlyExpensesID = ? AND surveyID = ?`,
    [
      electricBill,
      waterBill,
      subscription,
      mobileLoad,
      others,
      monthlyExpenses.monthlyExpensesID,
      surveyId
    ]
  );

  console.log('[ UPDATED ] Monthly Expenses')
  return true;
};


export const updateHouseInfo = async (houseInfo, houseLocation, connection) => {

  if (!houseInfo) return null;

  try {
    await connection.query(
      `UPDATE HouseInformation
       SET houseCondition = ?, 
           houseStructure = ?, 
           latitude = ?, 
           longitude = ?, 
           houseStreet = ?, 
           barangay = ?, 
           municipality = ?
       WHERE houseInfoID = ? AND surveyID = ?`,
      [
        houseInfo.houseCondition,
        houseInfo.houseStructure,
        houseLocation.latitude,
        houseLocation.longitude,
        houseLocation.houseStreet,
        houseLocation.barangay,
        houseLocation.municipality,
        houseInfo.houseInfoID,
        houseLocation.surveyID
      ]
    );

    console.log('[ UPDATED ] House Info');
    return true;
  } catch (error) {
    console.error(`Error updating house information for survey ID ${houseLocation.surveyID}:`, error);
    throw error;
  }
};

export const updateHouseImage = async (houseInfo, houseLocation, connection) => {

  try {
    if (!houseInfo?.houseImages || !Array.isArray(houseInfo.houseImages)) {
      console.warn('No house images to update.');
      return;
    }

    for(const img of houseInfo.houseImages) {

      if (!img.houseImageID) continue;

      const houseTitle = img.title || 'House Image';
      const houseImageID = img.houseImageID;
      const surveyID = houseLocation.surveyID;

      await connection.query(
        `UPDATE HouseImage
         SET houseTitle = ?
         WHERE houseImageID = ? AND surveyID = ?`,
        [
          houseTitle,
          houseImageID,
          surveyID
        ]
      );

      console.log('[ UPDATED ] House Image');
    }
  
    return true;
  } catch (error) {
    console.error(`Error updating house image ID ${houseInfo.houseImages.houseImageID}:`, error);
    throw error;
  }
};

export const updateWaterInfo = async (surveyID, waterInfo, connection) => {

  const [result] = await connection.query(
    `UPDATE WaterInformation 
     SET waterAccess = ?,
         potableWater = ?,
         waterSources = ?
      WHERE waterInfoID = ? AND surveyID = ?`,
    [
      waterInfo.waterAccess,
      waterInfo.potableWater,
      waterInfo.waterSources,
      waterInfo.waterInfoID,
      surveyID,
    ]
  );

  console.log('[ UPDATED ] Water Info')
  return result;
};


export const updateFarmlots = async (surveyID, waterInfo, connection) => {

  const [result] = await connection.query(
    `UPDATE Farmlots 
     SET cultivation = ?,
         pastureland = ?,
         forestland = ?
      WHERE farmlotID = ? AND surveyID = ?`,
    [
      waterInfo.cultivation,
      waterInfo.pastureland,
      waterInfo.forestland,
      waterInfo.farmlotID,
      surveyID,
    ]
  );

  console.log('[ UPDATED ] Farmlots')
  return result;
};

export const updateCommunityIssues = async (surveyID, communityIssues, connection) => {

  const [result] = await connection.query(
    `UPDATE CommunityIssues 
     SET issues = ?
     WHERE communityIssuesID = ? AND surveyID = ?`,
    [
      communityIssues.issues,
      communityIssues.communityIssuesID,
      surveyID,
    ]
  );

  console.log('[ UPDATED ] Community Issues');
  return result;
};


export const updateServiceAvailed = async (surveyID, serviceAvailed, connection) => {

  if (!serviceAvailed || serviceAvailed.length === 0) return null;

  const updatePromises = serviceAvailed.map(async (service) => {

    let formattedDate = null;
    if (service.dateServiceAvailed) {
      const date = new Date(service.dateServiceAvailed);
      
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    }

    const [result] = await connection.query(
      `UPDATE ServiceAvailed
       SET dateServiceAvailed = ?,
           ngoName = ?, 
           serviceAvailed = ?,
           maleServed = ?, 
           femaleServed = ?, 
           totalServed = ?, 
           howServiceHelp = ?
       WHERE serviceAvailedID = ? AND surveyID = ?`,
      [
        formattedDate || null,
        service.ngoName,
        service.serviceAvailed,
        parseInt(service.maleServed),
        parseInt(service.femaleServed),
        parseInt(service.totalServed),
        service.howServiceHelp || 'N/A',
        service.serviceAvailedID,
        surveyID
      ]
    );
    
    return result;
  });

  // Execute all updates and collect results
  const results = await Promise.all(updatePromises);
  console.log('[ UPDATED ] Assistance/Service Availed')
  return results;
};

export const updateLivestock = async (surveyID, livestock, connection) => {

  if (!livestock || Object.keys(livestock).length === 0) {
    console.log('No livestock data to update');
    return null;
  }
  
  await connection.beginTransaction();
  
  try {

    for (const [animal, data] of Object.entries(livestock)) {

      const livestockID = data.livestockID;
      const totalNumber = parseInt(data.number) || 0;
      const own = parseInt(data.own) || 0;
      const dispersal = parseInt(data.dispersal) || 0;

      await connection.query(
        `UPDATE Livestock 
         SET totalNumber = ?, 
             own = ?, 
             dispersal = ?
         WHERE livestockID = ? AND surveyID = ?`,
        [
          totalNumber, 
          own, 
          dispersal, 
          livestockID, 
          surveyID
        ]
      );
    }
    
    // Commit the transaction
    await connection.commit();
    console.log('[ UPDATED ] Livestock')
    return true;
  } catch (error) {
    // Rollback in case of error
    await connection.rollback();
    console.error('Error updating livestock data:', error);
    throw error;
  }
};

export const updateCropsPlanted = async (surveyID, cropsPlanted, connection) => {

  if (!cropsPlanted || !cropsPlanted.crops || Object.keys(cropsPlanted.crops).length === 0) {
    console.log('No crops planted data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM CropsPlanted WHERE surveyID = ?`,
    [ surveyID ]
  );

  const cropsPlantedValues = Object.entries(cropsPlanted.crops)
    .filter(([crop, size]) => parseInt(size) > 0)
    .map(([crop, size]) => [
      surveyID,
      crop,
      parseInt(size)
    ]);

  if (cropsPlantedValues.length > 0) {
    await connection.query(
      `INSERT INTO CropsPlanted (surveyID, crops, size) VALUES ?`,
      [ cropsPlantedValues ]
    );
  }

  console.log('[ UPDATED ] Crops Planted');
};

export const updateFruitBearingTree = async (surveyID, treeData, connection) => {

  if (!treeData || !treeData.tree || Object.keys(treeData.tree).length === 0) {
    console.log('No fruit bearing tree data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM FruitBearingTree WHERE surveyID = ?`,
    [ surveyID ]
  );

  const fruitBearingTreeValues = Object.entries(treeData.tree)
    .filter(([tree, totalNumber]) => parseInt(totalNumber) > 0)
    .map(([tree, totalNumber]) => [
      surveyID,
      tree,
      parseInt(totalNumber)
    ]);

  if(fruitBearingTreeValues.length > 0) {
    await connection.query(
      `INSERT INTO FruitBearingTree (surveyID, tree, totalNumber) VALUES ?`,
      [ fruitBearingTreeValues ]
    );
  }

  console.log('[ UPDATED ] Fruit Bearing Tree');
};


export const updateFamilyResources = async (surveyID, resourcesData, connection) => {

  if (!resourcesData || !resourcesData.resources || Object.keys(resourcesData.resources).length === 0) {
    console.log('No family resources data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM FamilyResources WHERE surveyID = ?`,
    [ surveyID ]
  );


  const familyResourcesValues = Object.entries(resourcesData.resources)
    .filter(([resource, amount]) => parseFloat(amount.replace(/,/g, '').trim()) > 0)
    .map(([resource, amount]) => [
      surveyID,
      resource,
      parseFloat(amount.replace(/,/g, '').trim())
    ]);

  if(familyResourcesValues.length > 0) {
    await connection.query(
      `INSERT INTO FamilyResources (surveyID, resources, amount) VALUES ?`,
      [ familyResourcesValues ]
    );
  }

  console.log('[ UPDATED ] Family Resources');
};


export const updateAppliancesOwn = async (surveyID, appliancesData, connection) => {

  if (!appliancesData || !appliancesData.appliances || Object.keys(appliancesData.appliances).length === 0) {
    console.log('No appliances data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM AppliancesOwn WHERE surveyID = ?`,
    [ surveyID ]
  );

  const appliancesOwnValues = Object.entries(appliancesData.appliances)
    .filter(([appliance, totalAppliances]) => parseInt(totalAppliances) > 0)
    .map(([appliance, totalAppliances]) => [
      surveyID,
      appliance,
      parseInt(totalAppliances)
    ]);

  if(appliancesOwnValues.length > 0) {
    await connection.query(
      `INSERT INTO AppliancesOwn (surveyID, applianceName, totalOwned) VALUES ?`,
      [ appliancesOwnValues ]
    );
  }

  console.log('[ UPDATED ] Appliances Own');
};


export const updateAmenities = async (surveyID, amenities, connection) => {

  if (!amenities || !amenities.amenities || Object.keys(amenities.amenities).length === 0) {
    console.log('No amenities data to insert');
    return null;
  }

  await connection.query(
    `DELETE FROM Amenities WHERE surveyID = ?`,
    [ surveyID ]
  );


  const amenitiesValues = Object.entries(amenities.amenities)
    .filter(([amenity, totalAmenities]) => parseInt(totalAmenities) > 0)
    .map(([amenity, totalAmenities]) => [
      surveyID,
      amenity,
      parseInt(totalAmenities)
    ]);

  if(amenitiesValues.length > 0) {
    await connection.query(
      `INSERT INTO Amenities (surveyID, amenityName, totalOwned) VALUES ?`,
      [ amenitiesValues ]
    );
  }

  console.log('[ UPDATED ] Amenites');
};