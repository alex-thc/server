var CONFIG = require('../config-prod.json');

const function convertFieldsToNumeric(doc) {
    //try {
    function isNumeric(str) {
      if (typeof str != "string") return false // we only process strings!  
      return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
             !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    const iterate = (obj) => {
        Object.keys(obj).forEach(key => {
          if (isNumeric(obj[key])) {
              obj[key] = parseFloat(obj[key]);
          }
        }) 
    }
    iterate(doc)
    // } catch (err) {
    //   console.log(err)
    //   console.log(JSON.stringify(doc))
    //   throw err
    // }
    return doc
  }

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
        //qualtrics sends scores as strings
        if (req.body.scores)
          convertFieldsToNumeric(req.body.scores);
        dbCollection.updateOne({"name":req.body.projectId},{"$push":{"survey_responses":req.body}});
        res.send("Survey object created") 
      }
    } else {
      res.send("Invalid request API key")
    }
  });

};

module.exports = surveyRoutes;