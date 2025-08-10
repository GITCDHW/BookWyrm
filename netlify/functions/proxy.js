// .netlify/functions/proxy.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    try {
        const url = event.queryStringParameters.url;
        if (!url) {
            return { statusCode: 400, body: 'URL parameter is missing.' };
        }

        const response = await fetch(url);
        const data = await response.buffer();
        const contentType = response.headers.get('content-type');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*' // This is key for CORS
            },
            body: data.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        return { statusCode: 500, body: 'Error fetching resource.' };
    }
};
