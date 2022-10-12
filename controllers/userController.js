const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const awsConfig = require("../config/dynamo_db_config.js");

const JWT_SECRET = "some super secret key here...";

AWS.config.update(awsConfig);

let docClient = new AWS.DynamoDB.DocumentClient();

module.exports.signUp = async (req, res) => {
  let params = {
    TableName: "user_login",
    Key: {
      number: req.body.number,
    },
  };

  await docClient.get(params, async function (err, data) {
    console.log(data);
    //validating whether user already exists or not
    if (Object.keys(data).length !== 0) {
      return res.status(400).send("user already registered.");
    }
    // generate otp for new user
    const OTP = otpGenerator.generate(6, {
      //otp - only digits
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const number = req.body.number;
    console.log("Generated OTP: ", OTP);

    const otp = {
      number: number,
      otp: OTP,
    };

    //encrypting the otp and then saving to otp_table
    const salt = await bcrypt.genSalt(10);

    otp.otp = await bcrypt.hash(otp.otp, salt);

    // saving number and generated otp in otp_table (which has expiration period)
    let params = {
      TableName: "otp_table",
      Item: {
        number: number,
        otp: otp.otp, //encrypted otp
      },
    };

    docClient.put(params, function (err, data) {
      if (err) {
        console.log("otp_table::save::error - " + JSON.stringify(err, null, 2));
      } else {
        console.log("otp_table::save::success");
      }
    });

    console.log("Hashed OTP: ", otp.otp);
    return res.status(200).send("Otp sent successfully");
  });
};

module.exports.verifyOtp = async (req, res) => {
  //check whether number exists in otp table or not
  let params = {
    TableName: "otp_table",
    Key: {
      number: req.body.number,
    },
  };

  await docClient.get(params, async function (err, data) {
    if (Object.keys(data).length === 0) {
      return res.status(400).send("You used an expired OTP!");
    } else {
      console.log(data);
      console.log(data.Item);
      console.log(data.Item.otp);
      console.log(data.Item.number);

      const rightOtpFind = data.Item;

      // matching the otp (input vs generated)

      const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp); //decrypting and comparing

      console.log("verify: ", validUser);

      if (rightOtpFind.number === req.body.number && validUser) {
        const secret = JWT_SECRET;
        const payload = {
          number: req.body.number,
        };
        const token = jwt.sign(payload, secret);

        //save the user in user_login table
        var input = {
          number: req.body.number,
          jwt_token: token,
          joined_on: new Date().toString(),
        };

        var params = {
          TableName: "user_login",
          Item: input,
        };

        await docClient.put(params, function (err, data) {
          if (err) {
            console.log(
              "user_login::save::error - " + JSON.stringify(err, null, 2)
            );
          } else {
            console.log("New user added::success");
          }
        });

        //once otp matched delete from the otp_table
        var params = {
          TableName: "otp_table",
          Key: {
            number: req.body.number,
          },
        };

        await docClient.delete(params, function (err, data) {
          if (err) {
            console.log(
              "otp_table::delete::error - " + JSON.stringify(err, null, 2)
            );
          } else {
            console.log("otp_table::delete::success");
          }
        });
        return res.status(200).send({
          message: "User registered sucessfully",
          token: token,
        });
      } else {
        return res.status(400).send("You entered wrong OTP");
      }
    }
  });
};