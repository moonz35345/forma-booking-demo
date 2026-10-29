export type Service = { id: string; name: string; category: string; duration: number; price: number; color: string; active: boolean };
export type Appointment = { id: string; customer: string; email: string; serviceId: string; staffId: string; date: string; time: string; duration: number; price: number; status: 'confirmed' | 'completed' | 'cancelled'; note: string };
export type Hours = { open: string; close: string; days: number[] };
export type DemoData = { services: Service[]; appointments: Appointment[]; hours: Hours };
export const staff = [{ id: 'mia', name: 'Mia Thompson', role: 'Senior stylist', initials: 'MT', color: '#e8dfd1' }, { id: 'alex', name: 'Alex Rivera', role: 'Color specialist', initials: 'AR', color: '#dce4dc' }, { id: 'sophie', name: 'Sophie Chen', role: 'Stylist & therapist', initials: 'SC', color: '#ebdde1' }];
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const parseDate = (date: string) => new Date(`${date}T12:00:00`);
export const addDays = (date: string, days: number) => { const d = parseDate(date); d.setDate(d.getDate()+days); return dateKey(d); };
export const minutes = (time: string) => { const [h,m] = time.split(':').map(Number); return h*60+m; };
export const timeKey = (n: number) => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const formatTime = (t: string) => { const n=minutes(t); return `${Math.floor(n/60)%12||12}:${String(n%60).padStart(2,'0')} ${n<720?'AM':'PM'}`; };
export function seedData(today = dateKey(new Date())): DemoData {
 const services: Service[] = [
  {id:'cut',name:'Haircut & styling',category:'Hair',duration:60,price:65,color:'sage',active:true},
  {id:'color',name:'Full color',category:'Color',duration:90,price:120,color:'lavender',active:true},
  {id:'blow',name:'Signature blowout',category:'Hair',duration:45,price:45,color:'peach',active:true},
  {id:'balayage',name:'Balayage',category:'Color',duration:120,price:180,color:'lavender',active:true},
  {id:'treatment',name:'Deep conditioning',category:'Treatment',duration:30,price:35,color:'blue',active:true},
  {id:'scalp',name:'Scalp ritual',category:'Treatment',duration:45,price:55,color:'peach',active:true}
 ];
 const names=['Olivia Rhye','Phoenix Baker','Lana Steiner','Demi Wilkinson','Drew Cano','Natali Craig','Orlando Diggs','Andi Lane'];
 const slots=[['09:00','cut','mia'],['09:30','color','alex'],['10:00','blow','sophie'],['11:00','balayage','mia'],['11:30','cut','alex'],['12:00','treatment','sophie'],['14:00','cut','mia'],['14:30','scalp','alex'],['15:00','color','sophie'],['16:00','blow','mia']];
 const appointments: Appointment[]=[];
 for(let offset=-7;offset<=7;offset++) { const day=addDays(today,offset); if(parseDate(day).getDay()===0)continue; slots.slice(0,offset===0?10:offset%3===0?7:5).forEach(([time,serviceId,staffId],i)=>{const s=services.find(s=>s.id===serviceId)!;const customer=names[(i+Math.abs(offset))%names.length]; appointments.push({id:`demo-${offset}-${i}`,customer,email:`${customer.toLowerCase().replaceAll(' ','.')}@example.com`,serviceId,staffId,date:day,time,duration:s.duration,price:s.price,status:offset<0?'completed':'confirmed',note:''});}); }
 return {services,appointments,hours:{open:'09:00',close:'18:00',days:[1,2,3,4,5,6]}};
}
export function bookingError(data: DemoData, booking: Pick<Appointment,'date'|'time'|'duration'|'staffId'>, excludeId?: string): string | null {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(booking.date)||Number.isNaN(parseDate(booking.date).getTime())||dateKey(parseDate(booking.date))!==booking.date) return 'Choose a valid date.';
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(booking.time)) return 'Choose a valid time.';
 if(!staff.some(s=>s.id===booking.staffId))return 'Choose a team member.';
 if(!Number.isFinite(booking.duration)||booking.duration<=0)return 'Service duration must be greater than zero.';
 if(!data.hours.days.includes(parseDate(booking.date).getDay()))return 'The studio is closed on this day.';
 const start=minutes(booking.time),end=start+booking.duration;
 if(start<minutes(data.hours.open)||end>minutes(data.hours.close))return 'This service must fit within business hours.';
 if(data.appointments.some(a=>a.id!==excludeId&&a.status!=='cancelled'&&a.staffId===booking.staffId&&a.date===booking.date&&start<minutes(a.time)+a.duration&&end>minutes(a.time)))return 'This time is already booked. Please choose another slot.';
 return null;
}
export function availableSlots(data: DemoData, date: string, serviceId: string, staffId: string, excludeId?: string, now?: Date): string[] {
 const service=data.services.find(s=>s.id===serviceId&&s.active); if(!service)return [];
 const result:string[]=[];
 for(let m=minutes(data.hours.open);m+service.duration<=minutes(data.hours.close);m+=30){const time=timeKey(m);if(now&&new Date(`${date}T${time}`)<=now)continue;if(!bookingError(data,{date,time,duration:service.duration,staffId},excludeId))result.push(time);}
 return result;
}
export function saveAppointment(data: DemoData, appointment: Appointment, now = new Date()): DemoData {
 const service=data.services.find(s=>s.id===appointment.serviceId&&s.active);
 if(!service)throw new Error('Choose an available service.');
 if(!appointment.customer.trim()||!/^\S+@\S+\.\S+$/.test(appointment.email))throw new Error('Enter your name and a valid email address.');
 if(new Date(`${appointment.date}T${appointment.time}`)<=now)throw new Error('Choose a future appointment time.');
 const normalized={...appointment,customer:appointment.customer.trim(),duration:service.duration,price:service.price};
 const error=bookingError(data,normalized,appointment.id);if(error)throw new Error(error);
 return {...data,appointments:[...data.appointments.filter(a=>a.id!==appointment.id),normalized]};
}
