var root = this; //window

//     model2d.js 0.1.0
//     (c) 2010 The Concord Consortium
//     created by Stephen Bannasch
//     model2d.js may be freely distributed under the LGPL license.

(function() {

var model2d = {};
var root = this;
model2d.VERSION = '0.1.0';

// Constants

model2d.AIR_THERMAL_CONDUCTIVITY = 0.025;       // Air's thermal conductivity = 0.025 W/(m*K)
model2d.AIR_SPECIFIC_HEAT = 1012;               // Air's specific heat = 1012 J/(kg*K)
model2d.AIR_DENSITY = 1.204;                    // Air's density = 1.204 kg/m^3 at 25 C


/*
 * By default, air's kinematic viscosity = 1.568 x 10^-5 m^2/s at 27 C is
 * used. It can be set to zero for inviscid fluid.
 */
model2d.AIR_VISCOSITY = 0.00001568;


model2d.BUOYANCY_AVERAGE_ALL = 0;
model2d.BUOYANCY_AVERAGE_COLUMN = 1;

model2d.Boundary_UPPER = 0;
model2d.Boundary_RIGHT = 1;
model2d.Boundary_LOWER = 2;
model2d.Boundary_LEFT = 3;

model2d.NX = 100;
model2d.NY = 100;
model2d.ARRAY_SIZE = model2d.NX * model2d.NY;

function createArray(size, fill) {
    size = size || model2d.ARRAY_SIZE;
    fill = fill || 0;
    var a;
    //if (window.WebGLRenderingContext) {
    //    a = new Float32Array(size);
    //} else {
        a = new Array(size);
    //}
    if (a[size-1] == fill) {
        return a
    } else {
        for (var i; i < size; i++) {
            a[i] = fill;
        }
    } return a;
}

model2d.config = {
    model:{
        timestep: 50,
        measurement_interval: 100,
        viewupdate_interval: 20,
        sunny: true,
        sun_angle: 1.5707964,
        solar_power_density: 20000,
        solar_ray_count: 24,
        solar_ray_speed: 0.001,
        photon_emission_interval: 5,
        convective: true,
        background_conductivity: 0.1,
        thermal_buoyancy: 0.00025,
        buoyancy_approximation: 1,
        background_density: 1,
        

        boundary:{
            temperature_at_border:{
                upper: 0,
                lower: 0,
                left: 0,
                right: 0
            }
        },

        sensor:{
            thermometer:[
                {
                    x: 0.75,
                    y: 6
                },
                {
                    x: 1.75,
                    y: 6
                },
                {
                    x: 8,
                    y: 6
                }
            ]
        },

        view:{
            minimum_temperature: 0,
            maximum_temperature: 40,
        },

        structure:{
            part:[
                {
                    polygon:{
                        count: 4,
                        vertices:'8.0, 8.0, 8.5, 8.0, 8.5, 7.0, 8.0, 7.0'
                    },
                    thermal_conductivity: 0.08,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 1,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false,
                    color:'22ccff'
                },
                {
                    rectangle:{
                        x: 1,
                        y: 7,
                        width: 0.5,
                        height: 1
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false
                },
                {
                    rectangle:{
                        x: 1,
                        y: 4,
                        width: 0.5,
                        height: 1
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false
                },
                {
                    polygon:{
                        count: 6,
                        vertices:'0.5, 3.5, 5.0, 1.0, 9.5, 3.5, 8.5, 3.5, 5.0, 1.6499996, 1.5, 3.5'
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false
                },
                {
                    rectangle:{
                        x:-0.099999905,
                        y: 8,
                        width: 10.2,
                        height: 2
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false,
                    color: 333333,
                    label:'Ground'
                },
                {
                    rectangle:{
                        x: 8.5,
                        y: 4,
                        width: 0.5,
                        height: 4
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false,
                    label:'Wall'
                },
                {
                    rectangle:{
                        x: 1.15,
                        y: 5,
                        width: 0.2,
                        height: 2
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 1,
                    reflection: 0,
                    absorption: 0,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false,
                    color:'ffffff'
                },
                {
                    rectangle:{
                        x: 0.5,
                        y: 3.5,
                        width: 9,
                        height: 0.5
                    },
                    thermal_conductivity: 0.001,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 0,
                    constant_temperature: false,
                    label:'Ceiling'
                }
            ]
        }
    }
};



model2d.Model2D = function(options) {

    if (!options) {
        options = model2d.config;
    };

    if (!options.model) {
        options.model = {};
    };

    this.measurementInterval = options.model.measurement_interval || 100;
    this.viewUpdateInterval = options.model.view_update_interval || 20;
    this.sunny = options.model.sunny || true;
    this.sun_angle = options.model.sun_angle || 1.5707964;
    this.solarPowerDensity = options.model.solar_power_density || 20000;
    this.solarRayCount = options.model.solar_ray_count || 24;
    this.solarRaySpeed = options.model.solar_ray_speed || 0.001;
    this.photonEmissionInterval = options.model.photon_emission_interval || 5;
    this.convective = options.model.convective || true;
    this.thermalBuoyancy = options.model.thermal_buoyancy || 0.00025;
    this.buoyancyApproximation = options.model.buoyancy_approximation || 1;

    this.BUOYANCY_AVERAGE_ALL = 0;
    this.BUOYANCY_AVERAGE_COLUMN = 1;

    this.indexOfStep = 0;

    this.backgroundConductivity = 10 * model2d.AIR_THERMAL_CONDUCTIVITY;
    this.backgroundSpecificHeat = model2d.AIR_SPECIFIC_HEAT;
    this.backgroundDensity = model2d.AIR_DENSITY;
    this.backgroundTemperature = 0.0;

    this.boundary_settings = options.model.boundary || 
        { temperature_at_border: { upper: 0, lower: 0, left: 0, right: 0 } };

    this.parts = [];

    // private List<Thermometer> thermometers;
    // 
    // private List<Part> parts;
    // private List<Photon> photons;
    // 
    // private RaySolver2D raySolver;
    // private FluidSolver2D fluidSolver;
    // private HeatSolver2D heatSolver;

    this.nx = model2d.NX;
    this.ny = model2d.NY;

    // length in x direction (unit: meter)
    this.lx = 10;

    // length in y direction (unit: meter)
    this.ly = 10;

    this.deltaX = this.lx / this.nx;
    this.deltaY = this.ly / this.ny;

    // booleans
    this.running;
    this.notifyReset;

    // optimization flags (booleans)
    this.hasPartPower = false;
    this.radiative = true;
    this.convective = true;

    // private List<VisualizationListener> visualizationListeners;
    // private List<PropertyChangeListener> propertyChangeListeners;

    // temperature array
    
    this.t = createArray(model2d.ARRAY_SIZE, 0)
    // this.t = createArray(model2d.ARRAY_SIZE, 0);

    // internal temperature boundary array
    this.tb = createArray(model2d.ARRAY_SIZE, 0)

    for (i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.t[i] = this.backgroundTemperature;
        this.tb[i] = NaN;
    }
    
    // velocity x-component array (m/s)
    this.u = createArray(model2d.ARRAY_SIZE, 0);
    
    // velocity y-component array (m/s)
    this.v = createArray(model2d.ARRAY_SIZE, 0);

    // internal heat generation array
    this.q = createArray(model2d.ARRAY_SIZE, 0);
    
    // wind speed
    this.uWind = createArray(model2d.ARRAY_SIZE, 0);
    this.vWind = createArray(model2d.ARRAY_SIZE, 0);
    
    // conductivity array
    this.conductivity = createArray(model2d.ARRAY_SIZE, 0);
    for (i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.conductivity[i] = this.backgroundConductivity;
    }
    
    // specific heat capacity array
    this.capacity = createArray(model2d.ARRAY_SIZE, 0);
    for (i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.capacity[i] = 0;
    }
    
    // density array
    this.density = createArray(model2d.ARRAY_SIZE, 0);
    for (i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.density[i] = this.backgroundDensity;
    }
    
    // fluid cell array
    this.fluidity = createArray(model2d.ARRAY_SIZE, 0);
    
    // Photons
    this.photons = [];

    this.heatSolver = new model2d.HeatSolver2D(this.nx, this.ny, this);
    this.heatSolver.capacity = this.capacity;
    this.heatSolver.conductivity = this.conductivity;
    this.heatSolver.density = this.density;
    this.heatSolver.power = this.q;
    this.heatSolver.u = this.u;
    this.heatSolver.v = this.v;
    this.heatSolver.tb = this.tb;
    this.heatSolver.fluidity = this.fluidity;
    
    this.fluidSolver = new model2d.FluidSolver2D(this.nx, this.ny, this);
    this.fluidSolver.fluidity = this.fluidity;
    this.fluidSolver.t = this.t;
    this.fluidSolver.uWind = this.uWind;
    this.fluidSolver.vWind = this.vWind;

    this.raySolver = new model2d.RaySolver2D(this.lx, this.ly);
    this.raySolver.q = this.q;

    this.setGridCellSize();

    // parts = Collections.synchronizedList(new ArrayList<Part>());
    // thermometers = Collections.synchronizedList(new ArrayList<Thermometer>());

    // visualizationListeners = new ArrayList<VisualizationListener>();
    // propertyChangeListeners = new ArrayList<PropertyChangeListener>();
};

model2d.Model2D.prototype.reset = function() {
    var array_size = model2d.ARRAY_SIZE;
    for (i = 0; i < array_size; i++) {
        
        for (i = 0; i < model2d.ARRAY_SIZE; i++) {
            this.t[i] = this.backgroundTemperature;
            this.tb[i] = NaN;
        }

        // velocity x-component array (m/s)
        this.u[i] = 0;

        // velocity y-component array (m/s)
        this.v[i] = 0;

        // internal heat generation array
        this.q[i] = 0;

        // wind speed
        this.uWind[i] = 0;
        this.vWind[i] = 0;
        
        this.u0[i] = 0;
        this.v0[i] = 0;

        this.vorticity[i] = 0;
        this.stream[i] = 0;
    }
};

model2d.Model2D.prototype.setGridCellSize = function() {
    this.heatSolver.setGridCellSize(this.deltaX, this.deltaY);
    this.fluidSolver.setGridCellSize(this.deltaX, this.deltaY);
    this.raySolver.setGridCellSize(this.deltaX, this.deltaY);
};

model2d.Model2D.prototype.nextStep = function() {
    if (this.radiative) {
        if (this.indexOfStep % this.photonEmissionInterval == 0) {
            this.refreshPowerArray();
            if (this.sunny)
                this.raySolver.sunShine(this.photons, this.parts);
            this.raySolver.radiate(this);
        }
        this.raySolver.solve(this);
    }
    if (this.convective) {
        this.fluidSolver.solve(this.u, this.v);
    }
    this.heatSolver.solve(this.convective, this.t, this.q);
    // if (indexOfStep % measurementInterval == 0) {
    //     takeMeasurement();
    // }
    // if (indexOfStep % viewUpdateInterval == 0) {
    //     notifyVisualizationListeners();
    // }
    this.indexOfStep++;
};

// boolean sunny
model2d.Model2D.prototype.setSunny = function(sunny) {
    this.sunny = sunny;
    if (sunny) {
        this.radiative = true;
    } else {
        this.photons = [];
    }
};

model2d.Model2D.prototype.refreshPowerArray = function() {
    var x, y;

    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    
    var deltaX = this.deltaX;
    var deltaY = this.deltaY;

    var q = this.q;
    
    this.checkPartPower();

    for (i = 0; i < nx; i++) {
        x = i * deltaX;
        inx = i * nx;
        for (j = 0; j < ny; j++) {
            y = j * deltaY;
            
            jinx = inx + j;
            // jinx_minus_nx = jinx - nx;
            // jinx_plus_nx = jinx + nx;
            // jinx_minus_1 = jinx - 1;
            // jinx_plus_1 = jinx + 1;
            
            q[jinx] = 0;
            if (this.hasPartPower) {
                // synchronized (parts) {
                //     for (Part p : parts) {
                //         if (p.getPower() != 0 && p.getShape().contains(x, y)) {
                //             // no overlap of parts will be allowed
                //             q[i][j] = p.getPower();
                //             break;
                //         }
                //     }
                // }
            }
        }
    }
}

model2d.Model2D.prototype.refreshTemperatureBoundaryArray = function() {
    var x, y;

    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    
    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    for (i = 0; i < nx; i++) {
        inx = i * nx;
        x = i * deltaX;
        for (j = 0; j < ny; j++) {
            
            jinx = inx + j;
            // jinx_minus_nx = jinx - nx;
            // jinx_plus_nx = jinx + nx;
            // jinx_minus_1 = jinx - 1;
            // jinx_plus_1 = jinx + 1;
            
            y = j * deltaY;
            tb[jinx] = Float.NaN;
            // synchronized (parts) {
            //     for (Part p : parts) {
            //         if (p.getConstantTemperature() && p.getShape().contains(x, y)) {
            //             tb[i][j] = p.getTemperature();
            //             break;
            //         }
            //     }
            // }
        }
    }
}


model2d.Model2D.prototype.reallyReset = function() {
    this.setInitialTemperature();
    this.setInitialVelocity();
    this.photons.clear();
    this.heatSolver.reset();
    this.fluidSolver.reset();
};

model2d.Model2D.prototype.checkPartPower = function() {
    this.hasPartPower = false;
    // synchronized (parts) {
    //     for (Part p : parts) {
    //         if (p.getPower() != 0) {
    //             hasPartPower = true;
    //             break;
    //         }
    //     }
    // }
};

model2d.Model2D.prototype.checkPartRadiation = function() {
    this.radiative = sunny;
    if (!this.radiative) {
        // synchronized (parts) {
        //     for (Part p : parts) {
        //         if (p.getEmissivity() > 0) {
        //             radiative = true;
        //             break;
        //         }
        //     }
        // }
    }
};




//
// Utilities
//

model2d.copyArray = function(destination, source) {
    var source_length = source.length;
    var destination_length = destination.length;
    for (i = 0; i < source_length; i++) {
        destination[i] = source[i];
    }
};

/** @return true if x is between a and b. */
// float a, float b, float x
model2d.between = function(a, b, x) {
    return x < Math.max(a, b) && x > Math.min(a, b);
};

// float[] array
model2d.getMax = function(array) {
    return Math.max.apply( Math, array );
};

// float[] array
model2d.getMin = function(array) {
    return Math.min.apply( Math, array );
};

// FloatxxArray[] array
model2d.getMaxTypedArray = function(array) {
    var max = Number.MIN_VALUE;
    var length = array.length;
    var test;
    for(i = 0; i < length; i++) {
        test = array[i];
        max = test > max ? test : max
    }
    return max;
};

// FloatxxArray[] array
model2d.getMinTypedArray = function(array) {
    var min = Number.MAX_VALUE;
    var length = array.length;
    var test;
    for(i = 0; i < length; i++) {
        test = array[i];
        min = test < min ? test : min
    }
    return min;
};

// float[] array
model2d.getMaxAnyArray = function(array) {
    try {
        return Math.max.apply( Math, array );
    }
    catch (e) {
        if (e instanceof TypeError) {
            var max = Number.MIN_VALUE;
            var length = array.length;
            var test;
            for(i = 0; i < length; i++) {
                test = array[i];
                max = test > max ? test : max
            }
            return max;
        }
    }
};

// float[] array
model2d.getMinAnyArray = function(array) {
    try {
        return Math.min.apply( Math, array );
    }
    catch (e) {
        if (e instanceof TypeError) {
            var min = Number.MAX_VALUE;
            var length = array.length;
            var test;
            for(i = 0; i < length; i++) {
                test = array[i];
                min = test < min ? test : min
            }
            return min;
        }
    }
};


model2d.getAverage = function(array) {
    var acc = 0;
    var length = array.length;
    for (i = 0; i < length; i++) {
        acc += array[i];
    };
    return acc / length;
};

// *******************************************************
//
//   HeatSolver2D
//
// *******************************************************

model2d.HeatSolver2D = function(nx, ny, model) {

    // Float arrays
    this.conductivity = model.conductivity;
    this.capacity = model.capacity;
    this.density = model.density;
    this.u = model.u;
    this.v = model.v;
    this.tb = model.tb;
    this.q = model.q;
    
    // Boolean array
    this.fluidity = model.fluidity;
    
    this.nx = nx;
    this.ny = ny;
    this.nx1 = nx - 1;
    this.ny1 = ny - 1;
    this.nx2 = nx - 2;
    this.ny2 = ny - 2;

    this.timeStep = 0.1;
    this.relaxationSteps = 5;
    
    // array that stores the previous temperature results
    this.t0 = createArray(model2d.ARRAY_SIZE, 0);

    this.boundary = new model2d.DirichletHeatBoundary(model.boundary_settings);

};

model2d.HeatSolver2D.prototype.setGridCellSize = function(deltaX, deltaY) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;
};

model2d.HeatSolver2D.prototype.solve = function(convective, t, q) {
    model2d.copyArray(this.t0, t);
    
    var nx = this.nx;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    
    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;
    
    var inx_minus_nx;
    
    var conductivity = this.conductivity;
    var capacity = this.capacity;
    var density = this.density;

    var tb = this.tb;
    var t0 = this.t0;
    var q = q;
    
    var hx = 0.5 / (this.deltaX * this.deltaX);
    var hy = 0.5 / (this.deltaY * this.deltaY);
    var rij, sij, axij, bxij, ayij, byij;
    var invTimeStep = 1.0 / this.timeStep;

    for (k = 0; k < this.relaxationSteps; k++) {
        for (i = 1; i < nx1; i++) {
            inx = i * nx;
            for (j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (isNaN(tb[jinx])) {

                    jinx_minus_nx = jinx - nx;
                    jinx_plus_nx = jinx + nx;
                    jinx_minus_1 = jinx - 1;
                    jinx_plus_1 = jinx + 1;

                    sij = capacity[jinx] * density[jinx] * invTimeStep;
                    rij = conductivity[jinx];
                    axij = hx * (rij + conductivity[jinx_minus_nx]);
                    bxij = hx * (rij + conductivity[jinx_plus_nx]);
                    ayij = hy * (rij + conductivity[jinx_minus_1]);
                    byij = hy * (rij + conductivity[jinx_minus_1]);
                    t[jinx] = (t0[jinx] * sij + q[jinx] + axij * t[jinx_minus_nx] + bxij
                            * t[jinx_plus_nx] + ayij * t[jinx_minus_1] + byij * t[jinx_plus_1]) /
                            (sij + axij + bxij + ayij + byij);
                } else {
                    t[jinx] = tb[jinx];
                }
            }
        }
        this.applyBoundary(t);
    }
    if (this.convective) {
        this.advect(t);
    }
};

model2d.HeatSolver2D.prototype.advect = function(t) {
    this.macCormack(t);
};

model2d.HeatSolver2D.prototype.macCormack  = function(t) {
    var tx = 0.5 * this.timeStep / this.deltaX;
    var ty = 0.5 * this.timeStep / this.deltaY;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    
    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;
    
    var fluidity = this.fluidity;

    var t0 = this.t0;
    var u = this.u;
    var v = this.v;

    for (i = 1; i < this.nx1; i++) {
        inx = i * nx;
        inx_minus_nx = inx - nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            jinx_minus_nx = jinx - nx;
            jinx_plus_nx = jinx + nx;
            jinx_minus_1 = jinx - 1;
            jinx_plus_1 = jinx + 1;
            if (fluidity[jinx]) {
                t0[jinx] = t[jinx] - tx
                * (u[jinx_plus_nx] * t[jinx_plus_nx] - u[jinx_minus_nx] * t[jinx_minus_nx]) - ty
                * (v[jinx_plus_1] * t[jinx_plus_1] - v[jinx_minus_1] * t[jinx_minus_1]);
            }
        }
    }
    this.applyBoundary(t0);

    for (i = 1; i < nx1; i++) {
        for (j = 1; j < ny1; j++) {
            if (fluidity[jinx]) {
                t[jinx] = 0.5 * (t[jinx] + t0[jinx]) - 0.5 * tx * u[jinx]
                * (t0[jinx_plus_nx] - t0[jinx_minus_nx]) - 0.5 * ty * v[jinx]
                * (t0[jinx_plus_1] - t0[jinx_minus_1]);
            }
        }
    }
    this.applyBoundary(t);
};

model2d.HeatSolver2D.prototype.applyBoundary  = function(t) {
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    var conductivity = this.conductivity;
    var deltaX = this.deltaX;
    var deltaY = this.deltaY;
    var b = this.boundary;
    var tN, tS, tW, tE;
    var inx, inx_minus_nx, jinx, jinx_minus_nx, jinx_plus_nx, jinx_minus_1;
    if (b instanceof model2d.DirichletHeatBoundary) {
        tN = b.getTemperatureAtBorder(model2d.Boundary_UPPER);
        tS = b.getTemperatureAtBorder(model2d.Boundary_LOWER);
        tW = b.getTemperatureAtBorder(model2d.Boundary_LEFT);
        tE = b.getTemperatureAtBorder(model2d.Boundary_RIGHT);
        for (i = 0; i < nx; i++) {
            inx = i * nx;
            t[inx] = tN;
            t[inx + ny1] = tS;
        }
        for (j = 0; j <  ny; j++) {
            t[j] = tW;
            t[nx1 * nx +j] = tE;
        }
    } else if (b instanceof NeumannHeatBoundary) {
        fN = b.getFluxAtBorder(model2d.Boundary_UPPER);
        fS = b.getFluxAtBorder(model2d.Boundary_LOWER);
        fW = b.getFluxAtBorder(model2d.Boundary_LEFT);
        fE = b.getFluxAtBorder(model2d.Boundary_RIGHT);
        for (i = 0; i < this.nx; i++) {
            inx = i * nx;
            inx_ny1 = inx + ny1;
            t[inx] = t[inx + 1] + fN * deltaY / conductivity[inx];
            t[inx_ny1] = t[inx + ny2] - fS * deltaY / conductivity[inx_ny1];
        }
        for (j = 0; j < ny; j++) {
            t[j] = t[nx + j] - fW * deltaX / conductivity[j];
            t[nx1 * nx + j] = t[nx2 * nx +j] + fE * deltaX / conductivity[nx1 * nx + j];
        }
    }
};

model2d.DirichletHeatBoundary = function(boundary_settings) {
    // by default all temperatures are zero
    var settings;
    if (boundary_settings) {
        settings = boundary_settings.temperature_at_border;
    } else {
        settings = { upper: 0, lower: 0, left: 0, right: 0 }
    }
    this.temperatureAtBorder = createArray(4, 0); // unit: centigrade
    this.setTemperatureAtBorder(model2d.Boundary_UPPER, settings.upper);
    this.setTemperatureAtBorder(model2d.Boundary_LOWER, settings.lower);
    this.setTemperatureAtBorder(model2d.Boundary_LEFT, settings.left);
    this.setTemperatureAtBorder(model2d.Boundary_RIGHT, settings.right);
};

model2d.DirichletHeatBoundary.prototype.getTemperatureAtBorder  = function(side) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    return this.temperatureAtBorder[side];
};

model2d.DirichletHeatBoundary.prototype.setTemperatureAtBorder  = function(side, value) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
     this.temperatureAtBorder[side] = value;
};


// *******************************************************
//
//   FluidSolver2D
//
// *******************************************************

model2d.FluidSolver2D = function(nx, ny, model) {
    this.i2dx = null;
    this.i2dy == null;
    this.idxsq = null;
    this.idysq = null;
    this.deltaX = model.deltaX;
    this.deltaY = model.deltaY;
    
    this.relaxationSteps = 5;
    this.timeStep = 0.1;
    this.thermalBuoyancy = model.thermalBuoyancy;
    this.gravity = 1;
    this.buoyancyApproximation = model.buoyancyApproximation;  // model2d.BUOYANCY_AVERAGE_COLUMN;
    this.viscosity = 10 * model2d.AIR_VISCOSITY;
    this.timeStep = 0.1;

    this.uWind = model.uWind;
    this.vWind = model.vWind;

    this.nx = model.nx;
    this.ny = model.ny;
    this.nx1 = nx - 1;
    this.ny1 = ny - 1;
    this.nx2 = nx - 2;
    this.ny2 = ny - 2;
    
    this.u0 = createArray(model2d.ARRAY_SIZE, 0);
    this.v0 = createArray(model2d.ARRAY_SIZE, 0);
    this.vorticity = createArray(model2d.ARRAY_SIZE, 0);
    this.stream = createArray(model2d.ARRAY_SIZE, 0);
};

model2d.FluidSolver2D.prototype.reset = function() {
    var array_size = model2d.ARRAY_SIZE;
    for (i = 0; i < array_size; i++) {
        this.u0[i] = 0;
        this.v0[i] = 0;
        this.vorticity[i] = 0;
        this.stream[i] = 0;
    }
};

// TODO: swap the two arrays instead of copying them every time?
// float[][] u, float[][] v
model2d.FluidSolver2D.prototype.solve = function(u, v) {
    if (this.thermalBuoyancy != 0) {
        this.applyBuoyancy(v);
    }
    this.setObstacleVelocity(u, v);
    if (this.viscosity > 0) { // inviscid case
        this.diffuse(1, this.u0, u);
        this.diffuse(2, this.v0, v);
        this.conserve(u, v, this.u0, this.v0);
        this.setObstacleVelocity(u, v);
    }
    
    model2d.copyArray(this.u0, u);
    model2d.copyArray(this.v0, v);
    this.advect(1, this.u0, u);
    this.advect(2, this.v0, v);
    this.conserve(u, v, this.u0, this.v0);
    this.setObstacleVelocity(u, v);
}

model2d.FluidSolver2D.prototype.setGridCellSize = function(deltaX, deltaY) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.i2dx = 0.5 / deltaX;
    this.i2dy = 0.5 / deltaY;
    this.idxsq = 1.0 / (deltaX * deltaX);
    this.idysq = 1.0 / (deltaY * deltaY);
};

/* b=1 horizontal; b=2 vertical */
// int b, float[][] f
model2d.FluidSolver2D.prototype.applyBoundary = function(b, f) {
    var horizontal = b == 1;
    var vertical = b == 2;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var inx_plus1, inx_plus_ny1, inx_plus_ny2;
    var nx_plusj, nx2_plusj;
    var nx1nx, nx2nx;
    
    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        inx_plus1 = inx + 1;
        inx_plus_ny1 = inx + ny1;
        inx_plus_ny2 = inx + ny2;
        // upper side
        f[inx] = vertical ? -f[inx_plus1] : f[inx_plus1];
        // lower side
        f[inx_plus_ny1] = vertical ? -f[inx_plus_ny2] : f[inx_plus_ny2];
    }
    for (j = 1; j < ny1; j++) {
        // left side
        nx_plusj = nx + j;
        nx2_plusj = nx2 + j;
        f[j] = horizontal ? -f[nx_plusj] : f[nx_plusj];
        // right side
        f[nx_plusj] = horizontal ? -f[nx2_plusj] : f[nx2_plusj];
    }
    
    nx1nx = nx1 * nx;
    nx2nx = nx2 * nx;
    // upper-left corner
    f[0] = 0.5 * (f[nx] + f[1]);
    // upper-right corner
    f[nx1nx] = 0.5 * (f[nx2nx] + f[nx1nx + 1]);
    // lower-left corner
    f[ny1] = 0.5 * (f[nx1nx + ny1] + f[ny2]);
    // lower-right corner
    f[nx1nx + ny1] = 0.5 * (f[nx2nx + ny1] + f[nx1nx + ny2]);
}

// float[][] u, float[][] v
model2d.FluidSolver2D.prototype.setObstacleVelocity = function(u, v) {
    var count = 0;
    var uw, vw;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var fluidity = this.fluidity;
    var uWind = this.uWind;
    var vWind = this.vWind;

    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            jinx_minus_nx = jinx - nx;
            jinx_plus_nx = jinx + nx;
            jinx_minus_1 = jinx - 1;
            jinx_plus_1 = jinx + 1;
            
            if (!fluidity[jinx]) {
                uw = uWind[jinx];
                vw = vWind[jinx];
                count = 0;
                if (fluidity[jinx_minus_nx]) {
                    count++;
                    u[jinx] = uw - u[jinx_minus_nx];
                    v[jinx] = vw + v[jinx_minus_nx];
                } else if (fluidity[jinx_plus_nx]) {
                    count++;
                    u[jinx] = uw - u[jinx_plus_nx];
                    v[jinx] = vw + v[jinx_plus_nx];
                }
                if (fluidity[jinx_minus_1]) {
                    count++;
                    u[jinx] = uw + u[jinx_minus_1];
                    v[jinx] = vw - v[jinx_minus_1];
                } else if (fluidity[jinx_plus_1]) {
                    count++;
                    u[jinx] = uw + u[jinx_plus_1];
                    v[jinx] = vw - v[jinx_plus_1];
                }
                if (count == 0) {
                    u[jinx] = uw;
                    v[jinx] = vw;
                }
            }
        }
    }
};

// ensure dx/dn = 0 at the boundary (the Neumann boundary condition)
// float[][] x
model2d.FluidSolver2D.prototype.setObstacleBoundary = function(x) {
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    
    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var fluidity = this.fluidity;
    
    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            if (!fluidity[jinx]) {
                
                jinx_minus_nx = jinx - nx;
                jinx_plus_nx = jinx + nx;
                jinx_minus_1 = jinx - 1;
                jinx_plus_1 = jinx + 1;
                
                if (fluidity[jinx_minus_nx]) {
                    x[jinx] = x[jinx_minus_nx];
                } else if (fluidity[jinx_plus_nx]) {
                    x[jinx] = x[jinx_plus_nx];
                }
                if (fluidity[jinx_minus_1]) {
                    x[jinx] = x[jinx_minus_1];
                } else if (fluidity[jinx_plus_1]) {
                    x[jinx] = x[jinx_plus_1];
                }
            }
        }
    }
};

// int i, int j
model2d.FluidSolver2D.prototype.getMeanTemperature = function(i, j) {
    var lowerBound = 0;
    var upperBound = this.ny;
    var t0 = 0;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    
    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;
    
    var inx_plus_k;
    
    // search for the upper bound
    for (k = j - 1; k > 0; k--) {
        inx_plus_k = i * nx + k;
        if (!fluidity[inx_plus_k]) {
            lowerBound = k;
            break;
        }
    }

    for (k = j + 1; k < ny; k++) {
        inx_plus_k = i * nx + k;
        if (!fluidity[inx_plus_k]) {
            upperBound = k;
            break;
        }
    }

    for (k = lowerBound; k < upperBound; k++) {
        inx_plus_k = i * nx + k;
        t0 += t[inx_plus_k];
    }
    return t0 / (upperBound - lowerBound);
}

// float[][] f
model2d.FluidSolver2D.prototype.applyBuoyancy = function(f) {
    var g = this.gravity * this.timeStep;
    var b = this.thermalBuoyancy * this.timeStep;
    var t0;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var deltaX = this.deltaX;
    var deltaY = this.deltaY;

    var idxsq = this.idxsq;
    var idysq = this.idysq;

    var i2dx = this.i2dx;
    var i2dy = this.i2dy;

    var fluidity = this.fluidity;
    var vorticity = this.vorticity;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;
    
    
    switch (this.buoyancyApproximation) {
    case model2d.BUOYANCY_AVERAGE_ALL:
        t0 = MathUtil.getAverage(t);
        for (i = 1; i < nx1; i++) {
            inx = i * nx;
            for (j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (fluidity[jinx]) {
                    f[jinx] += (g - b) * t[jinx] + b * t0;
                }
            }
        }
        break;
    case model2d.BUOYANCY_AVERAGE_COLUMN:
        for (i = 1; i < nx1; i++) {
            inx = i * nx;
            for (j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (fluidity[jinx]) {
                    t0 = getMeanTemperature(i, j);
                    f[jinx] += (g - b) * t[jinx] + b * t0;
                }
            }
        }
        break;
    }
};

/*
 * enforce the continuity condition div(V)=0 (velocity field must be
 * divergence-free to conserve mass) using the relaxation method:
 * http://en.wikipedia.org/wiki/Relaxation_method. This procedure solves the
 * Poisson equation.
 */
// float[][] u, float[][] v, float[][] phi, float[][] div
model2d.FluidSolver2D.prototype.conserve = function(u, v, phi, div) {

    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var idxsq = this.idxsq;
    var idysq = this.idysq;

    var i2dx = this.i2dx;
    var i2dy = this.i2dy;

    var fluidity = this.fluidity;
    var vorticity = this.vorticity;

    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            if (fluidity[jinx]) {

                jinx_minus_nx = jinx - nx;
                jinx_plus_nx = jinx + nx;
                jinx_minus_1 = jinx - 1;
                jinx_plus_1 = jinx + 1;
                
                div[jinx] = (u[jinx_plus_nx] - u[jinx_minus_nx]) * i2dx + (v[jinx_plus_1] - v[jinx_minus_1])
                        * i2dy;
                phi[jinx] = 0;
            }
        }
    }
    this.applyBoundary(0, div);
    this.applyBoundary(0, phi);
    this.setObstacleBoundary(div);
    this.setObstacleBoundary(phi);

    var s = 0.5 / (idxsq + idysq);

    for (k = 0; k < this.relaxationSteps; k++) {
        for (i = 1; i < nx1; i++) {
            inx = i * nx;
            for (j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (fluidity[jinx]) {
                    
                    jinx_minus_nx = jinx - nx;
                    jinx_plus_nx = jinx + nx;
                    jinx_minus_1 = jinx - 1;
                    jinx_plus_1 = jinx + 1;
                    
                    phi[jinx] = s
                            * ((phi[jinx_minus_nx] + phi[jinx_plus_nx]) * idxsq
                                    + (phi[jinx_minus_1] + phi[jinx_plus_1]) * idysq - div[jinx]);
                }
            }
        }
    }

    for (i = 1; i < nx1; i++) {
        for (j = 1; j < ny1; j++) {
            if (fluidity[jinx]) {
                u[jinx] -= (phi[jinx_plus_nx] - phi[jinx_minus_nx]) * i2dx;
                v[jinx] -= (phi[jinx_plus_1] - phi[jinx_minus_1]) * i2dy;
            }
        }
    }
    this.applyBoundary(1, u);
    this.applyBoundary(2, v);

};

// float[][] u, float[][] v
// return float[][]
model2d.FluidSolver2D.prototype.getStreamFunction = function(u, v) {

    // if (vorticity == null)
    //     vorticity = new float[nx][ny];
    // if (stream == null)
    //     stream = new float[nx][ny];

    calculateVorticity(u, v);
    calculateStreamFunction();
    return this.stream;
};

model2d.FluidSolver2D.prototype.calculateStreamFunction = function() {
    var s = 0.5 / (this.idxsq + this.idysq);

    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var fluidity = this.fluidity;
    var vorticity = this.vorticity;

    for (i = 0; i < nx; i++) {
        stream[i] = 0;
    }
    for (k = 0; k < this.relaxationSteps; k++) {
        for (i = 1; i < nx1; i++) {
            inx = i * nx;
            for (j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (fluidity[jinx]) {
                    
                    jinx_minus_nx = jinx - nx;
                    jinx_plus_nx = jinx + nx;
                    jinx_minus_1 = jinx - 1;
                    jinx_plus_1 = jinx + 1;

                    stream[jinx] = s
                            * ((stream[jinx_minus_nx] + stream[jinx_plus_nx]) * idxsq
                                    + (stream[jinx_minus_1] + stream[jinx_plus_1]) * idysq + vorticity[jinx]);
                }
            }
        }
        this.applyBoundary(0, stream);
        this.setObstacleBoundary(stream);
    }
};

// float[][] u, float[][] v
model2d.FluidSolver2D.prototype.calculateVorticity = function(u, v) {
    var du_dy, dv_dx;
    
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var deltaX2 = 2 * this.deltaX;
    var deltaY2 = 2 * this.deltaY;
    
    var fluidity = this.fluidity;
    var vorticity = this.vorticity;
    
    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            if (fluidity[jinx]) {

                jinx_minus_nx = jinx - nx;
                jinx_plus_nx = jinx + nx;
                jinx_minus_1 = jinx - 1;
                jinx_plus_1 = jinx + 1;

                du_dy = (u[jinx_plus_1] - u[jinx_minus_1]) / deltaY2;
                dv_dx = (v[jinx_plus_nx] - v[jinx_minus_nx]) / deltaX2;
                vorticity[jinx] = du_dy - dv_dx;
            }
        }
    }
    this.applyBoundary(0, vorticity);
    this.setObstacleBoundary(vorticity);
}


// int b, float[][] f0, float[][] f
model2d.FluidSolver2D.prototype.diffuse = function(b, f0, f) {

    model2d.copyArray(f0, f);

    var hx = this.timeStep * this.viscosity * this.idxsq;
    var hy = this.timeStep * this.viscosity * this.idysq;
    var dn = 1.0 / (1 + 2 * (hx + hy));

    var fluidity = this.fluidity;

    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    for (k = 0; k < this.relaxationSteps; k++) {
        for (i = 1; i < nx1; i++) {
            inx = i * nx;
            for (j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (fluidity[jinx]) {
                    
                    jinx_minus_nx = jinx - nx;
                    jinx_plus_nx = jinx + nx;
                    jinx_minus_1 = jinx - 1;
                    jinx_plus_1 = jinx + 1;
                    
                    f[jinx] = (f0[jinx] + hx * (f[jinx_minus_nx] + f[jinx_plus_nx]) + hy
                            * (f[jinx_minus_1] + f[jinx_plus_1]))
                            * dn;
                }
            }
        }
        this.applyBoundary(b, f);
    }

};

// int b, float[][] f0, float[][] f
model2d.FluidSolver2D.prototype.advect = function(b, f0, f) {
    this.macCormack(b, f0, f);
};

// MacCormack
// int b, float[][] f0, float[][] f
model2d.FluidSolver2D.prototype.macCormack = function(b, f0, f) {

    var tx = 0.5 * this.timeStep / this.deltaX;
    var ty = 0.5 * this.timeStep / this.deltaY;

    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;

    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;

    var fluidity = this.fluidity;

    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            if (fluidity[jinx]) {
                
                jinx_minus_nx = jinx - nx;
                jinx_plus_nx = jinx + nx;
                jinx_minus_1 = jinx - 1;
                jinx_plus_1 = jinx + 1;
                
                f[jinx] = f0[jinx]
                        - tx
                        * (u0[jinx_plus_nx] * f0[jinx_plus_nx] - u0[jinx_minus_nx]
                                * f0[jinx_minus_nx])
                        - ty
                        * (v0[jinx_plus_1] * f0[jinx_plus_1] - v0[jinx_minus_1]
                                * f0[jinx_minus_1]);
            }
        }
    }

    this.applyBoundary(b, f);

    for (i = 1; i < nx1; i++) {
        inx = i * nx;
        for (j = 1; j < ny1; j++) {
            jinx = inx + j;
            if (fluidity[jinx]) {
                
                jinx_minus_nx = jinx - nx;
                jinx_plus_nx = jinx + nx;
                jinx_minus_1 = jinx - 1;
                jinx_plus_1 = jinx + 1;
                
                f0[jinx] = 0.5 * (f0[jinx] + f[jinx]) - 0.5 * tx
                        * u0[jinx] * (f[jinx_plus_nx] - f[jinx_minus_nx]) - 0.5
                        * ty * v0[jinx] * (f[jinx_plus_1] - f[jinx_minus_1]);
            }
        }
    }

    model2d.copyArray(f, f0);

    this.applyBoundary(b, f);

};

// *******************************************************
//
//   RaySolver2D
//
// *******************************************************

// float lx, float ly
model2d.RaySolver2D = function(lx, ly) {
    
    this.lx = lx;
    this.ly = ly;
    
    this.deltaX = null;
    this.deltaY = null;

    this.sunAngle = Math.PI * 0.5;
    
    this.rayCount = 24;
    this.solarPowerDensity = 2000;
    this.rayPower = this.solarPowerDensity;
    
    this.raySpeed = 0.1;
    
    this.q = createArray(model2d.ARRAY_SIZE, 0);
    
    this.i2dx = null;
    this.i2dy == null;
    this.idxsq = null;
    this.idysq = null;
    this.deltaX = null;
    this.deltaY = null;
    
    this.relaxationSteps = 5;
    this.timeStep = 0.1;
    this.thermalBuoyancy = 0.00025;
    this.gravity = 0;
    this.buoyancyApproximation = 1;  // model2d.BUOYANCY_AVERAGE_COLUMN;
    this.viscosity = 10 * model2d.AIR_VISCOSITY;
    this.timeStep = 0.1;

    this.uWind = null;
    this.vWind = null;

    this.nx = model2d.nx;
    this.ny = model2d.ny;
    this.nx1 = this.nx - 1;
    this.ny1 = this.ny - 1;
    this.nx2 = this.nx - 2;
    this.ny2 = this.ny - 2;
    
    this.u0 = createArray(model2d.ARRAY_SIZE, 0);
    this.v0 = createArray(model2d.ARRAY_SIZE, 0);
    this.vorticity = createArray(model2d.ARRAY_SIZE, 0);
    this.stream = createArray(model2d.ARRAY_SIZE, 0);
};

model2d.RaySolver2D.prototype.setSolarPowerDensity = function(solarPowerDensity) {
    this.solarPowerDensity = solarPowerDensity;
    this.rayPower = solarPowerDensity * 24 / this.rayCount;
};

model2d.RaySolver2D.prototype.setSolarRayCount = function(solarRayCount) {
    this.rayCount = solarRayCount;
    this.rayPower = this.solarPowerDensity * 24 / this.rayCount;
};

model2d.RaySolver2D.prototype.setGridCellSize = function(deltaX, deltaY) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;
};

// loat x, float y, List<Part> parts
model2d.RaySolver2D.prototype.isContained = function(x, y, parts) {
    var parts_length = parts.length;
    for (i = 0; i < parts_length; i++) {
        if (parts[i].contains(x, y)) {
            return true;
        }
    } 
    return false;
};

// float sunAngle
model2d.RaySolver2D.prototype.setSunAngle = function(sunAngle) {
    this.sunAngle = Math.PI - sunAngle;
}

model2d.RaySolver2D.prototype.getSunAngle = function() {
  return Math.PI - sunAngle;
}


// Model2D model
model2d.RaySolver2D.prototype.radiate = function(model2d) {
    // synchronized (model2d.getParts()) {
    //   for (Part p : model2d.getParts()) {
    //     if (p.getEmissivity() > 0)
    //       p.radiate(model2d);
    //   }
    // }
};


model2d.RaySolver2D.prototype.solve = function(model2d) {
  this.photons = model2d.photons;
  if (this.photons.length == 0)
    return;

  var photon = null;

  var timeStep = model2d.timeStep;
  var nx = model2d.nx;
  var ny = model2d.ny;

  // Since a photon is emitted at a given interval, its energy
  // has to be divided evenly for internal power generation at
  // each second. The following factor takes this into account.
  var factor = 1.0 / (timeStep * model2d.photonEmissionInterval);
  var idx = 1.0 / this.deltaX;
  var idy = 1.0 / this.deltaY;
  var i, j;
  
  var nx_minus_1 = nx - 1;
  var ny_minus_1 = ny - 1;

  // boolean remove;

  var photonCount = this.photons.length;
  for (i = 0; i < photonCount; i++) {
      photon = photons[i];
      photon.move(timeStep);
      // if (model.getPartCount() > 0) {
      //     remove = false;
      //     synchronized (model.getParts()) {
      //         for (Part part : model.getParts()) {
      //             if (Math.abs(part.getReflection() - 1) < 0.001f) {
      //                 if (part.reflect(p, timeStep))
      //                     break;
      //             } else if (Math.abs(part.getAbsorption() - 1) < 0.001f) {
      //                 if (part.absorb(p)) {
      //                     i = Math.min(nx, Math.round(p.getX() * idx));
      //                     j = Math.min(ny, Math.round(p.getY() * idy));
      //                     q[i][j] = p.getEnergy() * factor;
      //                     remove = true;
      //                     break;
      //                 }
      //             }
      //         }
      //     }
      //     if (remove)
      //         it.remove();
      // }
  }
  this.applyBoundary(photons);
}



// List<Photon> photons
model2d.RaySolver2D.prototype.applyBoundary = function(photons) {
    var photonCount = this.photons.length;
    var lx = this.lx;
    var ly = this.ly;
    var remainingPhotons = [];
    for (i = 0; i < photonCount; i++) {
        photon = photons[i];
        if (photon.isContained(0, lx, 0, ly)) {
            remainingPhotons.push(photon);
        }
    }
    photons = remainingPhotons;
};


// List<Photon> photons, List<Part> parts
model2d.RaySolver2D.prototype.sunShine = function(photons, parts) {
  if (this.sunAngle < 0)
    return;
  var s = Math.abs(Math.sin(this.sunAngle));
  var c = Math.abs(Math.cos(this.sunAngle));

  var lx = this.lx;
  var ly = this.ly;

  var spacing = s * ly < c * lx ? ly / c : lx / s;
  spacing /= this.rayCount;
  this.shootAtAngle(spacing / s, spacing / c, photons, parts);
}

// float dx, float dy, List<Photon> photons, List<Part> parts
model2d.RaySolver2D.prototype.shootAtAngle = function(dx, dy, photons, parts) {
    var lx = this.lx;
    var ly = this.ly;
    var sunAngle = this.sunAngle;
    var rayPower = this.rayPower;
    var raySpeed = this.raySpeed;
    var m = this.lx / dx;
    var n = this.ly / dy;
    var x, y;
    return;
    if (this.sunAngle >= 0 && this.sunAngle < 0.5 * Math.PI) {
        y = 0;
        for (i = 1; i <= m; i++) {
            x = dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
        x = 0;
        for (i = 0; i <= n; i++) {
            y = dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    } else if (sunAngle < 0 && sunAngle >= -0.5 * Math.PI) {
        y = ly;
        for (i = 1; i <= m; i++) {
            x = dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
        x = 0;
        for (i = 0; i <= n; i++) {
            y = ly - dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    } else if (sunAngle < Math.PI + 0.001 && sunAngle >= 0.5 * Math.PI) {
        y = 0;
        for (i = 0; i <= m; i++) {
            x = lx - dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
        x = lx;
        for (i = 1; i <= n; i++) {
            y = dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    } else if (sunAngle >= -Math.PI && sunAngle < -0.5 * Math.PI) {
        y = ly;
        for (i = 0; i <= m; i++) {
            x = lx - dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, thisr.ayPower, sunAngle, raySpeed));
        }
        x = lx;
        for (i = 1; i <= n; i++) {
            y = ly - dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    }
}


// *******************************************************
//
//   Photons
//
// *******************************************************

// float x, float y, float energy, float c
model2d.Photon = function(x, y, energy, angle, c) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.c = c;
    this.setAngle(angle);
}


model2d.Photon.prototype.setAngle = function(angle) {
    this.vx =  Math.cos(angle) * this.c;
    this.vy =  Math.sin(angle) * this.c;
}

// float xmin, float xmax, float ymin, float ymax
model2d.Photon.prototype.isContained = function(xmin, xmax, ymin, ymax) {
    return x >= xmin && x <= xmax && y >= ymin && y <= ymax;
}

// float dt
model2d.Photon.prototype.move = function(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
}


// *******************************************************
//
//   Graphics Canvas
//
// *******************************************************

model2d.addHotSpot = function(model, temp) {
    var inx;
    var t = model.t;
    for (i = 45; i < 55; i++) {
        inx = i * 100;
        for (j = 45; j < 55; j++) {
            t[inx + j] = temp;
        }
    }
}


var colorDivs = [];

model2d.setupColorDivs = function() {
    var i;
    for (i = 0; i < 256; i++) {
        colorDivs[i] = '<div class="cp' + i + '"></div>'
    }

    var hue;
    var cssColorRules = [];
    for (i = 0; i < 256; i++) {
        hue = Math.abs(i - 255);
        cssColorRules[i] = '.cp' + i + ' { background-color:hsl(' + hue + ',100%,50%); width:5px; height:4px; margin:0px; display:inline-block }'
    }

    for (i = 0; i < cssColorRules.length; i++) {
        document.styleSheets[0].insertRule(cssColorRules[i], 0)
    }
}

model2d.displayTemperatureColorDivs = function(destination, model) {
    if (colorDivs.length == 0) {
        model2d.setupColorDivs();
    };
    var columns = model.nx;
    var rows = model.ny;
    var ycols, ycols_plus_x;
    var t = model.t;
    var min = model2d.getMinAnyArray(t);
    var max = model2d.getMaxAnyArray(t);
    var scale = 255/(max - min);
    var temp;
    var colorDivsStr = "";
    for (y = 0; y < rows; y++) {
        ycols = y * rows;
        for (x = 0; x < columns; x++) {
            ycols_plus_x = ycols + x;
            temp = t[ycols_plus_x];
            colorDivsStr += colorDivs[Math.round(scale * temp - min)]
        }
        colorDivsStr += '\n';
    }
    destination.innerHTML = colorDivsStr;
}

/**
* HSV to RGB color conversion
*
* H runs from 0 to 360 degrees
* S and V run from 0 to 100
* 
* Ported from the excellent java algorithm by Eugene Vishnevsky at:
* http://www.cs.rit.edu/~ncs/color/t_convert.html
* 
* http://snipplr.com/view.php?codeview&id=14590
*
*/
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
        r = v;
        g = t;
        b = p;
        break;

        case 1:
        r = q;
        g = v;
        b = p;
        break;

        case 2:
        r = p;
        g = v;
        b = t;
        break;

        case 3:
        r = p;
        g = q;
        b = v;
        break;

        case 4:
        r = t;
        g = p;
        b = v;
        break;

        default: // case 5:
        r = v;
        g = p;
        b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
var red_color_table   = [];
var blue_color_table  = [];
var green_color_table = [];
var alpha_color_table = [];

model2d.setupRGBAColorTables = function() {
    var rgb = [];
    for(var i = 0; i < 256; i++) {
        rgb = hsvToRgb(i, 100, 90);
        red_color_table[i]   = rgb[0];
        blue_color_table[i]  = rgb[1];
        green_color_table[i] = rgb[2];
    }
}

model2d.displayTemperatureCanvas = function(canvas, model) {
    if (red_color_table.length == 0) {
        model2d.setupRGBAColorTables;
    };
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.globalCompositeOperation = "destination-atop";

    var columns = model.nx;
    var rows = model.ny;

    canvas.style.width = canvas.clientWidth + 'px';
    canvas.style.height = canvas.clientHeight + 'px';

    canvas.width = columns;
    canvas.height = rows;
    
    var hue, rgb;

    var ycols;

    var t = model.t;
    var min = model2d.getMinAnyArray(t);
    var max = model2d.getMaxAnyArray(t);
    var scale = 255/(max - min);
    var temp;
    var imageData = ctx.getImageData(0, 0, 100, 100);
    var data = imageData.data;
    var pix_index = 0;
    for (var y = 0; y < rows; y++) {
        ycols = y * rows;
        pix_index = y * 400;
        for (var x = 0; x < columns; x++) {
            temp = model.t[ycols + x];
            hue =  Math.abs(Math.round(scale * temp - min) - 255);
            data[pix_index]     = red_color_table[hue];
            data[pix_index + 1] = blue_color_table[hue];
            data[pix_index + 2] = green_color_table[hue];
            data[pix_index + 3] = 255;
            pix_index += 4;
        }
    };
    ctx.putImageData(imageData, 0, 0);
}

model2d.displayTemperatureTable = function(destination, model) {
    var columns = model.nx;
    var rows = model.ny;
    var ycols, ycols_plus_x;
    var temp;
    var tableStr = "";
    for (y = 0; y < rows; y++) {
        ycols = y * rows;
        for (x = 0; x < columns; x++) {
            ycols_plus_x = ycols + x;
            temp = model.t[ycols_plus_x];
            tableStr += sprintf("%2.0f ", temp);
        }
        tableStr += '\n';
    }
    destination.innerHTML = tableStr;
}

// export namespace
if (root !== 'undefined') root.model2d = model2d;
})();

function do_benchmark() {
    var model = new model2d.Model2D();
    var nsteps = 9;

    //var t0 = (new Date()).getTime();
    for (var i = 0; i < nsteps; ++i) {
	model2d.addHotSpot(model, 50.0);
	model.nextStep();
    }
    //var t1 = (new Date()).getTime();
    //print("" + nsteps + " steps: " + (t1-t0) + "ms (" + Math.round(1000/((t1-t0)/nsteps)) + " fps)");
}

do_benchmark();
