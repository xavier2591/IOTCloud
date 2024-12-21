"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autenticacion_1 = require("../middlewares/autenticacion");
const template_model_1 = __importDefault(require("../models/template.model"));
const colors_1 = __importDefault(require("colors"));
const templatesRoutes = (0, express_1.Router)();
//post,get,put,delete ...CRUD->Create, Read, Update, Delete
//POST-Crear nuevo templates
templatesRoutes.post('/template', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    const template1 = req.body.template;
    const newTemplate = {
        userId: req.body.usuario._id,
        name: template1.name,
        description: template1.description,
        createdTime: Date.now(),
        widgets: template1.widgets || []
    };
    yield template_model_1.default.create(newTemplate).then(templateDB => {
        console.log('templateDB:', templateDB);
        resp.json({
            ok: true,
            mensaje: 'Todo ok en Create Template',
            templates: templateDB
        });
    }).catch(err => {
        console.log(colors_1.default.bgRed('***********ERROR EN CREATE TEMPLATE***********'));
        console.log(colors_1.default.red(err));
        resp.json({
            ok: false,
            mensaje: 'ERROR en Create Template',
            error: err
        });
    });
}));
//GET-Obtener información
templatesRoutes.get('/template', autenticacion_1.verificaToken, (req, resp) => {
    template_model_1.default.find({ userId: req.body.usuario._id }).then(templateDB => {
        console.log(colors_1.default.bgCyan('templateDB'), templateDB);
        if (templateDB) {
            resp.status(200).json({
                ok: true,
                templateDB
            });
        }
        else {
            resp.json({
                ok: false,
                mensaje: 'No se encontraron templates en la BD'
            });
        }
    }).catch(err => {
        resp.json({
            ok: false,
            mensaje: 'ERROR en Get->Template',
            error: err
        });
    });
});
//PUT-Actualizar templates
templatesRoutes.put('/template', autenticacion_1.verificaToken, (req, resp) => {
    resp.json({
        ok: true,
        mensaje: 'PUT-Funciona todo OK in Templates!!!.....'
    });
});
//DELETE-Borrar templates
templatesRoutes.delete('/template', autenticacion_1.verificaToken, (req, resp) => {
    const temp1 = req.body.idTemplate || '';
    if (temp1.length < 20) {
        return resp.status(200).json({
            ok: false,
            idTemplate: req.body.idTemplate || '',
            mensaje: 'Error: idTemplate no válido'
        });
    }
    template_model_1.default.deleteOne({ _id: temp1, userId: req.body.usuario._id }).then(result => {
        if (result["deletedCount"]) {
            resp.json({
                ok: true,
                result
            });
        }
        else {
            resp.json({
                ok: false,
                idTemplate: req.body.idTemplate,
                mensaje: 'idTemplate no se encuentra en la BD',
                result
            });
        }
    }).catch(err => {
        resp.json({
            ok: false,
            mensaje: 'ERROR en DELETE->Template',
            error: err
        });
    });
});
exports.default = templatesRoutes;
