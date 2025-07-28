var Te=Object.defineProperty,De=Object.defineProperties;var Ie=Object.getOwnPropertyDescriptors;var ne=Object.getOwnPropertySymbols;var Ce=Object.prototype.hasOwnProperty,Me=Object.prototype.propertyIsEnumerable;var re=(i,n,s)=>n in i?Te(i,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):i[n]=s,q=(i,n)=>{for(var s in n||(n={}))Ce.call(n,s)&&re(i,s,n[s]);if(ne)for(var s of ne(n))Me.call(n,s)&&re(i,s,n[s]);return i},U=(i,n)=>De(i,Ie(n));var ae=(i,n,s)=>new Promise((y,b)=>{var w=l=>{try{v(s.next(l))}catch(h){b(h)}},z=l=>{try{v(s.throw(l))}catch(h){b(h)}},v=l=>l.done?y(l.value):Promise.resolve(l.value).then(w,z);v((s=s.apply(i,n)).next())});import{r as d,a4 as Fe,j as e,n as p,p as r,x as oe,m as a,w as g,a5 as le,af as P,k as _e,aB as $e,an as Re,J as L,Q as ce,aC as xe,ak as pe,ad as he,ac as We,z as Oe,A as Ee,aD as Ae,T as Be,a7 as Pe,aE as Le,aF as Ne}from"./index-BsqRx7K0.js";import{o as N}from"./card-Cl9jFH-U.js";import{o as V}from"./grid-C-tyneNj.js";import{u as de}from"./text-field-DqTx62B3.js";import{o as ge}from"./separator-BoVDTRez.js";import{C as R,u as W,g as O,v as m}from"./select-BJhAaAVF.js";import{m as Ve,d as He,P as X,f as I,b as Ge,T as S}from"./table-B-dRJlEl.js";import"./icons-oFCLfhG6.js";import"./index-UYpWDUL8.js";import"./index-CFk86qM9.js";import"./index-BiKMrQoy.js";import"./get-subtree-B9iClb7p.js";const Ye=({message:i,type:n,onClose:s})=>(d.useEffect(()=>{const y=setTimeout(()=>{s()},5e3);return()=>clearTimeout(y)},[s]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
        `}),e.jsxs("div",{style:{position:"fixed",bottom:"20px",right:"20px",zIndex:1e3,backgroundColor:n==="success"?"var(--green-9)":n==="error"?"var(--red-9)":"var(--blue-9)",color:"white",padding:"12px 16px",borderRadius:"8px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15)",display:"flex",alignItems:"center",gap:"8px",maxWidth:"300px",animation:"slideIn 0.3s ease-out"},children:[n==="success"?e.jsx(Oe,{size:16}):n==="error"?e.jsx(Ee,{size:16}):e.jsx(P,{size:16}),e.jsx(a,{size:"2",children:i})]})]})),qe=({read:i,index:n})=>e.jsx(N,{size:"2",style:{border:"1px solid var(--gray-6)",marginBottom:"12px"},children:e.jsxs(r,{direction:"column",gap:"3",p:"3",children:[e.jsx(r,{justify:"between",align:"center",children:e.jsx(L,{variant:"soft",color:"blue",size:"1",children:i.sensor_id||"N/A"})}),e.jsxs(V,{columns:"2",gap:"2",children:[e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(ce,{size:12,color:"var(--orange-9)"}),e.jsxs(a,{size:"1",weight:"medium",children:[i.temperature,"°C"]})]}),e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(xe,{size:12,color:"var(--yellow-9)"}),e.jsxs(a,{size:"1",children:[i.voltage,"V"]})]}),e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(pe,{size:12,color:"var(--green-9)"}),e.jsx(a,{size:"1",children:i.signal_strength})]}),e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(he,{size:12,color:"var(--purple-9)"}),e.jsx(a,{size:"1",children:i.gateway_id||"N/A"})]})]}),e.jsx(ge,{size:"1"}),e.jsxs(r,{justify:"between",align:"center",children:[e.jsxs(a,{size:"1",color:"gray",children:["RSSI: ",i.sensor_rssi]}),e.jsx(a,{size:"1",color:"gray",children:new Date(i.timestamp).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})})]})]})}),Ue=({totalItems:i,pageIndex:n,pageSize:s,onPageChange:y,onPageSizeChange:b})=>{const w=Math.ceil(i/s),z=window.innerWidth<768,v=()=>{const l=n+1,h=w,_=z?1:2,E=[],u=[];for(let C=Math.max(2,l-_);C<=Math.min(h-1,l+_);C++)E.push(C);return l-_>2?u.push(1,"..."):u.push(1),u.push(...E),l+_<h-1?u.push("...",h):h>1&&u.push(h),u};return w<=1?null:e.jsxs(r,{justify:"between",align:"center",mt:"4",p:"4",style:{borderTop:"1px solid var(--gray-5)"},children:[e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(a,{size:"2",children:"Show:"}),e.jsxs(R,{value:s.toString(),onValueChange:l=>b(parseInt(l)),size:"2",children:[e.jsx(W,{style:{minWidth:"80px"}}),e.jsxs(O,{children:[e.jsx(m,{value:"25",children:"25"}),e.jsx(m,{value:"50",children:"50"}),e.jsx(m,{value:"100",children:"100"}),e.jsx(m,{value:"250",children:"250"}),e.jsx(m,{value:"500",children:"500"})]})]})]}),e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(g,{variant:"soft",onClick:()=>y(0),disabled:n===0,size:"2",children:e.jsx(Ae,{size:12})}),e.jsx(g,{variant:"soft",onClick:()=>y(Math.max(0,n-1)),disabled:n===0,size:"2",children:e.jsx(Be,{size:12})}),v().map((l,h)=>e.jsx(Pe.Fragment,{children:l==="..."?e.jsx(a,{size:"2",color:"gray",style:{padding:"0 8px"},children:"..."}):e.jsx(g,{variant:l===n+1?"solid":"soft",onClick:()=>y(l-1),size:"2",style:{minWidth:"36px",fontWeight:l===n+1?"bold":"normal"},children:l})},h)),e.jsx(g,{variant:"soft",onClick:()=>y(Math.min(w-1,n+1)),disabled:n>=w-1,size:"2",children:e.jsx(Le,{size:12})}),e.jsx(g,{variant:"soft",onClick:()=>y(w-1),disabled:n>=w-1,size:"2",children:e.jsx(Ne,{size:12})})]}),e.jsxs(a,{size:"2",color:"gray",children:["Page ",n+1," of ",w]})]})},lt=()=>{const[i,n]=d.useState("sensor"),[s,y]=d.useState(""),[b,w]=d.useState("timestamp"),[z,v]=d.useState("desc"),[l,h]=d.useState(!1),[_,E]=d.useState("table"),[u,C]=d.useState(null),[j,me]=d.useState(!1),[k,H]=d.useState({pageIndex:0,pageSize:100}),[G,J]=d.useState(20),[T,M]=d.useState(()=>{const t=new Date;return new Date(t.getTime()-24*60*60*1e3).toISOString().split("T")[0]}),[D,F]=d.useState(()=>new Date().toISOString().split("T")[0]);d.useEffect(()=>{const t=()=>{const o=window.innerWidth<768;me(o),o&&E("cards")};return t(),window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[]);const ue=d.useMemo(()=>{const t=[];return T&&t.push(["timestamp",">=",`${T} 00:00:00`]),D&&t.push(["timestamp","<=",`${D} 23:59:59`]),s&&(i==="sensor"?t.push(["sensor_id","=",s]):t.push(["gateway_id","=",s])),t},[T,D,i,s]),{data:A,error:Q,isLoading:K,mutate:Z,isValidating:ee}=Fe("frappe.client.get_list",{doctype:"Sensor Read",fields:["sensor_id","sensor_type","temperature","voltage","signal_strength","gateway_id","relay_id","sensor_rssi","timestamp"],filters:ue,order_by:`${b} ${z}`,limit_page_length:999999,limit_start:0}),c=A&&A.message?A.message:[],je=d.useMemo(()=>{const t=new Set(c.map(x=>x.sensor_id).filter(Boolean)).size,o=new Set(c.map(x=>x.gateway_id).filter(Boolean)).size;return{totalRecords:c.length,uniqueSensors:t,uniqueGateways:o,currentPageRecords:c.length}},[c]),te=d.useMemo(()=>{const t=Array.from(new Set(c.map(x=>x.sensor_id).filter(Boolean))),o=Array.from(new Set(c.map(x=>x.gateway_id).filter(Boolean)));return{sensors:t,gateways:o}},[c]),se=d.useMemo(()=>{const t=k.pageIndex*k.pageSize,o=t+k.pageSize;return c.slice(t,o)},[c,k.pageIndex,k.pageSize]),fe=d.useMemo(()=>c.slice(0,G),[c,G]),ye=t=>{H(o=>U(q({},o),{pageIndex:t}))},we=t=>{H({pageIndex:0,pageSize:t})},be=()=>{J(t=>Math.min(t+20,c.length))},ie=()=>ae(void 0,null,function*(){h(!0);try{yield Z(),B("Data refreshed successfully","success")}catch(t){B("Failed to refresh data","error")}finally{h(!1)}}),ze=()=>{const t=window.open("","_blank"),o=c.map((f,Y)=>`
    <tr ${Y%2===0?'style="background-color: #f9f9f9;"':""}>
      <td style="text-align: center;">
        <span class="sensor-id">${f.sensor_id||"N/A"}</span>
      </td>
      <td style="text-align: center;" class="temperature">${f.temperature}°C</td>
      <td style="text-align: center;">${f.voltage}V</td>
      <td style="text-align: center;">${f.signal_strength}</td>
      <td style="text-align: center;">
        <span class="gateway-id">${f.gateway_id||"N/A"}</span>
      </td>
      <td style="text-align: center;">${f.sensor_rssi}</td>
      <td style="text-align: center;" class="timestamp">
        ${new Date(f.timestamp).toLocaleString()}
      </td>
    </tr>
  `).join(""),x=`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sensor History Export - ${new Date().toLocaleDateString()}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page {
              size: letter;
              margin: 0.5in;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 15px;
            color: #333;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #7f8c8d;
            margin: 8px 0;
            font-weight: 500;
          }
          
          .header .export-info {
            font-size: 10px;
            color: #95a5a6;
            margin-top: 10px;
          }
          
          .summary {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #ecf0f1;
            border-radius: 6px;
            border: 1px solid #bdc3c7;
            page-break-inside: avoid;
          }
          
          .summary-item {
            text-align: center;
            flex: 1;
            min-width: 120px;
            margin: 2px;
          }
          
          .summary-item .label {
            font-size: 10px;
            color: #7f8c8d;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          
          .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .filters-info {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
            page-break-inside: avoid;
          }
          
          .filters-info h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #495057;
            font-weight: bold;
          }
          
          .filter-item {
            display: inline-block;
            margin-right: 15px;
            font-size: 10px;
            color: #6c757d;
          }
          
          .table-container {
            width: 100%;
            overflow: visible;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 8px;
            background: white;
          }
          
          th, td {
            border: 1px solid #dee2e6;
            padding: 3px 2px;
            text-align: left;
            vertical-align: middle;
            word-wrap: break-word;
          }
          
          th {
            background-color: #e9ecef;
            font-weight: bold;
            font-size: 8px;
            text-transform: uppercase;
            color: #495057;
            text-align: center;
            letter-spacing: 0.3px;
          }
          
          .sensor-id, .gateway-id {
            background-color: #e3f2fd;
            border-radius: 2px;
            padding: 1px 3px;
            font-size: 7px;
            font-weight: bold;
            color: #1565c0;
            border: 1px solid #bbdefb;
            display: inline-block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .gateway-id {
            background-color: #e8f5e8;
            color: #2e7d32;
            border-color: #c8e6c9;
          }
          
          .temperature {
            font-weight: bold;
            color: #d84315;
          }
          
          .timestamp {
            font-size: 7px;
            color: #6c757d;
          }
          
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
            font-size: 9px;
            color: #6c757d;
            text-align: center;
            page-break-inside: avoid;
          }
          
          .page-info {
            text-align: right;
            font-size: 8px;
            color: #adb5bd;
            margin-bottom: 10px;
          }
          
          /* Prevent page breaks in table rows */
          tr {
            page-break-inside: avoid;
          }
          
          /* Ensure table headers repeat on each page */
          thead {
            display: table-header-group;
          }
          
          tbody {
            display: table-row-group;
          }
          
          /* Better table spacing for print */
          @media print {
            table {
              font-size: 7px;
            }
            
            th, td {
              padding: 2px 1px;
            }
            
            .sensor-id, .gateway-id {
              font-size: 6px;
              padding: 1px 2px;
            }
            
            .timestamp {
              font-size: 6px;
            }
            
            .summary {
              flex-direction: row;
              flex-wrap: wrap;
            }
            
            .summary-item {
              flex: 0 1 22%;
              min-width: 100px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SENSOR HISTORY REPORT</h1>
          <div class="subtitle">
            Period: ${new Date(T).toLocaleDateString()} - ${new Date(D).toLocaleDateString()}
          </div>
          ${s?`
            <div class="subtitle">
              Filtered by ${i==="sensor"?"Sensor":"Gateway"} ID: "${s}"
            </div>
          `:""}
        </div>

        <div class="filters-info">
          <h3>Report Configuration</h3>
          <span class="filter-item"><strong>Sort:</strong> ${b==="timestamp"?"Timestamp":"Sensor ID"}</span>
          <span class="filter-item"><strong>Order:</strong> ${z==="desc"?"Newest First":"Oldest First"}</span>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Sensor ID</th>
                <th style="width: 10%;">Temp</th>
                <th style="width: 10%;">Volt</th>
                <th style="width: 12%;">Signal</th>
                <th style="width: 15%;">Gateway ID</th>
                <th style="width: 8%;">RSSI</th>
                <th style="width: 30%;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${o||'<tr><td colspan="7" style="text-align: center; padding: 20px; color: #6c757d;">No data available</td></tr>'}
            </tbody>
          </table>
        </div>

        </div>
      </body>
    </html>
  `;if(!t){B("Unable to open print window. Please check your browser settings.","error");return}try{t.document.write(x),t.document.close(),t.onload=()=>{setTimeout(()=>{t.focus(),t.print(),t.onafterprint=()=>{t.close()}},500)},setTimeout(()=>{t.document.readyState==="complete"&&(t.focus(),t.print())},1e3)}catch(f){console.error("Print error:",f),B("Failed to generate PDF. Please try again.","error"),t.close()}},B=(t,o)=>{C({message:t,type:o,show:!0})},Se=()=>{C(null)},$=t=>{const o=new Date,x=new Date(o.getFullYear(),o.getMonth(),o.getDate());switch(t){case"today":M(x.toISOString().split("T")[0]),F(x.toISOString().split("T")[0]);break;case"yesterday":const f=new Date(x.getTime()-24*60*60*1e3);M(f.toISOString().split("T")[0]),F(f.toISOString().split("T")[0]);break;case"lastWeek":const Y=new Date(x.getTime()-7*24*60*60*1e3);M(Y.toISOString().split("T")[0]),F(x.toISOString().split("T")[0]);break;case"lastMonth":const ve=new Date(x.getTime()-30*24*60*60*1e3);M(ve.toISOString().split("T")[0]),F(x.toISOString().split("T")[0]);break;case"last3Months":const ke=new Date(x.getTime()-90*24*60*60*1e3);M(ke.toISOString().split("T")[0]),F(x.toISOString().split("T")[0]);break}};return d.useEffect(()=>{H(t=>U(q({},t),{pageIndex:0})),J(20)},[b,z,T,D,i,s]),d.useEffect(()=>{Z()},[b,z,T,D,i,s]),K&&!A?e.jsx(p,{style:{background:"var(--gray-1)"},children:e.jsx(r,{height:"60vh",align:"center",justify:"center",children:e.jsx(r,{direction:"column",align:"center",gap:"4",children:e.jsx(oe,{size:"3"})})})}):Q?e.jsx(p,{style:{background:"var(--gray-1)"},children:e.jsx(r,{height:"60vh",align:"center",justify:"center",p:"4",children:e.jsxs(r,{direction:"column",align:"center",gap:"4",style:{textAlign:"center"},children:[e.jsx(a,{size:{initial:"3",sm:"4"},color:"red",weight:"bold",children:"Error loading sensor reads"}),e.jsx(a,{size:{initial:"2",sm:"3"},color:"gray",style:{maxWidth:"280px",lineHeight:1.5},children:Q.message}),e.jsxs(g,{onClick:ie,variant:"soft",size:{initial:"2",sm:"3"},children:[e.jsx(le,{}),"Try Again"]})]})})}):e.jsxs(p,{style:{background:"var(--gray-1)"},children:[(u==null?void 0:u.show)&&e.jsx(Ye,{message:u.message,type:u.type,onClose:Se}),e.jsx(p,{style:{background:"white",borderBottom:"1px solid var(--gray-6)",top:0,zIndex:10},children:e.jsxs(r,{justify:"between",align:"center",p:{initial:"4",sm:"6"},gap:"3",children:[e.jsxs(r,{align:"center",gap:"3",style:{minWidth:0,flex:1},children:[e.jsx(P,{size:j?20:24,color:"var(--blue-9)"}),e.jsx(_e,{size:{initial:"4",sm:"6"},weight:"bold",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:"History"})]}),e.jsxs(r,{gap:"2",style:{flexShrink:0},children:[e.jsxs(g,{variant:"soft",onClick:ze,disabled:K||c.length===0,size:{initial:"2",sm:"3"},style:{fontSize:j?"12px":"14px"},children:[e.jsx($e,{size:j?12:14}),e.jsx("span",{style:{display:j&&window.innerWidth<480?"none":"inline"},children:"Export PDF"})]}),e.jsxs(g,{variant:"soft",onClick:ie,disabled:l||ee,size:{initial:"2",sm:"3"},style:{fontSize:j?"12px":"14px"},children:[e.jsx(le,{className:l?"animate-spin":"",size:j?12:14}),e.jsx("span",{style:{display:j&&window.innerWidth<480?"none":"inline"},children:"Refresh"})]})]})]})}),e.jsxs(p,{p:{initial:"3",sm:"4",md:"6"},children:[e.jsx(N,{size:{initial:"2",sm:"3"},style:{border:"1px solid var(--gray-6)",marginBottom:j?"16px":"24px"},children:e.jsxs(r,{direction:"column",gap:{initial:"3",sm:"4"},children:[e.jsxs(r,{direction:"column",gap:"4",children:[e.jsxs(p,{children:[e.jsxs(r,{align:"center",gap:"2",mb:"3",children:[e.jsx(Re,{size:j?12:14,color:"var(--blue-9)"}),e.jsx(a,{size:{initial:"2",sm:"3"},weight:"medium",children:"Date Range"})]}),e.jsxs(r,{gap:"2",wrap:"wrap",mb:"3",children:[e.jsx(g,{variant:"surface",size:"1",onClick:()=>$("today"),style:{fontSize:j?"11px":"12px"},children:"Today"}),e.jsx(g,{variant:"surface",size:"1",onClick:()=>$("yesterday"),style:{fontSize:window.innerWidth<768?"11px":"12px"},children:"Yesterday"}),e.jsx(g,{variant:"surface",size:"1",onClick:()=>$("lastWeek"),style:{fontSize:window.innerWidth<768?"11px":"12px"},children:"Last Week"}),e.jsx(g,{variant:"surface",size:"1",onClick:()=>$("lastMonth"),style:{fontSize:window.innerWidth<768?"11px":"12px"},children:"Last Month"}),e.jsx(g,{variant:"surface",size:"1",onClick:()=>$("last3Months"),style:{fontSize:window.innerWidth<768?"11px":"12px"},children:"Last 3 Months"})]}),e.jsxs(V,{columns:{initial:"1",sm:"2"},gap:"3",children:[e.jsxs(p,{children:[e.jsx(a,{size:{initial:"1",sm:"2"},weight:"medium",style:{marginBottom:"8px",display:"block",fontSize:j?"12px":"14px"},children:"Start Date"}),e.jsx(de,{type:"date",value:T,onChange:t=>M(t.target.value),size:{initial:"2",sm:"3"}})]}),e.jsxs(p,{children:[e.jsx(a,{size:{initial:"1",sm:"2"},weight:"medium",style:{marginBottom:"8px",display:"block",fontSize:window.innerWidth<768?"12px":"14px"},children:"End Date"}),e.jsx(de,{type:"date",value:D,onChange:t=>F(t.target.value),size:{initial:"2",sm:"3"}})]})]})]}),e.jsx(ge,{size:"2"}),e.jsxs(p,{children:[e.jsx(a,{size:{initial:"1",sm:"2"},weight:"medium",style:{marginBottom:"8px",display:"block",fontSize:window.innerWidth<768?"12px":"14px"},children:"Filter Records"}),e.jsxs(V,{columns:{initial:"1",sm:"2"},gap:"3",children:[e.jsx(p,{children:e.jsxs(R,{value:i,onValueChange:t=>n(t),size:{initial:"2",sm:"3"},children:[e.jsx(W,{}),e.jsxs(O,{children:[e.jsx(m,{value:"sensor",children:"Sensor ID"}),e.jsx(m,{value:"gateway",children:"Gateway ID"})]})]})}),e.jsx(p,{children:e.jsxs(R,{value:s,onValueChange:t=>y(t),size:{initial:"2",sm:"3"},children:[e.jsx(W,{placeholder:`Select ${i==="sensor"?"Sensor":"Gateway"} ID`}),e.jsxs(O,{children:[e.jsxs(m,{value:"all",children:["All ",i==="sensor"?"Sensors":"Gateways"]}),(i==="sensor"?te.sensors:te.gateways).map(t=>e.jsx(m,{value:t,children:t},t))]})]})})]})]}),e.jsxs(V,{columns:{initial:"1",sm:"2"},gap:"3",children:[e.jsxs(p,{children:[e.jsx(a,{size:{initial:"1",sm:"2"},weight:"medium",style:{marginBottom:"8px",display:"block",fontSize:window.innerWidth<768?"12px":"14px"},children:"Sort By"}),e.jsxs(R,{value:b,onValueChange:t=>w(t),size:{initial:"2",sm:"3"},children:[e.jsx(W,{}),e.jsxs(O,{children:[e.jsx(m,{value:"timestamp",children:"Timestamp"}),e.jsx(m,{value:"sensor_id",children:"Sensor ID"})]})]})]}),e.jsxs(p,{children:[e.jsx(a,{size:{initial:"1",sm:"2"},weight:"medium",style:{marginBottom:"8px",display:"block",fontSize:window.innerWidth<768?"12px":"14px"},children:"Order"}),e.jsxs(R,{value:z,onValueChange:t=>v(t),size:{initial:"2",sm:"3"},children:[e.jsx(W,{}),e.jsxs(O,{children:[e.jsx(m,{value:"desc",children:"Newest First"}),e.jsx(m,{value:"asc",children:"Oldest First"})]})]})]})]})]}),s&&e.jsx(r,{align:"center",gap:"2",mt:"2",children:e.jsxs(L,{color:"blue",variant:"soft",size:"1",children:[je.totalRecords," records found"]})})]})}),ee&&e.jsx(N,{size:"2",style:{border:"1px solid var(--gray-6)",marginBottom:"16px"},children:e.jsx(r,{align:"center",justify:"center",gap:"3",p:"4",children:e.jsx(oe,{size:"2"})})}),e.jsx(p,{children:j?e.jsx(p,{children:c.length>0?e.jsxs(e.Fragment,{children:[fe.map((t,o)=>e.jsx(qe,{read:t,index:o},`${t.sensor_id}-${t.timestamp}-${o}`)),G<c.length&&e.jsx(r,{justify:"center",mt:"4",mb:"2",children:e.jsx(g,{variant:"soft",size:"3",onClick:be,style:{width:"100%",maxWidth:"300px",padding:"16px"},children:"Load More"})})]}):e.jsx(N,{style:{border:"1px solid var(--gray-6)"},children:e.jsxs(r,{direction:"column",align:"center",gap:"3",p:"6",children:[e.jsx(P,{size:24,color:"var(--gray-8)"}),e.jsx(a,{size:"2",color:"gray",weight:"medium",style:{textAlign:"center"},children:s?"No matching records found":"No sensor data available for selected date range"}),s&&e.jsx(a,{size:"1",color:"gray",style:{textAlign:"center"},children:"Try adjusting your filters or date range"})]})})}):e.jsxs(p,{style:{overflowX:"auto"},children:[e.jsxs(Ve,{variant:"surface",size:"2",children:[e.jsx(He,{children:e.jsxs(X,{children:[e.jsx(I,{children:"Sensor ID"}),e.jsx(I,{children:e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(ce,{size:12}),"Temp (°C)"]})}),e.jsx(I,{children:e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(xe,{size:12}),"Voltage"]})}),e.jsx(I,{children:e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(pe,{size:12}),"Signal"]})}),e.jsx(I,{children:e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(he,{size:12}),"Gateway ID"]})}),e.jsx(I,{children:"RSSI"}),e.jsx(I,{children:e.jsxs(r,{align:"center",gap:"2",children:[e.jsx(We,{size:12}),"Timestamp"]})})]})}),e.jsx(Ge,{children:se.length>0?se.map((t,o)=>e.jsxs(X,{children:[e.jsx(S,{children:e.jsx(L,{variant:"soft",color:"blue",children:t.sensor_id||"N/A"})}),e.jsx(S,{children:e.jsx(a,{weight:"medium",children:t.temperature})}),e.jsx(S,{children:t.voltage}),e.jsx(S,{children:t.signal_strength}),e.jsx(S,{children:e.jsx(L,{variant:"soft",color:"green",children:t.gateway_id||"N/A"})}),e.jsx(S,{children:e.jsx(a,{size:"2",children:t.sensor_rssi})}),e.jsx(S,{children:e.jsx(a,{size:"2",children:new Date(t.timestamp).toLocaleString()})})]},o)):e.jsx(X,{children:e.jsx(S,{colSpan:7,style:{textAlign:"center",padding:"40px"},children:e.jsxs(r,{direction:"column",align:"center",gap:"3",children:[e.jsx(P,{size:32,color:"var(--gray-8)"}),e.jsx(a,{size:"3",color:"gray",weight:"medium",children:s?"No matching records found":"No sensor data available for selected date range"}),s&&e.jsx(a,{size:"2",color:"gray",children:"Try adjusting your filters or date range"})]})})})})]}),c.length>0&&e.jsx(Ue,{totalItems:c.length,pageIndex:k.pageIndex,pageSize:k.pageSize,onPageChange:ye,onPageSizeChange:we})]})})]}),e.jsx("style",{children:`
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
        `})]})};export{lt as default};
