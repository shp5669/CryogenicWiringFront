export function cableConstructor(name, materialName, quantity, diameters, thermCondCoaxco, cAtt300Coaxco, cAtt4Coaxco, rhoCoaxco, custAtt, custCond) {
    return {
        name: name, //Name of cable E.G. "FLUX LINE"
        materialName: materialName, //The name of the material being used 
        quantity: quantity,
        
        //Material-Related Params
        innerPinDiameter: diameters[0],
        dielectricDiameter: diameters[1],
        outerConductorDiameter: diameters[2],
        attenuators: [null, null, null, null, null], //Is there an attenuator at each stage?
        //Thermal conducticity function params
        thermCondCoaxco: thermCondCoaxco,//conductivity: //Complete [0.3e-5. "119"] (119/219)
        //Cable Attenuation function params
        cAtt300Coaxco: cAtt300Coaxco, //E.G [5.3, 7.5, 16.9, 24.0, 34.1]
        cAtt4Coaxco: cAtt4Coaxco, //E.G [0.3, 0.5, 1.1, 1.5, 2.2]
        //Cable Resistivity
        rhoCoaxco: rhoCoaxco, // E.G 1.7e-8
        //Microwave or DC
        isAC: true, 
        inputSignalPower: 0, //AC
        dutyCycle: 1, //0-1
        inputSignalFrequency: 0, //AC
        inputCurrent: 0, //DC

        //Custom functions
        custAtt: custAtt,
        custCond: custCond,
        
        //Thermalisation after calculation
        overriding: false,
        thermalisation: [ //The outer pin is thermalised by default
            [false, false, false], 
            [false, false, false], 
            [false, false, false], 
            [false, false, false], 
            [false, false, false]
        ],

        thermalisationOverride: [
            [false, false, false],
            [false, false, false],
            [false, false, false],
            [false, false, false],
            [false, false, false],
        ],
    }
}


export function cableFactory(materialName) {
    let diameters = getDiameters(materialName)
    let thermCondCoaxco = getThermCondCoaxco(materialName)
    let cAtt300Coaxco = getCAtt300Coaxco(materialName)
    let cAtt4Coaxco = getCAtt4Coaxco(materialName)
    let rhoCoaxco = getRhoCoaxco(materialName)

    return cableConstructor("Untitled Load", materialName, 1, [diameters[0], diameters[1], diameters[2]], thermCondCoaxco, cAtt300Coaxco, cAtt4Coaxco, rhoCoaxco, null, null)
}

export function customCableFactory(materialName, diameters, thermCondCoaxco, cAtt300Coaxco, cAtt4Coaxco, rhoCoaxco) {
    return cableConstructor("Untitled Load", materialName, 1, diameters, thermCondCoaxco, cAtt300Coaxco, cAtt4Coaxco, rhoCoaxco, null, null)
}

export function getDiametersFromPrefix(prefix) {
    switch(prefix) {
        case '219': return [0.510e-3, 1.67e-3, 2.19e-3]
        case '119': return [0.287e-3, 0.94e-3, 1.19e-3]
        default: return [0, 0, 0]; //This shouldn't happen
    }
}

export function getDiameters(name) {
    switch(name) {
        case '119-AgBeCu-BeCu': return getDiametersFromPrefix('119')
        case '119-NbTi-NbTi': return getDiametersFromPrefix('119')
        case '119-SS-SS': return getDiametersFromPrefix('119')
        case '119-AgSS-SS': return getDiametersFromPrefix('119')
        case '119-CuNi-CuNi': return getDiametersFromPrefix('119')
        case '119-AgCuNi-CuNi': return getDiametersFromPrefix('119')
        case '119-BeCu-BeCu': return getDiametersFromPrefix('119')
        case '219-NbTi-NbTi': return getDiametersFromPrefix('219')
        case '219-CuNi-CuNi': return getDiametersFromPrefix('219')
        case '219-AgCuNi-CuNi': return getDiametersFromPrefix('219')
        case '219-SS-SS': return getDiametersFromPrefix('219')
        case '219-AgSS-SS': return getDiametersFromPrefix('219')
        case '219-BeCu-BeCu': return getDiametersFromPrefix('219')
        case '219-AgBeCu-BeCu': return getDiametersFromPrefix('219')
        default: return [0, 0, 0] //This shouldn't happen
    }
}

export function getThermCondCoaxco(name) {
    switch(name) {
        case '119-AgBeCu-BeCu': return[1.74e-4, '119']
        case '119-NbTi-NbTi': return[7.54e-6, '119']
        case '119-SS-SS': return[1.32e-5, '119']
        case '119-AgSS-SS': return[9.95e-5, '119']
        case '119-CuNi-CuNi': return[1.74e-5, '119']
        case '119-AgCuNi-CuNi': return[1.04e-4, '119']
        case '119-BeCu-BeCu': return[9.10e-5, '119']
        case '219-NbTi-NbTi': return[2.64e-5, '219']
        case '219-CuNi-CuNi': return[6.30e-5, '219']
        case '219-AgCuNi-CuNi': return[2.18e-4, '219']
        case '219-SS-SS': return[4.3e-5, '219']        
        case '219-AgSS-SS': return[2.02e-4, '219']
        case '219-BeCu-BeCu': return[2.96e-4, '219']
        case '219-AgBeCu-BeCu': return[4.88e-4, '219']
        default: return [0, ''] //This shouldn't happen
    } 
}

export function getCAtt300Coaxco(name) {
    switch(name) {
        case '119-AgBeCu-BeCu': return[1.0, 1.4, 3.1, 4.4, 6.3]
        case '119-NbTi-NbTi': return[5.3, 7.5, 16.9, 24.0, 34.1]
        case '119-SS-SS': return[5.3, 7.4, 16.6, 23.5, 33.3]
        case '119-AgSS-SS': return[1.8, 2.6, 5.8, 8.2, 11.6]
        case '119-CuNi-CuNi': return[3.8, 5.4, 12.0, 17.0, 24.0]
        case '119-AgCuNi-CuNi': return[1.5, 2.1, 4.7, 6.7, 9.5]
        case '119-BeCu-BeCu': return[1.6, 2.3, 5.1, 7.3, 10.5]
        case '219-NbTi-NbTi': return[3.0, 4.3, 9.6, 13.6, 19.4]
        case '219-CuNi-CuNi': return[2.4, 3.4, 7.6, 10.8, 15.5]
        case '219-AgCuNi-CuNi': return[0.8, 1.2, 2.7, 3.8, 5.3]
        case '219-SS-SS': return[3.0, 4.2, 9.4, 13.5, 19.2]
        case '219-AgSS-SS': return[1.0, 1.5, 3.3, 4.6, 6.5]
        case '219-BeCu-BeCu': return[0.9, 1.3, 2.9, 4.1, 5.8]
        case '219-AgBeCu-BeCu': return[0.6, 0.8, 1.8, 2.5, 3.5]
        default: return [0, 0, 0, 0, 0] //This shouldn't happen
    }
}

export function getCAtt4Coaxco(name) {
    switch(name) {
        case '119-AgBeCu-BeCu': return[0.3, 0.5, 1.1, 1.5, 2.2]
        case '119-NbTi-NbTi': return[0, 0, 0, 0, 0]
        case '119-SS-SS': return[3.3, 4.7, 10.4, 14.7, 20.8]
        case '119-AgSS-SS': return[0.8, 1.2, 2.6, 3.7, 5.2]
        case '119-CuNi-CuNi': return[2.9, 4.1, 9.1, 12.9, 18.3]
        case '119-AgCuNi-CuNi': return[0.7, 1.0, 2.3, 3.3, 4.6]
        case '119-BeCu-BeCu': return[1.3, 1.8, 4.0, 5.6, 7.9]
        case '219-NbTi-NbTi': return[0,0,0,0,0]
        case '219-CuNi-CuNi': return[1.6, 2.3, 5.1, 7.2, 10.2]
        case '219-AgCuNi-CuNi': return[0.4, 0.6, 1.3, 1.8, 2.6]
        case '219-SS-SS': return[1.9, 2.6, 5.9, 8.3, 11.7]
        case '219-AgSS-SS': return[0.5, 0.7, 1.5, 2.1, 2.9]
        case '219-BeCu-BeCu': return[0.7, 1.0, 2.2, 3.2, 4.5]
        case '219-AgBeCu-BeCu': return[0.2, 0.3, 0.6, 0.9, 1.2]
        default: return [0, 0, 0, 0, 0] //This shouldn't happen
    }
}

export function getRhoCoaxcoFromPrefix(material) {
    switch(material) {
        case 'SS': return 72e-8
        case 'CuNi': return 37.5e-8
        case 'Ncasei': return 14.6e-8
        case 'Cu': return 1.7e-8
        case 'Ag': return 1.642e-8
        default: return 0
    } 
}

export function getRhoCoaxco(name) {
    switch(name) {
        case '119-AgBeCu-BeCu': return getRhoCoaxcoFromPrefix('Cu')
        case '119-AgCuNi-CuNi': return getRhoCoaxcoFromPrefix('CuNi')
        case '119-AgSS-SS': return getRhoCoaxcoFromPrefix('SS')
        case '119-BeCu-BeCu': return getRhoCoaxcoFromPrefix('Cu')
        case '119-CuNi-CuNi': return getRhoCoaxcoFromPrefix('CuNi')
        case '119-NbTi-NbTi': return 0
        case '119-SS-SS': return getRhoCoaxcoFromPrefix('SS')
        case '219-NbTi-NbTi': return 0
        case '219-CuNi-CuNi': return getRhoCoaxcoFromPrefix('CuNi')
        case '219-AgCuNi-CuNi': return getRhoCoaxcoFromPrefix('CuNi')
        case '219-SS-SS': return getRhoCoaxcoFromPrefix('SS')
        case '219-AgSS-SS': return getRhoCoaxcoFromPrefix('SS')
        case '219-BeCu-BeCu': return getRhoCoaxcoFromPrefix('Cu')
        case '219-AgBeCu-BeCu': return getRhoCoaxcoFromPrefix('Cu')
        default: return 0 //This shouldn't happen
    }
}


export const cableList = [
        "119-AgBeCu-BeCu",
        "119-AgCuNi-CuNi",
        "119-AgSS-SS",
        "119-BeCu-BeCu",
        "119-CuNi-CuNi",
        "119-NbTi-NbTi",
        "119-SS-SS",
        "219-AgBeCu-BeCu",
        "219-AgCuNi-CuNi",
        "219-AgSS-SS",
        "219-BeCu-BeCu",
        "219-CuNi-CuNi",
        "219-NbTi-NbTi",
        "219-SS-SS",
]
