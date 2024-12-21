import {Router, Request,Response} from 'express';
import { Usuario } from '../models/usuario.model';
//import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';
import Token from '../classes/token';
import { verificaToken } from '../middlewares/autenticacion';
import colors, { bgCyan } from 'colors';
import { EmqxAuthRule, IEmqxAuthRule } from '../models/emqx_auth.models';
import { makeId } from './devices';
import Device from '../models/device.model';
import Template, { ITemplate } from '../models/template.model';
import CryptoJS from 'crypto-js';

const userRoutes=Router();
//post,get,put,delete ...CRUD->Create, Read, Update, Delete
userRoutes.get('/prueba',(req:Request,resp:Response)=>{
    resp.json({
        ok:true,
        mensaje:'Funciona todo OK-p64!!!!.....'
    });
    //resp.send('Hola IoT-p64');
});

//Crear Usuario
userRoutes.post('/create',(req:Request,resp:Response)=>{
    const user={
        name: req.body.name,
        email:req.body.email,
        password: bcrypt.hashSync(req.body.password,10),//,
        avatar:req.body.avatar
    }
    Usuario.create(user).then(userDB=>{
        const tokenUser=Token.getJwtToken({
            _id:userDB._id,
            name:userDB.name,
            email:userDB.email,
            avatar:userDB.avatar
            //No enviar PASSWORD
        });
        resp.json({
            ok:true,
            mensaje:'Todo ok en create',
            token:tokenUser,
            expiresIn:Date.now()+30*24*3600*1000,
            user:userDB
        });
    }).catch(err=>{
        resp.json({
            ok:false,
            mensaje:'Error en creación de usuario',
            err
        })
    })
});

//Login
userRoutes.post('/login',(req:Request,resp:Response)=>{
    const body=req.body;

    Usuario.findOne({email:body.email}).then(userDB=>{
        console.log(colors.bgCyan('En login:'),body);
        if(!userDB){
            return resp.json({
                ok:false,
                mensaje:'Usuario/contraseña no son válidos'
            });
        }
        if(userDB.compararPassword(body.password)){
            const tokenUser=Token.getJwtToken({
                _id:userDB._id,
                name:userDB.name,
                email:userDB.email,
                avatar:userDB.avatar
                //No enviar PASSWORD
            });
            resp.status(200).json({
                ok:true,
                token:tokenUser,
                expiresIn:Date.now()/1000+30*24*3600,
                userDB
            })
        }else{
            return resp.json({
                ok:false,
                mensaje:'Usuario/contraseña no son válidos***'
            });
        }
    }).catch(err=>{
        console.log('ERROR en LOGIN:',err);
        if(err) throw err;
    })
});

//Update-actualizar usuario
userRoutes.put('/update',verificaToken,(req:Request,resp:Response)=>{
    const user={
        name: req.body.name,
        password: req.body.password===undefined? undefined: bcrypt.hashSync(req.body.password,10),
        avatar:req.body.avatar
    }                                   

    console.log(colors.bgCyan('Nuevos datos:'),user);
    console.log(colors.bgCyan(req.body.usuario._id));
    Usuario.findByIdAndUpdate(req.body.usuario._id,user,{new:true}).then(userDB=>{
        if(!userDB){
            return resp.json({
                ok:false,
                mensaje:'No existe usuario con ese ID'
            })
        }
        //generar nuevo token con los datos actualizados
        const tokenUser=Token.getJwtToken({
            _id:userDB._id,
            name: userDB.name,
            email:userDB.email,
            avatar:userDB.avatar
        });

        resp.json({
            ok:true,
            token:tokenUser
        })
    }).catch(err=>{
        console.log('Error en Update:',err);
        if(err) throw err;
    })
    
});

//obtener información por Token
userRoutes.get('/',[verificaToken],(req:Request,resp:Response)=>{
    const usuario=req.body.usuario;

    resp.json({
        ok:true,
        usuario,
        expiresIn:req.body.expiresIn
    })
})

//GET MQTT credentials para users Web
userRoutes.get('/getmqttcredentials',verificaToken,async(req:Request,resp:Response)=>{
    try {
        const userId=req.body.usuario._id;
        const credentials=await getWebUserMqttCredenciales(userId);
        resp.json({
            ok:credentials.ok,
            username:credentials.username,
            password:credentials.password
        })
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR getMqttCredenciales**********************'));
        console.log(error);
        return resp.json({ok:false, username:'',password:''}) ;
    }
});

//GET MQTT credentials For Reconnection para users Web
userRoutes.get('/getmqttcredentialsforreconnection',verificaToken,async(req:Request,resp:Response)=>{
    try {
        const userId=req.body.usuario._id;
        const credentials=await getWebUserMqttCredencialesForReconexion(userId);
        resp.json({
            ok:credentials.ok,
            username:credentials.username,
            password:credentials.password
        });
        setTimeout(()=>{
            getWebUserMqttCredenciales(userId);
        },5000);
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR getMqttCredenciales For Reconexion**********************'));
        console.log(error);
        return resp.json({ok:false, username:'',password:''}) ;
    }
});

//GET MQTT credentials para devices
//userRoutes.get('/getdevicecredentials',async(req:Request,resp:Response)=>{ 
                      //getdevicecredentials   
userRoutes.post('/getdevicecredentials',async(req:Request,resp:Response)=>{    
    try {
        console.log(colors.bgCyan('req.body'),req.body);
        console.log(colors.bgCyan('req.headers'),req.headers);
        var dId='';
        	if(req.body.dId !==undefined){
            
            dId=req.body.dId;
        }else if(req.headers.did !== undefined){
            dId=req.headers.did as string;
        }else{
            
            return resp.json({
                username:'',
                password: '',
                topic: '',
                variables:[{var1:'xx1',var2:'xx2'}]
            })
        }
        console.log(colors.bgCyan('dId:'+dId));
        //const dId=req.body.dId;
        const device=await Device.findOne({dId:dId});
        const userId= (device === null)?'':device.userId;
        const templateId=(device === null)?'':device.templateId;

        var credentials=await getDeviceMqttCredenciales(dId,userId);
        var template:ITemplate[]=await Template.find({_id:templateId});
        var variables:any[]=[];
                 
        template[0].widgets.forEach(widget=>{
            /*var v=(({variable,variableFullName,variableType, variableSendFreq})=>({
                variable,
                variableFullName,
                variableType,
                variableSendFreq
            }))(widget);*/
           var v1={
                variable:      widget.variable,
                variableFullName: widget.variableFullName,
                variableType:widget.variableType,
                variableSendFreq:widget.variableSendFreq
            }
            variables.push(v1);
        });
        resp.json({
            username:credentials.username,
            password: credentials.password,
            topic: userId+'/'+dId+'/',
            variables:variables
        });
        setTimeout(()=>{
            getDeviceMqttCredenciales(dId,userId);
            console.log('Credenciales del Dispositivo:'+dId+' actualizadas');
        },10000);
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR getdevicecredentials**********************'));
        console.log(error);
        return resp.json({username:'',password:'',topic:'',variables:[]}) ;
    }
    

    

});

userRoutes.get('/variables',[verificaToken],(req:Request,resp:Response)=>{
    const usuario=req.body.usuario;
    try {
        const data={
            ok:true,
            api_port: process.env.API_PORT,
            backend_host: process.env.BACKEND_HOST,
            mongo_host:process.env.MONGO_HOST,
            mqtt_host:process.env.MQTT_HOST,
            mqtt_port:process.env.MQTT_PORT,
            mqtt_SSL_port:process.env.MQTT_SSL_PREFIX,
            axios_base_utl:process.env.AXIOS_BASE_URL

        };
        const data_str=JSON.stringify(data);
        const clave='la-clave-es-IoT-p65-1234567890';
        const {encriptado,iv}=encriptarTexto(data_str,clave);
        console.log('Encriptado:',bgCyan(encriptado));
        resp.json({
            ok:true,
            encriptado,
            iv
        })
    } catch (error) {
        console.log('**********************ERROR getdevicecredentials**********************'.bgRed);
        console.log(error);
        resp.json({
            ok:false,
            usuario,
            error
        })
        
    }
});
export default userRoutes;

		/* 
		______ _   _ _   _ _____ _____ _____ _____ _   _  _____ 
		|  ___| | | | \ | /  __ \_   _|_   _|  _  | \ | |/  ___|
		| |_  | | | |  \| | /  \/ | |   | | | | | |  \| |\ `--. 
		|  _| | | | | . ` | |     | |   | | | | | | . ` | `--. \
		| |   | |_| | |\  | \__/\ | |  _| |_\ \_/ / |\  |/\__/ /
		\_|    \___/\_| \_/\____/ \_/  \___/ \___/\_| \_/\____/  
		*/

//FUNCION para el encriptar
function encriptarTexto(plainText, secretKey){
    const iv=CryptoJS.lib.WordArray.random(16);
    const bytesEncriptados=CryptoJS.AES.encrypt(plainText,secretKey,{
        iv:iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const encriptado=bytesEncriptados.toString();
    return {
        encriptado:encriptado,
        iv: iv.toString()
    }
}
//FUNCION para el descencriptar
function descencriptarTexto(encryptedText, vector_iv,secretKey){
    const iv=CryptoJS.enc.Hex.parse(vector_iv);
    const descifrado=CryptoJS.AES.decrypt(encryptedText,secretKey,{
        iv:iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return descifrado.toString(CryptoJS.enc.Utf8);
    
}

//las credenciales MQTT seran del tipo: "user", "device", "superuser"
//en cada solicitud se cambia el username y el password
async function getWebUserMqttCredenciales(userId){
    try{
        var rule=await EmqxAuthRule.find({type:"user",userId:userId});
        if(rule.length==0){
            const newRule:IEmqxAuthRule={
                userId:userId,
                username: makeId(11),
                password:makeId(11),
                publish:[userId+"/#"],
                subscribe:[userId+"/#"],
                type:"user",
                time:Date.now(),
                updatedTime:Date.now()
            }
            const result=await EmqxAuthRule.create(newRule);
            return{
                ok:true,
                username:result.username,
                password: result.password
            }
        }else{
            const newUsername=makeId(11);
            const newPassword=makeId(11);

            const result1=await EmqxAuthRule.updateOne({type:"user",userId:userId},
                         {username:newUsername,password:newPassword,updatedTime:Date.now()});
            if(result1.modifiedCount==1 && result1.matchedCount==1){
                return{
                    ok:true,
                    username:newUsername,
                    password: newPassword
                }
            }else{
                return {ok:false}
            }
        }
    }catch(error){
        console.log(colors.bgRed('**********************ERROR getWebUserMqttCredenciales**********************'));
        console.log(error);
        return {ok:false};
    }
}
//en cada solicitud se maneienen el username y el password
async function getWebUserMqttCredencialesForReconexion(userId){
    try{
        var rule=await EmqxAuthRule.find({type:"user",userId:userId});
        if(rule.length==1){
            return{
                ok:true,
                username:rule[0].username,
                password: rule[0].password
            }
        }else{
            
                return {ok:false}
            
        }
    }catch(error){
        console.log(colors.bgRed('**********************ERROR getWebUserMqttCredencialesForReconexion**********************'));
        console.log(error);
        return {ok:false,
                username:'',
                password: ''
        };
    }
}

async function getDeviceMqttCredenciales(dId,userId){
    try {
        var rule=await EmqxAuthRule.find({type:"device",userId:userId,dId:dId});
        if(rule.length===0){
            const newRule:IEmqxAuthRule={
                userId:userId,
                dId:dId,
                username:makeId(12),
                password:makeId(12),
                publish:[userId+"/"+dId+"/+/sdata"],
                subscribe:[userId+"/"+dId+"/+/acdata"],
                type:"device",
                time: Date.now(),
                updatedTime:Date.now()
            }
            const result=await EmqxAuthRule.create(newRule);
            return {
                ok:true,
                username:result.username,
                password: result.password
            }
        }else{
            const newUsername=makeId(12);
            const newPassword=makeId(12);
            const result_1=await EmqxAuthRule.updateOne({type:"device",userId:userId,dId:dId},
                {$set:{
                    username:newUsername,
                    password:newPassword,
                    updatedTime:Date.now()
                }}
            );
            if(result_1.modifiedCount==1 && result_1.matchedCount==1){
                return {
                    ok:true,
                    username:newUsername,
                    password: newPassword
                }
            }else{
                return {
                    ok:false,
                    username: '',
                    password: ''
                } 
            }
        }
    } catch (error) {
        console.log(colors.bgRed('**********************ERROR getDeviceUserMqttCredenciales**********************'));
        console.log(error);
        return {ok:false,
                username:'',
                password: ''
        };
    }
}