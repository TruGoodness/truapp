import { useState, useEffect, useCallback, useRef } from "react";
import { db, auth, dbGet, dbSet, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, onSnapshot } from './firebase';

const uid = () => Math.random().toString(36).slice(2, 9);
const toKey = () => new Date().toISOString().split("T")[0];
const nextDay = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };
const fmtDate = s => { try { const [y,m,d]=s.split("-"); return `${m}/${d}/${y}`; } catch { return s; } };

const ADMIN_EMAIL = "marc.gaudreault@gmail.com";
const COLS = ["#F5A623","#2ECC71","#9B59B6","#E74C3C","#3498DB","#E67E22","#1ABC9C","#E91E63"];
const FONT = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap";

const PHASES = [
  { id:"premarket", label:"Pre-Market",  icon:"📦", color:"#3498DB" },
  { id:"setup",     label:"Setup",       icon:"🚛", color:"#F5A623" },
  { id:"during",    label:"During",      icon:"🛖", color:"#2ECC71" },
  { id:"breakdown", label:"Breakdown",   icon:"📋", color:"#9B59B6" },
  { id:"return",    label:"Return",      icon:"🏠", color:"#E67E22" },
];
const PG = [{ key:"loadout", label:"Load Out", icon:"🚐" },{ key:"bin", label:"Black Bin", icon:"🗑" }];
const WCATS = [
  { id:"production", label:"Production", icon:"🧃", color:"#F5A623" },
  { id:"cleaning",   label:"Cleaning",   icon:"🧹", color:"#2ECC71" },
  { id:"equipment",  label:"Equipment",  icon:"⚙",  color:"#9B59B6" },
  { id:"vehicle",    label:"Vehicle",    icon:"🚐", color:"#3498DB" },
];
const SCATS = [
  { id:"product",   label:"Product",        icon:"🧃", color:"#F5A623" },
  { id:"equipment", label:"Equipment",       icon:"⚙",  color:"#2ECC71" },
  { id:"health",    label:"Health & Safety", icon:"🧼", color:"#E74C3C" },
];

const DEMPS = [{ id:"marc", name:"Marc", color:COLS[0], role:"admin", noteMode:"toggle", email:ADMIN_EMAIL }];

const DSOPS = [
  { id:"s1",  cat:"product",   title:"Kegging Process",                content:"", videoUrl:"", videoFile:null },
  { id:"s2",  cat:"product",   title:"Filling Bottles (32oz & 64oz)",  content:"", videoUrl:"", videoFile:null },
  { id:"s3",  cat:"product",   title:"Product Quality Standards",       content:"", videoUrl:"", videoFile:null },
  { id:"s4",  cat:"equipment", title:"Jockey Box Setup & Operation",    content:"", videoUrl:"", videoFile:null },
  { id:"s5",  cat:"equipment", title:"CO2 System & Regulator",          content:"", videoUrl:"", videoFile:null },
  { id:"s6",  cat:"equipment", title:"Line Cleaning & Sanitization",    content:"", videoUrl:"", videoFile:null },
  { id:"s7",  cat:"equipment", title:"Coupler Connection Procedure",    content:"", videoUrl:"", videoFile:null },
  { id:"s8",  cat:"health",    title:"Food Handler Requirements",       content:"A hand wash station must be set up and operational before serving begins.\n\n1. HAND WASH STATION SETUP\n- Water at 85°F–125°F\n- Soap\n- Paper towels\n- Gray water bucket underneath\n\n2. HAND WASHING\nWash hands at minimum once per hour. Also wash when switching tasks (e.g. money to ice), touching face or hair, or any time common sense says to.\n\n3. CUP & ICE HANDLING\n- Never stick fingers inside a cup\n- Handle cups from the outside only\n- Never touch the drinking edge of any cup", videoUrl:"", videoFile:null },
  { id:"s9",  cat:"health",    title:"Hand Washing & Hygiene Standards",content:"", videoUrl:"", videoFile:null },
  { id:"s10", cat:"health",    title:"Sample Handling & Serving",       content:"", videoUrl:"", videoFile:null },
  { id:"s11", cat:"health",    title:"Gray Water & Waste Disposal",     content:"All gray water must be returned to the Tru Goodness facility.\n\n1. Keep a dedicated gray water bucket at the hand wash station at all times.\n2. Do NOT empty the gray water bucket at the market.\n3. Cover/seal the bucket before loading into the vehicle.\n4. Empty into a designated sink at the facility.\n\nSome markets issue fines or remove vendors for improper disposal. This is non-negotiable.", videoUrl:"", videoFile:null },
  { id:"s12", cat:"health",    title:"Food Handling & Product Safety",  content:"All Tru Goodness products are shelf stable — kombucha, lemonade, ginger beer, cold brew, and oat milk. All products are in a reduced oxygen environment.\n\n1. SHELF STABILITY\nKnow this and communicate it confidently if the health department visits.\n\n2. HEALTH DEPARTMENT\nRemain calm. Direct questions you cannot answer to Marc immediately.\n\n3. LICENSES & PERMITS\nWe carry a mobile license and temporary restaurant permit for every county we operate in. These are available in the Licenses section of this app.", videoUrl:"", videoFile:null },
  { id:"s13", cat:"health",    title:"Inclement Weather Safety",        content:"If you experience inclement weather at a market:\n\n1. SECURE THE CANOPY\nMake sure your canopy is fastened securely. There should be red straps in your black bin. Tie them to full kegs, the van, a sign post, or a light pole. You can also grab the center of the tent to stabilize it.\n\n2. ASSESS SAFETY\nIf you feel unsafe, you are authorized to begin packing up. If there is time, call Marc first, then report to the market manager before leaving. In most cases they will not stop you — it adds liability to them.\n\n3. NEVER RISK YOUR SAFETY\nNo sale is worth getting hurt. Equipment can be replaced. Use your judgment and act quickly.", videoUrl:"", videoFile:null },
];

const DTPLS = [
  { id:"t1",  cat:"production", title:"Make tea for kombucha",  xLabel:null,      defEmp:null },
  { id:"t2",  cat:"production", title:"Make lemonade",          xLabel:null,      defEmp:null },
  { id:"t3",  cat:"production", title:"Brew coffee",            xLabel:null,      defEmp:null },
  { id:"t4",  cat:"production", title:"Grind coffee beans",     xLabel:null,      defEmp:null },
  { id:"t5",  cat:"production", title:"Bag ice",                xLabel:null,      defEmp:null },
  { id:"t6",  cat:"production", title:"Keg ginger beer",        xLabel:null,      defEmp:null },
  { id:"t7",  cat:"production", title:"Keg cold brew",          xLabel:null,      defEmp:null },
  { id:"t8",  cat:"production", title:"Keg lemonade",           xLabel:null,      defEmp:null },
  { id:"t9",  cat:"production", title:"Keg Beejola",            xLabel:null,      defEmp:null },
  { id:"t10", cat:"production", title:"Keg kombucha",           xLabel:null,      defEmp:null },
  { id:"t11", cat:"production", title:"Can cans",               xLabel:null,      defEmp:null },
  { id:"t12", cat:"production", title:"Make jam",               xLabel:"Flavors", defEmp:null },
  { id:"t13", cat:"cleaning",   title:"Clean kegs",             xLabel:null,      defEmp:null },
  { id:"t14", cat:"cleaning",   title:"Wash outside of kegs",   xLabel:null,      defEmp:null },
  { id:"t15", cat:"cleaning",   title:"Clean coolers",          xLabel:null,      defEmp:null },
  { id:"t16", cat:"cleaning",   title:"Clean bottles",          xLabel:null,      defEmp:null },
  { id:"t17", cat:"cleaning",   title:"Wash tablecloths",       xLabel:null,      defEmp:null },
  { id:"t18", cat:"cleaning",   title:"Wash rags",              xLabel:null,      defEmp:null },
  { id:"t19", cat:"cleaning",   title:"Clean floors",           xLabel:null,      defEmp:null },
  { id:"t20", cat:"equipment",  title:"Clean tanks",            xLabel:"Tank #",  defEmp:null },
  { id:"t21", cat:"vehicle",    title:"Clean van",              xLabel:"Van #",   defEmp:null },
];

const DSTEPS = [
  {id:"lo1", phase:"premarket",group:"loadout",title:"Money Bag",notes:""},
  {id:"lo2", phase:"premarket",group:"loadout",title:"Pens / Markers",notes:""},
  {id:"lo3", phase:"premarket",group:"loadout",title:"Punch Cards",notes:""},
  {id:"lo4", phase:"premarket",group:"loadout",title:"Canopy",notes:""},
  {id:"lo5", phase:"premarket",group:"loadout",title:"Canopy Weights",notes:""},
  {id:"lo6", phase:"premarket",group:"loadout",title:"Straps",notes:""},
  {id:"lo7", phase:"premarket",group:"loadout",title:"Tables",notes:""},
  {id:"lo8", phase:"premarket",group:"loadout",title:"Table Covers",notes:""},
  {id:"lo9", phase:"premarket",group:"loadout",title:"Table Runners",notes:""},
  {id:"lo10",phase:"premarket",group:"loadout",title:"32 oz Bottles",notes:""},
  {id:"lo11",phase:"premarket",group:"loadout",title:"64 oz Bottles",notes:""},
  {id:"lo12",phase:"premarket",group:"loadout",title:"Jockey Box",notes:""},
  {id:"lo13",phase:"premarket",group:"loadout",title:"CO2",notes:""},
  {id:"lo14",phase:"premarket",group:"loadout",title:"Air Lines",notes:""},
  {id:"lo15",phase:"premarket",group:"loadout",title:"Liquid Lines",notes:""},
  {id:"lo16",phase:"premarket",group:"loadout",title:"Couplers",notes:""},
  {id:"lo17",phase:"premarket",group:"loadout",title:"Kegs",notes:""},
  {id:"lo18",phase:"premarket",group:"loadout",title:"Ice Cooler",notes:""},
  {id:"lo19",phase:"premarket",group:"loadout",title:"Wash Station",notes:""},
  {id:"lo20",phase:"premarket",group:"loadout",title:"Hand Soap",notes:""},
  {id:"lo21",phase:"premarket",group:"loadout",title:"Bagged Ice",notes:""},
  {id:"b1", phase:"premarket",group:"bin",title:"BIN",notes:"Confirm black bin is loaded."},
  {id:"b2", phase:"premarket",group:"bin",title:"Sample Cups",notes:""},
  {id:"b3", phase:"premarket",group:"bin",title:"12 oz Cups",notes:""},
  {id:"b4", phase:"premarket",group:"bin",title:"20 oz Cups",notes:""},
  {id:"b5", phase:"premarket",group:"bin",title:"Cup Lids",notes:""},
  {id:"b6", phase:"premarket",group:"bin",title:"32 oz Caps",notes:""},
  {id:"b7", phase:"premarket",group:"bin",title:"Sign",notes:""},
  {id:"b8", phase:"premarket",group:"bin",title:"Sign Stand",notes:""},
  {id:"b9", phase:"premarket",group:"bin",title:"64 oz Caps",notes:""},
  {id:"b10",phase:"premarket",group:"bin",title:"Paper Towels",notes:""},
  {id:"b11",phase:"premarket",group:"bin",title:"Easel",notes:""},
  {id:"b12",phase:"premarket",group:"bin",title:"Hand Soap",notes:""},
  {id:"su1", phase:"setup",title:"Set up canopy",notes:"Pre-place weights if windy."},
  {id:"su2", phase:"setup",title:"Install canopy weights",notes:"Dillon, Woodland Park, Golden: 40 lbs min per leg with straps."},
  {id:"su3", phase:"setup",title:"Set up tables and tablecloths",notes:"Check customer side for holes."},
  {id:"su4", phase:"setup",title:"Put branded table runners on tables",notes:"Check alignment from customer side."},
  {id:"su5", phase:"setup",title:"Place jockey box on table",notes:"Center under one tent or between two."},
  {id:"su6", phase:"setup",title:"Place kegs under table",notes:"Shield from direct sunlight at all times."},
  {id:"su7", phase:"setup",title:"Run gas and liquid lines",notes:"Never on ground. Sanitize all connections before connecting."},
  {id:"su8", phase:"setup",title:"Connect couplers to kegs",notes:"Left to right: Lemonade, Ginger Beer Original, two regular, seasonal. Clockwise until stops, press handle down."},
  {id:"su9", phase:"setup",title:"Turn on gas",notes:"Red lever below regulator must align with gas line."},
  {id:"su10",phase:"setup",title:"Purge all lines",notes:"Gray water bucket. Purge each tap 3-10 seconds until color changes."},
  {id:"su11",phase:"setup",title:"Add ice to jockey box",notes:"Do not add ice until all lines are purged."},
  {id:"su12",phase:"setup",title:"Set up flavor signage",notes:"Same left-to-right as taps. Chalk marker on tap handles."},
  {id:"su13",phase:"setup",title:"Set up cups and lids",notes:"Cups from bottom of sleeve. Lids from top. Never touch drinking edge."},
  {id:"su14",phase:"setup",title:"Set up hand wash station",notes:"Cooler on back table lowest height. Gray water bucket under spout. Soap and paper towels out."},
  {id:"du1",phase:"during",title:"Stay off phone — be engaging",notes:"A simple hi or good morning goes a long way and can increase sales."},
  {id:"du2",phase:"during",title:"Treat every customer as a friend and/or secret shopper",notes:"We do send out secret shoppers so make sure you are on your A game! Stay focused on your booth — other vendors having a bad day will walk around and drag others down."},
  {id:"du3",phase:"during",title:"Actively hand out samples",notes:"Always invite customers to try."},
  {id:"du4",phase:"during",title:"Always follow health codes",notes:"If you were a customer and saw someone do it to you — would you still eat there?"},
  {id:"br1",phase:"breakdown",title:"Secure money bag immediately",notes:"Out of sight. Cups in plastic bag only."},
  {id:"br2",phase:"breakdown",title:"Clean liquid lines with sanitizer keg",notes:"Before taking anything apart."},
  {id:"br3",phase:"breakdown",title:"Disconnect all air lines",notes:""},
  {id:"br4",phase:"breakdown",title:"Disconnect lines — return to dedicated bucket",notes:"Never on ground. This is critical."},
  {id:"br5",phase:"breakdown",title:"Drain jockey box water into bucket",notes:"Do NOT let water run onto ground."},
  {id:"br6",phase:"breakdown",title:"Move kegs out of direct sunlight",notes:""},
  {id:"br7",phase:"breakdown",title:"Remove tablecloths into mesh bags",notes:"Mesh bags only — they do not go anywhere else! Not in the buckets and not in the black bins!"},
  {id:"br8",phase:"breakdown",title:"Break down all tables and equipment",notes:"Many markets require full breakdown before vehicles can load."},
  {id:"rt1",phase:"return",title:"Bring in money bag",notes:""},
  {id:"rt2",phase:"return",title:"Bring in POS and plug in for charging",notes:""},
  {id:"rt3",phase:"return",title:"Bring in liquid lines — wash and return to van",notes:"Wash thoroughly before returning."},
  {id:"rt4",phase:"return",title:"Bring in ice coolers — refill and put in freezer",notes:"Refill with ice then store in freezer."},
  {id:"rt5",phase:"return",title:"Bring in tablecloths and table runners",notes:"Take to the kitchen and sort into the right piles."},
  {id:"rt6",phase:"return",title:"Bring in rags",notes:"Take to the kitchen and sort into the right piles."},
  {id:"rt7",phase:"return",title:"Restock bin for next market",notes:"Minimum: 4 sleeves of 12 oz cups, 4 sleeves of 20 oz cups, 2 sleeves of lids. Check all other items too."},
  {id:"rt8",phase:"return",title:"Bring in dirty bottles",notes:""},
];

// ── Styles ────────────────────────────────────────────────────────────────────
const T = { bg:"#0F1923",surf:"#1A2535",bdr:"#2A3A50",amber:"#F5A623",green:"#2ECC71",red:"#E74C3C",text:"#E8F0FE",muted:"#7A9BB5" };
const css = {
  app:{ fontFamily:"'DM Sans',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:540,margin:"0 auto",color:T.text },
  hdr:{ background:"linear-gradient(135deg,#1A2A6C 0%,#B21F1F 60%,#C17F24 100%)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" },
  nav:{ display:"flex",background:"#131E2D",borderBottom:"1px solid #1E2E42" },
  nb:{ flex:1,background:"none",border:"none",borderBottom:"2px solid transparent",padding:"12px 6px",fontSize:12,fontWeight:500,color:"#5A7A99",cursor:"pointer",fontFamily:"'DM Sans',sans-serif" },
  na:{ color:T.amber,borderBottom:`2px solid ${T.amber}` },
  stab:{ flex:1,padding:"9px 0",background:T.surf,border:`1.5px solid ${T.bdr}`,fontSize:12,fontWeight:500,color:"#5A7A99",cursor:"pointer",borderRadius:8,fontFamily:"'DM Sans',sans-serif" },
  stabon:{ background:"linear-gradient(135deg,#1A2A6C,#B21F1F)",borderColor:"transparent",color:"#fff" },
  card:{ background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:12,padding:"14px 16px",marginBottom:12 },
  pbar:{ background:"#0F1923",borderRadius:99,height:8 },
  pfill:{ borderRadius:99,height:8,transition:"width 0.4s ease" },
  sect:{ background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:12,overflow:"hidden",marginBottom:12 },
  shead:{ display:"flex",alignItems:"center",gap:8,padding:"11px 14px",borderBottom:`1px solid ${T.bdr}`,background:"#111D2E" },
  row:{ display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",borderBottom:"1px solid #1E2E42" },
  chk:{ width:22,height:22,borderRadius:6,border:`2px solid ${T.bdr}`,background:"#0F1923",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1 },
  chkon:{ background:T.green,borderColor:T.green },
  badge:{ fontSize:11,fontWeight:500,background:"#0D1E30",color:T.muted,borderRadius:99,padding:"2px 8px",whiteSpace:"nowrap" },
  gbadge:{ fontSize:11,fontWeight:500,background:"#0A2010",color:T.green,borderRadius:99,padding:"2px 8px",cursor:"pointer",whiteSpace:"nowrap" },
  nbox:{ marginTop:8,fontSize:13,color:"#A0BFD0",background:"#111D2E",borderRadius:8,padding:"8px 10px",lineHeight:1.5,border:`1px solid ${T.bdr}` },
  vhead:{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 },
  vtitle:{ fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff",margin:0 },
  addbtn:{ background:"linear-gradient(135deg,#F5A623,#E8821A)",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" },
  savebtn:{ background:"linear-gradient(135deg,#1A2A6C,#B21F1F)",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0 },
  cancelbtn:{ background:"none",border:`1.5px solid ${T.bdr}`,borderRadius:8,padding:"8px 16px",fontSize:14,fontWeight:500,color:T.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" },
  editbtn:{ background:"#0D2540",color:"#7EC8E3",border:"1px solid #1E3A5A",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" },
  delbtn:{ background:"#2A0A0A",color:"#FF6B6B",border:"1px solid #3D1515",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" },
  mrow:{ background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:8 },
  soprow:{ background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",width:"100%",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left" },
  chip:{ flexShrink:0,padding:"7px 12px",borderRadius:20,border:`1.5px solid ${T.bdr}`,background:T.surf,fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap" },
  chipon:{ color:"#fff" },
  back:{ background:"none",border:"none",fontSize:14,color:T.amber,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"0 0 16px 0",display:"block" },
  form:{ background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:12,padding:"16px",marginBottom:16 },
  ftitle:{ fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#fff",marginBottom:14 },
  lbl:{ display:"block",fontSize:12,fontWeight:600,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5,marginTop:12 },
  inp:{ display:"block",width:"100%",padding:"9px 12px",fontSize:14,border:`1.5px solid ${T.bdr}`,borderRadius:8,background:"#0F1923",color:T.text,fontFamily:"'DM Sans',sans-serif",marginBottom:4,boxSizing:"border-box" },
  radios:{ display:"flex",gap:8,flexWrap:"wrap" },
  radio:{ flex:1,padding:"8px 4px",border:`1.5px solid ${T.bdr}`,borderRadius:8,background:"#0F1923",fontSize:12,fontWeight:500,color:T.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",minWidth:70 },
  radioon:{ background:"linear-gradient(135deg,#F5A623,#E8821A)",borderColor:"transparent",color:"#fff" },
  emprow:{ background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:10,padding:"13px 14px",marginBottom:8 },
};

function Spin() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg}}><div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #2A3A50",borderTopColor:T.amber,animation:"spin 0.8s linear infinite"}}/></div>;
}
function Empty({ icon, text, hint }) {
  return <div style={{textAlign:"center",padding:"48px 24px",color:T.muted}}><div style={{fontSize:36,marginBottom:12}}>{icon}</div><div style={{fontSize:16,fontWeight:600,color:"#fff",marginBottom:4}}>{text}</div><div style={{fontSize:13}}>{hint}</div></div>;
}
function PBar({ done, total, color }) {
  const pct = total ? Math.round(done/total*100) : 0;
  return <div style={css.card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,color:T.muted}}>{done} of {total} complete</span><span style={{fontSize:18,fontWeight:600,color:pct===100?T.green:T.amber,fontFamily:"'DM Serif Display',serif"}}>{pct}%</span></div><div style={css.pbar}><div style={{...css.pfill,width:`${pct}%`,background:pct===100?T.green:(color||T.amber)}}/></div>{pct===100&&total>0&&<div style={{marginTop:8,fontSize:13,color:T.green,fontWeight:600,textAlign:"center"}}>All done — great work!</div>}</div>;
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail]   = useState("");
  const [pass,  setPass]    = useState("");
  const [err,   setErr]     = useState("");
  const [busy,  setBusy]    = useState(false);

  const go = async () => {
    if (!email.trim() || !pass.trim()) return setErr("Please enter your email and password.");
    setBusy(true); setErr("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      onLogin(cred.user);
    } catch (e) {
      setErr("Invalid email or password. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:"#fff",marginBottom:4,textAlign:"center"}}>Tru Goodness</div>
      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:40}}>Team Task Board</div>
      <div style={{width:"100%",maxWidth:340}}>
        <div style={css.form}>
          <div style={css.ftitle}>Sign In</div>
          <label style={css.lbl}>Email</label>
          <input style={css.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==="Enter"&&go()}/>
          <label style={css.lbl}>Password</label>
          <input style={css.inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" onKeyDown={e=>e.key==="Enter"&&go()}/>
          {err && <div style={{fontSize:13,color:"#FF6B6B",marginTop:8,textAlign:"center"}}>{err}</div>}
          <button style={{...css.savebtn,width:"100%",padding:12,marginTop:16,fontSize:15,opacity:busy?0.7:1}} onClick={go} disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:T.muted}}>Contact Marc if you need your login credentials.</div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,      setTab]      = useState("work");
  const [authUser, setAuthUser] = useState(null);
  const [user,     setUser]     = useState(null);
  const [emps,     setEmps]     = useState(DEMPS);
  const [steps,    setSteps]    = useState(DSTEPS);
  const [sops,     setSops]     = useState(DSOPS);
  const [tpls,     setTpls]     = useState(DTPLS);
  const [asgns,    setAsgns]    = useState([]);
  const [sdone,    setSdone]    = useState({});
  const [events,   setEvents]   = useState([]);
  const [authReady,setAuthReady]= useState(false);
  const [dataReady,setDataReady]= useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setAuthUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Load data when auth is ready
  useEffect(() => {
    if (!authUser) { setDataReady(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const [e, st, so, tp, as, sd, ev] = await Promise.all([
          dbGet("employees"), dbGet("steps"), dbGet("sops"),
          dbGet("templates"), dbGet("assignments"), dbGet(`sdone_${authUser.uid}_${toKey()}`),
          dbGet("events")
        ]);
        if (ev) setEvents(ev);
        if (cancelled) return;
        if (e)  setEmps(e);
        if (st) setSteps(st);
        if (so) setSops(so);
        if (tp) setTpls(tp);
        if (as) setAsgns(as);
        if (sd) setSdone(sd);
        // Find user profile
        const empList = e || DEMPS;
        const profile = empList.find(emp => emp.email === authUser.email) || empList.find(emp => emp.id === "marc");
        if (profile) setUser(profile);
      } catch (err) { console.error(err); }
      if (!cancelled) setDataReady(true);
    })();
    return () => { cancelled = true; };
  }, [authUser]);

  const saveEmps  = useCallback(async v => { setEmps(v);  await dbSet("employees",  v); }, []);
  const saveSteps = useCallback(async v => { setSteps(v); await dbSet("steps",      v); }, []);
  const saveSops  = useCallback(async v => { setSops(v);  await dbSet("sops",       v); }, []);
  const saveTpls  = useCallback(async v => { setTpls(v);  await dbSet("templates",  v); }, []);
  const saveAsgns = useCallback(async v => { setAsgns(v); await dbSet("assignments",v); }, []);

  const toggleStep = useCallback(async id => {
    const uid2 = authUser?.uid || "anon";
    setSdone(p => {
      const n = {...p};
      if (n[id]) delete n[id]; else n[id] = true;
      dbSet(`sdone_${uid2}_${toKey()}`, n);
      return n;
    });
  }, [authUser]);

  const isd = id => !!sdone[id];
  const isAdmin = user?.role === "admin" || user?.email === ADMIN_EMAIL;

  const handleLogout = async () => {
    await signOut(auth);
    setAuthUser(null); setUser(null); setSdone({});
  };

  if (!authReady || !dataReady) return (
    <>
      <link href={FONT} rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0;background:#0F1923}`}</style>
      <Spin/>
    </>
  );

  if (!authUser) return (
    <>
      <link href={FONT} rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}body{margin:0;background:#0F1923}`}</style>
      <Login onLogin={u => setAuthUser(u)}/>
    </>
  );

  return (
    <>
      <link href={FONT} rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}*{box-sizing:border-box}body{margin:0;background:#0F1923}input:focus,select:focus,textarea:focus{outline:2px solid #F5A623;outline-offset:1px}`}</style>
      <div style={css.app}>
        <header style={css.hdr}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",color:"#fff",fontSize:22}}>Tru Goodness</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Task Board{isAdmin?" · Admin":""}</div>
          </div>
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:20,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:user?.color||T.amber,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>{(user?.name||"?")[0]}</div>
            <span style={{color:"rgba(255,255,255,0.85)",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{user?.name||"User"}</span>
          </button>
        </header>
        <nav style={css.nav}>
          {[["work","Work"],["markets","Markets"],["events","Events"],...(isAdmin?[["sales","Sales"]]:[]),["sops","SOPs"],["team","Team"],["chat","Ask"]].map(([id,l]) => (
            <button key={id} style={{...css.nb,...(tab===id?css.na:{})}} onClick={()=>setTab(id)}>{l}</button>
          ))}
        </nav>
        <main style={{padding:16}}>
          {tab==="work"    && <WorkView    user={user} emps={emps} tpls={tpls} asgns={asgns} saveTpls={saveTpls} saveAsgns={saveAsgns} isAdmin={isAdmin}/>}
          {tab==="markets" && <MktView     steps={steps} isd={isd} toggle={toggleStep} saveSteps={saveSteps} isAdmin={isAdmin} user={user}/>}
          {tab==="sops"    && <SopView     sops={sops} saveSops={saveSops} isAdmin={isAdmin} user={user}/>}
          {tab==="team"    && <TeamView    emps={emps} saveEmps={saveEmps} isAdmin={isAdmin} authUser={authUser}/>}
          {tab==="events"  && <EventsView  isAdmin={isAdmin}/>}
          {tab==="sales"   && <SalesView   isAdmin={isAdmin} emps={emps} events={events}/>}
          {tab==="chat"    && <ChatView    sops={sops} steps={steps} tpls={tpls}/>}
        </main>
      </div>
    </>
  );
}

// ── WORK ──────────────────────────────────────────────────────────────────────
function WorkView({ user, emps, tpls, asgns, saveTpls, saveAsgns, isAdmin }) {
  const [st, setSt] = useState(isAdmin ? "dashboard" : "mytasks");
  const mine = asgns.filter(a => a.assignedTo===user?.id && a.status==="pending" && a.dueDate<=toKey());
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {isAdmin && <button style={{...css.stab,...(st==="dashboard"?css.stabon:{})}} onClick={()=>setSt("dashboard")}>Dashboard</button>}
        <button style={{...css.stab,...(st==="mytasks"?css.stabon:{})}} onClick={()=>setSt("mytasks")}>My Tasks</button>
        {isAdmin && <button style={{...css.stab,...(st==="assign"?css.stabon:{})}} onClick={()=>setSt("assign")}>+ Assign</button>}
        {isAdmin && <button style={{...css.stab,...(st==="history"?css.stabon:{})}} onClick={()=>setSt("history")}>History</button>}
        {isAdmin && <button style={{...css.stab,...(st==="templates"?css.stabon:{})}} onClick={()=>setSt("templates")}>Templates</button>}
      </div>
      {st==="mytasks"   && <MyTasks mine={mine} allAsgns={asgns} user={user} saveAsgns={saveAsgns}/>}
      {st==="dashboard" && isAdmin && <Dashboard asgns={asgns} emps={emps} saveAsgns={saveAsgns}/>}
      {st==="assign"    && isAdmin && <Assign emps={emps} tpls={tpls} asgns={asgns} saveAsgns={saveAsgns}/>}
      {st==="history"   && isAdmin && <HistView emps={emps}/>}
      {st==="templates" && isAdmin && <TplView tpls={tpls} emps={emps} saveTpls={saveTpls}/>}
    </div>
  );
}

function MyTasks({ mine, allAsgns, user, saveAsgns }) {
  const done = allAsgns.filter(a => a.assignedTo===user?.id && a.status==="complete" && a.dueDate===toKey());
  const complete = async (id, note) => {
    const a = allAsgns.find(x=>x.id===id); if (!a) return;
    const hist = (await dbGet("taskHistory")) || [];
    hist.push({ id:uid(), title:a.title, xLabel:a.xLabel, xVal:a.xVal, assignedTo:a.assignedTo, dueDate:a.dueDate, completedDate:toKey(), completedAt:Date.now(), note:note.trim() });
    await dbSet("taskHistory", hist);
    saveAsgns(allAsgns.map(x => x.id===id ? {...x,status:"complete",completionNote:note,completedAt:Date.now()} : x));
  };
  return (
    <div>
      <PBar done={done.length} total={mine.length+done.length}/>
      {!mine.length && !done.length && <Empty icon="✅" text="No tasks assigned" hint="Marc will assign tasks here."/>}
      {mine.map(a => <TaskCard key={a.id} a={a} onComplete={complete}/>)}
      {done.length>0 && <><div style={{fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 0 6px"}}>Completed Today</div>{done.map(a=><DoneCard key={a.id} a={a}/>)}</>}
    </div>
  );
}

function TaskCard({ a, onComplete }) {
  const [note, setNote] = useState("");
  return (
    <div style={{...css.card,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${T.bdr}`,background:"#0F1923",flexShrink:0,marginTop:2}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{a.title}</div>
          {a.xVal && <div style={{fontSize:13,color:T.muted,marginTop:2}}>{a.xLabel}: {a.xVal}</div>}
          <div style={{marginTop:4}}>{a.dueDate<toKey()?<span style={{...css.badge,background:"#2A0A0A",color:"#FF6B6B"}}>Overdue: {fmtDate(a.dueDate)}</span>:<span style={css.badge}>Due today</span>}</div>
        </div>
      </div>
      <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:12}}>
        <label style={css.lbl}>Notes</label>
        <textarea style={{...css.inp,minHeight:68,resize:"vertical",marginBottom:10}} value={note} onChange={e=>setNote(e.target.value)} placeholder="Any comments, issues, or details..."/>
        <button style={{...css.savebtn,width:"100%",padding:10}} onClick={()=>onComplete(a.id,note)}>✓ Mark Complete</button>
      </div>
    </div>
  );
}

function DoneCard({ a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{...css.card,marginBottom:8,opacity:0.65,cursor:a.completionNote?"pointer":"default"}} onClick={()=>a.completionNote&&setOpen(o=>!o)}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:22,height:22,borderRadius:6,background:T.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:13}}>✓</span></div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:500,textDecoration:"line-through",color:T.muted}}>{a.title}</div>{a.completionNote&&<span style={css.gbadge}>{open?"Hide Note":"Show Note"}</span>}</div>
      </div>
      {open&&a.completionNote&&<div style={{...css.nbox,marginTop:8}}>{a.completionNote}</div>}
    </div>
  );
}

function Dashboard({ asgns, emps, saveAsgns }) {
  const [filter, setFilter] = useState("today");
  const [sel, setSel] = useState(null);
  const vis = asgns.filter(a => filter==="today"?a.dueDate===toKey():filter==="pending"?a.status==="pending"&&a.dueDate<=toKey():true);
  const dn = vis.filter(a=>a.status==="complete").length;
  const ename = id => emps.find(e=>e.id===id)?.name||id;
  const ecolor = id => emps.find(e=>e.id===id)?.color||T.muted;
  if (sel) {
    const a = asgns.find(x=>x.id===sel); if (!a) { setSel(null); return null; }
    return (
      <div>
        <button style={css.back} onClick={()=>setSel(null)}>← Back</button>
        <div style={css.card}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff",marginBottom:8}}>{a.title}</div>
          {a.xVal&&<div style={{fontSize:14,color:T.muted,marginBottom:4}}><b>{a.xLabel}:</b> {a.xVal}</div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            <span style={{...css.badge,background:a.status==="complete"?"#0A2010":"#2A0A0A",color:a.status==="complete"?T.green:"#FF6B6B"}}>{a.status==="complete"?"✓ Complete":"⏳ Pending"}</span>
            <span style={css.badge}>{ename(a.assignedTo)}</span>
            <span style={css.badge}>Due: {fmtDate(a.dueDate)}</span>
          </div>
          {a.completionNote&&<div style={css.nbox}><b>Note from {ename(a.assignedTo)}:</b> {a.completionNote}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {a.status==="pending"&&<button style={{...css.savebtn,width:"100%",padding:10}} onClick={()=>{saveAsgns(asgns.map(x=>x.id===sel?{...x,dueDate:nextDay()}:x));setSel(null);}}>🔄 Roll Over to Tomorrow</button>}
          {a.status==="complete"&&<button style={{...css.editbtn,width:"100%",padding:10,borderRadius:8,fontSize:14}} onClick={()=>saveAsgns(asgns.map(x=>x.id===sel?{...x,status:"pending",completionNote:"",completedAt:null}:x))}>↩ Re-open Task</button>}
          <label style={css.lbl}>Reassign To</label>
          <select style={css.inp} defaultValue={a.assignedTo} onChange={e=>saveAsgns(asgns.map(x=>x.id===sel?{...x,assignedTo:e.target.value}:x))}>{emps.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <button style={{...css.delbtn,width:"100%",padding:10,borderRadius:8,fontSize:14}} onClick={()=>{if(confirm("Delete?"))saveAsgns(asgns.filter(a=>a.id!==sel));setSel(null);}}>Delete Assignment</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <PBar done={dn} total={vis.length}/>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>{[["today","Today"],["pending","All Pending"],["all","All Time"]].map(([v,l])=><button key={v} style={{...css.chip,...(filter===v?{...css.chipon,background:"#1A2A6C",borderColor:"#1A2A6C"}:{})}} onClick={()=>setFilter(v)}>{l}</button>)}</div>
      {!vis.length&&<Empty icon="📋" text="No assignments" hint="Use + Assign to create work assignments."/>}
      {emps.map(emp=>{
        const ea=vis.filter(a=>a.assignedTo===emp.id); if(!ea.length) return null;
        const ed=ea.filter(a=>a.status==="complete").length;
        return (
          <div key={emp.id} style={{...css.sect,marginBottom:12}}>
            <div style={css.shead}><div style={{width:28,height:28,borderRadius:"50%",background:emp.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{emp.name[0]}</div><span style={{fontWeight:600,fontSize:14,flex:1,color:"#fff"}}>{emp.name}</span><span style={{fontSize:12,color:T.muted}}>{ed}/{ea.length}</span></div>
            {ea.map(a=>(
              <button key={a.id} style={{...css.row,width:"100%",cursor:"pointer",background:"none",border:"none",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setSel(a.id)}>
                <div style={{width:18,height:18,borderRadius:4,background:a.status==="complete"?T.green:"#0F1923",border:`2px solid ${a.status==="complete"?T.green:T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>{a.status==="complete"&&<span style={{color:"#fff",fontSize:10}}>✓</span>}</div>
                <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:14,color:a.status==="complete"?T.muted:"#fff",textDecoration:a.status==="complete"?"line-through":"none"}}>{a.title}</div><div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>{a.xVal&&<span style={css.badge}>{a.xLabel}: {a.xVal}</span>}{a.dueDate<toKey()&&a.status==="pending"&&<span style={{...css.badge,background:"#2A0A0A",color:"#FF6B6B"}}>Overdue</span>}{a.completionNote&&<span style={css.gbadge}>Has note</span>}</div></div>
                <span style={{fontSize:16,color:T.muted}}>›</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Assign({ emps, tpls, asgns, saveAsgns }) {
  const [empId,setEmpId]=useState(emps[0]?.id||""); const [tplId,setTplId]=useState(tpls[0]?.id||""); const [due,setDue]=useState(toKey()); const [xval,setXval]=useState(""); const [custom,setCustom]=useState(""); const [useC,setUseC]=useState(false);
  const tpl=tpls.find(t=>t.id===tplId);
  const go=()=>{const title=useC?custom.trim():tpl?.title;if(!title||!empId)return alert("Select a task and team member.");saveAsgns([...asgns,{id:uid(),title,xLabel:useC?null:tpl?.xLabel,xVal:xval.trim(),assignedTo:empId,dueDate:due,status:"pending",completionNote:"",completedAt:null,createdAt:Date.now()}]);setXval("");setCustom("");alert("Assigned to "+(emps.find(e=>e.id===empId)?.name||empId)+"!");};
  const qAll=()=>{const wd=tpls.filter(t=>t.defEmp);if(!wd.length)return alert("No templates have a default assignee set.");saveAsgns([...asgns,...wd.map(t=>({id:uid(),title:t.title,xLabel:t.xLabel,xVal:"",assignedTo:t.defEmp,dueDate:due,status:"pending",completionNote:"",completedAt:null,createdAt:Date.now()}))]);alert(`Assigned ${wd.length} tasks!`);};
  return (
    <div>
      <div style={css.card}>
        <div style={css.ftitle}>Assign a Task</div>
        <label style={css.lbl}>Assign To</label><select style={css.inp} value={empId} onChange={e=>setEmpId(e.target.value)}>{emps.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
        <label style={css.lbl}>Task</label>
        <div style={{display:"flex",gap:8,marginBottom:8}}><button style={{...css.radio,...(!useC?css.radioon:{})}} onClick={()=>setUseC(false)}>From Template</button><button style={{...css.radio,...(useC?css.radioon:{})}} onClick={()=>setUseC(true)}>Custom</button></div>
        {useC?<input style={css.inp} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Task description..."/>:<select style={css.inp} value={tplId} onChange={e=>setTplId(e.target.value)}>{WCATS.map(c=><optgroup key={c.id} label={c.label}>{tpls.filter(t=>t.cat===c.id).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>)}</select>}
        {!useC&&tpl?.xLabel&&<><label style={css.lbl}>{tpl.xLabel}</label><input style={css.inp} value={xval} onChange={e=>setXval(e.target.value)} placeholder={`Enter ${tpl.xLabel}...`}/></>}
        <label style={css.lbl}>Due Date</label><input type="date" style={css.inp} value={due} onChange={e=>setDue(e.target.value)}/>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><button style={css.savebtn} onClick={go}>Assign Task</button></div>
      </div>
      <div style={css.card}><div style={{fontWeight:600,fontSize:14,color:"#fff",marginBottom:6}}>Quick Assign All</div><div style={{fontSize:13,color:T.muted,marginBottom:10}}>Assigns all templates with a default person set.</div><input type="date" style={{...css.inp,marginBottom:10}} value={due} onChange={e=>setDue(e.target.value)}/><button style={{...css.savebtn,width:"100%",padding:10}} onClick={qAll}>⚡ Quick Assign All Defaults</button></div>
    </div>
  );
}

function HistView({ emps }) {
  const [hist,setHist]=useState(null); const [fe,setFe]=useState("all");
  useEffect(()=>{dbGet("taskHistory").then(d=>setHist(d||[]));},[]);
  if(!hist)return<div style={{padding:32,textAlign:"center",color:T.muted}}>Loading...</div>;
  const ename=id=>emps.find(e=>e.id===id)?.name||id; const ecolor=id=>emps.find(e=>e.id===id)?.color||T.muted;
  const vis=[...(fe==="all"?hist:hist.filter(h=>h.assignedTo===fe))].sort((a,b)=>b.completedAt-a.completedAt);
  return (
    <div>
      <div style={css.vhead}><h2 style={{...css.vtitle,fontSize:18}}>Task History</h2></div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}><button style={{...css.chip,...(fe==="all"?{...css.chipon,background:"#1A2A6C",borderColor:"#1A2A6C"}:{})}} onClick={()=>setFe("all")}>Everyone</button>{emps.map(e=><button key={e.id} style={{...css.chip,...(fe===e.id?{...css.chipon,background:e.color,borderColor:e.color}:{})}} onClick={()=>setFe(e.id)}>{e.name}</button>)}</div>
      {!vis.length&&<Empty icon="📜" text="No history yet" hint="Completed tasks appear here."/>}
      {vis.map(h=>(
        <div key={h.id} style={{...css.card,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:h.note?8:0}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:ecolor(h.assignedTo),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>{ename(h.assignedTo)[0]}</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{h.title}</div>{h.xVal&&<div style={{fontSize:12,color:T.muted}}>{h.xLabel}: {h.xVal}</div>}<div style={{fontSize:11,color:T.muted,marginTop:2}}>{ename(h.assignedTo)} · {new Date(h.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div></div>
            <span style={{...css.badge,background:"#0A2010",color:T.green,flexShrink:0}}>Done</span>
          </div>
          {h.note?<div style={css.nbox}>{h.note}</div>:<div style={{fontSize:12,color:T.muted,fontStyle:"italic"}}>No note left</div>}
        </div>
      ))}
    </div>
  );
}

function TplView({ tpls, emps, saveTpls }) {
  const [editing,setEditing]=useState(null); const [showNew,setShowNew]=useState(false);
  const del=id=>{if(confirm("Delete?"))saveTpls(tpls.filter(t=>t.id!==id));};
  if(editing)return<TplForm init={editing} emps={emps} onSave={v=>{saveTpls(tpls.map(t=>t.id===editing.id?v:t));setEditing(null);}} onCancel={()=>setEditing(null)} isEdit/>;
  if(showNew) return<TplForm init={null} emps={emps} onSave={v=>{saveTpls([...tpls,{...v,id:uid()}]);setShowNew(false);}} onCancel={()=>setShowNew(false)}/>;
  return(
    <div>
      <div style={css.vhead}><h2 style={{...css.vtitle,fontSize:18}}>Task Templates</h2><button style={css.addbtn} onClick={()=>setShowNew(true)}>+ Add</button></div>
      {WCATS.map(c=>{const ct=tpls.filter(t=>t.cat===c.id);if(!ct.length)return null;return(<div key={c.id} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:c.color,letterSpacing:"0.08em",textTransform:"uppercase",padding:"6px 0 4px"}}>{c.icon} {c.label}</div>{ct.map(t=>(<div key={t.id} style={{...css.mrow,marginBottom:6}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{t.title}</div><div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>{t.xLabel&&<span style={css.badge}>Extra: {t.xLabel}</span>}{t.defEmp&&<span style={{...css.badge,background:"#0D2540",color:"#7EC8E3"}}>Default: {emps.find(e=>e.id===t.defEmp)?.name||"?"}</span>}</div></div><div style={{display:"flex",gap:6}}><button style={css.editbtn} onClick={()=>setEditing(t)}>Edit</button><button style={css.delbtn} onClick={()=>del(t.id)}>Del</button></div></div>))}</div>);})}
    </div>
  );
}

function TplForm({ init, emps, onSave, onCancel, isEdit }) {
  const [title,setTitle]=useState(init?.title||""); const [cat,setCat]=useState(init?.cat||"production"); const [xLabel,setXLabel]=useState(init?.xLabel||""); const [defEmp,setDefEmp]=useState(init?.defEmp||"");
  return(<div>{isEdit&&<button style={css.back} onClick={onCancel}>← Cancel</button>}<div style={css.form}><div style={css.ftitle}>{isEdit?"Edit Template":"New Template"}</div><label style={css.lbl}>Title *</label><input style={css.inp} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Clean kegs"/><label style={css.lbl}>Category</label><div style={css.radios}>{WCATS.map(c=><button key={c.id} style={{...css.radio,...(cat===c.id?{...css.radioon,background:c.color,borderColor:c.color}:{})}} onClick={()=>setCat(c.id)}>{c.icon} {c.label}</button>)}</div><label style={css.lbl}>Extra Field</label><input style={css.inp} value={xLabel} onChange={e=>setXLabel(e.target.value)} placeholder="e.g. Tank #"/><label style={css.lbl}>Default Assignee</label><select style={css.inp} value={defEmp} onChange={e=>setDefEmp(e.target.value)}><option value="">No default</option>{emps.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select><div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>{!isEdit&&<button style={css.cancelbtn} onClick={onCancel}>Cancel</button>}<button style={css.savebtn} onClick={()=>{if(!title.trim())return alert("Enter a title.");onSave({...(init||{}),title:title.trim(),cat,xLabel:xLabel.trim()||null,defEmp:defEmp||null});}}>Save</button></div></div></div>);
}

// ── MARKETS ───────────────────────────────────────────────────────────────────
function MktView({ steps, isd, toggle, saveSteps, isAdmin, user }) {
  const [view,setView]=useState("checklist"); const [editS,setEditS]=useState(null); const [showF,setShowF]=useState(false);
  const tot=steps.length,dn=steps.filter(s=>isd(s.id)).length,pct=tot?Math.round(dn/tot*100):0;
  const hSave=s=>{if(editS)saveSteps(steps.map(x=>x.id===editS.id?{...editS,...s}:x));else saveSteps([...steps,{...s,id:uid(),group:s.group||""}]);setShowF(false);setEditS(null);};
  const del=id=>{if(confirm("Delete step?"))saveSteps(steps.filter(s=>s.id!==id));};
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}><button style={{...css.stab,...(view==="checklist"?css.stabon:{})}} onClick={()=>setView("checklist")}>Checklist</button>{isAdmin&&<button style={{...css.stab,...(view==="manage"?css.stabon:{})}} onClick={()=>setView("manage")}>Manage</button>}</div>
      {view==="checklist"&&<CheckTabs steps={steps} isd={isd} toggle={toggle} tot={tot} dn={dn} pct={pct} user={user}/>}
      {view==="manage"&&isAdmin&&<>
        <div style={css.vhead}><h3 style={{...css.vtitle,fontSize:16,margin:0}}>Steps</h3><button style={css.addbtn} onClick={()=>{setEditS(null);setShowF(true);}}>+ Add</button></div>
        {(showF||editS)&&<StepForm init={editS} onSave={hSave} onCancel={()=>{setShowF(false);setEditS(null);}}/>}
        {PHASES.map(ph=>{const ps=steps.filter(s=>s.phase===ph.id);if(!ps.length)return null;return(<div key={ph.id} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:ph.color,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 0 4px"}}>{ph.icon} {ph.label}</div>{ph.id==="premarket"?PG.map(g=>{const gs=ps.filter(s=>s.group===g.key);if(!gs.length)return null;return(<div key={g.key} style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:"#3498DB",padding:"4px 0 4px 4px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{g.icon} {g.label}</div>{gs.map(s=><MRow key={s.id} s={s} onEdit={()=>{setEditS(s);setShowF(false);}} onDel={()=>del(s.id)}/>)}</div>);}):ps.map(s=><MRow key={s.id} s={s} onEdit={()=>{setEditS(s);setShowF(false);}} onDel={()=>del(s.id)}/>)}</div>);})}
      </>}
    </div>
  );
}

function CheckTabs({ steps, isd, toggle, tot, dn, pct, user }) {
  const [ap, setAp] = useState("premarket");
  const [showNotes, setShowNotes] = useState(user?.noteMode==="always");
  const ph=PHASES.find(p=>p.id===ap); const ps=steps.filter(s=>s.phase===ap); const pd=ps.filter(s=>isd(s.id)).length;
  return(
    <div>
      <div style={css.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontFamily:"'DM Serif Display',serif",fontSize:15,color:"#fff"}}>Market Day Checklist</span><span style={{fontSize:18,fontWeight:600,color:pct===100?T.green:T.amber,fontFamily:"'DM Serif Display',serif"}}>{pct}%</span></div>
        <div style={css.pbar}><div style={{...css.pfill,width:`${pct}%`,background:pct===100?T.green:T.amber}}/></div>
        <div style={{fontSize:12,color:T.muted,marginTop:5,textAlign:"right"}}>{dn} of {tot} steps</div>
        {pct===100&&<div style={{marginTop:6,fontSize:13,color:T.green,fontWeight:600,textAlign:"center"}}>All done — great work today!</div>}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <button onClick={()=>setShowNotes(n=>!n)} style={{...css.chip,borderColor:showNotes?T.amber:T.bdr,color:showNotes?T.amber:T.muted}}>{showNotes?"Hide All Notes":"Show All Notes"}</button>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:14}}>
        {PHASES.map(p=>{const ps2=steps.filter(s=>s.phase===p.id),pd2=ps2.filter(s=>isd(s.id)).length,done=ps2.length>0&&pd2===ps2.length,active=ap===p.id;return(<button key={p.id} onClick={()=>setAp(p.id)} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 10px",borderRadius:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",border:`2px solid ${active?p.color:T.bdr}`,background:active?p.color:T.surf,minWidth:60}}><span style={{fontSize:18,marginBottom:2}}>{done?"✅":p.icon}</span><span style={{fontSize:10,fontWeight:600,color:active?"#fff":T.muted,textAlign:"center",lineHeight:1.2}}>{p.label}</span><span style={{fontSize:10,color:active?"rgba(255,255,255,0.7)":T.muted,marginTop:2}}>{pd2}/{ps2.length}</span></button>);})}
      </div>
      {!ps.length&&<Empty icon="📋" text="No steps here" hint="Add steps in Manage tab."/>}
      {ap==="premarket"?PG.map(g=>{const gs=ps.filter(s=>s.group===g.key);if(!gs.length)return null;const gd=gs.filter(s=>isd(s.id)).length;return(<div key={g.key} style={{...css.sect,marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",background:"#111D2E",borderBottom:`1px solid ${T.bdr}`}}><span style={{fontSize:16}}>{g.icon}</span><span style={{fontSize:13,fontWeight:700,color:"#3498DB",flex:1}}>{g.label}</span><span style={{fontSize:12,color:T.muted}}>{gd}/{gs.length}</span></div>{gs.map((s,i)=><SRow key={s.id} s={s} num={i+1} done={isd(s.id)} onToggle={()=>toggle(s.id)} showNotes={showNotes}/>)}</div>);}):
      <div style={css.sect}><div style={{...css.shead,background:"#111D2E"}}><span style={{fontSize:16}}>{ph.icon}</span><span style={{fontWeight:600,fontSize:14,flex:1,color:ph.color}}>{ph.label}</span><span style={{fontSize:12,color:T.muted}}>{pd}/{ps.length}</span></div>{ps.map((s,i)=><SRow key={s.id} s={s} num={i+1} done={isd(s.id)} onToggle={()=>toggle(s.id)} showNotes={showNotes}/>)}</div>}
    </div>
  );
}

function SRow({ s, num, done, onToggle, showNotes }) {
  const [open, setOpen] = useState(false);
  const visible = showNotes || open;
  return(
    <div style={{...css.row,opacity:done?0.5:1}}>
      <button style={{...css.chk,...(done?css.chkon:{})}} onClick={onToggle}>{done&&<span style={{color:"#fff",fontSize:13}}>✓</span>}</button>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:500,textDecoration:done?"line-through":"none",color:done?T.muted:"#fff"}} onClick={()=>s.notes&&!showNotes&&setOpen(o=>!o)}>
          <span style={{color:T.muted,fontSize:13,marginRight:6}}>{num}.</span>{s.title}
        </div>
        {s.notes&&!showNotes&&<div style={{marginTop:4}}><span style={css.gbadge} onClick={()=>setOpen(o=>!o)}>{open?"Hide Notes":"Show Notes"}</span></div>}
        {visible&&s.notes&&<div style={css.nbox}>{s.notes}</div>}
      </div>
    </div>
  );
}

function MRow({ s, onEdit, onDel }) {
  return(<div style={{...css.mrow,marginBottom:6}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{s.title}</div>{s.notes&&<div style={{marginTop:4}}><span style={css.gbadge}>Has notes</span></div>}</div><div style={{display:"flex",gap:6}}><button style={css.editbtn} onClick={onEdit}>Edit</button><button style={css.delbtn} onClick={onDel}>Del</button></div></div>);
}

function StepForm({ init, onSave, onCancel }) {
  const [title,setTitle]=useState(init?.title||""); const [notes,setNotes]=useState(init?.notes||""); const [phase,setPhase]=useState(init?.phase||"premarket"); const [group,setGroup]=useState(init?.group||"loadout");
  return(<div style={css.form}><div style={css.ftitle}>{init?"Edit Step":"New Step"}</div><label style={css.lbl}>Title *</label><input style={css.inp} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Check tent stakes"/><label style={css.lbl}>Phase</label><div style={css.radios}>{PHASES.map(p=><button key={p.id} style={{...css.radio,...(phase===p.id?{...css.radioon,background:p.color,borderColor:p.color}:{})}} onClick={()=>setPhase(p.id)}>{p.icon} {p.label}</button>)}</div>{phase==="premarket"&&<><label style={css.lbl}>Section</label><div style={css.radios}>{PG.map(g=><button key={g.key} style={{...css.radio,...(group===g.key?css.radioon:{})}} onClick={()=>setGroup(g.key)}>{g.icon} {g.label}</button>)}</div></>}<label style={css.lbl}>Notes</label><textarea style={{...css.inp,minHeight:64,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any details..."/><div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button style={css.cancelbtn} onClick={onCancel}>Cancel</button><button style={css.savebtn} onClick={()=>{if(!title.trim())return alert("Enter a step title.");onSave({title:title.trim(),notes:notes.trim(),phase,group:phase==="premarket"?group:"",scope:"shared"});}}>Save</button></div></div>);
}

// ── SOPs ──────────────────────────────────────────────────────────────────────
function SopView({ sops, saveSops, isAdmin, user }) {
  const [sub,setSub]=useState("sops"); const [cat,setCat]=useState(SCATS[0].id); const [viewing,setViewing]=useState(null); const [editing,setEditing]=useState(null); const [showNew,setShowNew]=useState(false); const [newTitle,setNewTitle]=useState("");
  const canSeeCat = c => {
    if (isAdmin) return true;
    if (c==="health") return true;
    const role = user?.role||"staff";
    return role==="manager"||role==="admin"||role==="warehouse";
  };
  const visibleCats = SCATS.filter(c=>canSeeCat(c.id));
  const cs = sops.filter(s=>s.cat===cat&&canSeeCat(s.cat));
  const saveEdit=()=>{saveSops(sops.map(s=>s.id===editing.id?editing:s));setEditing(null);setViewing(null);};
  const addSop=()=>{if(!newTitle.trim())return alert("Enter a title.");saveSops([...sops,{id:uid(),cat,title:newTitle.trim(),content:"",videoUrl:"",videoFile:null}]);setShowNew(false);setNewTitle("");};
  const delSop=id=>{if(confirm("Delete SOP?"))saveSops(sops.filter(s=>s.id!==id));setViewing(null);};

  if(editing)return(
    <div>
      <button style={css.back} onClick={()=>setEditing(null)}>← Cancel</button>
      <div style={css.form}>
        <div style={css.ftitle}>Edit SOP</div>
        <label style={css.lbl}>Title</label><input style={css.inp} value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/>
        <label style={css.lbl}>Content</label><textarea style={{...css.inp,minHeight:300,resize:"vertical",lineHeight:1.6}} value={editing.content} onChange={e=>setEditing({...editing,content:e.target.value})} placeholder="Write the full SOP here..."/>
        <label style={css.lbl}>Video URL (YouTube, Vimeo, or any link)</label>
        <input style={css.inp} value={editing.videoUrl||""} onChange={e=>setEditing({...editing,videoUrl:e.target.value})} placeholder="https://youtube.com/watch?v=..."/>
        <label style={css.lbl}>Upload Video File (max 4.5MB)</label>
        <label style={{...css.savebtn,display:"inline-block",cursor:"pointer",padding:"8px 16px",borderRadius:8,marginBottom:4}}>
          {editing.videoFile?"Replace Video":"Upload Video"}
          <input type="file" accept="video/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;if(f.size>4.5*1024*1024)return alert("Max 4.5MB");const r=new FileReader();r.onload=ev=>setEditing({...editing,videoFile:ev.target.result.split(",")[1]});r.readAsDataURL(f);}}/>
        </label>
        {editing.videoFile&&<button style={{...css.delbtn,marginLeft:8}} onClick={()=>setEditing({...editing,videoFile:null})}>Remove Video</button>}
        <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button style={css.cancelbtn} onClick={()=>setEditing(null)}>Cancel</button><button style={css.savebtn} onClick={saveEdit}>Save SOP</button></div>
      </div>
    </div>
  );

  if(viewing){
    const vc=SCATS.find(c=>c.id===viewing.cat);
    const embedUrl = (url) => {
      if (!url) return null;
      if (url.includes("youtu.be/")) return url.replace("youtu.be/","youtube.com/embed/");
      if (url.includes("youtube.com/watch")) return url.replace("watch?v=","embed/");
      if (url.includes("vimeo.com/")) return url.replace("vimeo.com/","player.vimeo.com/video/");
      return null;
    };
    const isEmbed = viewing.videoUrl && (viewing.videoUrl.includes("youtube")||viewing.videoUrl.includes("youtu.be")||viewing.videoUrl.includes("vimeo"));
    return(
      <div>
        <button style={css.back} onClick={()=>setViewing(null)}>← Back</button>
        <div style={{...css.card,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:18}}>{vc?.icon}</span><span style={{fontSize:11,fontWeight:700,color:vc?.color,letterSpacing:"0.06em",textTransform:"uppercase"}}>{vc?.label}</span></div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff",marginBottom:8}}>{viewing.title}</div>
          {viewing.content?<div style={{fontSize:14,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{viewing.content}</div>:<div style={{fontSize:14,color:T.muted,fontStyle:"italic"}}>No content yet.{isAdmin?" Tap Edit to add.":""}</div>}
          {viewing.videoUrl&&<div style={{marginTop:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Video</div>
            {isEmbed?<div style={{position:"relative",paddingBottom:"56.25%",height:0,overflow:"hidden",borderRadius:8}}><iframe src={embedUrl(viewing.videoUrl)} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none",borderRadius:8}} allowFullScreen/></div>:<a href={viewing.videoUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#1A2A6C,#B21F1F)",color:"#fff",borderRadius:8,padding:"10px 16px",textDecoration:"none",fontSize:14,fontWeight:600}}>▶ Watch Video</a>}
          </div>}
          {viewing.videoFile&&<div style={{marginTop:16}}><div style={{fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Video</div><video controls style={{width:"100%",borderRadius:8,border:`1px solid ${T.bdr}`}}><source src={`data:video/mp4;base64,${viewing.videoFile}`}/></video></div>}
        </div>
        {isAdmin&&<div style={{display:"flex",gap:8}}><button style={{...css.savebtn,flex:1}} onClick={()=>setEditing({...viewing})}>✏️ Edit SOP</button><button style={css.delbtn} onClick={()=>delSop(viewing.id)}>Delete</button></div>}
      </div>
    );
  }

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}><button style={{...css.stab,...(sub==="sops"?css.stabon:{})}} onClick={()=>setSub("sops")}>SOPs</button><button style={{...css.stab,...(sub==="licenses"?css.stabon:{})}} onClick={()=>setSub("licenses")}>Licenses</button></div>
      {sub==="licenses"&&<LicView isAdmin={isAdmin}/>}
      {sub==="sops"&&<>
        <div style={css.vhead}><h2 style={css.vtitle}>SOPs</h2>{isAdmin&&<button style={css.addbtn} onClick={()=>setShowNew(true)}>+ Add</button>}</div>
        {showNew&&isAdmin&&<div style={css.form}><div style={css.ftitle}>New SOP</div><label style={css.lbl}>Title *</label><input style={{...css.inp,marginBottom:8}} value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Keg Tapping"/><label style={css.lbl}>Category</label><div style={css.radios}>{SCATS.map(c=><button key={c.id} style={{...css.radio,...(cat===c.id?{...css.radioon,background:c.color,borderColor:c.color}:{})}} onClick={()=>setCat(c.id)}>{c.icon} {c.label}</button>)}</div><div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button style={css.cancelbtn} onClick={()=>setShowNew(false)}>Cancel</button><button style={css.savebtn} onClick={addSop}>Add SOP</button></div></div>}
        <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:2}}>{visibleCats.map(c=><button key={c.id} style={{...css.chip,...(cat===c.id?{...css.chipon,background:c.color,borderColor:c.color}:{})}} onClick={()=>setCat(c.id)}>{c.icon} {c.label}</button>)}</div>
        {!cs.length&&<Empty icon="📄" text="No SOPs yet" hint={isAdmin?"Hit + Add to create one.":"Check back soon."}/>}
        {cs.map(s=><button key={s.id} style={css.soprow} onClick={()=>setViewing(s)}><div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{s.title}</div><div style={{fontSize:12,color:T.muted,marginTop:3}}>{s.content?s.content.slice(0,60)+(s.content.length>60?"...":""):"No content yet"}</div></div><span style={{fontSize:18,color:T.muted,marginLeft:8}}>›</span></button>)}
        {!isAdmin&&<div style={{textAlign:"center",fontSize:12,color:T.muted,marginTop:24}}>SOPs are managed by Marc.</div>}
      </>}
    </div>
  );
}

function LicView({ isAdmin }) {
  const [lics,setLics]=useState(null); const [view,setView]=useState(null); const [showF,setShowF]=useState(false);
  useEffect(()=>{dbGet("licenses").then(d=>setLics(d||[]));},[]);
  const sl=async u=>{setLics(u);await dbSet("licenses",u);};
  const addL=async e=>{await sl([...(lics||[]),{...e,id:uid()}]);setShowF(false);};
  const delL=async id=>{if(confirm("Delete?")){await dbSet("licDoc_"+id,null);await sl(lics.filter(l=>l.id!==id));setView(null);}};
  if(!lics)return<div style={{padding:32,textAlign:"center",color:T.muted}}>Loading...</div>;
  if(view)return<LicDet lic={view} isAdmin={isAdmin} onDel={delL} onBack={()=>setView(null)}/>;
  return(
    <div>
      <div style={css.vhead}><h2 style={{...css.vtitle,fontSize:18}}>Licenses & Permits</h2>{isAdmin&&<button style={css.addbtn} onClick={()=>setShowF(true)}>+ Add</button>}</div>
      {showF&&isAdmin&&<LicForm onSave={addL} onCancel={()=>setShowF(false)}/>}
      {!lics.length&&!showF&&<Empty icon="📋" text="No licenses yet" hint={isAdmin?"Tap + Add to upload.":"Licenses appear here once added."}/>}
      {lics.map(l=><button key={l.id} style={css.soprow} onClick={()=>setView(l)}><div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{l.name}</div><div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>{l.county&&<span style={css.badge}>{l.county} County</span>}{l.licenseNumber&&<span style={css.badge}>#{l.licenseNumber}</span>}{l.expiration&&<span style={{...css.badge,background:"#0A2010",color:T.green}}>Exp: {l.expiration}</span>}</div></div><span style={{fontSize:18,color:T.muted,marginLeft:8}}>›</span></button>)}
    </div>
  );
}

function LicDet({ lic, isAdmin, onDel, onBack }) {
  const [doc,setDoc]=useState(null); const [dt,setDt]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{dbGet("licDoc_"+lic.id).then(d=>{if(d){setDoc(d.data);setDt(d.type);}setLoading(false);});},[lic.id]);
  const upload=async(data,type)=>{await dbSet("licDoc_"+lic.id,{data,type});setDoc(data);setDt(type);};
  return(
    <div>
      <button style={css.back} onClick={onBack}>← Back</button>
      <div style={{...css.card,marginBottom:12}}><div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff",marginBottom:10}}>{lic.name}</div>{lic.county&&<div style={{fontSize:14,color:T.muted,marginBottom:4}}>County: {lic.county}</div>}{lic.licenseNumber&&<div style={{fontSize:14,color:T.muted,marginBottom:4}}>License #: {lic.licenseNumber}</div>}{lic.expiration&&<div style={{fontSize:14,color:T.muted,marginBottom:4}}>Expiration: {lic.expiration}</div>}{lic.notes&&<div style={{fontSize:14,color:T.muted,marginTop:8,lineHeight:1.5}}>{lic.notes}</div>}</div>
      <div style={{...css.card,marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>Attached Document</div>{loading?<div style={{fontSize:13,color:T.muted}}>Loading...</div>:doc?(dt?.startsWith("image/")?<img src={`data:${dt};base64,${doc}`} style={{width:"100%",borderRadius:8,border:`1px solid ${T.bdr}`}} alt="license"/>:<iframe src={`data:application/pdf;base64,${doc}`} style={{width:"100%",height:420,border:`1px solid ${T.bdr}`,borderRadius:8}} title="license"/>):<div style={{fontSize:13,color:T.muted,fontStyle:"italic"}}>No document attached yet.</div>}{isAdmin&&<div style={{marginTop:12}}><label style={{...css.savebtn,display:"inline-block",cursor:"pointer",padding:"8px 16px",borderRadius:8}}>{doc?"Replace Document":"Upload Document"}<input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;if(f.size>4.5*1024*1024)return alert("Max 4.5MB");const r=new FileReader();r.onload=async ev=>{upload(ev.target.result.split(",")[1],f.type);};r.readAsDataURL(f);}}/></label></div>}</div>
      {isAdmin&&<button style={{...css.delbtn,width:"100%",padding:10,borderRadius:8,fontSize:14}} onClick={()=>onDel(lic.id)}>Delete License</button>}
    </div>
  );
}

function LicForm({ onSave, onCancel }) {
  const [f,setF]=useState({name:"",county:"",licenseNumber:"",expiration:"",notes:""});
  const ch=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  return(<div style={css.form}><div style={css.ftitle}>Add License / Permit</div><label style={css.lbl}>Name *</label><input style={css.inp} value={f.name} onChange={ch("name")} placeholder="e.g. Jefferson County Temp Restaurant Permit"/><label style={css.lbl}>County</label><input style={css.inp} value={f.county} onChange={ch("county")} placeholder="e.g. Jefferson"/><label style={css.lbl}>License #</label><input style={css.inp} value={f.licenseNumber} onChange={ch("licenseNumber")} placeholder="e.g. TRP-2026-00123"/><label style={css.lbl}>Expiration</label><input style={css.inp} value={f.expiration} onChange={ch("expiration")} placeholder="e.g. 12/31/2026"/><label style={css.lbl}>Notes</label><textarea style={{...css.inp,minHeight:60,resize:"vertical"}} value={f.notes} onChange={ch("notes")} placeholder="Additional details..."/><div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button style={css.cancelbtn} onClick={onCancel}>Cancel</button><button style={css.savebtn} onClick={()=>{if(!f.name.trim())return alert("Enter a name.");onSave(f);}}>Save</button></div></div>);
}

// ── TEAM ──────────────────────────────────────────────────────────────────────
function TeamView({ emps, saveEmps, isAdmin, authUser }) {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [showAdd,setShowAdd]=useState(false);
  const add=()=>{if(!name.trim()||!email.trim())return alert("Enter name and email.");saveEmps([...emps,{id:uid(),name:name.trim(),email:email.trim().toLowerCase(),color:COLS[emps.length%COLS.length],role:"staff",noteMode:"toggle"}]);setName("");setEmail("");setShowAdd(false);};
  const rem=id=>{if(id==="marc")return alert("Cannot remove Marc.");if(confirm("Remove?"))saveEmps(emps.filter(e=>e.id!==id));};
  const upd=(id,key,val)=>saveEmps(emps.map(e=>e.id===id?{...e,[key]:val}:e));
  const ROLES=[{v:"staff",l:"Staff"},{v:"warehouse",l:"Warehouse"},{v:"manager",l:"Manager"},{v:"admin",l:"Admin"}];
  const NOTES=[{v:"toggle",l:"Experienced (tap to show)"},{v:"always",l:"New Employee (always open)"}];
  return(
    <div>
      <div style={css.vhead}><h2 style={css.vtitle}>Team</h2>{isAdmin&&<button style={css.addbtn} onClick={()=>setShowAdd(s=>!s)}>+ Add</button>}</div>
      {showAdd&&isAdmin&&<div style={css.form}>
        <div style={css.ftitle}>Add Team Member</div>
        <label style={css.lbl}>Name *</label><input style={css.inp} value={name} onChange={e=>setName(e.target.value)} placeholder="First Last"/>
        <label style={css.lbl}>Email * (used for login)</label><input style={css.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="employee@email.com"/>
        <div style={{fontSize:12,color:T.muted,marginTop:4,marginBottom:8}}>Note: You must also create this person's account in Firebase Authentication console so they can log in.</div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button style={css.cancelbtn} onClick={()=>setShowAdd(false)}>Cancel</button><button style={css.savebtn} onClick={add}>Add</button></div>
      </div>}
      {emps.map(e=>(
        <div key={e.id} style={{...css.form,marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:e.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:700,flexShrink:0}}>{e.name[0]}</div>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{e.name}</div><div style={{fontSize:12,color:T.muted}}>{e.email}</div></div>
            {isAdmin&&e.id!=="marc"&&<button style={css.delbtn} onClick={()=>rem(e.id)}>Remove</button>}
          </div>
          {isAdmin&&<>
            <label style={{...css.lbl,marginTop:0}}>Permission Level</label>
            <div style={css.radios}>{ROLES.map(r=><button key={r.v} style={{...css.radio,...((e.role||"staff")===r.v?css.radioon:{})}} onClick={()=>upd(e.id,"role",r.v)}>{r.l}</button>)}</div>
            <label style={css.lbl}>Notes Mode</label>
            <div style={css.radios}>{NOTES.map(n=><button key={n.v} style={{...css.radio,...((e.noteMode||"toggle")===n.v?css.radioon:{})}} onClick={()=>upd(e.id,"noteMode",n.v)}>{n.l}</button>)}</div>
          </>}
        </div>
      ))}
    </div>
  );
}



// ── SALES ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:"kombucha",    label:"Kombucha",     color:"#F5A623" },
  { id:"lemonade",    label:"Lemonade",     color:"#2ECC71" },
  { id:"gingerbeer",  label:"Ginger Beer",  color:"#E74C3C" },
  { id:"coldbrew",    label:"Cold Brew",    color:"#9B59B6" },
  { id:"coffee",      label:"Coffee",       color:"#E67E22" },
  { id:"beejola",     label:"Beejola",      color:"#1ABC9C" },
  { id:"jam",         label:"Jam",          color:"#E91E63" },
  { id:"concentrates",label:"Concentrates", color:"#3498DB" },
];

function SalesView({ isAdmin, emps, events }) {
  const [sales,    setSales]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter,   setFilter]   = useState("all");
  const [selEvent, setSelEvent] = useState("all");
  const [view,     setView]     = useState("byPerson");
  const [editing,  setEditing]  = useState(null);

  useEffect(() => { dbGet("sales").then(d => setSales(d||[])); }, []);

  const saveSales = async v => { setSales(v); await dbSet("sales", v); };
  const del = id => { if(confirm("Delete this entry?")) saveSales(sales.filter(s=>s.id!==id)); };

  if (!sales) return <div style={{padding:32,textAlign:"center",color:T.muted}}>Loading...</div>;

  if (showForm) return <SalesForm emps={emps} events={upcomingEvents} onSave={v=>{saveSales([...sales,{...v,id:uid()}]);setShowForm(false);}} onCancel={()=>setShowForm(false)}/>;
  if (editing)  return <SalesForm emps={emps} events={upcomingEvents} init={editing} onSave={v=>{saveSales(sales.map(s=>s.id===editing.id?{...s,...v}:s));setEditing(null);}} onCancel={()=>setEditing(null)}/>;

  const ename  = id => emps.find(e=>e.id===id)?.name || id;
  const ecolor = id => emps.find(e=>e.id===id)?.color || T.muted;

  // Filter sales
  const now = toKey();
  const upcomingEvents = (events||[]).filter(e=>e.date<=now).sort((a,b)=>b.date.localeCompare(a.date));
  
  let visible = [...sales];
  if (filter !== "all") visible = visible.filter(s=>s.employeeId===filter);
  if (selEvent !== "all") visible = visible.filter(s=>s.eventId===selEvent);
  visible = visible.sort((a,b)=>b.date.localeCompare(a.date));

  // Totals by category
  const totals = {};
  CATEGORIES.forEach(c => { totals[c.id] = visible.reduce((sum,s) => sum+(parseFloat(s[c.id])||0), 0); });
  const grandTotal = Object.values(totals).reduce((a,b)=>a+b, 0);

  return (
    <div>
      <div style={css.vhead}>
        <h2 style={css.vtitle}>Sales</h2>
        {isAdmin && <button style={css.addbtn} onClick={() => setShowForm(true)}>+ Add Entry</button>}
      </div>

      {/* View toggle */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <button style={{...css.stab,...(view==="byPerson"?css.stabon:{})}} onClick={()=>setView("byPerson")}>By Person</button>
        <button style={{...css.stab,...(view==="byMarket"?css.stabon:{})}} onClick={()=>setView("byMarket")}>By Market</button>
        <button style={{...css.stab,...(view==="cash"?css.stabon:{})}} onClick={()=>setView("cash")}>Cash</button>
      </div>

      {/* Market summary view */}
      {view==="byMarket" && (() => {
        const marketSales = {};
        sales.forEach(s => {
          const key = s.eventId || "no-event";
          if (!marketSales[key]) marketSales[key] = { entries:[], total:0 };
          const total = CATEGORIES.reduce((sum,c)=>sum+(parseFloat(s[c.id])||0),0);
          marketSales[key].entries.push(s);
          marketSales[key].total += total;
        });
        const eventKeys = Object.keys(marketSales).sort((a,b) => {
          const ea = (events||[]).find(e=>e.id===a);
          const eb = (events||[]).find(e=>e.id===b);
          if (!ea||!eb) return 0;
          return b.date - a.date;
        });
        if (!eventKeys.length) return <Empty icon="💰" text="No sales entries yet" hint="Tap + Add Entry to log sales."/>;
        return (
          <div>
            {eventKeys.map(key => {
              const ev = (events||[]).find(e=>e.id===key);
              const mData = marketSales[key];
              const catTotals = {};
              CATEGORIES.forEach(c => { catTotals[c.id] = mData.entries.reduce((sum,s)=>sum+(parseFloat(s[c.id])||0),0); });
              const empTotals = {};
              mData.entries.forEach(s => {
                if (!empTotals[s.employeeId]) empTotals[s.employeeId] = 0;
                empTotals[s.employeeId] += CATEGORIES.reduce((sum,c)=>sum+(parseFloat(s[c.id])||0),0);
              });
              return (
                <div key={key} style={{...css.card,marginBottom:12}}>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:"#fff",marginBottom:2}}>{ev?ev.name:"No Event"}</div>
                  {ev&&<div style={{fontSize:12,color:T.muted,marginBottom:8}}>{ev.city} · {fmtDate(ev.date)}</div>}
                  <div style={{fontSize:24,fontWeight:700,color:T.amber,marginBottom:12}}>${mData.total.toFixed(2)}</div>
                  
                  {/* By employee */}
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>By Employee</div>
                  {Object.entries(empTotals).map(([empId, empTotal]) => (
                    <div key={empId} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{width:24,height:24,borderRadius:"50%",background:ecolor(empId),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{ename(empId)[0]}</div>
                      <span style={{flex:1,fontSize:13,color:"#fff"}}>{ename(empId)}</span>
                      <span style={{fontSize:13,fontWeight:600,color:T.amber}}>${empTotal.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* By category */}
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,marginTop:10}}>By Category</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {CATEGORIES.map(c => catTotals[c.id]>0 && (
                      <div key={c.id} style={{background:"#111D2E",borderRadius:6,padding:"4px 8px",border:`1px solid ${T.bdr}`}}>
                        <div style={{fontSize:10,color:T.muted}}>{c.label}</div>
                        <div style={{fontSize:13,fontWeight:600,color:c.color}}>${catTotals[c.id].toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Cash Reconciliation view */}
      {view==="cash" && (() => {
        // Group sales by event for the date selector
        const allDates = [...new Set(sales.map(s=>s.date))].sort((a,b)=>b.localeCompare(a));
        return (
          <CashReconciliation
            sales={sales}
            saveSales={saveSales}
            emps={emps}
            events={events}
            allDates={allDates}
          />
        );
      })()}

      {/* Per person view */}
      {view==="byPerson" && <>

      {/* Summary card */}
      {visible.length > 0 && (
        <div style={css.card}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:"#fff",marginBottom:10}}>Total Sales</div>
          <div style={{fontSize:28,fontWeight:700,color:T.amber,fontFamily:"'DM Serif Display',serif",marginBottom:12}}>${grandTotal.toFixed(2)}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {CATEGORIES.map(c => totals[c.id]>0 && (
              <div key={c.id} style={{background:"#111D2E",borderRadius:8,padding:"6px 10px",border:`1px solid ${T.bdr}`}}>
                <div style={{fontSize:11,color:T.muted}}>{c.label}</div>
                <div style={{fontSize:14,fontWeight:600,color:c.color}}>${totals[c.id].toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
        <button style={{...css.chip,...(filter==="all"?{...css.chipon,background:"#1A2A6C",borderColor:"#1A2A6C"}:{})}} onClick={()=>setFilter("all")}>Everyone</button>
        {emps.map(e=><button key={e.id} style={{...css.chip,...(filter===e.id?{...css.chipon,background:e.color,borderColor:e.color}:{})}} onClick={()=>setFilter(e.id)}>{e.name}</button>)}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
        <button style={{...css.chip,...(selEvent==="all"?{...css.chipon,background:"#1A2A6C",borderColor:"#1A2A6C"}:{})}} onClick={()=>setSelEvent("all")}>All Events</button>
        {upcomingEvents.slice(0,10).map(e=><button key={e.id} style={{...css.chip,...(selEvent===e.id?{...css.chipon,background:"#B21F1F",borderColor:"#B21F1F"}:{})}} onClick={()=>setSelEvent(e.id)}>{e.name}</button>)}
      </div>

      {!visible.length && <Empty icon="💰" text="No sales entries yet" hint={isAdmin?"Tap + Add Entry to log sales.":"Sales will appear here."}/>}

      {/* Sales entries */}
      {visible.map(s => {
        const total = CATEGORIES.reduce((sum,c)=>sum+(parseFloat(s[c.id])||0),0);
        const ev = (events||[]).find(e=>e.id===s.eventId);
        return (
          <div key={s.id} style={{...css.card,marginBottom:8}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:ecolor(s.employeeId),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{ename(s.employeeId)[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{ename(s.employeeId)}</div>
                {ev && <div style={{fontSize:12,color:T.muted}}>{ev.name} · {ev.city}</div>}
                {!ev && s.customEventName && <div style={{fontSize:12,color:T.muted}}>{s.customEventName}</div>}
                <div style={{fontSize:12,color:T.muted}}>{fmtDate(s.date)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:700,color:T.amber}}>${total.toFixed(2)}</div>
                {isAdmin && <div style={{display:"flex",gap:4,marginTop:4}}><button style={{...css.editbtn,padding:"3px 8px",fontSize:11}} onClick={()=>setEditing(s)}>Edit</button><button style={{...css.delbtn,padding:"3px 8px",fontSize:11}} onClick={()=>del(s.id)}>Del</button></div>}
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {CATEGORIES.map(c => parseFloat(s[c.id])>0 && (
                <div key={c.id} style={{background:"#111D2E",borderRadius:6,padding:"4px 8px",border:`1px solid ${T.bdr}`}}>
                  <div style={{fontSize:10,color:T.muted}}>{c.label}</div>
                  <div style={{fontSize:13,fontWeight:600,color:c.color}}>${parseFloat(s[c.id]).toFixed(2)}</div>
                </div>
              ))}
            </div>
            {(s.cashSales||s.cashInBag) && (() => {
              const diff = (parseFloat(s.cashInBag)||0) - (parseFloat(s.cashSales)||0);
              const isUnder = diff < 0;
              const isOver  = diff > 0;
              return (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,background:isUnder?"#2A0A0A":isOver?"#0A2010":"#111D2E",borderRadius:8,padding:"8px 12px",border:`1px solid ${isUnder?"#3D1515":isOver?"#0D3525":T.bdr}`}}>
                  <div>
                    <div style={{fontSize:11,color:T.muted}}>Cash Sales: ${parseFloat(s.cashSales||0).toFixed(2)} · In Bag: ${parseFloat(s.cashInBag||0).toFixed(2)}</div>
                    <div style={{fontSize:13,fontWeight:600,color:isUnder?"#FF6B6B":isOver?T.green:"#fff",marginTop:2}}>
                      {diff===0?"✓ Cash exact":isOver?"Over by $"+Math.abs(diff).toFixed(2):"Short by $"+Math.abs(diff).toFixed(2)}
                    </div>
                  </div>
                  <span style={{fontSize:20}}>{isUnder?"⚠️":isOver?"✅":"✓"}</span>
                </div>
              );
            })()}
          </div>
        );
      })}
      </>}
    </div>
  );
}


function CashReconciliation({ sales, saveSales, emps, events, allDates }) {
  const [selDate, setSelDate] = useState(allDates[0] || toKey());
  const [editing, setEditing] = useState({});

  const daySales = sales.filter(s => s.date === selDate);
  const ename  = id => emps.find(e=>e.id===id)?.name  || id;
  const ecolor = id => emps.find(e=>e.id===id)?.color || T.muted;

  const updateCash = (saleId, field, val) => {
    setEditing(p => ({...p, [saleId+field]: val}));
  };

  const saveAll = () => {
    const updated = sales.map(s => {
      const cashSales = editing[s.id+"cashSales"] !== undefined ? editing[s.id+"cashSales"] : s.cashSales;
      const cashInBag = editing[s.id+"cashInBag"] !== undefined ? editing[s.id+"cashInBag"] : s.cashInBag;
      return {...s, cashSales, cashInBag};
    });
    saveSales(updated);
    setEditing({});
    alert("Cash reconciliation saved!");
  };

  const hasChanges = Object.keys(editing).length > 0;

  return (
    <div>
      {/* Date selector */}
      <label style={css.lbl}>Select Date</label>
      <select style={{...css.inp, marginBottom:16}} value={selDate} onChange={e=>setSelDate(e.target.value)}>
        {allDates.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
        <option value={toKey()}>{fmtDate(toKey())} (Today)</option>
      </select>

      {!daySales.length && (
        <Empty icon="💵" text="No sales entries for this date" hint="Add a sales entry first in the By Person tab."/>
      )}

      {/* Summary totals across all people */}
      {daySales.length > 0 && (() => {
        const totalCashSales = daySales.reduce((sum,s)=>sum+(parseFloat(editing[s.id+"cashSales"]!==undefined?editing[s.id+"cashSales"]:s.cashSales)||0),0);
        const totalCashInBag = daySales.reduce((sum,s)=>sum+(parseFloat(editing[s.id+"cashInBag"]!==undefined?editing[s.id+"cashInBag"]:s.cashInBag)||0),0);
        const totalDiff = totalCashInBag - totalCashSales;
        return (
          <div style={{...css.card, marginBottom:16, background:"linear-gradient(135deg,#1A2A3A,#1A3A2A)"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:"#fff",marginBottom:10}}>Team Cash Summary</div>
            <div style={{display:"flex",gap:12,marginBottom:10}}>
              <div style={{flex:1,background:"#111D2E",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:11,color:T.muted}}>Total Cash Sales</div>
                <div style={{fontSize:18,fontWeight:700,color:T.amber}}>${totalCashSales.toFixed(2)}</div>
              </div>
              <div style={{flex:1,background:"#111D2E",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:11,color:T.muted}}>Total In Bags</div>
                <div style={{fontSize:18,fontWeight:700,color:T.green}}>${totalCashInBag.toFixed(2)}</div>
              </div>
            </div>
            <div style={{
              background: totalDiff<0?"#2A0A0A":totalDiff>0?"#0A2010":"#111D2E",
              borderRadius:8,padding:"10px 14px",
              border:`1px solid ${totalDiff<0?"#3D1515":totalDiff>0?"#0D3525":T.bdr}`
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:600,color:"#fff"}}>Overall Difference</span>
                <span style={{fontSize:18,fontWeight:700,color:totalDiff<0?"#FF6B6B":totalDiff>0?T.green:T.muted}}>
                  {totalDiff===0?"✓ All exact":totalDiff>0?"+$"+Math.abs(totalDiff).toFixed(2):"-$"+Math.abs(totalDiff).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Each person row */}
      {daySales.map(s => {
        const cashSales = editing[s.id+"cashSales"] !== undefined ? editing[s.id+"cashSales"] : (s.cashSales||"");
        const cashInBag = editing[s.id+"cashInBag"] !== undefined ? editing[s.id+"cashInBag"] : (s.cashInBag||"");
        const diff = (parseFloat(cashInBag)||0) - (parseFloat(cashSales)||0);
        const isUnder = diff < 0;
        const isOver  = diff > 0;
        const ev = (events||[]).find(e=>e.id===s.eventId);
        const totalSales = CATEGORIES.reduce((sum,c)=>sum+(parseFloat(s[c.id])||0),0);

        return (
          <div key={s.id} style={{...css.card, marginBottom:10}}>
            {/* Person header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:ecolor(s.employeeId),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700,flexShrink:0}}>{ename(s.employeeId)[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{ename(s.employeeId)}</div>
                <div style={{fontSize:11,color:T.muted}}>{ev?ev.name:s.customEventName||"No event"} · Total Sales: ${totalSales.toFixed(2)}</div>
              </div>
              {diff!==0&&(cashSales||cashInBag)&&<span style={{fontSize:18}}>{isUnder?"⚠️":"✅"}</span>}
            </div>

            {/* Cash inputs in a row */}
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <label style={{...css.lbl,marginTop:0,marginBottom:4}}>Cash Sales</label>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:T.muted,fontSize:13}}>$</span>
                  <input
                    type="number" min="0" step="0.01"
                    style={{...css.inp,marginBottom:0,textAlign:"right"}}
                    value={cashSales}
                    onChange={e=>updateCash(s.id,"cashSales",e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div style={{flex:1}}>
                <label style={{...css.lbl,marginTop:0,marginBottom:4}}>In Money Bag</label>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:T.muted,fontSize:13}}>$</span>
                  <input
                    type="number" min="0" step="0.01"
                    style={{...css.inp,marginBottom:0,textAlign:"right"}}
                    value={cashInBag}
                    onChange={e=>updateCash(s.id,"cashInBag",e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Difference indicator */}
            {(cashSales||cashInBag)&&(
              <div style={{
                background:isUnder?"#2A0A0A":isOver?"#0A2010":"#111D2E",
                borderRadius:8,padding:"8px 12px",
                border:`1px solid ${isUnder?"#3D1515":isOver?"#0D3525":T.bdr}`,
                display:"flex",justifyContent:"space-between",alignItems:"center"
              }}>
                <span style={{fontSize:13,color:isUnder?"#FF6B6B":isOver?T.green:"#fff"}}>
                  {diff===0?"Exact match":isOver?"Over":"Short"}
                </span>
                <span style={{fontSize:15,fontWeight:700,color:isUnder?"#FF6B6B":isOver?T.green:T.muted}}>
                  {diff===0?"✓":isOver?"+$"+Math.abs(diff).toFixed(2):"-$"+Math.abs(diff).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Save all button */}
      {daySales.length > 0 && (
        <button
          style={{...css.savebtn, width:"100%", padding:12, fontSize:15, opacity:hasChanges?1:0.5}}
          onClick={saveAll}
          disabled={!hasChanges}
        >
          {hasChanges?"Save All Cash Entries":"No Changes to Save"}
        </button>
      )}
    </div>
  );
}

function SalesForm({ emps, events, init, onSave, onCancel }) {
  const [empId,      setEmpId]      = useState(init?.employeeId || emps[0]?.id||"");
  const [eventId,    setEventId]    = useState(init?.eventId    || "");
  const [customName, setCustomName] = useState(init?.customEventName || "");
  const [useCustom,  setUseCustom]  = useState(!!init?.customEventName);
  const [date,       setDate]       = useState(init?.date       || toKey());
  const [vals,       setVals]       = useState(
    init ? Object.fromEntries(Object.entries(init).filter(([k])=>k!=="id"&&k!=="employeeId"&&k!=="eventId"&&k!=="date"&&k!=="customEventName")) : {}
  );

  const setVal = (k,v) => setVals(p=>({...p,[k]:v}));
  const total = CATEGORIES.reduce((sum,c)=>sum+(parseFloat(vals[c.id])||0),0);

  const go = () => {
    if (!empId) return alert("Select an employee.");
    if (useCustom && !customName.trim()) return alert("Enter an event name.");
    const entry = {
      employeeId: empId,
      eventId: useCustom ? "" : eventId,
      customEventName: useCustom ? customName.trim() : "",
      date,
      ...vals
    };
    onSave(entry);
  };

  return (
    <div>
      <button style={css.back} onClick={onCancel}>← Cancel</button>
      <div style={css.form}>
        <div style={css.ftitle}>Add Sales Entry</div>
        <label style={css.lbl}>Employee</label>
        <select style={css.inp} value={empId} onChange={e=>setEmpId(e.target.value)}>
          {emps.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <label style={css.lbl}>Event / Market</label>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <button style={{...css.radio,...(!useCustom?css.radioon:{})}} onClick={()=>setUseCustom(false)}>From Events List</button>
          <button style={{...css.radio,...(useCustom?css.radioon:{})}} onClick={()=>setUseCustom(true)}>Custom Name</button>
        </div>
        {useCustom
          ? <input style={css.inp} value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="e.g. Cherry Creek Farmers Market"/>
          : <select style={css.inp} value={eventId} onChange={e=>setEventId(e.target.value)}>
              <option value="">No specific event</option>
              {events.map(e=><option key={e.id} value={e.id}>{e.name} — {fmtDate(e.date)}</option>)}
            </select>
        }
        <label style={css.lbl}>Date</label>
        <input type="date" style={css.inp} value={date} onChange={e=>setDate(e.target.value)}/>
        <label style={css.lbl}>Sales by Category</label>
        {CATEGORIES.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:c.color,flexShrink:0}}/>
            <span style={{fontSize:13,color:"#fff",flex:1}}>{c.label}</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{color:T.muted,fontSize:13}}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                style={{...css.inp,width:90,marginBottom:0,textAlign:"right"}}
                value={vals[c.id]||""}
                onChange={e=>setVal(c.id,e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${T.bdr}`,paddingTop:12,marginTop:4}}>
          <span style={{fontWeight:600,color:"#fff"}}>Category Total</span>
          <span style={{fontSize:18,fontWeight:700,color:T.amber}}>${total.toFixed(2)}</span>
        </div>

        <div style={{borderTop:`1px solid ${T.bdr}`,marginTop:12,paddingTop:12}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:15,color:"#fff",marginBottom:10}}>Cash Reconciliation</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:13,color:"#fff",flex:1}}>Cash Sales</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{color:T.muted,fontSize:13}}>$</span>
              <input type="number" min="0" step="0.01" style={{...css.inp,width:100,marginBottom:0,textAlign:"right"}} value={vals.cashSales||""} onChange={e=>setVal("cashSales",e.target.value)} placeholder="0.00"/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:13,color:"#fff",flex:1}}>Cash in Money Bag</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{color:T.muted,fontSize:13}}>$</span>
              <input type="number" min="0" step="0.01" style={{...css.inp,width:100,marginBottom:0,textAlign:"right"}} value={vals.cashInBag||""} onChange={e=>setVal("cashInBag",e.target.value)} placeholder="0.00"/>
            </div>
          </div>
          {(vals.cashSales||vals.cashInBag) && (() => {
            const diff = (parseFloat(vals.cashInBag)||0) - (parseFloat(vals.cashSales)||0);
            const isOver = diff > 0;
            const isUnder = diff < 0;
            return (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:isUnder?"#2A0A0A":isOver?"#0A2010":"#111D2E",borderRadius:8,padding:"10px 14px",border:`1px solid ${isUnder?"#3D1515":isOver?"#0D3525":T.bdr}`}}>
                <span style={{fontSize:13,fontWeight:600,color:isUnder?"#FF6B6B":isOver?T.green:"#fff"}}>
                  {isUnder?"Short":"Over"} by
                </span>
                <span style={{fontSize:16,fontWeight:700,color:isUnder?"#FF6B6B":isOver?T.green:T.muted}}>
                  {diff===0?"✓ Exact":isOver?"+$"+Math.abs(diff).toFixed(2):"-$"+Math.abs(diff).toFixed(2)}
                </span>
              </div>
            );
          })()}
        </div>

        <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
          <button style={css.cancelbtn} onClick={onCancel}>Cancel</button>
          <button style={css.savebtn} onClick={go}>Save Entry</button>
        </div>
      </div>
    </div>
  );
}


// ── EVENTS ────────────────────────────────────────────────────────────────────
function EventsView({ isAdmin }) {
  const [events,   setEvents]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => { dbGet("events").then(d => setEvents(d||[])); }, []);

  const saveEvents = async v => { setEvents(v); await dbSet("events", v); };
  const del = id => { if(confirm("Delete this event?")) saveEvents(events.filter(e=>e.id!==id)); };

  if (!events) return <div style={{padding:32,textAlign:"center",color:T.muted}}>Loading...</div>;

  const now = toKey();
  const upcoming = events
    .filter(e => e.date >= now)
    .sort((a,b) => a.date.localeCompare(b.date));
  const past = events
    .filter(e => e.date < now)
    .sort((a,b) => b.date.localeCompare(a.date));

  const handleSave = v => {
    if (editing) saveEvents(events.map(e=>e.id===editing.id?{...editing,...v}:e));
    else saveEvents([...events, {...v, id:uid()}]);
    setShowForm(false); setEditing(null);
  };

  if (showForm || editing) return (
    <EventForm
      init={editing}
      onSave={handleSave}
      onCancel={() => { setShowForm(false); setEditing(null); }}
    />
  );

  return (
    <div>
      <div style={css.vhead}>
        <h2 style={css.vtitle}>Events</h2>
        {isAdmin && <button style={css.addbtn} onClick={() => setShowForm(true)}>+ Add Event</button>}
      </div>

      {!upcoming.length && !past.length && (
        <Empty icon="📅" text="No events yet" hint={isAdmin?"Tap + Add Event to get started.":"Check back soon."}/>
      )}

      {/* Upcoming events */}
      {upcoming.map(ev => <EventCard key={ev.id} ev={ev} isAdmin={isAdmin} onEdit={()=>setEditing(ev)} onDel={()=>del(ev.id)}/>)}

      {/* Past events toggle */}
      {past.length > 0 && (
        <div style={{marginTop:8}}>
          <button
            onClick={() => setShowPast(s=>!s)}
            style={{...css.chip, marginBottom:12, borderColor:showPast?T.amber:T.bdr, color:showPast?T.amber:T.muted}}
          >
            {showPast ? "Hide Past Events" : `Show Past Events (${past.length})`}
          </button>
          {showPast && past.map(ev => <EventCard key={ev.id} ev={ev} isAdmin={isAdmin} isPast onEdit={()=>setEditing(ev)} onDel={()=>del(ev.id)}/>)}
        </div>
      )}
    </div>
  );
}

function EventCard({ ev, isAdmin, isPast, onEdit, onDel }) {
  const [open, setOpen] = useState(false);
  const dateStr = new Date(ev.date + 'T12:00:00').toLocaleDateString("en-US", {weekday:"short",month:"short",day:"numeric",year:"numeric"});
  return (
    <div style={{...css.card, marginBottom:8, opacity:isPast?0.6:1}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{background:isPast?"#1A2535":"linear-gradient(135deg,#1A2A6C,#B21F1F)",borderRadius:10,padding:"8px 10px",textAlign:"center",flexShrink:0,minWidth:48}}>
          <div style={{fontSize:18}}>{isPast?"📁":"📅"}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{ev.name}</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{ev.city}</div>
          <div style={{fontSize:13,color:T.amber,marginTop:2}}>{dateStr}</div>
          {ev.startTime && <div style={{fontSize:12,color:T.muted,marginTop:2}}>{ev.startTime}{ev.endTime?` — ${ev.endTime}`:""}</div>}
          {ev.notes && (
            <div style={{marginTop:6}}>
              <span style={css.gbadge} onClick={()=>setOpen(o=>!o)}>{open?"Hide Notes":"Show Notes"}</span>
              {open && <div style={css.nbox}>{ev.notes}</div>}
            </div>
          )}
        </div>
        {isAdmin && (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <button style={css.editbtn} onClick={onEdit}>Edit</button>
            <button style={css.delbtn} onClick={onDel}>Del</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventForm({ init, onSave, onCancel }) {
  const [name,      setName]      = useState(init?.name      || "");
  const [city,      setCity]      = useState(init?.city      || "");
  const [date,      setDate]      = useState(init?.date      || toKey());
  const [startTime, setStartTime] = useState(init?.startTime || "");
  const [endTime,   setEndTime]   = useState(init?.endTime   || "");
  const [notes,     setNotes]     = useState(init?.notes     || "");

  const go = () => {
    if (!name.trim()) return alert("Enter an event name.");
    if (!city.trim()) return alert("Enter a city.");
    if (!date)        return alert("Select a date.");
    onSave({ name:name.trim(), city:city.trim(), date, startTime, endTime, notes:notes.trim() });
  };

  return (
    <div>
      <button style={css.back} onClick={onCancel}>← Cancel</button>
      <div style={css.form}>
        <div style={css.ftitle}>{init ? "Edit Event" : "New Event"}</div>
        <label style={css.lbl}>Event Name *</label>
        <input style={css.inp} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Cherry Creek Farmers Market"/>
        <label style={css.lbl}>City *</label>
        <input style={css.inp} value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Denver, CO"/>
        <label style={css.lbl}>Date *</label>
        <input type="date" style={css.inp} value={date} onChange={e=>setDate(e.target.value)}/>
        <label style={css.lbl}>Start Time</label>
        <input type="time" style={css.inp} value={startTime} onChange={e=>setStartTime(e.target.value)}/>
        <label style={css.lbl}>End Time</label>
        <input type="time" style={css.inp} value={endTime} onChange={e=>setEndTime(e.target.value)}/>
        <label style={css.lbl}>Notes (optional)</label>
        <textarea style={{...css.inp,minHeight:80,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any details about this event..."/>
        <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
          <button style={css.cancelbtn} onClick={onCancel}>Cancel</button>
          <button style={css.savebtn} onClick={go}>Save Event</button>
        </div>
      </div>
    </div>
  );
}


// ── CHAT ──────────────────────────────────────────────────────────────────────
function ChatView({ sops, steps, tpls }) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Hi! I'm the Tru Goodness assistant. Ask me anything about our procedures, checklists, SOPs, products, or tasks."}]);
  const [input,setInput]=useState(""); const [busy,setBusy]=useState(false);
  const bot=useRef(null);
  useEffect(()=>{bot.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const ctx=()=>{
    const so=sops.filter(s=>s.content).map(s=>`SOP: ${s.title}\n${s.content}`).join("\n\n");
    const st=steps.map(s=>`Step [${s.phase}]: ${s.title}${s.notes?` — ${s.notes}`:""}`).join("\n");
    return `You are a helpful assistant for Tru Goodness Brands, a specialty beverage company in Centennial, Colorado. They sell kombucha, lemonade, ginger beer, cold brew, oat milk and other products at farmers markets across Colorado. Website: https://www.trugoodnessbrands.com\n\nInternal knowledge:\n== SOPs ==\n${so||"None written yet."}\n\n== Checklist Steps ==\n${st}\n\nCheck internal knowledge first. Use web search for product info or website content. Be concise and helpful.`;
  };
  const send=async()=>{
    if(!input.trim()||busy)return;
    const um={role:"user",content:input.trim()};const nm=[...msgs,um];setMsgs(nm);setInput("");setBusy(true);
    try{
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:ctx(),tools:[{type:"web_search_20250305",name:"web_search"}],messages:nm.map(m=>({role:m.role,content:m.content}))})});
      const d=await r.json();
      const reply=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n")||"Sorry, I couldn't get a response.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Sorry, something went wrong. Please try again."}]);}
    setBusy(false);
  };
  const SUGG=["How do I connect the couplers?","What goes in the black bin?","What flavors do we sell?","Food safety rules"];
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
      <div style={{...css.card,marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1A2A6C,#B21F1F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🤖</div>
        <div><div style={{fontSize:15,fontWeight:600,color:"#fff"}}>Tru Goodness Assistant</div><div style={{fontSize:12,color:T.muted}}>SOPs · Checklists · Website · Tasks</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:8}}>
        {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#1A2A6C,#B21F1F)":T.surf,border:m.role==="user"?"none":`1px solid ${T.bdr}`,fontSize:14,lineHeight:1.6,color:T.text,whiteSpace:"pre-wrap"}}>{m.content}</div></div>))}
        {busy&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:T.surf,border:`1px solid ${T.bdr}`,borderRadius:"16px 16px 16px 4px",padding:"10px 16px",display:"flex",gap:4,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.muted,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div></div>}
        <div ref={bot}/>
      </div>
      {msgs.length===1&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>{SUGG.map(q=><button key={q} style={{...css.badge,cursor:"pointer",padding:"6px 10px",fontSize:12,background:T.surf,color:"#7EC8E3",border:`1px solid ${T.bdr}`,borderRadius:20}} onClick={()=>setInput(q)}>{q}</button>)}</div>}
      <div style={{display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${T.bdr}`}}>
        <input style={{...css.inp,flex:1,marginBottom:0,borderRadius:24,paddingLeft:16}} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask anything..." disabled={busy}/>
        <button style={{...css.savebtn,borderRadius:24,padding:"9px 18px",flexShrink:0,opacity:busy?0.6:1}} onClick={send} disabled={busy}>Send</button>
      </div>
    </div>
  );
}
