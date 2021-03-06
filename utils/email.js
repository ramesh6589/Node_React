process.env.FROM_EMAIL="ramesh6589@gmail.com"
process.env.POSTMARK_API_TOKEN="bla-bla-bla-9619-a6d1185548cd";
if (!process.env.FROM_EMAIL) {
  console.log('Please set: FROM_EMAIL environment variable. This is a validated email address to send emails from to other users for email verification, reset pwd etc')
  process.exit();
}

if(!process.env.POSTMARK_API_TOKEN) {
  console.error('Error! Please set POSTMARK_API_TOKEN from postmark email service.');
  process.exit();
}

var postmark = require("postmark")(process.env.POSTMARK_API_TOKEN);
var async = require('async');
var crypto = require('crypto');

function sendWelcomeEmail(user, host, finalCB) {
  host = host.indexOf('localhost') >= 0 ? 'http://' + host : 'https://' + host;

  async.waterfall([
      function(done) {
        crypto.randomBytes(15, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        user.verifyEmailToken = token;
        user.verifyEmailTokenExpires = Date.now() + 3600000 * 24; // 24 hours
        user.isEmailVerified = false; 
        user.save(function(err) {
          done(err, user);
        });
      },
      function(user, done) {
        postmark.sendEmailWithTemplate({
          "From": process.env.FROM_EMAIL,
          "To": user.email,
          "TemplateId": 491642,
          "TemplateModel": {
            "product_name": "React Redux Blog",
            "name": user.name,
            "action_url": host + '/validateEmail/' + user.verifyEmailToken,
            "username": user.username,
            "sender_name": "Redux Team",
            'sender_name_Value': 'Raja',
            'product_name_Value': 'React-Redux-Blog',
            "product_address_line1": "One Market",
            "product_address_line2": "San Francisco"
          }
        }, done);
      }
    ],
    function(err) {
      if (err) {
        console.log('Could not send welcome email to: ' + user.email);
        console.error(err);
        if (finalCB) {
          finalCB({
            message: 'Could not send welcome email to: ' + user.email
          });
        }
      } else {
        if (finalCB) {
          finalCB();
        }
      }
    });

}

module.exports = {
  sendWelcomeEmail: sendWelcomeEmail
};