import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Card from 'react-bootstrap/Card'
import TooltipBootstrap from 'react-bootstrap/Tooltip' //Name is changed to avoid recharts conflict
import {Tooltip, Scatter, XAxis, YAxis, ScatterChart, Legend} from "recharts"
import {produce} from 'immer'
import { useEffect, useState } from 'react'
import AutoSizer from "react-virtualized-auto-sizer";

function SweepPlotting(props) {
    const [showConfigModal, setShowConfigModal] = useState(false)
    const [showXModal, setShowXModal] = useState(false)

    const [numCycles, setNumCycles] = useState(1)
    const [initCode, setInitCode] = useState("print(fridge_item['fridge']) #Print the fridge \nprint(sweep_cycle_count) #Prints the number of cycles")
    const [cycleCode, setCycleCode] = useState("print(sweep_cycle) \n#Try modifying fridge_item (It resets to the default value after every cycle) \n#fridge_item['fridge']['cables'][0]['inputSignalPower'] = sweep_cycle")
    const [lastErr, setLastErr] = useState(false)

    const [sweepType, setSweepType] = useState("passiveLoad")
    const [cableGraphed, setCableGraphed] = useState(0)

    const [xArray, setXArray] = useState([]) //Array of strings used to find deeply nested items in the fridge
    
    const [chartYLabel, setChartYLabel] = useState("Heat Load (K)")
    const [scatterPoints, setScatterPoints] = useState({})

    const [xSelection, setXSelection] = useState(0) //X-axis (0 - Cycle, 1 - DOF, 2 - Custom)

    //Sweep config sidebar stuff
    const [advanced, setAdvanced] = useState(false) //Use advanced or basic sweep
    const [variables, setVariables] = useState([])
    const [editingVariable, setEditingVariable] = useState(false) //Hide new variable button if true
    const [params, setParams] = useState([])
    const [editingParam, setEditingParam] = useState(false) //Hide new param button if true

    const [freedomArray, setFreedomArray] = useState([])
    const [freedomString, setFreedomString] = useState("")
    const [freedomCode, setFreedomCode] = useState("")

    const [sweepButton, setSweepButton] = useState(true)
    const [yAxisIndex, setYAxisIndex] = useState(0) //Used to set the scale of the y-Axis (Linear, logarithmic, ETC)
    const [joinLineIndex, setJoinLineIndex] = useState(0) //For joining the points on the scatter plot

    const [varHelp, setVarHelp] = useState(false)
    const [freedomHelp, setFreedomHelp] = useState(false)
    const [cycleHelp, setCycleHelp] = useState(false)

    useEffect(() => {
        if(freedomCode === "" || !params.every(param => param.code !== "")) setSweepButton(false)
        else setSweepButton(true)
    }, [variables, params, freedomArray, freedomString, freedomCode])

    //For Sweeping when advanced modal is closed
    useEffect(() => {
        if(showConfigModal === true) return; //Don't redo sweep if they've just opened the config modal
        performSweep()
    }, [sweepType, xArray, showConfigModal, cableGraphed])

    useEffect(() => {
        setXSelection(0) 
        setXArray([])
    }, [advanced])

    //Function for performing the sweep
    const performSweep = () => {
        try {
            if(sweepType === "passiveLoad" || sweepType === "activeACLoad" || sweepType === "activeDCLoad") setChartYLabel("Heat Load (K)")
            else setChartYLabel("Noise (dBA)")
            setLastErr(false)
            let fridgeData = props.pyodide.toPy({fridge: props.fridge})
            props.pyodide.globals.set("fridge_item", fridgeData)

            //Define the # of cycles
            let cycleCount = 1
            if(!advanced) {
                variables.forEach(variable => props.pyodide.runPython(`${variable.name} = ${variable.itemArrayString}`))
                props.pyodide.runPython(`dof_array = ${freedomCode}`)
                cycleCount = props.pyodide.runPython(`len(dof_array)`)
            }
            else cycleCount = numCycles
            props.pyodide.globals.set("sweep_cycle_count", cycleCount)

            if(advanced) props.pyodide.runPython(initCode)
            
            let result //Result after each sweep
            let resObject = {};
            resObject[0] = []
            resObject[1] = []
            resObject[2] = []
            resObject[3] = []
            resObject[4] = []
            if(sweepType === "driveNoise" || sweepType === "fluxNoise") resObject["RT"] = []

            let failNaN = false //This reverts to using the interval as the x-axis if the selected interval is NaN

            for(let i = 0; i < cycleCount; i++) {
                fridgeData = props.pyodide.toPy({fridge: props.fridge})
                props.pyodide.globals.set("fridge_item", fridgeData)
                props.pyodide.globals.set("sweep_cycle", i)
                //Update DOF
                if(!advanced) {
                    props.pyodide.runPython(`${freedomString} = dof_array[${i}]`)
                    variables.forEach(variable => props.pyodide.runPython(`${variable.name} = ${variable.itemArrayString}`))
                    params.forEach(param => props.pyodide.runPython(`${param.itemArrayString} = ${param.code}`)) //TODO: Per-Cycle changes
                } 
                else props.pyodide.runPython(cycleCode) //Basic Code
                
                if(sweepType === "passiveLoad") result = JSON.parse(props.pyodide.runPython(`json_to_function.passive_load(fridge_item)`))[cableGraphed]
                else if(sweepType === "activeACLoad") result = JSON.parse(props.pyodide.runPython(`json_to_function.active_load_AC(fridge_item)`))[cableGraphed]
                else if(sweepType === "activeDCLoad") result = JSON.parse(props.pyodide.runPython(`json_to_function.active_load_DC(fridge_item)`))[cableGraphed]
                else if(sweepType === "driveNoise") result = JSON.parse(props.pyodide.runPython(`json_to_function.drive_noise(fridge_item)`))[cableGraphed]
                else if(sweepType === "fluxNoise") result = JSON.parse(props.pyodide.runPython(`json_to_function.flux_noise(fridge_item)`))[cableGraphed]

/*                 if(sweepType === "passiveLoad") result = JSON.parse(props.pyodide.runPython(passiveLoadCode))[cableGraphed]
                else if(sweepType === "activeACLoad") result = JSON.parse(props.pyodide.runPython(activeACLoadCode))[cableGraphed]
                else if(sweepType === "activeDCLoad") result = JSON.parse(props.pyodide.runPython(activeDCLoadCode))[cableGraphed]
                else if(sweepType === "driveNoise") result = JSON.parse(props.pyodide.runPython(driveNoiseCode))[cableGraphed]
                else if(sweepType === "fluxNoise") result = JSON.parse(props.pyodide.runPython(fluxNoiseCode))[cableGraphed] */

                let sweepFridge = JSON.parse(props.pyodide.runPython("json.dumps(fridge_item)")).fridge
                if(!failNaN) for(let j in xArray) {
                    sweepFridge = sweepFridge[xArray[j]]
                }
                if(failNaN || isNaN(sweepFridge)) {
                    failNaN = true
                    sweepFridge = i
                }
                if(xArray.length === 0) sweepFridge = i

                resObject[0].push({x: sweepFridge, y: result[0]})//Stage 0
                resObject[1].push({x: sweepFridge, y: result[1]})//Stage 1
                resObject[2].push({x: sweepFridge, y: result[2]})//Stage 2
                resObject[3].push({x: sweepFridge, y: result[3]})//Stage 3
                resObject[4].push({x: sweepFridge, y: result[4]})//Stage 4
                if(sweepType === "driveNoise" || sweepType === "fluxNoise") resObject["RT"].push({x: sweepFridge, y: result["RT"]})//Stage RT
            }
            setScatterPoints(resObject)
        }
        catch(e) {
            console.log(e)
            setLastErr(true)
        }
    }

    return(
        <>
            {/* Advanced configuration modal */}
            <Modal size='xl' show={showConfigModal} onHide={() => {setShowConfigModal(false)}}>
                <Modal.Header closeButton/>
                <Modal.Body style={{textAlign: "center"}}>  
                    <Form.Label>Number Of Sweeps</Form.Label>
                    <Form.Control type="number" value={numCycles} onChange={e => setNumCycles(e.target.value > 0 && e.target.value < 1000 ? parseInt(e.target.value) : parseInt(Math.min(Math.max(e.target.value, 1), 999)))}/>
                    <Form.Label>Initialisation Code</Form.Label>
                    <Form.Control placeholder={"print(fridge_item['fridge']) #Print the fridge \nprint(sweep_cycle_count) #Prints the number of cycles"}  as="textarea" rows="10" value={initCode} onChange={e => setInitCode(e.target.value)}/>
                    <Form.Label>Pre-Sweep Code</Form.Label>
                    <Form.Control as="textarea" rows="10" value={cycleCode} onChange={e => setCycleCode(e.target.value)}/>
                </Modal.Body>
            </Modal>
            {/* X -Axis selection modal */}
            <Modal size='xl' show={showXModal} onHide={() => {setShowXModal(false); setXSelection(0); setXArray([]);}}>
                <Modal.Header closeButton/>
                <Modal.Body style={{textAlign: "center"}}>  
                    <Form.Label>Select which value will be used as the y-axis</Form.Label>
                    <RecursiveXList items={props.fridge} xArray={[]} setShowXModal={setShowXModal} setXSelection={setXSelection} setXArray={setXArray} />
                </Modal.Body>
            </Modal>
            <div style={{display: "grid", padding: "0.5em", gridTemplateColumns: "1fr auto 3fr", gridTemplateRows: "auto 1fr auto", height: "100%", overflow: "clip", gridGap: "0.3em"}}>
                <div style={{gridRow: "1 / span 3", overflowY: "auto"}}>
                    <div style={{display: "grid", gridTemplateColumns: "auto auto"}}>
                        <Button variant={advanced ? "outline-primary" : "primary"} onClick={() => setAdvanced(false)}>Basic Sweep</Button>
                        <Button variant={advanced ? "primary" : "outline-primary"} onClick={() => setAdvanced(true)}>Advanced Sweep</Button>
                    </div>
                    <hr/>
                    {
                        advanced ?
                        <>
                            {lastErr && <p style={{gridRow: "1 / span 3"}}>There was an error with your sweeping code. Check console for details.</p>}
                            <Button style={{width: "100%"}} onClick={() => setShowConfigModal(true)}>Open Sweep Config</Button>
                        </>
                        :
                        <>
                            <Button style={{width: "100%"}} disabled={!sweepButton} onClick={() => {
                                setSweepButton(false)
                                performSweep()
                            }}>Perform Sweep</Button>
                            {lastErr && <p style={{gridRow: "1 / span 3"}}>There was an error with your sweeping code. Check console for details.</p>}
                            <hr/>
                            <div style={{display: "grid", gridTemplateColumns: "1fr auto", padding: "0.2em" }}>
                                <p style={{textAlign: "center", margin: "auto"}}>Degree of Freedom</p>
                                <Button variant={freedomHelp ? "primary" : "outline-primary"} onClick={() => setFreedomHelp(!freedomHelp)}>?</Button>
                                {freedomHelp && 
                                
                                    <Card style={{gridColumn: "1 / span 2"}}>
                                        <p>This is the degree of freedom, representing the independent variable. Enter a Python expression to define an array of values, E.G. [0, 2, 10]. Numpy is available, but must be referenced using np, E.G. np.linspace(0, 10, 25).</p>
                                    </Card>
                                }
                            </div>
                            <RecursiveDOF items={props.fridge} xVarArray={[]} freedomCode={freedomCode} setFreedomCode={setFreedomCode} setFreedomString={setFreedomString} setFreedomArray={setFreedomArray}/>
                            <hr/>
                            <div style={{display: "grid", gridTemplateColumns: "1fr auto", padding: "0.2em" }}>
                                <p style={{textAlign: "center", margin: "auto"}}>Variables</p>
                                <Button variant={varHelp ? "primary" : "outline-primary"} onClick={() => setVarHelp(!varHelp)}>?</Button>
                                {varHelp && 
                                
                                    <Card style={{gridColumn: "1 / span 2"}}>
                                        <p>Use variables when you want to make a per-cycle change relative to another parameter. For each cycle, the variable will be reassigned to the newest value of the parameter, after the per-cycle changes have been performed.</p>
                                    </Card>
                                }
                            </div>
                            {
                                variables.map((variable, i) => (
                                    <Card>
                                        {
                                            variable.itemArray === null ?
                                            <div style={{display: "grid", gridTemplateColumns: "auto auto"}}>
                                                <RecursiveVarList items={props.fridge} xVarArray={[]} setVariables={setVariables} setEditingVariable={setEditingVariable} i={i}/>
                                            </div>
                                            :
                                            <div style={{display: "grid", gridTemplateColumns: "1fr auto"}}>
                                                <p style={{textAlign: "center"}}>Name: {variable.name}</p> 
                                                <Button variant="danger" onClick={() => {
                                                    setVariables(produce(variables => {
                                                        variables.splice(i, 1)
                                                    }))
                                                }}>🗑</Button> 
                                                <p style={{gridColumn: "1 / span 2", textAlign: "center"}}>Variable: {variable.itemArray.map(variable => `[${variable}]`)}</p>
                                            </div>
                                        }
                                    </Card>
                                ))
                            }
                            {!editingVariable && <Button style={{width: "100%"}} onClick={() => {
                                setVariables(produce(variables => {
                                    variables.push({name: null, itemArray: null, itemArrayString: null})
                                }))
                                setEditingVariable(true)
                            }}>
                                + Variable
                            </Button>}
                            <hr/>
                            
                            <div style={{display: "grid", gridTemplateColumns: "1fr auto", padding: "0.2em" }}>
                                <p style={{textAlign: "center", margin: "auto"}}>Per-Cycle Changes</p>
                                <Button variant={cycleHelp ? "primary" : "outline-primary"} onClick={() => setCycleHelp(!cycleHelp)}>?</Button>
                                {cycleHelp && 
                                    <Card style={{gridColumn: "1 / span 2"}}>
                                        <p>Enter an expression that will redefine the selected parameter for each iteration of the degree of freedom. These changes are undone after each cycle, but the 'sweep_cycle' will return the index of each iteration. Use variables if you want to make per-cycle changes based upon the values of other parameters.</p>
                                    </Card>
                                }
                            </div>
                            {
                                params.map((param, i) => (
                                    <Card>
                                        {
                                            param.itemArray === null ?
                                                <div style={{display: "grid", gridTemplateColumns: "auto auto"}}>
                                                    <RecursiveParamList items={props.fridge} xVarArray={[]} setParams={setParams} setEditingParam={setEditingParam} i={i}/>
                                                </div>
                                            :
                                                <div style={{display: "grid", gridTemplateColumns: "auto auto"}}>
                                                    <p style={{ textAlign: "center"}}>Param: {param.itemArray.map(param => `[${param}]`)}</p>
                                                    <Button variant="danger" onClick={() => {
                                                        setParams(produce(params => {
                                                            params.splice(i, 1)
                                                        }))
                                                        setEditingParam(false)
                                                        
                                                    }}>🗑</Button> 
                                                    <Form.Control style={{gridColumn: "1 / span 2"}}  placeholder="New Value Expression" isInvalid={param.code === ""} value={param.code} onChange={e => {
                                                        setParams(produce(params => {
                                                            params[i].code = e.target.value
                                                        }))
                                                        setEditingParam(false)
                                                    }}/>
                                                </div>
                                        }
                                    </Card>
                                ))
                            }
                            {!editingParam && <Button style={{width: "100%"}} onClick={() => {
                                setParams(produce(params => {
                                    params.push({itemArray: null, itemArrayString: null, code: ""})
                                }))
                                setEditingParam(true)
                            }}>+ Param</Button>}
                        </>
                    }
                    <hr/>
                    <p style={{textAlign: "center"}}>Y-Axis Scale</p>
                    <Form.Check type="radio" label="Linear" checked={yAxisIndex === 0} onClick={() => setYAxisIndex(0)} />
                    <Form.Check type="radio" label="Logarithmic" checked={yAxisIndex === 1} onClick={() => setYAxisIndex(1)}/>
                    <p style={{textAlign: "center"}}>Lines Between Points</p>
                    <Form.Check type="radio" label="Enabled" checked={joinLineIndex === 0} onClick={() => setJoinLineIndex(0)} />
                    <Form.Check type="radio" label="Disabled" checked={joinLineIndex === 1} onClick={() => setJoinLineIndex(1)}/>
                </div>
                <div style={{display: "grid", gridColumn: "3 / span 1", gridTemplateColumns: "1fr auto 1fr"}}>
                    <div></div>
                    <div style={{display: "grid", gridTemplateColumns: `${"1fr ".repeat(props.fridge.cables.length)}`}}>
                        {props.fridge.cables.map((cable, index) => (
                            <Button variant={cableGraphed === index ? "primary" : "outline-primary"} onClick={() => setCableGraphed(index)}>{cable.name} ({index})</Button>
                            )
                            
                            )}
                    </div>
                    <div></div>
                </div>                                      
                <div style={{display: "grid",  gridTemplateColumns: "auto"}}>
                    <Button onClick={() => setSweepType("passiveLoad")} variant={sweepType === "passiveLoad" ? "primary" : "outline-primary"}><p style={{writingMode: "vertical-lr", margin: 0, rotate: "180deg"}}>Passive Load</p></Button>
                    <Button onClick={() => setSweepType("activeACLoad")} variant={sweepType === "activeACLoad" ? "primary" : "outline-primary"}><p style={{writingMode: "vertical-lr", margin: 0, rotate: "180deg"}}>AC Load</p></Button>
                    <Button onClick={() => setSweepType("activeDCLoad")} variant={sweepType === "activeDCLoad" ? "primary" : "outline-primary"}><p style={{writingMode: "vertical-lr", margin: 0, rotate: "180deg"}}>DC Load</p></Button>
                    <Button onClick={() => setSweepType("driveNoise")} variant={sweepType === "driveNoise" ? "primary" : "outline-primary"}><p style={{writingMode: "vertical-lr", margin: 0, rotate: "180deg"}}>Drive Noise</p></Button>
                    <Button onClick={() => setSweepType("fluxNoise")} variant={sweepType === "fluxNoise" ? "primary" : "outline-primary"}><p style={{writingMode: "vertical-lr", margin: 0, rotate: "180deg"}}>Flux Noise</p></Button>
                </div>
                {
                    props.currentTab === "sweepPlotting" && /* This is needed to stop the charting library from showing warning in console when in another tab */
                    <div style={{gridColumn: "3 / span 1", width: "100%", height: "100%"}}>                        
                        <AutoSizer>
                            {({ width, height }) =>
                                <ScatterChart width={width} height={height}>
                                    <Legend/>
                                    <XAxis type='number' dataKey="x" label={{value: xArray.length !== 0 ? xArray : "Cycle Number", position: 'bottom', offset: -5}}/>
                                    <YAxis dataKey="y" scale={yAxisIndex === 0 ? "linear" : "sqrt"} label={{value: chartYLabel, position: 'insideLeft', angle: -90,}}/>
                                    {
                                        Object.keys(scatterPoints).map((point, index) => ( //The Object.keys is needed to use the map function with an object (and not an array)
                                            <Scatter name={props.fridge.stages[index] ? props.fridge.stages[index].name : "Total"} data={scatterPoints[point]} fill={getColourFromIndex(index)} line={joinLineIndex === 0 ? {stroke: getColourFromIndex(index), strokeWidth: 2} : false}/>
                                        ))
                                    }
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Legend />
                                </ScatterChart>
                            }
                        </AutoSizer>
                    </div>
                }
                
                <div style={{display: "grid", gridColumn: "3 / span 1", gridTemplateColumns: "auto auto"}}>
                    <Button style={{whiteSpace: "nowrap"}} variant={xSelection === 0 ? "primary" : "outline-primary"} onClick={() => {setXSelection(0); setXArray([])}}>Cycle Number</Button>
                    {
                        advanced ?
                            <Button style={{whiteSpace: "nowrap"}} variant={xSelection === 2 ? "primary" : "outline-primary"} onClick={() => setShowXModal(true)}>Custom Variable {xArray.map(item => `[${item}]`)}</Button>
                        :
                            <Button style={{whiteSpace: "nowrap"}} variant={xSelection === 1 ? "primary" : "outline-primary"} onClick={() => {setXArray(freedomArray); setXSelection(1); console.log(freedomArray)}}>Degree of Freedom</Button>
                    }
                </div>
            </div>
        </>
    )
}

function RecursiveVarList(props) {
    let itemList = [] 
    try {
        itemList = Object.keys(props.items).filter(item => !isFilteredVar(item))
    }
    catch(e) {
        console.log(e)
    }
    let itemFound = itemList.length !== 0
    const[item, setItem] = useState(isNaN(itemList[0]) ? itemList[0] : itemList[0]*1)
    useEffect(() => {
        if(item === undefined) setItem(itemList[0])
    }, [itemList])
    if(!itemFound) return(<p>Invalid Item</p>)
    return (
        <>
            <Form.Select style={{gridColumn: "1 / span 2"}} onChange={e => setItem(isNaN(e.target.value) ? e.target.value : e.target.value*1)} value={item}>
                {itemList.map((item2, index) => <option disabled={(props.items[isNaN(item2) ? item2 : item2*1]) === null || (props.items[isNaN(item2) ? item2 : item2*1]) === undefined} id={item2}>{item2}</option>)}
            </Form.Select>
            {
                (typeof props.items[item] === "object") ?
                    <RecursiveVarList items={props.items[item]} xVarArray={[...props.xVarArray, item]} setVariables={props.setVariables} setEditingVariable={props.setEditingVariable} i={props.i}/> 
                :
                <>
                    <Button style={{whiteSpace: "nowrap", width: "100%"}} onClick={() => {
                        props.setVariables(produce(variables => {
                            let string = "fridge_item['fridge']"
                            variables[props.i].name = `var_${variables[props.i - 1] ? parseInt(variables[props.i - 1].name.slice(-1)) + 1 : 1}`
                            variables[props.i].itemArray = [...props.xVarArray, item]
                            variables[props.i].itemArray.forEach(item => string = string + `[${isNaN(item) ? "'" + item + "'" : item}]`)
                            variables[props.i].itemArrayString = string
                        }))
                        props.setEditingVariable(false)
                    }}>🗸</Button>    
                    <Button variant="danger" onClick={() => {
                        props.setVariables(produce(variables => {
                            variables.splice(props.i, 1)
                            props.setEditingVariable(false)
                        }))
                    }}>🗑</Button>
                </>
            }
        </>
    )
}

function RecursiveDOF(props) {
    let itemList = [] 
    try {
        itemList = Object.keys(props.items).filter(item => !isFilteredVar(item))
    }
    catch(e) {
        console.log(e)
    }
    let itemFound = itemList.length !== 0
    const[item, setItem] = useState(isNaN(itemList[0]) ? itemList[0] : itemList[0]*1)
    useEffect(() => {
        if(item === undefined) setItem(itemList[0])
    }, [itemList])
    if(!itemFound) return(<p>Invalid Item</p>)
    return (
        <>
            <Form.Select style={{gridColumn: "1 / span 2"}} onChange={e => {props.setFreedomCode(""); setItem(isNaN(e.target.value) ? e.target.value : e.target.value*1)}} value={item}>
                {itemList.map((item2, index) => <option disabled={(props.items[isNaN(item2) ? item2 : item2*1]) === null || (props.items[isNaN(item2) ? item2 : item2*1]) === undefined} id={item2}>{item2}</option>)}
            </Form.Select>
            {
                (typeof props.items[item] === "object") ?
                    <RecursiveDOF items={props.items[item]} xVarArray={[...props.xVarArray, item]} freedomCode={props.freedomCode} setFreedomCode={props.setFreedomCode} setFreedomString={props.setFreedomString} setFreedomArray={props.setFreedomArray}/> 
                :
                <>
                    <Form.Control placeholder="Python Array For DoF Variable" isInvalid={props.freedomCode === ""} value={props.freedomCode} onChange={e => {
                        let string = "fridge_item['fridge']"
                        let array = [...props.xVarArray, item]
                        array.forEach(item => string = string + `[${isNaN(item) ? "'" + item + "'" : item}]`)
                        props.setFreedomArray([...array])
                        props.setFreedomString(string)
                        props.setFreedomCode(e.target.value)
                    }} />
                </>
            }
        </>
    )
}

function RecursiveParamList(props) {
    let itemList = [] 
    try {
        itemList = Object.keys(props.items).filter(item => !isFilteredVar(item))
    }
    catch(e) {
        console.log(e)
    }
    let itemFound = itemList.length !== 0
    const[item, setItem] = useState(isNaN(itemList[0]) ? itemList[0] : itemList[0]*1)
    useEffect(() => {
        if(item === undefined) setItem(itemList[0])
    }, [itemList])
    if(!itemFound) return(<p>Invalid Item</p>)
    return (
        <>
            <Form.Select style={{gridColumn: "1 / span 2"}} onChange={e => setItem(isNaN(e.target.value) ? e.target.value : e.target.value*1)} value={item}>
                {itemList.map((item2, index) => <option disabled={(props.items[isNaN(item2) ? item2 : item2*1]) === null || (props.items[isNaN(item2) ? item2 : item2*1]) === undefined} id={item2}>{item2}</option>)}
            </Form.Select>
            {
                (typeof props.items[item] === "object") ?
                    <RecursiveParamList items={props.items[item]} xVarArray={[...props.xVarArray, item]} setParams={props.setParams} setEditingParam={props.setEditingParam} i={props.i}/> 
                :
                <>
                    <Button style={{whiteSpace: "nowrap", width: "100%"}} onClick={() => {
                        props.setParams(produce(params => {
                            let string = "fridge_item['fridge']"
                            params[props.i].itemArray = [...props.xVarArray, item]
                            params[props.i].itemArray.forEach(item => string = string + `[${isNaN(item) ? "'" + item + "'" : item}]`)
                            params[props.i].itemArrayString = string
                        }))
                        props.setEditingParam(false)
                    }}>🗸</Button>    
                    <Button variant="danger" onClick={() => {
                        props.setParams(produce(params => {
                            params.splice(props.i, 1)
                            props.setEditingParam(false)
                        }))
                    }}>🗑</Button>
                </>
            }
        </>
    )
}

function RecursiveXList(props) {
    //Map the children of an object. If one of the children is an object or array, call this function with it     
    let itemList = [] 
    try {
        itemList = Object.keys(props.items).filter(item => !isFilteredVar(item))
    }
    catch(e) {
        console.log(e)
    }
    let itemFound = itemList.length !== 0
    const[item, setItem] = useState(isNaN(itemList[0]) ? itemList[0] : itemList[0]*1)
    useEffect(() => {
        if(item === undefined) setItem(itemList[0])
    }, [itemList])
    if(!itemFound) return(<p>Invalid Item</p>)
    return (
        <>
            <Form.Select onChange={e => setItem(isNaN(e.target.value) ? e.target.value : e.target.value*1)} value={item}>
                {itemList.map((item2, index) => <option disabled={(props.items[isNaN(item2) ? item2 : item2*1]) === null || (props.items[isNaN(item2) ? item2 : item2*1]) === undefined} id={item2}>{item2}</option>)}
            </Form.Select>
            {
                (typeof props.items[item] === "object") ?
                    <RecursiveXList items={props.items[item]} xArray={[...props.xArray, item]} setShowXModal={props.setShowXModal} setXSelection={props.setXSelection} setXArray={props.setXArray} /> 
                :
                <Button style={{whiteSpace: "nowrap", width: "100%"}} onClick={() => {props.setXArray([...props.xArray, item]); props.setShowXModal(false); props.setXSelection(2)}}>Set Custom Axis</Button>    
            }
        </>
    )
}

function isFilteredVar(variable) {
    const filteredVars = ["name", "materialName", "quantity", "thermCondCoaxco", "cAtt300Coaxco", "cAtt4Coaxco", "isAC", "custAtt", "custCond", "custAttText", "custCondText", "overriding", "thermalisation", "thermalisationOverride"] //List of variables that shouldn't be used as a var or as the axis (E.G. the name of a stage)
    return filteredVars.includes(variable)
}

function getColourFromIndex(index) {
    index = index % 5;
    switch(index) {
        case 0: return "#AA0000"
        case 1: return "#00AA00"
        case 2: return "#0000FF"
        case 3: return "#AA0077"
        case 4: return "#AA6600"
        case 5: return "#00FF77"
        default: return "#3300FF"
    }
}


export default SweepPlotting