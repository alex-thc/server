var CONFIG = require('../config-prod.json');

function notifyHTMLBody(projectName, name, survey_response) {
  return `
      <div>
      Hi ${name},
      <br/><br/>
      We just received a survey response for the following PS Project: ${projectName}! See below for the details.
      <br/><br/>
      Survey: ${survey_response.survey} <br/>
      Name: ${survey_response.name} (${survey_response.email}) <br/>
      Questions: <br/>
      <ul>
        ${survey_response.questions.map(r => `<li>${r.text}: ${r.score}</li>`).join(" ")}
      </ul>
      ${survey_response.additional_feedback ? "Additional feedback: " + survey_response.additional_feedback : ""}
      <br/> <br/>
      MongoDB Professional Services
      <br/>
    </div>`;
}

async function getPMContactInfo(proj, userdataCol) {
  let pm = await userdataCol.findOne({sf_names : proj.project_manager});
  if (! pm) {
    console.log(`We don't have data on the PM (${proj.project_manager}) for ${proj.name}`)
    return null;
  }

  return {name:proj.project_manager, email: pm._id}
}

async function getOwnerContactInfo(proj, userdataCol) {
  let owner = await userdataCol.findOne({sf_names : proj.owner});
  if (! owner) {
    console.log(`We don't have data on the owner (${proj.owner}) for ${proj.name}`)
    return null;
  }

  return {name:proj.owner, email: owner._id}
}

async function notifyPM(project_doc, survey_response, user, userdataCol) {
  const pm_contact_info = await getPMContactInfo(project_doc, userdataCol);
  const owner_contact_info = await getOwnerContactInfo(project_doc, userdataCol);

  if (!pm_contact_info) {
    console.log("Ignoring");
    return;
  }

  const emailParams = {
    origEmail: owner_contact_info ? owner_contact_info.email : "alex@mongodb.com",
    toEmail: pm_contact_info.email, 
    subject: "Survey response received for " + project_doc.name,
    html: notifyHTMLBody(project_doc.name, pm_contact_info.name, survey_response)
  };

  await user.callFunction(
                'sendMail',
                emailParams,
            );
}

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

    if (doc.date)
      doc.date = new Date(doc.date);
    // } catch (err) {
    //   console.log(err)
    //   console.log(JSON.stringify(doc))
    //   throw err
    // }
    return doc
  }

const surveyRoutes = (app, dbCollection, userdataCol, user) => {

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
        dbCollection.findOne({"name":req.body.projectId}).then((doc) => notifyPM(doc, req.body, user, userdataCol))
        res.send("Survey object created") 
      }
    } else {
      res.send("Invalid request API key")
    }
  });

};

module.exports = surveyRoutes;
