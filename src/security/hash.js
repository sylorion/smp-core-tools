import bcrypt from 'bcryptjs';

export const hashPassword = (password, salt = 12) => bcrypt.hash(password, salt);
export const comparePassword = (password, hashed) => bcrypt.compare(password, hashed);
