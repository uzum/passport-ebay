/**
 * Module dependencies.
 */
var passport = require('passport'),
  util = require('util'),
  BadRequestError = require('./errors/badrequesterror');


/**
 * Options:
 config = {
  ebay: {
    options: {
      cert: 'DDSoluti-9a68-4a75-8be0-d82ec7940d9f',
      devName: 'd1bd00d8-f76f-4459-9f18-23daa9695432',
      appName: '6bdef6f0-2147-48c4-aac7-030c35624980',
      ruName: 'DD_Solution-DDSoluti-9a68-4-tqcsh',
      sanbox: true,
      authToken : 'AgAAAA**AQAAAA**aAAAAA**nZyoVA**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GhDZGBoQSdj6x9nY+seQ**dSsDAA**AAMAAA**3NleB0CU35QYGXbIVpMNXTmpQVU8jYsJgJiERfiVFGBlhl7z/8NJe67v3ffpY/KwEqy8M1zj9aCNef/BWpJJyfTddQiBC3ZMoguUKrb8zHnjqX2p7hwxhmB3tnLM8XC3HGJJXg0IdAR8OwzEikDWBmLY4rcdVSI4i4tenIsbttdM0eCB9YUb/ApKRyrfGxY8+xkrlJFiW4uIwnhxt0lYcgWQ/kCoFXuPcuN4sraRoedFfKUvZne9S9WbKdnnO7J5neFsUwBg7yXjdOrPmC5dN3dok/VWC0UaDGz+r7mxIHfzSZOSV6DBxtYb8ywp5omH74xmAgbMOA954M1s4xR7GfYCl1riDUgodDpbv55K6SxtFshmAAUoiXZ6aEpGC1BrlEYho0PIdoiCwDhEl0bZR2W1cmaDYrW3+aLkGRc0NXKuFxRFbTAxj+v+RmX697YXm3W0vsNkc8Tnzs1676VB1MDZSw3skM11xn5hR5QzczvlF0uSu33NvZWiGcgguuK3qQURabzakALgfhT6oxU8ueaPXEFQIW7s3juhFbfXkGqu7YPjEJvuiwBOjy5TJlDeBDHA/6OH5LPR9yiKAodBWx4onPANpW8oUzeoEKhoTTJnvmfoPiarlayCfJY+PHkR8cecBUFTl9Pzvs2NujnCeTOx2ojhJqLaOUx3OGL/KMW+j5soiaPn/zZuOsVom+vVvnlmRHCBm8xWA1GYriGHNzfycQKYAt0+KXUPMgrHwdm+19wgQk8i9ZZFIiCYcsjX',
    }
  }
}
 *
 * Examples:
 *
 *     passport.use(new EbayStrategy(
 *       config.ebay.options,
 *       function(username, password, done) {
 *         User.findOne({ username: username, password: password }, function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  var ebayClient = require('ebay-api');

  if (!options.devName) throw new Error('EbayStrategy requires a devName option');
  if (!options.appName) throw new Error('EbayStrategy requires a appName option');
  if (!options.cert) throw new Error('EbayStrategy requires a cert option');
  if (!options.RuName) throw new Error('EbayStrategy requires a RuName option');

  this._ebayClient = ebayClient;
  this._verify = verify;
  this._options = options || {};

  passport.Strategy.call(this);
  this.name = 'ebay';
  // this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req) {
  var
    self = this,
    options = this._options,
    sessionID = req.session.sessionID;

  if (req.query && req.query['tknexp'] && req.query['username'] && sessionID) {
    console.log("Passport-ebay authenticate, received token");
    var tknexp = req.query.tknexp;
    var username = req.session.username = req.query.username;

    // console.log("Received params tknexp : %s, username : %s", tknexp, username);
    // console.log("Session ID from session : " + sessionID);

    var input = {
      serviceName: 'Trading',
      opType: 'FetchToken',
      cert: options.cert,
      devName: options.devName,
      appName: options.appName,
      sandbox: options.sandbox,
      params: {
        authToken: options.authToken,
        SessionID: sessionID
      }
    };

    // console.log("Passport-ebay authenticate, input : %s", util.inspect(input));

    self._ebayClient.ebayApiPostXmlRequest(input, function(error, results) {
      if (error) {
        console.log("Passport-ebay FetchToken callback error");
        // console.log(util.inspect(error));
        process.exit(1);
      }

      console.log("Passport-ebay FetchToken callback");
      // console.log(util.inspect(results));
      var eBayAuthToken = req.session.eBayAuthToken = results.eBayAuthToken;
      var sessionID = req.session.sessionID;

      console.log("eBayAuthToken : " + eBayAuthToken);

      function verified(err, user, info) {
        if (err) {
          return self.error(err);
        }
        if (!user) {
          return self.fail(info);
        }
        self.success(user, info);
      }

      var profile = self.userProfile(self, req, username, eBayAuthToken,
        function(err, profile) {
          self._verify(eBayAuthToken, sessionID, profile, verified);
        });
    });

  } else {
    // console.log("Passport-ebay authenticate, generating session and redirecting to ebay auth");

    var input = {
      serviceName: 'Trading',
      opType: 'GetSessionID',
      cert: options.cert,
      devName: options.devName,
      appName: options.appName,
      sandbox: options.sandbox,
      params: {
        authToken: options.authToken,
        RuName: options.RuName
      }
    };

    // console.log("Passport-ebay authenticate, input : %s", util.inspect(input));

    self._ebayClient.ebayApiPostXmlRequest(input, function(error, results) {
      if (error) {
        console.log("Passport-ebay GetSessionID callback error");
        // console.log(util.inspect(error));
        process.exit(1);
      }

      console.log("Passport-ebay GetSessionID callback");
      // console.log(util.inspect(results));
      sessionID = req.session.sessionID = results.SessionID;
      // console.log("Session ID : " + sessionID);

      var url = require('ebay-api').buildRequestUrl('Signin', {
        RuName: options.RuName,
        SessID: sessionID,
        ruparams: 'channelId%3D' + req.params.channelId
      }, null, options.sandbox);
      // console.log("Redirecting to : " + url);
      req.res.redirect(url);
    });
  }

}

Strategy.prototype.userProfile = function(self, req, username, token, done) {
  // console.log("userProfile, token : %s, username : %s", token, username);
  if (token) {
    var
      options = this._options,
      input = {
        serviceName: 'Trading',
        opType: 'GetUser',
        cert: options.cert,
        devName: options.devName,
        appName: options.appName,
        sandbox: options.sandbox,
        params: {
          authToken: token
        }
      };

    self._ebayClient.ebayApiPostXmlRequest(input, function(error, results) {
      if (error) {
        console.log("Passport-ebay GetUser callback error");
        // console.log(util.inspect(error));
        process.exit(1);
      }

      console.log("Passport-ebay GetUser callback");
      // console.log(util.inspect(results));

      var email = results.User.Email;

      var profile = {
        provider: 'ebay',
        token: token,
        username: username,
        email: email,
        displayName: username,
        channelId: req.query['channelId']
      };
      profile._json = results.User;
      done(null, profile);
    });
  }
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
