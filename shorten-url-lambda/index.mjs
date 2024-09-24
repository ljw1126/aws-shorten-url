import AWS from 'aws-sdk';
import crypto from 'crypto';

const s3 = new AWS.S3({
  region : 'ap-northeast-2'
});
const BUCKET_NAME = process.env.S3_BUCKET;
const FORWARD_HOST = process.env.FORWARD_HOST;
const SHORT_KEY_SIZE = parseInt(process.env.SHORT_KEY_SIZE, 10) || 7;
const CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateRandomKey(length) {
  let key = '';
  const charsetLength = CHAR_SET.length;
  for(let i = 1; i <= length; i++) {
    const idx = crypto.randomInt(0, charsetLength);
    key += CHAR_SET[idx];
  }

  return key;
}

async function isKeyAvailable(bucket, key) {
  try {
    await s3.headObject({'Bucket': bucket, 'Key' : key}).promise();
    return false;
  } catch(error) {
    const statusCode = error.statusCode;
    if(statusCode === 403 || statusCode === 404) {
        return true;
    }
    throw error;
  }
}

async function putObjectOnS3(bucket, key, redirectLocation) {
  try {
    await s3.putObject({
      'Bucket': bucket,
      'Key': key,
      'Body': '',
      'ContentType': 'text/plain',
      'WebsiteRedirectLocation': redirectLocation
    }).promise();

    return true; 
  } catch(error) {
    console.error('Error:', error);
    return false;
  }
}

export const handler = async (event) => {
  const origin = event.native_url;

  let id;
  let key;
  while(true) {
    id = generateRandomKey(SHORT_KEY_SIZE);
    key = `url/${id}`;

    const keyAvailable = await isKeyAvailable(BUCKET_NAME, key);
    if(keyAvailable) {
      break;
    }
  }

  const isPutSuccess = await putObjectOnS3(BUCKET_NAME, key, origin);
  if(!isPutSuccess) {
    id = null;
  }

  return {
      'shortId': id,
      'forwardUrl': FORWARD_HOST,
      'nativeUrl': origin,
  }
};
