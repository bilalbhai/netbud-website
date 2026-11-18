// Calculation specification only. Never issues invoices or changes advertised gross prices.
export function draftTax(lines,{classificationsApproved=false}={}){
 if(!classificationsApproved||!Array.isArray(lines)||!lines.length)throw Error('Tax review required');
 let gross=0,gst=0;const items=lines.map(line=>{
  if(!Number.isSafeInteger(line.gross_cents)||line.gross_cents<0||line.gross_cents>100000000||!['taxable','gst_free'].includes(line.tax_class))throw Error('Tax review required');
  const tax=line.tax_class==='taxable'?Math.round(line.gross_cents/11):0;gross+=line.gross_cents;gst+=tax;return {...line,gst_cents:tax};
 });return {document:'draft_not_valid_for_issue',rounding:'nearest cent per gross line',items,gross_cents:gross,gst_cents:gst,net_cents:gross-gst};
}
