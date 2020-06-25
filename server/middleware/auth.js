const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // updating session table when user logs in?
  // check if session has hash... crosscheck with DB
  //
  // console.log('line 5 ------>', req);
  var objCookie = req.cookies; // {}
  // if there are cookies
  if (objCookie.shortlyid) {
    // console.log('HI!');
    var hash = req.cookies.shortlyid;
    console.log('HI!', hash);
    console.log('session exists!!***', req.session);
  }
  // if no cookies
  // create a session
  models.Sessions.create()
    // initialized a session
    .then(data => { return models.Sessions.get({ id: data.insertId }); })
    // assigns a session object to the request if a session already exists
    .then(sessionData => {
      req.session = sessionData;
      console.log(req.session);
      // sets a new cookie on the response
      res.cookie('shortlyid', req.session.hash);
      next();
    });
  // if we have cookies





};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

