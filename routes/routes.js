// load up our shiny new route for surveys
const surveyRoutes = require('./surveys');

const appRouter = (app, dbCollection) => {
  // we've added in a default route here that handles empty routes
  // at the base API url
  app.get('/', (req, res) => {
    res.send('welcome to the development api-server');
  });

  // run our survey route module here to complete the wire up
  surveyRoutes(app, dbCollection);
};

// this line is unchanged
module.exports = appRouter;