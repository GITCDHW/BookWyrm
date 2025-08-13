const Busboy = require('busboy');
const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

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

  const busboy = Busboy({ headers: { 'content-type': event.headers['content-type'] } });

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

        // --- Upload cover image to ImgBB ---
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', files.coverImage.buffer, { filename: 'cover.jpg' });

        uploadPromises.push(axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, imgbbFormData, {
          headers: imgbbFormData.getHeaders(),
        }).then(response => {
          coverUrl = response.data.data.url;
          console.log('ImgBB upload successful.');
        }));

        const cloudinaryPdfFormData = new FormData();
        // Append the buffer directly with filename and mimeType
        cloudinaryPdfFormData.append('file', files.pdfFile.buffer, {
          filename: files.pdfFile.filename,
          contentType: files.pdfFile.mimeType,
        });
        cloudinaryPdfFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        cloudinaryPdfFormData.append('folder', 'bookwyrmx-pdfs');
        cloudinaryPdfFormData.append('resource_type', 'raw'); 

        console.log('Starting Cloudinary upload with direct buffer...');

        // Corrected Cloudinary API URL
        uploadPromises.push(axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          cloudinaryPdfFormData,
          { headers: cloudinaryPdfFormData.getHeaders() }
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
          body: JSON.stringify({ coverUrl, pdfUrl }), // Now returning both URLs
        });
      } catch (error) {
        console.error('File Upload Error:', error.response ? error.response.data : error);
        resolve({
          statusCode: error.response ? error.response.status : 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: 'File upload failed.', 
            details: error.response && error.response.data ? error.response.data : error.message 
          }),
        });
      }
    });

    busboy.end(Buffer.from(event.body, 'base64'));
  });
};
