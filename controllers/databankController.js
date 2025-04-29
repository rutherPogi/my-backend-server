import pool from '../config/database.js';

export const getSegregation = async (req, res) => {
  try {
    const { sex } = req.params;

    const [rows] = await pool.query(`
      WITH age_brackets AS (
        SELECT '0-11 months' AS \`Age Bracket\`
        UNION ALL
        SELECT CAST(n AS CHAR) FROM (
          SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL 
          SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL 
          SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL 
          SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL 
          SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL 
          SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL 
          SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL 
          SELECT 35 UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL 
          SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL 
          SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL 
          SELECT 50 UNION ALL SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL 
          SELECT 55 UNION ALL SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL 
          SELECT 60 UNION ALL SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL SELECT 64 UNION ALL 
          SELECT 65 UNION ALL SELECT 66 UNION ALL SELECT 67 UNION ALL SELECT 68 UNION ALL SELECT 69 UNION ALL 
          SELECT 70 UNION ALL SELECT 71 UNION ALL SELECT 72 UNION ALL SELECT 73 UNION ALL SELECT 74 UNION ALL 
          SELECT 75 UNION ALL SELECT 76 UNION ALL SELECT 77 UNION ALL SELECT 78 UNION ALL SELECT 79 UNION ALL 
          SELECT 80 UNION ALL SELECT 81 UNION ALL SELECT 82 UNION ALL SELECT 83 UNION ALL SELECT 84 UNION ALL 
          SELECT 85 UNION ALL SELECT 86 UNION ALL SELECT 87 UNION ALL SELECT 88 UNION ALL SELECT 89 UNION ALL 
          SELECT 90 UNION ALL SELECT 91 UNION ALL SELECT 92 UNION ALL SELECT 93 UNION ALL SELECT 94 UNION ALL 
          SELECT 95 UNION ALL SELECT 96 UNION ALL SELECT 97 UNION ALL SELECT 98 UNION ALL SELECT 99 UNION ALL 
          SELECT 100 UNION ALL SELECT 101
        ) numbers
        UNION ALL
        SELECT 'Above'
      )

      SELECT 
        ab.\`Age Bracket\`,
        COALESCE(SUM(CASE WHEN real_data.barangay = 'Sta. Rosa' THEN 1 ELSE 0 END),0) AS \`Sta. Rosa\`,
        COALESCE(SUM(CASE WHEN real_data.barangay = 'Sta. Maria' THEN 1 ELSE 0 END),0) AS \`Sta. Maria\`,
        COALESCE(SUM(CASE WHEN real_data.barangay = 'Sta. Lucia' THEN 1 ELSE 0 END),0) AS \`Sta. Lucia\`,
        COALESCE(SUM(CASE WHEN real_data.barangay = 'San Rafael' THEN 1 ELSE 0 END),0) AS \`San Rafael\`,
        COALESCE(SUM(CASE WHEN real_data.barangay = 'Yawran' THEN 1 ELSE 0 END),0) AS \`Yawran\`,
        COALESCE(SUM(CASE WHEN real_data.barangay = 'Raele' THEN 1 ELSE 0 END),0) AS \`Raele\`,
        COALESCE(COUNT(real_data.barangay),0) AS \`Total\`
      FROM age_brackets ab
      LEFT JOIN (
        SELECT
          CASE
            WHEN pi.age < 1 THEN '0-11 months'
            WHEN pi.age <= 101 THEN CAST(pi.age AS CHAR)
            ELSE 'Above'
          END AS \`Age Bracket\`,
          s.barangay
        FROM PersonalInformation pi
        JOIN Population p ON pi.populationID = p.populationID
        JOIN Surveys s ON p.surveyID = s.surveyID
        WHERE pi.sex = ?
      ) real_data ON real_data.\`Age Bracket\` = ab.\`Age Bracket\`
      GROUP BY ab.\`Age Bracket\`
      ORDER BY 
        CASE 
          WHEN ab.\`Age Bracket\` = '0-11 months' THEN 0
          WHEN ab.\`Age Bracket\` = 'Above' THEN 102
          ELSE CAST(ab.\`Age Bracket\` AS UNSIGNED)
        END;
    `, [sex]);

 
    res.json(rows);

  } catch (error) {
    console.error('Error getting segregation data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getSegregationTotal = async (req, res) => {

  try {

    const { sex } = req.params;

    const [rows] = await pool.query(`
      WITH age_groups AS (
        SELECT 'Below 1' AS age_bracket
        UNION ALL SELECT '1-2'
        UNION ALL SELECT '3-5'
        UNION ALL SELECT '6-12'
        UNION ALL SELECT '13-18'
        UNION ALL SELECT '19-39'
        UNION ALL SELECT '40-59'
        UNION ALL SELECT '60-70'
        UNION ALL SELECT '71 above'
      ),
      data AS (
        SELECT 
          CASE
            WHEN pi.age < 1 THEN 'Below 1'
            WHEN pi.age BETWEEN 1 AND 2 THEN '1-2'
            WHEN pi.age BETWEEN 3 AND 5 THEN '3-5'
            WHEN pi.age BETWEEN 6 AND 12 THEN '6-12'
            WHEN pi.age BETWEEN 13 AND 18 THEN '13-18'
            WHEN pi.age BETWEEN 19 AND 39 THEN '19-39'
            WHEN pi.age BETWEEN 40 AND 59 THEN '40-59'
            WHEN pi.age BETWEEN 60 AND 70 THEN '60-70'
            ELSE '71 above'
          END AS age_bracket,
          s.barangay
        FROM PersonalInformation pi
        JOIN Population p ON pi.populationID = p.populationID
        JOIN Surveys s ON p.surveyID = s.surveyID
        WHERE pi.sex = ?
      )
      SELECT 
        ag.age_bracket AS 'Age Bracket',
        COALESCE(SUM(CASE WHEN d.barangay = 'Sta. Rosa' THEN 1 ELSE 0 END),0) AS 'Sta. Rosa',
        COALESCE(SUM(CASE WHEN d.barangay = 'Sta. Maria' THEN 1 ELSE 0 END),0) AS 'Sta. Maria',
        COALESCE(SUM(CASE WHEN d.barangay = 'Sta. Lucia' THEN 1 ELSE 0 END),0) AS 'Sta. Lucia',
        COALESCE(SUM(CASE WHEN d.barangay = 'San Rafael' THEN 1 ELSE 0 END),0) AS 'San Rafael',
        COALESCE(SUM(CASE WHEN d.barangay = 'Yawran' THEN 1 ELSE 0 END),0) AS 'Yawran',
        COALESCE(SUM(CASE WHEN d.barangay = 'Raele' THEN 1 ELSE 0 END),0) AS 'Raele',
        COALESCE(COUNT(d.barangay),0) AS 'Total'
      FROM age_groups ag
      LEFT JOIN data d ON ag.age_bracket = d.age_bracket
      GROUP BY ag.age_bracket

      UNION ALL

      SELECT 
        'Total' AS 'Age Bracket',
        SUM(CASE WHEN d.barangay = 'Sta. Rosa' THEN 1 ELSE 0 END) AS 'Sta. Rosa',
        SUM(CASE WHEN d.barangay = 'Sta. Maria' THEN 1 ELSE 0 END) AS 'Sta. Maria',
        SUM(CASE WHEN d.barangay = 'Sta. Lucia' THEN 1 ELSE 0 END) AS 'Sta. Lucia',
        SUM(CASE WHEN d.barangay = 'San Rafael' THEN 1 ELSE 0 END) AS 'San Rafael',
        SUM(CASE WHEN d.barangay = 'Yawran' THEN 1 ELSE 0 END) AS 'Yawran',
        SUM(CASE WHEN d.barangay = 'Raele' THEN 1 ELSE 0 END) AS 'Raele',
        COUNT(d.barangay) AS 'Total'
      FROM data d

      ORDER BY 
        CASE 
          WHEN 'Age Bracket' = 'Below 1' THEN 1
          WHEN 'Age Bracket' = '1-2' THEN 2
          WHEN 'Age Bracket' = '3-5' THEN 3
          WHEN 'Age Bracket' = '6-12' THEN 4
          WHEN 'Age Bracket' = '13-18' THEN 5
          WHEN 'Age Bracket' = '19-39' THEN 6
          WHEN 'Age Bracket' = '40-59' THEN 7
          WHEN 'Age Bracket' = '60-70' THEN 8
          WHEN 'Age Bracket' = '71 above' THEN 9
          ELSE 10
        END;
    `, [ sex ]);

    // Add a total row
    const totalRow = {
      age_bracket: 'Total',
      sta_rosa: rows.reduce((sum, row) => sum + row.sta_rosa, 0),
      sta_maria: rows.reduce((sum, row) => sum + row.sta_maria, 0),
      sta_lucia: rows.reduce((sum, row) => sum + row.sta_lucia, 0),
      san_rafael: rows.reduce((sum, row) => sum + row.san_rafael, 0),
      yawran: rows.reduce((sum, row) => sum + row.yawran, 0),
      raele: rows.reduce((sum, row) => sum + row.raele, 0),
      total: rows.reduce((sum, row) => sum + row.total, 0)
    };
    
    rows.push(totalRow);
    res.json(rows);
  } catch (error) {
    console.error('Error getting age bracket totals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getYouthMasterlist = async (req, res) => {

  try {

    const { barangay } = req.params;

    const [masterlist] = await pool.query(`
      SELECT 
          ROW_NUMBER() OVER (ORDER BY p.lastName ASC) AS ID,
          CONCAT(p.lastName, ', ', p.firstName, ' ', p.middleName, ' ', IFNULL(p.suffix, '')) AS Name,
          DATE(p.birthdate) AS Birthdate,
          TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) AS Age,
          p.sex AS Sex,
          prof.educationalAttainment AS 'Educational Attainment',
          prof.skills AS Skills,
          prof.occupation AS Occupation,
          TRIM(BOTH '/' FROM CONCAT_WS('/',
              IF(p.isOSY = 1, 'OSY', NULL),
              IF(p.inSchool = 1, 'In School', NULL),
              IF(p.isPWD = 1, 'PWD', NULL),
              IF(prof.occupation IS NOT NULL, 'Working Youth', NULL)
          )) AS Remarks
      FROM PersonalInformation p
      JOIN ProfessionalInformation prof 
        ON p.populationID = prof.populationID
      JOIN Population pop
        ON p.populationID = pop.populationID
      JOIN Surveys s
        ON pop.surveyID = s.surveyID
      WHERE p.age BETWEEN 15 AND 30
        AND s.barangay = ?
      ORDER BY p.lastName ASC;
    `, [ barangay ]);
    
    res.json(masterlist);
  } catch (error) {
    console.error('Error getting youth masterlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOSY = async (req, res) => {

  try {

    const { barangay } = req.params;

    const [masterlist] = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER(ORDER BY p.lastName, p.firstName) AS 'ID',
        CONCAT(p.lastName, ', ', p.firstName, ' ', IFNULL(p.middleName, ''), ' ', IFNULL(p.suffix, '')) AS 'Name',
        p.age AS 'Age',
        DATE(p.birthdate) AS 'Date of Birth',
        p.sex AS 'Sex',
        prof.educationalAttainment AS 'Highest Educational Attainment',
        prof.skills AS 'Skills',
        prof.occupation AS 'Present Occupation',
        gov.organizationAffiliated AS 'Membership in Organizations',
        CONCAT(fh.lastName, ', ', fh.firstName, ' ', IFNULL(fh.middleName, ''), ' ', IFNULL(fh.suffix, '')) AS 'Name of Parent Guardian',
        CASE 
            WHEN p.isPWD = true THEN 'PWD' 
            ELSE '' 
        END AS 'Remarks'
    FROM PersonalInformation p
    JOIN ProfessionalInformation prof 
        ON p.populationID = prof.populationID
    JOIN Population pop
        ON p.populationID = pop.populationID
    JOIN Surveys s
        ON pop.surveyID = s.surveyID
    LEFT JOIN GovernmentAffiliation gov
        ON p.populationID = gov.populationID
    LEFT JOIN PersonalInformation fh
        ON p.populationID = fh.populationID 
        AND fh.relationToFamilyHead = 'Family Head'
    WHERE p.age BETWEEN 15 AND 24
      AND p.isOSY = true
      AND s.barangay = ?;
    `, [ barangay ]);
    
    res.json(masterlist);
  } catch (error) {
    console.error('Error getting OSY masterlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSoloParent = async (req, res) => {

  try {

    const { barangay } = req.params;

    const [masterlist] = await pool.query(`
      WITH SoloParents AS (
          SELECT 
              ROW_NUMBER() OVER (ORDER BY pi.lastName, pi.firstName) AS ParentID,
              pi.personalInfoID,
              pi.lastName,
              pi.firstName
          FROM Population p
          INNER JOIN PersonalInformation pi ON p.populationID = pi.populationID
          WHERE pi.isSoloParent = TRUE
      )

      SELECT 
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN sp.ParentID
              ELSE NULL
          END AS 'ID',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN CONCAT(pi.lastName, ', ', pi.firstName, ' ', IFNULL(pi.middleName, ''), 
                          IF(pi.suffix IS NOT NULL AND pi.suffix != '', CONCAT(' ', pi.suffix), '')
                    )
              ELSE '' 
          END AS 'Name of Parent',
          CONCAT(c.lastName, ', ', c.firstName, ' ', IFNULL(c.middleName, ''), 
                IF(c.suffix IS NOT NULL AND c.suffix != '', CONCAT(' ', c.suffix), '')
          ) AS 'Name of Child/Children',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN pi.age ELSE c.age
          END AS 'Age',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN pi.birthdate ELSE c.birthdate
          END AS 'Date of Birth',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN CASE WHEN pi.sex = 'M' THEN 'Male' WHEN pi.sex = 'F' THEN 'Female' ELSE pi.sex END
              ELSE CASE WHEN c.sex = 'M' THEN 'Male' WHEN c.sex = 'F' THEN 'Female' ELSE c.sex END
          END AS 'Sex',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN pr.educationalAttainment ELSE childProf.educationalAttainment
          END AS 'Educational Attainment',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN pr.occupation
              ELSE CASE WHEN c.inSchool = TRUE THEN 'Student'
                        ELSE childProf.occupation
                    END
          END AS 'Occupation/Source of Income',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1 THEN 
              CASE 
                  WHEN pi.civilStatus = 'Widowed' THEN 'Widow'
                  WHEN pi.civilStatus IN ('Single', 'Legally Separated', 'Separated in Fact') THEN 'Solo Parent'
                  WHEN pi.sex = 'Female' THEN 'Single Mother'
                  WHEN pi.sex = 'Male' THEN 'Single Father'
                  ELSE ''
              END 
              ELSE ''
          END AS 'Remarks',
          CASE WHEN RANK() OVER (PARTITION BY pi.personalInfoID ORDER BY c.lastName, c.firstName) = 1
              THEN pi.soloParentIDNumber
              ELSE ''
          END AS 'Solo Parent ID Number'
      FROM 
          Population p
      INNER JOIN 
          Surveys s ON p.surveyID = s.surveyID
      INNER JOIN 
          PersonalInformation pi ON p.populationID = pi.populationID
      INNER JOIN
          SoloParents sp ON pi.personalInfoID = sp.personalInfoID
      LEFT JOIN 
          ProfessionalInformation pr ON p.populationID = pr.populationID
      LEFT JOIN 
          Population p_child ON p_child.surveyID = p.surveyID
      LEFT JOIN 
          PersonalInformation c 
              ON p_child.populationID = c.populationID
            AND c.relationToFamilyHead IN ('Son', 'Daughter', 'Stepchild')
      LEFT JOIN 
          ProfessionalInformation childProf ON p_child.populationID = childProf.populationID
      WHERE 
          pi.isSoloParent = TRUE
      AND s.barangay = ?
      ORDER BY 
          sp.ParentID, c.lastName, c.firstName;
    `, [ barangay ]);
    
    res.json(masterlist);
  } catch (error) {
    console.error('Error getting OSY masterlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getWomenMasterlist = async (req, res) => {

  try {

    const { barangay } = req.params;

    const [masterlist] = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY p.lastName, p.firstName) AS ID,
        CONCAT(p.lastName, ', ', p.firstName, ' ', IFNULL(p.middleName, ''), ' ', IFNULL(p.suffix, '')) AS 'Name',
        DATE(p.birthdate) AS 'Date of Birth',
        p.age AS 'Age',
        prof.educationalAttainment AS 'Educational Attainment',
        prof.skills AS 'Skills',
        prof.occupation AS 'Occupation',
        TRIM(CONCAT(
          CASE WHEN prof.occupation IS NOT NULL AND prof.occupation != '' THEN 'Working' ELSE '' END,
          CASE WHEN prof.skills IS NOT NULL AND prof.skills != '' 
            THEN CONCAT(
              CASE WHEN prof.occupation IS NOT NULL AND prof.occupation != '' THEN '/' ELSE '' END,
              'Skilled'
            )
          ELSE '' END
        )) AS 'Remarks'
      FROM PersonalInformation p
      LEFT JOIN ProfessionalInformation prof ON p.populationID = prof.populationID
      LEFT JOIN Population pop ON p.populationID = pop.populationID
      LEFT JOIN Surveys s ON pop.surveyID = s.surveyID
      WHERE p.age BETWEEN 18 AND 59
        AND p.sex = 'Female'
        AND s.barangay = ?
    `, [ barangay ]);
    
    res.json(masterlist);
  } catch (error) {
    console.error('Error getting women masterlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPWD = async (req, res) => {
  try {

    const { barangay } = req.params;

    const [masterlist] = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY p.lastName, p.firstName) AS ID, -- Auto-incremented ID
        CONCAT(p.firstName, ' ', IFNULL(p.middleName, ''), ' ', p.lastName, ' ', IFNULL(p.suffix, '')) AS Name,
        p.birthdate AS Birthdate,
        p.age AS Age,
        p.sex AS Sex,
        pi.educationalAttainment AS 'Educational Attainment',
        pi.skills AS Skills,
        pi.occupation AS Occupation,
        di.disabilityType AS 'Disability Type',
        p.pwdIDNumber AS 'PWD ID Number',
        h.familyClass AS 'Family Class'
      FROM PersonalInformation p
      LEFT JOIN ProfessionalInformation pi ON p.populationID = pi.populationID OR p.applicantID = pi.applicantID
      LEFT JOIN pwdApplication pa ON p.applicantID = pa.applicantID
      LEFT JOIN DisabilityInformation di ON pa.pwdApplicationID = di.pwdApplicationID
      LEFT JOIN ContactInformation ci ON p.populationID = ci.populationID OR p.applicantID = ci.applicantID
      LEFT JOIN Population pop ON p.populationID = pop.populationID
      LEFT JOIN Households h ON pop.surveyID = h.surveyID
      LEFT JOIN Surveys s ON h.surveyID = s.surveyID
      WHERE p.isPWD = TRUE
        AND p.age <= 59
        AND ci.barangay = ?;
    `, [ barangay ]);
    
    res.json(masterlist);
  } catch (error) {
    console.error('Error getting women masterlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getNonIvatan = async (req, res) => {

  try {

    const { barangay } = req.params;

    const [masterlist] = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY pi.lastName, pi.firstName) AS ID,
        CONCAT_WS(' ', pi.lastName, pi.firstName, pi.middleName, pi.suffix) AS Name,
        pi.birthdate AS Birthdate,
        pi.age AS Age,
        pi.sex AS Sex
      FROM Population p
      JOIN PersonalInformation pi ON p.populationID = pi.populationID
      JOIN NonIvatan ni ON pi.populationID = ni.populationID
      JOIN Surveys s ON p.surveyID = s.surveyID
      WHERE ni.isIpula = TRUE 
        AND s.barangay = ?;
    `, [ barangay ]);
    
    res.json(masterlist);
  } catch (error) {
    console.error('Error getting non-ivatan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




