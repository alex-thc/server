var CONFIG = require('../config-prod.json');

function processQuestionsData(doc) {
    var isPlainObject = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Object]';
    };

    function isNumeric(str) {
      if (typeof str != "string") return false // we only process strings!  
      return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
             !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    var questions = [];

    const iterate = (obj) => {
        Object.keys(obj).forEach(key => {
          if ((key.indexOf("question") >= 0) && isPlainObject(obj[key]) && isNumeric(obj[key].score_value)) {
              obj[key].score_value = parseFloat(obj[key].score_value);
              questions.push(obj[key]);
              delete obj[key];
          }
        }) 
    }
    iterate(doc);
    doc.questions = questions;
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
        processQuestionsData(req.body);
        dbCollection.updateOne({"name":req.body.projectId},{"$push":{"survey_responses":req.body}});
        res.send("Survey object created") 
      }
    } else {
      res.send("Invalid request API key")
    }
  });

};

module.exports = surveyRoutes;
