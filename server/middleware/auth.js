const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
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
        // console.log('SESSION DATA', sessionData);
        req.session = sessionData;
        // set new cookie on the response i.e. session.hash
        res.cookie('shortlyid', req.session.hash);
        next();
      })
      .catch(err => {
        console.log('Error! ', err);
      });
  } else {
    // COOKIE PRESENT ON REQUEST
    var hash = cookie;
    // console.log('cookie---->', cookie);
    // Check if incoming cookie matches hash in DB
    models.Sessions.get({ hash })
      .then(sessionData => {
        if (sessionData) {
          console.log('COOKIE VERIFIED!');
          // If matching - set the session object to the return sessionData
          // console.log('REQ.SESSION --->', req.session);
          req.session = sessionData;

          console.log('SESSION DATA --->', sessionData);
          next();
          // if sessionData doesn't exist
        } else {
          models.Sessions.create()
            .then(results => {
              return models.Sessions.get({ id: results.insertId });
            })
            .then(sessionData => {
              req.session = sessionData;
              res.cookie('shortlyid', sessionData.hash);
              next();
            });
        }
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  var session = req.session;
  // console.log('VERIFY SESSION! -----> ', session);
  if (models.Sessions.isLoggedIn(req.session)) {
    console.log('USER HAS SESSION!.. REDIRECT TO INDEX', req.session);

  } else {
    res.redirect('/login');
    console.log('NO SESSION', req.session);
  }
  next();
};