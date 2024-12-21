import {Router} from "express";
import axios from 'axios';
import colors from 'colors';
import { auth ,URL} from "../models/environment";
const emqxapiRoutes=Router();
global.saverResource=null;
global.alarmResource=null;



///////////////////////////////////////////////////////////
// EMQX ADMINISTRACIÓN DE RECURSOS
///////////////////////////////////////////////////////////
async function listaRecursos(){
    const endpoint='/api/v4/resources/';
    await axios.get(`${URL}${endpoint}`,auth)
            .then(resp=>{
                //console.log(colors.bgCyan('Response data:'),resp.data.data);
                const data=resp.data.data;
                const size=data.length;
                console.log('Response longitud-data:',size);
                if(size===0){
                    console.log('\n******************Creating EMQX Webhook Resources************'.bgMagenta);
                    crearRecursos();
                }else if(size==2){
                    data.forEach(resource=>{
                        if(resource.description==="alarm-webhook"){
                            console.log('******** RECURSO DE ALARM ENCONTRADO *******'.bgYellow);
                            global.alarmResource=resource;
                            console.log('******** RECURSO DE ALARM ENCONTRADO *******'.bgYellow);
                            console.log("\n");
                        }
                        if(resource.description==="saver-webhook"){
                            console.log('******** RECURSO DE SAVER ENCONTRADO*******'.bgBlue);
                            global.saverResource=resource;
                            console.log('******** RECURSO DE SAVER ENCONTRADO*******'.bgBlue);
                            console.log("\n");
                        }
                    })
                }else{
                    printWarning();
                }
            }).catch(err=>{
                console.log(colors.bgRed('******ERROR**********'),err);
            })
}
async function crearRecursos(){
    try {
        const url=URL+"/api/v4/resources";
        const data1={
            "type": "web_hook",
            "config":{
                url:"http://localhost:3000/webhook/saver",
                headers:{
                    token:process.env.EMQX_API_TOKEN
                },
                method:"POST"
            },
            description: "saver-webhook"
        }
        const data2={
            "type": "web_hook",
            "config":{
                url:"http://localhost:3000/webhook/alarm",
                headers:{
                    token:process.env.EMQX_API_TOKEN
                },
                method:"POST"
            },
            description: "alarm-webhook"
        }
        const res1=await axios.post(url,data1,auth);
        if(res1.status===200){
            console.log("Recurso SAVER creado!!!...".green);
        }
        const res2=await axios.post(url,data2,auth);
        if(res2.status===200){
            console.log("Recurso ALARM creado!!!...".green);
        }
        setTimeout(()=>{
            console.log('************CREACIÓN DE RECURSOS EXITOSA********'.bgGreen);
            listaRecursos();

        },1000)
    } catch (error) {
        console.log('*************ERROR CREANDO RECURSOS*************'.bgRed);
        console.log(error);
    }
}
function printWarning(){
    let i=0;
    if(i<5){
        console.log(colors.red("Delete ALL webhook EMQX resources and restart Node"));
        setTimeout(()=>{
            listaRecursos();i++;
        },1000);
        printWarning();
    }
}

setTimeout(()=>{
    listaRecursos()
},10000);

export default emqxapiRoutes;