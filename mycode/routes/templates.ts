import {Router, Request,Response} from 'express';
import { verificaToken } from '../middlewares/autenticacion';
import Template from '../models/template.model';
import colors from 'colors';

const templatesRoutes=Router();
//post,get,put,delete ...CRUD->Create, Read, Update, Delete
//POST-Crear nuevo templates
templatesRoutes.post('/template',verificaToken,async (req:Request,resp:Response)=>{
    const template1=req.body.template;
    const newTemplate={
        userId: req.body.usuario._id,
        name:template1.name,
        description:template1.description,
        createdTime: Date.now(),
        widgets: template1.widgets || []
    }
    await Template.create(newTemplate).then(templateDB=>{
        console.log('templateDB:',templateDB);
        resp.json({
            ok:true,
            mensaje:'Todo ok en Create Template',
            templates:templateDB
        });
    }).catch(err=>{
        console.log(colors.bgRed('***********ERROR EN CREATE TEMPLATE***********'));
        console.log(colors.red(err));
        resp.json({
            ok:false,
            mensaje:'ERROR en Create Template',
            error:err
        });

    })

   
});
//GET-Obtener información
templatesRoutes.get('/template',verificaToken,(req:Request,resp:Response)=>{
    Template.find({userId:req.body.usuario._id}).then(templateDB=>{
        console.log(colors.bgCyan('templateDB'),templateDB);
        if(templateDB){
            resp.status(200).json({
                ok:true,
                templateDB
            });
        }else{
            resp.json({
                ok:false,
                mensaje:'No se encontraron templates en la BD'
            });
        }
    }).catch(err=>{
        resp.json({
            ok:false,
            mensaje:'ERROR en Get->Template',
            error:err
        });
    });
    
   
});

//PUT-Actualizar templates
templatesRoutes.put('/template',verificaToken,(req:Request,resp:Response)=>{
    resp.json({
        ok:true,
        mensaje:'PUT-Funciona todo OK in Templates!!!.....'
    });
   
});

//DELETE-Borrar templates
templatesRoutes.delete('/template',verificaToken,(req:Request,resp:Response)=>{
    const temp1=req.body.idTemplate ||'';
    if(temp1.length<20){
        return resp.status(200).json({
            ok:false,
            idTemplate:req.body.idTemplate || '',
            mensaje:'Error: idTemplate no válido'
        });
    }

    Template.deleteOne({_id:temp1,userId:req.body.usuario._id}).then(result=>{
        if(result["deletedCount"]){
            resp.json({
                ok:true,
                result
            })
        }else{
            resp.json({
                ok:false,
                idTemplate:req.body.idTemplate,
                mensaje:'idTemplate no se encuentra en la BD',
                result
            })
        }
    }).catch(err=>{
        resp.json({
            ok:false,
            mensaje:'ERROR en DELETE->Template',
            error:err
        })
    })
   
});

export default templatesRoutes;