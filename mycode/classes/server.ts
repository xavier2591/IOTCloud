import express from 'express';
import morgan from 'morgan';
import cors from 'cors';


export default class Server{
    public app:express.Application;
    public port:number=Number(process.env.API_PORT);

    

    constructor(){
        this.app=express();
        //configuracion express
        this.app.use(morgan("tiny"));
        this.app.use(express.json());
        this.app.use(express.urlencoded({
            extended:true
        }));
        this.app.use(cors());
    }

    start(callback:Function){
        this.app.listen(this.port, callback());
    }
}