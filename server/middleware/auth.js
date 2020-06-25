const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // updating session table when user logs in?
  // check if session has hash... crosscheck with DB
  var cookie = req.cookies.shortlyid;
  // NO COOKIE PRESENT ON REQUEST
  if (!cookie) {
    // no cookie = create new session
    models.Sessions.create()
      .then(results => {
        return models.Sessions.get({ id: results.insertId });
      })
      .then(sessionData => {
        // assign session table data to session oject on request
        req.session = sessionData;
        // set new cookie on the response i.e. session.hash
        res.cookie('shortlyid', req.session.hash);
        next();
      })
      .catch(err => {
        console.log('Error! ', err);
      });
  }
  // COOKIE PRESENT ON REQUEST
  var hash = cookie;
  // Check if incoming cookie matches hash in DB
  return models.Sessions.get({ hash })
    .then(sessionData => {
      if (sessionData) {
        // If matching - set the session object to the return sessionData
        req.session = sessionData;
        // ** Things To Note: the below console log of sessionData has added user info added from tests **
        console.log('SESSION DATA --->', sessionData);
      }
      // Below I was trying to clear the cookie sent from the request that was malicious (no match in DB found) and assign a new cookie to our response:

      /******
      res.clearCookie('shortlyid');
      models.Sessions.create()
        .then(results => {
          return models.Sessions.get({ id: results.insertId });
        })
        .then(sessionData => {
          res.cookie('shortlyid', sessionData.hash);
        });
        ******/
      next();
    })
    .catch(err => {
      console.log('Error! ', err);
    });

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

