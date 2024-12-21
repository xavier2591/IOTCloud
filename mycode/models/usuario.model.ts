import { Schema, model } from "mongoose";
import uniqueValidator from 'mongoose-unique-validator';
//import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';
const usuarioSchema=new Schema({
    name:{type:String, required:[true,'The name is mandatory']},
    avatar:{type:String,default:'av-1.png'},
    email:{type:String,unique:true, required:[true,'The email is mandatory']},
    password:{type:String, required:[true,'The password is mandatory']},
});
usuarioSchema.method('compararPassword',function(password:string=''):boolean{
    if(bcrypt.compareSync(password,this.password)){
        return true;
    }else{
        return false;
    }
});

usuarioSchema.plugin(uniqueValidator,{message:'Error: ya existe ese email'});

interface IUsuario extends Document{
    name:string;
    avatar:string;
    email:string;
    password:string;

    compararPassword(password:string):boolean;
}


export const Usuario=model<IUsuario>('User_P64',usuarioSchema);
