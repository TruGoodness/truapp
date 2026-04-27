export const config={runtime:"edge"};
export default async function handler(req){
  if(req.method!=="POST") return new Response(JSON.stringify({error:"not allowed"}),{status:405});
  try{
    const body=await req.json();
    const key=process.env.ANTHROPIC_KEY;
    if(!key) return new Response(JSON.stringify({error:"No API key found"}),{status:500});
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:body.system,messages:body.messages})
    });
    const data=await r.json();
    if(data.error) return new Response(JSON.stringify({error:data.error.message}),{status:500});
    return new Response(JSON.stringify(data),{status:200});
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
}
