'use strict';
var AWS = require("aws-sdk");
AWS.config.update(
    {
      region: "",
      accessKeyId: "",
      secretAccessKey: "",
    }
);
var S3_BUCKET = 'jerome-chen-bucket';
var s3 = new AWS.S3();
const docClient =new AWS.DynamoDB.DocumentClient()
const putData = (tableName , data) => {
    var params = {
        TableName: tableName,
        Item: data
    }
    
    docClient.put(params, function (err, data) {
        if (err) {
            console.log('Error', err)
        } else {
            console.log('Success', data)
        }
    })
}

exports.handler = (event, context, callback) => {

    event.Records.forEach((record) => {
        console.log('Stream record: ', JSON.stringify(record, null, 2));
        if (record.eventName == 'INSERT') {
            //get item from DynamoDB
            var Id = JSON.stringify(record.dynamodb.NewImage.Id.N);
            var InputText = JSON.stringify(record.dynamodb.NewImage.inputText.S);
            if(InputText.toString().includes('output&')){
                return;
            }
            var path = JSON.stringify(record.dynamodb.NewImage.path.S);
         
            console.log('DynamoDB table data : Id:'+Id+'InputText: '+ InputText+' path: '+path);
            
            
            //getObject from S3
            var finalFile = '';
            var S3Key = path.substring(path.indexOf('/')+1,path.length).toString();
            console.log("S3Key :",S3Key.trim());
            s3.getObject(
                //get path from DynamoDB
                {Bucket: S3_BUCKET,Key: S3Key.trim()},
                function (error, data) {
                  if (error != null) {
                    //somthing wrong
                    console.error("Unable to get file. Error JSON:", JSON.stringify(error, null, 2));
                  } else {
                    console.log("Loaded " + data.ContentLength + " bytes");
                    console.log("Data is : "+ data.Body);
                    finalFile = data.Body+':'+InputText;
                    console.log('finalFile : '+ finalFile);
                  }
                }
              );

            //put output.txt file to S3
            const params = {
                Bucket: S3_BUCKET,
                ContentType: 'string',
                Key: 'output.txt',
                Body: finalFile
                };
            console.log("S3 putObject params: ",JSON.stringify(params));
            const response = s3.upload(params).promise();   

            //put output record to DynamoDB
            const userData = {
                Id: parseInt(Date.now() * Math.random()),
                inputText:'output&',
                path: 'jerome-chen-bucket'+'/output.txt',
            }
            putData('Files' , userData)
        }
    });
    callback(null, `Successfully processed ${event.Records.length} records.`);
};





