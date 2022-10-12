var AWS = require("aws-sdk");
const awsConfig = require("../config/dynamo_db_config.js");

AWS.config.update(awsConfig);

let docClient = new AWS.DynamoDB.DocumentClient();

//remove data
let remove = function () {
  var params = {
    TableName: "config",
    Key: {
      user_id: "110122",
    },
  };
  docClient.delete(params, function (err, data) {
    if (err) {
      console.log("config::delete::error - " + JSON.stringify(err, null, 2));
    } else {
      console.log("config::delete::success");
    }
  });
};
// remove();

const query = async () => {
  var params = {
    TableName: "user_login",
    Key: {
      number: "969628233",
    },
  };
  const response = await docClient
    .get(params, function(err, data){
        if(data) {
          return
        }
    })
    .promise();

  if(response){
    return;
  }
  console.log(`Query response: ${JSON.stringify(response, null, 2)}`);
};

query().catch((error) => console.error(JSON.stringify(error, null, 2)));

let fetchOneByKey = function () {
  var params = {
    TableName: "otp_table",
    Key: {
      number: "9669628233",
    },
  };
  
  docClient.scan(params, function(err, data){
    if(err) {
      console.log(err);
    }
    else {
      console.log(data);
    }
  });
};

fetchOneByKey();

let modify = function () {
  var params = {
    TableName: "config",
    Key: { user_id: "11012" },

    UpdateExpression: "set updated_by = :byUser, is_deleted = :boolValue",

    ExpressionAttributeValues: {
      ":byUser": "updateUser",
      ":boolValue": true,
    },
    ReturnValues: "UPDATED_NEW",
  };
  docClient.update(params, function (err, data) {
    if (err) {
      console.log("config::update::error - " + JSON.stringify(err, null, 2));
    } else {
      console.log("config::update::success " + JSON.stringify(data));
    }
  });
};

// modify();

let save = function () {
  var input = {
    number: "9669628233",
    created_by: "clientUser",
    created_on: new Date().toString(),
    updated_by: "clientUser",
    updated_on: new Date().toString(),
    is_deleted: false,
  };

  var params = {
    TableName: "user_login",
    Item: input,
  };

  docClient.put(params, function (err, data) {
    if (err) {
      console.log("config::save::error - " + JSON.stringify(err, null, 2));
    } else {
      console.log("config::save::success");
    }
  });
};

// save();
