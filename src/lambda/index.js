// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: process.env.AWS_REGION});
// Require crypto for uuid generation
const crypto = require('crypto');
// Require https for pinging the target
const https = require('https');
// Create the DynamoDB service object
const dynamo = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const uuid = () => {
  const hex = crypto.randomBytes(16).toString("hex");
  return hex.substring(0,8) + "-" + hex.substring(8,12) + "-" + 
    hex.substring(12,16) + "-" + hex.substring(16,20) + "-" + hex.substring(20);
}

const ping = async () => {
  return new Promise ((resolve, reject) => {
    let req = https.get(process.env.TARGET_URL, (res) => {
      resolve(res);
    });
    req.on('error', err => {
      reject(err);
    });
  }); 
}

exports.handler = async (event) => {
  // Initialise outputs
  let successful = false;
  let statusCode = 0;
  
  // Ping
  try {
    const res = await ping();
    successful = true;
    statusCode = res.statusCode;
  } catch (err) {
    console.log('error pinging target');
  }
   
  // Build DB request params
  const params = {
    TableName: 'PingmaticEvents',
    Item: {
      'eventId' : {S: uuid()},
      'type' : {S: 'ping'},
      'target' : {S: process.env.TARGET_URL},
      'successful' : {BOOL: successful},
      'statusCode' : {N: statusCode.toString()},
      'createdAt' : {S: (new Date().toISOString())}
    }
  };

  // Call DynamoDB to add the item to the table
  try {
    await dynamo.putItem(params).promise();
  } catch (err) {
    console.log('error saving results');
    return {
      statusCode: 500,
      body: JSON.stringify('error saving results'),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify('OK'),
  };
};
