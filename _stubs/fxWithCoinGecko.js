/// Supported currencies:
// https://docs.coingecko.com/reference/simple-supported-currencies
// [ "btc", "eth", "ltc", "bch", "bnb", "eos", "xrp", "xlm", "link", "dot", "yfi",
// "sol", "usd", "aed", "ars", "aud", "bdt", "bhd", "bmd", "brl", "cad", "chf", "clp",
// "cny", "czk", "dkk", "eur", "gbp", "gel", "hkd", "huf", "idr", "ils", "inr", "jpy",
// "krw", "kwd", "lkr", "mmk", "mxn", "myr", "ngn", "nok", "nzd", "php", "pkr", "pln",
// "rub", "sar", "sek", "sgd", "thb", "try", "twd", "uah", "vef", "vnd", "zar", "xdr",
// "xag", "xau", "bits", "sats" ]
//
// Returns { bitcoin : NUMBER, cardano : NUMBER }

export async function get(vsCurrency = "eur") {
  return fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency={vsCurrency}&ids=bitcoin,cardano`,
  )
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then((data) =>
      data.reduce(
        (obj, { id, current_price }) => ({ ...obj, [id]: current_price }),
        {},
      ),
    );
}
