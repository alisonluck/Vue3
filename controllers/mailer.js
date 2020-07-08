var nodemailer = require("nodemailer");
let AWS = require('aws-sdk');
var sesTransport = require('nodemailer-ses-transport');

exports.send = async function(to, subject, html) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    // let transporter = nodemailer.createTransport({
    //   host: process.env.EMAIL_SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
    //   port: process.env.EMAIL_SMTP_PORT || 25,
    //   auth: {
    //     user: process.env.EMAIL_SMTP_USERNAME || "AKIARFV4DDDMC3FPWEPL", // generated ethereal user
    //     pass: process.env.EMAIL_SMTP_PASSWORD || "BNDsZakfcvYgSb+wol+GIYz0DEHqjpLb0UwZLynOeShH" // generated ethereal password
    //   }
    // });

    let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || "server.cryptodenada.com",
    port: process.env.EMAIL_SMTP_PORT || 26,
    secure: process.env.EMAIL_SMTP_SECURE || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SMTP_USERNAME || "georgy.kafu@cryptodenada.com", // generated ethereal user
      pass: process.env.EMAIL_SMTP_PASSWORD || "EwiI]c>&pu7@5" // generated ethereal password
    }
  });

    // AWS.config.update({
    //     accessKeyId: 'AKIARFV4DDDMC3FPWEPL',
    //     secretAccessKey: 'BNDsZakfcvYgSb+wol+GIYz0DEHqjpLb0UwZLynOeShH',
    //     region: 'us-east-1',
    // });

    // var transporter = nodemailer.createTransport(sesTransport({
    //     accessKeyId: 'AKIARFV4DDDMC3FPWEPL',
    //     secretAccessKey: 'BNDsZakfcvYgSb+wol+GIYz0DEHqjpLb0UwZLynOeShH',
    //     rateLimit: 5
    // }));

    // create Nodemailer SES transporter
    // let transporter = nodemailer.createTransport({
    //   SES: new AWS.SES({
    //       apiVersion: '2012-10-17'
    //   })
    // });


  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "no-reply@lyricallemonade.com", // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: html // html body
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  return info;
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};
