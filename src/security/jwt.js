import jwt from 'jsonwebtoken';

export const generateToken = (payload, salt, expire = '15m') => jwt.sign(payload, salt, { expiresIn: expire });
export const verifyToken = (token, salt) => jwt.verify(token, salt);
