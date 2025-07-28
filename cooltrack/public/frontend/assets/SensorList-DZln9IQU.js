var E=(l,n,s)=>new Promise((a,f)=>{var w=o=>{try{c(s.next(o))}catch(d){f(d)}},j=o=>{try{c(s.throw(o))}catch(d){f(d)}},c=o=>o.done?a(o.value):Promise.resolve(o.value).then(w,j);c((s=s.apply(l,n)).next())});import{i as J,r as x,G as $,a7 as K,j as e,n as m,p as t,Q as k,k as C,J as A,w as _,a5 as R,x as P,a8 as T,m as h,z as X,A as G,ac as Q,al as V,a9 as q}from"./index-BsqRx7K0.js";import{d as b}from"./dayjs.min-BTu-00TD.js";import{o as v}from"./card-Cl9jFH-U.js";import{o as U}from"./grid-C-tyneNj.js";const Y=({message:l,type:n,onClose:s})=>(x.useEffect(()=>{const a=setTimeout(()=>{s()},5e3);return()=>clearTimeout(a)},[s]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}),e.jsxs("div",{style:{position:"fixed",bottom:"20px",right:"20px",zIndex:1e3,backgroundColor:n==="success"?"var(--green-9)":"var(--red-9)",color:"white",padding:"12px 16px",borderRadius:"8px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15)",display:"flex",alignItems:"center",gap:"8px",maxWidth:"300px",animation:"slideIn 0.3s ease-out"},children:[n==="success"?e.jsx(X,{size:16}):e.jsx(G,{size:16}),e.jsx(h,{size:"2",children:l})]})]})),Z=(l,n)=>{var a;if(!n.min_acceptable_temperature&&!n.max_acceptable_temperature)return"normal";const s=(a=n.max_acceptable_temperature)!=null?a:1/0;return l>s?"danger":"safe"},ee=l=>{switch(l){case"danger":return{background:"var(--red-2)",border:"var(--red-6)",text:"var(--red-11)",icon:"var(--red-9)",tempText:"var(--red-11)",tempBg:"var(--red-3)"};case"safe":return{background:"var(--green-2)",border:"var(--green-6)",text:"var(--green-11)",icon:"var(--green-9)",tempText:"var(--green-11)",tempBg:"var(--green-3)"};default:return{background:"var(--blue-2)",border:"var(--blue-6)",text:"var(--blue-11)",icon:"var(--blue-9)",tempText:"var(--blue-11)",tempBg:"var(--blue-3)"}}},re={Active:e.jsx(q,{size:window.innerWidth<768?12:14,color:"#10B981"}),Inactive:e.jsx(T,{size:window.innerWidth<768?12:14,color:"#6B7280"}),Maintenance:e.jsx(V,{size:window.innerWidth<768?12:14,color:"#F59E0B"}),Decommissioned:e.jsx(T,{size:window.innerWidth<768?12:14,color:"#EF4444"})},M={Active:"green",Inactive:"gray",Maintenance:"amber",Decommissioned:"red"},oe=()=>{const l=J(),[n,s]=x.useState(!1),[a,f]=x.useState(null),[w,j]=x.useState(0),c=x.useRef(null),o=x.useCallback(()=>{j(r=>r+1)},[]);x.useEffect(()=>(c.current=setInterval(()=>{o()},6e4),()=>{c.current&&clearInterval(c.current)}),[o]),x.useEffect(()=>()=>{c.current&&clearInterval(c.current)},[]);const{data:d,isLoading:F,error:z,mutate:B}=$("Sensor",{fields:["name","sensor_name","sensor_id","sensor_type","status","approval_status","gateway_location","gateway_id","min_acceptable_temperature","max_acceptable_temperature"]},`sensors-list-${w}`,{revalidateOnFocus:!1}),{data:W}=$("Sensor Read",{fields:["name","sensor_id","temperature","voltage","signal_strength","timestamp"],orderBy:{field:"timestamp",order:"desc"},limit:1e3},`sensor-readings-${w}`,{revalidateOnFocus:!1}),N=K.useMemo(()=>{if(!W)return{};const r={};return W.forEach(i=>{(!r[i.sensor_id]||b(i.timestamp).isAfter(b(r[i.sensor_id].timestamp)))&&(r[i.sensor_id]=i)}),r},[W]),I=(r,i)=>{f({message:r,type:i,show:!0})},D=()=>{f(null)},S=()=>E(void 0,null,function*(){s(!0);try{yield B(),o(),I("Sensors refreshed successfully","success")}catch(r){console.error("Error refreshing sensors:",r),I("Failed to refresh sensors","error")}finally{s(!1)}}),H=r=>{if(!r)return"—";const i=parseFloat(r);return isNaN(i)?"—":`${i.toFixed(1)}°C`},L=r=>{if(!r)return"No data";const i=b(),u=b(r),g=i.diff(u,"minute");if(g<1)return"Just now";if(g<60)return`${g}m ago`;const p=i.diff(u,"hour");return p<24?`${p}h ago`:`${i.diff(u,"day")}d ago`},O=()=>!d||d.length===0?e.jsx(v,{style:{background:"var(--gray-2)",border:"1px dashed var(--gray-6)",boxShadow:"none",borderRadius:window.innerWidth<768?"8px":"12px"},children:e.jsxs(t,{direction:"column",align:"center",gap:"3",p:{initial:"4",sm:"6"},children:[e.jsx(m,{style:{opacity:.6},children:e.jsx(k,{size:window.innerWidth<768?24:32,color:"var(--gray-9)"})}),e.jsx(h,{color:"gray",size:{initial:"2",sm:"3"},weight:"medium",style:{textAlign:"center"},children:"No sensors found"}),e.jsx(_,{variant:"soft",onClick:S,disabled:n,size:{initial:"2",sm:"3"},style:{borderRadius:"8px",transition:"all 0.2s ease"},children:e.jsxs(t,{align:"center",gap:"2",children:[e.jsx(R,{size:window.innerWidth<768?12:14,className:n?"animate-spin":""}),window.innerWidth>=768&&"Refresh"]})})]})}):e.jsx(U,{columns:{initial:"1",sm:"2",md:"3",lg:"4"},gap:{initial:"3",sm:"4"},children:d.map(r=>{const i=N[r.name],u=i?parseFloat(i.temperature):null,g=u!==null?Z(u,r):"normal",p=ee(g);return e.jsx(v,{style:{transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",cursor:"pointer",borderLeft:`4px solid var(--${M[r.status]}-9)`,borderRadius:window.innerWidth<768?"8px":"12px",background:"var(--color-surface)",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",position:"relative",overflow:"hidden"},className:"hover:shadow-lg hover:translate-y-[-2px] hover:border-opacity-80",onClick:()=>l(`/sensors/${r.name}`),onMouseEnter:y=>{window.innerWidth>=768&&(y.currentTarget.style.boxShadow="0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)")},onMouseLeave:y=>{window.innerWidth>=768&&(y.currentTarget.style.boxShadow="0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)")},children:e.jsxs(t,{direction:"column",gap:"3",p:{initial:"3",sm:"4"},children:[e.jsxs(t,{justify:"between",align:"start",gap:"2",children:[e.jsxs(t,{direction:"column",gap:"1",style:{minWidth:0,flex:1},children:[e.jsx(C,{size:{initial:"2",sm:"3"},style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:window.innerWidth<768?"14px":"16px",lineHeight:1.2},title:r.sensor_name||`ID: ${r.sensor_id}`,children:r.sensor_name||`ID: ${r.sensor_id}`}),e.jsxs(h,{size:"1",color:"gray",style:{fontFamily:"var(--font-mono, monospace)",fontSize:window.innerWidth<768?"10px":"11px"},children:["ID: ",r.name]})]}),e.jsx(t,{direction:"column",gap:"1",align:"end",children:e.jsx(A,{color:M[r.status],variant:"soft",size:"1",style:{fontSize:window.innerWidth<768?"9px":"10px",padding:"2px 6px"},children:e.jsxs(t,{gap:"1",align:"center",children:[re[r.status],r.status]})})})]}),e.jsxs(m,{style:{background:p.background,padding:window.innerWidth<768?"16px 12px":"20px 16px",borderRadius:"8px",border:`2px solid ${p.border}`,position:"relative",textAlign:"center"},children:[g==="danger"&&i&&e.jsx(m,{style:{position:"absolute",top:"-1px",right:"-1px",padding:"2px 6px",background:"var(--red-9)",color:"white",borderRadius:"0 6px 0 6px",fontSize:window.innerWidth<768?"8px":"9px",fontWeight:"bold",lineHeight:1,zIndex:1,boxShadow:"0 2px 4px rgba(0,0,0,0.1)"},children:"ALERT"}),e.jsxs(t,{direction:"column",align:"center",gap:"2",children:[e.jsxs(t,{align:"center",justify:"center",gap:"2",children:[e.jsx(k,{size:window.innerWidth<768?16:20,color:p.icon}),e.jsx(h,{size:{initial:"6",sm:"7"},weight:"bold",style:{color:p.tempText,fontSize:window.innerWidth<768?"24px":"32px",lineHeight:1,fontFamily:"var(--font-mono, monospace)",textShadow:"0 1px 2px rgba(0,0,0,0.1)"},children:H(i==null?void 0:i.temperature)})]}),e.jsxs(t,{align:"center",justify:"center",gap:"1",children:[e.jsx(Q,{size:window.innerWidth<768?10:12,color:i?p.icon:"var(--gray-8)"}),e.jsx(h,{size:"2",weight:"medium",style:{color:p.text,fontSize:window.innerWidth<768?"11px":"13px",fontFamily:"var(--font-mono, monospace)"},children:L(i==null?void 0:i.timestamp)})]})]})]})]})},r.name)})});return e.jsxs(m,{style:{background:"var(--gray-1)"},children:[(a==null?void 0:a.show)&&e.jsx(Y,{message:a.message,type:a.type,onClose:D}),e.jsx(m,{style:{background:"white",borderBottom:"1px solid var(--gray-6)",top:0,zIndex:10},children:e.jsxs(t,{justify:"between",align:"center",p:{initial:"4",sm:"6"},gap:"3",children:[e.jsxs(t,{align:"center",gap:"3",style:{minWidth:0,flex:1},children:[e.jsx(k,{size:window.innerWidth<768?20:24,color:"var(--blue-9)"}),e.jsx(C,{size:{initial:"4",sm:"6"},weight:"bold",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"Sensors"}),d&&d.length>0&&e.jsxs(A,{variant:"soft",color:"blue",size:"2",style:{fontSize:window.innerWidth<768?"11px":"12px"},children:[d.length," Total"]})]}),e.jsx(t,{gap:"2",align:"center",style:{flexShrink:0},children:e.jsxs(_,{variant:"soft",onClick:S,disabled:n,size:{initial:"2",sm:"3"},style:{flexShrink:0,fontSize:window.innerWidth<768?"12px":"14px"},children:[e.jsx(R,{className:n?"animate-spin":"",size:window.innerWidth<768?12:14}),e.jsx("span",{style:{display:window.innerWidth<480?"none":"inline"},children:"Refresh"})]})})]})}),e.jsxs(m,{p:{initial:"3",sm:"4",md:"6"},children:[F&&e.jsx(v,{style:{border:"1px solid var(--gray-6)",borderRadius:window.innerWidth<768?"8px":"12px"},children:e.jsx(t,{justify:"center",align:"center",p:{initial:"6",sm:"8"},gap:"3",children:e.jsx(P,{size:"3"})})}),z&&e.jsx(v,{variant:"surface",mt:"4",style:{border:"1px solid var(--red-6)",borderRadius:window.innerWidth<768?"8px":"12px",background:"var(--red-2)"},children:e.jsxs(t,{direction:"column",align:"center",gap:"3",p:{initial:"4",sm:"6"},children:[e.jsx(m,{style:{opacity:.8},children:e.jsx(T,{size:window.innerWidth<768?20:24,color:"var(--red-9)"})}),e.jsx(h,{color:"red",weight:"bold",size:{initial:"2",sm:"3"},style:{textAlign:"center"},children:"Failed to load sensors"}),e.jsx(h,{color:"red",size:{initial:"1",sm:"2"},style:{textAlign:"center",maxWidth:"300px",lineHeight:1.5},children:z.message}),e.jsx(_,{variant:"soft",color:"red",onClick:S,disabled:n,size:{initial:"2",sm:"3"},style:{borderRadius:"8px"},children:e.jsxs(t,{align:"center",gap:"2",children:[e.jsx(R,{size:window.innerWidth<768?12:14,className:n?"animate-spin":""}),window.innerWidth>=768&&"Retry"]})})]})}),!F&&!z&&O()]}),e.jsx("style",{children:`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Mobile-specific optimizations */
          @media (max-width: 767px) {
            /* Ensure proper touch targets */
            button {
              min-height: 44px;
            }
            
            /* Optimize spacing for mobile */
            [data-radix-themes] {
              --space-3: 12px;
              --space-4: 16px;
            }

            /* Card hover effects only on desktop */
            .hover\\:shadow-lg:hover {
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1) !important;
              transform: none !important;
            }
          }
          
          @media (max-width: 479px) {
            /* Extra small screens */
            [data-radix-themes] {
              --space-3: 8px;
              --space-4: 12px;
            }
          }

          @media (max-width: 380px) {
            /* Very small screens - additional optimizations */
            .sensor-card {
              padding: 8px !important;
            }
          }
        `})]})};export{oe as default};
