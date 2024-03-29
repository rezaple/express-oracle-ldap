import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const header = req.headers.authorization;
  let token;

  if (header) token = header.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({
          status:401,
          message:'The user credentials were incorrect.',
        });
      } else {
        next();
      }
    });
  } else {
    res.status(401).json({
      status:401,
      message:'No Token.',
    });
  }
};
