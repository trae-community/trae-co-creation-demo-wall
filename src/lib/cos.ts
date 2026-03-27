import COS from 'cos-nodejs-sdk-v5';

export const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
});

export const COS_BUCKET = process.env.COS_BUCKET!;
export const COS_REGION = process.env.COS_REGION!;
