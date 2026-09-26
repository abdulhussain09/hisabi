const n=t=>t==="KWD"?3:2,f=(t,r="AED",e=!1)=>{const s=parseFloat(t);if(isNaN(s))return e?`${r} 0.00`:"0.00";const o=n(r),a=s.toFixed(o);return e?`${r} ${a}`:a};export{f};
