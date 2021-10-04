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
    vizWidth = parseInt(vizBlock.style('width')), vizHeight = parseInt(vizBlock.style('height'));
let mapLayer, vizLayer;
let projection, path, colors;
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

        //Dejamos los datos incluidos en los polígonos de los mapas
        ccaaMap.features.forEach(function(item) {
            let dato = ccaaData.filter(function(subItem) {
                if(parseInt(subItem.id) == parseInt(item.id)) {
                    return subItem;
                };
            });
            item.data = dato[0];
        });

        provMap.features.forEach(function(item) {
            let dato = provData.filter(function(subItem) {
                if(parseInt(subItem.id) == parseInt(item.properties.cod_prov)) {
                    return subItem;
                };
            });
            item.data = dato[0];
        });

        //Uso de colores
        colors = d3.scaleLinear()
            .domain([0,25,50,75])
            .range(['#a7e7e7', '#68a7a7', '#2b6b6c', '#003334']);

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
    projection = d3_composite.geoConicConformalSpain().scale(1800).fitSize([mapWidth,mapHeight], ccaaMap);
    path = d3.geoPath(projection);

    mapLayer.selectAll("poligonos")
        .data(ccaaMap.features)
        .enter()
        .append("path")
        .attr("class", "poligonos")
        .style('fill', function(d) {
            return colors(+d.data.porc_concertadas);
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        .on('mousemove mouseover', function(d,i,e){
            //Línea diferencial y cambio del polígonos
            let current = this;
            
            document.getElementsByTagName('svg')[0].removeChild(this);
            document.getElementsByTagName('svg')[0].appendChild(current);

            current.style.stroke = '#000';
            current.style.strokeWidth = '1px';

            //Elemento HTML > Tooltip (mostrar nombre de provincia, año y tasas para más de 100 años)
            let html = '<p class="chart__tooltip--title">' + d.data.lugar + '<p class="chart__tooltip--text">' + 
            '% de plazas concertadas: ' + numberWithCommas(d.data.porc_concertadas) + '%</p>';

            tooltip.html(html);

            //Tooltip
            getInTooltip(tooltip);                
            positionTooltip(window.event, tooltip);

            //Jugar con las líneas
            d3.selectAll('.linea')
                .style('opacity', 0.5);

            d3.selectAll('.texto')
                .style('opacity', 0.5);


        })
        .on('mouseout', function(d,i,e) {
            //Línea diferencial
            this.style.stroke = '#282828';
            this.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);

            //Jugar con las líneas
            d3.selectAll('.linea')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 1);
        });

    mapLayer.append('path')
        .style('fill', 'none')
        .style('stroke', '#000')
        .attr('d', projection.getCompositionBorders());
}

function setMap(type) {
    let auxData = [];

    if (type == 'ccaa') {
        auxData = ccaaMap;
    } else {
        auxData = provMap;
    }

    mapLayer.selectAll(".poligonos")
        .remove();

    mapLayer.selectAll("poligonos")
        .data(auxData.features)
        .enter()
        .append("path")
        .attr("class", "poligonos")
        .style('fill', function(d) {
            return colors(+d.data.porc_concertadas);
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        .on('mousemove mouseover', function(d,i,e){
            //Línea diferencial y cambio del polígonos
            let current = this;
            
            document.getElementsByTagName('svg')[0].removeChild(this);
            document.getElementsByTagName('svg')[0].appendChild(current);

            current.style.stroke = '#000';
            current.style.strokeWidth = '1px';

            //Elemento HTML > Tooltip (mostrar nombre de provincia, año y tasas para más de 100 años)
            let html = '<p class="chart__tooltip--title">' + d.data.lugar + '<p class="chart__tooltip--text">' + 
            '% de plazas concertadas: ' + numberWithCommas(d.data.porc_concertadas) + '%</p>';

            tooltip.html(html);

            //Tooltip
            getInTooltip(tooltip);                
            positionTooltip(window.event, tooltip);
        })
        .on('mouseout', function(d,i,e) {
            //Línea diferencial
            this.style.stroke = '#282828';
            this.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip); 
        });
}

//LÍNEA
function initViz() {
    vizLayer = vizBlock
        .append('svg')
        .attr('width', vizWidth)
        .attr('height', vizHeight)
        .append('g');

    //Creación de la línea vertical
    vizLayer.selectAll('linea-vertical')
        .data([0])
        .enter()
        .append('rect')
        .attr('class', 'linea-vertical')
        .attr('width', 2)
        .attr('height', vizHeight)
        .style('fill', '#cecece')
        .attr('x', (vizWidth / 2));

    //Generación de datos en el grupo
    vizLayer.selectAll('lineas')
        .data(ccaaData)
        .enter()
        .append('rect')
        .attr('class', 'linea')
        .attr('data-lugar', function(d) { return d.lugar; })
        .attr('width', 30)
        .attr('height', 2)
        .style('fill', function(d) { return colors(+d.porc_concertadas); })
        .attr('x', (vizWidth / 2) - 15)
        .attr('y', function(d) { return vizHeight - (+d.porc_concertadas * vizHeight / 100); });

    //Generación de letras
    vizLayer.selectAll('texto')
        .data(ccaaData)
        .enter()
        .append('text')
        .style('font-size', 12)
        .text('PR')
        .attr('class', 'texto')
        .attr('data-lugar', function(d) { return d.lugar; })
        .attr('x', 80)
        .attr('y', function(d) { return vizHeight - (+d.porc_concertadas * vizHeight / 100) + 5; });
}

function setViz(type) {
    let auxData = [];

    if(type == 'ccaa') {
        auxData = ccaaData;
    } else {
        auxData = provData;
    }

    vizLayer.selectAll('.linea')
        .remove();

    vizLayer.selectAll('.texto')
        .remove();

    //Generación de datos en el grupo
    vizLayer.selectAll('lineas')
        .data(auxData)
        .enter()
        .append('rect')
        .attr('class', 'linea')
        .attr('data-lugar', function(d) { return d.lugar; })
        .attr('width', 30)
        .attr('height', 1.25)
        .style('fill', function(d) { return colors(+d.porc_concertadas); })
        .attr('x', (vizWidth / 2) - 15)
        .attr('y', function(d) { return vizHeight - (+d.porc_concertadas * vizHeight / 100); });

    //Generación de letras
    vizLayer.selectAll('texto')
        .data(auxData)
        .enter()
        .append('text')
        .style('font-size', 12)
        .text('PR')
        .attr('class', 'texto')
        .attr('data-lugar', function(d) { return d.lugar; })
        .attr('x', 80)
        .attr('y', function(d) { return vizHeight - (+d.porc_concertadas * vizHeight / 100) + 5; });
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
        setDashboard(this.getAttribute('data-type'));
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