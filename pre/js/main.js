import { getIframeParams } from './helpers/height';
import { setChartCanvas, setChartCanvasImage } from './helpers/canvas-image';
import { setRRSSLinks } from './helpers/rrss';
import { getInTooltip, getOutTooltip, positionTooltip } from './helpers/tooltip';
import { numberWithCommas } from './helpers/helpers';
import './helpers/tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';
import * as topojson from "topojson-client";
let d3_composite = require("d3-composite-projections");

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

/////
///// VISUALIZACIÓN DEL GRÁFICO /////
/////
let mapBlock = d3.select('#mapa'), vizBlock = d3.select('#viz');
let mapWidth = parseInt(mapBlock.style('width')), mapHeight = parseInt(mapBlock.style('height')),
    vizWidth = parseInt(vizBlock.style('width')), vizHeight = parseInt(mapBlock.style('height'));
let mapLayer, vizLayer;
let projection, path;
let ccaaData = [], provData = [], ccaaMap, provMap;
let tooltip = d3.select('#tooltip');

/////EJECUCIÓN INICIAL DEL DASHBOARD
const csv = d3.dsvFormat(",");

d3.queue()
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/ccaa_plazas_con_respuesta.csv')
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/prov_plazas_con_respuesta.csv')
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/ccaa.json')
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/provincias.json')
    .await(function(error, ccaa, prov, ccaaPol, provPol) {
        if (error) throw error;

        ccaaData = csv.parse(ccaa);
        provData = csv.parse(prov);

        ccaaMap = topojson.feature(ccaaPol, ccaaPol.objects['ccaa']);
        provMap = topojson.feature(provPol, provPol.objects['provincias']);

        console.log(ccaaMap);

        //Dejamos los datos incluidos en los polígonos de los mapas
        ccaaMap.features.forEach(function(item) {
            let dato = ccaaData.filter(function(subItem) {
                if(parseInt(subItem.id) == parseInt(item.cartodb_id)) {
                    return subItem;
                };
            });
            item.data = dato[0];
        });

        provMap.features.forEach(function(item) {
            let dato = ccaaData.filter(function(subItem) {
                if(parseInt(subItem.id) == parseInt(item.cod_prov)) {
                    return subItem;
                };
            });
            item.data = dato[0];
        });

        initDashboard();

    });

function initDashboard() {
    initMap();
    initViz();

    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

//MAPA
function initMap() { //Valores por defecto CCAA
    mapLayer = mapBlock.append('svg').attr('id', 'map').attr('width', mapWidth).attr('height', mapHeight);
    projection = d3_composite.geoConicConformalSpain().scale(2000).fitSize([mapWidth,mapHeight], ccaaMap);
    path = d3.geoPath(projection);

    let colors = d3.scaleLinear()
        .domain([0,3,6,9])
        .range(['#a7e7e7', '#68a7a7', '#2b6b6c', '#003334']);

    mapLayer.selectAll(".provincias")
        .data(ccaaMap.features)
        .enter()
        .append("path")
        .attr("class", "provincias")
        .style('fill', function(d) {
            return colors(d.properties.tasa_total);
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        // .on('mousemove mouseover', function(d,i,e){
        //     //Línea diferencial y cambio del polígonos
        //     let currentProv = this;
            
        //     document.getElementsByTagName('svg')[0].removeChild(this);
        //     document.getElementsByTagName('svg')[0].appendChild(currentProv);

        //     currentProv.style.stroke = '#000';
        //     currentProv.style.strokeWidth = '1px';

        //     //Elemento HTML > Tooltip (mostrar nombre de provincia, año y tasas para más de 100 años)
        //     let html = '<p class="chart__tooltip--title">' + d.properties.name + '<p class="chart__tooltip--text">Tasa general (100 años o más): ' + numberWithCommas(d.properties.tasa_total.toFixed(2)) + '</p>' + 
        //     '<p class="chart__tooltip--text">Tasa en mujeres (100 años o más): ' + numberWithCommas(d.properties.tasa_mujeres.toFixed(2)) + '</p>' + 
        //     '<p class="chart__tooltip--text">Tasa en hombres (100 años o más): ' + numberWithCommas(d.properties.tasa_hombres.toFixed(2)) + '</p>';

        //     tooltip.html(html);

        //     //Tooltip
        //     getInTooltip(tooltip);                
        //     positionTooltip(window.event, tooltip);
        // })
        // .on('mouseout', function(d,i,e) {
        //     //Línea diferencial
        //     this.style.stroke = '#282828';
        //     this.style.strokeWidth = '0.25px';

        //     //Desaparición del tooltip
        //     getOutTooltip(tooltip); 
        // });

    mapLayer.append('path')
        .style('fill', 'none')
        .style('stroke', '#000')
        .attr('d', projection.getCompositionBorders());
}

function setMap(type) {

}

//LÍNEA
function initViz() { //Valores por defecto CCAA

}

function setViz(type) {

}

//SETEO DEL DASHBOARD
let btnChart = document.getElementsByClassName('btn__chart');

for(let i = 0; i < btnChart.length; i++) {
    btnChart[i].addEventListener('click', function() {
        //Cambiamos estilos del botón
        for(let i = 0; i < btnChart.length; i++) {
            btnChart[i].classList.remove('active');
        }
        this.classList.add('active');
        //Cambiamos el dashboard
        setDashboard(this.id);
    })
}

function setDashboard(type) {
    setMap(type);
    setViz(type);

    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});