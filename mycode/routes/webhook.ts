import {Request, Response, Router} from "express";
import colors from 'colors';
import Device from "../models/device.model";
import Data, { IData } from "../models/data.models";
import Notification, { INotification } from "../models/notifications.models";
import AlarmRule from "../models/emqx_alarm_rule.model";
import mqtt, { IClientOptions } from "mqtt";
import { verificaToken } from "../middlewares/autenticacion";
var client:mqtt.MqttClient;

const webhookRoutes=Router();

webhookRoutes.post('/alarm',async(req:Request,resp:Response)=>{
    try {
        if(req.headers.token!==process.env.EMQX_API_TOKEN){
            return resp.json({
                ok:false,
                mensaje:'Token incorrecto de webhook'
            });
        }
        const incomingAlarm=req.body;
        updateAlarmCounter(incomingAlarm.emqxRuleId);
        const lastNotif=await Notification
                            .find({dId:incomingAlarm.dId,emqxRuleId:incomingAlarm.emqxRuleId})
                            .sort({time:-1}).limit(1);
        if(lastNotif.length===0){
            console.log('FIRST TIME ALARM'.bgCyan);
            saveNotificationToMongo(incomingAlarm);
            sendMqttNotif(incomingAlarm);
        }else{
            const  timeFromLastNotif=(Date.now()-lastNotif[0].time)/1000;//en segundos
            if(timeFromLastNotif>incomingAlarm.triggerTime){
                console.log('NUEVA ACTIVACIÓN DE ALARMA'.bgCyan);
                saveNotificationToMongo(incomingAlarm);
                sendMqttNotif(incomingAlarm);
            }
        }
        resp.status(200).json({
            ok:true
        });
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR EN alarm/saver**********'),error);
        resp.json({
            ok:false,
            mensaje:'ERROR desconocido en alarm/saver',
            
        });
    }

})

webhookRoutes.post('/saver',async(req:Request,resp:Response)=>{
    const data=req.body;
    if(req.headers.token!==process.env.EMQX_API_TOKEN){
        return resp.json({
            ok:false,
            mensaje:'Token incorrecto de webhook'
        });
    }
    try {
        console.log('Data'.cyan,colors.bgCyan(data));
        const topicDividido=data.topic.split("/");
        const dId=topicDividido[1];
        const variable=topicDividido[2];
        var resultado=await Device.find({dId:dId, userId:data.userId});
        if(resultado.length==1){
            const datos:IData={
                userId:data.userId,
                dId:dId,
                variable:variable,
                value:data.payload.value,
                time:Date.now()
            }
            await Data.create(datos);
            console.log('Datos Grabados'.bgCyan,datos);
            return resp.status(200).json({
                ok:true,
                mensaje:'Datos grabados desde webhook/saver'
            })
        }
        return resp.status(200).json({
            ok:false,
            mensaje:'Datos NO grabados desde webhook/saver, no existe dId y userId especificados',
            datos:data
        })

        
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR EN webhook/saver**********'),error);
        resp.json({
            ok:false,
            mensaje:'ERROR desconocido en webhook/saver',
            datos:data
        });
    }
    

})

//GET NOTIFICATIONS
webhookRoutes.get('/notifications',verificaToken,async(req:Request,resp:Response)=>{
    try {
        const userId=req.body.usuario._id;
        const notifications=await getNotifications(userId);
        return resp.json({
            ok:true,
            data:notifications
        });
    } catch (error) {
        console.log('***************ERROR en webhook/notifications*********************'.bgRed);
        console.log(error);
        return resp.json({
            ok:false,
            mensaje:'Error desconocido en get->webhook/notifications',
            data:[]
        });

    }
});

//UPDATE NOTIFICATIONS
webhookRoutes.put('/notifications',verificaToken,async(req:Request,resp:Response)=>{
    try {
        const userId=req.body.usuario._id;
        const notificationId=req.body.notifId;
        await Notification.updateOne({userId:userId,_id:notificationId},{readed:true});
        return resp.json({
            ok:true
        });
    } catch (error) {
        console.log('***************ERROR en PUT->webhook/notifications*********************'.bgRed);
        console.log(error);
        return resp.json({
            ok:false,
            mensaje:'Error desconocido en put->webhook/notifications'
        });
    }
});
export default webhookRoutes;

///////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////
function saveNotificationToMongo(incomingAlarm){
    try {
        var newNotif=incomingAlarm;
        newNotif.time=Date.now();
        newNotif.readed=false;
        Notification.create(newNotif);
    } catch (error) {
        console.log('***************ERROR en saveNotificationToMongo*********************'.bgRed);
        console.log(error);
    }

}

async function updateAlarmCounter(emqxRuleId) {
    try {
        await AlarmRule.updateOne({emqxRuleId:emqxRuleId},{$inc:{counter:1}});
    } catch (error) {
        console.log('***************ERROR en updateAlarmCounter*********************'.bgRed);
        console.log(error);
    }
}

async function getNotifications(userId:string){
    try {
        const res=await Notification.find({userId:userId, readed:false}).sort({time:-1});
        return res;
    } catch (error) {
        console.log('***************ERROR en getNotifications*********************'.bgRed);
        console.log(error);
        return [];
    }
}

///////////////////////////////////////////////////////////////////////////////////
// MQTT
///////////////////////////////////////////////////////////////////////////////////
function startMqttClient(){
    const options:IClientOptions={
        port: 1883,
        host:process.env.EMQX_NODE_HOST,
        clientId: "superUserBackend_"+Math.round(Math.random()*10000),
        //username:'userP65',
        //password:'12345678',
        username:`${process.env.EMQX_SUPERUSER_USER}`,
        password:`${process.env.EMQX_SUPERUSER_PASSWORD}`,
        keepalive:600,
        reconnectPeriod:5000,
        protocolId: 'MQIsdp',
        protocolVersion:3,
        clean:true,
        encoding:'utf8'

    }
    client=mqtt.connect('mqtt://127.0.0.1',options);
    client.on('connect',function(){
        console.log('MQTT->CONECCIÓN EXITOSA...'.bgGreen);
    });
    client.on('reconnect', () =>{
        console.log('ERROR EN RECONEXIÓN MQTT...'.bgRed);
        //console.log('Error:',error);
    });
    client.on('error',(err1)=>{
        console.log('ERROR EN CONEXIÓN MQTT...\n'.bgRed);
        console.log('Error:',err1);
        console.log('options:',options);
    });
}

function sendMqttNotif(notif:INotification){
    const topic=`${notif.userId}/${notif.dId}/${notif.variable}/notif`;
    const msg=`The ${notif.emqxRuleId}, When the ${notif.variableFullName} is ${notif.condition} than ${notif.value} was activated`;
    client.publish(topic,msg);
}

setTimeout(()=>{
    startMqttClient();
}, 3000)