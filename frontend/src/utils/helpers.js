export const fmtDate = ts => new Date(ts).toLocaleString("pt-BR", {
  day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
});

export const fmtShort = ts => new Date(ts).toLocaleDateString("pt-BR", {
  day:"2-digit", month:"2-digit", year:"2-digit"
});

export const genId = eq => {
  const nums = eq.map(e => parseInt(e.id.replace("AT-",""))).filter(n => !isNaN(n));
  return `AT-${String((Math.max(0,...nums)+1)).padStart(6,"0")}`;
};
