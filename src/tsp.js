function calculateDistance(distanceMatrix, order) {
    // calculates the distance between the cities in the order given
    let dist = 0;
    for (let i = 0; i < order.length - 1; i++) {
        const point1 = order[i];
        const point2 = order[i + 1];
        dist += distanceMatrix[point1][point2];
    }
    return dist;
}

function swap(arr, i, j) {
    // swaps the elements in the array at indices i and j
    [arr[i], arr[j]] = [arr[j], arr[i]];
}

// The following are the functions used in the genetic algorithm
function createPopulation(population, P_SIZE, order, fitness) {
    // creates the initial population
    for (let i = 0; i < P_SIZE; i++) {
        let new_order = shuffleArray(order.slice());
        population.push(new_order.slice());
        fitness.push(1.0);
    }
}

// function to normalize the fitness of each individual in the population
function normalizeFitness(fitness, P_SIZE) {
    let sm = fitness.reduce((sum, val) => sum + val, 0);
    for (let i = 0; i < P_SIZE; i++) {
        fitness[i] /= sm;
    }
}

// function to calculate the fitness of each individual in the population
function calculateFitness(cities, population, fitness) {
    for (let i = 0; i < population.length; i++) {
        let order = population[i];
        let d = calculateDistance(cities, order);
        fitness[i] = 1 / (1 + d);
    }
}

function pickOne(population, prob) {
    // picks one individual from the population based on the probability
    let index = 0;
    let r = Math.random();
    population = shuffle(population);
    while (r > 0) {
        r -= prob[index];
        index++;
    }
    index--;
    return population[index].slice();
}

function mutate(cities, order, P_SIZE, iters, mutation_rate = 1, is_best = false) {
    // mutates the order of the cities in the order array
    let n = order.length; // number of cities
    // based on the mutation rate, the order of the cities is changed by swapping the cities
    if (iters % 7 === 0) {
        // If the current iteration is divisible by 7, the function randomly selects a city (j) and another city (k) at a distance of m cities from j.
        // The cities at positions j and k are then swapped using the swap function.
        for (let i = 0; i < mutation_rate; i++) {
            let j = Math.floor(Math.random() * order.length);
            let m = Math.floor(Math.random() * (n / 2)) + 1;
            let k = (j + m) % n;
            swap(order, k, j);
        }
    } else {
        // If the current iteration is not divisible by 7, the function randomly selects a city (j) and another city (k) next to j.
        let j = Math.floor(Math.random() * order.length);
        let m = 1;
        let k = (j + m) % n;
        swap(order, k, j);
    }
    order = order.filter((element) => element !== 0);
    order.unshift(0);
    order.push(0);
    if (iters % 12 === 0 && mutation_rate !== 0) {
        // If the current iteration is divisible by 12 and the mutation rate is not zero, the function shuffles the entire order randomly.
        order = shuffleArray(order);
        return order;
    }
    // If the current iteration is divisible by 10 (and it is the best individual)
    // or if the current iteration is divisible by 69 and a random number between 0 and 100 is divisible by 7,
    // the function performs a partial reversal mutation.
    if ((iters % 10 === 0 && is_best) || (iters % 69 === 0 && Math.floor(Math.random() * 100) % 7 === 0)) {
        let d = calculateDistance(cities, order);
        const p = Math.floor(Math.random() * n);

        for (let i = p; i < p + Math.ceil(n / 2); i++) {
            const index = i % n;

            if (Math.floor(Math.random() * 100) % 2 === 0) {
                for (let j = Math.ceil(n / 2) - 1; j >= 0; j--) {
                    const k = (index + j) % n;
                    swap(order, k, j);
                    order = order.filter((element) => element !== 0);
                    order.unshift(0);
                    order.push(0);
                    const temp = calculateDistance(cities, order);

                    if (temp < d) {
                        d = temp;
                        if (iters < 100 + Math.floor(1000 / P_SIZE) && Math.floor(Math.random() * 100) % 17 === 0) {
                            return order
                        }
                    } else {
                        swap(order, k, j);
                        order = order.filter((element) => element !== 0);
                        order.unshift(0);
                        order.push(0);
                    }
                }
            } else {
                for (let j = 0; j < Math.ceil(n / 2); j++) {
                    const k = (index + j) % n;
                    swap(order, k, j);
                    order = order.filter((element) => element !== 0);
                    order.unshift(0);
                    order.push(0);
                    const temp = calculateDistance(cities, order);

                    if (temp < d) {
                        d = temp;
                        if (iters < 100 + Math.floor(1000 / P_SIZE) && Math.floor(Math.random() * 100) % 17 === 0) {
                            return order;
                        }
                    } else {
                        swap(order, k, j);
                        order = order.filter((element) => element !== 0);
                        order.unshift(0);
                        order.push(0);
                    }
                }
            }
        }
    }

    if (((iters + 1) % 15 === 0 && is_best && iters % 5 !== 0) || (iters < 100 && iters % 5 === 0)) {
        let d = calculateDistance(cities, order);
        const p = Math.floor(Math.random() * n);

        for (let i = p; i < p + n; i++) {
            let index = i % n;

            if (Math.floor(Math.random() * 100) % 2 === 0) {
                for (let j = Math.floor(n / 2) - 1; j >= 0; j--) {
                    let k = (index + j) % n;

                    if (k < index) {
                        const temp = index;
                        index = k;
                        k = temp;
                    }

                    order.splice(index, k - index + 1, ...order.slice(index, k + 1).reverse());
                    order = order.filter((element) => element !== 0);
                    order.unshift(0);
                    order.push(0);
                    const temp = calculateDistance(cities, order);

                    if (temp < d) {
                        d = temp;
                        if (iters < 100 + Math.floor(1000 / P_SIZE) && Math.floor(Math.random() * 100) % 17 === 0) {
                            return order;
                        }
                    } else {
                        order.splice(index, k - index + 1, ...order.slice(index, k + 1).reverse());
                        order = order.filter((element) => element !== 0);
                        order.unshift(0);
                        order.push(0);
                    }
                }
            } else {
                for (let j = 0; j < Math.floor(n / 2); j++) {
                    let k = (index + j) % n;

                    if (k < index) {
                        const temp = index;
                        index = k;
                        k = temp;
                    }

                    order.splice(index, k - index + 1, ...order.slice(index, k + 1).reverse());
                    order = order.filter((element) => element !== 0);
                    order.unshift(0);
                    order.push(0);
                    const temp = calculateDistance(cities, order);

                    if (temp < d) {
                        d = temp;
                        if (iters < 100 + Math.floor(1000 / P_SIZE) && Math.floor(Math.random() * 100) % 17 === 0) {
                            return order;
                        }
                    } else {
                        order.splice(index, k - index + 1, ...order.slice(index, k + 1).reverse());
                        order = order.filter((element) => element !== 0);
                        order.unshift(0);
                        order.push(0);
                    }
                }
            }
        }
    }
    return order;
}

function crossOver(order1, order2, iters) {
    // performs cross over between the two orders
    const n = order1.length; // number of cities
    let i1 = Math.floor(Math.random() * (n - 2)) + 1; // selects a random index between 1 and n-2
    let i2 = Math.floor(Math.random() * (n - 2)) + 1; // selects a random index between 1 and n-2

    const order = new Array(n).fill(0);

    if (iters % 2 === 0 || iters % 3 === 0) {
        // if the current iteration is divisible by 2 or 3, the order of the cities is reversed
        order1 = order1.reverse();
    }

    order.splice(i1, i2 - i1 + 1, ...order1.slice(i1, i2 + 1)); // copies the order of the cities from the first order
    order.fill(-1, i2 + 1); // fills the rest of the order with -1
    order.fill(-1, 0, i1); // fills the rest of the order with -1
    const setIn = new Set(order);
    let j = 0;

    // fills the rest of the order with the cities from the second order
    for (let i = 0; i < n; i++) {
        if (order[i] === -1) {
            while (setIn.has(order2[j])) {
                j++;
            }
            order[i] = order2[j];
            j++;
        }
    }

    return order;
}

function nextGeneration(cities, population, P_SIZE, fitness, iters, best = null) {
    // creates the next generation of the population
    const nextGen = []; // stores the next generation
    let n = P_SIZE; // number of individuals in the population

    if (best !== null) {
        // if the best individual is not null, it is added to the next generation
        nextGen.push(best);
        n -= 1;
    }

    for (let i = 0; i < n; i++) {
        const mRate = Math.floor(Math.random() * 2) + 1; // selects a random mutation rate
        let order3 = pickOne(population, fitness); // selects an individual from the population
        order3 = mutate(cities, order3, P_SIZE, iters, mRate); // mutates the individual

        const order1 = pickOne(population, fitness); // selects an individual from the population
        const order2 = pickOne(population, fitness); // selects another individual from the population
        let order = crossOver(order1, order2, iters); // performs cross over between the two individuals

        if (iters % 3 === 0) {
            order = mutate(cities, order, P_SIZE, iters, mRate);
        }

        const orderToAdd = calculateBest(cities, [order, order3])[0];
        nextGen.push(orderToAdd);
    }

    return nextGen;
}

function calculateBest(cities, population) {
    // calculates the best individual in the population
    let best = population[0];
    let bestDist = calculateDistance(cities, best);

    for (let i = 1; i < population.length; i++) {
        const order = population[i];
        const d = calculateDistance(cities, order);

        if (d < bestDist) {
            best = order;
            bestDist = d;
        }
    }

    return [best, bestDist];
}

function naturalCalamity(population, best, intensity) {
    const n = population.length;

    // Based on the intensity, removes some individuals and replaces them with the fittest.
    // Simulates a natural calamity where the unfit individuals fail to survive.
    for (let i = 0; i < intensity; i++) {
        const j = Math.floor(Math.random() * n);
        population[j] = [...best]; // Make a copy of the best individual and assign it to the selected index
    }
}

// Helper function to shuffle an array using the Fisher-Yates algorithm
function shuffleArray(arr) {
    let currentIndex = arr.length;
    let temporaryValue, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = arr[currentIndex];
        arr[currentIndex] = arr[randomIndex];
        arr[randomIndex] = temporaryValue;
    }
    arr = arr.filter((element) => element !== 0);
    arr.unshift(0);
    arr.push(0);
    return arr;
}

function shuffle(arr) {
    let currentIndex = arr.length;
    let temporaryValue, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = arr[currentIndex];
        arr[currentIndex] = arr[randomIndex];
        arr[randomIndex] = temporaryValue;
    }

    return arr;
}


export function findShortestRoute(distanceMatrix) {
    const n = distanceMatrix.length  // number of cities
    const P_SIZE = 2;
    const ITERATIONS = 20;

    let population = []; // stores the population
    let fitness = []; // stores the fitness of each individual in the population
    let best_ever = null; // stores the best individual
    let order = Array.from({ length: n }, (_, i) => i);
    order.push(0)
    // stores the order of the cities
    let bestDist = Infinity; // stores the distance of the best individual
    let iters = 0
    createPopulation(population, P_SIZE, order, fitness); // creates the initial population
    calculateFitness(distanceMatrix, population, fitness); // calculates the fitness of each individual in the population
    normalizeFitness(fitness, P_SIZE); // normalizes the fitness of each individual in the population
    while (iters < ITERATIONS) {

        population = nextGeneration(distanceMatrix, population, P_SIZE, fitness, iters, best_ever); // creates the next generation of the population
        calculateFitness(distanceMatrix, population, fitness); // calculates the fitness of each individual in the population
        normalizeFitness(fitness, P_SIZE); // normalizes the fitness of each individual in the population

        const [bestOrder, bestDistance] = calculateBest(distanceMatrix, population); // calculates the best individual in the population

        if (bestDistance < bestDist) {
            best_ever = bestOrder
            bestDist = bestDistance;
        }
        iters += 1
    }

    return { route: best_ever, distance: bestDist };
}
