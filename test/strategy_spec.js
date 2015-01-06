/* jshint camelcase: false */
'use strict';

var Strategy = require ('../lib/passport-ebay/strategy.js')
  , util = require('util')
  , spec_debug = require('debug')('passport-ebay:spec:strategy')
  ;

var dummy_token = "AgAAAA**AQAAAA**aAAAAA**goglUg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4GhCpiEow6dj6x9nY+seQ**HlQCAA**AAMAAA**ERyzHFua854h3C7PX1G+vTzrTOxKKPx9pbwgJ8UuxXaECbRfoXr/wY+wanaM8IPocv9J9xbV3CoO+4NxDKftnqId7+kAu6WZw9Jec75fIximTUsbd0PrHvxPWBDJ6TY8RLu1lC5kGn8QaXzsvneMPSBVnaj25oboLdlN9brLUGKYXa8ukW7xykYD8+TWXjpRtDfZDWoNnK/l2r4WzITi4eYHBfqEuxOWEUC2SngJBa/gVSkmRyqKzmRP7pQeROh5br7upHRO6Mso+LrbBBGZh3H1rJMLRxcpsFEvB+cHwQNOFVHdAglId+zMiKDptsGxJCypEJ6whwTxWFgT053hsAO2QMyYwoYWz4/lnT1aK7o4z3axdz2ctUJMOlSkUbS4WQhTxY7dtxysvTGlopNSV6HeNEGEk9JJ5b/A8LLXB3AfHtMCdnt/TEJvtmRKLEoMPAAEuKBK/xz0sMvE+5XnTWV4VgXoSVCcZHR3KsM1a9oZlm78o1LkX5wvZujRpimb+WQJZF4vJApCDuIww+xd/hM+ueM3DPiSB8qt0AKeiHlt5qyOjP4MqHQXzMbaIfcOQqU4jn/gdK1hJfsgltMSpFKnYop+k1vKJpb/gEQS9lfGX8z047jzt96539wlZZ916irUZYFu+lDz0tXUUVZa+W3Xcito3NRptgSl/a1BocLwjsC4rYnSIgZdKH+ZfWmhXlLRSLLRz7Ugfjyh8b0CxIWfrVl4QvDdBxC2aJNbLQNw5kqxku7tOplnIW+CY4hI";

var ebayMock = function Mock() {

  var responses = [];
  responses['FetchToken'] = { eBayAuthToken : dummy_token };
  responses['GetSessionID'] = { SessionID : 12345 };

  this.ebayApiPostXmlRequest = function(input, callback) {
    callback(null, responses[input.opType]);
  }
}

describe('Strategy authenticate', function() {

  it('Authenticate without token redirects to ebay', function() {

    var req = {}, res = {};

    req.params = jasmine.createSpy('req params').andReturn({});
    req.app = {};
    req.app.get = jasmine.createSpy('req app get').andReturn("");
    req.session = {};
    req.session.sessionID = jasmine.createSpy('res session sessionID').andReturn("");

    // res.header = jasmine.createSpy('res header').andReturn({});
    // res.send = jasmine.createSpy('res send').andCallFake(function(arg) {});
    res.redirect = jasmine.createSpy('res redirect').andCallFake(function(arg) {});
    req.res = res;
    

    var strategy = new Strategy(null, null, new ebayMock());
    strategy.authenticate(req, null);

    expect(req.session.sessionID).toBe(12345);
    expect(res.redirect).toHaveBeenCalledWith('https://signin.sandbox.ebay.com/ws/eBayISAPI.dll?SignIn&RuName=&SessID=12345');
    
  });

  it('Authenticate with token parses correctly', function() {

    var req = {}, res = {};

    req.params = jasmine.createSpy('req params').andReturn({});
    req.query = [];
    req.query['tknexp'] = "1970-01-01 00:00:00";
    req.query['username'] = "testuser_mr_agenda";

    req.app = {};
    req.app.get = jasmine.createSpy('req app get').andReturn("");
    req.session = {};

    // res.header = jasmine.createSpy('res header').andReturn({});
    // res.send = jasmine.createSpy('res send').andCallFake(function(arg) {});
    res.redirect = jasmine.createSpy('res redirect').andCallFake(function(arg) {});
    req.res = res;
    

    var strategy = new Strategy(null, null, new ebayMock());
    strategy.authenticate(req, null);

    expect(req.session.eBayAuthToken).toBe(dummy_token);

    expect(res.redirect).toHaveBeenCalledWith('/');
    
  });
});