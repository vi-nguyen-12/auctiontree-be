const AWS=require("aws-sdk");

const s3=new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const fileName="Test-AWS-S3-bucket.xlsx";

const uploadFile=()=>{
    fs.readFile(fileName,(err, data)=>{
        if(err) throw err;
        const params={
            Bucket:"auction10x-test",
            Key: "Test-AWS-S3-bucket.xlsx",
            Body:JSON.stringify(data, null,2)
        }
        s3.upload(params,function(s3Err, data){
            if(s3Err) throw s3Err;
            console.log(`File uploaded successfully at ${data.Location}`)
        })
    })
}

exports.uploadFile=uploadFile;