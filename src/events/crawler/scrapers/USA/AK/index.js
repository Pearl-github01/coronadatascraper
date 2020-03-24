import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AK',
  country: 'USA',
  url: 'http://dhss.alaska.gov/dph/Epi/id/Pages/COVID-19/monitoring.aspx',
  type: 'table',
  headless: false,
  aggregate: 'county',

  _regions: {
    Anchorage: ['Anchorage County, AK'],
    'Gulf Coast': ['Valdez-Cordova County, AK', 'Kodiak Island County, AK', 'Kenai Peninsula County, AK'],
    Interior: [
      'Denali County, AK',
      'Yukon-Koyukuk County, AK',
      'Southeast Fairbanks County, AK',
      'Fairbanks North Star County, AK'
    ],
    'Mat-Su': ['Matanuska-Susitna County, AK'],
    Northern: ['Northwest Arctic County, AK', 'Nome County, AK', 'North Slope County, AK'],
    Southeast: [
      'Yakutat County, AK',
      'Skagway County, AK',
      'Hoonah-Angoon County, AK',
      'Wrangell County, AK',
      'Haines County, AK',
      'Petersburg County, AK',
      'Prince of Wales-Hyder County, AK',
      'Sitka County, AK',
      'Ketchikan Gateway County, AK',
      'Juneau County, AK'
    ],
    Southwest: [
      'Bristol Bay County, AK',
      'Lake and Peninsula County, AK',
      'Aleutians East County, AK',
      'Dillingham County, AK',
      'Aleutians West County, AK',
      'Wade Hampton County, AK', // aka 'Kusilvak County, AK',
      'Bethel County, AK'
    ]
  },
  _populations: {
    Anchorage: 294356,
    'Mat-Su': 107610,
    'Gulf Coast': 80866,
    Interior: 109847,
    Northern: 27432,
    Southeast: 72373,
    Southwest: 42206
  },

  async scraper() {
    const counties = [];
    const $ = await fetch.page(this.url);
    const $table = $('th:contains("Region")').closest('table');
    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const cases = parse.number($tr.find('td:last-child').text());
      const region = parse.string($tr.find('> *:first-child').text());

      if (index < 1 || region === 'TOTAL') {
        return;
      }

      const county = `${region} Economic Region`;
      const population = this._populations[region];
      const countyObj = {
        county,
        cases,
        population
      };

      const subCounties = this._regions[region];
      countyObj.feature = geography.generateMultiCountyFeature(subCounties, {
        state: 'AK',
        country: 'USA'
      });

      counties.push(countyObj);
    });

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;