import jwt from 'jsonwebtoken';

export default (req) => {
  const token = req.get('authorization').replace('Bearer ', '');

  const decode = jwt.decode(token);
  return decode;
};
