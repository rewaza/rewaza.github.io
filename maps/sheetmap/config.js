'use strict';

// eslint-disable-next-line no-unused-vars

const config = {
  style: 'mapbox://styles/mapbox/streets-v11',
  accessToken:
    'pk.eyJ1IjoibWFwYm94LWNvbW11bml0eSIsImEiOiJja2Q3cXQ0cGUyMm95MnRudXdyYXhhcDR1In0.JNiOY6eSfuV0kqWX-beDNg',
  //CSV:  'https://docs.google.com/spreadsheets/d/1zVmQgOUZgEJn_TxMEfcXe66gXjklZNAUiepql-bZCV0/gviz/tq?tqx=out:csv&encoding=utf-8&sheet=fx',
  CSV:  'https://docs.google.com/spreadsheets/d/1zVmQgOUZgEJn_TxMEfcXe66gXjklZNAUiepql-bZCV0/export?format=csv&gid=1086470467&encoding=utf-8-sig',
  center: [4.8320114, 45.7578137],
  zoom: 2,
  title: "Revaz's Map App",
  description:
    'Please click "show filters" button to filter entities.',
  sideBarInfo: ['Country_', 'City_', 'Criteria_1', 'Criteria_2', 'Criteria_3', 'Criteria_4', 'Criteria_1fxs', 'Criteria_2fxs', 'Criteria_3fxs', 'Criteria_4fxs'],
  popupInfo: ['City_'],
};

//1zVmQgOUZgEJn_TxMEfcXe66gXjklZNAUiepql-bZCV0/edit#gid=1086470467