import {Router,Request,Response} from "express";
import axios from 'axios';
import colors from 'colors';
import { auth ,URL} from "../models/environment";
import { verificaToken } from "../middlewares/autenticacion";
import Data from "../models/data.models";

const dataRoutes=Router();

dataRoutes.get('/chart-data',verificaToken,async(req:Request,resp:Response)=>{
    try {
        const userId=req.body.usuario._id;
        var chartTimeAgo:number=Number(req.query.chartTimeAgo || 0);
        const dId=req.query.dId;
        const variable=req.query.variable;
        
        chartTimeAgo=chartTimeAgo*1000*60*60*24;//el chartTimeAgo convierte días a milisegundos
        if(chartTimeAgo===0){chartTimeAgo=Date.now();}
        const timeAgoMs=Date.now()-chartTimeAgo;

        const data=await Data.find({userId:userId,dId:dId,variable:variable,"time":{$gt:timeAgoMs}}).sort({"time":1});
        return resp.json({
            ok:true,
            data
        })

    } catch (error) {
        console.log(colors.bgRed('**********************ERROR EN get->chart-data**********'),error);
        resp.json({
            ok:false,
            mensaje:'ERROR desconocido en get->"/api/chart-data"',
            data:[]
        });
    }

});

export default dataRoutes;
