import pool from '../config/database.js';
// import * as postModel from '../models/postModel.js';

// Get all posts
export const getPosts = async (req, res) => {
  try {
    const [posts] = await pool.query(`SELECT * FROM Posts`);
    const [rows] = await pool.query(`SELECT * FROM PostImages`);
    
    const postImages = rows.map(row => {
      let processedRow = {...row};

      if (row.postImage) {
        // Add proper image data URL prefix
        processedRow.postImage = `data:image/jpeg;base64,${Buffer.from(row.postImage).toString('base64')}`;
      }
      
      return processedRow;
    });

    res.json({posts, postImages});
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getImages = async (req, res) => {
  try {
    const [posts] = await pool.query(`SELECT * FROM Posts`);
    const [rows] = await pool.query(`SELECT * FROM PostImages`);
    
    const postImages = rows.map(row => {
      let processedRow = {...row};

      if (row.postImage) {
        // Add proper image data URL prefix
        processedRow.postImage = `data:image/jpeg;base64,${Buffer.from(row.postImage).toString('base64')}`;
      }
      
      return processedRow;
    });

    res.json({posts, postImages});
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new post
export const createPost = async (req, res) => {

  try {
    const { userID, postType, postTitle, postDescription } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const [postResult] = await pool.query(
      `INSERT INTO Posts 
       (userID, postType, postTitle, postDescription, postDate) 
       VALUES (?, ?, ?, ?, CURDATE())`,
      [ userID, postType, postTitle, postDescription ]  
    );
    const postID = postResult.insertId;


    console.log(`Processing ${req.files.length} uploaded images`);

    for (let i = 0; i < req.files.length; i++) {
      const imageFile = req.files[i];

      await pool.query(
        `INSERT INTO PostImages (postID, postImage) VALUES (?, ?)`,
        [ postID, imageFile.buffer ]
      );
    }

    res.status(201).json({ 
      message: 'Post created successfully',
      postId: postID
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a post
export const deletePost = async (req, res) => {

  const connection = await pool.getConnection();

  try {
    const postID = req.params.id;

    await connection.query('DELETE FROM PostImages WHERE postID = ?', [postID]);
    await pool.query('DELETE FROM Posts WHERE postID = ?', [postID]);

    return console.log('Post Deleted Succcesfully!');
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

export const deleteMultiplePosts = async (req, res) => {
  const { ids } = req.body; // Expects { ids: [14, 15, 16] }
  const connection = await pool.getConnection();

  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    await connection.beginTransaction();

    // Delete all related images first
    await connection.query('DELETE FROM PostImages WHERE postID IN (?)', [ids]);

    // Then delete the posts
    await connection.query('DELETE FROM Posts WHERE postID IN (?)', [ids]);

    await connection.commit();

    res.status(200).json({ message: `${ids.length} posts deleted successfully` });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting multiple posts:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};


// 1. Get post by ID (existing implementation)
export const getPostById = async (req, res) => {
  console.log('HELLO');
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Posts WHERE postID = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get post images by post ID (new endpoint needed)
export const getPostImages = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT postImagesID, postID, postImage FROM PostImages WHERE postID = ?',
      [req.params.id]
    );
    
    // Convert binary image data to base64 for each image
    const processedImages = rows.map(row => ({
      postImagesID: row.postImagesID,
      postID: row.postID,
      postImage: `data:image/jpeg;base64,${row.postImage.toString('base64')}`
      // Add image type if you store it in your database
    }));
    
    res.json({ data: processedImages });
  } catch (error) {
    console.error('Error getting post images:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update post (new endpoint needed)
export const updatePost = async (req, res) => {

  console.log('UPDATING..')

  const connection = await pool.getConnection();
  
  const postID = req.params.postID;
  const { userID, postTitle, postDescription, postType } = req.body;

  console.log('POST ID:', postID);
  console.log('USER ID:', userID);
  console.log('TITLE:', postTitle);
  console.log('DESCRIPTION:', postDescription);
  console.log('TYPE:', postType);
  
  try {

    await connection.beginTransaction();
    
    await connection.query(
      `UPDATE Posts 
       SET postTitle = ?, 
           postDescription = ?, 
           postType = ? 
       WHERE postID = ? AND userID = ?`,
      [ postTitle, 
        postDescription, 
        postType, 
        postID, 
        userID ]
    );
    
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageFile = req.files[i];
  
        await connection.query(
          `INSERT INTO PostImages (postID, postImage) VALUES (?, ?)`,
          [ postID, imageFile.buffer ]
        );
      }
    }
    
    await connection.commit();
    res.status(200).json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    // Rollback on error
    await connection.query('ROLLBACK');
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


