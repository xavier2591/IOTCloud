import dotenv from "dotenv";

dotenv.config();
//export const URL='http://127.0.0.1:8085';
export const URL='http://emqx:8081';
export const auth={
        auth:{
        username:'admin',
        password:`${process.env.EMQX_DEFAULT_APPLICATION_SECRET}`
        }
    }
