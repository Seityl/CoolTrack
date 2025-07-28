var f=(a,l,i)=>new Promise((r,c)=>{var n=s=>{try{d(i.next(s))}catch(p){c(p)}},x=s=>{try{d(i.throw(s))}catch(p){c(p)}},d=s=>s.done?r(s.value):Promise.resolve(s.value).then(n,x);d((i=i.apply(a,l)).next())});import{G as v,r as g,j as e,p as t,x as b,n as h,aG as z,k as u,w as W,a5 as S,H as j,m as y,aH as k,z as A,A as F}from"./index-BsqRx7K0.js";import{o as w}from"./card-Cl9jFH-U.js";const I=({message:a,type:l,onClose:i})=>(g.useEffect(()=>{const r=setTimeout(()=>{i()},5e3);return()=>clearTimeout(r)},[i]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
        `}),e.jsxs("div",{style:{position:"fixed",bottom:"20px",right:"20px",zIndex:1e3,backgroundColor:l==="success"?"var(--green-9)":"var(--red-9)",color:"white",padding:"12px 16px",borderRadius:"8px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15)",display:"flex",alignItems:"center",gap:"8px",maxWidth:"300px",animation:"slideIn 0.3s ease-out"},children:[l==="success"?e.jsx(A,{size:16}):e.jsx(F,{size:16}),e.jsx(y,{size:"2",style:{flex:1},children:a})]})]})),H=()=>{const{data:a,isValidating:l,mutate:i}=v("Approval Log",{fields:["name","data","creation"],orderBy:{field:"creation",order:"desc"}}),[r,c]=g.useState(!1),[n,x]=g.useState(null),d=(o,m)=>{x({message:o,type:m,show:!0})},s=()=>{x(null)},p=()=>f(void 0,null,function*(){c(!0);try{yield i(),d("Logs refreshed successfully","success")}catch(o){console.error("Error refreshing logs:",o),d("Failed to refresh logs","error")}finally{c(!1)}});return l&&!r?e.jsx(t,{height:"60vh",align:"center",justify:"center",children:e.jsx(t,{direction:"column",align:"center",gap:"4",children:e.jsx(b,{size:"3"})})}):e.jsxs(h,{style:{background:"var(--gray-1)"},children:[(n==null?void 0:n.show)&&e.jsx(I,{message:n.message,type:n.type,onClose:s}),e.jsx(h,{style:{background:"white",borderBottom:"1px solid var(--gray-6)",top:0,zIndex:10},children:e.jsxs(t,{justify:"between",align:"center",p:{initial:"4",sm:"6"},gap:"3",style:{flexWrap:"wrap"},children:[e.jsxs(t,{align:"center",gap:"3",style:{minWidth:0,flex:1},children:[e.jsx(z,{size:window.innerWidth<768?20:24,color:"var(--blue-9)"}),e.jsx(u,{size:{initial:"4",sm:"6"},weight:"bold",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"Approval Logs"})]}),e.jsxs(W,{variant:"soft",onClick:p,disabled:r,size:{initial:"2",sm:"3"},style:{flexShrink:0,fontSize:window.innerWidth<768?"12px":"14px"},children:[e.jsx(S,{className:r?"animate-spin":"",size:window.innerWidth<768?12:14}),e.jsx("span",{style:{display:window.innerWidth<480?"none":"inline"},children:"Refresh"})]})]})}),e.jsx(h,{p:{initial:"3",sm:"4",md:"6"},children:e.jsx(t,{direction:"column",gap:{initial:"3",sm:"4"},children:a&&a.length>0?a.map((o,m)=>e.jsx(j.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{duration:.3,delay:m*.03},children:e.jsx(w,{size:{initial:"2",sm:"3"},style:{border:"1px solid var(--gray-6)",overflow:"hidden"},children:e.jsx(h,{p:{initial:"3",sm:"4",md:"5"},children:e.jsxs(t,{direction:"column",gap:"3",children:[e.jsx("div",{className:"text-sm text-gray-700",style:{lineHeight:1.6,color:"var(--gray-12)",fontSize:window.innerWidth<768?"13px":"14px",wordWrap:"break-word",overflowWrap:"break-word",hyphens:"auto"},dangerouslySetInnerHTML:{__html:o.data}}),e.jsx(t,{justify:"end",mt:"2",children:e.jsx(y,{size:{initial:"1",sm:"2"},color:"gray",style:{fontStyle:"italic",fontSize:window.innerWidth<768?"11px":"12px",textAlign:"right",lineHeight:1.3},children:new Intl.DateTimeFormat("en-US",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!0}).format(new Date(o.creation))})})]})})})},o.name)):e.jsx(j.div,{initial:{opacity:0},animate:{opacity:1},transition:{duration:.3},children:e.jsx(w,{size:{initial:"3",sm:"4"},style:{border:"1px solid var(--gray-6)"},children:e.jsxs(t,{direction:"column",align:"center",justify:"center",p:{initial:"6",sm:"8"},gap:"4",children:[e.jsx(k,{size:window.innerWidth<768?36:48,color:"var(--gray-8)"}),e.jsxs(t,{direction:"column",align:"center",gap:"2",children:[e.jsx(u,{size:{initial:"4",sm:"5"},color:"gray",style:{textAlign:"center"},children:"No logs available"}),e.jsx(y,{size:{initial:"2",sm:"3"},color:"gray",style:{textAlign:"center",maxWidth:"280px",lineHeight:1.5},children:"All approval logs will appear here when activities occur."})]})]})})})})}),e.jsx("style",{children:`
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
                      
                      /* Improve readability on small screens */
                      .text-sm {
                          line-height: 1.7 !important;
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
              `})]})};export{H as default};
