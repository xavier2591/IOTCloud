import { Schema, model } from "mongoose";
//import uniqueValidator from 'mongoose-unique-validator';

const emqxAuthRuleSchema=new Schema({
    userId:{type:String, required:[true,'The userId is mandatory']},
    dId:{type:String},
    username:{type:String, required:[true,'The username is mandatory']},
    password:{type:String, required:[true,'The password is mandatory']},
    publish:{type:Array},
    subscribe:{type:Array},
    type:{type:String, required:[true,'The type is mandatory']},
    time:{type:Number},
    updatedTime:{type:Number}
});

export interface IEmqxAuthRule{
    userId:string;
    dId?:string;
    username:string;
    password:string;
    publish:Array<any>;
    subscribe:Array<any>;
    type:string;
    time:number;
    updatedTime:number
}

export const EmqxAuthRule=model<IEmqxAuthRule>('EmqxAuthRule',emqxAuthRuleSchema);