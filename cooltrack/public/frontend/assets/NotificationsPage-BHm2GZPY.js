var u=(g,a,t)=>new Promise((o,y)=>{var h=r=>{try{c(t.next(r))}catch(x){y(x)}},j=r=>{try{c(t.throw(r))}catch(x){y(x)}},c=r=>r.done?o(r.value):Promise.resolve(r.value).then(h,j);c((t=t.apply(g,a)).next())});import{h as F,r as z,a4 as C,E as H,j as e,n as d,p as n,O as m,k as b,x as T,m as l,w as f,z as k,a5 as M,M as _,H as v}from"./index-BsqRx7K0.js";import{o as I}from"./card-Cl9jFH-U.js";const B=({message:g,type:a,onClose:t})=>(z.useEffect(()=>{const o=setTimeout(()=>{t()},5e3);return()=>clearTimeout(o)},[t]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
        `}),e.jsxs("div",{style:{position:"fixed",bottom:"20px",right:"20px",zIndex:1e3,backgroundColor:a==="success"?"var(--green-9)":"var(--red-9)",color:"white",padding:"12px 16px",borderRadius:"8px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15)",display:"flex",alignItems:"center",gap:"8px",maxWidth:"300px",animation:"slideIn 0.3s ease-out"},children:[a==="success"?e.jsx(k,{size:16}):e.jsx(m,{size:16}),e.jsx(l,{size:"2",style:{flex:1},children:g})]})]})),P=()=>{var S;const{currentUser:g}=F(),[a,t]=z.useState(!1),[o,y]=z.useState(null),{data:h,isValidating:j,mutate:c,error:r}=C("cooltrack.api.v1.get_notifications",{user_email:g}),{call:x}=H("cooltrack.api.v1.update_notification"),w=(S=h==null?void 0:h.message)!=null?S:[],N=w.filter(i=>!i.seen).length,p=(i,s)=>{y({message:i,type:s,show:!0})},R=()=>{y(null)},A=i=>u(void 0,null,function*(){try{yield x({notification:i}),c(),p("Notification marked as read","success")}catch(s){console.error("Error marking notification as read:",s),p("Failed to mark notification as read","error")}}),E=()=>u(void 0,null,function*(){const i=w.filter(s=>!s.seen);if(i.length!==0)try{yield Promise.all(i.map(s=>x({notification:s.name}))),c(),p(`${i.length} notifications marked as read`,"success")}catch(s){console.error("Error marking all notifications as read:",s),p("Failed to mark all notifications as read","error")}}),W=()=>u(void 0,null,function*(){t(!0);try{yield c(),p("Notifications refreshed","success")}catch(i){p("Failed to refresh notifications","error")}finally{setTimeout(()=>{t(!1)},500)}});return j&&!a?e.jsxs(d,{style:{background:"var(--gray-1)"},children:[e.jsx(d,{style:{background:"white",borderBottom:"1px solid var(--gray-6)",top:0,zIndex:10},children:e.jsx(n,{justify:"between",align:"center",p:{initial:"4",sm:"6"},children:e.jsxs(n,{align:"center",gap:"3",style:{minWidth:0,flex:1},children:[e.jsx(m,{size:window.innerWidth<768?20:24,color:"var(--blue-9)"}),e.jsx(b,{size:{initial:"4",sm:"6"},weight:"bold",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"Notifications"})]})})}),e.jsx(n,{height:"60vh",align:"center",justify:"center",children:e.jsx(n,{direction:"column",align:"center",gap:"4",children:e.jsx(T,{size:"3"})})})]}):r&&!h?e.jsxs(d,{style:{background:"var(--gray-1)"},children:[e.jsx(d,{style:{background:"white",borderBottom:"1px solid var(--gray-6)",top:0,zIndex:10},children:e.jsx(n,{justify:"between",align:"center",p:{initial:"4",sm:"6"},children:e.jsxs(n,{align:"center",gap:"3",style:{minWidth:0,flex:1},children:[e.jsx(m,{size:window.innerWidth<768?20:24,color:"var(--blue-9)"}),e.jsx(b,{size:{initial:"4",sm:"6"},weight:"bold",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"Notifications"})]})})}),e.jsx(n,{height:"60vh",align:"center",justify:"center",p:"4",children:e.jsxs(n,{direction:"column",align:"center",gap:"4",style:{textAlign:"center"},children:[e.jsx(m,{size:window.innerWidth<768?24:32,color:"var(--red-9)"}),e.jsx(l,{size:{initial:"2",sm:"3"},color:"red",children:"Failed to load notifications"}),e.jsx(l,{size:{initial:"1",sm:"2"},color:"red",style:{maxWidth:"280px",lineHeight:1.5},children:r.message}),e.jsx(f,{variant:"soft",color:"red",onClick:W,size:{initial:"2",sm:"3"},children:"Retry"})]})})]}):e.jsxs(d,{style:{background:"var(--gray-1)"},children:[(o==null?void 0:o.show)&&e.jsx(B,{message:o.message,type:o.type,onClose:R}),e.jsx(d,{style:{background:"white",borderBottom:"1px solid var(--gray-6)",top:0,zIndex:10},children:e.jsxs(n,{justify:"between",align:"center",p:{initial:"4",sm:"6"},gap:"3",children:[e.jsxs(n,{align:"center",gap:"3",style:{minWidth:0,flex:1},children:[e.jsx(m,{size:window.innerWidth<768?20:24,color:"var(--blue-9)"}),e.jsx(b,{size:{initial:"4",sm:"6"},weight:"bold",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"Notifications"})]}),e.jsxs(n,{gap:"2",align:"center",style:{flexShrink:0},children:[N>0&&e.jsx(f,{variant:"soft",color:"green",onClick:E,size:{initial:"1",sm:"2"},style:{fontSize:window.innerWidth<768?"11px":"14px"},children:e.jsxs(n,{align:"center",gap:"2",children:[e.jsx(k,{size:window.innerWidth<768?10:12}),e.jsx("span",{style:{display:window.innerWidth<380?"none":"inline"},children:"Mark all read"})]})}),e.jsxs(f,{variant:"soft",onClick:W,disabled:a,size:{initial:"2",sm:"3"},style:{flexShrink:0,fontSize:window.innerWidth<768?"12px":"14px"},children:[e.jsx(M,{className:a?"animate-spin":"",size:window.innerWidth<768?12:14}),e.jsx("span",{style:{display:window.innerWidth<480?"none":"inline"},children:"Refresh"})]})]})]})}),e.jsx(d,{p:{initial:"3",sm:"4",md:"6"},children:e.jsx(_,{mode:"wait",children:a?e.jsx(v.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},exit:{opacity:0,scale:.95},transition:{duration:.3},children:e.jsx(n,{direction:"column",align:"center",gap:"4",py:"8",children:e.jsx(T,{size:"3"})})},"refreshing"):e.jsx(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.5,ease:"easeOut"},children:e.jsx(n,{direction:"column",gap:{initial:"3",sm:"4"},children:w.length>0?w.map((i,s)=>e.jsx(v.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{duration:.4,delay:s*.1,ease:"easeOut"},children:e.jsx(I,{style:{border:"1px solid var(--gray-6)",borderLeft:i.seen?"1px solid var(--gray-6)":"4px solid var(--blue-9)",backgroundColor:i.seen?"white":"var(--blue-1)",transition:"all 0.2s ease",cursor:"pointer",overflow:"hidden"},children:e.jsx(d,{p:{initial:"3",sm:"4",md:"5"},children:e.jsxs(n,{justify:"between",align:"start",gap:"3",direction:{initial:"column",sm:"row"},children:[e.jsxs(n,{direction:"column",style:{flex:1,minWidth:0},children:[e.jsx(l,{size:{initial:"2",sm:"3"},weight:i.seen?"medium":"bold",style:{color:i.seen?"var(--gray-11)":"var(--gray-12)",marginBottom:"8px",wordWrap:"break-word",overflowWrap:"break-word",hyphens:"auto",lineHeight:1.4},dangerouslySetInnerHTML:{__html:i.subject}}),i.message?e.jsx(l,{size:{initial:"1",sm:"2"},color:"gray",style:{lineHeight:1.5,marginBottom:"12px",wordWrap:"break-word",overflowWrap:"break-word",hyphens:"auto"},dangerouslySetInnerHTML:{__html:i.message}}):e.jsx(l,{size:{initial:"1",sm:"2"},color:"gray",style:{marginBottom:"12px"},children:"No message content."}),e.jsx(l,{size:"1",color:"gray",style:{fontStyle:"italic",fontSize:window.innerWidth<768?"11px":"12px",lineHeight:1.3},children:new Intl.DateTimeFormat("en-US",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!0}).format(new Date(i.created_on.replace(" ","T")))})]}),!i.seen&&e.jsx(f,{size:{initial:"1",sm:"2"},variant:"soft",color:"blue",onClick:()=>A(i.name),style:{flexShrink:0,alignSelf:window.innerWidth<640?"flex-start":"auto",marginTop:window.innerWidth<640?"8px":"0"},children:e.jsxs(n,{align:"center",gap:"1",children:[e.jsx(k,{size:window.innerWidth<768?10:12}),e.jsx("span",{style:{display:window.innerWidth<380?"none":"inline",fontSize:window.innerWidth<768?"11px":"12px"},children:"Mark read"})]})})]})})})},i.name)):e.jsx(I,{style:{border:"1px solid var(--gray-6)"},children:e.jsxs(n,{direction:"column",align:"center",gap:"4",p:{initial:"6",sm:"8"},children:[e.jsx(m,{size:window.innerWidth<768?24:32,color:"var(--gray-8)"}),e.jsx(l,{size:{initial:"2",sm:"3"},color:"gray",style:{textAlign:"center"},children:"No notifications yet"}),e.jsx(l,{size:{initial:"1",sm:"2"},color:"gray",style:{textAlign:"center",maxWidth:"280px",lineHeight:1.5},children:"We'll notify you when there's something new"})]})})})},"content")})}),e.jsx("style",{children:`
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
          }
          
          @media (max-width: 479px) {
            /* Extra small screens */
            [data-radix-themes] {
              --space-3: 8px;
              --space-4: 12px;
            }
          }

          @media (max-width: 380px) {
            /* Very small screens - stack buttons vertically */
            .header-actions {
              flex-direction: column;
              width: 100%;
              gap: 8px;
            }
          }
        `})]})};export{P as default};
