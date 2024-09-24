import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  region : 'ap-northeast-2'
});
const S3_BUCKET = process.env.S3_BUCKET;
const HOST = process.env.HOST;

export const handler = async (event) => {
  let redirectUrl = HOST;
  try {
    const {key} = event.pathParameters;
    const response = await s3.headObject({'Bucket' : S3_BUCKET, 'Key' : `url/${key}`}).promise();
    
    if(response.WebsiteRedirectLocation) {
      redirectUrl = response.WebsiteRedirectLocation;
    }
  } catch(error) {
    console.error(error);
  }

  return {
    "statusCode": 301,
    "headers": {
      "Location": redirectUrl
    },
    "isBase64Encoded": false
  }
};