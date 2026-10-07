import React, { useState, useEffect, useRef } from 'react';

const h = React.createElement;
const D = (c, ...k) => {
  let props = {};

  if (k.length && k[0] && typeof k[0] === 'object' && !React.isValidElement(k[0])) {
    props = k.shift();
  }

  return h('div', { className: c, ...props }, ...k);
};
const pad=n=>String(n).padStart(2,'0'),ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),TD=()=>ds(new Date());
const mins=t=>{const p=t.split(':');return +p[0]*60+ +p[1]},nowM=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const sched=t=>{const d=new Date(),p=t.split(':');d.setHours(+p[0],+p[1],0,0);return d.getTime()};
const dt=s=>new Date(s+'T00:00');
const due=(m,date)=>{if(date<m.start||(m.end&&date>m.end))return false;if(m.freq==='alt')return Math.round((dt(date)-dt(m.start))/864e5)%2===0;if(m.freq==='weekly')return m.days.includes(dt(date).getDay());return true};
const DEF={user:null,meds:[],logs:[],diary:[],notified:{},snz:{}};
const copy=o=>JSON.parse(JSON.stringify(o));
const sc=l=>l.s==='taken'?'ok':l.s==='missed'?'bad':'warn';
function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=880;o.start();setTimeout(()=>{o.stop();c.close()},600)}catch(e){}}
function stats(L){const tk=L.filter(x=>x.s!=='missed').length;return{tk,ms:L.length-tk,late:L.filter(x=>x.s==='delayed').length,pct:L.length?Math.round(tk*100/L.length):0}}
function dayPct(L,d){const x=L.filter(l=>l.date===d);return x.length?Math.round(100*x.filter(l=>l.s!=='missed').length/x.length):null}
function risk(S){const k=ds(new Date(Date.now()-6*864e5)),L=S.logs.filter(l=>l.date>=k),mr=L.length?L.filter(l=>l.s==='missed').length/L.length:0;
 const o=S.logs.slice().sort((a,b)=>(a.date+a.t).localeCompare(b.date+b.t));let st=0;for(let i=o.length-1;i>=0&&o[i].s==='missed';i--)st++;
 const v=Math.round(100*(0.6*mr+0.4*Math.min(st,3)/3));return{v,lv:v<25?'Low':v<50?'Medium':'High',st}}
function insights(S){const L=S.logs,out=[],b={Morning:[0,0],Afternoon:[0,0],Evening:[0,0]};
 L.forEach(l=>{const m=mins(l.t),k=m<720?'Morning':m<1020?'Afternoon':'Evening';b[k][1]++;if(l.s==='missed')b[k][0]++});
 const w=Object.entries(b).filter(e=>e[1][1]>=2).sort((x,y)=>y[1][0]/y[1][1]-x[1][0]/x[1][1])[0];
 if(w&&w[1][0]>0)out.push('You miss most '+w[0].toLowerCase()+' doses ('+Math.round(100*w[1][0]/w[1][1])+'% missed). Try linking that dose to a daily habit.');
 const we=L.filter(l=>[0,6].includes(dt(l.date).getDay())),wm=we.filter(l=>l.s==='missed').length;
 if(we.length>=2&&wm/we.length>0.3)out.push('Weekends are harder: '+wm+' of '+we.length+' weekend doses missed.');
 const d=L.filter(l=>l.s==='delayed').length;if(d>=2)out.push(d+' doses were taken late. Consider an earlier reminder.');
 if(!out.length)out.push(L.length<4?'Record a few more doses to unlock personalised insights.':'Great consistency! No risky patterns found.');return out}
function reportText(S){const s=stats(S.logs),r=risk(S),u=S.user||{};
 return 'MEDICATION ADHERENCE REPORT\nPatient: '+(u.name||'-')+(u.age?' ('+u.age+' yrs)':'')+'\nDate: '+TD()+'\nAdherence: '+s.pct+'% ('+s.tk+' taken, '+s.ms+' missed, '+s.late+' late)\nMissed-dose risk: '+r.lv+'\n\nMedicines:\n'+(S.meds.map(m=>'- '+m.name+' '+m.dose+' at '+m.times.join(', ')+' ('+m.note+'), '+m.qty+' left').join('\n')||'none')+'\n\nRecent doses:\n'+(S.logs.slice(-10).reverse().map(l=>{const m=S.meds.find(x=>x.id===l.id);return l.date+' '+l.t+' '+(m?m.name:'?')+': '+l.s}).join('\n')||'none')+(r.st>=2||s.ms>=3?'\n\nALERT: repeated missed doses. Please check in on the patient.':'')}

const IP={today:'M4 7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2zM4 10h16M8 3v4M16 3v4',meds:'M10.5 20.5l-7-7a4.95 4.95 0 017-7l7 7a4.95 4.95 0 01-7 7zM8.5 8.5l7 7',report:'M3 3v18h18M7 15l4-5 3 3 5-6',care:'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0012 6a5.5 5.5 0 00-10 2.5c0 2.3 1.5 4 3 5.5l7 7z'};
const Ic=n=>h('svg',{width:22,height:22,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:IP[n]}));
const Logo=()=>h('svg',{width:36,height:36,viewBox:'0 0 36 36','aria-hidden':true},h('rect',{width:36,height:36,rx:8,fill:'var(--ac)'}),h('path',{d:'M18 9v18M9 18h18',stroke:'var(--acfg)',strokeWidth:4,strokeLinecap:'round'}));
const Top=(a,b)=>D('top',Logo(),D('sp',h('div',{className:'pn'},a),D('mut',b)));
function Register({go}){
 const[f,setF]=useState({name:'',age:'',allergies:'',conditions:'',cgName:'',cgPhone:''});
 const s=k=>e=>setF({...f,[k]:e.target.value}),I=(l,k,p,t)=>[h('label',{key:'l'+k},l),h('input',{key:k,value:f[k],onChange:s(k),placeholder:p,type:t||'text'})];
 return D('card',h('h2',{style:{marginTop:0}},'Create your profile'),...I('Full name','name','e.g. Shweta Kushwaha'),...I('Age','age','e.g. 62','number'),...I('Allergies','allergies','e.g. Penicillin'),...I('Medical conditions','conditions','e.g. Diabetes, BP'),...I('Caregiver name (optional)','cgName','e.g. Son'),...I('Caregiver WhatsApp number (optional)','cgPhone','10-digit number','tel'),
  h('button',{className:'b',onClick:()=>f.name.trim()&&go(f)},'Start'),h('div',{className:'mut',style:{marginTop:8}},'Your data stays on this device.'))
}
function Today({S,mark}){
 const d=TD(),doses=S.meds.filter(m=>due(m,d)).flatMap(m=>m.times.map(t=>({m,t}))).sort((a,b)=>a.t.localeCompare(b.t)),low=S.meds.filter(m=>m.qty<=m.refill);
 const done=doses.filter(({m,t})=>S.logs.some(x=>x.id===m.id&&x.date===d&&x.t===t)).length;
 return D('',low.map(m=>D('alert',{key:m.id},h('b',null,'Refill needed. '),m.name+' has '+m.qty+' left.')),
  D('card',D('row',h('b',{className:'sp'},"Today's schedule"),D('mut',done+' of '+doses.length+' doses recorded')),D('bar',h('i',{style:{width:(doses.length?100*done/doses.length:0)+'%'}}))),
  !doses.length?D('card empty','No doses scheduled today. Add a medicine to begin.'):D('card list',doses.map(({m,t})=>{const l=S.logs.find(x=>x.id===m.id&&x.date===d&&x.t===t),st=l?l.s:'pending';
   return D('dose',{key:m.id+t},D('tm',t),D('sp',D('row',h('b',{className:'sp'},m.name),h('span',{className:'chip '+(l?sc(l):'')},st[0].toUpperCase()+st.slice(1))),D('mut',m.dose+', '+m.note),D('mut',m.qty+' remaining'),
    D('row',{style:{marginTop:10}},h('button',{className:'b',onClick:()=>mark(m.id,t,'taken')},'Mark taken'),h('button',{className:'b g',onClick:()=>mark(m.id,t,'missed')},'Mark missed'))))})))
}
function Meds({S,upd}){
 const E={name:'',dose:'',t1:'09:00',t2:'',freq:'daily',days:[1,2,3,4,5],start:TD(),end:'',qty:30,refill:5,note:'Any time'};
 const[f,setF]=useState(E),[err,setErr]=useState('');
 const s=k=>e=>setF({...f,[k]:e.target.value}),F=(l,k,t)=>[h('label',{key:'l'+k},l),h('input',{key:k,type:t||'text',value:f[k],onChange:s(k)})];
 const add=()=>{if(!f.name.trim())return setErr('Enter a medicine name.');const times=[f.t1,f.t2].filter(Boolean);if(!times.length)return setErr('Set a time.');
  upd(c=>{c.meds.push({id:Date.now(),name:f.name.trim(),dose:f.dose||'1 dose',times,freq:f.freq,days:f.days,start:f.start||TD(),end:f.end,qty:+f.qty||0,refill:+f.refill||0,note:f.note,created:Date.now()})});setF(E);setErr('')};
 const fl={daily:'Every day',alt:'Alternate days',weekly:'Selected weekdays'};
 return D('',D('card',h('h2',{style:{marginTop:0}},'Add a medicine'),err&&D('bad',err),...F('Medicine name','name'),...F('Dosage (e.g. 500 mg)','dose'),
  h('label',null,'How often'),h('select',{value:f.freq,onChange:s('freq')},Object.entries(fl).map(e=>h('option',{key:e[0],value:e[0]},e[1]))),
  f.freq==='weekly'&&D('tags',{style:{marginBottom:9}},['Su','Mo','Tu','We','Th','Fr','Sa'].map((n,i)=>h('label',{key:n},h('input',{type:'checkbox',checked:f.days.includes(i),onChange:()=>setF({...f,days:f.days.includes(i)?f.days.filter(x=>x!==i):[...f.days,i]})}),n))),
  ...F('Reminder time 1','t1','time'),...F('Reminder time 2 (optional)','t2','time'),
  h('label',null,'Instructions'),h('select',{value:f.note,onChange:s('note')},['Any time','Before food','After food','With food','At bedtime'].map(x=>h('option',{key:x},x))),
  ...F('Start date','start','date'),...F('End date (optional)','end','date'),...F('Quantity available','qty','number'),...F('Alert when this many are left','refill','number'),
  h('button',{className:'b',onClick:add},'Save medicine')),
  h('h2',null,'Your medicines'),!S.meds.length&&D('card mut','Nothing added yet.'),
  S.meds.map(m=>D('card row',{key:m.id},D('sp',h('b',null,m.name),D('mut',m.dose+' · '+m.times.join(', ')+' · '+fl[m.freq]+' · '+m.note),D('mut',m.start+(m.end?' to '+m.end:' onwards')+' · '+m.qty+' left')),
   h('button',{className:'b r',onClick:()=>confirm('Delete '+m.name+' and its history?')&&upd(c=>{c.meds=c.meds.filter(x=>x.id!==m.id);c.logs=c.logs.filter(x=>x.id!==m.id)})},'Delete'))))
}
function Report({S}){
 const s=stats(S.logs),r=risk(S),days=[...Array(28)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-27+i);return ds(d)}),w=days.slice(21).map(d=>dayPct(S.logs,d)),
  pts=w.map((v,i)=>(10+i*43)+','+(80-(v===null?0:v)*0.7)).join(' '),rc=r.lv==='Low'?'ok':r.lv==='Medium'?'warn':'bad',C=2*Math.PI*42;
 return D('',D('card row',h('svg',{width:110,height:110,viewBox:'0 0 100 100'},h('circle',{cx:50,cy:50,r:42,fill:'none',stroke:'var(--bd)',strokeWidth:10}),h('circle',{cx:50,cy:50,r:42,fill:'none',stroke:'var(--ac)',strokeWidth:10,strokeLinecap:'round',strokeDasharray:C,strokeDashoffset:C*(1-s.pct/100),transform:'rotate(-90 50 50)'}),h('text',{x:50,y:57,textAnchor:'middle',fontSize:22,fontWeight:700,fill:'var(--fg)'},s.pct+'%')),
  D('sp',h('b',null,'Overall adherence'),D('',h('span',{className:'ok'},s.tk+' taken'),' · ',h('span',{className:'bad'},s.ms+' missed'),' · ',h('span',{className:'warn'},s.late+' late')),D('',"Missed-dose risk: ",h('b',{className:rc},r.lv+' ('+r.v+'/100)')))),
  (r.st>=2||r.lv==='High')&&D('alert','Repeated missed doses. Please inform your caregiver or doctor.'),
  D('card',h('b',null,'Smart insights'),insights(S).map((t,i)=>D('mut',{key:i,style:{marginTop:6}},t))),
  D('card',h('b',null,'Last 7 days trend'),h('svg',{viewBox:'0 0 280 95',width:'100%'},h('polyline',{points:pts,fill:'none',stroke:'var(--ac)',strokeWidth:3}),w.map((v,i)=>h('text',{key:i,x:10+i*43,y:93,fontSize:9,textAnchor:'middle',fill:'var(--mut)'},['Su','Mo','Tu','We','Th','Fr','Sa'][dt(days[21+i]).getDay()])))),
  D('card',h('b',null,'28-day calendar'),D('mut','Green = all taken, red = missed, grey = no data'),D('grid',{style:{marginTop:8}},days.map(d=>{const p=dayPct(S.logs,d);return h('i',{key:d,title:d,style:{background:p===null?'var(--bd)':'hsl('+p*1.2+',65%,42%)'}})}))),
  D('card',h('b',null,'Report for your doctor'),D('row noprint',{style:{margin:'8px 0'}},h('button',{className:'b',onClick:()=>window.print()},'Print or save as PDF')),h('pre',null,reportText(S))),
  h('h2',null,'Dose history'),!S.logs.length&&D('card mut','No doses recorded yet.'),S.logs.slice().reverse().slice(0,20).map((l,i)=>{const m=S.meds.find(x=>x.id===l.id);return D('card row',{key:i},D('sp',m?m.name:'?',D('mut',l.date+' · '+l.t)),h('b',{className:sc(l)},l.s))}))
}
function Care({S,upd}){
 const u=S.user,[note,setNote]=useState(''),[mid,setMid]=useState(''),[msg,setMsg]=useState(''),txt=reportText(S),ph=(u.cgPhone||'').replace(/\D/g,'');
 const cp=async()=>{try{if(navigator.share){await navigator.share({text:txt});return}}catch(e){}try{await navigator.clipboard.writeText(txt);setMsg('Report copied.')}catch(e){setMsg('Select the report text in the Reports tab to copy.')}};
 return D('',D('card',h('h2',{style:{marginTop:0}},'Caregiver sharing'),D('mut','Caregiver: '+(u.cgName||'not set')+(ph?' · '+ph:'')),D('row',{style:{marginTop:8}},ph&&h('a',{className:'b',href:'https://wa.me/'+(ph.length===10?'91':'')+ph+'?text='+encodeURIComponent(txt),target:'_blank',rel:'noopener'},'WhatsApp report'),h('button',{className:'b g',onClick:cp},'Share / copy')),msg&&D('mut',msg)),
  D('card',h('h2',{style:{marginTop:0}},'Emergency information'),D('',h('b',null,'Name: '),u.name+(u.age?', '+u.age+' yrs':'')),D('',h('b',null,'Allergies: '),u.allergies||'none listed'),D('',h('b',null,'Conditions: '),u.conditions||'none listed'),D('',h('b',null,'Current medicines: '),S.meds.map(m=>m.name+' '+m.dose).join('; ')||'none'),D('',h('b',null,'Caregiver: '),(u.cgName||'-')+' '+(u.cgPhone||''))),
  D('card',h('h2',{style:{marginTop:0}},'Side-effect diary'),h('select',{value:mid,onChange:e=>setMid(e.target.value)},h('option',{value:''},'General'),S.meds.map(m=>h('option',{key:m.id,value:m.id},m.name))),h('textarea',{rows:2,value:note,onChange:e=>setNote(e.target.value),placeholder:'e.g. felt dizzy after the tablet'}),
   h('button',{className:'b',onClick:()=>{if(!note.trim())return;upd(c=>{c.diary.push({date:TD(),mid,text:note.trim()})});setNote('')}},'Add note'),
   S.diary.slice().reverse().map((n,i)=>D('mut',{key:i,style:{marginTop:8}},n.date+' · '+((S.meds.find(m=>m.id==n.mid)||{}).name||'General')+': '+n.text))),
  D('card',h('b',null,'Profile'),D('row',{style:{marginTop:8}},h('button',{className:'b r',onClick:()=>confirm('Erase ALL data on this device?')&&upd(c=>{Object.assign(c,copy(DEF))})},'Reset app'))))
}
function App(){
 const[S,setS]=useState(()=>{try{return{...copy(DEF),...JSON.parse(localStorage.getItem('mat2')||'{}')}}catch(e){return copy(DEF)}}),[tab,setTab]=useState('today'),[al,setAl]=useState(null),ref=useRef(S);
 ref.current=S;useEffect(()=>{try{localStorage.setItem('mat2',JSON.stringify(S))}catch(e){}},[S]);
 const upd=f=>{const c=copy(ref.current);f(c);ref.current=c;setS(c)};
 const mark=(id,t,st)=>upd(c=>{const d=TD();let l=c.logs.find(x=>x.id===id&&x.date===d&&x.t===t);const was=l&&l.s!=='missed';if(!l){l={id,date:d,t};c.logs.push(l)}
  l.s=st==='taken'&&nowM()-mins(t)>30?'delayed':st;const m=c.meds.find(x=>x.id===id);if(m){if(l.s!=='missed'&&!was)m.qty=Math.max(0,m.qty-1);if(l.s==='missed'&&was)m.qty++}});
 useEffect(()=>{const tick=()=>{const c=copy(ref.current),n=nowM(),d=TD(),now=Date.now();let fire=null,ch=false;
  c.meds.forEach(m=>{if(!due(m,d))return;m.times.forEach(t=>{if(c.logs.some(x=>x.id===m.id&&x.date===d&&x.t===t)||sched(t)<=m.created-6e4)return;const k=m.id+d+t;
   if(n>=mins(t)+60){c.logs.push({id:m.id,date:d,t,s:'missed'});ch=true}
   else if(n>=mins(t)){if(!c.notified[k]){c.notified[k]=1;fire={m,t,k};ch=true}else if(c.snz[k]&&c.snz[k]<=now){delete c.snz[k];fire={m,t,k};ch=true}}})});
  if(ch){ref.current=c;setS(c)}
  if(fire){setAl(fire);beep();try{if(Notification.permission==='granted')new Notification('Time for '+fire.m.name,{body:'Take '+fire.m.dose+' ('+fire.m.note+')'})}catch(e){}}};
  tick();const i=setInterval(tick,20000);return()=>clearInterval(i)},[]);
 if(!S.user)return D('',Top('Medication Adherence Tracker','Set up your profile'),h(Register,{go:u=>upd(c=>{c.user=u})}));
 const T=[['today','Today'],['meds','Medicines'],['report','Reports'],['care','Care']];
 return D('',Top(S.user.name,new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})),
  al&&D('ban',D('','Dose due: '+al.m.name+' ('+al.m.dose+') · '+al.m.note),D('row',{style:{marginTop:8}},h('button',{className:'b',onClick:()=>{mark(al.m.id,al.t,'taken');setAl(null)}},'Mark taken'),h('button',{className:'b g',onClick:()=>{upd(c=>{c.snz[al.k]=Date.now()+6e5});setAl(null)}},'Snooze 10 min'))),
  typeof Notification!=='undefined'&&Notification.permission==='default'&&h('button',{className:'b g noprint',onClick:()=>Notification.requestPermission().then(()=>setTab(tab))},'Turn on dose reminders'),
  h('nav',null,T.map(t=>h('button',{key:t[0],className:tab===t[0]?'on':'',onClick:()=>setTab(t[0])},Ic(t[0]),h('span',null,t[1])))),
  tab==='today'?h(Today,{S,mark,setTab}):tab==='meds'?h(Meds,{S,upd}):tab==='report'?h(Report,{S}):h(Care,{S,upd}))
}


export default App;