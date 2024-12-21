import {Router, Request,Response} from 'express';
import { verificaToken } from '../middlewares/autenticacion';
import Device, { IDevice } from '../models/device.model';
import Token from '../classes/token';
import colors, { enabled } from 'colors';

import axios from 'axios';
import SaverRule from '../models/emqx_saver_rule.model';
import Template from '../models/template.model';
import { auth,URL } from '../models/environment';
import { getAlarmRule } from './alarms';

const devicesRoutes=Router();
//post,get,put,delete ...CRUD->Create, Read, Update, Delete


//POST-Crear nuevo dispositivo
devicesRoutes.post('/device',verificaToken,async(req:Request,resp:Response)=>{
   const body=req.body;
   const user=req.body.usuario;
   const newDevice:IDevice={
    userId: user._id,
    dId: body.dId,
    name:body.name,
    password:makeId(10),
    selected:body.selected,
    templateId:body.templateId,
    templateName:body.templateName,
    createdTime: Date.now()
   }
    
    await Device.create(newDevice).then(async deviceDB=>{
        const resp_emqx=await createSaverRule(newDevice.userId,newDevice.dId,true);
        if(!resp_emqx){
            await Device.deleteOne({userId:newDevice.userId,dId:newDevice.dId});
            return resp.json({
                ok:false,
                mensaje:'Error en creación de SaverRule,       revisar conexión a EMQX',
                
            })
        }
        const tokenUser=Token.getJwtToken({
            userId:deviceDB._id,
            dId:deviceDB.dId,
            name:deviceDB.name,
            selected:deviceDB.selected,
            templateId:deviceDB.templateId,
            templateName:deviceDB.templateName
        });
        await selectDevice(newDevice.userId,newDevice.dId);
        resp.json({
            ok:true,
            mensaje:'Todo funciona OK en post->device',
            device:deviceDB,
            tokenUser
        })
    }).catch(err=>{
        console.log(colors.bgRed('**********************ERROR EN POST-DEVICE**********'),err);
        resp.json({
            ok:false,
            mensaje:'Error en creación de Device',
            error:err.errors
        })
    })
   
   
});

//GET-Leer dispositivos
devicesRoutes.get('/device',verificaToken,(req:Request,resp:Response)=>{
   Device.find({userId:req.body.usuario._id}).then(async deviceDB=>{
    if(deviceDB.length===0){
        return     resp.status(200).json({
            ok:true,
            mensaje:'No hay dispositivos creados',
            deviceDB
        })        
    }
    //desvincular el device DB
    var devices=JSON.parse(JSON.stringify(deviceDB));

    //obtener el SaverRule del Dispositivo
    const saverRules=await getSaverRules(req.body.usuario._id);

    if(saverRules.length===0){
        return resp.json({
            ok:false,
            mensaje:'ERROR en lectura de SaverRule, no existe',
            deviceDB
        })
    }

    const templates=await getTemplates(req.body.usuario._id);
    if(templates.length===0){
        return resp.json({
            ok:false,
            mensaje:'ERROR en lectura de Templates, no existe',
            deviceDB
        })
    }
    const alarmas=await getAlarmRule(req.body.usuario._id);
    //asignación de saverRules, templates y alarmRules para cada device
    devices.forEach((device,index)=>{
        device.saverRule=saverRules.filter(saverRule=> saverRule.dId===device.dId)[0];
        if(templates.length>0){
            device.template=JSON.parse(JSON.stringify(templates.filter(template=> template._id.equals(device.templateId))[0])) ;
            const _userId=JSON.parse(JSON.stringify(device.userId));
            const dId=JSON.parse(JSON.stringify(device.dId));
            const nameDisp=JSON.parse(JSON.stringify(device.name));
            const templateId=JSON.parse(JSON.stringify(device.templateId));
            const templateName=JSON.parse(JSON.stringify(device.templateName));
            devices[index].template.widgets.forEach(widget=>{
                widget.userId=_userId;
                widget.selectedDevice.dId=dId;
                widget.selectedDevice.name=nameDisp;
                widget.selectedDevice.templateId=templateId;
                widget.selectedDevice.templateName=templateName;
                widget.templateId=templateId;
                widget.templateName=templateName;
            })
        }
        //asignación de alarmas
        if(alarmas!==undefined && alarmas.length>0){
            device.alarmRules=alarmas.filter(alarm=> alarm.dId===device.dId);
        }
    })

    resp.status(200).json({
        ok:true,
        deviceDB:devices
    })
   }).catch(err=>{
    console.log(colors.bgRed('**********************ERROR EN GET-DEVICE**********'),colors.red(err));
        resp.json({
            ok:false,
            mensaje:'Error en GET->Device',
            error:err.errors
        })
   })
});

//PUT-Actualizar dispositivo
devicesRoutes.put('/device',verificaToken,async(req:Request,resp:Response)=>{
   try {
    await Device.updateMany({userId:req.body.usuario._id},{selected:false});
    await Device.updateOne({userId:req.body.usuario._id,dId:req.body.dId},{selected:true})
    resp.json({
        ok:true,
        mensaje:'Dispositivo seleccionado correctamente'
    })
   } catch (err) {
    resp.status(500).json({
        ok:false,
        error:err
    })
    
   }
});


//DELETE-Borrar dispositivo
devicesRoutes.delete('/device',verificaToken,(req:Request,resp:Response)=>{
    Device.deleteOne({userId:req.body.usuario._id,dId:req.query.dId}).then(async result=>{
        await deleteSaverRule(req.query.dId as string);
        resp.status(200).json({
            ok:true,
            result:result
        })
    }).catch(err=>{
        console.log(colors.bgRed('**********************ERROR EN DELETE-DEVICE**********'),err);
        resp.json({
            ok:false,
            mensaje:'Error en DELETE->Device',
            error:err.errors
        })
        
    })
});
//////////////////////////////////////////////////////////////////////////////////
//  RUTAS DE SAVER RULE
//////////////////////////////////////////////////////////////////////////////////
//update saverRule
devicesRoutes.put('/saver-rule',verificaToken,async (req:Request,resp:Response)=>{
    const rule=req.body.rule;
    console.log('rule:',colors.bgCyan(rule));
    try {
        await updateSaverRule(rule.emqxRuleId,rule.status);
        resp.json({
            ok:true
        })
    } catch (error) {
        resp.json({
            ok:false,
            error: error
        })
    }
});

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// SAVER RULE FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
/*const auth={
    auth:{
        username:"admin",
        password:'emqxsecret'
    }
}*/

//Create SAVERRULE
async function createSaverRule(userId:string, dId:string,status:boolean){
    const url =URL+'/api/v4/rules';
    const topic=userId+'/'+dId+'/+/sdata';
    const rawsql=`SELECT topic, payload \nFROM "${topic}" \n WHERE payload.save=1`;

    var newRule={
        rawsql:rawsql,
        actions:[
            {
                name:'data_to_webserver',
                params:{       
                    $resource: global.saverResource.id,
                    payload_tmpl:`{"userId": "${userId}"`+', "topic":"${topic}","payload":${payload}}'
                }
            }
        ],
        description:"SAVER-RULE",
        enabled: status
    }

    try {
        const resp=await axios.post(url, newRule,auth);
        if(resp.status===200 && resp.data.data){
            console.log(colors.green(resp.data.data));
            await SaverRule.create({userId:userId,
                dId:dId, emqxRuleId:resp.data.data.id, status:status
            });
            return true;
        }else{
            return false;
        }
    } catch (error) {
        console.log('**************ERROR CREATE_SAVER_RULE**************'.bgRed);
        console.log(error);
        return false;
    }
}
//GET SAVERRULE
async function getSaverRules(userId:string){
    try {
        const rules=await SaverRule.find({userId:userId});
        return rules;
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR getSaverRules**********************'));
        console.log(error);
        return [];
    }
}


//UPDATE SAVERRULE
async function updateSaverRule(emqxRuleId:string,status:boolean){
    const url=`${URL}/api/v4/rules/${emqxRuleId}`;
    const newRule={ enabled:status};

    const resp=await axios.put(url,newRule,auth);
    if(resp.status===200 && resp.data.data){
        await SaverRule.updateOne({emqxRuleId:emqxRuleId},{status:status});
        console.log('Saver Rule UPDATED'.bgGreen);
        return {
            ok:true,
            action:"updated"
        }
    }else{
        return {
            ok:false,
            mensaje:'NO se actualizó regla:'+emqxRuleId,
            action:"updated"
        }
    }
}
//DELETE SAVERRULE
async function deleteSaverRule(dId:string){
    try {
        const mongoRule=await SaverRule.findOne({dId:dId});
        const url=`${URL}/api/v4/rules/${mongoRule!==undefined?mongoRule!.emqxRuleId:""}`;
        const emqxRule=await axios.delete(url,auth);
        const deleted=await SaverRule.deleteOne({dId:dId});
        return true;
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR deleteSaverRule**********************'));
        console.log(error);
        return false;
    }
}
//SELECT DEVICE
async function selectDevice(userId:string, dId:string){
    try {
        const resultado=await Device.updateMany({userId:userId},{selected:false});
        const resultado2=await Device.updateOne({userId:userId,dId:dId},{selected:true});
        return true;
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR selectDevice**********************'));
        console.log(error);
        return false;
    }
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
async function getTemplates(userId:string){
    try {
        const templates= await Template.find({userId:userId});
        console.log('templates de getTemplates:'.bgCyan,templates);
        return templates;

    } catch (error) {
        console.log(colors.bgRed('**********************ERROR getTemplates**********************'));
        console.log(error);
        return [];
    }
}
/*
setTimeout(()=>{
    createSaverRule('userID_x1',"dId_771",true);
},2000);*/




export function makeId(length){
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
export default devicesRoutes;