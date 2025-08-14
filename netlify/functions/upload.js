const Busboy = require('busboy');
const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = "e27ce0c471c6edcdf98e57c4697c4cff";

const CLOUDINARY_CLOUD_NAME = "db2hfiqln";
const CLOUDINARY_UPLOAD_PRESET = "bookwyrm_pdfs";

exports.handler = async (event, context) => {
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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Normalize headers to lowercase to ensure Busboy works correctly
  const headers = Object.keys(event.headers).reduce((acc, key) => {
    acc[key.toLowerCase()] = event.headers[key];
    return acc;
  }, {});

  const busboy = Busboy({ headers: headers });

  // Correctly handle base64 encoding from Netlify
  const requestBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;

  return new Promise((resolve, reject) => {
    const files = {};
    const fields = {};

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, filename) => {
      console.log(`Receiving file: ${filename.filename}`);
      const buffer = [];
      file.on('data', data => {
        buffer.push(data);
      });
      file.on('end', () => {
        files[fieldname] = {
          buffer: Buffer.concat(buffer),
          filename: filename.filename,
          mimeType: filename.mimeType,
        };
      });
    });

    busboy.on('error', (err) => {
      console.error('Busboy parsing error:', err);
      resolve({
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Busboy failed to parse form data.', details: err.message }),
      });
    });

    busboy.on('finish', async () => {
      console.log('Busboy finished parsing. Files:', Object.keys(files));
      
      // Ensure the response always has a JSON body, even for errors
      if (!files.coverImage || !files.pdfFile) {
        return resolve({ 
          statusCode: 400, 
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Missing cover image or PDF file.' }) 
        });
      }

      try {
        const uploadPromises = [];
        let coverUrl, pdfUrl;

        // --- ImgBB Upload (unchanged, it was already correct) ---
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', files.coverImage.buffer, { filename: 'cover.jpg' });

        uploadPromises.push(axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, imgbbFormData, {
          headers: imgbbFormData.getHeaders(),
        }).then(response => {
          coverUrl = response.data.data.url;
          console.log('ImgBB upload successful.');
        }));

        // --- Cloudinary Upload (updated for robustness) ---
        const pdfBase64 = files.pdfFile.buffer.toString('base64');
        const cloudinaryPayload = {
          file: `data:${files.pdfFile.mimeType};base64,${pdfBase64}`,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
          folder: 'bookwyrmx-pdfs',
          resource_type: 'raw',
        };

        console.log('Starting Cloudinary upload with base64 string...');

        uploadPromises.push(axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          cloudinaryPayload
        ).then(response => {
          pdfUrl = response.data.secure_url;
          console.log('Cloudinary upload successful.');
        }));

        await Promise.all(uploadPromises);
        console.log('All uploads completed. Resolving with URLs.');

        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coverUrl, pdfUrl })
        });
} catch (error) {
  console.error('File Upload Error:', error);

  let errorDetails = 'An unexpected error occurred during file upload.';
  let statusCode = 500;

  // Check if the error is from an axios response (e.g., API rejected the request)
  if (error.response && error.response.data) {
    // If the API returned a string (e.g., "Internal Error"), use that.
    // Otherwise, use the structured data.
    if (typeof error.response.data === 'string') {
      errorDetails = error.response.data;
    } else {
      errorDetails = error.response.data.error || JSON.stringify(error.response.data);
    }
    statusCode = error.response.status;
  } else if (error.message) {
    // If it's a general JavaScript error, use the message
    errorDetails = error.message;
  }

  resolve({
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'File upload failed.',
      details: errorDetails
    }),
  });
}


    });

    busboy.end(requestBody);
  });
};
