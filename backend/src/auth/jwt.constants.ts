export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'change_this_secret',
  expiresIn: '1h',
};
