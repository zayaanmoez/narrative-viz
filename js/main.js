let slideIndex = 0;
let scenes = [
    {
        id: 'scene1',
        title: 'Boroughs of New York Metropolitan Area',
        content: 'A visualization of the average price of listings in each borough of New York City.',
        renderChart: chartScene1
    },
    {
        id: 'scene2',
        title: 'Scene 2',
        content: 'This is the content of scene 2.',
        renderChart: chartScene2
    },
    {
        id: 'scene3',
        title: 'Scene 3',
        content: 'This is the content of scene 3.',
        renderChart: chartScene3
    },
    {
        id: 'scene4',
        title: 'Scene 4',
        content: 'This is the content of scene 4.',
        renderChart: chartScene4
    }
];

function onLoad() {
    renderScene(slideIndex);
}

function moveSlide(direction) {
    slideIndex += direction;
    renderScene(slideIndex);
}

function renderScene(index) {
    const container = document.getElementById('scene-container');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    container.innerHTML = "";
    let scene = scenes[index];

    // Create slide for current scene
    const content = document.createElement('div');
    content.classList.add('scene');
    content.id = scene.id;
    content.innerHTML = `
        <h2>${scene.title}</h2>
        <p>${scene.content}</p>
        <div class="scene-content"></div>
    `;
    container.appendChild(content);
    renderChart();

    // Enable/disable navigation buttons based on slide index
    if (slideIndex <= 0) {
        prevButton.disabled = true;
    } else {
        prevButton.disabled = false;
    }

    if (slideIndex >= scenes.length - 1) {
        nextButton.disabled = true;
    } else {
        nextButton.disabled = false;
    }
}

function renderChart() {
    scenes[slideIndex].renderChart();
}

function chartScene1() {
    const container = document.getElementById(scenes[slideIndex].id).children[2];
    const margin = {top: 50, right: 50, bottom: 100, left: 50};
    const width = container.getBoundingClientRect().width - margin.left - margin.right;
    const height = container.getBoundingClientRect().height - margin.top - margin.bottom;

    const svg = d3.select('.scene-content').
        append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    d3.csv('./data/NY-Housing-Dataset.csv').then(data => {
        data.forEach(d => {
            d.price = +d.price;
            d.beds = +d.beds;
            d.baths = +d.baths;
            d.property_sqft = +d.propertysqft;
        });

        
        // Calculate the average price by borough
        const boroughs = d3.group(data, d => d.sublocality);
        boroughs.forEach((value, key) => {
            value.forEach(d => {
                d.price_per_sqft = d.price / d.propertysqft;
            });
        });

        // Convert the map to an array of objects
        const borough_data = Array.from(boroughs, ([key, value]) => (
            {
                borough: key,
                avg_price: d3.mean(value, d => d.price).toFixed(2),
                avg_sqft: d3.mean(value, d => d.propertysqft).toFixed(2),
                avg_price_per_sqft: d3.mean(value, d => d.price_per_sqft).toFixed(2),
                avg_beds: Math.round(d3.mean(value, d => d.beds)),
                avg_baths: Math.round(d3.mean(value, d => d.bath))
            }
        ));

        var x = d3.scaleBand()
            .domain(borough_data.map(d => d.borough))
            .range([0, width])
            .padding(0.1);
        var y = d3.scaleLog()
            .domain([100000, 11000000])
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');
        svg.append('g')
            .call(d3.axisLeft(y));

        // Add labels to axis
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${-margin.left + 10}, ${height / 2}) rotate(-90)`)
            .text('Average Price');
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .text('Borough');

        svg.selectAll('rect')
            .data(borough_data)
            .enter()
            .append('rect')
            .attr('x', d => x(d.borough))
            .attr('y', d => y(d.avg_price))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.avg_price))
            .attr('fill', 'darkslategray');

        // Add tooltip to each bar
        var tooltip = d3.select('body')
            .append('div')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('padding', '5px')
            .style('border', '1px solid black')
            .style('border-radius', '5px')
            .style('opacity', 0);

        svg.selectAll('rect')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('fill', 'steelblue');
                tooltip.transition()
                    .style('opacity', 1);
                tooltip.html(`Borough: ${d.borough}
                    <br>Avg Price: $${d.avg_price}
                    <br>Avg Sqft: ${d.avg_sqft}
                    <br>Avg Price/Sqft: $${d.avg_price_per_sqft}
                    <br>Avg Beds: ${d.avg_beds}
                    <br>Avg Baths: ${d.avg_baths}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('fill', 'darkslategray');
                tooltip.transition()
                    .style('opacity', 0);
            });

        // Add annotations to chart
        const annotations = [
            {
                note: {
                    label: 'Manhattan (New York County) has the highest average price of +$10,000,000',
                    title: 'Manhattan',
                    wrap: 190
                },
                data: {borough: 'Manhattan', avg_price: 10000000, avg_sqft: 4574},
                x: x('New York County') + x.bandwidth(),
                y: y(1000000),
                dy: -100,
                dx: x.bandwidth() * 1.75
            },
            {
                note: {
                    label: 'East Bronx has the lowest average price of $265,000 but also some of the lowest average square footage and avg # of bedrooms',
                    title: 'East Bronx',
                    wrap: 190
                },
                data: {borough: 'East Bronx', avg_price: 265000, avg_sqft: 750},
                x: x('East Bronx') + x.bandwidth() / 2,
                y: y(265000),
                dy: -100,
                dx: x.bandwidth() * 1.75
            },
            {
                note: {
                    label: 'Dumbo has the highest average price per square foot of $2322 surpassing Manhattan',
                    title: 'Dumbo',
                    wrap: 190
                },
                data: {borough: 'Dumbo', avg_price: 400000, avg_sqft: 2000},
                x: x('Dumbo'),
                y: y(1000000),
                dy: -80,
                dx: -x.bandwidth() * 1.75
            }
        ];

        const makeAnnotations = d3.annotation()
            .type(d3.annotationLabel)
            .annotations(annotations)
            .type(d3.annotationCallout);

        svg.append('g')
            .attr('class', 'annotation-group')
            .call(makeAnnotations);


    });
}

function chartScene2() {

}

function chartScene3() {

}

function chartScene4() {
    
}