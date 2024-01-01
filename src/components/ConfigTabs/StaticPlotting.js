import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Card from 'react-bootstrap/Card'
import Modal from 'react-bootstrap/Modal'
import { useState, useEffect } from 'react'
import {produce} from 'immer'
import {BarChart, Bar, Tooltip, Legend, XAxis, YAxis, ResponsiveContainer} from "recharts"

function StaticPlotting(props) {
    console.log(JSON.stringify(props.fridge))
    const [chartType, setChartType] = useState("passiveLoads")
    const [heatLoads, setHeatLoads] = useState([]);
    const [showModal, setShowModal] = useState(false)
    const [chartMode, setChartMode] = useState(0) //0 - Chart heat, 1 - Chart noise
    
    const [heatLoadArray, setHeatLoadArray] = useState([props.fridge.stages[0].name, props.fridge.stages[1].name, props.fridge.stages[2].name, props.fridge.stages[3].name, props.fridge.stages[4].name])
    const [noiseLoadArray, setNoiseLoadArray] = useState([props.fridge.stages[0].name, props.fridge.stages[1].name, props.fridge.stages[2].name, props.fridge.stages[3].name, props.fridge.stages[4].name, "All (RT)"])
    useEffect(() => { //Updates stages names whenever the fridge has changed, in case the names have changed
        setHeatLoadArray(produce(heatLoadArray => {
            for(let i in heatLoadArray) {
                heatLoadArray[i] = props.fridge.stages[i].name
            }
        }))
        setNoiseLoadArray(produce(noiseLoadArray => {
            for(let i in noiseLoadArray) {
                if(i < props.fridge.stages.length) noiseLoadArray[i] = props.fridge.stages[i].name
            }
        }))
    }, [props.fridge])

    //Heat Load Menu
    const [heatStages, setHeatStages] = useState([true, true, true, true, true])
    const [heatCableType, setHeatCableType] = useState(0)
    const [heatType, setHeatType] = useState(2)
    //Noise Calculation Menu
    const [noiseStages, setNoiseStages] = useState([true, true, true, true, true, true])
    const [noiseType, setNoiseType] = useState(0)

    useEffect(() => {
        const getLoads = async () => {
            let fridgeData = props.pyodide.toPy({fridge: props.fridge})
            props.pyodide.globals.set("fridge_item", fridgeData)

            let passiveLoads = JSON.parse(props.pyodide.runPython(`json_to_function.passive_load(fridge_item)`))
            let activeACLoads = JSON.parse(props.pyodide.runPython(`json_to_function.active_load_AC(fridge_item)`))
            let activeDCLoads = JSON.parse(props.pyodide.runPython(`json_to_function.active_load_DC(fridge_item)`))
            let driveNoise = JSON.parse(props.pyodide.runPython(`json_to_function.drive_noise(fridge_item)`))
            let fluxNoise = JSON.parse(props.pyodide.runPython(`json_to_function.flux_noise(fridge_item)`))
            
            //Find the cable groups (unique names)
            let groups = new Set()
            for(let i in props.fridge.cables) groups.add(props.fridge.cables[i].name)
            let arr = Array.from(groups)
    
            setHeatLoads(produce(heatLoads => {
                heatLoads.splice(0) //Reset heatloads
                
                //Go through each unique name given
                for(let i in arr) { //Iterate through each name
                    heatLoads.push({
                        name: arr[i],
                        passiveLoads: [0, 0, 0, 0, 0],
                        passiveACLoads: [0, 0, 0, 0, 0], //For graphing
                        passiveDCLoads: [0, 0, 0, 0, 0], //For graphing
                        activeACLoads: [0, 0, 0, 0, 0],
                        activeDCLoads: [0, 0, 0, 0, 0],
                        //NOTE: Noises have one more value for 'RT'
                        //NOTE: The LAST value is the 'RT'
                        noisePhotons: [0, 0, 0, 0, 0, 0],
                        noiseCurrent: [0, 0, 0, 0, 0, 0],
                        noiseVoltage: [0, 0, 0, 0, 0, 0]
                    })
    
                    for(let j in props.fridge.cables) { //Iterate through each cable
                        if(props.fridge.cables[j].name === arr[i]) { //If the cable matches the name
                            for(let x = 0; x < 5; x++) heatLoads[i].passiveLoads[x] += passiveLoads[j][x]*props.fridge.cables[j].quantity
                            if(props.fridge.cables[j].isAC) {
                                for(let x = 0; x < 5; x++) heatLoads[i].passiveACLoads[x] += passiveLoads[j][x]*props.fridge.cables[j].quantity
                            }
                            else {
                                for(let x = 0; x < 5; x++) heatLoads[i].passiveDCLoads[x] += passiveLoads[j][x]*props.fridge.cables[j].quantity
                            }
                            for(let x = 0; x < 5; x++) heatLoads[i].activeACLoads[x] += activeACLoads[j][x]*props.fridge.cables[j].quantity
                            for(let x = 0; x < 5; x++) heatLoads[i].activeDCLoads[x] += activeDCLoads[j][x]*props.fridge.cables[j].quantity
    
                            for(let x = 0; x < 5; x++) {
                                if(driveNoise[j][x] >= heatLoads[i].noisePhotons[x]) {
                                    heatLoads[i].noisePhotons[x] = driveNoise[j][x]
                                }
                            }
                            if(driveNoise[j]['RT'] >= heatLoads[i].noisePhotons[5]) {
                                heatLoads[i].noisePhotons[5] = driveNoise[j]['RT']
                            }

                            for(let x = 0; x < 5; x++) {
                                if(fluxNoise[j][x] >= heatLoads[i].noiseCurrent[x]) {
                                    heatLoads[i].noiseCurrent[x] = fluxNoise[j][x]
                                }
                            }
                            if(fluxNoise[j]['RT'] >= heatLoads[i].noiseCurrent[5]) {
                                heatLoads[i].noiseCurrent[5] = fluxNoise[j]['RT']
                            }

                            for(let x = 0; x < 5; x++) {
                                if(fluxNoise[j][x]*50 >= heatLoads[i].noiseVoltage[x]) {
                                    heatLoads[i].noiseVoltage[x] = fluxNoise[j][x]*50
                                }
                            }
                            if(fluxNoise[j]['RT']*50 >= heatLoads[i].noiseVoltage[5]) {
                                heatLoads[i].noiseVoltage[5] = fluxNoise[j]['RT']*50
                            }
                        }
                    }
                }
                return heatLoads
            }))
        }
        if(props.tab === "plotting") {
            getLoads()
        }
    }, [props.fridge, props.tab, props.pyodide])

    return( 
        <>
            <Modal size='xl' show={showModal} onHide={() => setShowModal(false)}         >
                <Modal.Header closeButton>Heat Load And Noise Tables</Modal.Header>
                <Modal.Body>
                    <div style={styles.buttonGrid}>
                        <Button onClick={() => setChartType("passiveLoads")} variant={chartType === "passiveLoads" ? "primary" : "outline-primary"}>Passive Load</Button>
                        <Button onClick={() => setChartType("passiveACLoads")} variant={chartType === "passiveACLoads" ? "primary" : "outline-primary"}>Passive Load (AC Cables Only)</Button>
                        <Button onClick={() => setChartType("passiveDCLoads")} variant={chartType === "passiveDCLoads" ? "primary" : "outline-primary"}>Passive Load (DC Cables Only)</Button>
                        <Button onClick={() => setChartType("activeACLoads")} variant={chartType === "activeACLoads" ? "primary" : "outline-primary"}> Active AC Load</Button>
                        <Button onClick={() => setChartType("activeDCLoads")} variant={chartType === "fetchActiveDCLoad" ? "primary" : "outline-primary"}>Active DC Load</Button>
                        <Button onClick={() => setChartType("noisePhotons")} variant={chartType === "noisePhotons" ? "primary" : "outline-primary"}>Noise Photons</Button>
                        <Button onClick={() => setChartType("noiseCurrent")} variant={chartType === "noiseCurrent" ? "primary" : "outline-primary"}>Noise Current</Button>
                        <Button onClick={() => setChartType("noiseVoltage")} variant={chartType === "noiseVoltage" ? "primary" : "outline-primary"}>Noise Voltage</Button>                        
                    </div>
                    
                        <div style={{display: "grid", gridTemplateColumns: `auto ${"1fr ".repeat(heatLoads.length)}`}}>
                            {/* BEGIN TOP ROW */}
                            <p></p>
                            {heatLoads.map((heatLoad, index) => <p key={index} style={{fontWeight: "bold", textAlign: "center"}}>{heatLoad.name}</p>)}
                            {/* END TOP ROW */}
                            {heatLoads[0] && heatLoads[0][chartType].map((load, index) => //Creates the cols, 5 for loads, 6 for noises due to RT
                                <>
                                    {index !== 5 ? 
                                        <p key={index}>{props.fridge.stages[index].name}</p>
                                        : 
                                        <p key={index} style={{fontWeight: "bold", textAlign: "center"}}>(RT)</p>}
                                    {heatLoads.map((heatLoad, index2) => 
                                        <Card key={index}>
                                            <p style={{textAlign: "center"}}>{heatLoad[chartType][index]}</p> 
                                        </Card>
                                    )}
                                </>
                            )}
                            
                        </div>
                    
                </Modal.Body>
            </Modal>
            <div style={{display: "grid", gridTemplateColumns: "auto 1fr", height: "100%", padding: "0.5em"}}>
                <Form style={{width: "100%", height: "100%"}}>
                    <div style={styles.rowDiv}>
                        <div style={styles.colDiv}>
                            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gridRowGap: "0.2em"}}>
                                <Button style={{gridColumn: "1 / span 2"}} onClick={() => setShowModal(true)}>Open Heat Load And Noise Tables</Button>                        
                                <Button variant={chartMode === 0 ? "primary" : "outline-primary"} onClick={() => setChartMode(0)}>Graph Heat</Button>
                                <Button variant={chartMode === 1 ? "primary" : "outline-primary"} onClick={() => setChartMode(1)}>Graph Noise</Button>
                            </div>
                            {
                                chartMode === 0 &&
                                <>
                                    <div>
                                        <p>Stages Included</p>
                                        {/* This might need to be dynamic*/}
                                        {props.fridge.stages.map((stage, index) => 
                                            <Form.Check type={"checkbox"} key={index} label={stage.name} checked={heatStages[index]} onChange={() => setHeatStages(produce(heatStages => {heatStages[index] = !heatStages[index]}))}/>
                                        )}
                                    </div>
                                    <br/>
                                    <div>
                                        <p>Cables Included</p>
                                        <Form.Check type={"radio"} checked={heatCableType === 0} onChange={() => setHeatCableType(0)} label={"AC Only"}/>
                                        <Form.Check type={"radio"} checked={heatCableType === 1} onChange={() => setHeatCableType(1)} label={"DC Only"}/>
                                        <Form.Check type={"radio"} checked={heatCableType === 2} onChange={() => setHeatCableType(2)} label={"Both"}/>
                                    </div>
                                    <br/>
                                    <div>
                                        <p>Heat Type</p>
                                        <Form.Check type={"radio"} checked={heatType === 0} onChange={() => setHeatType(0)} label={"Passive Load"}/>
                                        <Form.Check type={"radio"} checked={heatType === 1} onChange={() => setHeatType(1)} label={"Active Load"}/>
                                        <Form.Check type={"radio"} checked={heatType === 2} onChange={() => setHeatType(2)} label={"Combined Loads"}/>
                                    </div>
                                </>   
                            }
                            {
                                chartMode === 1 &&
                                <>
                                    <div>
                                        <p>Contribution From Stages</p>
                                        {/* This might need to be dynamic*/}
                                        {props.fridge.stages.map((stage, index) => 
                                            <Form.Check type={"checkbox"} key={index} checked={noiseStages[index]} onChange={() => setNoiseStages(produce(noiseStages => {noiseStages[index] = !noiseStages[index]}))}  label={stage.name}/>
                                            )}
                                        <Form.Check type={"checkbox"} checked={noiseStages[5]} onChange={() => setNoiseStages(produce(noiseStages => {noiseStages[5] = !noiseStages[5]}))} label="All (RT)"/>
                                    </div>
                                    <br/>
                                    <div>
                                        <p>Noise Type</p>
                                        <Form.Check type={"radio"} checked={noiseType === 0} onChange={() => setNoiseType(0)} label={"Noise Photons"}/>
                                        <Form.Check type={"radio"} checked={noiseType === 1} onChange={() => setNoiseType(1)} label={"Noise Voltage"}/>
                                        <Form.Check type={"radio"} checked={noiseType === 2} onChange={() => setNoiseType(2)} label={"Noise Current"}/>
                                    </div>
                                </>
                            } 
                            <div style={{flex:1}}/>  
                        <div>
                    </div> 
                </div>

                    </div>
                </Form>
                { chartMode === 0 &&
                <div>
                    <ResponsiveContainer height="50%">
                        <BarChart data={heatLoadArray.map((hl, index)  => {return({name: hl, index: index})}).filter((hl, index) => heatStages[index])}>
                            {heatLoads.map((heatLoad, index) => (
                                <>
                                    {heatCableType === 0 && heatType !== 1 && <Bar name={`Passive AC Loads (${heatLoad.name})`} stackId="A" dataKey={heatLoad => heatLoads[index].passiveACLoads[heatLoad.index]} fill="#5555ff"/> }
                                    {heatCableType === 1 && heatType !== 1 && <Bar name={`Passive DC Loads (${heatLoad.name})`} stackId="A" dataKey={heatLoad => heatLoads[index].passiveDCLoads[heatLoad.index]} fill="#5555ff"/> }
                                    {heatCableType === 2 && heatType !== 1 && <Bar name={`Passive Loads (${heatLoad.name})`} stackId="A" dataKey={heatLoad => heatLoads[index].passiveLoads[heatLoad.index]} fill="#5555ff"/> }
                                    {heatCableType !== 1 && heatType !== 0 && <Bar name={`Active AC Loads (${heatLoad.name})`} stackId="A" dataKey={heatLoad => heatLoads[index].activeACLoads[heatLoad.index]} fill="#ff5555"/> }
                                    {heatCableType !== 0 && heatType !== 0 && <Bar name={`Active DC Loads (${heatLoad.name})`} stackId="A" dataKey={heatLoad => heatLoads[index].activeDCLoads[heatLoad.index]} fill="#55ff55"/> }
                                </>)
                            )}
                            <YAxis label={{value: 'Heat Load (K)', position: 'insideLeft', angle: -90,}} />
                            <XAxis dataKey="name" />
                            <Tooltip cursor={{fill: "#77777733"}}/>
                            <Legend/>
                        </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer height="50%">
                        <BarChart data={heatLoadArray.map((hl, index)  => {return({name: hl, index: index})}).filter((hl, index) => heatStages[index])}>
                            {heatLoads.map((heatLoad, index) => (
                                <>
                                    {heatCableType === 0 && heatType !== 1 && <Bar name={`Passive AC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].passiveACLoads[heatLoad.index]} fill="#5555ff"/> }
                                    {heatCableType === 1 && heatType !== 1 && <Bar name={`Passive DC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].passiveDCLoads[heatLoad.index]} fill="#5555ff"/> }
                                    {heatCableType === 2 && heatType !== 1 && <Bar name={`Passive Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].passiveLoads[heatLoad.index]} fill="#5555ff"/> }
                                    {heatCableType !== 1 && heatType !== 0 && <Bar name={`Active AC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].activeACLoads[heatLoad.index]} fill="#ff5555"/> }
                                    {heatCableType !== 0 && heatType !== 0 && <Bar name={`Active DC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].activeDCLoads[heatLoad.index]} fill="#55ff55"/> }
                                    {<Bar name={`Sum (${heatLoad.name})`} dataKey={heatLoad => {
                                        let sum = 0
                                        if(heatCableType === 0 && heatType !== 1) sum += heatLoads[index].passiveACLoads[heatLoad.index]
                                        if(heatCableType === 1 && heatType !== 1) sum += heatLoads[index].passiveDCLoads[heatLoad.index]
                                        if(heatCableType === 2 && heatType !== 1) sum += heatLoads[index].passiveLoads[heatLoad.index]
                                        if(heatCableType !== 1 && heatType !== 0) sum += heatLoads[index].activeACLoads[heatLoad.index]
                                        if(heatCableType !== 0 && heatType !== 0) sum += heatLoads[index].activeDCLoads[heatLoad.index]
                                        return sum
                                    }
                                    } fill="#000000"/> }
                                </>)
                            )}
                            <YAxis scale="sqrt" label={{value: 'Heat Load (K)', position: 'insideLeft', angle: -90,}}/>
                            <XAxis dataKey="name" />
                            <Tooltip cursor={{fill: "#77777733"}}/>
                            <Legend/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                }
                { chartMode === 1 &&
                <div>
                    <ResponsiveContainer height="50%">
                        <BarChart data={noiseLoadArray.map((hl, index)  => {return({name: hl, index: index})}).filter((hl, index) => noiseStages[index])}>
                            {heatLoads.map((heatLoad, index) => (
                                <>
                                    {noiseType === 0 && <Bar name={`Passive AC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].noisePhotons[heatLoad.index]} fill="#5555ff"/> }
                                    {noiseType === 1 && <Bar name={`Passive DC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].noiseVoltage[heatLoad.index]} fill="#5555ff"/> }
                                    {noiseType === 2 && <Bar name={`Passive Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].noiseCurrent[heatLoad.index]} fill="#5555ff"/> }
                                </>)
                            )}
                            <XAxis dataKey="name"/>
                            <YAxis label={{value: 'Noise (dBA)', position: 'insideLeft', angle: -90,}} />
                            <Tooltip cursor={{fill: "#77777733"}}/>
                            <Legend/>
                        </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer height="50%">
                        <BarChart data={noiseLoadArray.map((hl, index)  => {return({name: hl, index: index})}).filter((hl, index) => noiseStages[index])}>
                            {heatLoads.map((heatLoad, index) => (
                                <>
                                    {noiseType === 0 && <Bar name={`Passive AC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].noisePhotons[heatLoad.index]} fill="#5555ff"/> }
                                    {noiseType === 1 && <Bar name={`Passive DC Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].noiseVoltage[heatLoad.index]} fill="#5555ff"/> }
                                    {noiseType === 2 && <Bar name={`Passive Loads (${heatLoad.name})`} dataKey={heatLoad => heatLoads[index].noiseCurrent[heatLoad.index]} fill="#5555ff"/> }
                                </>)
                            )}
                            <YAxis scale="sqrt" label={{value: 'Noise (dBA)', position: 'insideLeft', angle: -90,}} />
                            <XAxis dataKey="name" />
                            <Tooltip cursor={{fill: "#77777733"}}/>
                            <Legend/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                }
            </div>
        </>
    )
}

const styles = {
    rowDiv: {
        display: "flex",
        flex: 1,
        height: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap"
    },
    colDiv: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        justifyContent: "space-between",
        textAlign: "center",
    },
    buttonGrid: {
        display: "grid", 
        grid: "auto / 1fr 1fr 1fr 1fr", 
        margin: "0.5em",
        width: "auto",
        gridGap: "0.5em"
    }
}

export default StaticPlotting
