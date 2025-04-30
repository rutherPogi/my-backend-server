

export const generateSurveyId = async (connection) => {
  // Get current date components
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
  const datePrefix = `${year}${month}`;
  
  try {
    // Get the current sequence for today
    const [rows] = await connection.query(
      `SELECT MAX(surveyID) as maxId FROM Surveys 
       WHERE surveyID LIKE ?`,
      [`${datePrefix}%`]
    );
    
    let sequence = 1;
    if (rows[0].maxId) {
      // Extract the sequence number from the existing ID
      const currentSequence = parseInt(rows[0].maxId.toString().slice(6));
      sequence = currentSequence + 1;
    }
    
    // Format as YYMMDDXXXX where XXXX is the sequence number
    const sequenceStr = sequence.toString().padStart(4, '0');
    const surveyId = `${datePrefix}${sequenceStr}`;
    
    // Verify this ID doesn't already exist (double-check)
    const [existingCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM Surveys WHERE surveyID = ?`,
      [surveyId]
    );
    
    if (existingCheck[0].count > 0) {
      // In the unlikely event of a collision, recursively try again
      return generateSurveyId(connection);
    }
    return surveyId;
  } catch (error) {
    console.error('Error generating survey ID:', error);
    throw error;
  }
};

export const createSurvey = async (surveyID, surveyData, connection) => {

  const [result] = await connection.query(
    `INSERT INTO Surveys 
     (surveyID, respondent, interviewer, barangay, municipality)
     VALUES (?, ?, ?, ?, ?)`,
    [
      surveyID,
      surveyData.respondent,
      surveyData.interviewer,
      surveyData.barangay,
      surveyData.municipality
    ]
  );
  return result;
};

export const addHousehold = async (surveyID, surveyData, connection) => {

  const [result] = await connection.query(
    `INSERT INTO Households 
     (householdID, surveyID, familyClass, monthlyIncome, irregularIncome, familyIncome)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'H' + surveyID,
      surveyID,
      surveyData.familyClass,
      parseFloat(surveyData.monthlyIncome.replace(/,/g, '').trim()) || 0,
      parseFloat(surveyData.irregularIncome.replace(/,/g, '').trim()) || 0,
      parseFloat(surveyData.familyIncome.replace(/,/g, '').trim()) || 0
    ]
  );
  return result;
};


// POPULATION
export const addPopulation = async (populationID, surveyId, familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;
  
  const familyMemberValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    surveyId,
    member.healthStatus,
    member.remarks
  ]);
  
  const [result] = await connection.query(
    `INSERT INTO Population
     (populationID, surveyID, healthStatus, remarks) 
     VALUES ?`,
    [familyMemberValues]
  );
  
  return result;
};

export const addPersonalInfo = async (populationID, familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;
  
  const familyMemberValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    member.firstName,
    member.middleName,
    member.lastName,
    member.suffix,
    member.birthdate,
    member.age || member.formattedAge,
    member.sex,
    member.birthplace,
    member.religion,
    member.civilStatus,
    member.relationToFamilyHead,
    member.isOSY,
    member.inSchool,
    member.outOfTown,
    member.isOFW,
    member.isPWD,
    member.isSoloParent
  ]);
  
  const [result] = await connection.query(
    `INSERT INTO PersonalInformation
     ( populationID, 
       firstName, middleName, lastName, suffix,
       birthdate, age, sex, birthplace,
       religion, civilStatus, relationToFamilyHead,
       isOSY, inSchool, outOfTown, isOFW, isPWD, isSoloParent ) 
     VALUES ?`,
    [familyMemberValues]
  );
  
  return result;
};

export const addProfessionalInfo = async (populationID, familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;
  
  const familyMemberValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    member.educationalAttainment,
    member.skills,
    member.occupation,
    member.employmentType,
    parseFloat(member.monthlyIncome.replace(/,/g, '').trim()) || 0,
  ]);
  
  const [result] = await connection.query(
    `INSERT INTO ProfessionalInformation
     (  populationID, 
        educationalAttainment,
        skills,
        occupation,
        employmentType,
        monthlyIncome ) 
     VALUES ?`,
    [familyMemberValues]
  );
  
  return result;
};

export const addContactInfo = async (populationID, familyMembers, houseLocation, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;
  
  // Prepare the family member data for insertion
  const familyMemberValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    member.contactNumber,
    houseLocation.houseStreet,
    houseLocation.barangay,
    'Itbayat',
    'Batanes'
  ]);
  
  // Insert family members contact info
  const [result] = await connection.query(
    `INSERT INTO ContactInformation
     (populationID, mobileNumber, street, barangay, municipality, province) 
     VALUES ?`,
    [familyMemberValues]
  );
  
  return result;
};




export const addGovernmentID = async (populationID, familyMembers, connection) => {
  
  if (!familyMembers || familyMembers.length === 0) return null;
  
  const familyMemberValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    member.philhealthNumber || null
  ]);
  
  const [result] = await connection.query(
    `INSERT INTO GovernmentIDs
     ( populationID, 
       philhealthNumber ) 
     VALUES ?`,
    [familyMemberValues]
  );
  
  return result;
};

export const addGovernmentAffiliation = async (populationID, familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;
  
  const affiliationValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    member.isAffiliated,
    (!member.asOfficer || 
      member.asOfficer === 'N/A' || 
      member.asOfficer.trim() === ''
    )
      ? null
      : member.asOfficer.split('T')[0],
    (!member.asMember || 
      member.asMember === 'N/A' || 
      member.asMember.trim() === ''
    )
      ? null
      : member.asMember.split('T')[0],
    member.organizationAffiliated
  ]);
  
  if(affiliationValues.length > 0) {
    const [result] = await connection.query(
      `INSERT INTO GovernmentAffiliation
       (populationID, isAffiliated, asOfficer, asMember, organizationAffiliated) 
       VALUES ?`,
      [affiliationValues]
    );

    return result;
  }

  return null;
};

export const addNonIvatan = async (populationID, familyMembers, connection) => {

  if (!familyMembers || familyMembers.length === 0) return null;
  
  const nonIvatanValues = familyMembers.map((member, index) => [
    `${populationID}-${index + 1}`,
    member.isIpula,
    member.settlementDetails,
    member.ethnicity,
    member.placeOfOrigin,
    member.isTransient ,
    member.houseOwner,
    member.transientRegistered,
    (!member.transientDateRegistered || 
      member.transientDateRegistered === 'N/A' || 
      member.transientDateRegistered.trim() === ''
    )
      ? null
      : member.transientDateRegistered.split('T')[0]
  ]);
  
  if (nonIvatanValues.length > 0) {
    const [result] = await connection.query(
      `INSERT INTO NonIvatan
       (populationID, isIpula, settlementDetails, ethnicity, placeOfOrigin,
        isTransient, houseOwner, isRegistered, dateRegistered) 
       VALUES ?`,
      [nonIvatanValues]
    );

    return result;
  } 
  
  return null;
};


// EXPENSES
export const addFoodExpenses = async (surveyId, foodExpenses, connection) => {

  if (!surveyId || !foodExpenses.expenses) return null;

  const expenses = foodExpenses.expenses;
  
  // Convert string values to numbers and handle commas
  const rice = parseFloat(expenses.Rice?.replace(/,/g, '').trim()) || 0;
  const viand = parseFloat(expenses.Viand?.replace(/,/g, '').trim()) || 0;
  const sugar = parseFloat(expenses.Sugar?.replace(/,/g, '').trim()) || 0;
  const milk = parseFloat(expenses.Milk?.replace(/,/g, '').trim()) || 0;
  const oil = parseFloat(expenses.Oil?.replace(/,/g, '').trim()) || 0;
  const snacks = parseFloat(expenses.Snacks?.replace(/,/g, '').trim()) || 0;
  const otherFood = parseFloat(expenses["Other Food"]?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `INSERT INTO FoodExpenses
     (surveyID, rice, viand, sugar, milk, oil, snacks, otherFood) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      surveyId,
      rice,
      viand,
      sugar,
      milk,
      oil,
      snacks,
      otherFood
    ]
  );
  
  return true;
};

export const addEducationExpenses = async (surveyId, educationExpenses, connection) => {

  if (!surveyId || !educationExpenses.expenses) return null;

  const expenses = educationExpenses.expenses;

  const tuitionFees = parseFloat(expenses['Tuition Fees']?.replace(/,/g, '').trim()) || 0;
  const miscellaneousFees = parseFloat(expenses['Miscellaneous Fees']?.replace(/,/g, '').trim()) || 0;
  const schoolSupplies = parseFloat(expenses['School Supplies']?.replace(/,/g, '').trim()) || 0;
  const transportation = parseFloat(expenses.Transportation?.replace(/,/g, '').trim()) || 0;
  const rentDormitory = parseFloat(expenses['Rent/Dormitory']?.replace(/,/g, '').trim()) || 0;
  const otherEducation = parseFloat(expenses['Other Education']?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `INSERT INTO EducationExpenses
     (surveyID, tuitionFees, miscellaneousFees, schoolSupplies, transportation, rentDormitory, otherEducation) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      surveyId,
      tuitionFees,
      miscellaneousFees,
      schoolSupplies,
      transportation,
      rentDormitory,
      otherEducation
    ]
  );

  return true;
};

export const addFamilyExpenses = async (surveyId, familyExpenses, connection) => {

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
    `INSERT INTO FamilyExpenses
     (surveyID, firewood, gasTank, caregivers, laundry, hygiene, clothings, others) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      surveyId,
      firewood,
      gasTank,
      caregivers,
      laundry,
      hygiene,
      clothings,
      others
    ]
  );

  return true;
};

export const addMonthlyExpenses = async (surveyId, monthlyExpenses, connection) => {

  if (!surveyId || !monthlyExpenses.expenses) return null;

  const expenses = monthlyExpenses.expenses;

  const electricBill = parseFloat(expenses['Electric Bill']?.replace(/,/g, '').trim()) || 0;
  const waterBill = parseFloat(expenses['Water Bill']?.replace(/,/g, '').trim()) || 0;
  const subscription = parseFloat(expenses.Subscription?.replace(/,/g, '').trim()) || 0;
  const mobileLoad = parseFloat(expenses['Mobile Load']?.replace(/,/g, '').trim()) || 0;
  const others = parseFloat(expenses.Others?.replace(/,/g, '').trim()) || 0;

  await connection.query(
    `INSERT INTO MonthlyExpenses  
     (surveyID, electricBill, waterBill, subscription, mobileLoad, others) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      surveyId,
      electricBill,
      waterBill,
      subscription,
      mobileLoad,
      others
    ]
  );

  return true;
};


export const addHouseInfo = async (surveyId, houseInfo, houseLocation, connection) => {

  if (!houseInfo) return null;

  await connection.query(
    `INSERT INTO HouseInformation
     (surveyID, houseCondition, houseStructure, latitude, longitude, houseStreet, barangay, municipality) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      surveyId,
      houseInfo.houseCondition,
      houseInfo.houseStructure,
      houseLocation.latitude,
      houseLocation.longitude,
      houseLocation.houseStreet,
      houseLocation.barangay,
      houseLocation.municipality
    ]
  );
};

export const addHouseImage = async (surveyId, houseTitle, houseImageBuffer, connection) => {

  if (!houseImageBuffer) {
    console.log("No image buffer provided for image:", houseTitle);
    return null;
  }

  try {
    await connection.query(
      `INSERT INTO HouseImage
       (surveyID, houseImage, houseTitle) 
       VALUES (?, ?, ?)`,
      [
        surveyId,
        houseImageBuffer,
        houseTitle || 'House Image'
      ]
    );
    console.log(`Image "${houseTitle}" added successfully`);
  } catch (error) {
    console.error(`Error adding house image "${houseTitle}":`, error);
    throw error;
  }
};

export const addWaterInfo = async (surveyId, water, connection) => {
  
  if (!water) return null;
  
  await connection.query(
    `INSERT INTO WaterInformation
     (surveyID, waterAccess, potableWater, waterSources) 
     VALUES (?, ?, ?, ?)`,
    [
      surveyId,
      water.waterAccess,
      water.potableWater,
      water.waterSources
    ]
  );
};

export const addFarmlots = async (surveyId, farmlots, connection) => {
  if (!farmlots) return null;

  await connection.query(
    `INSERT INTO Farmlots
     (surveyID, cultivation, pastureland, forestland) 
     VALUES (?, ?, ?, ?)`,
    [
      surveyId,
      farmlots.cultivation || 0,
      farmlots.pastureland || 0,
      farmlots.forestland || 0
    ]
  );
};

export const addCommunityIssues = async (surveyId, communityIssues, connection) => {

  if (!communityIssues || !communityIssues.issues) {
    console.log('No community issues data to insert');
    return null;
  }

  await connection.query(
    `INSERT INTO CommunityIssues (surveyID, issues) VALUES (?, ?)`,
    [ surveyId, communityIssues.issues ]
  );
};



export const addLivestock = async (surveyId, livestock, connection) => {

  if (!livestock || Object.keys(livestock).length === 0) {
    console.log('No livestock data to insert');
    return null;
  }
  
  const livestockValues = Object.entries(livestock).map(([animal, data]) => {
    
    const totalNumber = parseInt(data.number) || 0;
    const own = parseInt(data.own) || 0;
    const dispersal = parseInt(data.dispersal) || 0;
    
    return [
      surveyId,
      animal,
      totalNumber,
      own,
      dispersal
    ];
  });

  if (livestockValues.length > 0) {
    await connection.query(
      `INSERT INTO Livestock 
      (surveyID, livestock, totalNumber, own, dispersal) 
      VALUES ?`,
      [livestockValues]
    );
  }
};

export const addCropsPlanted = async (surveyId, cropsPlanted, connection) => {

  if (!cropsPlanted || !cropsPlanted.crops || Object.keys(cropsPlanted.crops).length === 0) {
    console.log('No crops planted data to insert');
    return null;
  }

  const cropsPlantedValues = Object.entries(cropsPlanted.crops)
    .filter(([crop, size]) => parseInt(size) > 0)
    .map(([crop, size]) => [
      surveyId,
      crop,
      parseInt(size)
    ]);

  if (cropsPlantedValues.length > 0) {
    await connection.query(
      `INSERT INTO CropsPlanted (surveyID, crops, size) VALUES ?`,
      [ cropsPlantedValues ]
    );
  }
};

export const addFruitBearingTree = async (surveyId, treeData, connection) => {

  if (!treeData || !treeData.tree || Object.keys(treeData.tree).length === 0) {
    console.log('No fruit bearing tree data to insert');
    return null;
  }

  const fruitBearingTreeValues = Object.entries(treeData.tree)
    .filter(([tree, totalNumber]) => parseInt(totalNumber) > 0)
    .map(([tree, totalNumber]) => [
      surveyId,
      tree,
      parseInt(totalNumber)
    ]);

    if(fruitBearingTreeValues.length > 0) {
      await connection.query(
        `INSERT INTO FruitBearingTree (surveyID, tree, totalNumber) VALUES ?`,
        [ fruitBearingTreeValues ]
      );
    }
};

export const addFamilyResources = async (surveyId, resourcesData, connection) => {

  if (!resourcesData || !resourcesData.resources || Object.keys(resourcesData.resources).length === 0) {
    console.log('No family resources data to insert');
    return null;
  }

  const familyResourcesValues = Object.entries(resourcesData.resources)
    .filter(([resource, amount]) => parseFloat(amount.replace(/,/g, '').trim()) > 0)
    .map(([resource, amount]) => [
      surveyId,
      resource,
      parseFloat(amount.replace(/,/g, '').trim())
    ]);

  if(familyResourcesValues.length > 0) {
    await connection.query(
      `INSERT INTO FamilyResources (surveyID, resources, amount) VALUES ?`,
      [ familyResourcesValues ]
    );
  }
};

export const addAppliancesOwn = async (surveyId, appliancesData, connection) => {

  if (!appliancesData || !appliancesData.appliances || Object.keys(appliancesData.appliances).length === 0) {
    console.log('No appliances data to insert');
    return null;
  }

  const appliancesOwnValues = Object.entries(appliancesData.appliances)
    .filter(([appliance, totalAppliances]) => parseInt(totalAppliances) > 0)
    .map(([appliance, totalAppliances]) => [
      surveyId,
      appliance,
      parseInt(totalAppliances)
    ]);

  if(appliancesOwnValues.length > 0) {
    await connection.query(
      `INSERT INTO AppliancesOwn (surveyID, applianceName, totalOwned) VALUES ?`,
      [ appliancesOwnValues ]
    );
  }
};

export const addAmenities = async (surveyId, amenities, connection) => {

  if (!amenities || !amenities.amenities || Object.keys(amenities.amenities).length === 0) {
    console.log('No amenities data to insert');
    return null;
  }

  const amenitiesValues = Object.entries(amenities.amenities)
    .filter(([amenity, totalAmenities]) => parseInt(totalAmenities) > 0)
    .map(([amenity, totalAmenities]) => [
      surveyId,
      amenity,
      parseInt(totalAmenities)
    ]);

  if(amenitiesValues.length > 0) {
    await connection.query(
      `INSERT INTO Amenities (surveyID, amenityName, totalOwned) VALUES ?`,
      [ amenitiesValues ]
    );
  }
};

export const addServiceAvailed = async (surveyId, serviceAvailed, connection) => {

  if (!serviceAvailed || serviceAvailed.length === 0) return null;
  
  const serviceAvailedValues = serviceAvailed.map(service => [
    surveyId,
    service.dateServiceAvailed,
    service.ngoName,
    service.serviceAvailed,
    parseInt(service.maleServed),
    parseInt(service.femaleServed),
    parseInt(service.totalServed),
    service.howServiceHelp
  ]);
  
  if(serviceAvailedValues.length > 0) {
    const [result] = await connection.query(
      `INSERT INTO ServiceAvailed
       (surveyID, dateServiceAvailed, ngoName, serviceAvailed,
        maleServed, femaleServed, totalServed, howServiceHelp) 
       VALUES ?`,
      [serviceAvailedValues]
    );
    
    return result;
  }

  return null;
};









