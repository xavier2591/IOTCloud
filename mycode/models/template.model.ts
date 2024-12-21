import { Schema, model } from "mongoose";

const templateSchema=new Schema({
    userId:{type:String, required:[true,'The userId is mandatory']},
    name:{type:String, required:[true,'The name is mandatory']},
    description:{type:String},
    createdTime:{type:Number,required:[true]},
    widgets:{type:Array, default:[]}
});

export interface ITemplate {
    userId:string,
    name:string,
    description:string,
    createdTime:number,
    widgets: Array<any>
}

const Template=model<ITemplate>('Template',templateSchema);
export default Template;