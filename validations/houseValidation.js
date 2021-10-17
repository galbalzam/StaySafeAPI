const Joi = require("joi");

exports.validHouse = (data)=>{
    let validJoi = Joi.object({
        count: Joi.number().min(1).max(10000000).required(),
        location: Joi.string().min(2).max(20).required()
    })
    return validJoi.validate(data);
}