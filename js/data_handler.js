import * as utils from "./utility.js";

const company_list_path = "./Data/nasdaq_tech_companies.csv";
const fund_data_path = "./Data/fund_data/fund_data.json";

export let selected_company_list;
export let company_list;
export let ticker_to_index;
export let ticker_to_stock_data;
export let news_data;
export let fund_data;

export const start_date = new Date(2019, 0, 1);
export const end_date = new Date(2023, 11, 31);

export const init_from_date = new Date(2023, 0, 1);
export const init_to_date = new Date(2023, 11, 31);

let from_date = init_from_date;
let to_date = init_to_date;
var companyNames = ['AAPL','ADBE','ADI','ADSK','AKAM','AMAT','AMD','AMZN','ASML','AVGO','CDNS','CDW','CHKP','CRWD','CSCO','CSGP','CTSH','DDOG','DOCU','ETSY','FTNT','GOOGL','HUBS','ILMN','INTC','INTU','KLAC','LRCX','MELI','META','MRNA','MSFT','MU','NOW','NVDA','OKTA','PANW','PYPL','QCOM','SHOP','SNOW','SNPS','SPLK','TEAM','TWLO','TXN','VEEV','VRSN','ZM','ZS'];


export function getFromDate() {
  return from_date;
}
export function getToDate() {
  return to_date;
}
export function setFromDate() {
  from_date = utils.strToDate(document.getElementById("from_date").value);
  console.log("Update from_date: ", from_date);
}
export function setToDate() {
  to_date = utils.strToDate(document.getElementById("to_date").value);
  console.log("Update to_date: ", to_date);
}

export function initialize() {
  return loadCompanyList()
    .then(() => {
      return updateSelectedCompanyList(
        company_list.slice(0, 10).map((obj) => obj["Ticker Symbol"])
      );
    })
    .then(() => {
      return loadFundData();
    })
  .then(() => {
    getNewsData(companyNames)
      .then(data => {
        news_data = data;
        console.log("finished getting news data");
        console.log(news_data);
      })
  });
}

export async function updateSelectedCompanyList(updated_list) {
  selected_company_list = updated_list;
  console.log("Update selected company list: ", selected_company_list);
  return loadStocks();
}



async function loadCompanyList() {
  return Promise.all([d3.csv(company_list_path, d3.autoType)]).then(function (
    values
  ) {
    company_list = values[0];
    ticker_to_index = new Map();
    for (const [index, obj] of Object.entries(company_list)) {
      ticker_to_index.set(obj["Ticker Symbol"], parseInt(index));
    }
    console.log("Company list loaded: ", company_list);
    console.log("Ticker to index map: ", ticker_to_index);
  });
}

async function loadFundData() {
  return fetch(fund_data_path)
    .then((response) => response.json())
    .then((json) => {
      fund_data = json;
      console.log("Fund Data loaded: ", fund_data);
    });
}

async function loadStocks() {
  ticker_to_stock_data = new Map();
  return Promise.all(
    selected_company_list.map((ticker) => loadStock(ticker))
  ).then((values) => {
    for (var [index, ticker] of Object.entries(selected_company_list))
      ticker_to_stock_data.set(ticker, values[index]);

    console.log("Stock data loaded: ", ticker_to_stock_data);
  });
}

async function loadStock(ticker) {
  const from_date_str = utils.dateToStr(from_date);
  const to_date_str = utils.dateToStr(to_date);
  const from_year = from_date.getUTCFullYear();
  const to_year = to_date.getUTCFullYear();
  var year_list = [];
  for (var ii = from_year; ii <= to_year; ii++) {
    year_list.push(ii);
  }
  return Promise.all(
    year_list.map((year) => d3.csv(get_stock_data_path(ticker, year)))
  ).then((values) => {
    values[0] = values[0].slice(getIndexFromFront(values[0], from_date_str));
    values[values.length - 1] = values[values.length - 1].slice(
      0,
      getIndexFromEnd(values[values.length - 1], to_date_str)
    );
    var result = [];
    for (var value of values) result = result.concat(value);
    return result;
  });
}

function get_stock_data_path(ticker, year) {
  return "./Data/stock_data/" + ticker + "_" + year.toString() + ".csv";
}

function getIndexFromFront(values, date) {
  for (var index = 0; index < values.length; index++) {
    if (values[index]["Date"] >= date) {
      return index;
    }
  }
  return values.length - 1;
}

function getIndexFromEnd(values, date) {
  for (var index = values.length - 1; index >= 0; index--) {
    if (values[index]["Date"] <= date) return index + 1;
  }
  return 0;
}

function getNewsData(companyNames) {
  return new Promise((resolve, reject) => {
    console.log("getting data");
    var news_data = {};
    var completedRequests = 0;

    companyNames.forEach(function(companyName) {
      var filePath = '../Data/fake_news/' + companyName + '_fake_news.csv';
      var xhrCSV = new XMLHttpRequest();
      xhrCSV.open('GET', filePath);
      xhrCSV.onload = function() {
        if (xhrCSV.status === 200) {
          try {
            var parsedData = d3.csvParse(xhrCSV.responseText);
            var companyData = {};

            parsedData.forEach(function(d) {
              var date = d.Date;
              var title = d.Title;
              var views = +d['View Count'];
              companyData[date] = { title: title, views: views };
            });

            news_data[companyName] = companyData;

            completedRequests++;
            if (completedRequests === companyNames.length) {
              resolve(news_data);  
            }
          } catch (error) {
            reject(error);  
          }
        } else {
          reject(new Error("Failed to load data for company: " + companyName));
        }
      };
      xhrCSV.onerror = function() {
        reject(new Error("Network error while fetching data for company: " + companyName));
      };
      xhrCSV.send();
    });

    if (companyNames.length === 0) {
      resolve({});  
    }
  });
}

