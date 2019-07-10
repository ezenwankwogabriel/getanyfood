const {createAdmin, createCustomer, createMerchant} = require('./createUsers')

module.exports = function(userSchema) {
    userSchema.statics.createAdmin = async function(body) {
        // const schema = {
        //     firstName: Joi.string().min(3).required(),

        // }

        // const { error } = Joi.validate(body, schema);
        // if(error) 
        //     return {result: null, error: error.defaults[0].message}
        
        const newAdmin = await this.create({firstName: body.firstName})
        console.log({newAdmin});
        return {result: newAdmin}
    }
    
    userSchema.statics.createMerchant = async function(body) {
    
    }
    
    userSchema.statics.createCustomer = async function(body) {
    
    }


}