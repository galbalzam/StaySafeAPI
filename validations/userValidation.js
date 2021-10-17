const Joi = require("joi");
const jwt = require("jsonwebtoken");

exports.validUser = (data) => {
  let validJoi = Joi.object({
    first_name: Joi.string().min(2).max(15).required(),
    last_name: Joi.string().min(2).max(15).required(),
    password: Joi.string().min(6).max(30).required(),
    email: Joi.string().min(6).max(50).email().required(),
    phone: Joi.string().min(9).max(10).required(),
    city: Joi.string().min(2).max(20).required(),
    street: Joi.string().min(2).max(20).required(),
    house: Joi .number().min(0).max(100).required()
  });
  return validJoi.validate(data);
};

exports.validLogin = (data) => {
  let validJoi = Joi.object({
    password: Joi.string().min(6).max(30).required(),
    email: Joi.string().min(6).max(50).email().required(),
  });
  return validJoi.validate(data);
};

exports.generateToken = (userId) => {
  var token = jwt.sign({ id: userId }, "G0491B", { expiresIn: "60mins" });
  return token;
};

exports.decodeToken = (tok) => {
  if (!tok) {
    return -1;
  }
  try {
    var dec = jwt.verify(tok, "G0491B");
    console.log(dec);
    return dec.id;
  } catch (err) {
    return -1;
  }
};
