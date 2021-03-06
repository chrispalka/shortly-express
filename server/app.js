const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);
// app.use(Auth.verifySession);


app.get('/', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/create', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });


app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', (req, res, next) => {
  res.render('login');
});

app.get('/signup', (req, res, next) => {
  res.render('signup');
});

app.get('/logout',
  (req, res, next) => {
    var hash = req.cookies.shortlyid;
    return models.Sessions.delete({ hash })
      .then(() => {
        console.log('Deleted successfully');
        res.clearCookie('shortlyid');
        res.redirect('/login');
        return;
      })
      .catch((err) => {
        console.log(`Error Caught at logout - ${err}`);
      });
    next();
  });

app.post('/signup', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  return models.Users.get({ username })
    //passing through then block username
    // if user data already exists
    // redirect to the /signup page
    .then(userData => {
      if (userData) {
        console.log('Username already exists');
        res.redirect('/signup');
      }
      // if not create a new user
      return models.Users.create({ username, password });
    })
    .then(results => {
      console.log(' app.js line 124 User created successfully!');
      return models.Sessions.update({ hash: req.session.hash }, { userId: results.insertId });
    })
    // then redirect to the homepage
    .then(() => {
      res.redirect('/');
    })
    .catch(err => {
      console.log(`Error Caught at Signup - ${err}`);
    });
});

app.post('/login',
  (req, res, next) => {
    var username = req.body.username;
    var userId;
    var attemptedPassword = req.body.password;
    return models.Users.get({ username })
      .then(userData => {
        if (!userData) {
          console.log('User does not exist, staying at login page');
          res.redirect('/login');
        }
        userId = userData.id;
        return models.Users.compare(attemptedPassword, userData.password, userData.salt);
      })
      .then((loggedIn) => {
        if (loggedIn) {
          models.Sessions.update({hash: req.session.hash}, {userId: userId});
          res.redirect('/');
          console.log('User logged in successfully!');
        } else {
          console.log('Credentials incorrect.. Please try again');
          res.redirect('/login');
        }
      })

      .catch(err => {
        console.log(`Error Caught at Login - ${err}`);
      });
  });
/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
