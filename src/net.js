var jsdom = require('jsdom');
var request = require('request');

var utils = require('./utils')

var BASE_URL = 'https://net.tsinghua.edu.cn';
var STATUS_URL = BASE_URL + '/rad_user_info.php';
var LOGIN_URL = BASE_URL + '/do_login.php';

var USER_AGENT = 'Unknown';
if (process.platform == 'darwin')
  USER_AGENT = 'Mozilla/5.0 (Mac OS X)';
else if (process.platform == 'win32')
  USER_AGENT = 'Windows NT';
else if (process.platform == 'linux')
  USER_AGENT = 'Linux';

// Call callback(err).
exports.login = function login(username, md5_pass, callback) {
  if (typeof callback === 'undefined') {
    callback = function (err) {};
  }

  request.post({
      url: LOGIN_URL,
      form: {
        action: 'login',
        username: username,
        password: '{MD5_HEX}' + md5_pass,
        ac_id: 1
      },
      encoding: null,
      headers: {'User-Agent': USER_AGENT}
    },
    function (err, r, body) {
      body = utils.gb2312_to_utf8(body);
      if (err) {
        console.error('Error while logging in: %s.', err);
        callback(err);
      } else if (body == 'Login is successful.') {
        console.info('Logged in using %s', username);
        callback(null);
      } else {
        console.error('Failed to login: %s', body);
        callback(body);
      }
    }
  );
}

// Call callback(err).
exports.logout = function logout(callback) {
  // FIXME: Ugly, use || or something to fix it?
  if (typeof callback === 'undefined') {
    callback = function (err) {};
  }

  request.post({
      url: LOGIN_URL,
      form: {
        action: 'logout'
      }
    },
    function (err, r, body) {
      if (err) {
        console.error('Error while logging out: %s.', err);
        callback(err);
      } else if (body == 'Logout is successful.') {
        console.info('Logged out.');
        callback(null);
      } else {
        console.error('Failed to logout: %s', body);
        callback(body);
      }
    }
  );
}

// Call callback(err, infos).
exports.get_status = function get_status(callback) {
  if (typeof callback === 'undefined') {
    callback = function (err, infos) {};
  }

  request(STATUS_URL, function (err, r, body) {
    if (err) {
      console.error('Error while getting status: %s', err);
      callback(err);
    } else {
      var infos;
      if (body) {
        var info_strs = body.split(',');
        infos = {
          username: info_strs[0],
          start_time: new Date(Number(info_strs[1]) * 1000),
          usage: Number(info_strs[3]),
          total_usage: Number(info_strs[6]),
          ip: info_strs[8],
          balance: Number(info_strs[11])
        };
      } else {
        infos = null;
      }
      console.log('Got status: %s', JSON.stringify(infos));
      callback(null, infos);
    }
  });
}
