export const parseBentoFilters = (
  dataIndex: string,
  type: 'options' | 'text' | 'date' | 'number' | 'custom',
  actualFilterValue?: string,
) => {
  if (!actualFilterValue) return {};

  const hasNullValues = actualFilterValue
    .split(',')
    .some((str) => str === '__null__');

  const apiParamName = dataIndex;

  const valuesWithoutNull = hasNullValues
    ? actualFilterValue
        .split(',')
        .filter((value) => value !== '__null__')
        .join(',')
    : actualFilterValue;

  switch (type) {
    case 'date':
      return {
        [`${apiParamName}__gte`]: actualFilterValue.split(',')[0],
        [`${apiParamName}__lte`]: actualFilterValue.split(',')[1],
      };
    case 'options':
      return {
        [`${apiParamName}`]: actualFilterValue,
      };
    case 'number':
      return {
        [`${apiParamName}__gte`]: actualFilterValue.split(',')[0],
        [`${apiParamName}__lte`]: actualFilterValue.split(',')[1],
      };
    case 'text':
      return {
        [`${apiParamName}`]: valuesWithoutNull,
      };
    case 'custom':
      return {
        [`${apiParamName}`]: valuesWithoutNull,
      };
  }
};

export const getLoginErrorMessage = (status: string | number) => {
  switch (status) {
    case 401:
      return 'Credenziali non valide. Controlla username e password e riprova.';
    case 404:
      return 'Servizio di autenticazione non trovato. Riprova tra poco o contatta l’assistenza.';
    case 502:
      return 'Il servizio di autenticazione non è raggiungibile al momento. Riprova tra qualche minuto.';
    default: {
      if (status === 'FETCH_ERROR') {
        return 'Impossibile contattare il server. Verifica la connessione e riprova.';
      }
      return 'Accesso non riuscito. Riprova tra poco.';
    }
  }
};
