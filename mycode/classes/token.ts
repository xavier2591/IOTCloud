import jwt from 'jsonwebtoken';

export default class Token{
    private static seed:string='es-la-semilla-del-App-p64';
    private static caducidad='30d';
    constructor(){}

    static getJwtToken(payload:any):string{
        return jwt.sign({
            usuario:payload
        },this.seed,{expiresIn:this.caducidad});
    }

    static comprobarToken(userToken:string){
        return new Promise((resolve,reject)=>{
            jwt.verify(userToken,this.seed,(err,decoded)=>{
                if(err){
                    reject('Error en Token');
                }else{
                    resolve(decoded)
                }
            })
        })
    }
}