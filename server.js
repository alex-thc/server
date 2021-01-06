// load up the express framework and body-parser helper
const express = require('express');
const bodyParser = require('body-parser');
const Realm = require('realm-web');
var assert = require('assert');

var CONFIG = require('./config-prod.json');

// create an instance of express to serve our end points
const app = express();

const realmApp = new Realm.App({ id: CONFIG.realmAppId });
const realmApiKey = CONFIG.realmApiKey;

async function loginApiKey(apiKey) {
  // Create an API Key credential
  const credentials = Realm.Credentials.apiKey(apiKey);
  // Authenticate the user
  const user = await realmApp.logIn(credentials);
  // `App.currentUser` updates to match the logged in user
  assert(user.id === realmApp.currentUser.id)
  return user
}

// configure our express instance with some body-parser settings
// including handling JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

loginApiKey(realmApiKey).then(user => {
    console.log("Successfully logged in to Realm!");

    const dbCollection = user
      .mongoClient('mongodb-atlas')
      .db('shf')
      .collection('psproject');

	// this is where we'll handle our various routes from
	const routes = require('./routes/routes.js')(app, dbCollection);

	// finally, launch our server on port 8080.
	const server = app.listen(8080, () => {
	  console.log('listening on port %s...', server.address().port);
	});

  }).catch((error) => {
    console.error("Failed to log into Realm", error);
  });
