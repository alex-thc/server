var CONFIG = require('../config-prod.json');

const surveyRoutes = (app, dbCollection) => {

  // CREATE
  app.post('/surveys', (req, res) => {
    if (req.headers["x-api-key"] && (req.headers["x-api-key"] === CONFIG.webApiKey)) {
      console.log("Storing survey result");
      console.log(JSON.stringify(req.body));

      if (!req.body.projectId) {
        console.log("No project Id is given in the object");
        res.send("No project Id is given in the object");
      } else {
        dbCollection.updateOne({"name":req.body.projectId},{"$push":{"survey_responses":req.body}});
        res.send("Survey object created") 
      }
    } else {
      res.send("Invalid request API key")
    }
  });

};

module.exports = surveyRoutes;