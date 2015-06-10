var urllib = require('url');

var cheerio = require('cheerio');
var request = require('request-promise');


require('es6-promise').polyfill();



var rootUrl = 'http://www.thecoverproject.net/view.php?cat_id=4&view=&limit=9999';

var $;

request(rootUrl).then(function (data) {

  $ = cheerio.load(data);

  var $games = $('a[href*="game_id"]');

  var gameUrls = [];

  $games.each(function (idx, link) {
    var $link = $(link);
    if ($link.attr('href')) {
      gameUrls.push(getAbsoluteUrl($link.attr('href'), rootUrl));
    }
  });

  return Promise.all(gameUrls.map(getGame));

}, function (err) {

  console.warn('Unexpected warning: %s', err);

}).then(function (links) {

  console.log(JSON.stringify(flattenListOfObjects(links), null, 2));

}).catch(function (err) {

  console.warn('Unexpected error: %s', err);

});



function flattenListOfObjects(list) {
  var ret = {};

  for (var i = 0; i < list.length; i++){
    for (x in list[i]) {
      ret[x] = list[i][x];
    }
  }

  return ret;
}


function getHeading() {
  return $('#covers').siblings('h2').text();
}

function getDownloadLink(relativeUrl) {
  var url = $('a[href*="download_cover"]').attr('href');
  if (!url) {
    throw new Error('Could not find download link on ' + relativeUrl);
  }
  return getAbsoluteUrl(url, relativeUrl);
}

function getAbsoluteUrl(url, relativeUrl) {
  return urllib.resolve(relativeUrl, url);
}

function getGame(url) {
  if (!url || typeof url !== 'string') {
    // return Promise.reject(new Error('Encountered invalid URL: ' + url));
  }

  return request(url).then(function (data) {

    $ = cheerio.load(data);

    try {
      var key = getHeading();
      var value = getDownloadLink(url);
    } catch (e) {
      // return Promise.reject(e);
    }

    var ret = {};
    ret[key] = value;
    return ret;

  });
}
