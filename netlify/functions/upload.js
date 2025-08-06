const Busboy = require('busboy');
const axios = require('axios');
const FormData = require('form-data');

// Replace this with your ImgBB API key. You can get a free one from imgbb.com.
const IMGBB_API_KEY = 'e27ce0c471c6edcdf98e57c4697c4cff';

exports.handler = async (event, context) => {
  // Handle CORS pre-flight requests from the browser
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600',
      },
      body: '',
    };
  }

  // Ensure only POST requests are allowed
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse the file from the request body using Busboy
  const busboy = Busboy({ headers: { 'content-type': event.headers['content-type'] } });

  return new Promise((resolve, reject) => {
    let fileBuffer = null;

    busboy.on('file', (fieldname, file, filename) => {
      // Collect the file data in a buffer
      const buffer = [];
      file.on('data', data => {
        buffer.push(data);
      });
      file.on('end', () => {
        fileBuffer = Buffer.concat(buffer);
      });
    });

    busboy.on('finish', async () => {
      if (!fileBuffer) {
        return resolve({ statusCode: 400, body: 'No file uploaded.' });
      }

      try {
        // Create form data for the ImgBB upload API
        const formData = new FormData();
        formData.append('image', fileBuffer, { filename: 'cover.jpg' });

        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
          headers: formData.getHeaders(),
        });

        // Get the public URL from the ImgBB response
        const coverUrl = response.data.data.url;

        // Respond with the URL and CORS headers
        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coverUrl }),
        });
      } catch (error) {
        console.error('ImgBB Upload Error:', error);
        resolve({
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Image upload failed.' }),
        });
      }
    });

    busboy.end(Buffer.from(event.body, 'base64'));
  });
};
      
