import React ,{useState} from 'react';
import * as  AWS from 'aws-sdk'




const S3_BUCKET ='';
const REGION ='';
const AccessKey = "";
const SecretKey = "";


//config
AWS.config.update({
    region: REGION,
    accessKeyId: AccessKey,
    secretAccessKey: SecretKey
})

const myBucket = new AWS.S3({
    params: { Bucket: S3_BUCKET},
    region: REGION,
})

const docClient =new AWS.DynamoDB.DocumentClient()


//DynamoDB TableFiles
export const putData = (tableName , data) => {
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

/** 
export const fetchData = (tableName) => {
    var params = {
        TableName: tableName
    }

    docClient.scan(params, function (err, data) {
        if (!err) {
            console.log(data)
        }
    })
}
*/
const UploadToS3WithNativeSdk = () => {

    const [progress , setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [inputText,setInputText] = useState(null);

    const handleFileInput = (e) => {
        setSelectedFile(e.target.files[0]);
    }

    const textOnChange = (e) => {
        setInputText(e.target.value);
    }

    const uniqueId = () => parseInt(Date.now() * Math.random()).toString();


    const addDataToDynamoDB = async (inputText,file) => {
        const userData = {
          Id: parseInt(uniqueId()),
          inputText:inputText,
          path: S3_BUCKET+'/'+file.name,
        }
        await putData('Files' , userData)
      }

    const sleep = (time) =>{
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    const detect = () =>{
        var finalFile = '';
        var InputText = 'jerome';
        var path = 'jerome-chen-bucket/fovus.txt';
        var S3Key = path.substring(path.indexOf('/')+1,path.length)
        myBucket.getObject(
            //get path from DynamoDB
            { Bucket: "jerome-chen-bucket", Key: S3Key},
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
    }

    const uploadFile = (file,inputText) => {

        const params = {
            ACL: 'public-read',
            Body: file,
            Bucket: S3_BUCKET,
            Key: file.name
        };

        myBucket.putObject(params)
            .on('httpUploadProgress', (evt) => {
                setProgress(Math.round((evt.loaded / evt.total) * 100))
            })
            .send((err) => {
                if (err) console.log(err)
            })
        sleep(1500).then(() => {
            addDataToDynamoDB(inputText,file) 
                alert("upload successfully")
        })
        
    }


    return <div>
        <div>Native SDK File Upload Progress is {progress}%</div><br/>
        <div><p>Text Input : </p><input type="input" name="inputText" onChange={textOnChange}/><br/></div>
        <div><p>File Input : </p> <input type="file" onChange={handleFileInput}/><br/></div>
       <div> <button onClick={() => uploadFile(selectedFile,inputText)}> Upload to S3</button><br/></div>
        <div><button onClick={() => detect()}>Test Detect</button></div>
    </div>
}

export default UploadToS3WithNativeSdk;