import { NextFunction, Request, Response } from "express";
import Token from "../classes/token";


export const verificaToken=(req:Request, res:Response,next:NextFunction)=>{
    const userToken=req.get('x-token') || '';

    Token.comprobarToken(userToken).then((decoded:any)=>{
        console.log('DECODED:',decoded);
        req.body.usuario=decoded.usuario;
        req.body.expiresIn=decoded.exp;
        next();
    }).catch(err=>{
        res.json({
            ok:false,
            mensaje:'Token no válido, error Token'
        })
    });
}