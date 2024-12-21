import { Schema, model } from "mongoose";

const dataSchema=new Schema({
    userId:{type:String, required:[true,'The userId is mandatory']},
    dId:{type:String, required:[true,'The dId is mandatory']},
    variable:{type:String,required:[true,'The variable is mandatory']},
    value:{type:Number, required:[true,'The value is mandatory']},
    time:{type:Number, required:[true,'The dataTime is mandatory']},
});

export interface IData{
    userId:string,
    dId:string,
    variable:string,
    value:number,
    time:number
}
const Data=model<IData>('Data',dataSchema);
export default Data;