import {Schema,model} from 'mongoose';

const saverRuleSchema=new Schema({
    userId: {type:String, required:[true]},
    dId: {type:String, required:[true]},
    emqxRuleId: {type:String, required:[true]},
    status: {type:Boolean, required:[true]}
});

export interface ISaverRule{
    userId:string,
    dId:string,
    emqxRuleId: string,
    status: boolean
}

const SaverRule=model<ISaverRule>('SaverRule',saverRuleSchema);
export default SaverRule;