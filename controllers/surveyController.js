// controllers/surveyController.js - Survey submission logic
import pool from '../config/database.js';
import * as surveyModel from '../models/surveyModel.js';
import * as updateSurveyModel from '../models/updateSurveyModel.js';

export const newSurveyID = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const surveyId = await surveyModel.generateSurveyId(connection);
    
    res.status(200).json({ 
      success: true, 
      surveyId: surveyId 
    });
    
  } catch (error) {
    console.error('Error generating survey ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating survey ID', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const submitSurvey = async (req, res) => {

  const connection = await pool.getConnection();
  
  try {

    await connection.beginTransaction();

    const surveyData = JSON.parse(req.body.surveyData);   
    const surveyID = await surveyModel.generateSurveyId(connection);
    const populationID = `P${surveyID}`;

    console.log('SUBMITTING SURVEY APPLICATION');
    console.log('SURVEY ID:', surveyID);
    
    console.log("Inserting Survey Details");
    await surveyModel.createSurvey(surveyID, surveyData.surveyData, connection);

    console.log("Inserting Household");
    await surveyModel.addHousehold(surveyID, surveyData.surveyData, connection);
    

    // POPULATION
    console.log("Inserting Population");
    await surveyModel.addPopulation(populationID, surveyID, surveyData.familyMembers, connection);

    console.log("Inserting Personal Info");
    await surveyModel.addPersonalInfo(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Professional Info");
    await surveyModel.addProfessionalInfo(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Contact Info");
    await surveyModel.addContactInfo(populationID, surveyData.familyMembers, surveyData.houseLocation, connection);

    console.log("Inserting Government IDs");
    await surveyModel.addGovernmentID(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Affiliation");
    await surveyModel.addGovernmentAffiliation(populationID, surveyData.familyMembers, connection);

    console.log("Inserting Ipula/Non-Ivatan");
    await surveyModel.addNonIvatan(populationID, surveyData.familyMembers, connection);


    // EXPENSES
    console.log("Inserting Food Expenses");
    await surveyModel.addFoodExpenses(surveyID, surveyData.foodExpenses, connection);

    console.log("Inserting Education Expenses");
    await surveyModel.addEducationExpenses(surveyID, surveyData.educationExpenses, connection);

    console.log("Inserting Family Expenses");
    await surveyModel.addFamilyExpenses(surveyID, surveyData.familyExpenses, connection);

    console.log("Inserting Monthly Expenses");
    await surveyModel.addMonthlyExpenses(surveyID, surveyData.monthlyExpenses, connection);
    

    console.log("Inserting House Info");
    await surveyModel.addHouseInfo(surveyID, surveyData.houseInfo, surveyData.houseLocation, connection);

    console.log("Inserting House Images");

    if (req.files && req.files.length > 0) {

      console.log(`Processing ${req.files.length} uploaded images`);
      
      // Get image titles from the form data
      const imageTitles = surveyData.houseInfo.houseImages?.map(img => img.title) || [];
      
      // Process each image
      for (let i = 0; i < req.files.length; i++) {
        const imageFile = req.files[i];
        const imageTitle = i < imageTitles.length ? imageTitles[i] : `House Image ${i+1}`;
        
        await surveyModel.addHouseImage(
          surveyID,
          imageTitle,
          imageFile.buffer,
          connection
        );
      }
    } else {
      console.log("No images to process");
    }
    
    console.log("Inserting Water Info");
    await surveyModel.addWaterInfo(surveyID, surveyData.waterInfo, connection);

    console.log("Inserting Livestock");
    await surveyModel.addLivestock(surveyID, surveyData.livestock, connection);

    console.log("Inserting FarmLots");
    await surveyModel.addFarmlots(surveyID, surveyData.farmlots, connection);

    console.log("Inserting Crops Planted");
    await surveyModel.addCropsPlanted(surveyID, surveyData.cropsPlanted, connection);

    console.log("Inserting Fruit Bearing Tree");
    await surveyModel.addFruitBearingTree(surveyID, surveyData.fruitBearingTree, connection);

    console.log("Inserting Family Resources");
    await surveyModel.addFamilyResources(surveyID, surveyData.familyResources, connection);

    console.log("Inserting Appliances Own");
    await surveyModel.addAppliancesOwn(surveyID, surveyData.appliancesOwn, connection);

    console.log("Inserting Amenities Own");
    await surveyModel.addAmenities(surveyID, surveyData.amenitiesOwn, connection);

    console.log("Inserting Community Issues");
    await surveyModel.addCommunityIssues(surveyID, surveyData.communityIssues, connection);

    console.log("Inserting Service Availed");
    await surveyModel.addServiceAvailed(surveyID, surveyData.serviceAvailed, connection);


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Survey submitted successfully',
      surveyID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting survey:', {
      message: error.message,
      stack: error.stack,
      //requestBody: JSON.stringify(req.body, null, 2)
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error submitting survey', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};

export const updateSurvey = async (req, res) => {
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const surveyData = JSON.parse(req.body.surveyData);
    console.log('SURVEY DATA:', surveyData);
    const surveyID = surveyData.surveyData.surveyID;
    const householdID = surveyData.surveyData.householdID;
    const populationID = `P${surveyID}`;
    const foodExpensesID = surveyData.foodExpenses.foodExpensesID;
    const educationExpensesID = surveyData.educationExpenses.educationExpensesID;
    const familyExpensesID = surveyData.familyExpenses.familyExpensesID;
    const monthlyExpensesID = surveyData.monthlyExpenses.monthlyExpensesID;
    const houseInfoID = surveyData.houseLocation.houseInfoID;
    const hasHouseImageID = surveyData.houseInfo?.houseImages?.some(img => img.houseImageID != null);
    const waterInfoID = surveyData.waterInfo.waterInfoID;
    const farmlotID = surveyData.farmlots.farmlotID;
    const communityIssuesID = surveyData.communityIssues.communityIssuesID;

    const isCreating = (IDtype, tableName) => surveyData[tableName].every(
      member => member[IDtype] === null || member[IDtype] === undefined
    );
    

    console.log("Updating Survey Details");
    await updateSurveyModel.updateSurvey(surveyData.surveyData, connection);


    if(householdID === null || householdID === undefined) {
      console.log("Creating Household");
      await surveyModel.addHousehold(surveyData.surveyData, connection);
    } else {
      console.log("Updating Household");
      await updateSurveyModel.updateHousehold(surveyData.surveyData, connection);
    }

    if(isCreating('populationID', 'familyMembers')) {
      console.log("Creating Population");
      await surveyModel.addPopulation(populationID, surveyID, surveyData.familyMembers, connection);
    } else {
      console.log("Updating Population");
      await updateSurveyModel.updatePopulation(surveyData.familyMembers, connection);
    }
    
    if(isCreating('personalInfoID', 'familyMembers')) {
      console.log("Creating Personal Info");
      await surveyModel.addPersonalInfo(populationID, surveyData.familyMembers, connection);
    } else {
      console.log("Updating Personal Info");
      await updateSurveyModel.updatePersonalInfo(surveyData.familyMembers, connection);
    }

    if(isCreating('professionalInfoID', 'familyMembers')) {
      console.log("Creating Professional Info");
      await surveyModel.addProfessionalInfo(populationID, surveyData.familyMembers, connection);
    } else {
      console.log("Updating Professional Info");
      await updateSurveyModel.updateProfessionalInfo(surveyData.familyMembers, connection);
    }

    if(isCreating('contactInfoID', 'familyMembers')) {
      console.log("Creating Contact Info");
      await surveyModel.addContactInfo(populationID, surveyData.familyMembers, surveyData.houseLocation, connection);
    } else {
      console.log("Updating Contact Info");
      await updateSurveyModel.updateContactInfo(surveyData.familyMembers, surveyData.houseLocation, connection);
    }

    if(isCreating('governmentID', 'familyMembers')) {
      console.log("Creating Government ID");
      await surveyModel.addGovernmentID(populationID, surveyData.familyMembers, connection);
    } else {
      console.log("Updating Government ID");
      await updateSurveyModel.updateGovernmentID(surveyData.familyMembers, connection);
    }

    if(isCreating('governmentAffiliationID', 'familyMembers')) {
      console.log("Creating Government Affiliation");
      await surveyModel.addGovernmentAffiliation(populationID, surveyData.familyMembers, connection);
    } else {
      console.log("Updating Government Affiliation");
      await updateSurveyModel.updateGovernmentAffiliation(surveyData.familyMembers, connection);
    }

    if(isCreating('nonIvatanID', 'familyMembers')) {
      console.log("Creating Ipula/Non-Ivatan");
      await surveyModel.addNonIvatan(populationID, surveyData.familyMembers, connection);
    } else {
      console.log("Updating Ipula/Non-Ivatan");
      await updateSurveyModel.updateNonIvatan(surveyData.familyMembers, connection);
    }

    
    if(foodExpensesID === null || foodExpensesID === undefined) {
      console.log("Creating Food Expenses");
      await surveyModel.addFoodExpenses(surveyID, surveyData.foodExpenses, connection);
    } else {
      console.log("Updating Food Expenses");
      await updateSurveyModel.updateFoodExpenses(surveyID, surveyData.foodExpenses, connection);
    }

    if(educationExpensesID === null || educationExpensesID === undefined) {
      console.log("Creating Education Expenses");
      await surveyModel.addEducationExpenses(surveyID, surveyData.educationExpenses, connection);
    } else {
      console.log("Updating Education Expenses");
      await updateSurveyModel.updateEducationExpenses(surveyID, surveyData.educationExpenses, connection);
    }

    if(familyExpensesID === null || familyExpensesID === undefined) {
      console.log("Creating Family Expenses");
      await surveyModel.addFamilyExpenses(surveyID, surveyData.familyExpenses, connection);
    } else {
      console.log("Updating Family Expenses");
      await updateSurveyModel.updateFamilyExpenses(surveyID, surveyData.familyExpenses, connection);
    }

    if(monthlyExpensesID === null || monthlyExpensesID === undefined) {
      console.log("Creating Monthly Expenses");
      await surveyModel.addMonthlyExpenses(surveyID, surveyData.monthlyExpenses, connection);
    } else {
      console.log("Updating Monthly Expenses");
      await updateSurveyModel.updateMonthlyExpenses(surveyID, surveyData.monthlyExpenses, connection);
    }

    if(houseInfoID === null || houseInfoID === undefined) {
      console.log("Creating House Info");
      await surveyModel.addHouseInfo(surveyID, surveyData.houseInfo, surveyData.houseLocation, connection);
    } else {
      console.log("Updating House Info");
      await updateSurveyModel.updateHouseInfo(surveyData.houseInfo, surveyData.houseLocation, connection);
    }
    

    if(req.files && req.files.length > 0) {

      console.log(`Processing ${req.files.length} uploaded images`);

      const newImageTitles = surveyData.houseInfo.houseImages
        ?.filter(img => !img.houseImageID)
        ?.map(img => img.title) || [];
      
      // Process each image
      for (let i = 0; i < req.files.length; i++) {
        const imageFile = req.files[i];
        const imageTitle = i < newImageTitles.length ? newImageTitles[i] : `House Image ${i+1}`;
        
        await surveyModel.addHouseImage(
          surveyID,
          imageTitle,
          imageFile.buffer,
          connection
        );
      }
    } else {
      console.log("No images to process");
    }
    
    if(hasHouseImageID) {
      console.log("Updating House Image");
      await updateSurveyModel.updateHouseImage(surveyData.houseInfo, surveyData.houseLocation, connection);
    }

    if(waterInfoID === null || waterInfoID === undefined) {
      console.log("Creating Water Info");
      await surveyModel.addWaterInfo(surveyID, surveyData.waterInfo, connection);
    } else {
      console.log("Updating Water Info");
      await updateSurveyModel.updateWaterInfo(surveyID, surveyData.waterInfo, connection);
    }

    if(farmlotID === null || farmlotID === undefined) {
      console.log("Creating Farmlots");
      await surveyModel.addFarmlots(surveyID, surveyData.farmlots, connection);
    } else {
      console.log("Updating Farmlots");
      await updateSurveyModel.updateFarmlots(surveyID, surveyData.farmlots, connection);
    }

    if(communityIssuesID === null || communityIssuesID === undefined) {
      console.log("Creating Community Issues");
      await surveyModel.addCommunityIssues(surveyID, surveyData.communityIssues, connection);
    } else {
      console.log("Updating Community Issues");
      await updateSurveyModel.updateCommunityIssues(surveyID, surveyData.communityIssues, connection);
    }

    if(isCreating('serviceAvailedID', 'serviceAvailed')) {
      console.log("Creating Service Availed");
      await surveyModel.addServiceAvailed(surveyID, surveyData.serviceAvailed, connection);
    } else {
      console.log("Updating Service Availed");
      await updateSurveyModel.updateServiceAvailed(surveyID, surveyData.serviceAvailed, connection);
    }

    const isCreatingObject = (IDtype, tableName) =>
      Object.values(surveyData[tableName]).every(
        member => member[IDtype] === null || member[IDtype] === undefined
      );

    if(isCreatingObject('livestockID', 'livestock')) {
      console.log("Creating Livestock");
      await surveyModel.addLivestock(surveyID, surveyData.livestock, connection);
    } else {
      console.log("Updating Livestock");
      await updateSurveyModel.updateLivestock(surveyID, surveyData.livestock, connection);
    }

    if(!surveyData.cropsPlanted) {
      console.log("Creating CropsPlanted");
      await surveyModel.addCropsPlanted(surveyID, surveyData.cropsPlanted, connection);
    } else {
      console.log("Updating CropsPlanted");
      await updateSurveyModel.updateCropsPlanted(surveyID, surveyData.cropsPlanted, connection);
    }

    if(!surveyData.fruitBearingTree) {
      console.log("Creating FruitBearingTree");
      await surveyModel.addFruitBearingTree(surveyID, surveyData.fruitBearingTree, connection);
    } else {
      console.log("Updating FruitBearingTree");
      await updateSurveyModel.updateFruitBearingTree(surveyID, surveyData.fruitBearingTree, connection);
    }

    if(!surveyData.familyResources) {
      console.log("Creating FamilyResources");
      await surveyModel.addFamilyResources(surveyID, surveyData.familyResources, connection);
    } else {
      console.log("Updating FamilyResources");
      await updateSurveyModel.updateFamilyResources(surveyID, surveyData.familyResources, connection);
    }
    
    if(!surveyData.appliancesOwn) {
      console.log("Creating AppliancesOwn");
      await surveyModel.addAppliancesOwn(surveyID, surveyData.appliancesOwn, connection);
    } else {
      console.log("Updating AppliancesOwn");
      await updateSurveyModel.updateAppliancesOwn(surveyID, surveyData.appliancesOwn, connection);
    }

    if(!surveyData.amenitiesOwn) {
      console.log("Creating Amenities");
      await surveyModel.addAmenities(surveyID, surveyData.amenitiesOwn, connection);
    } else {
      console.log("Updating Amenities");
      await updateSurveyModel.updateAmenities(surveyID, surveyData.amenitiesOwn, connection);
    }


    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: 'Survey updated successfully',
      surveyID 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating survey:', {
      message: error.message,
      stack: error.stack,
      //requestBody: JSON.stringify(req.body, null, 2)
    });

    res.status(500).json({ 
      success: false, 
      message: 'Error updating survey', 
      error: error.message,
      details: error.stack
    });

  } finally {
    connection.release();
  }
};

export const listSurvey = async (req, res) => {

  const { username, position } = req.params;

  console.log('Position', position);

  try {
    let query = `
      SELECT 
        sr.surveyID,
        sr.respondent,
        sr.interviewer,
        sr.surveyDate,
        sr.barangay
      FROM 
        Surveys sr
    `;

    const params = [];

    if (position === 'Barangay Official') {
      query += ` WHERE sr.interviewer = ?`;
      params.push(username);
    }

    query += ` ORDER BY sr.surveyDate DESC`;

    const [rows] = await pool.query(query, params);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching survey data', 
      error: error.message 
    });
  }
}


export const viewSurvey = async (req, res) => {
  const connection = await pool.getConnection();
  const surveyID = req.params.surveyID || req.query.surveyID;

  try {

    console.log('Retrieving Surveys');
    const [surveyResponses] = await connection.query(`
      SELECT 
        s.surveyID,
        s.respondent,
        s.interviewer,
        s.surveyDate,
        s.barangay,
        s.municipality,
        h.householdID,
        h.familyClass,
        h.monthlyIncome,
        h.irregularIncome,
        h.familyIncome
      FROM Surveys s
      LEFT JOIN Households h ON s.surveyID = h.surveyID
      WHERE s.surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Population');
    const [familyProfile] = await connection.query(`
      SELECT 
        p.populationID,
        p.surveyID,
        p.healthStatus,
        p.remarks,
        pi.isOSY,
        pi.inSchool,
        pi.outOfTown,
        pi.isOFW,
        pi.isPWD,
        pi.isSoloParent,

        pi.personalInfoID,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.suffix,
        pi.birthdate,
        pi.age,
        pi.sex,
        pi.birthplace,
        pi.religion,
        pi.civilStatus,
        pi.relationToFamilyHead,

        prof.professionalInfoID,
        prof.educationalAttainment,
        prof.skills,
        prof.occupation,
        prof.company,
        prof.employmentStatus,
        prof.employmentCategory,
        prof.employmentType,
        prof.monthlyIncome,
        prof.annualIncome,

        ci.contactInfoID,
        ci.street,
        ci.barangay,
        ci.municipality,
        ci.province,
        ci.region,
        ci.mobileNumber,
        ci.landlineNumber,
        ci.emailAddress,

        gi.sssNumber,
        gi.gsisNumber,
        gi.pagibigNumber,
        gi.psnNumber,
        gi.philhealthNumber,

        ga.governmentAffiliationID,
        ga.isAffiliated,
        ga.asOfficer,
        ga.asMember,
        ga.organizationAffiliated,

        ni.nonIvatanID,
        ni.isIpula,
        ni.settlementDetails,
        ni.ethnicity,
        ni.placeOfOrigin,
        ni.isTransient,
        ni.houseOwner,
        ni.isRegistered,
        ni.dateRegistered

      FROM Population p
      LEFT JOIN PersonalInformation pi ON p.populationID = pi.populationID
      LEFT JOIN ProfessionalInformation prof ON p.populationID = prof.populationID
      LEFT JOIN ContactInformation ci ON p.populationID = ci.populationID
      LEFT JOIN GovernmentIDs gi ON p.populationID = gi.populationID
      LEFT JOIN GovernmentAffiliation ga ON p.populationID = ga.populationID
      LEFT JOIN NonIvatan ni ON p.populationID = ni.populationID

      WHERE p.surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Food Expenses');
    const [foodExpenses] = await connection.query(`
      SELECT * FROM FoodExpenses WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Education Expenses');
    const [educationExpenses] = await connection.query(`
      SELECT * FROM EducationExpenses WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Family Expenses');
    const [familyExpenses] = await connection.query(`
      SELECT * FROM FamilyExpenses WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: Monthly Expenses');
    const [monthlyExpenses] = await connection.query(`
      SELECT * FROM MonthlyExpenses WHERE surveyID = ?
    `, [surveyID]);



    console.log('Retrieving House Info');
    const [houseInformation] = await connection.query(`
      SELECT * FROM HouseInformation WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving: House Images');
    const [rows] = await connection.query(`
      SELECT * FROM HouseImage WHERE surveyID = ?
    `, [surveyID]);

    const houseImages = rows.map(row => {
      let processedRow = {...row};

      if (row.houseImage) {
        processedRow.houseImage = `data:image/jpeg;base64,${Buffer.from(row.houseImage).toString('base64')}`;
      }
      
      return processedRow;
    });

    console.log('Retrieving Water Info');
    const [waterInformation] = await connection.query(`
      SELECT * FROM WaterInformation WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Livestock');
    const [livestock] = await connection.query(`
      SELECT * FROM Livestock WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Farm Lots');
    const [farmlots] = await connection.query(`
      SELECT * FROM Farmlots WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Crops Planted');
    const [cropsPlanted] = await connection.query(`
      SELECT * FROM CropsPlanted WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Fruit Bearing Tree');
    const [fruitBearingTree] = await connection.query(`
      SELECT * FROM FruitBearingTree WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Family Resources');
    const [familyResources] = await connection.query(`
      SELECT * FROM FamilyResources WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Appliances');
    const [appliancesOwn] = await connection.query(`
      SELECT * FROM AppliancesOwn WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Amenities');
    const [amenities] = await connection.query(`
      SELECT * FROM Amenities WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Issues');
    const [communityIssues] = await connection.query(`
      SELECT * FROM CommunityIssues WHERE surveyID = ?
    `, [surveyID]);

    console.log('Retrieving Service Availed');
    const [serviceAvailed] = await connection.query(`
      SELECT * FROM ServiceAvailed WHERE surveyID = ?
    `, [surveyID]);



    res.status(200).json({
      surveyResponses,
      familyProfile,
      foodExpenses,
      educationExpenses,
      familyExpenses,
      monthlyExpenses,
      houseInformation,
      houseImages,
      waterInformation,
      farmlots,
      communityIssues, 
      livestock,
      cropsPlanted,
      fruitBearingTree,
      familyResources,
      appliancesOwn,
      amenities,
      serviceAvailed
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

export const deleteSurvey = async (req, res) => {
  const connection = await pool.getConnection();
  const surveyID = req.params.surveyID;

  try {
    await connection.beginTransaction();

    // 1. Get populationID(s) related to the surveyID
    const [populationRows] = await connection.query(
      'SELECT populationID FROM Population WHERE surveyID = ?',
      [surveyID]
    );

    // You might have multiple population records for one survey
    const populationIDs = populationRows.map(row => row.populationID);

    // 2. Delete related tables that use surveyID
    await connection.query('DELETE FROM ServiceAvailed WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Amenities WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM AppliancesOwn WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FamilyResources WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FruitBearingTree WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM CropsPlanted WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Livestock WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Farmlots WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM CommunityIssues WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM WaterInformation WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM HouseImage WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM HouseInformation WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM MonthlyExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FamilyExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM EducationExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM FoodExpenses WHERE surveyID = ?', [surveyID]);
    await connection.query('DELETE FROM Households WHERE surveyID = ?', [surveyID]);

    // 3. Delete all population-related records
    for (const populationID of populationIDs) {
      await connection.query('DELETE FROM NonIvatan WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM GovernmentAffiliation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM ContactInformation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM ProfessionalInformation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM GovernmentIDs WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM PersonalInformation WHERE populationID = ?', [populationID]);
      await connection.query('DELETE FROM Population WHERE populationID = ?', [populationID]);
    }

    // 4. Delete survey
    await connection.query('DELETE FROM Surveys WHERE surveyID = ?', [surveyID]);

    await connection.commit();
    res.status(200).json({
      success: true,
      message: 'Survey and related population data deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting survey',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

