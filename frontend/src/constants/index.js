export const LOCS = {
  almoxarifado: { label: "Almoxarifado",  short: "ESTOQUE", color: "#059669", badge: "bg-emerald-100 text-emerald-800" },
  laboratorio:  { label: "Laboratório",   short: "LAB",     color: "#2563EB", badge: "bg-blue-100 text-blue-800" },
  campo:        { label: "Campo",         short: "CAMPO",   color: "#D97706", badge: "bg-amber-100 text-amber-800" },
  manutencao:   { label: "Manutenção",    short: "MANUT",   color: "#7C3AED", badge: "bg-violet-100 text-violet-800" },
  sucata:       { label: "Sucata",        short: "SUCATA",  color: "#6B7280", badge: "bg-gray-100 text-gray-700" },
};

export const OBS_CATS = {
  defeito:    { label: "Defeito",    cls: "bg-red-100 text-red-700 border border-red-200" },
  teste:      { label: "Teste",      cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  reparo:     { label: "Reparo",     cls: "bg-purple-100 text-purple-700 border border-purple-200" },
  observacao: { label: "Observação", cls: "bg-teal-100 text-teal-700 border border-teal-200" },
};

export const EVT_LABELS = {
  cadastro: "Cadastro", entrada_estoque: "Entrada em estoque",
  transferencia: "Transferência", envio_laboratorio: "Enviado ao laboratório",
  retorno_campo: "Retorno do campo", envio_campo: "Enviado ao campo",
  defeito: "Defeito", teste: "Teste", reparo: "Reparo",
  sucata: "Descartado (sucata)", observacao: "Observação",
};
