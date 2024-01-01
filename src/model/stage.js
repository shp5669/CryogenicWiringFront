export function stageConstructor(name, maxTemp, lengthFromPrev, powerBudget) {
    return {
        name: name,
        maxTemp: maxTemp,
        powerBudget: powerBudget,
        lengthFromPrev: lengthFromPrev,
    }
}

export const fridgeNoPresetStages = [
    stageConstructor('', undefined, undefined, undefined),
    stageConstructor('', undefined, undefined, undefined),
    stageConstructor('', undefined, undefined, undefined),
    stageConstructor('', undefined, undefined, undefined),
    stageConstructor('', undefined, undefined, undefined),
]

export const fridge100QStages = [
    stageConstructor('50K', 35, 0.2, 0),
    stageConstructor('4K', 2.85, 0.29, 0),
    stageConstructor('Still', 0.882, 0.25, 0),
    stageConstructor('CP', 0.082, 0.170, 0),
    stageConstructor('MXC', 0.006, 0.140, 0)
]

export const fridgeUTSStages = [
    stageConstructor('50K', 46, 0.236, 10),
    stageConstructor('4K', 3.94, 0.337, 0.5),
    stageConstructor('Still', 1.227, 0.3, 30e-3),
    stageConstructor('CP', 0.150, 0.115, 300e-6),
    stageConstructor('MXC', 0.020, 300e-6, 20e-6)
]