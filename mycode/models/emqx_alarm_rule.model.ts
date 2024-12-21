import {Schema,model} from 'mongoose';

const alarmRuleSchema=new Schema({
    userId: {type:String, required:[true,'The userId is mandatory']},
    dId: {type:String, required:[true,'The dId is mandatory']},
    deviceName: {type:String, required:[true]},
    emqxRuleId: {type:String, required:[true]},
    variableFullName:{type:String, required:[true]},
    variable:{type:String, required:[true]},
    value:{type:Number, required:[true]},
    condition:{type:String, required:[true]},
    triggerTime:{type:Number, required:[true]},
    status: {type:Boolean, required:[true]},
    counter:{type:Number, required:[true]},
    createdTime:{type:Number, required:[true]}
});

export interface IAlarmRule{
    userId?: string;
    dId: string;
    deviceName: string;
    emqxRuleId: string;
    variableFullName:string;
    variable:string;
    value:number;
    condition:string;
    triggerTime:number;
    status: boolean;
    counter?:number;
    createdTime?:number;
}

const AlarmRule=model<IAlarmRule>('alarmRule',alarmRuleSchema);
export default AlarmRule;