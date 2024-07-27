let slideIndex = 0;
let scenes = [
    {
        id: 'scene1',
        title: 'Boroughs of New York Metropolitan Area',
        content: 'Overview of the average price of listings in each borough of New York City.',
        renderChart: chartScene1
    },
    {
        id: 'scene2',
        title: 'Price and Square Footage across Boroughs',
        content: 'A deeper look at trends in price and square footage across the boroughs of New York City.',
        renderChart: chartScene2
    },
    {
        id: 'scene3',
        title: 'Property Types in New York Metropolitan Area',
        content: 'Exploring the different types of properties available in the New York Metropolitan Area.',
        renderChart: chartScene3
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
        <h3>${scene.title}</h3>
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
            .attr('style', 'z-index: 100')
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
    const container = document.getElementById(scenes[slideIndex].id).children[2];
    const margin = {top: 100, right: 50, bottom: 100, left: 50};
    const width = container.getBoundingClientRect().width - margin.left - margin.right;
    const height = container.getBoundingClientRect().height - margin.top - margin.bottom;

    // Make a dropdown for selecting boroughs mutli select
    const select = d3.select('.scene-content').
        append('select')
        .attr('id', 'borough-select');

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
            d.type = d.type.replace(' for sale', '');
        });
        
        // List of boroughs
        var boroughList = [...new Set(data.map(d => d.sublocality))];
        var selectedBroughs = boroughList;
        var dataFiltered = data.filter(d => (selectedBroughs.includes(d.sublocality) || selectedBroughs.includes(d.street_name)));

        // Create dropdown for selecting boroughs with select all option
        select.selectAll('option')
            .data(['All'].concat(boroughList))
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        select.on('change', function() {
            selectedBroughs = this.value === 'All' ? boroughList : [this.value];
            dataFiltered = data.filter(d => (selectedBroughs.includes(d.sublocality) || selectedBroughs.includes(d.street_name)));
            renderScene2SVG(dataFiltered, width, height, margin, svg);
        });

        renderScene2SVG(dataFiltered, width, height, margin, svg);
    });
}

function renderScene2SVG(dataFiltered, width, height, margin, svg) {
    svg.selectAll('*').remove();
    var x = d3.scaleLog()
        .domain([d3.min(dataFiltered, d => d.property_sqft), d3.max(dataFiltered, d => d.property_sqft)])
        .range([0, width]);
    var y = d3.scaleLog()
        .domain([d3.min(dataFiltered, d => d.price), d3.max(dataFiltered, d => d.price)])
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
        .text('Property Price');
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 50})`)
        .text('Square Footage');

    svg.selectAll('circle')
        .data(dataFiltered)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.property_sqft))
        .attr('cy', d => y(d.price))
        .attr('r', 3)
        .attr('style', 'z-index: 100')
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

    svg.selectAll('circle')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('fill', 'steelblue');
            tooltip.transition()
                .style('opacity', 1);
            tooltip.html(`Borough: ${d.sublocality}
                <br>Price: $${d.price}
                <br>Sqft: ${d.property_sqft}
                <br>Beds: ${d.beds}
                <br>Baths: ${d.bath}
                <br>Type: ${d.type}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .attr('fill', 'darkslategray');
            tooltip.transition()
                .style('opacity', 0);
        });

    // Find the most popular square footage to 4 significant figures
    const sqft = d3.group(dataFiltered, d => Math.round(d.property_sqft));
    const countSqft = Array.from(sqft, ([key, value]) => ({sqft: key, count: value.length}));
    const pSqftValue = d3.max(countSqft, d => d.count);
    const pSqftData = countSqft.find(d => d.count === pSqftValue);
    var selectedBorough = document.getElementById('borough-select').value === 'All' ? 'New York Metropolitan Area' : document.getElementById('borough-select').value;

    // Find the y range for values with pSqftData.sqft
    var values = dataFiltered.filter(d => Math.round(d.property_sqft) === pSqftData.sqft);
    var yMin = d3.min(values, d => parseInt(d.price));
    var yMax = d3.max(values, d => parseInt(d.price));
    
    // Add annotations to chart
    const annotations = [
        {
            note: {
                label: `${pSqftData.sqft} sqft is the most common property size in the ${selectedBorough} with ${pSqftData.count} listings`,
                title: 'Common Property Size',
                wrap: 400
            },
            data: {sqft: pSqftData.sqft, count: pSqftData.count},
            x: x(pSqftData.sqft) - 10,
            y: y(yMin) + 10,
            dy: y(yMax) - y(yMin) - 30,
            dx: 70,
            subject: {
                width: 20,
                height: y(yMax) - y(yMin) - 20
            },
        }
    ];

    const makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotations)
        .type(d3.annotationCalloutRect);

    svg.append('g')
        .attr('class', 'annotation-group')
        .call(makeAnnotations);
}

function chartScene3() {
    const container = document.getElementById(scenes[slideIndex].id).children[2];
    const margin = {top: 100, right: 50, bottom: 100, left: 50};
    const width = container.getBoundingClientRect().width - margin.left - margin.right;
    const height = container.getBoundingClientRect().height - margin.top - margin.bottom;

    // Make a dropdown for selecting boroughs mutli select
    const select = d3.select('.scene-content').
        append('select')
        .attr('id', 'borough-select');

    const svg = d3.select('.scene-content').
        append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    d3.csv('./data/NY-Housing-Dataset.csv').then(data => {
        data.forEach(d => {
            d.price = parseFloat(d.price);
            d.beds = parseInt(d.beds);
            d.baths = parseInt(d.baths);
            d.propertysqft = parseFloat(d.propertysqft);
            d.price_per_sqft = parseFloat(d.price / d.propertysqft);
            d.type = d.type.replace(' for sale', '');
        });
        
        // List of boroughs
        var boroughList = [...new Set(data.map(d => d.sublocality))];
        var selectedBroughs = boroughList;
        var dataFiltered = data.filter(d => (selectedBroughs.includes(d.sublocality) || selectedBroughs.includes(d.street_name)));

        // Create dropdown for selecting boroughs with select all option
        select.selectAll('option')
            .data(['All'].concat(boroughList))
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        select.on('change', function() {
            selectedBroughs = this.value === 'All' ? boroughList : [this.value];
            dataFiltered = data.filter(d => (selectedBroughs.includes(d.sublocality) || selectedBroughs.includes(d.street_name)));
            renderScene3SVG(dataFiltered, width, height, margin, svg);
        });

        renderScene3SVG(dataFiltered, width, height, margin, svg);
    });
}

function renderScene3SVG(dataFiltered, width, height, margin, svg) {
    svg.selectAll('*').remove();
    // List of property types
    var propertyTypes = [...new Set(dataFiltered.map(d => d.type))];

    // Type data
    var propertyTypeData = d3.group(dataFiltered, d => d.type);
    var propertyTypeData = Array.from(propertyTypeData, ([key, value]) => (
        {
            type: key,
            avg_price: d3.mean(value, d => d.price).toFixed(2),
            avg_sqft: d3.mean(value, d => d.propertysqft).toFixed(2),
            avg_price_per_sqft: d3.mean(value, d => d.price_per_sqft).toFixed(2),
            avg_beds: Math.round(d3.mean(value, d => d.beds)),
            avg_baths: Math.round(d3.mean(value, d => d.bath)),
            count: value.length
        }
    ));

    var x = d3.scaleBand()
        .domain(propertyTypeData.map(d => d.type))
        .range([0, width])
        .padding(0.1);
    var y = d3.scaleLog()
        .domain([100000, 15000000])
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
        .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 25})`)
        .text('Property Type');

    svg.selectAll('rect')
        .data(propertyTypeData)
        .enter()
        .append('rect')
        .attr('x', d => x(d.type))
        .attr('y', d => y(d.avg_price))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.avg_price))
        .attr('style', 'z-index: 100')
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
            tooltip.html(`Avg Price: $${d.avg_price}
                <br>Avg Sqft: ${d.avg_sqft}
                <br>Avg Price/Sqft: $${d.avg_price_per_sqft}
                <br>Avg Beds: ${d.avg_beds}
                <br>Avg Baths: ${d.avg_baths}
                <br>Count: ${d.count}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .attr('fill', 'darkslategray');
            tooltip.transition()
                .style('opacity', 0);
        });

    var maxPrice = d3.max(propertyTypeData, d => parseFloat(d.avg_price));
    var maxPriceType = propertyTypeData.find(d => parseFloat(d.avg_price) === maxPrice);
    var selectedBorough = document.getElementById('borough-select').value === 'All' ? 'New York Metropolitan Area' : document.getElementById('borough-select').value;


    // Add annotations to chart
    const annotations = [
        {
            note: {
                label: `${maxPriceType.type} has the highest average price of $${parseInt(maxPriceType.avg_price)} in the ${selectedBorough}`,
                wrap: 300
            },
            data: {type: maxPriceType.type, avg_price: maxPriceType.avg_price, avg_sqft: maxPriceType.avg_sqft},
            x: x(maxPriceType.type) + x.bandwidth() / 2,
            y: y(maxPrice),
            dy: -30,
            dx: 0,
        },
    ];

    const makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotations)
        .type(d3.annotationCallout);

    svg.append('g')
        .attr('class', 'annotation-group')
        .call(makeAnnotations);
}
