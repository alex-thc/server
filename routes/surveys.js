var CONFIG = require('../config-prod.json');

const surveyRoutes = (app, fs) => {

  // CREATE
  app.post('/surveys', (req, res) => {
    if (req.headers["x-api-key"] && (req.headers["x-api-key"] === CONFIG.webApiKey)) {
      console.log(JSON.stringify(req.body));
      res.send("Survey object created") 
    } else {
      res.send("Invalid request API key")
    }
  });

};

module.exports = surveyRoutes;