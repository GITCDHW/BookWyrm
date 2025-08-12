const Busboy = require('busboy');
const axios = require('axios');
const FormData = require('form-data');

// Replace this with your ImgBB API key.
const IMGBB_API_KEY = "e27ce0c 471c6edcdf98e57c4697c4cff";

// Use your Cloudinary credentials from your Netlify environment variables.
const CLOUDINARY_CLOUD_NAME = "db2hfiqln";
const CLOUDINARY_UPLOAD_PRESET = "bookwyrm_pdf"; 

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

    busboy.on('file', (fieldname, file, filename) => {
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

    busboy.on('finish', async () => {
      if (!files.coverImage || !files.pdfFile) {
        return resolve({ statusCode: 400, body: 'Missing cover image or PDF file.' });
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
        }));

        // --- Upload PDF file to Cloudinary ---
        const cloudinaryPdfFormData = new FormData();
        cloudinaryPdfFormData.append('file', `data:${files.pdfFile.mimeType};base64,${files.pdfFile.buffer.toString('base64')}`);
        cloudinaryPdfFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        cloudinaryPdfFormData.append('folder', 'bookwyrm_pdfs');
        cloudinaryPdfFormData.append('resource_type', 'raw'); 

        uploadPromises.push(axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          cloudinaryPdfFormData,
          { headers: cloudinaryPdfFormData.getHeaders() }
        ).then(response => {
          pdfUrl = response.data.secure_url;
        }));

        await Promise.all(uploadPromises);

        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coverUrl, pdfUrl }),
        });
      } catch (error) {
        console.error('File Upload Error:', error);
        resolve({
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'File upload failed.' }),
        });
      }
    });

    busboy.end(Buffer.from(event.body, 'base64'));
  });
};
