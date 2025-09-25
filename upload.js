// Function to upload an image to imgbb
async function uploadToImgbb(imageData, mimeType, imgbbKey) {
  const FormData = require('form-data');
  const fetch = require('node-fetch');

  const formData = new FormData();
  formData.append('image', imageData);
  const url = `https://api.imgbb.com/1/upload?key=${imgbbKey}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success) {
    return result.data.url;
  } else {
    throw new Error(`ImgBB API error: ${result.error.message}`);
  }
}

// Function to upload a PDF to Cloudinary
async function uploadToCloudinary(pdfData, cloudName, apiKey, apiSecret) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'bookwyrm_pdfs' },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve(result.secure_url);
      }
    ).end(pdfData);
  });
}

exports.handler = async (event) => {
  // Define CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or replace '*' with your specific domain (e.g., 'https://bookwyrmx.netlify.app')
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight check successful.' }),
    };
  }

  // Only allow POST requests for the main logic
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const imgbbKey = process.env.IMGBB_API_KEY;
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!imgbbKey || !cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing API keys or cloud name in environment variables' }),
    };
  }

  try {
    const Busboy = require('busboy');
    const busboy = Busboy({ headers: event.headers });
    const fields = {};

    await new Promise((resolve, reject) => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const fileData = [];
        file.on('data', data => fileData.push(data));
        file.on('end', () => {
          fields[fieldname] = {
            data: Buffer.concat(fileData),
            mimetype,
            filename: filename.filename,
          };
        });
      });

      busboy.on('finish', resolve);
      busboy.on('error', reject);
      busboy.end(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
    });

    const coverFile = fields.coverImage;
    const pdfFile = fields.pdfFile;

    if (!coverFile || !pdfFile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ body: 'Cover image and PDF file are required.' }),
      };
    }

    const coverUrl = await uploadToImgbb(coverFile.data.toString('base64'), coverFile.mimetype, imgbbKey);
    const pdfUrl = await uploadToCloudinary(pdfFile.data, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ coverUrl, pdfUrl }),
    };
  } catch (error) {
    console.error('Error during upload:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
