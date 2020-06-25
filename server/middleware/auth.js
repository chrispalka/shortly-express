const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // updating session table when user logs in?
  // check if session has hash... crosscheck with DB
  var cookie = req.cookies.shortlyid;
  // if there are cookies
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
  var hash = cookie;
  return models.Sessions.get({ hash })
    .then(sessionData => {
      if (sessionData) {
        req.session = sessionData;
      }
      // res.clearCookie('shortlyid');
      // models.Sessions.create()
      //   .then(results => {
      //     return models.Sessions.get({ id: results.insertId });
      //   })
      //   .then(sessionData => {
      //     res.cookie('shortlyid', sessionData.hash);
      //   });

      next();
    })
    .catch(err => {
      console.log('Error! ', err);
    });

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

