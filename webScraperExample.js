import request from "request";
import { parseData } from "./parser.js";
import { Company } from "../config/cockroachDB/index.js";
import { URL } from "../config/urlList.js"

export const fetchData = (options) => {
  return new Promise(function (resolve, reject) {
    request(options, (err, response, body) => {
      if (err) return reject(err);
      try {
        // JSON.parse() can throw an exception if not valid JSON
        let data = JSON.parse(body);
        resolve({
          place: options.form.WO,
          category: options.form.WAS,
          total: data.gesamtanzahlTreffer,
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};

export const fetchDataandStoreinDB = (options, dbNum) => {
  return new Promise(function (resolve, reject) {
    request(options, async (err, response, body) => {
      if (err) return reject(err);
      try {
        // JSON.parse() can throw an exception if not valid JSON
        let data = JSON.parse(body);
        let parsedData = parseData(data, options.form.WO, options.form.WAS);
        /*        for (const element of parsedData) {
          await Company(dbNum).findOrCreate({
            where: { link: element.link },
            defaults: element,
          });
        }*/
        Company(dbNum).bulkCreate(parsedData);
        resolve({
          data: [],
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};

export const getRequestOptions = (category, places, position) => {
  return places.map((place) =>
    prepareRequestOptions(category, place, position)
  );
};

export const getRequestPagingOptions = (data) => {
  return data
    .map((el) => prepareRequestPagingOptions(el.category, el.place, el.total))
    .flat();
};

const prepareRequestOptions = (category, place, position) => {
  let options = {
    url: REQUEST_PARAMETERS.URL,
    method: REQUEST_PARAMETERS.METHOD,
    headers: Object.assign({}, REQUEST_PARAMETERS.HEADERS),
    form: Object.assign({}, REQUEST_PARAMETERS.FOORM_DATA),
  };

  options.form.WAS = category;
  options.form.WO = place;
  options.form.position = position;

  return options;
};

const prepareRequestPagingOptions = (category, place, numberOfTotalItems) => {
  let items = [];
  const chunks = Math.ceil(numberOfTotalItems / 10);
  for (let i = 0; i < chunks; i++) {
    items.push(prepareRequestOptions(category, place, i * 10));
  }
  return items;
};

const REQUEST_PARAMETERS = {
  URL: URL,
  METHOD: "POST",
  HEADERS: {
    "Content-Type":
      "multipart/form-data; boundary=----WebKitFormBoundaryTHgNo8rgyETPRfSx",
    "X-MicrosoftAjax": "Delta=true",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36",
  },
  FOORM_DATA: {
    umkreis: "-1",
    WAS: "",
    WO: "",
    position: "",
    anzahl: "10",
    sortierung: "relevanz",
  },
};
