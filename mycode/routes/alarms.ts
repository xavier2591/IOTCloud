import {Router,Request,Response} from "express";
import axios from 'axios';
import colors from 'colors';
import { auth ,URL} from "../models/environment";
import { verificaToken } from "../middlewares/autenticacion";
import AlarmRule, { IAlarmRule } from "../models/emqx_alarm_rule.model";

const alarmRoutes=Router();
		/* 
		  ___  ______ _____ 
		 / _ \ | ___ \_   _|
		/ /_\ \| |_/ / | |  
		|  _  ||  __/  | |  
		| | | || |    _| |_ 
		\_| |_/\_|    \___/                                   
		*/
//CREATE ALARM-RULE
alarmRoutes.post('/alarm-rule',verificaToken,async(req:Request,resp:Response)=>{
    var newRule=req.body.newRule;
    newRule.userId=req.body.usuario._id;
    console.log('NewRule'.bgCyan,newRule);
    try {
        const respRule=await createAlarmRule(newRule);
        if(respRule['ok']){
            return resp.json({
                ok:true,
                emqxRuleId:respRule['emqxRuleId']
            });
        }else{
            return resp.json({
                ok:false,
                mensaje:'Error en creación de Alarm-Rule'
            });
        }
    } catch (error) {
        console.log(colors.bgRed('******ERROR**********'),error);
        return resp.json({
            ok:false,
            mensaje:'Error desconocido en creación de Alarm-Rule'
        });
    }
})


//UPDATE ALARM-RULE
alarmRoutes.put('/alarm-rule',verificaToken,async(req:Request,resp:Response)=>{
    var rule=req.body.rule;
    //console.log('EN alarm-rule, después de validar Token'.bgBlue);
    try {
        var resp_U=await updateAlarmRuleStatus(rule.emqxRuleId,rule.status);
        if(resp_U){
            return resp.json({
                ok:true,
                mensaje:'Todo ok en actualizar Status de AlarmRule'
            });
        }else{
            return resp.json({
                ok:false,
                mensaje:'Error en actualizar Status de AlarmRule'
            });
        }
    } catch (error) {
        console.log('**********************ERROR en PUT- UpdateAlarmRULES***********'.bgRed);
        console.log('Error:',error);
        return resp.json({
            ok:false,
            mensaje:'Error Desconocido en actualizar Status de AlarmRule'
        });
    }
})

//DELETE ALARM-RULE
alarmRoutes.delete('/alarm-rule',verificaToken,async(req:Request,resp:Response)=>{ 
    var emqxRuleId=req.body.emqxRuleId;
    try {
        var resp_D=await deleteAlarmRule(emqxRuleId as string);
        if(resp_D){
            return resp.json({
                ok:true,
                mensaje:'Alarma eliminada'
            });
        }else{
            return resp.json({
                ok:false,
                mensaje:'Error en eliminar Alarma'
            });
        }
    } catch (error) {
        console.log('**********************ERROR en DELETE- AlarmRULES***********'.bgRed);
        console.log('Error:',error);
        return resp.json({
            ok:false,
            mensaje:'Error Desconocido en eliminar AlarmRule'
        });
    }

})
export default alarmRoutes;
///////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////
//create ALARM
async function createAlarmRule(newAlarm:IAlarmRule){
    const url=URL+"/api/v4/rules";
    const topic=newAlarm.userId+"/"+newAlarm.dId+"/"+newAlarm.variable+"/sdata";
    var rawsql="SELECT username, topic, payload\n FROM \""+topic+"\"\n";
    rawsql=rawsql+"WHERE payload.value "+newAlarm.condition+" "+newAlarm.value;
    rawsql=rawsql+" AND is_not_null(payload.value)";

    const newRule={
        rawsql: rawsql,
        actions:[{
            name: "data_to_webserver",
            params:{
                $resource: global.alarmResource.id,
                payload_tmpl:'{"userId": "'+newAlarm.userId+'", "payload":${payload},"topic":"${topic}" }'
            }
        }],
        description: "ALARM-RULE",
        enabled: newAlarm.status
    }
    //Crear alarma en EMQX
    const res1=await axios.post(url,newRule,auth);
    const datos=res1.data.data;
    //console.log('url de EMQX'.bgCyan,url);
    //console.log('newRule de EMQX'.bgCyan,newRule);
    //console.log('params de newRule de EMQX'.bgCyan,newRule.actions[0].params);
    //console.log('res1.data de EMQX'.bgCyan,res1.data);
    console.log('DATOS de EMQX'.bgCyan,datos);
    if(datos && res1.status===200){
        //si la Alarma fue creada en EMQX grabar en la Base de Datos
        const mongoRule=await AlarmRule.create({
            userId: newAlarm.userId,
            dId: newAlarm.dId,
            deviceName: newAlarm.deviceName,
            emqxRuleId: datos.id,
            variableFullName:newAlarm.variableFullName,
            variable:newAlarm.variable,
            value:newAlarm.value,
            condition:newAlarm.condition,
            triggerTime:newAlarm.triggerTime,
            status: newAlarm.status,
            counter:0,
            createdTime:Date.now(),

        });
        var pay_1=`{"userId":"${newAlarm.userId}","dId":"${newAlarm.dId}", "deviceName":"${newAlarm.deviceName}",`;
        pay_1=pay_1+'"payload": ${payload}, "topic":"${topic}", "emqxRuleId": "'+mongoRule.emqxRuleId+'",';
        pay_1=pay_1+`"value": ${newAlarm.value} , "condition": "${newAlarm.condition}", "variable": "${newAlarm.variable}", `;
        pay_1=pay_1+`"variableFullName": "${newAlarm.variableFullName}", "triggerTime":"${newAlarm.triggerTime}"}`;
        console.log('url_2 de EMQX'.bgCyan,url);
        newRule.actions[0].params.payload_tmpl=pay_1;
        const res2=await axios.put(url+"/"+mongoRule.emqxRuleId,newRule,auth);
        if(res2.status===200){
            return { ok:true, emqxRuleId:datos.id            };
        }
    }
    //Si no tuvo los resultados adecuados devolver False
        return { ok:false            };
    
}
//GET ALARM
export async function getAlarmRule(userId:string){
    try {
        const alarmRules=await AlarmRule.find({userId:userId});
        console.log('AlarmRules de:',colors.bgMagenta(userId))
        console.log(alarmRules);
        return alarmRules
    } catch (error) {
        console.log('**********************ERROR en getAlarmRULES***********'.bgRed);
        console.log('Error:',error);
        return [];
        
    }
}

//UPDATE ALARM
async function updateAlarmRuleStatus(emqxRuleId:string, status:boolean){
    const url=URL+"/api/v4/rules/"+emqxRuleId;
    const newRule={enabled:status};
    const resp=await axios.put(url,newRule,auth);
    if(resp.data.data && resp.status===200){
        await AlarmRule.updateOne({emqxRuleId:emqxRuleId},{status:status});
        console.log('AlarmRule Status Updated...'.bgCyan);
        return true;
    }else{
        return false;
    }
}

//delete ONLY one ALARMRULE
async function deleteAlarmRule(emqxRuleId:string){
    if(emqxRuleId===undefined)
        return false;
    try {
        const url=URL+"/api/v4/rules/"+emqxRuleId;
        const resp=await axios.delete(url,auth);
        console.log('Eliminando ALARMA;'.bgRed,'url:',url);
        console.log('resp.status'.bgRed,resp.status);
        if(resp.status===200){
            const deleted=await AlarmRule.deleteOne({emqxRuleId:emqxRuleId});
            return true;
        }else{
            return false;
        }
    } catch (error) {   
        console.log('**********************ERROR en deleteAlarmRULES***********'.bgRed);
        console.log('Error:',error);
        return false;
        
    }
}