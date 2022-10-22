export default {
  accessToken: {
    expiration: process.env.ACCESS_TOKEN_EXPIRATION || "15 minutes",
    secretKey: process.env.ACCESS_TOKEN_SECRET_KEY,
    publicKey: process.env.ACCESS_TOKEN_PUBLIC_KEY,
  },
  refreshToken: {
    expiration: process.env.REFRESH_TOKEN_EXPIRATION || "100 days",
    secretKey: process.env.REFRESH_TOKEN_SECRET_KEY,
    publicKey: process.env.REFRESH_TOKEN_PUBLIC_KEY,
  },
};
