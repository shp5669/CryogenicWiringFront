import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import {useState, useEffect} from "react"
import Modal from "react-bootstrap/Modal"
import {produce} from "immer"

function FridgeConfig(props) { 
    const [resetInputs, setResetInputs] = useState(false)
    const [customName, setCustomName] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [incorrect, setIncorrect] = useState(true)

    //Blocks progression if the configuration is incorrect
    useEffect(() => {
        let correct = true;
        for(let i in props.fridge.stages) {
            if(props.fridge.stages[i].name === "") correct = false
            else if(props.fridge.stages[i].maxTemp === "") correct = false
            else if(props.fridge.stages[i].powerBudget === "") correct = false
            else if(props.fridge.stages[i].lengthFromPrev === "") correct = false
        }
        setIncorrect(!correct)
    }, [props.fridge])

    return(
        <>
        <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>Save Configuration</Modal.Header>
            <Modal.Body>
                <Form.Control type="text" placeholder="Custom Preset Name" value={customName} onChange={event => setCustomName(event.target.value)}/>
                <Button variant="success" style={{width: "100%"}} onClick={() => {
                    let configs = JSON.parse(localStorage.getItem('fridgeConfigs')) ?? {presets : []}
                    
                    let preset = {
                        name: customName,
                        stages: props.fridge.stages.map(stage => {
                            return [stage.name, stage.maxTemp, stage.lengthFromPrev, stage.powerBudget]
                        })
                    }

                    for(let i in configs.presets) {
                        if(configs.presets[i].name === preset.name) {
                            configs.presets.splice(i, 1)
                        }
                    }

                    configs.presets.push(preset)
                    localStorage.setItem('fridgeConfigs', JSON.stringify(configs))
                    setShowModal(false)
                }}>
                    Save As Custom Preset
                </Button>
            </Modal.Body>
        </Modal>
        <Form style={{width: "100%", height: "100%"}}>
            <div style={styles.colDiv}>
                    <div style={{display: "grid", grid: "auto / auto max-content"}}>
                        <Button variant="success" onClick={() => {setShowModal(true)}}>
                            Save As Custom Preset
                        </Button>
                    </div>
                    <br/>
                    {/*The max temp is used as the key (keys are supposed to be unique for each instance). React doesn't like it when the user enters the same max temperature in multiple stages, but presumably, neither does the quantum computer.*/}
                    <div style={styles.headerRowDiv}>
                        <p style={{flex:1}}>Stage Name</p>
                        <p style={{flex:1}}>Maximum Temperature (K)</p>
                        <p style={{flex:1}}>Length From Previous Stage (m)</p>
                        <p style={{flex:1}}>Power Budget (W)</p>
                    </div>
                    {props.fridge.stages.map((stage, index) => {return (
                        <MatrixItem key={index + " " + resetInputs} index={index} fridge={props.fridge} setFridge={props.setFridge}/>
                    )})}      
                    <div style={{flex: 1}}></div>
                    <div style={{display: "grid", gridGap: "0.2em"}}>
                        <Button variant="danger" onClick={() => {props.setFridge(produce(fridge => {fridge.stages = props.presetStages})); setResetInputs(!resetInputs)}}>
                            Revert To Preset
                        </Button>
                        <Button disabled={incorrect} onClick={() => {    
                            props.setFridgeConfigured(true)
                            props.setTab("wiringConfiguration")
                        }}>
                            {incorrect ? "Matrix Incorrectly Configured" : "Confirm Changes"}
                        </Button>
                    </div>
            </div>
        </Form>
        </>
    )
}

function MatrixItem(props) {
    return(
        <div style={{display: "flex", flexDirection: "row"}}> {/* event.target.value */}
            <Form.Control type="text" placeholder="Stage Name" value={props.fridge.stages[props.index].name} onChange={(event) => {
                props.setFridge(produce(fridge => {
                    fridge.stages[props.index].name = event.target.value
                }))
            }}/>
            <Form.Control type="number" placeholder="Max Temp (K)" value={props.fridge.stages[props.index].maxTemp} onChange={(event) => {
                props.setFridge(produce(fridge => {
                    fridge.stages[props.index].maxTemp = event.target.value
                }))
            }}/>
            <Form.Control type="number" placeholder="Length From Previous Stage" value={props.fridge.stages[props.index].lengthFromPrev} onChange={(event) => {
                props.setFridge(produce(fridge => {
                    fridge.stages[props.index].lengthFromPrev = event.target.value
                }))
            }}/>
            <Form.Control type="number" placeholder="Power Budget" value={props.fridge.stages[props.index].powerBudget} onChange={(event) => {
                props.setFridge(produce(fridge => {
                    fridge.stages[props.index].powerBudget = event.target.value
                }))
            }}/>
        </div>
    )
}

const styles = {
    middleRowDiv: {
        display: "flex",
        flexDirection: "row",
        width: "30%",
        padding: "0.2em"
    },
    headerRowDiv: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        flexWrap: "wrap"
    },
    colDiv: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        justifyContent: "space-between",
        textAlign: "center",
        padding: "0.5em"
    },
}

export default FridgeConfig;