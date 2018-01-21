// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt

/* utf.js - UTF-8 <=> UTF-16 convertion
 *
 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */

function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
    c = array[i++];
    switch(c >> 4)
    {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}

module.exports = {
  *beforeSendResponse(requestDetail, responseDetail) {
    console.log(requestDetail.url);
    if (requestDetail.url === 'https://www.udemy.com/') {
      let newResponse = responseDetail.response;

      //newResponse.body = newResponse.body.replace("</head>", sw_html + '</head>');
      console.log(Object.prototype.toString.call(newResponse.body));
      const sw_html = `
      <script>
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
              // Registration was successful
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, function(err) {
              // registration failed :(
              console.log('ServiceWorker registration failed: ', err);
            });
          });
        }
      </script>
      `;
      newResponse.body = Utf8ArrayToStr(newResponse.body)
                              .replace("</head>", sw_html + '</head>');

      console.log("HELLO: " + requestDetail.url);
      return { response: newResponse };
    }

    if (requestDetail.url === 'https://www.udemy.com/sw.js') {
      const fs = require('fs');
      const sw_js = fs.readFileSync('sw.js', 'utf8');

      const localResponse = {
        statusCode: 200,
        header: { 'Content-Type': 'text/javascript' },
        body: sw_js
      };
      return { response: localResponse }
    }
  },

  *beforeDealHttpsRequest(requestDetail) {
    console.log("REQUEST_https: " + String(requestDetail.host.indexOf("udemy.com") !== 0));
    return (requestDetail.host.indexOf("udemy.com") !== 0);
  }


};
