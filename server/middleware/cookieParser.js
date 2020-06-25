const parseCookies = (req, res, next) => {
  // console.log('REQUEST BODY: ', req.headers.cookie.split(';'));
  var cookieObj = {};
  if (req.headers.cookie) {
    var cookieArray = req.headers.cookie.split('; ');
    cookieArray.forEach(cookie => {
      var tempArr = cookie.split('=');
      cookieObj[tempArr[0]] = tempArr[1];
    });
  }
  // console.log('COOKIE OBJECT! ', cookieObj);
  req.cookies = cookieObj;
  next();
};

module.exports = parseCookies;

