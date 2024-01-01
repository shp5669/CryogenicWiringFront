import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import { useState, useEffect } from 'react'
import { fridge100QStages, fridgeUTSStages, fridgeNoPresetStages } from '../../model/stage'
import {fridgeConstructor} from '../../model/fridge'
import { stageConstructor } from '../../model/stage'
import {produce} from 'immer'

import {loadPyodide} from 'pyodide'

function FridgeSelect(props) {
    const [presets, setPresets] = useState(localStorage.getItem('fridgeConfigs') ? JSON.parse(localStorage.getItem('fridgeConfigs')) : {presets : []})
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState("")

    useEffect(() => { //Checks if the user has added any saved fridges
        setPresets(localStorage.getItem('fridgeConfigs') ? JSON.parse(localStorage.getItem('fridgeConfigs')) : {presets : []})
    }, [props.tab])

    useEffect(() => {
        localStorage.setItem('fridgeConfigs', JSON.stringify(presets))
    }, [presets])

    //Loads Pyodide
    useEffect(() => {
        if(!props.pyodide) initPyodide(props.setPyodide, setLoading, setLoadingText)
    }, [props.pyodide, props.setPyodide])

    return(
        //props.setFridge
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%"}}> 
            <h2>Cryogenic Wiring Simulation</h2>
            <div style={{display: "grid", gridTemplateColumns: "auto", gridGap: "0.2em"}}>
                <Button variant="secondary" disabled style={{flex: 1}}>Website Guide</Button>
                <Button variant="secondary" disabled style={{flex: 1}}>API Guide</Button>
                <p style={{margin: "auto"}}>Select a stage configuration to proceed</p>
                <Button onClick={() => {props.setFridge(fridgeConstructor(fridgeNoPresetStages, [])); props.setPresetStages(fridgeNoPresetStages); props.setTab("fridgeConfiguration"); props.setFridgeSelected(true)}}>Blank Configuration</Button>
                <Button onClick={() => {props.setFridge(fridgeConstructor(fridgeUTSStages, [])); props.setPresetStages(fridgeUTSStages); props.setTab("fridgeConfiguration"); props.setFridgeSelected(true)}}>UTS Fridge Configuration</Button>
                <Button onClick={() => {props.setFridge(fridgeConstructor(fridge100QStages, [])); props.setPresetStages(fridge100QStages); props.setTab("fridgeConfiguration"); props.setFridgeSelected(true)}}>100Q Fridge Configuration</Button>
                <Dropdown style={{flex: 1, display: "flex"}}  drop={"end"}>
                    <Dropdown.Toggle disabled={presets.presets.length === 0} style={{flex: 1}} variant="success" id="preset-dropdown">
                        Use Saved Configuration
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{maxHeight: "50vh", overflowY: "scroll"}}> 
                        {presets.presets.map((config, index) => 
                            <div key={config.name} style={{display: "flex", flexDirection: "row"}}>
                                <Dropdown.Item onClick={() => {
                                    let stages = config.stages.map((stage) => stageConstructor(stage[0], stage[1], stage[2], stage[3]))
                                    props.setPresetStages(stages)
                                    props.setFridge(fridgeConstructor(stages, [])); 
                                    props.setTab("fridgeConfiguration"); 
                                    props.setFridgeSelected(true)
                                }}>
                                    {config.name}
                                </Dropdown.Item>
                                <Button variant="danger" onClick={() => {
                                    setPresets(produce(presets => {
                                        presets.presets.splice(index, 1)
                                    }))                          
                                }}>
                                    🗑
                                </Button>
                            </div>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
                <p style={{margin: "auto"}}>Alternatively, select a stage and wiring configuration</p>
                <Button disabled style={{flex: 1}}>Load From JSON</Button>
                <Button disabled variant="success" style={{flex: 1}}>Load Saved Fridge</Button>
                { loading && !props.pyodide && <p>{loadingText}</p> }
            </div>
        </div>
    )
}

async function initPyodide(setPyodide, setLoading, setLoadingText) {
    setLoadingText("(Loading Pyodide)")
    setLoading(true)
    let pyodide = await loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/"}).catch(err => console.log(err))
    setLoadingText("(Loading Numpy Package)")
    await pyodide.loadPackage('numpy')
    setLoadingText("(Loading Pandas Package)")
    await pyodide.loadPackage('pandas')
    setLoadingText("(Loading JSON Package)")
    pyodide.runPython("import json")
    setLoadingText("(Initialisation Code)")
    await pyodide.loadPackage(process.env.PUBLIC_URL + 'Cryo_UTS-0.1-py3-none-any.whl')
    pyodide.runPython(`from Cryo_UTS import (json_to_function)`)
    
    setLoading(false)
    setPyodide(pyodide)
}

const styles = {
    middleRowDiv: {
        display: "flex",
        flexDirection: "row",
        width: "30%",
        padding: "0.2em"
    },
}

export default FridgeSelect
