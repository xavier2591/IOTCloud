import { Schema, model } from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";

const deviceSchema=new Schema({
    userId:{type:String, required:[true,'The userId is mandatory']},
    dId:{type:String, unique:true,required:[true,'The dId is mandatory']},
    name:{type:String, required:[true,'The name is mandatory']},
    password:{type:String,required:[true]},
    selected:{type:Boolean,default:false},
    templateId:{type:String,required:[true]},
    templateName:{type:String,required:[true]},
    createdTime:{type:Number}
});

//Validator
deviceSchema.plugin(mongooseUniqueValidator,{message:'Error: Device already exist.'});

export interface IDevice{
    userId:string,
    dId:string,
    name:string,
    password:string,
    selected:boolean,
    templateId:string,
    templateName:string,
    createdTime:number,
    
}

const Device=model<IDevice>('Device',deviceSchema);
export default Device;