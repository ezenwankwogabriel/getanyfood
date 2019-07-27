const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

function swagger(app) {
  const options = {
    definition: {
      openapi: '3.0.0', // Specification (optional, defaults to swagger: '2.0')
      info: {
        title: 'Getany Food', // Title (required)
        version: '1.0.0', // Version (required)
      },
      host: 'localhost:3000',
      basePath: '/',
      securityDefinitions: {
        bearerauth: {
          type: 'apiKey',
          name: 'Authorization',
          scheme: 'jwt',
          in: 'header',
        },
      },
    },
    // Path to the API docs
    apis: ['../controllers/routes/*.js'],
  };
  const swaggerSpec = swaggerJSDoc(options);
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swagger;
