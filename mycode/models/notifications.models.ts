import { Schema, model } from "mongoose";

const notificationSchema=new Schema({
    userId: { type: String, required: [true,'the userId is mandatory'] },
	dId: { type: String, required: [true,'the dId is mandatory'] },
	deviceName: { type: String, required: [true, 'the deviceName is mandatory'] },
	payload: { type: Object },
	emqxRuleId: { type: String, required: [true] },
	topic: { type: String, required: [true] },
	value: { type: Number, required: [true] },
	condition: { type: String, required: [true] },
	variableFullName: { type: String },
	variable: { type: String, required: [true] },
	readed: {type: Boolean, required: [true]},
	time: {type: Number, required: [true]}
})

export interface INotification{
    userId: string,
	dId: string,
	deviceName: string,
	payload: object,
	emqxRuleId: string,
	topic: string,
	value: number,
	condition: string,
	variableFullName: string,
	variable: string,
	readed: boolean,
	time: number
}
const Notification=model<INotification>('Notification',notificationSchema);
export default Notification;