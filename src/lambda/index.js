// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: process.env.AWS_REGION});
// Require crypto for uuid generation
const crypto = require('crypto');
// Create the DynamoDB service object
const dynamo = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const uuid = () => {
  const hex = crypto.randomBytes(16).toString("hex");
  return hex.substring(0,8) + "-" + hex.substring(8,12) + "-" + 
    hex.substring(12,16) + "-" + hex.substring(16,20) + "-" + hex.substring(20);
}

exports.handler = async (event) => {
  // Build DB request params
  const params = {
    TableName: 'PingsterEvents',
    Item: {
      'eventId' : {S: uuid()},
      'type' : {S: 'ping'},
      'target' : {S: process.env.TARGET_URL},
      'successful' : {B: successful},
      'statusCode' : {S: statusCode},
      'createdAt' : {S: (new Date().toISOString())}
    }
  };

  // Call DynamoDB to add the item to the table
  dynamo.putItem(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
  const response = {
    statusCode: 200,
    body: JSON.stringify('OK'),
  };
  return response;
};
