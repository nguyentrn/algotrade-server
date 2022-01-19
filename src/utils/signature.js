import crypto from "crypto";

const signature = (apiSecret, queryString) => {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
};

export default signature;
