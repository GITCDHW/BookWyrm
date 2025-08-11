const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Handle the preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: ''
        };
    }

    try {
        const url = event.queryStringParameters.url;
        if (!url) {
            return { statusCode: 400, body: 'URL parameter is missing.' };
        }

        const response = await fetch(url);
        
        // This is the key change: get the raw binary data
        const data = await response.buffer();
        const contentType = response.headers.get('content-type');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            },
            body: data.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error('Error in proxy function:', error);
        return { statusCode: 500, body: 'Error fetching resource.' };
    }
};
