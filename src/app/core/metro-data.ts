/**
 * Hyderabad Metro network — generated from OpenStreetMap (© OpenStreetMap contributors, ODbL) by a build script.
 * km = distance along the track from the first station of the line (approximate, ±0.2 km).
 */
export interface MetroStation {
  name: string;
  km: number;
  lat: number;
  lon: number;
}
export interface MetroLine {
  id: 'red' | 'blue' | 'green';
  name: string;
  color: string;
  stations: MetroStation[];
}

export const METRO_LINES: MetroLine[] = [
  {
    id: 'red',
    name: 'Red Line',
    color: '#dc2626',
    stations: [
      {
        name: 'Miyapur',
        km: 0,
        lat: 17.49656,
        lon: 78.37303
      },
      {
        name: 'JNTU College',
        km: 1.75,
        lat: 17.49867,
        lon: 78.38887
      },
      {
        name: 'KPHB Colony',
        km: 3.24,
        lat: 17.49382,
        lon: 78.40178
      },
      {
        name: 'Kukatpally',
        km: 4.73,
        lat: 17.48493,
        lon: 78.41178
      },
      {
        name: 'Balanagar',
        km: 6.16,
        lat: 17.47676,
        lon: 78.4221
      },
      {
        name: 'Moosapet',
        km: 6.86,
        lat: 17.47189,
        lon: 78.42612
      },
      {
        name: 'Bharat Nagar',
        km: 7.83,
        lat: 17.46404,
        lon: 78.43009
      },
      {
        name: 'Erragadda',
        km: 8.69,
        lat: 17.45707,
        lon: 78.43359
      },
      {
        name: 'ESI Hospital',
        km: 9.93,
        lat: 17.44702,
        lon: 78.43857
      },
      {
        name: 'S. R. Nagar',
        km: 10.61,
        lat: 17.44171,
        lon: 78.44163
      },
      {
        name: 'Ameerpet',
        km: 11.37,
        lat: 17.4355,
        lon: 78.44473
      },
      {
        name: 'Panjagutta',
        km: 12.43,
        lat: 17.42845,
        lon: 78.45131
      },
      {
        name: 'Irrum Manzil',
        km: 13.49,
        lat: 17.42023,
        lon: 78.45635
      },
      {
        name: 'Khairatabad',
        km: 14.65,
        lat: 17.41116,
        lon: 78.46095
      },
      {
        name: 'Lakdi-ka-pul',
        km: 15.75,
        lat: 17.40364,
        lon: 78.46532
      },
      {
        name: 'Assembly',
        km: 16.72,
        lat: 17.39799,
        lon: 78.47088
      },
      {
        name: 'Nampally',
        km: 17.38,
        lat: 17.39222,
        lon: 78.47016
      },
      {
        name: 'Gandhi Bhavan',
        km: 18.2,
        lat: 17.38583,
        lon: 78.47333
      },
      {
        name: 'Osmania Medical College',
        km: 19.21,
        lat: 17.38212,
        lon: 78.48161
      },
      {
        name: 'Mahatma Gandhi Bus Station',
        km: 19.78,
        lat: 17.37981,
        lon: 78.48621
      },
      {
        name: 'Malakpet',
        km: 20.69,
        lat: 17.37721,
        lon: 78.4939
      },
      {
        name: 'New Market',
        km: 21.8,
        lat: 17.37345,
        lon: 78.50318
      },
      {
        name: 'Musarambagh',
        km: 22.78,
        lat: 17.37109,
        lon: 78.51195
      },
      {
        name: 'Dilsukh Nagar',
        km: 24.29,
        lat: 17.36856,
        lon: 78.52572
      },
      {
        name: 'Chaitanyapuri',
        km: 25.4,
        lat: 17.36831,
        lon: 78.53619
      },
      {
        name: 'Victoria Memorial',
        km: 26.6,
        lat: 17.36186,
        lon: 78.54396
      },
      {
        name: 'L. B. Nagar',
        km: 28.02,
        lat: 17.34985,
        lon: 78.54794
      }
    ]
  },
  {
    id: 'blue',
    name: 'Blue Line',
    color: '#2563eb',
    stations: [
      {
        name: 'Nagole',
        km: 0,
        lat: 17.391,
        lon: 78.55882
      },
      {
        name: 'Uppal',
        km: 1.02,
        lat: 17.40006,
        lon: 78.56021
      },
      {
        name: 'Stadium',
        km: 2.1,
        lat: 17.40738,
        lon: 78.55423
      },
      {
        name: 'NGRI',
        km: 3.28,
        lat: 17.4148,
        lon: 78.54631
      },
      {
        name: 'Habsiguda',
        km: 4.13,
        lat: 17.42016,
        lon: 78.54053
      },
      {
        name: 'Tarnaka',
        km: 5.74,
        lat: 17.42827,
        lon: 78.52843
      },
      {
        name: 'Mettuguda',
        km: 6.99,
        lat: 17.4355,
        lon: 78.51956
      },
      {
        name: 'Secunderabad East',
        km: 8.82,
        lat: 17.43571,
        lon: 78.50543
      },
      {
        name: 'Parade Grounds',
        km: 10.4,
        lat: 17.44317,
        lon: 78.49747
      },
      {
        name: 'Paradise',
        km: 11.59,
        lat: 17.44344,
        lon: 78.48624
      },
      {
        name: 'Rasoolpura',
        km: 12.64,
        lat: 17.44359,
        lon: 78.47641
      },
      {
        name: 'Prakash Nagar',
        km: 13.77,
        lat: 17.44487,
        lon: 78.46587
      },
      {
        name: 'Begumpet',
        km: 15.19,
        lat: 17.43756,
        lon: 78.45696
      },
      {
        name: 'Ameerpet',
        km: 16.75,
        lat: 17.43533,
        lon: 78.4446
      },
      {
        name: 'Madhura Nagar',
        km: 17.47,
        lat: 17.43695,
        lon: 78.43911
      },
      {
        name: 'Yusufguda',
        km: 18.87,
        lat: 17.43511,
        lon: 78.42734
      },
      {
        name: 'Road No 5 Jubilee Hills',
        km: 19.71,
        lat: 17.43003,
        lon: 78.4232
      },
      {
        name: 'Jubilee Hills Checkpost',
        km: 20.96,
        lat: 17.42821,
        lon: 78.41368
      },
      {
        name: 'Peddamma Gudi',
        km: 21.64,
        lat: 17.43064,
        lon: 78.40836
      },
      {
        name: 'Madhapur',
        km: 22.8,
        lat: 17.43725,
        lon: 78.40041
      },
      {
        name: 'Durgam Cheruvu',
        km: 24.42,
        lat: 17.4429,
        lon: 78.38756
      },
      {
        name: 'HITEC City',
        km: 25.25,
        lat: 17.44899,
        lon: 78.38312
      },
      {
        name: 'Raidurg',
        km: 26.74,
        lat: 17.44218,
        lon: 78.3772
      }
    ]
  },
  {
    id: 'green',
    name: 'Green Line',
    color: '#16a34a',
    stations: [
      {
        name: 'JBS',
        km: 0,
        lat: 17.44881,
        lon: 78.49652
      },
      {
        name: 'Parade Grounds',
        km: 0.53,
        lat: 17.44452,
        lon: 78.49762
      },
      {
        name: 'Secunderabad West',
        km: 1.85,
        lat: 17.43378,
        lon: 78.49953
      },
      {
        name: 'Gandhi Hospital',
        km: 3.11,
        lat: 17.42552,
        lon: 78.50192
      },
      {
        name: 'Musheerabad',
        km: 4.02,
        lat: 17.41786,
        lon: 78.49953
      },
      {
        name: 'RTC Cross Roads',
        km: 5.29,
        lat: 17.40702,
        lon: 78.49683
      },
      {
        name: 'Chikkadpally',
        km: 6.06,
        lat: 17.40036,
        lon: 78.49492
      },
      {
        name: 'Narayanaguda',
        km: 6.93,
        lat: 17.39436,
        lon: 78.48998
      },
      {
        name: 'Sultan Bazar',
        km: 8.24,
        lat: 17.38443,
        lon: 78.48405
      },
      {
        name: 'Mahatma Gandhi Bus Station',
        km: 9.02,
        lat: 17.37961,
        lon: 78.48586
      }
    ]
  }
];
